import { useEffect, useState } from 'react'
import { getSlipUrl, listOrders, updatePaymentStatus } from '../../lib/api'
import { formatDateTime, formatMoney } from '../../lib/format'

export default function PaymentsPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  async function load() { setOrders((await listOrders()).filter((o) => ['promptpay','bank_transfer'].includes(o.payment_method))) }
  useEffect(() => { load().catch((e) => setError(e.message)) }, [])
  async function viewSlip(o) { try { const url = await getSlipUrl(o.slip_path); if (url) window.open(url, '_blank', 'noopener,noreferrer'); else alert('Demo mode: ไม่มีไฟล์สลิปจริง') } catch (e) { setError(e.message) } }
  async function setStatus(o, status) { try { await updatePaymentStatus(o.id, status); await load() } catch (e) { setError(e.message) } }
  return <div><div className="admin-page-head"><div><span className="eyebrow">PAYMENTS</span><h1>ตรวจสอบการชำระเงิน</h1><p>ตรวจสลิป PromptPay / โอนเงิน แล้วอนุมัติหรือปฏิเสธ</p></div></div>{error && <div className="alert alert-error">{error}</div>}<div className="admin-card"><div className="table-wrap"><table><thead><tr><th>Order</th><th>เวลา</th><th>วิธีชำระ</th><th>ยอด</th><th>สถานะ</th><th></th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td><strong>{o.order_number}</strong><small className="block">{o.customer_phone}</small></td><td>{formatDateTime(o.created_at)}</td><td>{o.payment_method}</td><td>{formatMoney(o.total)}</td><td><span className={`payment-status payment-${o.payment_status}`}>{o.payment_status}</span></td><td><div className="row-actions"><button disabled={!o.slip_path} onClick={() => viewSlip(o)}>ดูสลิป</button><button onClick={() => setStatus(o, 'paid')}>อนุมัติ</button><button className="danger" onClick={() => setStatus(o, 'rejected')}>ไม่ผ่าน</button></div></td></tr>)}{!orders.length && <tr><td colSpan="6" className="table-empty">ยังไม่มีรายการโอน/PromptPay</td></tr>}</tbody></table></div></div></div>
}
