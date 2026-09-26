import { useEffect, useMemo, useState } from 'react'
import { listOrders } from '../../lib/api'
import { formatMoney } from '../../lib/format'

function day(value) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) }
export default function ReportsPage() {
  const [orders, setOrders] = useState([])
  useEffect(() => { listOrders({ limit: 1000 }).then(setOrders) }, [])
  const completed = orders.filter((o) => o.status === 'completed')
  const report = useMemo(() => {
    const map = new Map()
    for (const o of completed) {
      const key = day(o.created_at)
      const row = map.get(key) || { date: key, orders: 0, sales: 0, drinks: 0 }
      row.orders += 1; row.sales += Number(o.total || 0); row.drinks += (o.order_items || []).reduce((s, x) => s + Number(x.quantity || 0), 0)
      map.set(key, row)
    }
    return [...map.values()].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 30)
  }, [orders])
  const totalSales = completed.reduce((s,o) => s + Number(o.total || 0), 0)
  const totalDrinks = completed.reduce((s,o) => s + (o.order_items || []).reduce((n,x) => n + Number(x.quantity || 0), 0), 0)
  return <div><div className="admin-page-head"><div><span className="eyebrow">REPORTS</span><h1>รายงานยอดขาย</h1><p>สรุปจาก Order ที่มีสถานะสำเร็จ</p></div></div><div className="stats-grid three"><div className="stat-card"><span>💰</span><div><small>ยอดขายรวม</small><strong>{formatMoney(totalSales)}</strong></div></div><div className="stat-card"><span>✅</span><div><small>Orders สำเร็จ</small><strong>{completed.length}</strong></div></div><div className="stat-card"><span>🥤</span><div><small>จำนวนแก้ว</small><strong>{totalDrinks}</strong></div></div></div><div className="admin-card"><h2>ย้อนหลัง 30 วันที่มีรายการขาย</h2><div className="table-wrap"><table><thead><tr><th>วันที่</th><th>Orders</th><th>จำนวนแก้ว</th><th>ยอดขาย</th></tr></thead><tbody>{report.map((r) => <tr key={r.date}><td>{r.date}</td><td>{r.orders}</td><td>{r.drinks}</td><td>{formatMoney(r.sales)}</td></tr>)}{!report.length && <tr><td colSpan="4" className="table-empty">ยังไม่มีข้อมูลยอดขาย</td></tr>}</tbody></table></div></div></div>
}
