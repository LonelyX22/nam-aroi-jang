import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ClosedStoreNotice({ compact = false }) {
  const { t } = useApp()
  return (
    <div className={`closed-store-card ${compact ? 'compact' : ''}`}>
      <div className="closed-store-icon" aria-hidden="true">🌙</div>
      <div>
        <span className="eyebrow">SHOP CLOSED</span>
        <h2>{t('shopClosedNow')}</h2>
        <p>{t('openDaily')} <strong>08:00 - 20:00</strong></p>
        <p className="muted">{t('shopClosedDescription')}</p>
        {!compact && (
          <div className="closed-store-actions">
            <Link to="/points" className="button button-outline">⭐ {t('checkPointsAction')}</Link>
            <Link to="/track" className="button button-outline">📦 {t('trackAction')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}
