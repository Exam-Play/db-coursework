from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str



class WarehouseBase(BaseModel):
    name: str
    quantity: int = Field(ge=0)
    amount: Decimal = Field(ge=0)

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(WarehouseBase):
    pass

class WarehouseOut(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int




class ExpenseItemBase(BaseModel):
    name: str

class ExpenseItemCreate(ExpenseItemBase):
    pass

class ExpenseItemOut(ExpenseItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int




class SaleBase(BaseModel):
    warehouse_id: int
    sale_date: date
    quantity: int = Field(gt=0)
    amount: Decimal = Field(ge=0)

class SaleCreate(SaleBase):
    pass

class SaleOut(SaleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int




class ChargeBase(BaseModel):
    expense_item_id: int
    charge_date: date
    amount: Decimal = Field(ge=0)

class ChargeCreate(ChargeBase):
    pass

class ChargeOut(ChargeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int




class IncomeExpenseResponse(BaseModel):
    income: Decimal
    expense: Decimal

class ForecastResponse(BaseModel):
    forecast_profit: Decimal

class ProductInfoResponse(BaseModel):
    product_id: int
    product_name: str
    current_quantity: int
    total_sales_amount: Decimal
