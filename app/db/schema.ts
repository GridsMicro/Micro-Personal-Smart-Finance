import { pgTable, serial, text, decimal, integer, date, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  asset: text('asset').notNull(),
  amount: decimal('amount', { precision: 20, scale: 8 }).notNull(),
  type: text('type').notNull(), // 'DEPOSIT' or 'WITHDRAW'
  note: text('note'),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
