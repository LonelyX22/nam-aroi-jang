import { useState } from 'react'
import { adminAdjustPoints, findCustomerByPhone } from '../../lib/api'
import { isThaiMobile } from '../../lib/format'

export default function PointsAdminPage() {
  const [phone, setPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [delta, setDelta] = useState(1)
  const [reason, setReason] = useState('ปรับแต้มโดย Admin')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function search(e) {
    e?.preventDefault(); setError(''); setMessage('')
    if (!isThaiMobile(phone)) { setError('กรุณากรอกเบอร์โทร 10 หลัก'); return }
    try { const c = await findCustomerByPhone(phone); setCustomer(c); if (!c) setError('ไม่พบลูกค้าเบอร์นี้') } catch (e2) { setError(e2.message) }
  }
  async function adjust(e) {
    e.preventDefault(); setError(''); setMessage('')
    if (!customer) return
    if (!Number.isInteger(Number(delta)) || Number(delta) === 0) { setError('จำนวนแต้มต้องเป็นจำนวนเต็มและไม่เท่ากับ 0'); return }
    if (!reason.trim()) { setError('กรุณาระบุเหตุผล'); return }
    try { const updated = await adminAdjustPoints(customer.id, Number(delta), reason.trim()); setCustomer({ ...customer, points: updated.points ?? updated }); setMessage('ปรับแต้มเรียบร้อย') } catch (e2) { setError(e2.message) }
  }

  return <div><div className="admin-page-head"><div><span className="eyebrow">POINTS</span><h1>จัดการแต้ม</h1><p>ค้นหาด้วยเบอร์โทรและปรับแต้มพร้อมบันทึกเหตุผล</p></div></div>{error && <div className="alert alert-error">{error}</div>}{message && <div className="alert alert-success">{message}</div>}<div className="split-admin"><div className="admin-card"><h2>ค้นหาลูกค้า</h2><form className="inline-form" onSubmit={search}><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0XXXXXXXXX" inputMode="numeric" /><button className="button button-primary">ค้นหา</button></form>{customer && <div className="customer-point-card"><span>{customer.name}</span><strong>{customer.points || 0}</strong><small>แต้มปัจจุบัน</small><p>{customer.phone}</p></div>}</div><div className="admin-card"><h2>เพิ่ม / ลดแต้ม</h2>{customer ? <form onSubmit={adjust}><label>จำนวนแต้ม (+ เพิ่ม / - ลด)<input type="number" step="1" value={delta} onChange={(e) => setDelta(e.target.value)} /></label><label>เหตุผล<textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} /></label><button className="button button-primary button-wide">บันทึกการปรับแต้ม</button></form> : <div className="empty-inline">ค้นหาลูกค้าก่อน</div>}</div></div></div>
}
