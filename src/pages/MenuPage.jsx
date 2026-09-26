import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { listProducts } from '../lib/api'
import { useApp } from '../context/AppContext'
import ClosedStoreNotice from '../components/ClosedStoreNotice'

export default function MenuPage() {
  const { t, language } = useApp()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { shopOpen, shopStatusLoading } = useOutletContext()

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => products.filter((p) => {
    const name = `${p.name_th} ${p.name_en}`.toLowerCase()
    return name.includes(query.toLowerCase())
  }), [products, query])

  return (
    <section className="section page-section">
      <div className="container">
        <div className="page-title"><span className="eyebrow">DRINK MENU</span><h1>{t('allMenu')}</h1><p>{language === 'th' ? 'กดเลือกเมนูเพื่อดูส่วนผสม แคลอรี และเลือกระดับความหวาน' : 'Choose a drink to view ingredients, calories, and sweetness options.'}</p></div>
        <div className="search-bar"><span>🔎</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'th' ? 'ค้นหาเมนู...' : 'Search drinks...'} /></div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? <div className="page-loader">กำลังโหลดเมนู...</div> : <div className="product-grid">{filtered.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
        {!loading && filtered.length === 0 && <div className="empty-state">🥤<h3>ไม่พบเมนู</h3></div>}
      </div>
    </section>
  )
}
