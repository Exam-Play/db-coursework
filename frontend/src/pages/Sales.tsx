import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { DataTable } from '../components/DataTable';
import { EntityForm } from '../components/EntityForm';
import type { Sale, Column } from '../types';
import styles from './Sales.module.scss';

export function Sales() {
    const [data, setData] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Sale | null>(null);
    const hasFetched = useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result: Sale[] = await apiFetch('/api/sales');
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current) {
            fetchData().then();
            hasFetched.current = true;
        }
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить продажу?')) return;
        await apiFetch(`/api/sales/${id}`, { method: 'DELETE' });
        fetchData().then();
    };

    const handleSave = async (newData: Partial<Sale>) => {
        if (editingItem) {
            await apiFetch(`/api/sales/${editingItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            await apiFetch('/api/sales', {
                method: 'POST',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        }
        setShowForm(false);
        setEditingItem(null);
        fetchData().then();
    };

    const handleEdit = (item: Sale) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const columns: Column<Sale>[] = [
        { key: 'id', label: 'ID' },
        { key: 'warehouse_id', label: 'ID Товара' },
        { key: 'quantity', label: 'Количество' },
        { key: 'amount', label: 'Сумма' },
        { key: 'sale_date', label: 'Дата продажи' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Продажи</h2>
                <button
                    className={styles.addBtn}
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    Добавить продажу
                </button>
            </div>

            <DataTable 
                data={data} 
                columns={columns} 
                onDelete={handleDelete} 
                onEdit={handleEdit} 
                loading={loading}
            />
            
            {showForm && (
                <EntityForm<Sale>
                    title={editingItem ? "Редактировать продажу" : "Добавить продажу"}
                    fields={[
                        { name: 'warehouse_id', label: 'ID Товара', type: 'number', hint: 'integer' },
                        { name: 'quantity', label: 'Количество', type: 'number', hint: 'integer' },
                        { name: 'amount', label: 'Сумма', type: 'number', hint: 'integer' },
                        { name: 'sale_date', label: 'Дата продажи', type: 'datetime-local', hint: 'YYYY-MM-DDThh:mm' }
                    ]}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                    initialData={editingItem || undefined}
                />
            )}
        </div>
    );
}
