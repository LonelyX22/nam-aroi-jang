import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const authHeader = req.headers.get('Authorization') || ''

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const admin = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const { data: owner } = await admin.from('profiles').select('id,role,is_active').eq('id', userData.user.id).single()
    if (!owner || owner.role !== 'owner' || !owner.is_active) return json({ error: 'Owner permission required' }, 403)

    const body = await req.json()
    const action = String(body.action || '')

    if (action === 'invite') {
      const email = String(body.email || '').trim().toLowerCase()
      const displayName = String(body.display_name || '').trim()
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Invalid email' }, 400)
      if (!displayName || displayName.length > 80) return json({ error: 'Invalid display name' }, 400)

      const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'staff')
      if ((count || 0) >= 4) return json({ error: 'กำหนด Staff สูงสุดไว้ 4 คน' }, 400)

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName },
        redirectTo: `${siteUrl.replace(/\/$/, '')}/admin/set-password`,
      })
      if (error) return json({ error: error.message }, 400)

      await admin.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: displayName,
        role: 'staff',
        is_active: true,
        created_by: userData.user.id,
      })
      return json({ ok: true, user_id: data.user.id })
    }

    const targetId = String(body.user_id || '')
    if (!targetId) return json({ error: 'user_id is required' }, 400)
    const { data: target } = await admin.from('profiles').select('id,role,email').eq('id', targetId).single()
    if (!target) return json({ error: 'Staff not found' }, 404)
    if (target.role === 'owner') return json({ error: 'Owner account cannot be changed here' }, 400)

    if (action === 'disable' || action === 'enable') {
      const { error } = await admin.from('profiles').update({ is_active: action === 'enable' }).eq('id', targetId)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    if (action === 'remove') {
      const { error } = await admin.auth.admin.deleteUser(targetId)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
