---
inclusion: manual
---

# Portfolio Transaction Manager

**Purpose:** จัดการการซื้อขาย holdings ใน Special Portfolio (Neon DB)  
**Version:** 1.0  
**Status:** ACTIVE | Created: 2026-07-15

---

## 📋 ภาพรวมการใช้งาน

Skill นี้ช่วยในการ:
- ➕ **เพิ่ม holdings ใหม่** (ซื้อเข้า)
- ➖ **ลบ holdings** (ขายออก)
- 💰 **อัปเดตเงินสด** (cash_balance_thb)
- 🔄 **อัปเดต holdings เดิม** (ราคา, จำนวน)
- 📊 **แสดงสถานะพอร์ต**

---

## 🎯 Portfolio ที่ต้องรู้

**Portfolio ID:** `a0000000-0000-0000-0000-000000000001`  
**Database:** Neon PostgreSQL (ใช้ `.env.local`)

### Coin IDs:
- `bitcoin` → BTC
- `ethereum` → ETH
- `tron` → TRX
- `dogecoin` → DOGE
- `cardano` → ADA
- `solana` → SOL
- `ripple` → XRP
- `litecoin` → LTC

---

## 💡 วิธีใช้

### 1️⃣ **เพิ่ม Holdings ใหม่ (ซื้อเข้า)**

**Format:**
```
เพิ่ม [COIN_NAME] [จำนวน] โดยใช้ต้นทุน [COST_THB] THB ที่ราคาซื้อ [PRICE_THB] THB ต่ออัน
```

**ตัวอย่าง:**
```
เพิ่ม ADA 9046.6 โดยใช้ต้นทุน 50000 THB ที่ราคาซื้อ 5.52 THB ต่ออัน
```

**Agent ทำการ:**
1. ตรวจสอบเงินสดปัจจุบัน
2. ลด cash_balance_thb
3. INSERT holdings ใหม่ลงใน `special_portfolio_holdings`
4. แสดงผลสรุป

---

### 2️⃣ **ลบ Holdings (ขายออก)**

**Format:**
```
ขาย [COIN_NAME] [จำนวน] ได้ [AMOUNT_THB] THB
```

**ตัวอย่าง:**
```
ขาย DOGE 17717.28984870 ได้ 45657 THB
```

**Agent ทำการ:**
1. DELETE holdings จากฐานข้อมูล
2. UPDATE cash_balance_thb += เงินจากการขาย
3. แสดงผลสรุป

---

### 3️⃣ **อัปเดตเงินสด**

**Format:**
```
ได้เงินสด [AMOUNT] THB จากการ[สถานการณ์]
```

**ตัวอย่าง:**
```
ได้เงินสด 99576 THB จากการขาย DOGE และ ETH
```

---

### 4️⃣ **อัปเดต Holdings เดิม**

**Format:**
```
อัปเดต [COIN_NAME] จำนวนเป็น [NEW_AMOUNT] ราคาเป็น [NEW_PRICE]
```

---

## 📊 Database Schema

### `special_portfolio_holdings` table
```sql
id              UUID PRIMARY KEY
portfolio_id    UUID (= a0000000-0000-0000-0000-000000000001)
coin_id         VARCHAR (เช่น 'cardano', 'bitcoin')
amount          NUMERIC(36, 18) -- จำนวนเหรียญ
cost_thb        NUMERIC(36, 18) -- ต้นทุนรวม
buy_price_thb   NUMERIC(36, 18) -- ราคาต่อหน่วย
bought_at       TIMESTAMP -- วันที่ซื้อ
note            TEXT -- หมายเหตุ
```

### `special_portfolio` table
```sql
id                UUID PRIMARY KEY (= a0000000-0000-0000-0000-000000000001)
name              VARCHAR
description       TEXT
cash_balance_thb  NUMERIC(36, 18) -- เงินสดจากการขาย
created_at        TIMESTAMP
```

---

## 📋 Checklist ก่อน Deploy

- [ ] ตรวจสอบ coin_id ถูกต้อง
- [ ] จำนวน holdings ถูกต้อง
- [ ] ต้นทุนและราคากำหนดถูกต้อง
- [ ] เงินสดคำนวณถูกต้อง
- [ ] หมายเหตุชัดเจน
- [ ] `npm run build` ผ่าน
- [ ] ไม่มี TypeScript errors

---

## ⚠️ กฎสำคัญ

- ❌ **อย่าเปลี่ยน portfolio_id** (ต้องเป็น `a0000000-0000-0000-0000-000000000001`)
- ❌ **อย่าลบเลขศูนย์ (TRX, BTC)** โดยไม่ตั้งใจ
- ❌ **ใช้ coin_id จาก assets table เท่านั้น**
- ❌ **อย่าลืม `npm run build` หลังอัปเดต**

---

## 🔗 Files ที่เกี่ยวข้อง

- Schema: `db/schema.ts`
- Actions: `actions/public-portfolio.ts`
- Page: `app/p/[id]/page.tsx` & `public-portfolio-client.tsx`
- Scripts: `.agent/data-src/*.ts`

---

**Created:** 2026-07-15 | **Status:** ACTIVE
