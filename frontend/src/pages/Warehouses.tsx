import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { DataTable } from '../components/DataTable';
import { EntityForm } from '../components/EntityForm';
import type { Warehouse, Column } from '../types';
import styles from './Warehouses.module.scss';

export function Warehouses() {
    const [data, setData] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Warehouse | null>(null);
    const hasFetched = useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result: Warehouse[] = await apiFetch('/api/warehouses');
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
        if (!confirm('Удалить товар?')) return;
        await apiFetch(`/api/warehouses/${id}`, { method: 'DELETE' });
        fetchData().then();
    };

    const handleSave = async (newData: Partial<Warehouse>) => {
        if (editingItem) {
            await apiFetch(`/api/warehouses/${editingItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            await apiFetch('/api/warehouses', {
                method: 'POST',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        }
        setShowForm(false);
        setEditingItem(null);
        fetchData().then();
    };

    const handleEdit = (item: Warehouse) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const columns: Column<Warehouse>[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Название' },
        { key: 'quantity', label: 'Количество' },
        { key: 'amount', label: 'Цена' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Товары</h2>
                <button
                    className={styles.addBtn}
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    Добавить товар
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
                <EntityForm<Warehouse>
                    title={editingItem ? "Редактировать товар" : "Добавить товар"}
                    fields={[
                        { name: 'name', label: 'Название', type: 'text', hint: 'string' },
                        { name: 'quantity', label: 'Количество', type: 'number', hint: 'integer' },
                        { name: 'amount', label: 'Цена', type: 'number', hint: 'integer' }
                    ]}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                    initialData={editingItem || undefined}
                />
            )}
        </div>
    );
}
