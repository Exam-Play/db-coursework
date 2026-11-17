import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    get_current_user,
    require_admin,
    verify_password,
)
from database.db import get_db
from database.models import Charge, ExpenseItem, Sale, User, Warehouse
import schemas

app = FastAPI(title="Магазин — учебная БД (курсовая)")

_frontend_urls_raw = os.environ.get("FRONTEND_URLS", "")
_allowed_origins = ["http://localhost:3000", "http://localhost:5173"]
_allowed_origins.extend(u.strip() for u in _frontend_urls_raw.split(",") if u.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================== AUTH ===========================

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=body.username).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неправильный логин или пароль")

    token = create_access_token(username=user.username, role=user.role.value)
    return schemas.TokenResponse(access_token=token, role=user.role.value, username=user.username)


@app.get("/auth/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role.value}


# ===================== СПРАВОЧНИКИ: Товары (warehouses) =====================

@app.get("/api/warehouses", response_model=list[schemas.WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Warehouse).order_by(Warehouse.id).all()


@app.post("/api/warehouses", response_model=schemas.WarehouseOut)
def create_warehouse(body: schemas.WarehouseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = Warehouse(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.put("/api/warehouses/{item_id}", response_model=schemas.WarehouseOut)
def update_warehouse(item_id: int, body: schemas.WarehouseUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(Warehouse).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/warehouses/{item_id}")
def delete_warehouse(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(Warehouse).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    db.delete(item)
    db.commit()
    return {"success": True}


# ================= СПРАВОЧНИКИ: Статьи расходов (expense_items) =================

@app.get("/api/expense-items", response_model=list[schemas.ExpenseItemOut])
def list_expense_items(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(ExpenseItem).order_by(ExpenseItem.id).all()


@app.post("/api/expense-items", response_model=schemas.ExpenseItemOut)
def create_expense_item(body: schemas.ExpenseItemCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = ExpenseItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/expense-items/{item_id}")
def delete_expense_item(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(ExpenseItem).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Статья расхода не найдена")
    db.delete(item)
    db.commit()
    return {"success": True}


# ========================= ЖУРНАЛ: Продажи (sales) =========================

@app.get("/api/sales", response_model=list[schemas.SaleOut])
def list_sales(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Sale).order_by(Sale.sale_date.desc()).all()


@app.post("/api/sales", response_model=schemas.SaleOut)
def create_sale(body: schemas.SaleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = Sale(**body.model_dump())
    db.add(item)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Операция отклонена БД: {e}")
    db.refresh(item)
    return item


@app.put("/api/sales/{item_id}", response_model=schemas.SaleOut)
def update_sale(item_id: int, body: schemas.SaleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(Sale).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Продажа не найдена")
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Операция отклонена БД: {e}")
    db.refresh(item)
    return item


@app.delete("/api/sales/{item_id}")
def delete_sale(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(Sale).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Продажа не найдена")
    db.delete(item)
    db.commit()
    return {"success": True}


# ========================= ЖУРНАЛ: Расходы (charges) =========================

@app.get("/api/charges", response_model=list[schemas.ChargeOut])
def list_charges(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Charge).order_by(Charge.charge_date.desc()).all()


@app.post("/api/charges", response_model=schemas.ChargeOut)
def create_charge(body: schemas.ChargeCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = Charge(**body.model_dump())
    db.add(item)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Операция отклонена БД: {e}")
    db.refresh(item)
    return item


@app.delete("/api/charges/{item_id}")
def delete_charge(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(Charge).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Расход не найден")
    try:
        db.delete(item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Операция отклонена БД: {e}")
    return {"success": True}


# ============================== ОТЧЁТЫ ==============================

@app.get("/api/reports/income-expense", response_model=schemas.IncomeExpenseResponse)
def report_income_expense(date_from: date, date_to: date, db: Session = Depends(get_db), _=Depends(get_current_user)):
    try:
        result = db.execute(
            text("SELECT * FROM income_expense(:d1, :d2)"),
            {"d1": date_from, "d2": date_to}
        ).first()
        if not result:
            return schemas.IncomeExpenseResponse(income=0, expense=0)
        return schemas.IncomeExpenseResponse(income=result[0] or 0, expense=result[1] or 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка БД: {e}")

@app.get("/api/reports/forecast", response_model=schemas.ForecastResponse)
def report_forecast(db: Session = Depends(get_db), _=Depends(get_current_user)):
    try:
        result = db.execute(text("SELECT * FROM forecast_profit()")).scalar()
        return schemas.ForecastResponse(forecast_profit=result or 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка БД: {e}")

@app.get("/api/reports/product-info/{product_id}", response_model=schemas.ProductInfoResponse)
def report_product_info(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    try:
        result = db.execute(
            text("SELECT get_product_info(:id)"),
            {"id": product_id}
        ).scalar()
        if not result:
            raise HTTPException(status_code=404, detail="Товар не найден")
        return schemas.ProductInfoResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка БД: {e}")

