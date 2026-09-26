import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../../lib/supabase'

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
  }, [])

  async function submit(e) {
    e.preventDefault(); setError('')
    if (password.length < 8) { setError('Password ต้องยาวอย่างน้อย 8 ตัวอักษร'); return }
    if (password !== confirm) { setError('Password ทั้งสองช่องไม่ตรงกัน'); return }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      navigate('/admin/dashboard', { replace: true })
    } catch (e2) { setError(e2.message) } finally { setLoading(false) }
  }

  return <div className="login-page"><div className="login-card"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="น้ำอร่อยจัง" /><span className="eyebrow">STAFF INVITATION</span><h1>ตั้งรหัสผ่าน</h1><p>สร้างรหัสผ่านสำหรับเข้าหลังบ้านร้านน้ำอร่อยจัง</p>{error && <div className="alert alert-error">{error}</div>}{!ready ? <div className="alert alert-warning">ไม่พบ Session จากลิงก์เชิญ กรุณาเปิดลิงก์ล่าสุดจาก Email อีกครั้ง</div> : <form onSubmit={submit}><label>Password ใหม่<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></label><label>ยืนยัน Password<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></label><button className="button button-primary button-wide" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านและเข้าสู่ระบบ'}</button></form>}<Link className="text-button" to="/admin/login">กลับหน้า Login</Link></div></div>
}
