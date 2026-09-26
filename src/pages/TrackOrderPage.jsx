import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { trackOrder } from '../lib/api'
import { formatDateTime, formatMoney } from '../lib/format'
import { ORDER_STATUSES } from '../lib/constants'
import { useApp } from '../context/AppContext'

export default function TrackOrderPage() {
  const { t, language } = useApp()
  const [params, setParams] = useSearchParams()
  const [token, setToken] = useState(params.get('token') || '')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function search(value = token) {
    if (!value.trim()) return
    setLoading(true); setError('')
    try {
      const data = await trackOrder(value.trim())
      if (!data) throw new Error('ไม่พบ Order กรุณาตรวจสอบรหัสติดตาม')
      setOrder(data); setParams({ token: value.trim() }, { replace: true })
    } catch (e) { setOrder(null); setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (params.get('token')) search(params.get('token')) }, [])
  useEffect(() => {
    if (!order || ['completed', 'cancelled'].includes(order.status)) return
    const timer = setInterval(() => trackOrder(order.tracking_token || token).then((x) => x && setOrder(x)).catch(() => {}), 5000)
    return () => clearInterval(timer)
  }, [order?.status, order?.tracking_token])

  const flow = order?.fulfillment_type === 'delivery' ? ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'completed'] : ['pending', 'accepted', 'preparing', 'ready', 'completed']
  const currentIndex = order ? flow.indexOf(order.status) : -1

  return <section className="section page-section"><div className="container narrow-container"><div className="page-title"><span className="eyebrow">ORDER TRACKING</span><h1>{t('trackTitle')}</h1><p>กรอกรหัสติดตามที่ได้รับหลังสั่งซื้อ</p></div><div className="track-search"><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Tracking code" /><button className="button button-primary" onClick={() => search()} disabled={loading}>{loading ? '...' : t('search')}</button></div>{error && <div className="alert alert-error">{error}</div>}{order && <div className="tracking-card"><div className="tracking-head"><div><span>Order</span><h2>{order.order_number}</h2><small>{formatDateTime(order.created_at)}</small></div><StatusBadge status={order.status} language={language} /></div>{order.status === 'cancelled' ? <div className="cancel-box">ออเดอร์นี้ถูกยกเลิก</div> : <div className="status-timeline">{flow.map((status, index) => <div key={status} className={index <= currentIndex ? 'done' : ''}><i>{index < currentIndex ? '✓' : index === currentIndex ? '●' : ''}</i><span>{status === 'pending' ? 'รอรับ Order' : status === 'accepted' ? 'รับ Order แล้ว' : status === 'preparing' ? 'กำลังทำ' : status === 'ready' ? 'พร้อมรับสินค้า' : status === 'delivering' ? 'กำลังจัดส่ง' : 'สำเร็จ'}</span></div>)}</div>}<div className="tracking-details"><div><span>วิธีรับ</span><strong>{order.fulfillment_type === 'delivery' ? 'จัดส่งถึงบ้าน' : 'รับเองที่ร้าน'}</strong></div><div><span>ยอดรวม</span><strong>{formatMoney(order.total)}</strong></div><div><span>การชำระเงิน</span><strong>{order.payment_status === 'paid' ? 'ชำระแล้ว' : order.payment_status === 'pending_review' ? 'รอตรวจสลิป' : 'ยังไม่ชำระ'}</strong></div></div>{order.order_items?.length > 0 && <div className="track-items">{order.order_items.map((item) => <div key={item.id || `${item.product_id}-${item.sweetness}`}><span>{language === 'th' ? item.product_name_th : item.product_name_en} × {item.quantity}</span><strong>{formatMoney(Number(item.unit_price) * item.quantity)}</strong></div>)}</div>}</div>}</div></section>
}
