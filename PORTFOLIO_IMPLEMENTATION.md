# Portfolio-Aware Transaction System - Implementation Guide

## ✅ Completed Tasks

### 1. Schema Updates (DONE)
- **File**: [app/db/schema.ts](app/db/schema.ts)
- Added `portfolios` table as a real entity with:
  - `id`: Serial primary key
  - `userId`: FK to users table with cascade delete
  - `name`: User-defined portfolio name
  - `description`: Optional description
  - `exchangeType`: Type of exchange (BINANCE_TH, BITKUB, OKX, CUSTOM)
  - `createdAt`, `updatedAt`: Timestamps
  - Unique constraint on (userId, name)

- Added `portfolioId` FK to `transactions` table:
  - References portfolios.id with cascade delete
  - Nullable for backward compatibility during migration

### 2. Database Migrations (DONE)
- **Migration 1**: [app/db/migrations/0001_add_portfolios_table.sql](app/db/migrations/0001_add_portfolios_table.sql)
  - Creates portfolios table with proper indexes

- **Migration 2**: [app/db/migrations/0002_level2_portfolio_architecture.sql](app/db/migrations/0002_level2_portfolio_architecture.sql)
  - Adds portfolio_id column to transactions table
  - Creates indexes for performance
  - Includes function for auto-creating default portfolios

### 3. API Endpoints - Full CRUD (DONE)
- **File**: [app/api/portfolios/route.ts](app/api/portfolios/route.ts)

**Implemented Methods**:
- `GET /api/portfolios` - List all user portfolios with transaction counts
- `POST /api/portfolios` - Create new portfolio
- `PUT /api/portfolios/:id` - Update portfolio details
- `DELETE /api/portfolios/:id` - Delete portfolio (cascade deletes transactions)

**Key Features**:
- User authorization checks on all endpoints
- Transaction count aggregation per portfolio
- Cascade delete protection via FK constraints
- Proper error handling

### 4. Transaction Actions - Portfolio Support (DONE)
- **File**: [app/actions/transactionActions.ts](app/actions/transactionActions.ts)

**New Functions**:
- `getTransactionsByPortfolio(portfolioId)` - Get transactions for specific portfolio
- **Updated Functions** now support both legacy and new patterns:
  - `saveTransaction()` - Now accepts `portfolioId` or `broker` (backward compatible)
  - `saveTrade()` - Now accepts `portfolioId` or `broker`

**Backward Compatibility**:
- Functions support both `broker` (legacy) and `portfolioId` (new)
- Existing code using `broker` will continue to work
- New code can use `portfolioId` for better structure

### 5. Data Migration Script (DONE)
- **File**: [scripts/migrate-broker-to-portfolios.ts](scripts/migrate-broker-to-portfolios.ts)

**What it does**:
1. Finds all unique (userId, broker) combinations from transactions
2. Creates default portfolios for each broker if they don't exist
3. Links existing transactions to their corresponding portfolios
4. Provides detailed logging of the migration process

**Run with**: `npm run data:migrate`

### 6. Comprehensive Test Suite (DONE)
- **File**: [test-portfolio-flow.ts](test-portfolio-flow.ts)

**Tests Covered**:
1. ✅ Create test user
2. ✅ Create multiple portfolios
3. ✅ Create portfolio-aware transactions
4. ✅ Query transactions by portfolio
5. ✅ Update transactions
6. ✅ Verify unique constraints
7. ✅ Cascade delete behavior
8. ✅ Data cleanup

**Run with**: `npm run test:portfolio`

---

## 🚀 Step-by-Step Implementation

### Step 1: Apply Database Migrations
```bash
# This runs both 0001 and 0002 migrations
npm run db:migrate
```

### Step 2: Run Data Migration (Populate portfolioId)
```bash
# Creates default portfolios from existing brokers
# Links all existing transactions to their portfolios
npm run data:migrate
```

### Step 3: Run Tests
```bash
# Verify the complete flow works correctly
npm run test:portfolio
```

### Step 4: Update Frontend Components (TODO)
Frontend components need to be updated to:
- Display portfolio selection UI
- Show transactions grouped by portfolio
- Support portfolio-aware transaction creation

**Key components to update**:
- [app/dashboard/components/DashboardContent.tsx](app/dashboard/components/DashboardContent.tsx)
- [app/dashboard/components/CyberpunkDashboard.tsx](app/dashboard/components/CyberpunkDashboard.tsx)
- Any transaction form components

**Frontend Changes Needed**:
- Add portfolio selector in transaction forms
- Update portfolio grouping logic (currently uses broker)
- Add portfolio management UI (create/edit/delete portfolios)
- Display portfolio in transaction details

---

## 📋 API Examples

### Create Portfolio
```bash
POST /api/portfolios
Content-Type: application/json

{
  "name": "My BTC Holdings",
  "description": "Bitcoin portfolio on Binance",
  "exchangeType": "BINANCE_TH"
}
```

### Get All Portfolios
```bash
GET /api/portfolios
```

Response:
```json
[
  {
    "id": 1,
    "userId": "user-123",
    "name": "My BTC Holdings",
    "description": "Bitcoin portfolio on Binance",
    "exchangeType": "BINANCE_TH",
    "createdAt": "2026-04-05T10:30:00Z",
    "updatedAt": "2026-04-05T10:30:00Z",
    "transactionCount": 5
  }
]
```

### Add Transaction to Portfolio
```bash
POST /app/actions/transactionActions.ts::saveTransaction
{
  "portfolioId": 1,
  "asset": "BTC",
  "amount": "0.5",
  "price": "2000000",
  "type": "DEPOSIT",
  "date": "2026-04-05",
  "note": "Initial deposit"
}
```

### Get Transactions by Portfolio
```typescript
// Server action
import { getTransactionsByPortfolio } from "@/app/actions/transactionActions";

const txs = await getTransactionsByPortfolio(portfolioId);
```

---

## 🔮 Migration Strategy

### For Existing Transactions
The system uses a **dual-field approach** during migration:
1. Existing transactions have `broker` populated
2. Run `npm run data:migrate` to populate `portfolioId`
3. After verification, `broker` field can be deprecated

### Why This Approach?
- ✅ Zero downtime migration
- ✅ Backward compatible with existing code
- ✅ Can verify data integrity before switching
- ✅ Easy rollback if needed

---

## 🧪 Verification Checklist

After running migrations, verify:

- [ ] `portfolios` table created successfully
- [ ] `portfolio_id` column added to `transactions`
- [ ] All existing transactions have `portfolio_id` set
- [ ] All tests pass: `npm run test:portfolio`
- [ ] API endpoints respond correctly
- [ ] Portfolio CRUD operations work
- [ ] Cascade delete works (deleting portfolio removes transactions)
- [ ] Frontend displays portfolios correctly

---

## 📝 Next Steps

1. **Frontend Implementation**:
   - Create portfolio selector component
   - Update transaction forms to use portfolioId
   - Add portfolio management interface
   - Update dashboard to show portfolio-grouped data

2. **User Experience**:
   - Add default portfolio creation on user signup
   - Allow users to import transactions from exchanges
   - Show portfolio performance charts

3. **Advanced Features**:
   - Portfolio comparison
   - Multi-portfolio aggregation
   - Portfolio templates
   - Exchange integration (auto-sync transactions)

---

## ⚠️ Important Notes

1. **Backward Compatibility**: The `broker` field is kept for backward compatibility. It's safe to continue using it during transition.

2. **Cascade Delete**: When a portfolio is deleted, all its transactions are automatically deleted due to the FK constraint.

3. **Unique Constraint**: Each user can only have one portfolio with a given name.

4. **Data Integrity**: The migration script verifies that all transactions without `portfolio_id` are linked during the `npm run data:migrate` step.

5. **Testing**: Always run the test suite before deploying changes to production.

---

## 🎯 Summary

| Task | Status | File(s) |
|------|--------|---------|
| Schema: portfolios entity | ✅ DONE | schema.ts |
| Migration: create tables | ✅ DONE | 0001, 0002 SQL files |
| API: CRUD endpoints | ✅ DONE | api/portfolios/route.ts |
| Transactions: portfolio support | ✅ DONE | actions/transactionActions.ts |
| Data migration: broker→portfolio_id | ✅ DONE | scripts/migrate-broker-to-portfolios.ts |
| Test suite: complete flow | ✅ DONE | test-portfolio-flow.ts |
| Frontend: portfolio-aware UI | ⏳ TODO | dashboard/components/*.tsx |

**Estimated Time to Complete Full Implementation**: 2-3 hours for frontend updates + testing
