# 🎯 Portfolio Creation Flow (Test Document)

## Overview
This document describes what **HAPPENS AFTER** you click the **"CREATE PORTFOLIO"** button in the Cyberpunk Dashboard.

---

## 📋 Button Location
- **File**: `app/dashboard/components/CyberpunkDashboard.tsx`
- **Component**: `PortfolioModal` (line 662)
- **UI**: A modal dialog with input field for portfolio name and exchange selector

---

## 🔄 Complete Event Flow

### 1️⃣ **User Clicks "CREATE PORTFOLIO" Button**
```typescript
// CyberpunkDashboard.tsx (line 657)
onClick={() => {
  if (portfolioName.trim()) {
    onSave(portfolioName.trim(), selectedBroker);
  }
}}
```
- Validates that portfolio name is not empty
- Calls `onSave()` callback with:
  - `portfolioName`: Name entered by user (e.g., "My Bitcoin Wallet")
  - `selectedBroker`: Selected exchange (e.g., "BINANCE_TH", "BITKUB", "OKX")

---

### 2️⃣ **onSave Handler Triggered**
```typescript
// CyberpunkDashboard.tsx (line 1260)
onSave={async (portfolioName, brokerId) => {
  // Step 1: Save to database via API
  const success = await savePortfolioToDB(brokerId, portfolioName);
  
  // Step 2: Update local state
  if (success) {
    setPortfolioNames(prev => ({ ...prev, [brokerId]: portfolioName }));
  }
  
  // Step 3: Select the portfolio
  setSelectedPortfolio(brokerId);
  
  // Step 4: Close the modal
  setShowPortfolioModal(false);
  
  // Step 5: Switch to assets tab
  setActiveTab("assets");
}}
```

---

### 3️⃣ **API Call: POST /api/portfolios** ⭐ KEY STEP
```typescript
// app/api/portfolios/route.ts (POST handler)

// 1. Authenticate user
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return { error: "Unauthorized" } // Status: 401
}

// 2. Parse request body
const { name, description, exchangeType = "CUSTOM" } = body;

// 3. Validate portfolio name is provided
if (!name) {
  return { error: "Missing required field: name" } // Status: 400
}

// 4. Check if portfolio already exists
const existing = await db.select().from(portfolios)
  .where(
    and(
      eq(portfolios.userId, session.user.id),
      eq(portfolios.name, name)
    )
  );

if (existing.length > 0) {
  return { error: "Portfolio with this name already exists" } // Status: 409
}

// 5. INSERT portfolio into database
const newPortfolio = await db.insert(portfolios)
  .values({
    userId: session.user.id,      // User ID from session
    name,                           // Portfolio name
    description,                    // Optional description
    exchangeType,                   // Exchange type (BINANCE_TH, BITKUB, OKX, CUSTOM)
  })
  .returning();                     // Return created record

// 6. Return created portfolio
return NextResponse.json(newPortfolio[0], { status: 201 });
```

---

### 4️⃣ **Front-end Receives Response**
```typescript
// savePortfolioToDB function (line 115)
const res = await fetch('/api/portfolios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ brokerId, name }),
});

if (!res.ok) throw new Error('Failed to save portfolio');
const data = await res.json();
return true;  // Success!
```

---

### 5️⃣ **UI Updates in Sequence**
| Step | Action | Result |
|------|--------|--------|
| 1 | Update local state `setPortfolioNames` | Portfolio name cached locally |
| 2 | Set selected portfolio `setSelectedPortfolio(brokerId)` | Portfolio marked as "active" |
| 3 | Close modal `setShowPortfolioModal(false)` | Modal disappears from UI |
| 4 | Switch tab `setActiveTab("assets")` | UI automatically navigates to **Assets Tab** |

---

## 📊 Database Schema Affected
```sql
-- portfolios table (created)
INSERT INTO portfolios (
  id,              -- Auto-generated
  userId,          -- From session
  name,            -- User input
  description,     -- Optional
  exchangeType,    -- BINANCE_TH, BITKUB, OKX, CUSTOM
  createdAt,       -- Current timestamp
  updatedAt        -- Current timestamp
)
VALUES (...)
```

---

## ✅ Success vs ❌ Error Cases

### ✅ **Successful Creation (201)**
```json
{
  "id": 42,
  "userId": "user-abc123",
  "name": "My Portfolio",
  "description": null,
  "exchangeType": "BINANCE_TH",
  "createdAt": "2024-04-05T10:30:00Z",
  "updatedAt": "2024-04-05T10:30:00Z"
}
```
→ Portal **closes** → **Assets tab opens** → Ready to add assets

### ❌ **Error: Unauthorized (401)**
```json
{ "error": "Unauthorized" }
```
→ User must log in first

### ❌ **Error: Duplicate Name (409)**
```json
{ "error": "Portfolio with this name already exists" }
```
→ User must choose a different name

### ❌ **Error: Missing Name (400)**
```json
{ "error": "Missing required field: name" }
```
→ Portfolio name is required

---

## 🎬 What the User Sees

### Before Click
- Modal dialog open
- Input field for portfolio name
- Dropdown for selecting broker/exchange
- "Cancel" and "Create Portfolio" buttons

### After Click (Success)
1. **Modal closes** ✨
2. **Assets tab activates** (red border/highlight shift)
3. Portfolio appears in sidebar/portfolio list
4. **Next prompt**: "Add your first asset to this portfolio"
5. Dashboard shows empty portfolio card with portfolio name

### After Click (Failure)
1. Modal **stays open** ⚠️
2. Error message displayed
3. User can edit name and retry

---

## 🔗 Related Files to Review

| File | Purpose |
|------|---------|
| [CyberpunkDashboard.tsx](app/dashboard/components/CyberpunkDashboard.tsx#L1260) | Main UI & button handler (line 1260) |
| [portfolios/route.ts](app/api/portfolios/route.ts#L52) | Backend API endpoint (line 52) |
| [schema.ts](app/db/schema.ts) | Database schema for `portfolios` table |
| [PortfolioModal](app/dashboard/components/CyberpunkDashboard.tsx#L593) | Input modal component |

---

## 💡 Tips for Testing

1. **Test Valid Creation**
   - Enter name: "Test Portfolio"
   - Select exchange: "BINANCE_TH"
   - Click "CREATE PORTFOLIO"
   - ✅ Should see modal close and assets tab open

2. **Test Duplicate Name**
   - Create portfolio named "MyPortfolio"
   - Try creating another named "MyPortfolio"
   - ✅ Should get error: "Portfolio with this name already exists"

3. **Test Empty Name**
   - Leave name field blank
   - Click "CREATE PORTFOLIO"
   - ✅ Button should do nothing (note: frontend validation, backend also validates)

4. **Check Database**
   - Open PostgreSQL client
   - Query: `SELECT * FROM portfolios WHERE name = 'Test Portfolio';`
   - ✅ Should see the new portfolio record

5. **Check Logs**
   - Browser console: Look for `[DEBUG]` messages
   - Server console: Look for `[API]` messages
   - Example: `[API] Created portfolio: 42 - Test Portfolio`

---

## 🧪 Exam Checklist

- [ ] Can create portfolio with valid name?
- [ ] Does modal close after creation?
- [ ] Does assets tab automatically open?
- [ ] Is portfolio saved to database?
- [ ] Does duplicate name prevention work?
- [ ] Can you see the created portfolio in the UI?
- [ ] Can you add assets to the new portfolio?
- [ ] Are transactions linked to the correct portfolio?

---

**Good luck on your exam! 🚀**
