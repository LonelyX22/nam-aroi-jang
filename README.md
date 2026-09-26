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
- ติดตาม Order ด้วย Tracking Token แบบสุ่ม
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

## URL หลัง Deploy

```text
Customer:
https://lonelyx22.github.io/nam-aroi-jang/

Admin:
https://lonelyx22.github.io/nam-aroi-jang/admin/login
```

## รันแบบ Demo

```bash
npm install
npm run dev
```

Demo Admin:

```text
Email: o5170797@gmail.com
Password: demo1234
```

> Demo mode ใช้ทดสอบเท่านั้น ข้อมูลจะอยู่ใน Browser จนกว่าจะเชื่อม Supabase จริง
