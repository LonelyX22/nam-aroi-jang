import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from '../lib/i18n'

const AppContext = createContext(null)
const CART_KEY = 'nam-aroi-jang-cart-v1'

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('naj-language') || 'th')
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => localStorage.setItem('naj-language', language), [language])
  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart])

  const t = (key) => translations[language]?.[key] || translations.th[key] || key

  function addToCart(product, quantity, sweetness) {
    setCart((current) => {
      const key = `${product.id}:${sweetness}`
      const existing = current.find((x) => x.key === key)
      if (existing) return current.map((x) => x.key === key ? { ...x, quantity: x.quantity + quantity } : x)
      return [...current, { key, product, quantity, sweetness }]
    })
  }

  function updateCart(key, quantity) {
    setCart((current) => quantity <= 0 ? current.filter((x) => x.key !== key) : current.map((x) => x.key === key ? { ...x, quantity } : x))
  }

  function clearCart() { setCart([]) }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    cart,
    addToCart,
    updateCart,
    clearCart,
    cartCount,
    cartSubtotal,
  }), [language, cart, cartCount, cartSubtotal])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
