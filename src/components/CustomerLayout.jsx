import { NavLink, Outlet, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { SHOP } from '../lib/constants'
import { supabaseConfigured } from '../lib/supabase'
import { getShopSettings } from '../lib/api'
import { shopIsOpen } from '../lib/format'

export default function CustomerLayout() {
  const { language, setLanguage, t, cartCount } = useApp()
  const [shopSettings, setShopSettings] = useState(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [shopStatusLoading, setShopStatusLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    getShopSettings()
      .then((settings) => {
        if (!mounted) return
        setShopSettings(settings)
        setShopOpen(shopIsOpen(settings))
      })
      .finally(() => {
        if (mounted) setShopStatusLoading(false)
      })

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!shopSettings) return undefined

    let active = true

    const refreshStatus = async () => {
      try {
        const latest = await getShopSettings()
        if (!active) return
        setShopSettings(latest)
        setShopOpen(shopIsOpen(latest))
      } catch {
        if (active) setShopOpen(shopIsOpen(shopSettings))
      }
    }

    const timer = window.setInterval(refreshStatus, 15000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [shopSettings])

  const closed = !shopStatusLoading && !shopOpen

  function blockWhenClosed(event) {
    if (closed) event.preventDefault()
  }

  return (
    <div className="site-shell">
      {!supabaseConfigured && <div className="demo-banner">{language === 'th' ? 'DEMO MODE — ยังไม่เชื่อม Supabase ข้อมูลจะอยู่เฉพาะ Browser นี้' : 'DEMO MODE — Supabase is not connected. Data is stored only in this browser.'}</div>}
      {closed && (
        <div className="closed-strip" role="status">
          🌙 {t('shopClosedBanner')}
        </div>
      )}
      <header className="customer-header">
        <div className="container header-inner">
          <Link to="/" className="brand-link">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt={SHOP.nameTh} className="brand-logo" />
            <div className="brand-text">
              <strong>{language === 'th' ? SHOP.nameTh : SHOP.nameEn}</strong>
              <span>{t('brandTagline')}</span>
            </div>
          </Link>
          <nav className="desktop-nav">
            <NavLink to="/">{t('home')}</NavLink>
            <NavLink
              to="/menu"
              onClick={blockWhenClosed}
              className={({ isActive }) => `${isActive ? 'active ' : ''}${closed ? 'nav-disabled' : ''}`}
              aria-disabled={closed}
            >
              {t('menu')}
            </NavLink>
            <NavLink to="/points">{t('points')}</NavLink>
            <NavLink to="/track">{t('track')}</NavLink>
          </nav>
          <div className="header-actions">
            <button className="language-switch" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} aria-label="Switch language">
              {language === 'th' ? 'EN' : 'TH'}
            </button>
            <Link
              to="/cart"
              onClick={blockWhenClosed}
              className={`cart-button ${closed ? 'nav-disabled' : ''}`}
              aria-disabled={closed}
            >
              🛒 <span>{cartCount}</span>
            </Link>
          </div>
        </div>
      </header>
      <main>
        <Outlet context={{ shopSettings, shopOpen, shopStatusLoading }} />
      </main>
      <footer className="customer-footer">
        <div className="container footer-grid">
          <div><strong>{language === 'th' ? SHOP.nameTh : SHOP.nameEn}</strong><p>{t('openDaily')} {SHOP.openTime} - {SHOP.closeTime}</p></div>
          <div><strong>{language === 'th' ? 'ติดต่อ' : 'Contact'}</strong><p>{SHOP.phone}<br />Facebook / LINE / Instagram: {language === 'th' ? SHOP.nameTh : SHOP.nameEn}</p></div>
          <div><Link to="/admin/login" className="footer-admin-link">{language === 'th' ? 'เข้าสู่ระบบหลังบ้าน' : 'Admin login'}</Link></div>
        </div>
      </footer>
      <nav className="mobile-bottom-nav">
        <NavLink to="/">🏠<span>{t('home')}</span></NavLink>
        <NavLink
          to="/menu"
          onClick={blockWhenClosed}
          className={({ isActive }) => `${isActive ? 'active ' : ''}${closed ? 'nav-disabled' : ''}`}
          aria-disabled={closed}
        >
          🥤<span>{t('menu')}</span>
        </NavLink>
        <NavLink to="/points">⭐<span>{t('points')}</span></NavLink>
        <NavLink to="/track">📦<span>{t('track')}</span></NavLink>
        <NavLink
          to="/cart"
          onClick={blockWhenClosed}
          className={({ isActive }) => `${isActive ? 'active ' : ''}${closed ? 'nav-disabled' : ''}`}
          aria-disabled={closed}
        >
          🛒<span>{t('cart')} {cartCount ? `(${cartCount})` : ''}</span>
        </NavLink>
      </nav>
    </div>
  )
}
