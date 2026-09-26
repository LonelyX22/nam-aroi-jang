import { Link, useLocation } from 'react-router-dom'
import { formatMoney } from '../lib/format'
import { useApp } from '../context/AppContext'

export default function OrderSuccessPage() {
  const { state } = useLocation()
  const { t } = useApp()
  if (!state?.order_number) return <section className="section page-section"><div className="container"><div className="empty-state"><h2>ไม่พบข้อมูล Order</h2><Link to="/menu" className="button button-primary">กลับหน้าเมนู</Link></div></div></section>
  return <section className="section page-section"><div className="container"><div className="success-card"><div className="success-icon">✓</div><span className="eyebrow">ORDER RECEIVED</span><h1>{t('orderSuccess')}</h1><p>{t('thankYou')}</p><div className="success-number"><span>Order Number</span><strong>{state.order_number}</strong></div><div className="success-total">ยอดรวม <strong>{formatMoney(state.total)}</strong></div><p className="muted">เก็บเลขออเดอร์หรือกดปุ่มด้านล่างเพื่อติดตามสถานะ</p><div className="hero-actions"><Link to={`/track?token=${encodeURIComponent(state.tracking_token)}`} className="button button-primary">📦 ติดตามออเดอร์</Link><Link to="/" className="button button-outline">หน้าแรก</Link></div></div></div></section>
}
