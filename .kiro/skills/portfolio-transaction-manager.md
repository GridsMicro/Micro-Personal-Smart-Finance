# Portfolio Transaction Manager Skill

**Purpose:** จัดการการซื้อขาย holdings ใน Special Portfolio (Neon DB)  
**Version:** 1.0  
**Last Updated:** 2026-07-15

---

## 📋 ภาพรวม

Skill นี้ช่วยในการ:
- ➕ เพิ่ม holdings ใหม่ (ซื้อเข้า)
- ➖ ลบ holdings (ขายออก หรือเอาไป convert)
- 💰 อัปเดตเงินสด (cash_balance_thb)
- 🔄 อัปเดต holdings เดิม (ราคา, จำนวน)
- 📊 แสดงสถานะพอร์ต

---

## 🎯 วิธีใช้งาน

### 1️⃣ เพิ่ม Holdings ใหม่ (ซื้อเข้า)

**ตัวอย่างคำขอ:**
```
ช่วยเพิ่ม ADA 9046.6 อัน ในพอร์ต โดยใช้ต้นทุน 50000 THB ที่ราคาซื้อ 5.52 THB ต่ออัน
```

**Template:**
```
เพิ่ม [COIN] [จำนวน] โดยใช้ต้นทุน [COST_THB] THB ที่ราคาซื้อ [PRICE_THB] THB ต่ออัน
```

**Fields:**
- `COIN`: ชื่อเหรียญ (เช่น cardano, solana, ethereum)
- `จำนวน`: จำนวนเหรียญ (เช่น 9046.6, 19.07)
- `COST_THB`: ต้นทุนรวมในบาท (เช่น 50000, 49576)
- `PRICE_THB`: ราคาต่อหน่วยในบาท (เช่น 5.52, 2598.87)

---

### 2️⃣ ลบ Holdings (ขายออก)

**ตัวอย่างคำขอ:**
```
ขาย DOGE ทั้งหมด 17717.28984870 ตัว ได้ 45657 THB
```

**Template:**
```
ขาย [COIN] [จำนวน] ได้ [AMOUNT_THB] THB
```

**Fields:**
- `COIN`: ชื่อเหรียญ
- `จำนวน`: จำนวนที่ขาย
- `AMOUNT_THB`: เงินที่ได้จากการขาย

---

### 3️⃣ อัปเดตเงินสด (cash_balance_thb)

**ตัวอย่างคำขอ:**
```
ได้เงินสด 45657 THB จากการขาย DOGE และ 53919 THB จากการขาย ETH
```

**ทำการ:**
1. ตรวจสอบเงินสดปัจจุบัน
2. อัปเดตจำนวนเงินสด
3. แสดงผลสรุป

---

### 4️⃣ อัปเดต Holdings เดิม

**ตัวอย่างคำขอ:**
```
อัปเดต BTC จำนวนเป็น 0.05 บาท ราคาเป็น 2500000
```

---

## 📊 ข้อมูล Portfolio ที่ต้องรู้

**Portfolio ID:** `a0000000-0000-0000-0000-000000000001`  
**Coin IDs ใน Database:**
- `bitcoin` → BTC
- `ethereum` → ETH
- `tron` → TRX
- `dogecoin` → DOGE
- `cardano` → ADA
- `solana` → SOL

**Database:** Neon PostgreSQL  
**Connection:** ใช้ `.env.local` → `DATABASE_URL`

---

## 🔧 Implementation Details

### Holdings Table (`special_portfolio_holdings`)
```
portfolio_id: UUID (ตั้งค่าเป็น a0000000-0000-0000-0000-000000000001)
coin_id: VARCHAR (เช่น 'bitcoin', 'cardano')
amount: NUMERIC(36, 18) (จำนวนเหรียญ)
cost_thb: NUMERIC(36, 18) (ต้นทุนรวม)
buy_price_thb: NUMERIC(36, 18) (ราคาต่อหน่วย)
bought_at: TIMESTAMP (วันที่ซื้อ)
note: TEXT (หมายเหตุ เช่น "ซื้อ ADA @ 0.1648 USD")
```

### Portfolio Table (`special_portfolio`)
```
id: UUID = a0000000-0000-0000-0000-000000000001
cash_balance_thb: NUMERIC(36, 18) (เงินสดจากการขาย)
```

---

## 💡 ตัวอย่างการใช้งาน

### ตัวอย่าง 1: ซื้อ ADA
```
User: ช่วยเพิ่ม ADA 9046.6 อัน ต้นทุน 50000 THB ที่ราคา 5.52 THB ต่ออัน

Agent:
1. ตรวจสอบเงินสดปัจจุบัน (99,576 THB)
2. ลด cash_balance_thb เป็น 49,576 THB (99,576 - 50,000)
3. เพิ่ม ADA holding ใหม่:
   - coin_id: 'cardano'
   - amount: 9046.6
   - cost_thb: 50000
   - buy_price_thb: 5.52
   - bought_at: TODAY
   - note: "ซื้อ 9046.6 ADA @ 0.1648 USD"

Result: ✅ เพิ่ม ADA สำเร็จ เงินสดเหลือ 49,576 THB
```

### ตัวอย่าง 2: ขาย DOGE
```
User: ขาย DOGE ทั้งหมด 17717.28984870 ตัว ได้ 45657 THB

Agent:
1. ลบ DOGE holding จากฐานข้อมูล
2. อัปเดต cash_balance_thb += 45657
3. แสดงผลสรุป

Result: ✅ ขาย DOGE สำเร็จ เงินสดเพิ่มขึ้น
```

---

## 📝 Checklist ก่อนบันทึก

- [ ] ตรวจสอบ coin_id ถูกต้อง (ต้อง match กับ assets table)
- [ ] จำนวน holdings เป็นตัวเลขที่ถูกต้อง
- [ ] ต้นทุน (cost_thb) และราคา (buy_price_thb) มีจำนวนทศนิยมถูกต้อง
- [ ] เงินสด (cash_balance) คำนวณถูกต้อง
- [ ] หมายเหตุ (note) ชัดเจนระบุวันและราคา
- [ ] Build ผ่านหลังอัปเดต (`npm run build`)

---

## 🔗 Related Files

- **Database:** `.env.local` → `DATABASE_URL`
- **Schema:** `db/schema.ts`
- **Actions:** `actions/public-portfolio.ts`
- **Page:** `app/p/[id]/page.tsx`
- **Client:** `app/p/[id]/public-portfolio-client.tsx`
- **Scripts:** `.agent/data-src/*.ts`

---

## ⚠️ หลีกเลี่ยง

- ❌ อย่าแก้ portfolio_id (ต้องเป็น `a0000000-0000-0000-0000-000000000001` เสมอ)
- ❌ อย่าลบ TRX หรือ BTC โดยไม่ตั้งใจ
- ❌ อย่าลืม run `npm run build` หลังอัปเดต
- ❌ อย่าใส่ข้อมูล coin_id ที่ไม่มีใน assets table

---

**Status:** ACTIVE | **Version:** 1.0 | **Created:** 2026-07-15
