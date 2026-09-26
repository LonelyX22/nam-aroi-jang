import { NavLink, Outlet, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { SHOP } from '../lib/constants'
import { supabaseConfigured } from '../lib/supabase'

export default function CustomerLayout() {
  const { language, setLanguage, t, cartCount } = useApp()
  return (
    <div className="site-shell">
      {!supabaseConfigured && <div className="demo-banner">DEMO MODE — ยังไม่เชื่อม Supabase ข้อมูลจะอยู่เฉพาะ Browser นี้</div>}
      <header className="customer-header">
        <div className="container header-inner">
          <Link to="/" className="brand-link">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt={SHOP.nameTh} className="brand-logo" />
            <div className="brand-text">
              <strong>{SHOP.nameTh}</strong>
              <span>สดชื่นทุกแก้ว อร่อยจังทุกวัน</span>
            </div>
          </Link>
          <nav className="desktop-nav">
            <NavLink to="/">{t('home')}</NavLink>
            <NavLink to="/menu">{t('menu')}</NavLink>
            <NavLink to="/points">{t('points')}</NavLink>
            <NavLink to="/track">{t('track')}</NavLink>
          </nav>
          <div className="header-actions">
            <button className="language-switch" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} aria-label="Switch language">
              {language === 'th' ? 'EN' : 'TH'}
            </button>
            <Link to="/cart" className="cart-button">🛒 <span>{cartCount}</span></Link>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="customer-footer">
        <div className="container footer-grid">
          <div><strong>{SHOP.nameTh}</strong><p>เปิดทุกวัน {SHOP.openTime} - {SHOP.closeTime}</p></div>
          <div><strong>ติดต่อ</strong><p>{SHOP.phone}<br />Facebook / LINE / Instagram: {SHOP.nameTh}</p></div>
          <div><Link to="/admin/login" className="footer-admin-link">เข้าสู่ระบบหลังบ้าน</Link></div>
        </div>
      </footer>
      <nav className="mobile-bottom-nav">
        <NavLink to="/">🏠<span>{t('home')}</span></NavLink>
        <NavLink to="/menu">🥤<span>{t('menu')}</span></NavLink>
        <NavLink to="/points">⭐<span>{t('points')}</span></NavLink>
        <NavLink to="/track">📦<span>{t('track')}</span></NavLink>
        <NavLink to="/cart">🛒<span>{t('cart')} {cartCount ? `(${cartCount})` : ''}</span></NavLink>
      </nav>
    </div>
  )
}
