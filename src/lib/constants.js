export const SHOP = {
  nameTh: 'น้ำอร่อยจัง',
  nameEn: 'Nam Aroi Jang',
  phone: '06-1564-0529',
  facebook: 'น้ำอร่อยจัง',
  line: 'น้ำอร่อยจัง',
  instagram: 'น้ำอร่อยจัง',
  openTime: '08:00',
  closeTime: '20:00',
  deliveryProvince: 'นครปฐม',
  deliveryFee: 0,
  promptPay: '06-1564-0529',
  ownerEmail: 'namaual@gmail.com',
}

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'delivering',
  'completed',
  'cancelled',
]

export const PAYMENT_METHODS = [
  'cash',
  'promptpay',
  'bank_transfer',
  'cash_on_delivery',
]

export const SWEETNESS_LEVELS = [0, 25, 50, 75, 100]

export const STATUS_LABELS = {
  pending: { th: 'รอรับ Order', en: 'Pending' },
  accepted: { th: 'รับ Order แล้ว', en: 'Accepted' },
  preparing: { th: 'กำลังทำ', en: 'Preparing' },
  ready: { th: 'พร้อมรับสินค้า', en: 'Ready' },
  delivering: { th: 'กำลังจัดส่ง', en: 'Delivering' },
  completed: { th: 'สำเร็จ', en: 'Completed' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
}
