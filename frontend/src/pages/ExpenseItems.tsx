import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { DataTable } from '../components/DataTable';
import { EntityForm } from '../components/EntityForm';
import type { ExpenseItem, Column } from '../types';
import styles from './ExpenseItems.module.scss';

export function ExpenseItems() {
    const [data, setData] = useState<ExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
    const hasFetched = useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result: ExpenseItem[] = await apiFetch('/api/expense-items');
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
        if (!confirm('Удалить статью расходов?')) return;
        await apiFetch(`/api/expense-items/${id}`, { method: 'DELETE' });
        fetchData().then();
    };

    const handleSave = async (newData: Partial<ExpenseItem>) => {
        if (editingItem) {
            await apiFetch(`/api/expense-items/${editingItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            await apiFetch('/api/expense-items', {
                method: 'POST',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        }
        setShowForm(false);
        setEditingItem(null);
        fetchData().then();
    };

    const handleEdit = (item: ExpenseItem) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const columns: Column<ExpenseItem>[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Название' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Статьи расходов</h2>
                <button
                    className={styles.addBtn}
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    Добавить статью
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
                <EntityForm<ExpenseItem>
                    title={editingItem ? "Редактировать статью" : "Добавить статью"}
                    fields={[
                        { name: 'name', label: 'Название', type: 'text', hint: 'string' }
                    ]}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                    initialData={editingItem || undefined}
                />
            )}
        </div>
    );
}
