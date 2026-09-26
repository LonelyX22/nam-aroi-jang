import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { listCustomers, listOrders, subscribeOrders } from '../../lib/api'
import { formatDateTime, formatMoney } from '../../lib/format'

function thaiDateKey(value) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.45)
  } catch { /* Browser may block audio until interaction */ }
}

export default function DashboardPage() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [notice, setNotice] = useState('')
  const loadingRef = useRef(false)

  async function load() {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const [o, c] = await Promise.all([listOrders(), listCustomers()])
      setOrders(o); setCustomers(c)
    } finally { loadingRef.current = false }
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeOrders((order) => {
      beep(); setNotice(`Order ใหม่ ${order.order_number || ''}`); load(); setTimeout(() => setNotice(''), 5000)
    }, load)
    return unsubscribe
  }, [])

  const today = thaiDateKey(new Date())
  const todayOrders = orders.filter((x) => thaiDateKey(x.created_at) === today)
  const stats = useMemo(() => ({
    orders: todayOrders.length,
    sales: todayOrders.filter((x) => x.status === 'completed').reduce((s, x) => s + Number(x.total || 0), 0),
    pending: orders.filter((x) => x.status === 'pending').length,
    preparing: orders.filter((x) => ['accepted', 'preparing'].includes(x.status)).length,
    completed: todayOrders.filter((x) => x.status === 'completed').length,
    customers: customers.length,
  }), [orders, customers])

  return <div><div className="admin-page-head"><div><span className="eyebrow">OVERVIEW</span><h1>Dashboard</h1><p>ภาพรวมร้านน้ำอร่อยจังวันนี้</p></div><Link className="button button-primary" to="/admin/orders">ดู Orders →</Link></div>{notice && <div className="order-toast">🔔 {notice}</div>}<div className="stats-grid">{[
    ['📦', 'Order วันนี้', stats.orders], ['💰', 'ยอดขายวันนี้', formatMoney(stats.sales)], ['⏳', 'กำลังรอ', stats.pending], ['🥤', 'กำลังทำ', stats.preparing], ['✅', 'สำเร็จวันนี้', stats.completed], ['👥', 'ลูกค้าทั้งหมด', stats.customers],
  ].map(([icon, label, value]) => <div className="stat-card" key={label}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>)}</div><div className="admin-card"><div className="card-head"><h2>Order ล่าสุด</h2><Link to="/admin/orders">ดูทั้งหมด</Link></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>เลขติดตาม</th><th>ลูกค้า</th><th>ยอด</th><th>สถานะ</th><th>เวลา</th></tr></thead><tbody>{orders.slice(0, 8).map((o) => <tr key={o.id}><td><strong>{o.order_number}</strong></td><td><span className="admin-tracking-code">{o.tracking_code || '-'}</span></td><td>{o.customer_name || o.customer_phone}</td><td>{formatMoney(o.total)}</td><td><StatusBadge status={o.status} /></td><td>{formatDateTime(o.created_at)}</td></tr>)}{orders.length === 0 && <tr><td colSpan="6" className="table-empty">ยังไม่มี Order</td></tr>}</tbody></table></div></div></div>
}
