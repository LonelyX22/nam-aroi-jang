import { useEffect, useState } from 'react'
import { deleteProduct, listProducts, saveProduct, uploadProductImage } from '../../lib/api'
import { formatMoney } from '../../lib/format'

const empty = { name_th: '', name_en: '', price: 30, calories: 0, ingredients_th: '', ingredients_en: '', emoji: '🥤', image_url: '', is_available: true }

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)

  async function load() { setProducts(await listProducts({ includeUnavailable: true })) }
  useEffect(() => { load().catch((e) => setError(e.message)) }, [])

  function edit(p) {
    setImageFile(null)
    setForm({ ...p, ingredients_th: (p.ingredients_th || []).join(', '), ingredients_en: (p.ingredients_en || []).join(', ') })
    setEditing(true)
  }
  function create() { setImageFile(null); setForm(empty); setEditing(true) }
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const uploadedImageUrl = imageFile ? await uploadProductImage(imageFile) : null
      const payload = {
        ...form,
        image_url: uploadedImageUrl || form.image_url || null,
        price: Number(form.price), calories: Number(form.calories),
        ingredients_th: String(form.ingredients_th).split(',').map((x) => x.trim()).filter(Boolean),
        ingredients_en: String(form.ingredients_en).split(',').map((x) => x.trim()).filter(Boolean),
      }
      await saveProduct(payload); setEditing(false); await load()
    } catch (e2) { setError(e2.message) } finally { setSaving(false) }
  }
  async function remove(p) { if (!window.confirm(`ลบเมนู ${p.name_th}?`)) return; try { await deleteProduct(p.id); await load() } catch (e) { setError(e.message) } }

  return <div><div className="admin-page-head"><div><span className="eyebrow">PRODUCTS</span><h1>จัดการเมนู</h1><p>เพิ่ม แก้ไข ลบ ราคา ส่วนผสม แคลอรี และสถานะพร้อมขาย</p></div><button className="button button-primary" onClick={create}>+ เพิ่มเมนู</button></div>{error && <div className="alert alert-error">{error}</div>}<div className="admin-card"><div className="table-wrap"><table><thead><tr><th>เมนู</th><th>ราคา</th><th>Calories</th><th>สถานะ</th><th></th></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td><div className="product-cell"><span>{p.emoji || '🥤'}</span><div><strong>{p.name_th}</strong><small>{p.name_en}</small></div></div></td><td>{formatMoney(p.price)}</td><td>{p.calories} kcal</td><td><span className={`availability ${p.is_available ? 'on' : 'off'}`}>{p.is_available ? 'พร้อมขาย' : 'หมด'}</span></td><td><div className="row-actions"><button onClick={() => edit(p)}>แก้ไข</button><button className="danger" onClick={() => remove(p)}>ลบ</button></div></td></tr>)}</tbody></table></div></div>{editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}><button type="button" className="modal-close" onClick={() => setEditing(false)}>×</button><h2>{form.id ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}</h2><div className="form-grid two"><label>ชื่อภาษาไทย<input value={form.name_th} onChange={(e) => setForm({ ...form, name_th: e.target.value })} required /></label><label>English name<input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></label><label>ราคา<input type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label><label>Calories<input type="number" min="0" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} required /></label><label>Emoji<input value={form.emoji || ''} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength="4" /></label><label>Image URL<input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="หรืออัปโหลดไฟล์ด้านล่าง" /></label><label>อัปโหลดรูป<input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></label><label className="full">ส่วนผสม TH (คั่นด้วย ,)<input value={form.ingredients_th} onChange={(e) => setForm({ ...form, ingredients_th: e.target.value })} /></label><label className="full">Ingredients EN (comma separated)<input value={form.ingredients_en} onChange={(e) => setForm({ ...form, ingredients_en: e.target.value })} /></label><label className="toggle-label full"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> พร้อมขาย</label></div><button className="button button-primary button-wide" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกเมนู'}</button></form></div>}</div>
}
