import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SHOP } from '../../lib/constants'

export default function LoginPage() {
  const { session, signIn, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(SHOP.ownerEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (session) navigate('/admin/dashboard', { replace: true }) }, [session])

  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await signIn(email.trim(), password)
      navigate(location.state?.from || '/admin/dashboard', { replace: true })
    } catch (e2) { setError(e2.message) } finally { setLoading(false) }
  }

  return <div className="login-page"><div className="login-card"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="น้ำอร่อยจัง" /><span className="eyebrow">OWNER / STAFF</span><h1>เข้าสู่ระบบหลังบ้าน</h1><p>จัดการ Order เมนู ลูกค้า แต้ม และร้าน</p>{!configured && <div className="alert alert-warning"><strong>Demo Login</strong><br />Email: {SHOP.ownerEmail}<br />Password: demo1234</div>}{error && <div className="alert alert-error">{error}</div>}<form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label><button className="button button-primary button-wide" disabled={loading}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button></form><button className="text-button" onClick={() => navigate('/')}>← กลับหน้าร้าน</button></div></div>
}
