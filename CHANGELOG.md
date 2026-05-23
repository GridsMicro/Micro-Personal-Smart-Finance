# Changelog

บันทึกการเปลี่ยนแปลงทั้งหมดของโปรเจกต์ Micro Personal Smart Finance

รูปแบบตาม [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

---

## [2026-05-23]

### ✨ Added
- **Price Timestamp บน Card BTC/TRX** (`app/p/[id]/public-portfolio-client.tsx`)
  - เพิ่มแสดงเวลาที่ดึงราคาล่าสุดใต้ตัวเลขราคาปัจจุบันในแต่ละ card
  - แสดงในรูปแบบ `🕐 ข้อมูล ณ HH:MM:SS น.` (เวลาไทย Asia/Bangkok)
  - ใช้ `lastUpdated` จาก SWR API (`/api/p/[id]/prices`) ซึ่งอัปเดตทุก 60 วินาที
  - Fallback เป็น `Date.now()` กรณียังไม่มีข้อมูลจาก API (ครั้งแรก)

### 🐛 Fixed
- **Hydration Mismatch Error** (`app/p/[id]/public-portfolio-client.tsx`)
  - เพิ่ม `suppressHydrationWarning` บน `<span>` ที่แสดงเวลา
  - แก้ปัญหา React Hydration Error เกิดจาก `Date.now()` render บน Server กับ Client ได้ผลต่างกัน (ต่างกัน 1 วินาที)
