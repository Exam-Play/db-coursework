from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    role: str
    username: str

# Warehouses
class WarehouseCreate(BaseModel):
    name: str
    quantity: int
    amount: int

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    amount: Optional[int] = None

class WarehouseOut(BaseModel):
    id: int
    name: str
    quantity: int
    amount: int
    class Config: from_attributes = True

# ExpenseItems
class ExpenseItemCreate(BaseModel):
    name: str

class ExpenseItemUpdate(BaseModel):
    name: Optional[str] = None

class ExpenseItemOut(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

# Sales
class SaleCreate(BaseModel):
    warehouse_id: int
    quantity: int
    amount: int
    sale_date: datetime

class SaleUpdate(BaseModel):
    warehouse_id: Optional[int] = None
    quantity: Optional[int] = None
    amount: Optional[int] = None
    sale_date: Optional[datetime] = None

class SaleOut(BaseModel):
    id: int
    warehouse_id: int
    warehouse_name: str
    quantity: int
    amount: int
    sale_date: datetime
    class Config: from_attributes = True

# Charges
class ChargeCreate(BaseModel):
    expense_item_id: int
    amount: int
    charge_date: datetime

class ChargeUpdate(BaseModel):
    expense_item_id: Optional[int] = None
    amount: Optional[int] = None
    charge_date: Optional[datetime] = None

class ChargeOut(BaseModel):
    id: int
    expense_item_id: int
    expense_item_name: str
    amount: int
    charge_date: datetime
    class Config: from_attributes = True

# Reports
class IncomeExpenseResponse(BaseModel):
    income: int
    expense: int

class ForecastResponse(BaseModel):
    forecast_profit: float

class TopProductResponse(BaseModel):
    name: str
    total_profit: float
    class Config: from_attributes = True

# Users
class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        from_attributes = True