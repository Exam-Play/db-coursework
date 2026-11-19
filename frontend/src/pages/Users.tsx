import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '../api'
import { DataTable } from '../components/DataTable'
import { EntityForm, type FormField } from '../components/EntityForm'
import type { Column } from '../types'

interface User {
    id: number
    username: string
    role: string
    password?: string
}

export function Users() {
    const [data, setData] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingItem, setEditingItem] = useState<User | null>(null)
    const [formLoading, setFormLoading] = useState(false)
    const hasFetched = useRef(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const result: User[] = await apiFetch('/api/users')
            setData(result)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!hasFetched.current) {
            fetchData().then()
            hasFetched.current = true
        }
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить пользователя?')) return
        try {
            await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
            await fetchData()
        } catch (e) {
            alert(e)
        }
    }

    const handleSave = async (newData: Partial<User>) => {
        setFormLoading(true)
        try {
            if (editingItem) {
                await apiFetch(`/api/users/${editingItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(newData)
                })
            } else {
                await apiFetch('/api/users', {
                    method: 'POST',
                    body: JSON.stringify(newData)
                })
            }
            setShowForm(false)
            setEditingItem(null)
            await fetchData()
        } catch (e) {
            alert(e)
        } finally {
            setFormLoading(false)
        }
    }

    const columns: Column<User>[] = [
        { key: 'id', label: 'ID' },
        { key: 'username', label: 'Логин' },
        { key: 'role', label: 'Роль' }
    ]

    const fields: FormField<User>[] = [
        { name: 'username', label: 'Логин', type: 'text', hint: 'string' },
        { name: 'password', label: 'Пароль (оставьте пустым при редактировании, если не хотите менять)', type: 'text', hint: 'string' },
        { 
            name: 'role', 
            label: 'Роль', 
            type: 'select', 
            options: [
                { value: 'admin', label: 'Администратор' },
                { value: 'user', label: 'Пользователь' }
            ] 
        }
    ]

    return (
        <div className="container py-6">
            <div className="d-flex justify-between items-center mb-6">
                <h1>Управление пользователями</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    Добавить пользователя
                </button>
            </div>

            <DataTable 
                data={data} 
                columns={columns} 
                onDelete={handleDelete} 
                onEdit={(item) => { setEditingItem(item); setShowForm(true); }}
                loading={loading}
                title="Список пользователей"
            />
            
            {showForm && (
                <EntityForm<User>
                    title={editingItem ? "Редактировать пользователя" : "Добавить пользователя"}
                    fields={fields}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                    initialData={editingItem || undefined}
                    loading={formLoading}
                />
            )}
        </div>
    )
}
