import { useEffect, useState } from 'react'
import { getShopSettings, updateShopSettings } from '../../lib/api'

function normalizeTime(value, fallback) {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{2}):(\d{2})/)
  if (!match) return fallback

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export default function SettingsPage() {
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getShopSettings()
      .then(setForm)
      .catch((e) => setError(e.message))
  }, [])

  async function setShopMode(mode) {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const patch = mode === 'open'
        ? { force_open: true, force_closed: false }
        : mode === 'closed'
          ? { force_open: false, force_closed: true }
          : { force_open: false, force_closed: false }

      const saved = await updateShopSettings(patch)
      setForm((current) => ({ ...current, ...saved }))
      setMessage(
        mode === 'open'
          ? 'เปิดร้านแล้ว — ระบบจะรับออเดอร์โดยไม่ยึดตามเวลา'
          : mode === 'closed'
            ? 'ปิดร้านแล้ว — ระบบหยุดรับออเดอร์ทันที'
            : 'กลับมาใช้เวลาเปิด-ปิดอัตโนมัติแล้ว'
      )
    } catch (e2) {
      setError(e2.message || 'เปลี่ยนสถานะร้านไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        ...form,
        open_time: normalizeTime(form.open_time, '08:00'),
        close_time: normalizeTime(form.close_time, '20:00'),
        delivery_fee: Math.max(0, Number(form.delivery_fee || 0)),
        bank_name: form.bank_name?.trim() || null,
        bank_account_name: form.bank_account_name?.trim() || null,
        bank_account_number: form.bank_account_number?.trim() || null,
      }

      const saved = await updateShopSettings(payload)
      setForm(saved)
      setMessage('บันทึกการตั้งค่าร้านแล้ว')
    } catch (e2) {
      setError(e2.message || 'บันทึกการตั้งค่าไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <div className="page-loader">กำลังโหลด...</div>

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">SETTINGS</span>
          <h1>ตั้งค่าร้าน</h1>
          <p>แก้เวลาเปิด-ปิด การจัดส่ง PromptPay และปิดร้านชั่วคราว</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form className="admin-card settings-form" onSubmit={submit}>
        <h2>ข้อมูลร้าน</h2>

        <div className="form-grid two">
          <label>
            ชื่อร้าน TH
            <input
              value={form.shop_name_th || ''}
              onChange={(e) => setForm({ ...form, shop_name_th: e.target.value })}
            />
          </label>

          <label>
            Shop name EN
            <input
              value={form.shop_name_en || ''}
              onChange={(e) => setForm({ ...form, shop_name_en: e.target.value })}
            />
          </label>

          <label>
            เบอร์ติดต่อ
            <input
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>

          <label>
            PromptPay
            <input
              value={form.promptpay || ''}
              onChange={(e) => setForm({ ...form, promptpay: e.target.value })}
            />
          </label>

          <label>
            เวลาเปิด
            <input
              type="time"
              step="60"
              value={normalizeTime(form.open_time, '08:00')}
              onChange={(e) => setForm({ ...form, open_time: e.target.value || '08:00' })}
              required
            />
          </label>

          <label>
            เวลาปิด
            <input
              type="time"
              step="60"
              value={normalizeTime(form.close_time, '20:00')}
              onChange={(e) => setForm({ ...form, close_time: e.target.value || '20:00' })}
              required
            />
          </label>
        </div>

        <h2>การจัดส่ง</h2>

        <div className="form-grid two">
          <label>
            จังหวัด
            <input
              value={form.delivery_province || ''}
              onChange={(e) => setForm({ ...form, delivery_province: e.target.value })}
            />
          </label>

          <label>
            ค่าจัดส่ง
            <input
              type="number"
              min="0"
              step="1"
              value={form.delivery_fee ?? 0}
              onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
            />
          </label>
        </div>

        <h2>บัญชีธนาคาร</h2>

        <div className="form-grid three">
          <label>
            ธนาคาร
            <input
              value={form.bank_name || ''}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              placeholder="ยังไม่ได้กำหนด"
            />
          </label>

          <label>
            ชื่อบัญชี
            <input
              value={form.bank_account_name || ''}
              onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
            />
          </label>

          <label>
            เลขบัญชี
            <input
              value={form.bank_account_number || ''}
              onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
            />
          </label>
        </div>

        <h2>สถานะร้าน</h2>

        <div className="shop-mode-panel">
          <div className="shop-mode-status">
            <strong>
              {form.force_open
                ? '🟢 เปิดร้านแบบ Manual'
                : form.force_closed
                  ? '🔴 ปิดร้านแบบ Manual'
                  : '🕒 ใช้เวลาเปิด-ปิดอัตโนมัติ'}
            </strong>
            <small>
              {form.force_open
                ? 'รับออเดอร์ได้ตลอดจนกว่าจะเปลี่ยนโหมด'
                : form.force_closed
                  ? 'หยุดรับออเดอร์ทันทีจนกว่าจะเปลี่ยนโหมด'
                  : 'เปิด 08:00 - 20:00 ตามเวลาที่กำหนด'}
            </small>
          </div>

          <div className="shop-mode-actions">
            <button
              type="button"
              className={`button ${form.force_open ? 'button-primary' : 'button-soft'}`}
              onClick={() => setShopMode('open')}
              disabled={saving}
            >
              🟢 เปิดร้าน
            </button>

            <button
              type="button"
              className={`button ${!form.force_open && !form.force_closed ? 'button-primary' : 'button-soft'}`}
              onClick={() => setShopMode('auto')}
              disabled={saving}
            >
              🕒 ตามเวลา
            </button>

            <button
              type="button"
              className={`button ${form.force_closed ? 'button-primary' : 'button-soft'}`}
              onClick={() => setShopMode('closed')}
              disabled={saving}
            >
              🔴 ปิดร้าน
            </button>
          </div>
        </div>

        <button className="button button-primary" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </form>
    </div>
  )
}
