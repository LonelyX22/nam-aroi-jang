import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProduct } from '../lib/api'
import { formatMoney } from '../lib/format'
import { SWEETNESS_LEVELS } from '../lib/constants'
import { useApp } from '../context/AppContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language, t, addToCart } = useApp()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [sweetness, setSweetness] = useState(100)

  useEffect(() => {
    getProduct(id).then(setProduct).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-loader">กำลังโหลด...</div>
  if (!product) return <div className="center-card"><h2>ไม่พบเมนู</h2><Link to="/menu">กลับหน้าเมนู</Link></div>

  const name = language === 'th' ? product.name_th : product.name_en
  const ingredients = language === 'th' ? product.ingredients_th : product.ingredients_en

  function add() {
    addToCart(product, quantity, sweetness)
    navigate('/cart')
  }

  return (
    <section className="section page-section">
      <div className="container product-detail-grid">
        <div className="detail-art">{product.image_url ? <img src={product.image_url} alt={name} /> : <span>{product.emoji || '🥤'}</span>}</div>
        <div className="detail-panel">
          <Link className="text-link" to="/menu">← {t('backToMenu')}</Link>
          <h1>{name}</h1>
          <div className="detail-price">{formatMoney(product.price)}</div>
          <div className="info-grid">
            <div className="info-card"><strong>🥛 {t('ingredients')}</strong><ul>{(ingredients || []).map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div className="info-card"><strong>🔥 {t('calories')}</strong><span className="big-number">{product.calories} kcal</span><small>ค่าประมาณต่อ 1 แก้ว</small></div>
          </div>
          <div className="choice-block"><label>{t('sweetness')}</label><div className="choice-pills">{SWEETNESS_LEVELS.map((level) => <button key={level} className={sweetness === level ? 'active' : ''} onClick={() => setSweetness(level)}>{level}%</button>)}</div></div>
          <div className="quantity-row"><label>{t('quantity')}</label><div className="stepper"><button onClick={() => setQuantity((v) => Math.max(1, v - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity((v) => Math.min(20, v + 1))}>+</button></div></div>
          <button disabled={!product.is_available} className="button button-primary button-wide" onClick={add}>🛒 {t('addToCart')} • {formatMoney(product.price * quantity)}</button>
        </div>
      </div>
    </section>
  )
}
