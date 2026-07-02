import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import RequireAuth from './components/RequireAuth'
import ViewerPage from './pages/ViewerPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<ViewerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        <p>© KLS Gogte Institute of Technology — Examination Section</p>
      </footer>
    </div>
  )
}
