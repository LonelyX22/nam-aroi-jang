import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatMoney } from '../lib/format'
import { useApp } from '../context/AppContext'

export default function OrderSuccessPage() {
  const { state } = useLocation()
  const { t } = useApp()
  const [copied, setCopied] = useState(false)

  if (!state?.order_number) {
    return (
      <section className="section page-section">
        <div className="container">
          <div className="empty-state">
            <h2>{t('orderDataNotFound')}</h2>
            <Link to="/menu" className="button button-primary">{t('backToMenu')}</Link>
          </div>
        </div>
      </section>
    )
  }

  const trackingCode = state.tracking_code || state.tracking_token || ''

  async function copyTrackingCode() {
    if (!trackingCode) return

    try {
      await navigator.clipboard.writeText(trackingCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be blocked in some browsers.
    }
  }

  return (
    <section className="section page-section">
      <div className="container">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <span className="eyebrow">ORDER RECEIVED</span>
          <h1>{t('orderSuccess')}</h1>
          <p>{t('thankYou')}</p>

          <div className="success-number">
            <span>Order Number</span>
            <strong>{state.order_number}</strong>
          </div>

          {trackingCode && (
            <div className="tracking-code-card">
              <span>{t('trackingCodeLabel')}</span>
              <strong>{trackingCode}</strong>
              <small>{t('trackingCodeHint')}</small>
              <button type="button" className="button button-soft" onClick={copyTrackingCode}>
                {copied ? `✓ ${t('copied')}` : `📋 ${t('copyTrackingCode')}`}
              </button>
            </div>
          )}

          <div className="success-total">
            {t('orderTotal')} <strong>{formatMoney(state.total)}</strong>
          </div>

          <p className="muted">{t('saveOrderHint')}</p>

          <div className="hero-actions">
            {trackingCode && (
              <Link
                to={`/track?code=${encodeURIComponent(trackingCode)}`}
                className="button button-primary"
              >
                📦 {t('trackAction')}
              </Link>
            )}
            <Link to="/" className="button button-outline">{t('backHome')}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
