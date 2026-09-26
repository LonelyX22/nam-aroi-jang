import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../lib/supabase'

const links = [
  { to: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/admin/orders', icon: '📦', label: 'Orders' },
  { to: '/admin/products', icon: '🥤', label: 'เมนู', ownerOnly: true },
  { to: '/admin/customers', icon: '👥', label: 'ลูกค้า' },
  { to: '/admin/points', icon: '⭐', label: 'แต้ม', ownerOnly: true },
  { to: '/admin/promotions', icon: '🎁', label: 'โปรโมชั่น', ownerOnly: true },
  { to: '/admin/payments', icon: '💳', label: 'การชำระเงิน' },
  { to: '/admin/reports', icon: '📊', label: 'รายงาน', ownerOnly: true },
  { to: '/admin/settings', icon: '⚙️', label: 'ตั้งค่าร้าน', ownerOnly: true },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  async function logout() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><img src={`${import.meta.env.BASE_URL}logo.png`} /><div><strong>น้ำอร่อยจัง</strong><span>Admin Panel</span></div></div>
        <nav>
          {links.filter((item) => !item.ownerOnly || profile?.role === 'owner').map((item) => <NavLink key={item.to} to={item.to}>{item.icon}<span>{item.label}</span></NavLink>)}
          {profile?.role === 'owner' && <NavLink to="/admin/staff">👤<span>Staff</span></NavLink>}
        </nav>
        <div className="sidebar-user">
          <div><strong>{profile?.display_name || profile?.email}</strong><span>{profile?.role}</span></div>
          <button onClick={logout}>ออกจากระบบ</button>
        </div>
      </aside>
      <div className="admin-content-wrap">
        {!supabaseConfigured && <div className="demo-banner">DEMO MODE — Admin ใช้ {profile?.email} / demo1234</div>}
        <div className="admin-mobile-top"><strong>น้ำอร่อยจัง Admin</strong><button onClick={logout}>ออก</button></div>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  )
}
