import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import {
  MealTypeIntEnum,
  ExpenseCategoryIntEnum,
  TimeBucketIntEnum,
} from "../schemas";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerk_user_id: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  key: text("key").notNull().unique(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  revoked_at: text("revoked_at"),
});

export const foodLogs = sqliteTable("food_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  meal_type: integer("meal_type").$type<MealTypeIntEnum>().notNull(),
  item_name: text("item_name").notNull(),
  amount: real("amount"),
  unit: text("unit"),
  calories: integer("calories").notNull(),
  protein_g: real("protein_g").notNull().default(0),
  carb_g: real("carb_g").notNull().default(0),
  fat_g: real("fat_g").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const expenseLogs = sqliteTable("expense_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  category: integer("category").$type<ExpenseCategoryIntEnum>().notNull(),
  description: text("description"),
  payment_method: text("payment_method"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const timeLogs = sqliteTable("time_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  bucket: integer("bucket").$type<TimeBucketIntEnum>().notNull(),
  activity: text("activity").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const oauthAuthCodes = sqliteTable("oauth_auth_codes", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  code: text("code").notNull().unique(),
  redirect_uri: text("redirect_uri").notNull(),
  code_challenge: text("code_challenge").notNull(),
  code_challenge_method: text("code_challenge_method").notNull().default("S256"),
  expires_at: text("expires_at").notNull(),
  used: integer("used").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type OAuthAuthCode = typeof oauthAuthCodes.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
export type ExpenseLog = typeof expenseLogs.$inferSelect;
export type TimeLog = typeof timeLogs.$inferSelect;
