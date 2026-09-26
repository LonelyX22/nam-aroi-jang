import { useState } from 'react'
import { getCustomerPoints } from '../lib/api'
import { isThaiMobile } from '../lib/format'
import { useApp } from '../context/AppContext'

export default function PointsPage() {
  const { t } = useApp()
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e) {
    e.preventDefault(); setError(''); setResult(null)
    if (!isThaiMobile(phone)) { setError('กรุณากรอกเบอร์โทร 10 หลัก'); return }
    setLoading(true)
    try { setResult(await getCustomerPoints(phone)) } catch (e2) { setError(e2.message) } finally { setLoading(false) }
  }
  return <section className="section page-section"><div className="container points-page"><div className="page-title"><span className="eyebrow">REWARDS</span><h1>{t('points')}</h1><p>1 แก้ว = 1 แต้ม • 10 แต้ม = ฟรี 1 แก้ว • แต้มไม่มีวันหมดอายุ</p></div><div className="points-card"><div className="points-illustration">⭐</div><form onSubmit={submit}><label>{t('phone')}<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0XXXXXXXXX" inputMode="numeric" /></label><button className="button button-primary button-wide" disabled={loading}>{loading ? 'กำลังค้นหา...' : t('checkPoints')}</button></form>{error && <div className="alert alert-error">{error}</div>}{result && (result.found ? <div className="points-result"><span>{result.name || 'ลูกค้า'}</span><strong>{result.points}</strong><small>{t('currentPoints')}</small><div className="progress"><i style={{ width: `${Math.min(100, (Number(result.points) % 10) * 10)}%` }} /></div><p>{Number(result.points) >= 10 ? '🎉 คุณมีแต้มพอแลกเครื่องดื่มฟรีแล้ว!' : `อีก ${10 - (Number(result.points) % 10)} แต้ม รับฟรี 1 แก้ว`}</p></div> : <div className="empty-inline">ยังไม่พบสมาชิกเบอร์นี้ — ระบบจะสมัครให้อัตโนมัติเมื่อสั่งครั้งแรก</div>)}</div></div></section>
}
