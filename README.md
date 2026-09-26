# น้ำอร่อยจัง (Nam Aroi Jang)

ระบบร้านเครื่องดื่มแบบใช้งานจริง แยก **หน้าลูกค้า** และ **หลังบ้าน Admin** เป็นคนละ Route โดยใช้ React + Vite + Supabase + GitHub Pages

## ฟีเจอร์ที่มีแล้ว

### ลูกค้า
- หน้าแรก / เมนู / รายละเอียดเครื่องดื่ม / ตะกร้า / Checkout แยกเป็นหน้า
- เมนูเริ่มต้น 10 รายการ ราคา 30 บาท
- ส่วนผสม + Calories โดยประมาณ
- เลือกความหวาน 0 / 25 / 50 / 75 / 100%
- เปิดรับ Order 08:00 - 20:00 (เวลาไทย)
- รับเอง / จัดส่งเฉพาะนครปฐม
- ส่งฟรี ไม่มีขั้นต่ำ
- เงินสด / PromptPay / โอนเงิน / จ่ายตอนรับสินค้า
- PromptPay: `06-1564-0529`
- แนบสลิป และ Admin ตรวจเอง
- 1 แก้ว = 1 แต้ม
- 10 แต้ม = ฟรี 1 แก้ว (หักราคาแก้วที่ถูกที่สุด 1 แก้ว)
- แต้มไม่มีวันหมดอายุ
- โปรเช้า 08:00 - 10:00 ราคา 25 บาท/แก้ว
- โปรโมชั่นและแลกแต้มใช้พร้อมกันไม่ได้
- ติดตาม Order ด้วย Tracking Token แบบสุ่ม (ไม่ใช้ Order Number ที่เดาง่าย)
- ภาษา TH / EN ฝั่งลูกค้า
- Responsive มือถือ / Tablet / PC

### Admin / Owner / Staff
- Supabase Auth
- Dashboard
- Order Realtime + เสียงแจ้งเตือน
- เปลี่ยนสถานะ Order
- ตรวจสลิป
- จัดการเมนู (Owner)
- จัดการแต้มพร้อมเหตุผลและ Transaction Log (Owner)
- โปรโมชั่น (Owner)
- รายงานยอดขาย (Owner)
- ตั้งค่าร้าน / ปิดร้านชั่วคราว (Owner)
- หน้า Owner เพิ่ม/ปิด/ลบ Staff ภายหลัง
- Staff เริ่มต้นจำกัดสูงสุด 4 คน
- Staff ไม่มีสิทธิ์ Settings / Staff Management / แต้ม / โปรโมชั่น / รายงาน / เมนู

## URL หลัง Deploy

```text
Customer:
https://lonelyx22.github.io/nam-aroi-jang/

Admin:
https://lonelyx22.github.io/nam-aroi-jang/admin/login
```

## 1) รันแบบ Demo ก่อน

ยังไม่ต้องมี Supabase ก็เปิดดู UI และทดลอง Flow ได้ ข้อมูลจะเก็บใน Local Storage ของ Browser เท่านั้น

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง

Demo Admin:

```text
Email: o5170797@gmail.com
Password: demo1234
```

> Demo mode มี Banner ชัดเจน ห้ามใช้ Demo mode รับ Order จริง

## 2) สร้าง Supabase สำหรับ Production

1. สร้าง Project ใหม่ใน Supabase
2. เปิด `SQL Editor`
3. รันไฟล์ตามลำดับ:

```text
supabase/schema.sql
supabase/seed.sql
```

4. ไปที่ `Authentication > Users` แล้วสร้าง Owner:

```text
Email: o5170797@gmail.com
Password: ตั้งรหัสผ่านจริงที่แข็งแรง
```

Trigger ใน `schema.sql` จะกำหนด Email นี้เป็น `owner` อัตโนมัติ

5. ใน `Authentication` แนะนำปิด Public Sign Up เพราะ Staff จะถูกเพิ่มผ่านหน้า Owner เท่านั้น

6. ตั้งค่า URL ใน `Authentication > URL Configuration`

```text
Site URL:
https://lonelyx22.github.io/nam-aroi-jang/

Redirect URL:
https://lonelyx22.github.io/nam-aroi-jang/admin/set-password
```

## 3) Deploy Edge Function สำหรับเพิ่ม Staff

ติดตั้ง Supabase CLI แล้ว Login/Link project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

ตั้ง URL เว็บสำหรับ Email Invitation:

```bash
npx supabase secrets set SITE_URL=https://lonelyx22.github.io/nam-aroi-jang
```

Deploy:

```bash
npx supabase functions deploy invite-staff
```

Supabase จะมี `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ให้ Edge Function โดยอัตโนมัติ

## 4) ตั้งค่า Environment สำหรับ Local Production Mode

สร้าง `.env` จาก `.env.example`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> `VITE_SUPABASE_ANON_KEY` เป็น Public/Anon key ตามการออกแบบของ Supabase และต้องใช้ร่วมกับ RLS ห้ามนำ `service_role` มาใส่ Frontend เด็ดขาด

จากนั้น:

```bash
npm run dev
```

## 5) GitHub Repository

สร้าง Public/Private Repository ชื่อ:

```text
nam-aroi-jang
```

แล้ว Push:

```bash
git init
git add .
git commit -m "Initial Nam Aroi Jang shop system"
git branch -M main
git remote add origin https://github.com/LonelyX22/nam-aroi-jang.git
git push -u origin main
```

## 6) GitHub Actions Secrets

ไปที่:

```text
Repository
> Settings
> Secrets and variables
> Actions
> New repository secret
```

เพิ่ม:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

ค่ามาจาก Supabase Project Settings / API

## 7) เปิด GitHub Pages

ไปที่:

```text
Repository > Settings > Pages
```

เลือก Source เป็น:

```text
GitHub Actions
```

เมื่อ Push เข้า `main` ไฟล์ `.github/workflows/deploy.yml` จะ Build และ Deploy อัตโนมัติ

## สิ่งที่ต้องกำหนดเพิ่มก่อนรับเงินจริง

ข้อมูลนี้ยังไม่มีจาก Requirement ปัจจุบัน:

- ชื่อธนาคาร
- ชื่อบัญชีธนาคาร
- เลขบัญชีธนาคาร

Owner ตั้งภายหลังได้ที่:

```text
/admin/settings
```

## Security ที่ทำไว้

- Admin ใช้ Supabase Auth ไม่เก็บ Password เอง
- Owner / Staff แยก Role
- Row Level Security (RLS)
- Customer ไม่สามารถเขียนราคา Order เองได้
- `create_order()` คำนวณราคาจาก `products` ใน Database
- Tracking ใช้ UUID Token แบบสุ่ม ไม่เปิดข้อมูลด้วยเลข Order ที่คาดเดาได้
- จำกัด Slip เป็น private bucket / รูปภาพ / ไม่เกิน 5 MB
- Order สำเร็จเท่านั้นถึงเพิ่มแต้ม
- Order ยกเลิกคืนแต้มที่ใช้แลก
- Order ที่ Completed/Cancelled แล้วเปลี่ยนสถานะไม่ได้
- Basic Order throttling ต่อเบอร์โทร
- Service Role ใช้เฉพาะ Edge Function ฝั่ง Server

## หมายเหตุ Production

ระบบนี้พร้อมเป็นฐาน Production สำหรับร้านขนาดเล็ก แต่ถ้ามี Traffic สูงหรือเริ่มโฆษณาสาธารณะ แนะนำเพิ่ม CAPTCHA/Turnstile หน้า Checkout และ Rate Limit ฝั่ง Edge/API เพื่อป้องกัน Bot/Spam เพิ่มเติม
