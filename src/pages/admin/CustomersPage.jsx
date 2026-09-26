import { useEffect, useMemo, useState } from 'react'
import { listCustomers, listOrders } from '../../lib/api'
import { formatMoney } from '../../lib/format'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([listCustomers(), listOrders()]).then(([c,o]) => { setCustomers(c); setOrders(o) }).catch((e) => setError(e.message)) }, [])
  const rows = useMemo(() => customers.map((c) => {
    const own = orders.filter((o) => o.customer_id === c.id || o.customer_phone === c.phone)
    return { ...c, orderCount: own.length, spend: own.filter((o) => o.status === 'completed').reduce((s,o) => s + Number(o.total || 0), 0) }
  }).filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase())), [customers, orders, query])
  return <div><div className="admin-page-head"><div><span className="eyebrow">CUSTOMERS</span><h1>ลูกค้า</h1><p>ค้นหาสมาชิก ดูแต้ม จำนวน Order และยอดซื้อรวม</p></div></div>{error && <div className="alert alert-error">{error}</div>}<div className="admin-toolbar"><input placeholder="ค้นหาชื่อหรือเบอร์โทร..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="admin-card"><div className="table-wrap"><table><thead><tr><th>ลูกค้า</th><th>เบอร์โทร</th><th>แต้ม</th><th>Orders</th><th>ยอดซื้อสำเร็จ</th></tr></thead><tbody>{rows.map((c) => <tr key={c.id}><td><strong>{c.name || '-'}</strong></td><td>{c.phone}</td><td>⭐ {c.points || 0}</td><td>{c.orderCount}</td><td>{formatMoney(c.spend)}</td></tr>)}{!rows.length && <tr><td colSpan="5" className="table-empty">ไม่พบลูกค้า</td></tr>}</tbody></table></div></div></div>
}
