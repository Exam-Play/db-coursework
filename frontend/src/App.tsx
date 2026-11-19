import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginForm } from './components/LoginForm'
import { Navbar } from './components/Navbar'
import { Warehouses } from './pages/Warehouses'
import { ExpenseItems } from './pages/ExpenseItems'
import { Sales } from './pages/Sales'
import { Charges } from './pages/Charges'
import { Reports } from './pages/Reports'
import { Users } from './pages/Users'
import { apiFetch } from './api'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
    const [user, setUser] = useState<{username: string, role: string} | null>(null)

    useEffect(() => {
        if (isAuthenticated) {
            apiFetch('/auth/me')
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem('token')
                    setIsAuthenticated(false)
                })
        }
    }, [isAuthenticated])

    const handleLogout = () => {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
        setUser(null)
    }

    return (
        <BrowserRouter>
            {isAuthenticated && <Navbar username={user?.username} role={user?.role} onLogout={handleLogout} />}
            <main className={isAuthenticated ? 'main-content' : ''}>
                <Routes>
                    <Route
                        path="/login"
                        element={!isAuthenticated ? <LoginForm onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/"
                        element={isAuthenticated ? (
                            <div className="container py-8 text-center">
                                <h1 className="mb-4">Добро пожаловать в систему учета!</h1>
                                <p className="text-secondary">Используйте меню выше для навигации по разделам.</p>
                            </div>
                        ) : <Navigate to="/login" />}
                    />
                    <Route
                        path="/warehouses"
                        element={isAuthenticated ? <Warehouses /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/expense-items"
                        element={isAuthenticated ? <ExpenseItems /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/sales"
                        element={isAuthenticated ? <Sales /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/charges"
                        element={isAuthenticated ? <Charges /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/reports"
                        element={isAuthenticated ? <Reports /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/users"
                        element={isAuthenticated && user?.role === 'admin' ? <Users /> : <Navigate to={isAuthenticated ? "/" : "/login"} />}
                    />
                </Routes>
            </main>
        </BrowserRouter>
    )
}

export default App
