import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatMoney } from '../lib/format'

export default function CartPage() {
  const { cart, updateCart, cartSubtotal, language, t } = useApp()
  if (!cart.length) return <section className="section page-section"><div className="container"><div className="empty-state">🛒<h2>{t('emptyCart')}</h2><Link className="button button-primary" to="/menu">{t('menu')}</Link></div></div></section>
  return (
    <section className="section page-section">
      <div className="container narrow-container">
        <div className="page-title"><span className="eyebrow">YOUR ORDER</span><h1>{t('cart')}</h1></div>
        <div className="cart-list">
          {cart.map((item) => {
            const name = language === 'th' ? item.product.name_th : item.product.name_en
            return <div className="cart-item" key={item.key}><div className="mini-art">{item.product.emoji || '🥤'}</div><div className="cart-item-main"><strong>{name}</strong><span>หวาน {item.sweetness}% • {formatMoney(item.product.price)}/แก้ว</span></div><div className="stepper"><button onClick={() => updateCart(item.key, item.quantity - 1)}>−</button><strong>{item.quantity}</strong><button onClick={() => updateCart(item.key, item.quantity + 1)}>+</button></div><strong>{formatMoney(item.product.price * item.quantity)}</strong></div>
          })}
        </div>
        <div className="cart-summary"><div><span>{t('subtotal')}</span><strong>{formatMoney(cartSubtotal)}</strong></div><small>ส่วนลด/โปรโมชั่นจะคำนวณในหน้า Checkout</small><Link to="/checkout" className="button button-primary button-wide">{t('checkout')} →</Link></div>
      </div>
    </section>
  )
}
