import {useEffect, useState} from 'react';
import { apiFetch } from '../api';
import styles from './Reports.module.scss';

export function Reports() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [incomeExpense, setIncomeExpense] = useState<{income: number, expense: number} | null>(null);
    const [topProducts, setTopProducts] = useState<{name: string, total_profit: number}[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchIncomeExpense = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/reports/income-expense?date_from=${dateFrom}&date_to=${dateTo}`);
            setIncomeExpense(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;

        apiFetch('/api/reports/top-products')
            .then((res) => {
                if (!ignore) {
                    setTopProducts(res);
                }
            })
            .catch((e) => {
                if (!ignore) {
                    console.error(e);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);


    return (
        <div className={styles.reportsContainer}>
            <h2 style={{ marginBottom: '20px' }}>Отчеты</h2>

            <section className={styles.section}>
                <h3>Баланс доходов и расходов</h3>
                <div className={styles.controls}>
                    <input type="date" className={styles.input} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    <input type="date" className={styles.input} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    <button className={styles.btn} onClick={fetchIncomeExpense} disabled={loading}>Загрузить</button>
                </div>
                {incomeExpense && (
                    <p>Доходы: {incomeExpense.income}, Расходы: {incomeExpense.expense}</p>
                )}
            </section>

            <section className={styles.section}>
                <h3>Топ-5 доходных товаров</h3>
                <table className={styles.table} style={{width: '20%'}}>
                    <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Прибыль</th>
                    </tr>
                    </thead>
                    <tbody>
                    {topProducts.map((p, index) => (
                        <tr key={index}>
                            <td>{p.name}</td>
                            <td>{p.total_profit}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}