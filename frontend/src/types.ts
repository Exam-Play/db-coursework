export interface Warehouse {
    id: number;
    name: string;
    quantity: number;
    amount: number;
}

export interface ExpenseItem {
    id: number;
    name: string;
}

export interface Sale {
    id: number;
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    amount: number;
    sale_date: string;
}

export interface Charge {
    id: number;
    expense_item_id: number;
    expense_item_name: string;
    amount: number;
    charge_date: string;
}

export interface Column<T> {
    key: keyof T;
    label: string;
}
