import { Link } from 'react-router-dom'

export default function ClosedStoreNotice({ compact = false }) {
  return (
    <div className={`closed-store-card ${compact ? 'compact' : ''}`}>
      <div className="closed-store-icon" aria-hidden="true">🌙</div>
      <div>
        <span className="eyebrow">SHOP CLOSED</span>
        <h2>ขณะนี้ร้านปิดแล้ว</h2>
        <p>ร้านเปิดรับออเดอร์ทุกวันเวลา <strong>08:00 - 20:00</strong></p>
        <p className="muted">ตอนนี้ยังไม่สามารถเลือกเมนู เพิ่มสินค้าเข้าตะกร้า หรือยืนยันคำสั่งซื้อได้</p>
        {!compact && (
          <div className="closed-store-actions">
            <Link to="/points" className="button button-outline">⭐ เช็คแต้ม</Link>
            <Link to="/track" className="button button-outline">📦 ติดตามออเดอร์</Link>
          </div>
        )}
      </div>
    </div>
  )
}
