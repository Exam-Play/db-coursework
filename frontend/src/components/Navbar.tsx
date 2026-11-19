import { Link } from 'react-router-dom'
import styles from './Navbar.module.scss'

export function Navbar({ username, role, onLogout }: { username?: string, role?: string, onLogout: () => void }) {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navSection}>
                <strong>СПРАВОЧНИКИ:</strong>
                <Link to="/warehouses" className={styles.navLink}>Товары</Link>
                <Link to="/expense-items" className={styles.navLink}>Статьи расходов</Link>
                {role === 'admin' && <Link to="/users" className={styles.navLink}>Пользователи</Link>}
            </div>
            <div className={styles.navSection}>
                <strong>ЖУРНАЛЫ:</strong>
                <Link to="/sales" className={styles.navLink}>Продажи</Link>
                <Link to="/charges" className={styles.navLink}>Расходы</Link>
            </div>
            <div className={styles.navSection}>
                <strong>ОТЧЕТЫ:</strong>
                <Link to="/reports" className={styles.navLink}>Отчеты</Link>
            </div>
            <div className={styles.userActions}>
                {username && <span className={styles.username}>{username}</span>}
                <button onClick={onLogout} className={styles.logoutBtn}>Выйти</button>
            </div>
        </nav>
    )
}
