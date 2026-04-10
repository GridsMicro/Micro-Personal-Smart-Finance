/**
 * Fee Calculation Actions
 * คำนวณค่าธรรมเนียมตามแต่ละโบรก
 */

import { db } from "../db";
import { brokerFees, transactions, feeDailySnapshots } from "../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// Default broker fee configurations (ถ้ายังไม่มีในฐานข้อมูล)
export const DEFAULT_BROKER_FEES = {
  BINANCE_TH: {
    name: "Binance Thailand",
    spotMakerFee: 0.1, // 0.1%
    spotTakerFee: 0.1, // 0.1%
    withdrawalFee: 0,
    withdrawalFeeCurrency: "THB",
  },
  BITKUB: {
    name: "Bitkub",
    spotMakerFee: 0.25, // 0.25%
    spotTakerFee: 0.25, // 0.25%
    withdrawalFee: 0,
    withdrawalFeeCurrency: "THB",
  },
  OKX: {
    name: "OKX",
    spotMakerFee: 0.08, // 0.08%
    spotTakerFee: 0.1, // 0.1%
    withdrawalFee: 0,
    withdrawalFeeCurrency: "USD",
  },
  METAMASK: {
    name: "MetaMask",
    spotMakerFee: 0, // DEX - gas fee only
    spotTakerFee: 0,
    withdrawalFee: 0,
    withdrawalFeeCurrency: "ETH",
  },
};

/**
 * ดึงค่าธรรมเนียมของโบรก
 */
export async function getBrokerFeeConfig(brokerId: string) {
  const fee = await db
    .select()
    .from(brokerFees)
    .where(eq(brokerFees.brokerId, brokerId))
    .limit(1);

  if (fee.length > 0) {
    return fee[0];
  }

  // Return default if not found
  const defaultFee = DEFAULT_BROKER_FEES[brokerId as keyof typeof DEFAULT_BROKER_FEES];
  if (defaultFee) {
    return {
      brokerId,
      ...defaultFee,
      depositFee: "0",
      minWithdrawal: "0",
      isActive: true,
    };
  }

  return null;
}

/**
 * คำนวณค่าธรรมเนียมสำหรับ transaction
 */
export async function calculateTransactionFee(
  brokerId: string,
  amount: number,
  price: number,
  type: "DEPOSIT" | "WITHDRAW",
  isMaker: boolean = false // true = maker order, false = taker order
): Promise<{
  fee: number;
  feeCurrency: string;
  feePercent: number;
  totalCost: number; // มูลค่ารวมค่าธรรมเนียม
}> {
  const feeConfig = await getBrokerFeeConfig(brokerId);
  
  if (!feeConfig) {
    return { fee: 0, feeCurrency: "THB", feePercent: 0, totalCost: amount * price };
  }

  const tradeValue = amount * price;
  let feePercent = 0;
  let fee = 0;
  let feeCurrency = "THB";

  if (type === "DEPOSIT") {
    // ค่าฝาก (มักเป็น 0)
    fee = parseFloat(feeConfig.depositFee?.toString() || "0");
    feePercent = 0;
  } else {
    // ค่าธรรมเนียมซื้อขาย
    feePercent = isMaker 
      ? parseFloat(feeConfig.spotMakerFee.toString()) 
      : parseFloat(feeConfig.spotTakerFee.toString());
    
    fee = (tradeValue * feePercent) / 100;
    feeCurrency = "THB"; // หรือสกุลเงินของ asset
  }

  return {
    fee,
    feeCurrency,
    feePercent,
    totalCost: tradeValue + fee,
  };
}

/**
 * ดึงสรุปค่าธรรมเนียมรายวัน
 */
export async function getFeeSummary(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  let query = db
    .select()
    .from(feeDailySnapshots)
    .where(eq(feeDailySnapshots.userId, userId));

  if (startDate && endDate) {
    query = db
      .select()
      .from(feeDailySnapshots)
      .where(eq(feeDailySnapshots.userId, userId))
      .where(gte(feeDailySnapshots.date, startDate))
      .where(lte(feeDailySnapshots.date, endDate));
  }

  const data = await query.orderBy(feeDailySnapshots.date);

  // คำนวณยอดรวม
  let totalFees = 0;
  const feesByBroker: Record<string, number> = {};
  const feesByAsset: Record<string, number> = {};

  data.forEach((row) => {
    totalFees += parseFloat(row.totalFees.toString());
    
    const brokerFees = row.feesByBroker as Record<string, number>;
    Object.entries(brokerFees).forEach(([broker, fee]) => {
      feesByBroker[broker] = (feesByBroker[broker] || 0) + fee;
    });

    const assetFees = row.feesByAsset as Record<string, number>;
    Object.entries(assetFees).forEach(([asset, fee]) => {
      feesByAsset[asset] = (feesByAsset[asset] || 0) + fee;
    });
  });

  return {
    dailyData: data,
    summary: {
      totalFees,
      feesByBroker,
      feesByAsset,
      totalTransactions: data.reduce((sum, row) => sum + (row.transactionCount || 0), 0),
      days: data.length,
    },
  };
}

/**
 * คำนวณค่าธรรมเนียมสำหรับ transaction ที่มีอยู่แล้ว
 * (ใช้สำหรับ update transactions เก่า)
 */
export async function recalculateFeesForTransaction(txId: number) {
  const tx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, txId))
    .limit(1);

  if (tx.length === 0) return null;

  const transaction = tx[0];
  const amount = parseFloat(transaction.amount.toString());
  const price = transaction.price ? parseFloat(transaction.price.toString()) : 0;

  const feeCalc = await calculateTransactionFee(
    transaction.broker,
    amount,
    price,
    transaction.type as "DEPOSIT" | "WITHDRAW"
  );

  // อัพเดท transaction ด้วยค่าธรรมเนียม
  await db
    .update(transactions)
    .set({
      fee: feeCalc.fee.toFixed(8),
      feeCurrency: feeCalc.feeCurrency,
      feePercent: feeCalc.feePercent.toFixed(2),
    })
    .where(eq(transactions.id, txId));

  return feeCalc;
}

/**
 * สร้างหรืออัพเดท fee snapshot รายวัน (เรียกจาก cron job)
 */
export async function saveFeeDailySnapshot(
  userId: string,
  date: string,
  portfolioId?: number
) {
  // ดึง transactions ของวันนั้น
  let txsQuery = db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .where(eq(transactions.date, date));

  if (portfolioId) {
    txsQuery = db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .where(eq(transactions.portfolioId, portfolioId))
      .where(eq(transactions.date, date));
  }

  const txs = await txsQuery;

  // คำนวณยอดรวม
  let totalFees = 0;
  const feesByBroker: Record<string, number> = {};
  const feesByAsset: Record<string, number> = {};

  txs.forEach((tx) => {
    const fee = tx.fee ? parseFloat(tx.fee.toString()) : 0;
    totalFees += fee;

    feesByBroker[tx.broker] = (feesByBroker[tx.broker] || 0) + fee;
    feesByAsset[tx.asset] = (feesByAsset[tx.asset] || 0) + fee;
  });

  // บันทึก snapshot
  await db
    .insert(feeDailySnapshots)
    .values({
      userId,
      portfolioId: portfolioId || null,
      totalFees: totalFees.toFixed(2),
      feesByBroker,
      feesByAsset,
      transactionCount: txs.length,
      date,
    })
    .onConflictDoUpdate({
      target: [feeDailySnapshots.userId, feeDailySnapshots.portfolioId, feeDailySnapshots.date],
      set: {
        totalFees: totalFees.toFixed(2),
        feesByBroker,
        feesByAsset,
        transactionCount: txs.length,
      },
    });

  return {
    date,
    totalFees,
    feesByBroker,
    feesByAsset,
    transactionCount: txs.length,
  };
}
