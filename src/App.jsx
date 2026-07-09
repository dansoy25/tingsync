import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import Onboarding from './pages/auth/Onboarding'
import AdminShell from './admin/AdminShell'
import MobileShell from './mobile/MobileShell'

function Splash() {
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-[#020817] text-white text-sm">
      Loading TingSync…
    </div>
  )
}

export default function App() {
  const { session, profile, loading } = useAuth()

  if (loading) return <Splash />

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={session ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/forgot-password" element={session ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route
        path="/onboarding"
        element={!session ? <Navigate to="/login" replace /> : profile ? <Navigate to="/" replace /> : <Onboarding />}
      />
      <Route
        path="/*"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !profile ? (
            <Navigate to="/onboarding" replace />
          ) : profile.is_admin ? (
            <AdminShell />
          ) : (
            <MobileShell />
          )
        }
      />
    </Routes>
  )
}
