import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { Layout } from './components/Layout'
import { LoginPage } from './components/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { ChickensPage } from './pages/ChickensPage'
import { ChickenDetail } from './pages/ChickenDetail'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-green-50">
        <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="chickens" element={<ChickensPage />} />
        <Route path="chickens/:id" element={<ChickenDetail />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
