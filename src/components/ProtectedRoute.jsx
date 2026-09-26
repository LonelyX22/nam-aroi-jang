import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, ownerOnly = false }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-loader">กำลังโหลด...</div>
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!profile?.is_active) return <div className="center-card"><h2>บัญชีถูกปิดใช้งาน</h2><p>กรุณาติดต่อ Owner</p></div>
  if (ownerOnly && profile?.role !== 'owner') return <Navigate to="/admin/dashboard" replace />
  return children
}
