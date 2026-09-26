import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { createOrder, getCustomerPoints, getShopSettings, listPromotions, uploadPaymentSlip } from '../lib/api'
import { formatMoney, isThaiMobile, shopIsOpen } from '../lib/format'
import { SHOP } from '../lib/constants'
import { useApp } from '../context/AppContext'
import PromptPayQR from '../components/PromptPayQR'
import ClosedStoreNotice from '../components/ClosedStoreNotice'

function promoAvailable(promo) {
  if (!promo.is_active) return false
  if (!promo.start_time || !promo.end_time) return true
  const now = new Date()
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
  return time >= promo.start_time.slice(0, 5) && time < promo.end_time.slice(0, 5)
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, cartSubtotal, clearCart, t, language } = useApp()
  const [settings, setSettings] = useState(null)
  const [promos, setPromos] = useState([])
  const [points, setPoints] = useState(null)
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [slip, setSlip] = useState(null)
  const [reward, setReward] = useState('none')
  const { shopOpen, shopStatusLoading } = useOutletContext()
  const [form, setForm] = useState({
    name: '', phone: '', fulfillment_type: 'pickup', payment_method: 'cash',
    house: '', road: '', subdistrict: '', district: '', postcode: '', note: '',
  })

  useEffect(() => {
    Promise.all([getShopSettings(), listPromotions({ activeOnly: true })]).then(([s, p]) => { setSettings(s); setPromos(p.filter(promoAvailable)) }).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!isThaiMobile(form.phone)) { setPoints(null); return }
    const timer = setTimeout(async () => {
      setLoadingPoints(true)
      try { setPoints(await getCustomerPoints(form.phone)) } catch { setPoints(null) } finally { setLoadingPoints(false) }
    }, 350)
    return () => clearTimeout(timer)
  }, [form.phone])

  const selectedPromo = reward.startsWith('promo:') ? promos.find((p) => `promo:${p.id}` === reward) : null
  const estimatedDiscount = useMemo(() => {
    if (reward === 'points' && cart.length) return Math.min(...cart.map((x) => Number(x.product.price)))
    if (selectedPromo?.discount_type === 'fixed_price_per_item') return cart.reduce((sum, x) => sum + Math.max(0, Number(x.product.price) - Number(selectedPromo.fixed_item_price)) * x.quantity, 0)
    return 0
  }, [reward, selectedPromo, cart])
  const deliveryFee = form.fulfillment_type === 'delivery' ? Number(settings?.delivery_fee || 0) : 0
  const estimatedTotal = Math.max(0, cartSubtotal - estimatedDiscount + deliveryFee)

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  function validate() {
    if (!shopStatusLoading && !shopOpen) return <section className="section page-section"><div className="container narrow-container"><ClosedStoreNotice /></div></section>

  if (!cart.length) return 'ตะกร้าสินค้าว่าง'
    if (!form.name.trim()) return 'กรุณากรอกชื่อลูกค้า'
    if (!isThaiMobile(form.phone)) return 'กรุณากรอกเบอร์โทร 10 หลักให้ถูกต้อง'
    if (!shopOpen) return 'ขณะนี้ร้านปิดรับออเดอร์ (08:00 - 20:00)'
    if (form.fulfillment_type === 'delivery') {
      if (!form.house.trim() || !form.subdistrict.trim() || !form.district.trim() || !/^\d{5}$/.test(form.postcode)) return 'กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน'
    }
    if (reward === 'points' && (!points?.found || Number(points.points) < 10)) return 'แต้มไม่เพียงพอสำหรับแลกเครื่องดื่ม'
    if (['promptpay', 'bank_transfer'].includes(form.payment_method) && !slip) return 'กรุณาแนบสลิปเพื่อให้ Admin ตรวจสอบ'
    if (slip && (!slip.type.startsWith('image/') || slip.size > 5 * 1024 * 1024)) return 'สลิปต้องเป็นไฟล์รูปภาพขนาดไม่เกิน 5 MB'
    return ''
  }

  async function submit(e) {
    e.preventDefault()
    const validation = validate()
    if (validation) { setError(validation); return }
    setSubmitting(true); setError('')
    try {
      const slipPath = slip ? await uploadPaymentSlip(slip) : null
      const payload = {
        customer: { name: form.name.trim(), phone: form.phone },
        items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity, sweetness: x.sweetness })),
        fulfillment_type: form.fulfillment_type,
        delivery_address: form.fulfillment_type === 'delivery' ? {
          house: form.house.trim(), road: form.road.trim(), subdistrict: form.subdistrict.trim(), district: form.district.trim(), province: SHOP.deliveryProvince, postcode: form.postcode.trim(),
        } : null,
        payment_method: form.payment_method,
        slip_path: slipPath,
        note: form.note.trim(),
        promotion_id: selectedPromo?.id || null,
        redeem_points: reward === 'points',
      }
      const result = await createOrder(payload)
      clearCart()
      navigate('/order-success', { replace: true, state: result })
    } catch (e2) {
      setError(e2.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ')
    } finally { setSubmitting(false) }
  }

  if (!cart.length) return <section className="section page-section"><div className="container"><div className="empty-state">🛒<h2>{t('emptyCart')}</h2><Link className="button button-primary" to="/menu">{t('menu')}</Link></div></div></section>

  return (
    <section className="section page-section">
      <div className="container checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <div className="page-title align-left"><span className="eyebrow">CHECKOUT</span><h1>{t('checkout')}</h1></div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-card"><h2>1. {t('customerInfo')}</h2><div className="form-grid two"><label>{t('name')}<input value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={80} required /></label><label>{t('phone')}<input inputMode="numeric" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0XXXXXXXXX" maxLength={12} required /></label></div>{loadingPoints ? <small>กำลังเช็คแต้ม...</small> : points?.found ? <div className="points-inline">⭐ {points.name || 'ลูกค้า'} มี <strong>{points.points} แต้ม</strong></div> : isThaiMobile(form.phone) ? <small>เบอร์ใหม่ — ระบบจะสร้างสมาชิกอัตโนมัติเมื่อสั่งสำเร็จ</small> : null}</div>

          <div className="form-card"><h2>2. {t('fulfillment')}</h2><div className="radio-cards"><label className={form.fulfillment_type === 'pickup' ? 'selected' : ''}><input type="radio" name="fulfillment" checked={form.fulfillment_type === 'pickup'} onChange={() => update('fulfillment_type', 'pickup')} />🏪 <span><strong>{t('pickup')}</strong><small>รับที่ร้าน</small></span></label><label className={form.fulfillment_type === 'delivery' ? 'selected' : ''}><input type="radio" name="fulfillment" checked={form.fulfillment_type === 'delivery'} onChange={() => update('fulfillment_type', 'delivery')} />🛵 <span><strong>{t('delivery')}</strong><small>ส่งฟรีเฉพาะจังหวัดนครปฐม</small></span></label></div>{form.fulfillment_type === 'delivery' && <div className="address-box"><div className="form-grid two"><label>{t('house')}<input value={form.house} onChange={(e) => update('house', e.target.value)} /></label><label>{t('road')}<input value={form.road} onChange={(e) => update('road', e.target.value)} /></label><label>{t('subdistrict')}<input value={form.subdistrict} onChange={(e) => update('subdistrict', e.target.value)} /></label><label>{t('district')}<input value={form.district} onChange={(e) => update('district', e.target.value)} /></label><label>{t('province')}<input value={SHOP.deliveryProvince} readOnly /></label><label>{t('postcode')}<input inputMode="numeric" maxLength={5} value={form.postcode} onChange={(e) => update('postcode', e.target.value.replace(/\D/g, ''))} /></label></div></div>}</div>

          <div className="form-card"><h2>3. {t('promo')}</h2><div className="reward-options"><label><input type="radio" name="reward" checked={reward === 'none'} onChange={() => setReward('none')} /> {t('noPromo')}</label>{promos.map((p) => <label key={p.id}><input type="radio" name="reward" checked={reward === `promo:${p.id}`} onChange={() => setReward(`promo:${p.id}`)} /> 🎁 {language === 'th' ? p.name_th : p.name_en}</label>)}<label className={(points?.points || 0) < 10 ? 'disabled-option' : ''}><input type="radio" name="reward" disabled={(points?.points || 0) < 10} checked={reward === 'points'} onChange={() => setReward('points')} /> ⭐ {t('redeem')} {(points?.points || 0) < 10 && `(มี ${points?.points || 0})`}</label></div><small>โปรโมชั่นใช้ร่วมกันไม่ได้ ระบบจะคำนวณราคาจริงอีกครั้งใน Database</small></div>

          <div className="form-card"><h2>4. {t('payment')}</h2><div className="payment-grid">{[
            ['cash', '💵', t('cash'), false],
            ['promptpay', '📱', t('promptpay'), false],
            ['bank_transfer', '🏦', t('bankTransfer'), !settings?.bank_account_number],
            ['cash_on_delivery', '🛵', t('cod'), false],
          ].map(([value, icon, label, disabled]) => <label key={value} className={`${form.payment_method === value ? 'selected' : ''} ${disabled ? 'disabled-option' : ''}`}><input type="radio" name="payment" disabled={disabled} checked={form.payment_method === value} onChange={() => update('payment_method', value)} />{icon}<span>{label}{disabled ? ' (ยังไม่พร้อมใช้)' : ''}</span></label>)}</div>{form.payment_method === 'promptpay' && <div className="payment-note promptpay-box"><strong>PromptPay: {settings?.promptpay || SHOP.promptPay}</strong><span>ชื่อบัญชี: น้ำอร่อยจัง</span><PromptPayQR target={settings?.promptpay || SHOP.promptPay} /><span>ยอดที่ต้องชำระโดยประมาณ: <strong>{formatMoney(estimatedTotal)}</strong></span></div>}{form.payment_method === 'bank_transfer' && <div className="payment-note"><strong>โอนเงินผ่านธนาคาร</strong><span>{settings?.bank_account_number ? `${settings.bank_name || ''} ${settings.bank_account_number}` : 'ยังไม่ได้ตั้งค่าบัญชีธนาคารในหลังบ้าน'}</span></div>}{['promptpay', 'bank_transfer'].includes(form.payment_method) && <label className="upload-box">📎 {t('slip')}<input type="file" accept="image/*" onChange={(e) => setSlip(e.target.files?.[0] || null)} /><span>{slip ? slip.name : 'เลือกไฟล์รูปภาพ (ไม่เกิน 5 MB)'}</span></label>}</div>

          <div className="form-card"><h2>5. {t('note')}</h2><textarea rows="3" value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="เช่น ไม่ใส่น้ำแข็ง / โทรก่อนถึง" maxLength={300} /></div>
        </form>

        <aside className="order-summary-card"><h2>สรุปออเดอร์</h2><div className="summary-items">{cart.map((x) => <div key={x.key}><span>{language === 'th' ? x.product.name_th : x.product.name_en} × {x.quantity}<small>หวาน {x.sweetness}%</small></span><strong>{formatMoney(Number(x.product.price) * x.quantity)}</strong></div>)}</div><hr /><div className="summary-line"><span>{t('subtotal')}</span><strong>{formatMoney(cartSubtotal)}</strong></div>{estimatedDiscount > 0 && <div className="summary-line discount"><span>ส่วนลดโดยประมาณ</span><strong>-{formatMoney(estimatedDiscount)}</strong></div>}<div className="summary-line"><span>{t('deliveryFee')}</span><strong>{deliveryFee ? formatMoney(deliveryFee) : 'ฟรี'}</strong></div><div className="summary-total"><span>{t('total')}</span><strong>{formatMoney(estimatedTotal)}</strong></div><button onClick={submit} disabled={submitting || !shopOpen} className="button button-primary button-wide">{submitting ? 'กำลังสร้าง Order...' : `✓ ${t('placeOrder')}`}</button>{!shopStatusLoading && !shopOpen && <div className="alert alert-warning">ร้านเปิดรับออเดอร์ 08:00 - 20:00</div>}<small className="secure-note">🔒 ราคาจริงตรวจจาก Database ก่อนสร้าง Order</small></aside>
      </div>
    </section>
  )
}
