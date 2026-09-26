import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getShopSettings, listProducts } from '../lib/api'
import { shopIsOpen } from '../lib/format'
import { useApp } from '../context/AppContext'

export default function HomePage() {
  const { t, language } = useApp()
  const [settings, setSettings] = useState(null)
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getShopSettings(), listProducts()])
      .then(([s, p]) => { setSettings(s); setProducts(p.slice(0, 4)) })
      .catch((e) => setError(e.message))
  }, [])

  const open = shopIsOpen(settings)
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">NAM AROI JANG • นครปฐม</span>
            <h1>{language === 'th' ? 'สดชื่นทุกแก้ว' : 'A little happiness in every cup'}<br /><em>{language === 'th' ? 'อร่อยจังทุกวัน' : 'made fresh for you'}</em></h1>
            <p>{language === 'th' ? 'เครื่องดื่มน่ารัก ราคาเป็นมิตร เลือกระดับความหวานได้ พร้อมสะสมแต้มทุกแก้ว' : 'Cute drinks, friendly prices, customizable sweetness, and rewards with every cup.'}</p>
            <div className="hero-actions">
              <Link to="/menu" className="button button-primary">🥤 {t('orderNow')}</Link>
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
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="น้ำอร่อยจัง" />
            <div className="hero-sticker sticker-one">10 แต้ม = ฟรี 1 แก้ว ⭐</div>
            <div className="hero-sticker sticker-two">ส่งฟรีในนครปฐม 🛵</div>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div className="container feature-grid">
          <div>🕗 <strong>08:00 - 20:00</strong><span>เปิดทุกวัน</span></div>
          <div>⭐ <strong>1 แก้ว = 1 แต้ม</strong><span>แต้มไม่มีวันหมดอายุ</span></div>
          <div>🛵 <strong>ส่งฟรี</strong><span>ภายในจังหวัดนครปฐม</span></div>
          <div>💳 <strong>จ่ายได้หลายแบบ</strong><span>เงินสด / PromptPay / โอน</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">POPULAR</span><h2>{t('featured')}</h2></div><Link to="/menu" className="text-link">{t('allMenu')} →</Link></div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <section className="section promo-section">
        <div className="container promo-card">
          <div><span className="promo-icon">🌞</span><span className="eyebrow">MORNING DEAL</span><h2>08:00 - 10:00<br /><em>แก้วละ 25 บาท</em></h2><p>โปรโมชั่นเช้าใช้ร่วมกับการแลกแต้มไม่ได้ เลือกได้ 1 โปรโมชั่นต่อออเดอร์</p><Link className="button button-primary" to="/menu">เลือกเครื่องดื่ม</Link></div>
          <div className="promo-art">🧋<span>✨</span></div>
        </div>
      </section>
    </>
  )
}
