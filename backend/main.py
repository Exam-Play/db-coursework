import os
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime, date
from auth import (
    create_access_token,
    get_current_user,
    require_admin,
    verify_password,
    hash_password,
)
from database.db import get_db
from database.models import Charge, ExpenseItem, Sale, User, Warehouse
import schemas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

    role_str = user.role.value if hasattr(user.role, 'value') else user.role
    token = create_access_token(username=user.username, role=role_str)
    return schemas.TokenResponse(access_token=token, role=role_str, username=user.username)

@app.get("/auth/me")
def read_me(current_user: User = Depends(get_current_user)):
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    return {"username": current_user.username, "role": role_str}

# ============================== ПОЛЬЗОВАТЕЛИ ==============================

@app.get("/api/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).order_by(User.id).all()

@app.post("/api/users", response_model=schemas.UserOut)
def create_user(body: schemas.UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    hashed = hash_password(body.password)
    user = User(username=body.username, password_hash=hashed, role=body.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.put("/api/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, body: schemas.UserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if body.username: user.username = body.username
    if body.role: user.role = body.role
    if body.password:
        user.password_hash = hash_password(body.password)
    
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    db.delete(user)
    db.commit()
    return {"success": True}

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
        if value is not None:
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

@app.put("/api/expense-items/{item_id}", response_model=schemas.ExpenseItemOut)
def update_expense_item(item_id: int, body: schemas.ExpenseItemUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(ExpenseItem).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Статья расходов не найдена")
    if body.name:
        item.name = body.name
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/expense-items/{item_id}")
def delete_expense_item(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(ExpenseItem).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Статья расходов не найдена")
    db.delete(item)
    db.commit()
    return {"success": True}

# ========================== ЖУРНАЛЫ: Продажи (sales) =========================

@app.get("/api/sales", response_model=list[schemas.SaleOut])
def list_sales(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.execute(text("""
        SELECT s.id, s.warehouse_id, w.name as warehouse_name, s.quantity, s.amount, s.sale_date 
        FROM sales s 
        JOIN warehouses w ON s.warehouse_id = w.id
        ORDER BY s.id
    """)).mappings().all()

@app.post("/api/sales", response_model=schemas.SaleOut)
def create_sale(body: schemas.SaleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if body.sale_date > datetime.now():
        raise HTTPException(status_code=400, detail="Дата продажи не может быть из будущего")
    item = Sale(**body.model_dump())
    db.add(item)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Операция отклонена БД: {e}")
    db.refresh(item)
    return schemas.SaleOut(
        id=item.id,
        warehouse_id=item.warehouse_id,
        warehouse_name=item.warehouse.name,
        quantity=item.quantity,
        amount=item.amount,
        sale_date=item.sale_date
    )

@app.put("/api/sales/{item_id}", response_model=schemas.SaleOut)
def update_sale(item_id: int, body: schemas.SaleUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if body.sale_date and body.sale_date > datetime.now():
        raise HTTPException(status_code=400, detail="Дата продажи не может быть из будущего")
    item = db.query(Sale).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Продажа не найдена")
    for field, value in body.model_dump().items():
        if value is not None:
            setattr(item, field, value)
    db.commit()
    db.refresh(item)
    db.refresh(item, ["warehouse"])
    return schemas.SaleOut(
        id=item.id,
        warehouse_id=item.warehouse_id,
        warehouse_name=item.warehouse.name,
        quantity=item.quantity,
        amount=item.amount,
        sale_date=item.sale_date
    )

@app.delete("/api/sales/{item_id}")
def delete_sale(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    item = db.query(Sale).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Продажа не найдена")
    try:
        db.delete(item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Нельзя удалить: {e}")
    return {"success": True}

# ========================== ЖУРНАЛЫ: Расходы (charges) =========================

@app.get("/api/charges", response_model=list[schemas.ChargeOut])
def list_charges(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.execute(text("""
        SELECT c.id, c.expense_item_id, ei.name as expense_item_name, c.amount, c.charge_date 
        FROM charges c 
        JOIN expense_items ei ON c.expense_item_id = ei.id
        ORDER BY c.id
    """)).mappings().all()

@app.post("/api/charges", response_model=schemas.ChargeOut)
def create_charge(body: schemas.ChargeCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if body.charge_date > datetime.now():
        raise HTTPException(status_code=400, detail="Дата расхода не может быть из будущего")
    item = Charge(**body.model_dump())
    db.add(item)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Операция отклонена БД: {e}")
    db.refresh(item)
    return schemas.ChargeOut(
        id=item.id,
        expense_item_id=item.expense_item_id,
        expense_item_name=item.expense_item.name,
        amount=item.amount,
        charge_date=item.charge_date
    )

@app.put("/api/charges/{item_id}", response_model=schemas.ChargeOut)
def update_charge(item_id: int, body: schemas.ChargeUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if body.charge_date and body.charge_date > datetime.now():
        raise HTTPException(status_code=400, detail="Дата расхода не может быть из будущего")
    item = db.query(Charge).get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Расход не найден")
    for field, value in body.model_dump().items():
        if value is not None:
            setattr(item, field, value)
    db.commit()
    db.refresh(item)
    db.refresh(item, ["expense_item"])
    return schemas.ChargeOut(
        id=item.id,
        expense_item_id=item.expense_item_id,
        expense_item_name=item.expense_item.name,
        amount=item.amount,
        charge_date=item.charge_date
    )

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
        raise HTTPException(status_code=400, detail=f"Нельзя удалить: {e}")
    return {"success": True}

# ============================== ОТЧЁТЫ ==============================

@app.get("/api/reports/income-expense", response_model=schemas.IncomeExpenseResponse)
def report_income_expense(date_from: date, date_to: date, db: Session = Depends(get_db), _=Depends(get_current_user)):
    try:
        result = db.execute(
            text("CALL income_expense(:d1, :d2, NULL, NULL)"),
            {"d1": date_from, "d2": date_to}
        ).fetchone()

        if not result:
            return schemas.IncomeExpenseResponse(income=0, expense=0)
        return schemas.IncomeExpenseResponse(income=result[0] or 0, expense=result[1] or 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка БД: {str(e)}")

@app.get("/api/reports/top-products", response_model=list[schemas.TopProductResponse])
def report_top_products(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.execute(text("SELECT * FROM v_top_profitable_products LIMIT 5")).mappings().all()
