import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { listProducts } from '../lib/api'
import { useApp } from '../context/AppContext'

export default function HomePage() {
  const { t, language } = useApp()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const { shopOpen, shopStatusLoading } = useOutletContext()

  useEffect(() => {
    listProducts()
      .then((p) => setProducts(p.slice(0, 4)))
      .catch((e) => setError(e.message))
  }, [])

  const open = !shopStatusLoading && shopOpen
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{language === 'th' ? 'NAM AROI JANG • นครปฐม' : 'NAM AROI JANG • NAKHON PATHOM'}</span>
            <h1>{language === 'th' ? 'สดชื่นทุกแก้ว' : 'A little happiness in every cup'}<br /><em>{language === 'th' ? 'อร่อยจังทุกวัน' : 'made fresh for you'}</em></h1>
            <p>{language === 'th' ? 'เครื่องดื่มน่ารัก ราคาเป็นมิตร เลือกระดับความหวานได้ พร้อมสะสมแต้มทุกแก้ว' : 'Cute drinks, friendly prices, customizable sweetness, and rewards with every cup.'}</p>
            <div className="hero-actions">
              {open
                ? <Link to="/menu" className="button button-primary">🥤 {t('orderNow')}</Link>
                : <span className="button button-primary button-disabled" aria-disabled="true">🌙 {t('shopClosedNow')}</span>}
              <Link to="/points" className="button button-outline">⭐ {t('points')}</Link>
            </div>
            <div className={`shop-status ${open ? 'is-open' : 'is-closed'}`}>
              <span className="status-dot" />
              <div><strong>{open ? t('open') : t('closed')}</strong><small>{t('openHours')}</small></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="bubble bubble-one" />
            <div className="bubble bubble-two" />
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt={language === 'th' ? 'น้ำอร่อยจัง' : 'Nam Aroi Jang'} />
            <div className="hero-sticker sticker-one">{t('tenPointsFree')} ⭐</div>
            <div className="hero-sticker sticker-two">{t('freeDelivery')} {language === 'th' ? 'ในนครปฐม' : 'in Nakhon Pathom'} 🛵</div>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div className="container feature-grid">
          <div>🕗 <strong>08:00 - 20:00</strong><span>{t('openDaily')}</span></div>
          <div>⭐ <strong>{t('pointRate')}</strong><span>{t('pointsNeverExpire')}</span></div>
          <div>🛵 <strong>{t('freeDelivery')}</strong><span>{t('withinNakhonPathom')}</span></div>
          <div>💳 <strong>{t('multiplePayments')}</strong><span>{t('paymentMethodsShort')}</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">POPULAR</span><h2>{t('featured')}</h2></div>{open ? <Link to="/menu" className="text-link">{t('allMenu')} →</Link> : <span className="text-link disabled-link">{t('closed')}</span>}</div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} shopOpen={open} />)}
          </div>
        </div>
      </section>

      <section className="section promo-section">
        <div className="container promo-card">
          <div><span className="promo-icon">🌞</span><span className="eyebrow">MORNING DEAL</span><h2>08:00 - 10:00<br /><em>{t('morningPrice')}</em></h2><p>{t('morningPromoDesc')}</p>{open
              ? <Link className="button button-primary" to="/menu">{t('chooseDrink')}</Link>
              : <span className="button button-primary button-disabled" aria-disabled="true">{t('shopClosedShort')}</span>}</div>
          <div className="promo-art">🧋<span>✨</span></div>
        </div>
      </section>
    </>
  )
}
