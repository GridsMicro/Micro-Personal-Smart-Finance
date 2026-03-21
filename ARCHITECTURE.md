# 🏛️ Centralized Authentication Architecture

## 🚨 Critical Code Patterns (Global Rule)
**"Front-end โครงการใหม่ทั้งหมด ต้องใช้ Server Action ดึงสิทธิ์ Account หรือ SuperAdmin จาก `api-service` ศูนย์กลางเท่านั้น"**

### 🔐 โครงสร้างการตรวจสอบสิทธิ์ (Centralized Identity Provider)
เพื่อความยั่งยืนของระบบ (Sustainable & Scalable Architecture) และความปลอดภัยขั้นสูงสุดระดับโลก:

1. **API Service (`api-service`):** 
   - ทำหน้าที่เป็น "ศูนย์รวมมาตรฐานเดียว (Single Source of Truth)" สำหรับการตรวจสอบสิทธิ์ SuperAdmin และผู้ใช้งานหลัก
   - อ่านการตั้งค่าจาก Vercel Environment Variables (`USER_SUPERADMIN`, `PASS_SUPERADMIN`)

2. **Front-End Applications (เช่น `Micro-Personal-Smart-Finance`):** 
   - **ห้าม** ทำการตรวจสอบรหัสผ่านระดับ Admin ฝั่ง Client เด็ดขาด (เพื่อป้องกัน Security Risk)
   - ต้องใช้ **Server Action** ยิง HTTP `POST` ก๊อกข้อมูลหลังบ้านไปเช็คกับ `api-service` (เช่น `/api/auth/superadmin`)
   
3. **Secure Session Maintenance:** 
   - เมื่อได้รับการตกลงจาก `api-service` ระบบ Front-end จะลงนามสร้าง `HttpOnly Secure Cookie` (เช่น `sf_superadmin_session`) เพื่อยืนยันสิทธิ์
   - `middleware.ts` ของโปรเจกต์จะถูกบังคับให้เคารพ Cookie ตัวนี้ และนำทางเข้าสู่ระบบได้อย่างไร้รอยต่อ

---
*📌 บันทึกนี้เป็นมาตรฐานบังคับใช้ (Mandatory Standards) สำหรับทั้งมนุษย์ (Developers) และ AI Agents ทุกตัวที่ทำงานอัปเดตระบบต่อจากนี้*
