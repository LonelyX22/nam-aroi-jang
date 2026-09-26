function tlv(tag, value) {
  const text = String(value)
  return `${tag}${String(text.length).padStart(2, '0')}${text}`
}

function crc16CcittFalse(input) {
  let crc = 0xffff
  const bytes = new TextEncoder().encode(input)
  for (const byte of bytes) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function normalizeTarget(target) {
  const digits = String(target || '').replace(/\D/g, '')
  if (/^0\d{9}$/.test(digits)) return { type: '01', value: `0066${digits.slice(1)}` }
  if (/^\d{13}$/.test(digits)) return { type: '02', value: digits }
  if (/^\d{15}$/.test(digits)) return { type: '03', value: digits }
  throw new Error('PromptPay ID ต้องเป็นเบอร์มือถือ 10 หลัก, เลข 13 หลัก หรือ e-Wallet 15 หลัก')
}

export function buildPromptPayPayload(target, amount = null) {
  const proxy = normalizeTarget(target)
  const merchantAccount = tlv('00', 'A000000677010111') + tlv(proxy.type, proxy.value)
  const hasAmount = Number.isFinite(Number(amount)) && Number(amount) > 0
  let payload = ''
  payload += tlv('00', '01')
  payload += tlv('01', hasAmount ? '12' : '11')
  payload += tlv('29', merchantAccount)
  payload += tlv('53', '764')
  if (hasAmount) payload += tlv('54', Number(amount).toFixed(2))
  payload += tlv('58', 'TH')
  payload += '6304'
  return payload + crc16CcittFalse(payload)
}
