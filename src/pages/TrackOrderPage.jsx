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
  const initialCode = params.get('code') || params.get('token') || ''
  const [trackingCode, setTrackingCode] = useState(initialCode)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function search(value = trackingCode) {
    if (!value.trim()) return
    setLoading(true); setError('')
    try {
      const data = await trackOrder(value.trim())
      if (!data) throw new Error(t('orderNotFound'))
      const normalized = value.trim().toUpperCase()
      setOrder(data); setTrackingCode(normalized); setParams({ code: normalized }, { replace: true })
    } catch (e) { setOrder(null); setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    const code = params.get('code') || params.get('token')
    if (code) search(code)
  }, [])
  useEffect(() => {
    if (!order || ['completed', 'cancelled'].includes(order.status)) return
    const timer = setInterval(() => trackOrder(order.tracking_code || order.tracking_token || trackingCode).then((x) => x && setOrder(x)).catch(() => {}), 5000)
    return () => clearInterval(timer)
  }, [order?.status, order?.tracking_token])

  const flow = order?.fulfillment_type === 'delivery' ? ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'completed'] : ['pending', 'accepted', 'preparing', 'ready', 'completed']
  const currentIndex = order ? flow.indexOf(order.status) : -1

  return <section className="section page-section"><div className="container narrow-container"><div className="page-title"><span className="eyebrow">ORDER TRACKING</span><h1>{t('trackTitle')}</h1><p>{t('trackHelp')}</p></div><div className="track-search"><input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} placeholder="Tracking code" maxLength={36} autoCapitalize="characters" /><button className="button button-primary" onClick={() => search()} disabled={loading}>{loading ? '...' : t('search')}</button></div>{error && <div className="alert alert-error">{error}</div>}{order && <div className="tracking-card"><div className="tracking-head"><div><span>Order</span><h2>{order.order_number}</h2>{order.tracking_code && <div className="tracking-inline-code">🔎 {order.tracking_code}</div>}<small>{formatDateTime(order.created_at, language)}</small></div><StatusBadge status={order.status} language={language} /></div>{order.status === 'cancelled' ? <div className="cancel-box">{t('orderCancelled')}</div> : <div className="status-timeline">{flow.map((status, index) => <div key={status} className={index <= currentIndex ? 'done' : ''}><i>{index < currentIndex ? '✓' : index === currentIndex ? '●' : ''}</i><span>{ORDER_STATUSES.includes(status) ? ({
  pending: language === 'th' ? 'รอรับ Order' : 'Pending',
  accepted: language === 'th' ? 'รับ Order แล้ว' : 'Accepted',
  preparing: language === 'th' ? 'กำลังทำ' : 'Preparing',
  ready: language === 'th' ? 'พร้อมรับสินค้า' : 'Ready',
  delivering: language === 'th' ? 'กำลังจัดส่ง' : 'Delivering',
  completed: language === 'th' ? 'สำเร็จ' : 'Completed',
}[status] || status) : status}</span></div>)}</div>}<div className="tracking-details"><div><span>{t('fulfillmentLabel')}</span><strong>{order.fulfillment_type === 'delivery' ? t('delivery') : t('pickupAtShop')}</strong></div><div><span>{t('orderTotal')}</span><strong>{formatMoney(order.total)}</strong></div><div><span>{t('paymentLabel')}</span><strong>{order.payment_status === 'paid' ? t('paid') : order.payment_status === 'pending_review' ? t('pendingReview') : t('unpaid')}</strong></div></div>{order.order_items?.length > 0 && <div className="track-items">{order.order_items.map((item) => <div key={item.id || `${item.product_id}-${item.sweetness}`}><span>{language === 'th' ? item.product_name_th : item.product_name_en} × {item.quantity}</span><strong>{formatMoney(Number(item.unit_price) * item.quantity)}</strong></div>)}</div>}</div>}</div></section>
}
