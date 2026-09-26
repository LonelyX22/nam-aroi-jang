import { Link, useLocation } from 'react-router-dom'
import { formatMoney } from '../lib/format'
import { useApp } from '../context/AppContext'

export default function OrderSuccessPage() {
  const { state } = useLocation()
  const { t } = useApp()
  if (!state?.order_number) return <section className="section page-section"><div className="container"><div className="empty-state"><h2>{t('orderDataNotFound')}</h2><Link to="/menu" className="button button-primary">{t('backToMenu')}</Link></div></div></section>
  return <section className="section page-section"><div className="container"><div className="success-card"><div className="success-icon">✓</div><span className="eyebrow">ORDER RECEIVED</span><h1>{t('orderSuccess')}</h1><p>{t('thankYou')}</p><div className="success-number"><span>Order Number</span><strong>{state.order_number}</strong></div><div className="success-total">{t('orderTotal')} <strong>{formatMoney(state.total)}</strong></div><p className="muted">{t('saveOrderHint')}</p><div className="hero-actions"><Link to={`/track?token=${encodeURIComponent(state.tracking_token)}`} className="button button-primary">📦 {t('trackAction')}</Link><Link to="/" className="button button-outline">{t('backHome')}</Link></div></div></div></section>
}
