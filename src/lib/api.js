import { supabase, supabaseConfigured } from './supabase'
import { demoStore } from './demoStore'
import { normalizePhone } from './format'

function assertNoError(error) {
  if (error) throw error
}

function nowIso() {
  return new Date().toISOString()
}

function demoOrderNumber(count) {
  const d = new Date()
  const date = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `NAJ-${date}-${String(count + 1).padStart(4, '0')}`
}

export async function getShopSettings() {
  if (!supabaseConfigured) return demoStore.get().settings
  const { data, error } = await supabase.from('shop_settings').select('*').eq('id', 1).single()
  assertNoError(error)
  return data
}

export async function updateShopSettings(patch) {
  if (!supabaseConfigured) {
    return demoStore.update((db) => {
      db.settings = { ...db.settings, ...patch }
      return db
    }).settings
  }
  const { data, error } = await supabase.from('shop_settings').update(patch).eq('id', 1).select().single()
  assertNoError(error)
  return data
}

export async function listProducts({ includeUnavailable = false } = {}) {
  if (!supabaseConfigured) {
    const items = demoStore.get().products
    return items.filter((x) => includeUnavailable || x.is_available).sort((a, b) => a.sort_order - b.sort_order)
  }
  let query = supabase.from('products').select('*').order('sort_order').order('created_at')
  if (!includeUnavailable) query = query.eq('is_available', true)
  const { data, error } = await query
  assertNoError(error)
  return data || []
}

export async function getProduct(id) {
  if (!supabaseConfigured) return demoStore.get().products.find((x) => String(x.id) === String(id)) || null
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
  assertNoError(error)
  return data
}

export async function uploadProductImage(file) {
  if (!file) return null
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    throw new Error('รูปสินค้าต้องเป็นไฟล์ภาพขนาดไม่เกิน 5 MB')
  }
  if (!supabaseConfigured) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'))
      reader.readAsDataURL(file)
    })
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `products/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  assertNoError(error)
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

export async function saveProduct(product) {
  if (!supabaseConfigured) {
    let saved
    demoStore.update((db) => {
      if (product.id && db.products.some((x) => x.id === product.id)) {
        db.products = db.products.map((x) => x.id === product.id ? { ...x, ...product } : x)
        saved = db.products.find((x) => x.id === product.id)
      } else {
        saved = { ...product, id: crypto.randomUUID(), created_at: nowIso(), sort_order: db.products.length + 1 }
        db.products.push(saved)
      }
      return db
    })
    return saved
  }
  const payload = { ...product }
  if (!payload.id) delete payload.id
  const { data, error } = payload.id
    ? await supabase.from('products').update(payload).eq('id', payload.id).select().single()
    : await supabase.from('products').insert(payload).select().single()
  assertNoError(error)
  return data
}

export async function deleteProduct(id) {
  if (!supabaseConfigured) {
    demoStore.update((db) => {
      db.products = db.products.filter((x) => x.id !== id)
      return db
    })
    return
  }
  const { error } = await supabase.from('products').delete().eq('id', id)
  assertNoError(error)
}

export async function listPromotions({ activeOnly = false } = {}) {
  if (!supabaseConfigured) {
    return demoStore.get().promotions.filter((x) => !activeOnly || x.is_active)
  }
  let query = supabase.from('promotions').select('*').order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  assertNoError(error)
  return data || []
}

export async function savePromotion(promo) {
  if (!supabaseConfigured) {
    let saved
    demoStore.update((db) => {
      if (promo.id && db.promotions.some((x) => x.id === promo.id)) {
        db.promotions = db.promotions.map((x) => x.id === promo.id ? { ...x, ...promo } : x)
        saved = db.promotions.find((x) => x.id === promo.id)
      } else {
        saved = { ...promo, id: crypto.randomUUID(), created_at: nowIso() }
        db.promotions.push(saved)
      }
      return db
    })
    return saved
  }
  const payload = { ...promo }
  if (!payload.id) delete payload.id
  const { data, error } = payload.id
    ? await supabase.from('promotions').update(payload).eq('id', payload.id).select().single()
    : await supabase.from('promotions').insert(payload).select().single()
  assertNoError(error)
  return data
}

export async function deletePromotion(id) {
  if (!supabaseConfigured) {
    demoStore.update((db) => {
      db.promotions = db.promotions.filter((x) => x.id !== id)
      return db
    })
    return
  }
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  assertNoError(error)
}

export async function getCustomerPoints(phone) {
  const normalized = normalizePhone(phone)
  if (!supabaseConfigured) {
    const customer = demoStore.get().customers.find((x) => x.phone === normalized)
    return customer ? { found: true, name: customer.name, phone: customer.phone, points: customer.points || 0 } : { found: false, points: 0 }
  }
  const { data, error } = await supabase.rpc('get_customer_points', { p_phone: normalized })
  assertNoError(error)
  return data
}

export async function uploadPaymentSlip(file) {
  if (!file) return null
  const safeExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `pending/${crypto.randomUUID()}.${safeExt}`
  if (!supabaseConfigured) return path
  const { error } = await supabase.storage.from('payment-slips').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  assertNoError(error)
  return path
}

export async function createOrder(payload) {
  if (!supabaseConfigured) {
    let result
    demoStore.update((db) => {
      const phone = normalizePhone(payload.customer.phone)
      let customer = db.customers.find((x) => x.phone === phone)
      if (!customer) {
        customer = { id: crypto.randomUUID(), name: payload.customer.name, phone, points: 0, created_at: nowIso() }
        db.customers.push(customer)
      } else {
        customer.name = payload.customer.name || customer.name
      }

      const lines = payload.items.map((item) => {
        const p = db.products.find((x) => x.id === item.product_id)
        if (!p || !p.is_available) throw new Error('มีเมนูที่ไม่พร้อมขาย กรุณากลับไปเลือกใหม่')
        return {
          id: crypto.randomUUID(),
          product_id: p.id,
          product_name_th: p.name_th,
          product_name_en: p.name_en,
          unit_price: Number(p.price),
          quantity: Number(item.quantity),
          sweetness: Number(item.sweetness),
        }
      })

      const subtotal = lines.reduce((sum, x) => sum + x.unit_price * x.quantity, 0)
      let discount = 0
      let pointsRedeemed = 0
      if (payload.redeem_points) {
        if ((customer.points || 0) < 10) throw new Error('แต้มไม่เพียงพอสำหรับแลกเครื่องดื่ม')
        const cheapest = Math.min(...lines.map((x) => x.unit_price))
        discount = cheapest
        pointsRedeemed = 10
        customer.points -= 10
      } else if (payload.promotion_id) {
        const promo = db.promotions.find((x) => x.id === payload.promotion_id && x.is_active)
        if (promo?.discount_type === 'fixed_price_per_item') {
          discount = lines.reduce((sum, x) => sum + Math.max(0, x.unit_price - Number(promo.fixed_item_price)) * x.quantity, 0)
        }
      }

      const deliveryFee = payload.fulfillment_type === 'delivery' ? Number(db.settings.delivery_fee || 0) : 0
      const order = {
        id: crypto.randomUUID(),
        order_number: demoOrderNumber(db.orders.length),
        tracking_token: crypto.randomUUID(),
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        fulfillment_type: payload.fulfillment_type,
        delivery_address: payload.delivery_address || null,
        payment_method: payload.payment_method,
        payment_status: ['promptpay', 'bank_transfer'].includes(payload.payment_method) ? 'pending_review' : 'unpaid',
        slip_path: payload.slip_path || null,
        note: payload.note || '',
        status: 'pending',
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        total: Math.max(0, subtotal - discount + deliveryFee),
        points_redeemed: pointsRedeemed,
        points_to_earn: Math.max(0, lines.reduce((sum, x) => sum + x.quantity, 0) - (pointsRedeemed ? 1 : 0)),
        points_awarded: false,
        created_at: nowIso(),
        order_items: lines,
      }
      db.orders.unshift(order)
      result = { order_number: order.order_number, tracking_token: order.tracking_token, total: order.total }
      return db
    })
    return result
  }

  const { data, error } = await supabase.rpc('create_order', { p_payload: payload })
  assertNoError(error)
  return data
}

export async function trackOrder(token) {
  if (!token) return null
  if (!supabaseConfigured) {
    const order = demoStore.get().orders.find((x) => x.tracking_token === token)
    return order || null
  }
  const { data, error } = await supabase.rpc('get_order_by_token', { p_token: token })
  assertNoError(error)
  return data
}

export async function listOrders({ limit = 200 } = {}) {
  if (!supabaseConfigured) return demoStore.get().orders.slice(0, limit)
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  assertNoError(error)
  return data || []
}

export async function updateOrderStatus(id, status) {
  if (!supabaseConfigured) {
    let updated
    demoStore.update((db) => {
      const order = db.orders.find((x) => x.id === id)
      if (!order) throw new Error('ไม่พบ Order')
      const previous = order.status
      order.status = status
      order.updated_at = nowIso()
      const customer = db.customers.find((x) => x.id === order.customer_id)
      if (status === 'completed' && previous !== 'completed' && !order.points_awarded) {
        customer.points = (customer.points || 0) + Number(order.points_to_earn || 0)
        order.points_awarded = true
      }
      if (status === 'cancelled' && previous !== 'cancelled' && Number(order.points_redeemed || 0) > 0 && !order.points_refunded) {
        customer.points = (customer.points || 0) + Number(order.points_redeemed)
        order.points_refunded = true
      }
      updated = { ...order }
      return db
    })
    return updated
  }
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select('*, order_items(*)').single()
  assertNoError(error)
  return data
}

export async function updatePaymentStatus(id, paymentStatus) {
  if (!supabaseConfigured) {
    let updated
    demoStore.update((db) => {
      const order = db.orders.find((x) => x.id === id)
      if (!order) throw new Error('ไม่พบ Order')
      order.payment_status = paymentStatus
      updated = { ...order }
      return db
    })
    return updated
  }
  const { data, error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', id).select().single()
  assertNoError(error)
  return data
}

export async function getSlipUrl(path) {
  if (!path) return null
  if (!supabaseConfigured) return null
  const { data, error } = await supabase.storage.from('payment-slips').createSignedUrl(path, 600)
  assertNoError(error)
  return data?.signedUrl || null
}

export async function listCustomers() {
  if (!supabaseConfigured) return demoStore.get().customers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'))
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  assertNoError(error)
  return data || []
}

export async function findCustomerByPhone(phone) {
  const normalized = normalizePhone(phone)
  if (!supabaseConfigured) return demoStore.get().customers.find((x) => x.phone === normalized) || null
  const { data, error } = await supabase.from('customers').select('*').eq('phone', normalized).maybeSingle()
  assertNoError(error)
  return data
}

export async function adminAdjustPoints(customerId, delta, reason) {
  if (!supabaseConfigured) {
    let customer
    demoStore.update((db) => {
      customer = db.customers.find((x) => x.id === customerId)
      if (!customer) throw new Error('ไม่พบลูกค้า')
      customer.points = Math.max(0, Number(customer.points || 0) + Number(delta))
      return db
    })
    return customer
  }
  const { data, error } = await supabase.rpc('admin_adjust_points', {
    p_customer_id: customerId,
    p_delta: Number(delta),
    p_reason: reason,
  })
  assertNoError(error)
  return data
}

export async function listStaff() {
  if (!supabaseConfigured) return demoStore.get().staff
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  assertNoError(error)
  return data || []
}

export async function invokeStaffAction(action, body) {
  if (!supabaseConfigured) {
    let result = null
    demoStore.update((db) => {
      if (action === 'invite') {
        const exists = db.staff.some((x) => x.email.toLowerCase() === body.email.toLowerCase())
        if (exists) throw new Error('Email นี้มีอยู่แล้ว')
        result = { id: crypto.randomUUID(), email: body.email, display_name: body.display_name, role: 'staff', is_active: true }
        db.staff.push(result)
      } else {
        const staff = db.staff.find((x) => x.id === body.user_id)
        if (!staff) throw new Error('ไม่พบ Staff')
        if (staff.role === 'owner') throw new Error('ไม่สามารถแก้ Owner จากเมนู Staff ได้')
        if (action === 'disable') staff.is_active = false
        if (action === 'enable') staff.is_active = true
        if (action === 'remove') db.staff = db.staff.filter((x) => x.id !== body.user_id)
        result = staff
      }
      return db
    })
    return result
  }
  const { data, error } = await supabase.functions.invoke('invite-staff', { body: { action, ...body } })
  assertNoError(error)
  if (data?.error) throw new Error(data.error)
  return data
}

export function subscribeOrders(onInsert, onUpdate) {
  if (!supabaseConfigured) {
    const handler = () => onUpdate?.()
    window.addEventListener('demo-store-change', handler)
    return () => window.removeEventListener('demo-store-change', handler)
  }
  const channel = supabase
    .channel('admin-orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => onInsert?.(payload.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => onUpdate?.(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
