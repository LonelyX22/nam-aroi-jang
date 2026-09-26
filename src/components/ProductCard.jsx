import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatMoney } from '../lib/format'

export default function ProductCard({ product, shopOpen = true }) {
  const { language, t } = useApp()
  const name = language === 'th' ? product.name_th : product.name_en
  const disabled = !shopOpen || !product.is_available

  return (
    <article className={`product-card ${disabled ? 'sold-out' : ''}`}>
      <div className="product-art">
        {product.image_url ? <img src={product.image_url} alt={name} /> : <span>{product.emoji || '🥤'}</span>}
      </div>
      <div className="product-card-body">
        <div><h3>{name}</h3><p>{product.calories} kcal</p></div>
        <strong className="price">{formatMoney(product.price)}</strong>
      </div>
      {!shopOpen
        ? <span className="sold-out-label">ร้านปิดอยู่</span>
        : product.is_available
          ? <Link to={`/menu/${product.id}`} className="button button-soft">{t('viewDetails')}</Link>
          : <span className="sold-out-label">สินค้าหมด</span>}
    </article>
  )
}
