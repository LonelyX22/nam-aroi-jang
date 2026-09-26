import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { createOrder, getCustomerPoints, getShopSettings, listPromotions, uploadPaymentSlip } from '../lib/api'
import { formatMoney, isThaiMobile } from '../lib/format'
import { SHOP } from '../lib/constants'
import { useApp } from '../context/AppContext'
import PromptPayQR from '../components/PromptPayQR'
import ClosedStoreNotice from '../components/ClosedStoreNotice'

function promoAvailable(promo) {
  if (!promo.is_active) return false
  if (!promo.start_time || !promo.end_time) return true

  const now = new Date()
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return time >= promo.start_time.slice(0, 5) && time < promo.end_time.slice(0, 5)
}

function translateOrderError(message, language) {
  if (language !== 'en') return message

  const mappings = [
    ['ร้านปิดรับออเดอร์ในขณะนี้', 'The shop is currently closed for orders.'],
    ['ชื่อไม่ถูกต้อง', 'The customer name is invalid.'],
    ['เบอร์โทรไม่ถูกต้อง', 'The phone number is invalid.'],
    ['ส่ง Order ถี่เกินไป กรุณารอสักครู่', 'Too many orders were submitted. Please wait a moment and try again.'],
    ['วิธีรับสินค้าไม่ถูกต้อง', 'The fulfillment method is invalid.'],
    ['กรุณากรอกที่อยู่จัดส่งให้ครบ', 'Please complete the delivery address.'],
    ['ร้านจัดส่งเฉพาะจังหวัด', 'Delivery is available only within the configured province.'],
    ['วิธีชำระเงินไม่ถูกต้อง', 'The payment method is invalid.'],
    ['กรุณาแนบสลิป', 'Please attach a payment slip.'],
    ['ใช้โปรโมชั่นและแลกแต้มพร้อมกันไม่ได้', 'Promotions and point redemption cannot be used together.'],
    ['โปรโมชั่นไม่พร้อมใช้งาน', 'This promotion is not available.'],
    ['โปรโมชั่นยังไม่เริ่ม', 'This promotion has not started yet.'],
    ['โปรโมชั่นหมดอายุ', 'This promotion has expired.'],
    ['ยังไม่ถึงเวลาโปรโมชั่น', 'This promotion is not available at this time yet.'],
    ['หมดเวลาโปรโมชั่นแล้ว', 'This promotion is no longer available at this time.'],
    ['ไม่มีสินค้าใน Order', 'There are no items in this order.'],
    ['จำนวนสินค้าไม่ถูกต้อง', 'The item quantity is invalid.'],
    ['ระดับความหวานไม่ถูกต้อง', 'The selected sweetness level is invalid.'],
    ['มีเมนูที่ไม่พร้อมขาย', 'One or more drinks are currently unavailable.'],
    ['จำนวนสินค้าเกินกำหนดต่อ Order', 'The order exceeds the maximum item quantity.'],
    ['แต้มไม่เพียงพอ', 'You do not have enough points.'],
  ]

  const found = mappings.find(([th]) => String(message || '').includes(th))
  return found ? found[1] : message
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, cartSubtotal, clearCart, t, language } = useApp()
  const { shopOpen, shopStatusLoading } = useOutletContext()

  const [settings, setSettings] = useState(null)
  const [promos, setPromos] = useState([])
  const [points, setPoints] = useState(null)
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [slip, setSlip] = useState(null)
  const [reward, setReward] = useState('none')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    fulfillment_type: 'pickup',
    payment_method: 'cash',
    house: '',
    road: '',
    subdistrict: '',
    district: '',
    postcode: '',
    note: '',
  })

  useEffect(() => {
    Promise.all([getShopSettings(), listPromotions({ activeOnly: true })])
      .then(([shopSettings, promotionList]) => {
        setSettings(shopSettings)
        setPromos(promotionList.filter(promoAvailable))
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!isThaiMobile(form.phone)) {
      setPoints(null)
      return undefined
    }

    const timer = window.setTimeout(async () => {
      setLoadingPoints(true)
      try {
        setPoints(await getCustomerPoints(form.phone))
      } catch {
        setPoints(null)
      } finally {
        setLoadingPoints(false)
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [form.phone])

  const selectedPromo = reward.startsWith('promo:')
    ? promos.find((promo) => `promo:${promo.id}` === reward)
    : null

  const estimatedDiscount = useMemo(() => {
    if (reward === 'points' && cart.length) {
      return Math.min(...cart.map((item) => Number(item.product.price)))
    }

    if (selectedPromo?.discount_type === 'fixed_price_per_item') {
      return cart.reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.product.price) - Number(selectedPromo.fixed_item_price)) *
            item.quantity,
        0,
      )
    }

    return 0
  }, [reward, selectedPromo, cart])

  const deliveryFee =
    form.fulfillment_type === 'delivery' ? Number(settings?.delivery_fee || 0) : 0

  const estimatedTotal = Math.max(0, cartSubtotal - estimatedDiscount + deliveryFee)

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate() {
    if (!cart.length) return t('cartEmptyError')
    if (!form.name.trim()) return t('nameRequired')
    if (!isThaiMobile(form.phone)) return t('phoneInvalidFull')
    if (!shopOpen) return t('shopClosedError')

    if (form.fulfillment_type === 'delivery') {
      const addressComplete =
        form.house.trim() &&
        form.subdistrict.trim() &&
        form.district.trim() &&
        /^\d{5}$/.test(form.postcode)

      if (!addressComplete) return t('addressRequired')
    }

    if (reward === 'points' && (!points?.found || Number(points.points) < 10)) {
      return t('pointsInsufficient')
    }

    if (['promptpay', 'bank_transfer'].includes(form.payment_method) && !slip) {
      return t('slipRequired')
    }

    if (slip && (!slip.type.startsWith('image/') || slip.size > 5 * 1024 * 1024)) {
      return t('slipInvalid')
    }

    return ''
  }

  async function submit(e) {
    e.preventDefault()

    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const slipPath = slip ? await uploadPaymentSlip(slip) : null
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone,
        },
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          sweetness: item.sweetness,
        })),
        fulfillment_type: form.fulfillment_type,
        delivery_address:
          form.fulfillment_type === 'delivery'
            ? {
                house: form.house.trim(),
                road: form.road.trim(),
                subdistrict: form.subdistrict.trim(),
                district: form.district.trim(),
                province: SHOP.deliveryProvince,
                postcode: form.postcode.trim(),
              }
            : null,
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
      const rawMessage = e2.message || t('orderError')
      setError(translateOrderError(rawMessage, language))
    } finally {
      setSubmitting(false)
    }
  }

  if (!shopStatusLoading && !shopOpen) {
    return (
      <section className="section page-section">
        <div className="container narrow-container">
          <ClosedStoreNotice />
        </div>
      </section>
    )
  }

  if (!cart.length) {
    return (
      <section className="section page-section">
        <div className="container">
          <div className="empty-state">
            🛒
            <h2>{t('emptyCart')}</h2>
            <Link className="button button-primary" to="/menu">
              {t('menu')}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section page-section">
      <div className="container checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <div className="page-title align-left">
            <span className="eyebrow">CHECKOUT</span>
            <h1>{t('checkout')}</h1>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-card">
            <h2>1. {t('customerInfo')}</h2>
            <div className="form-grid two">
              <label>
                {t('name')}
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  maxLength={80}
                  required
                />
              </label>

              <label>
                {t('phone')}
                <input
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="0XXXXXXXXX"
                  maxLength={12}
                  required
                />
              </label>
            </div>

            {loadingPoints ? (
              <small>{t('loadingPoints')}</small>
            ) : points?.found ? (
              <div className="points-inline">
                ⭐ {points.name || t('customer')} {t('hasPoints')}{' '}
                <strong>
                  {points.points} {t('pointsUnit')}
                </strong>
              </div>
            ) : isThaiMobile(form.phone) ? (
              <small>{t('newCustomer')}</small>
            ) : null}
          </div>

          <div className="form-card">
            <h2>2. {t('fulfillment')}</h2>
            <div className="radio-cards">
              <label className={form.fulfillment_type === 'pickup' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="fulfillment"
                  checked={form.fulfillment_type === 'pickup'}
                  onChange={() => update('fulfillment_type', 'pickup')}
                />
                🏪
                <span>
                  <strong>{t('pickup')}</strong>
                  <small>{t('pickupAtShop')}</small>
                </span>
              </label>

              <label className={form.fulfillment_type === 'delivery' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="fulfillment"
                  checked={form.fulfillment_type === 'delivery'}
                  onChange={() => update('fulfillment_type', 'delivery')}
                />
                🛵
                <span>
                  <strong>{t('delivery')}</strong>
                  <small>{t('freeDeliveryNakhonPathom')}</small>
                </span>
              </label>
            </div>

            {form.fulfillment_type === 'delivery' && (
              <div className="address-box">
                <div className="form-grid two">
                  <label>
                    {t('house')}
                    <input value={form.house} onChange={(e) => update('house', e.target.value)} />
                  </label>
                  <label>
                    {t('road')}
                    <input value={form.road} onChange={(e) => update('road', e.target.value)} />
                  </label>
                  <label>
                    {t('subdistrict')}
                    <input
                      value={form.subdistrict}
                      onChange={(e) => update('subdistrict', e.target.value)}
                    />
                  </label>
                  <label>
                    {t('district')}
                    <input
                      value={form.district}
                      onChange={(e) => update('district', e.target.value)}
                    />
                  </label>
                  <label>
                    {t('province')}
                    <input value={language === 'th' ? SHOP.deliveryProvince : 'Nakhon Pathom'} readOnly />
                  </label>
                  <label>
                    {t('postcode')}
                    <input
                      inputMode="numeric"
                      maxLength={5}
                      value={form.postcode}
                      onChange={(e) => update('postcode', e.target.value.replace(/\D/g, ''))}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="form-card">
            <h2>3. {t('promo')}</h2>
            <div className="reward-options">
              <label>
                <input
                  type="radio"
                  name="reward"
                  checked={reward === 'none'}
                  onChange={() => setReward('none')}
                />{' '}
                {t('noPromo')}
              </label>

              {promos.map((promo) => (
                <label key={promo.id}>
                  <input
                    type="radio"
                    name="reward"
                    checked={reward === `promo:${promo.id}`}
                    onChange={() => setReward(`promo:${promo.id}`)}
                  />{' '}
                  🎁 {language === 'th' ? promo.name_th : promo.name_en}
                </label>
              ))}

              <label className={(points?.points || 0) < 10 ? 'disabled-option' : ''}>
                <input
                  type="radio"
                  name="reward"
                  disabled={(points?.points || 0) < 10}
                  checked={reward === 'points'}
                  onChange={() => setReward('points')}
                />{' '}
                ⭐ {t('redeem')}{' '}
                {(points?.points || 0) < 10 &&
                  `(${t('insufficientPointsSuffix')} ${points?.points || 0})`}
              </label>
            </div>
            <small>{t('promoExclusive')}</small>
          </div>

          <div className="form-card">
            <h2>4. {t('payment')}</h2>

            <div className="payment-grid">
              {[
                ['cash', '💵', t('cash'), false],
                ['promptpay', '📱', t('promptpay'), false],
                ['bank_transfer', '🏦', t('bankTransfer'), !settings?.bank_account_number],
                ['cash_on_delivery', '🛵', t('cod'), false],
              ].map(([value, icon, label, disabled]) => (
                <label
                  key={value}
                  className={`${form.payment_method === value ? 'selected' : ''} ${
                    disabled ? 'disabled-option' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    disabled={disabled}
                    checked={form.payment_method === value}
                    onChange={() => update('payment_method', value)}
                  />
                  {icon}
                  <span>
                    {label}
                    {disabled ? ` (${t('unavailable')})` : ''}
                  </span>
                </label>
              ))}
            </div>

            {form.payment_method === 'promptpay' && (
              <div className="payment-note promptpay-box">
                <strong>PromptPay: {settings?.promptpay || SHOP.promptPay}</strong>
                <span>
                  {t('accountName')}: {language === 'th' ? SHOP.nameTh : SHOP.nameEn}
                </span>
                <PromptPayQR target={settings?.promptpay || SHOP.promptPay} />
                <span>
                  {t('estimatedAmount')}: <strong>{formatMoney(estimatedTotal)}</strong>
                </span>
              </div>
            )}

            {form.payment_method === 'bank_transfer' && (
              <div className="payment-note">
                <strong>{t('bankPayment')}</strong>
                <span>
                  {settings?.bank_account_number
                    ? `${settings.bank_name || ''} ${settings.bank_account_number}`
                    : t('bankNotConfigured')}
                </span>
              </div>
            )}

            {['promptpay', 'bank_transfer'].includes(form.payment_method) && (
              <label className="upload-box">
                📎 {t('slip')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSlip(e.target.files?.[0] || null)}
                />
                <span>{slip ? slip.name : t('chooseImage')}</span>
              </label>
            )}
          </div>

          <div className="form-card">
            <h2>5. {t('note')}</h2>
            <textarea
              rows="3"
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
              placeholder={t('notePlaceholder')}
              maxLength={300}
            />
          </div>
        </form>

        <aside className="order-summary-card">
          <h2>{t('orderSummary')}</h2>

          <div className="summary-items">
            {cart.map((item) => (
              <div key={item.key}>
                <span>
                  {language === 'th' ? item.product.name_th : item.product.name_en} × {item.quantity}
                  <small>
                    {t('cartSweetness')} {item.sweetness}%
                  </small>
                </span>
                <strong>{formatMoney(Number(item.product.price) * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <hr />

          <div className="summary-line">
            <span>{t('subtotal')}</span>
            <strong>{formatMoney(cartSubtotal)}</strong>
          </div>

          {estimatedDiscount > 0 && (
            <div className="summary-line discount">
              <span>{t('estimatedDiscount')}</span>
              <strong>-{formatMoney(estimatedDiscount)}</strong>
            </div>
          )}

          <div className="summary-line">
            <span>{t('deliveryFee')}</span>
            <strong>{deliveryFee ? formatMoney(deliveryFee) : t('free')}</strong>
          </div>

          <div className="summary-total">
            <span>{t('total')}</span>
            <strong>{formatMoney(estimatedTotal)}</strong>
          </div>

          <button
            onClick={submit}
            disabled={submitting || !shopOpen}
            className="button button-primary button-wide"
          >
            {submitting ? t('creatingOrder') : `✓ ${t('placeOrder')}`}
          </button>

          {!shopStatusLoading && !shopOpen && (
            <div className="alert alert-warning">{t('storeHoursWarning')}</div>
          )}

          <small className="secure-note">🔒 {t('securePrice')}</small>
        </aside>
      </div>
    </section>
  )
}
