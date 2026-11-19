import React, { useState } from 'react'
import styles from './EntityForm.module.scss'

export interface FormField<T> {
    name: keyof T
    label: string
    type: 'text' | 'number' | 'date' | 'datetime-local' | 'select'
    options?: { value: string | number; label: string }[]
    hint?: string
}

interface EntityFormProps<T> {
    title: string
    fields: FormField<T>[]
    onSave: (data: Partial<T>) => void
    onClose: () => void
    initialData?: Partial<T>
    loading?: boolean
}

export function EntityForm<T>({
    title,
    fields,
    onSave,
    onClose,
    initialData,
    loading = false
}: EntityFormProps<T>) {
    const [formData, setFormData] = useState<Partial<T>>(initialData || {})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 id="modal-title">{title}</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.fields}>
                        {fields.map(field => (
                            <div key={String(field.name)} className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor={String(field.name)}>
                                    {field.label}
                                    {field.hint && <span className={styles.hint}> ({field.hint})</span>}
                                </label>
                                {field.type === 'select' ? (
                                    <select
                                        id={String(field.name)}
                                        name={String(field.name)}
                                        value={String(formData[field.name] || '')}
                                        onChange={handleChange}
                                        className={styles.select}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Выберите...</option>
                                        {field.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        id={String(field.name)}
                                        type={field.type}
                                        name={String(field.name)}
                                        value={String(formData[field.name] || '')}
                                        onChange={handleChange}
                                        className={styles.input}
                                        required
                                        disabled={loading}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
