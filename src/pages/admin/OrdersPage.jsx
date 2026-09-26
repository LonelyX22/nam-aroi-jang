import { useEffect, useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import { listOrders, subscribeOrders, updateOrderStatus } from '../../lib/api'
import { formatDateTime, formatMoney } from '../../lib/format'
import { ORDER_STATUSES, STATUS_LABELS } from '../../lib/constants'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() { try { setOrders(await listOrders()) } catch (e) { setError(e.message) } }
  useEffect(() => { load(); return subscribeOrders(load, load) }, [])

  const filtered = useMemo(() => orders.filter((o) => filter === 'all' ? true : filter === 'active' ? !['completed', 'cancelled'].includes(o.status) : o.status === filter), [orders, filter])

  async function changeStatus(order, status) {
    if (status === 'cancelled' && !window.confirm(`ยืนยันยกเลิก ${order.order_number}?`)) return
    setSaving(true); setError('')
    try { const updated = await updateOrderStatus(order.id, status); setOrders((current) => current.map((x) => x.id === order.id ? { ...x, ...updated } : x)); setSelected((s) => s?.id === order.id ? { ...s, ...updated } : s) } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return <div><div className="admin-page-head"><div><span className="eyebrow">ORDERS</span><h1>จัดการ Order</h1><p>รับออเดอร์ เปลี่ยนสถานะ และดูรายละเอียดลูกค้า</p></div></div>{error && <div className="alert alert-error">{error}</div>}<div className="filter-pills">{[['active','กำลังดำเนินการ'],['pending','รอรับ'],['preparing','กำลังทำ'],['ready','พร้อมรับ'],['delivering','กำลังส่ง'],['completed','สำเร็จ'],['cancelled','ยกเลิก'],['all','ทั้งหมด']].map(([v,l]) => <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{l}</button>)}</div><div className="orders-grid">{filtered.map((o) => <article className="order-card" key={o.id}><div className="order-card-head"><div><small>{formatDateTime(o.created_at)}</small><h3>{o.order_number}</h3>{o.tracking_code && <span className="admin-tracking-code">ติดตาม: {o.tracking_code}</span>}</div><StatusBadge status={o.status} /></div><div className="order-customer"><strong>{o.customer_name || 'ลูกค้า'}</strong><span>📞 {o.customer_phone}</span></div><div className="order-items-mini">{o.order_items?.map((item) => <div key={item.id || `${item.product_id}-${item.sweetness}`}><span>{item.product_name_th} × {item.quantity}<small>หวาน {item.sweetness}%</small></span><strong>{formatMoney(Number(item.unit_price) * item.quantity)}</strong></div>)}</div><div className="order-card-foot"><div><span>{o.fulfillment_type === 'delivery' ? '🛵 จัดส่ง' : '🏪 รับเอง'}</span><strong>{formatMoney(o.total)}</strong></div><button className="button button-soft" onClick={() => setSelected(o)}>รายละเอียด / จัดการ</button></div></article>)}{filtered.length === 0 && <div className="empty-state admin-empty">📦<h3>ไม่มี Order ในสถานะนี้</h3></div>}</div>{selected && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><div className="modal-card order-modal"><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="modal-title"><div><small>Order</small><h2>{selected.order_number}</h2>{selected.tracking_code && <div className="admin-tracking-code large">เลขติดตาม: {selected.tracking_code}</div>}</div><StatusBadge status={selected.status} /></div><div className="detail-columns"><div className="admin-info-box"><h3>ลูกค้า</h3><p><strong>{selected.customer_name}</strong><br />{selected.customer_phone}</p><h3>การรับสินค้า</h3><p>{selected.fulfillment_type === 'delivery' ? 'จัดส่งถึงบ้าน' : 'รับเองที่ร้าน'}</p>{selected.delivery_address && <p>{Object.values(selected.delivery_address).filter(Boolean).join(' ')}</p>}<h3>หมายเหตุ</h3><p>{selected.note || '-'}</p></div><div className="admin-info-box"><h3>การชำระเงิน</h3><p>{selected.payment_method}<br /><strong>{selected.payment_status}</strong></p><h3>ยอด</h3><p>สินค้า {formatMoney(selected.subtotal)}<br />ส่วนลด -{formatMoney(selected.discount)}<br />จัดส่ง {formatMoney(selected.delivery_fee)}<br /><strong>รวม {formatMoney(selected.total)}</strong></p></div></div><h3>เปลี่ยนสถานะ</h3><div className="status-actions">{ORDER_STATUSES.map((status) => <button disabled={saving || selected.status === status} key={status} className={`status-action ${selected.status === status ? 'current' : ''}`} onClick={() => changeStatus(selected, status)}>{STATUS_LABELS[status].th}</button>)}</div></div></div>}</div>
}
