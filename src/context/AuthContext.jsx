import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { SHOP } from '../lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) {
      const demo = localStorage.getItem('naj-demo-admin') === '1'
      if (demo) {
        setSession({ user: { id: 'owner-demo', email: SHOP.ownerEmail } })
        setProfile({ id: 'owner-demo', email: SHOP.ownerEmail, display_name: 'Owner', role: 'owner', is_active: true })
      }
      setLoading(false)
      return
    }

    let mounted = true
    async function hydrate(nextSession) {
      if (!mounted) return
      setSession(nextSession)
      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', nextSession.user.id).maybeSingle()
      if (error) console.error(error)
      setProfile(data || null)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => hydrate(nextSession))
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    setLoading(true)
    if (!supabaseConfigured) {
      if (email.toLowerCase() !== SHOP.ownerEmail.toLowerCase() || password !== 'demo1234') {
        setLoading(false)
        throw new Error('Demo: ใช้ Owner Email และรหัส demo1234')
      }
      localStorage.setItem('naj-demo-admin', '1')
      setSession({ user: { id: 'owner-demo', email } })
      setProfile({ id: 'owner-demo', email, display_name: 'Owner', role: 'owner', is_active: true })
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) throw error
  }

  async function signOut() {
    if (!supabaseConfigured) {
      localStorage.removeItem('naj-demo-admin')
      setSession(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
  }

  const value = useMemo(() => ({ session, profile, loading, signIn, signOut, configured: supabaseConfigured }), [session, profile, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
