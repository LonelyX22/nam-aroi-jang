import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildPromptPayPayload } from '../lib/promptpay'

export default function PromptPayQR({ target }) {
  const [src, setSrc] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    try {
      const payload = buildPromptPayPayload(target)
      QRCode.toDataURL(payload, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: 'M',
      }).then((url) => { if (!cancelled) setSrc(url) }).catch((e) => { if (!cancelled) setError(e.message) })
    } catch (e) {
      setError(e.message)
    }
    return () => { cancelled = true }
  }, [target])

  if (error) return <div className="alert alert-error">สร้าง PromptPay QR ไม่สำเร็จ: {error}</div>
  if (!src) return <div className="qr-loading">กำลังสร้าง QR...</div>
  return <div className="promptpay-qr"><img src={src} alt="PromptPay QR" /><small>สแกนด้วย Mobile Banking แล้วกรอกยอดตามยอดรวมของ Order</small></div>
}
