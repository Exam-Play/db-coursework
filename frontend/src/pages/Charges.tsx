import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { DataTable } from '../components/DataTable';
import { EntityForm } from '../components/EntityForm';
import type { Charge, Column } from '../types';
import styles from './Charges.module.scss';

export function Charges() {
    const [data, setData] = useState<Charge[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Charge | null>(null);
    const hasFetched = useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result: Charge[] = await apiFetch('/api/charges');
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
        if (!confirm('Удалить расход?')) return;
        await apiFetch(`/api/charges/${id}`, { method: 'DELETE' });
        fetchData().then();
    };

    const handleSave = async (newData: Partial<Charge>) => {
        if (editingItem) {
            await apiFetch(`/api/charges/${editingItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            await apiFetch('/api/charges', {
                method: 'POST',
                body: JSON.stringify(newData),
                headers: { 'Content-Type': 'application/json' }
            });
        }
        setShowForm(false);
        setEditingItem(null);
        fetchData().then();
    };

    const handleEdit = (item: Charge) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const columns: Column<Charge>[] = [
        { key: 'id', label: 'ID' },
        { key: 'expense_item_id', label: 'ID Статьи' },
        { key: 'amount', label: 'Сумма' },
        { key: 'charge_date', label: 'Дата расхода' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Расходы</h2>
                <button
                    className={styles.addBtn}
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    Добавить расход
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
                <EntityForm<Charge>
                    title={editingItem ? "Редактировать расход" : "Добавить расход"}
                    fields={[
                        { name: 'expense_item_id', label: 'ID Статьи', type: 'number', hint: 'integer' },
                        { name: 'amount', label: 'Сумма', type: 'number', hint: 'integer' },
                        { name: 'charge_date', label: 'Дата расхода', type: 'datetime-local', hint: 'YYYY-MM-DDThh:mm' }
                    ]}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                    initialData={editingItem || undefined}
                />
            )}
        </div>
    );
}
