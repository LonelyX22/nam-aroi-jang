export function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function formatDateTime(value, language = 'th') {
  if (!value) return '-'
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'th-TH', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function normalizePhone(value = '') {
  return value.replace(/\D/g, '')
}

export function isThaiMobile(value = '') {
  const phone = normalizePhone(value)
  return /^0\d{9}$/.test(phone)
}

export function shopIsOpen(settings) {
  if (!settings) return false
  if (settings.force_open) return true
  if (settings.force_closed) return false
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0)
  const current = hour * 60 + minute
  const [oh, om] = (settings.open_time || '08:00').slice(0, 5).split(':').map(Number)
  const [ch, cm] = (settings.close_time || '20:00').slice(0, 5).split(':').map(Number)
  return current >= oh * 60 + om && current < ch * 60 + cm
}
