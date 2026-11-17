import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    CheckConstraint
)
from sqlalchemy.orm import relationship

from database.db import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'user')", name="ck_users_role"),
    )

    id = Column(Integer, primary_key=True)
    username = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(60), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.USER.value)

class Warehouse(Base):
    __tablename__ = "warehouses"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_warehouses_quantity_nonneg"),
        CheckConstraint("amount >= 0", name="ck_warehouses_amount_nonneg"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    amount = Column(Integer, nullable=False)

    sales = relationship("Sale", back_populates="warehouse")

class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id = Column(Integer, primary_key=True)
    name = Column(String(20), unique=True, nullable=False)

    charges = relationship("Charge", back_populates="expense_item")

class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_sales_quantity_pos"),
        CheckConstraint("amount >= 0", name="ck_sales_amount_nonneg"),
    )

    id = Column(Integer, primary_key=True)
    amount = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    sale_date = Column(DateTime, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)

    warehouse = relationship("Warehouse", back_populates="sales")


class Charge(Base):
    __tablename__ = "charges"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_charges_amount_nonneg"),
    )

    id = Column(Integer, primary_key=True)
    amount = Column(Integer, nullable=False)
    charge_date = Column(DateTime, nullable=False)
    expense_item_id = Column(Integer, ForeignKey("expense_items.id", ondelete="CASCADE"), nullable=False)

    expense_item = relationship("ExpenseItem", back_populates="charges")