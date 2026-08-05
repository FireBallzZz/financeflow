import Dexie, { type EntityTable } from "dexie";
import type {
  Transaction,
  Wallet,
  Category,
  Loan,
  LoanPayment,
  Budget,
  SavingsGoal,
  Vehicle,
  FuelLog,
  MaintenanceLog,
  Reminder,
  AppSettings,
} from "@/types";

/**
 * FinanceFlowDB — the single local IndexedDB database backing the whole app.
 * Everything lives in the browser; nothing here ever touches a network call.
 */
export class FinanceFlowDB extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  wallets!: EntityTable<Wallet, "id">;
  categories!: EntityTable<Category, "id">;
  loans!: EntityTable<Loan, "id">;
  loanPayments!: EntityTable<LoanPayment, "id">;
  budgets!: EntityTable<Budget, "id">;
  savingsGoals!: EntityTable<SavingsGoal, "id">;
  vehicles!: EntityTable<Vehicle, "id">;
  fuelLogs!: EntityTable<FuelLog, "id">;
  maintenanceLogs!: EntityTable<MaintenanceLog, "id">;
  reminders!: EntityTable<Reminder, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("financeflow-db");

    this.version(1).stores({
      transactions: "++id, type, category, walletId, date, transferId",
      wallets: "++id, type",
      categories: "++id, type, name",
      loans: "++id, direction, status, dueDate, person",
      loanPayments: "++id, loanId, date",
      budgets: "++id, [month+year], category",
      savingsGoals: "++id, deadline",
      vehicles: "++id",
      fuelLogs: "++id, vehicleId, date",
      maintenanceLogs: "++id, vehicleId, type, date",
      reminders: "++id, category, dueDate",
      settings: "++id, &key",
    });
  }
}

export const db = new FinanceFlowDB();

/**
 * Seeds default wallets, a default vehicle, and default categories on first
 * run only. Safe to call on every app load — it checks before inserting.
 */
export async function seedDatabaseIfEmpty() {
  const walletCount = await db.wallets.count();
  if (walletCount === 0) {
    const now = new Date().toISOString();
    await db.wallets.bulkAdd([
      { name: "Cash", type: "cash", openingBalance: 0, color: "#22c55e", isDefault: true, archived: false, createdAt: now },
      { name: "Bank", type: "bank", openingBalance: 0, color: "#4f46e5", isDefault: false, archived: false, createdAt: now },
      { name: "bKash", type: "bkash", openingBalance: 0, color: "#e2136e", isDefault: false, archived: false, createdAt: now },
      { name: "Nagad", type: "nagad", openingBalance: 0, color: "#f7941d", isDefault: false, archived: false, createdAt: now },
      { name: "Rocket", type: "rocket", openingBalance: 0, color: "#8c3494", isDefault: false, archived: false, createdAt: now },
    ]);
  }

  const vehicleCount = await db.vehicles.count();
  if (vehicleCount === 0) {
    await db.vehicles.add({ name: "My Bike", isDefault: true });
  }
}
