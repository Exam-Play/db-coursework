import type { Column } from '../types'
import styles from './DataTable.module.scss'

interface DataTableProps<T extends { id: number }> {
    data: T[]
    columns: Column<T>[]
    onDelete?: (id: number) => void
    onEdit?: (item: T) => void
    title?: string
    showExport?: boolean
    emptyMessage?: string
    loading?: boolean
}

function formatCellValue(value: unknown): string {
    if (typeof value !== 'string') return String(value ?? '')

    return value.replace(/T(\d{2}:\d{2}):\d{2}(?:\.\d+)?$/, ' $1')
}

function exportToExcel<T extends { id: number }>(data: T[], columns: Column<T>[], filename = 'data.xls') {
    const tableHtml = `
        <table border="1">
            <thead>
                <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>${columns.map(c => `<td>${formatCellValue(row[c.key])}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `

    const blob = new Blob(['\ufeff', tableHtml], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export function DataTable<T extends { id: number }>({
    data,
    columns,
    onDelete,
    onEdit,
    title,
    showExport = true,
    emptyMessage = 'Нет данных для отображения',
    loading = false
}: DataTableProps<T>) {
    const hasActions = onDelete || onEdit

    if (loading) {
        return (
            <div className={styles.loadingWrapper} role="status" aria-live="polite">
                <div className={styles.spinner} aria-hidden="true" />
                <span>Загрузка данных...</span>
            </div>
        )
    }

    const handleExport = () => exportToExcel(data, columns, `${title || 'data'}.xls`)

    return (
        <div className={styles.tableWrapper}>
            {(title || showExport) && (
                <div className={styles.toolbar}>
                    {title && <h2 className={styles.toolbarTitle}>{title}</h2>}
                    <div className={styles.toolbarActions}>
                        {showExport && data.length > 0 && (
                            <button
                                type="button"
                                className={`${styles.exportBtn} ${styles.actionBtn}`}
                                onClick={handleExport}
                                aria-label="Экспорт в Excel"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Excel
                            </button>
                        )}
                    </div>
                </div>
            )}
            {data.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                    <p>{emptyMessage}</p>
                </div>
            ) : (
                <div className={styles.responsiveWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeaderRow}>
                                {columns.map(col => (
                                    <th key={String(col.key)} className={styles.tableHeaderCell} scope="col">
                                        {col.label}
                                    </th>
                                ))}
                                {hasActions && (
                                    <th className={styles.tableHeaderCell} scope="col">
                                        Действия
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(row => (
                                <tr key={row.id} className={styles.tableBodyRow}>
                                    {columns.map(col => (
                                        <td key={String(col.key)} className={styles.tableCell}>
                                            {formatCellValue(row[col.key])}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                                            <div className={styles.actionBtnGroup}>
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                                        onClick={() => onEdit(row)}
                                                        aria-label={`Редактировать ${row.id}`}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                        Редактировать
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => onDelete(row.id)}
                                                        aria-label={`Удалить ${row.id}`}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                        Удалить
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

