import { SHOP } from './constants'

const KEY = 'nam-aroi-jang-demo-v1'

export const demoProducts = [
  { id: 'thai-tea', name_th: 'ชาไทย', name_en: 'Thai Milk Tea', price: 30, calories: 180, ingredients_th: ['ชาไทย', 'นม', 'นมข้นหวาน'], ingredients_en: ['Thai tea', 'Milk', 'Condensed milk'], emoji: '🧋', is_available: true, sort_order: 1 },
  { id: 'green-tea', name_th: 'ชาเขียวนม', name_en: 'Matcha Milk Tea', price: 30, calories: 170, ingredients_th: ['ชาเขียว', 'นม', 'นมข้นหวาน'], ingredients_en: ['Green tea', 'Milk', 'Condensed milk'], emoji: '🍵', is_available: true, sort_order: 2 },
  { id: 'cocoa', name_th: 'โกโก้', name_en: 'Cocoa', price: 30, calories: 190, ingredients_th: ['โกโก้', 'นม', 'นมข้นหวาน'], ingredients_en: ['Cocoa', 'Milk', 'Condensed milk'], emoji: '🍫', is_available: true, sort_order: 3 },
  { id: 'pink-milk', name_th: 'นมชมพู', name_en: 'Pink Milk', price: 30, calories: 160, ingredients_th: ['นมสด', 'น้ำแดง'], ingredients_en: ['Fresh milk', 'Red syrup'], emoji: '🥛', is_available: true, sort_order: 4 },
  { id: 'fresh-milk', name_th: 'นมสด', name_en: 'Fresh Milk', price: 30, calories: 150, ingredients_th: ['นมสด', 'น้ำเชื่อม'], ingredients_en: ['Fresh milk', 'Syrup'], emoji: '🥛', is_available: true, sort_order: 5 },
  { id: 'strawberry-milk', name_th: 'สตรอว์เบอร์รีนมสด', name_en: 'Strawberry Milk', price: 30, calories: 180, ingredients_th: ['นมสด', 'สตรอว์เบอร์รี'], ingredients_en: ['Fresh milk', 'Strawberry'], emoji: '🍓', is_available: true, sort_order: 6 },
  { id: 'strawberry-soda', name_th: 'สตรอว์เบอร์รีโซดา', name_en: 'Strawberry Soda', price: 30, calories: 110, ingredients_th: ['สตรอว์เบอร์รี', 'โซดา'], ingredients_en: ['Strawberry', 'Soda'], emoji: '🍓', is_available: true, sort_order: 7 },
  { id: 'lychee-soda', name_th: 'ลิ้นจี่โซดา', name_en: 'Lychee Soda', price: 30, calories: 100, ingredients_th: ['ลิ้นจี่', 'โซดา'], ingredients_en: ['Lychee', 'Soda'], emoji: '🫧', is_available: true, sort_order: 8 },
  { id: 'honey-lemon', name_th: 'น้ำผึ้งมะนาว', name_en: 'Honey Lemon', price: 30, calories: 120, ingredients_th: ['น้ำผึ้ง', 'มะนาว', 'น้ำ'], ingredients_en: ['Honey', 'Lemon', 'Water'], emoji: '🍋', is_available: true, sort_order: 9 },
  { id: 'orange-soda', name_th: 'ส้มโซดา', name_en: 'Orange Soda', price: 30, calories: 100, ingredients_th: ['ส้ม', 'โซดา'], ingredients_en: ['Orange', 'Soda'], emoji: '🍊', is_available: true, sort_order: 10 },
]

const initial = {
  settings: {
    id: 1,
    shop_name_th: SHOP.nameTh,
    shop_name_en: SHOP.nameEn,
    phone: SHOP.phone,
    open_time: SHOP.openTime,
    close_time: SHOP.closeTime,
    force_closed: false,
    force_open: false,
    delivery_fee: 0,
    delivery_province: SHOP.deliveryProvince,
    promptpay: SHOP.promptPay,
  },
  products: demoProducts,
  customers: [],
  orders: [],
  promotions: [
    {
      id: 'morning-25',
      name_th: 'โปรเช้า 25 บาท',
      name_en: 'Morning 25 Baht',
      code: 'MORNING25',
      discount_type: 'fixed_price_per_item',
      fixed_item_price: 25,
      start_time: '08:00',
      end_time: '10:00',
      is_active: true,
    },
  ],
  staff: [
    { id: 'owner-demo', email: SHOP.ownerEmail, display_name: 'Owner', role: 'owner', is_active: true },
  ],
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null')
    return parsed || structuredClone(initial)
  } catch {
    return structuredClone(initial)
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('demo-store-change'))
}

export const demoStore = {
  get() { return load() },
  update(mutator) {
    const data = load()
    const next = mutator(data) || data
    save(next)
    return next
  },
  reset() { save(structuredClone(initial)) },
}
