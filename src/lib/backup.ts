import { db } from "@/db/schema";

export interface BackupPayload {
  exportedAt: string;
  appVersion: string;
  data: {
    transactions: unknown[];
    wallets: unknown[];
    categories: unknown[];
    loans: unknown[];
    loanPayments: unknown[];
    budgets: unknown[];
    savingsGoals: unknown[];
    vehicles: unknown[];
    fuelLogs: unknown[];
    maintenanceLogs: unknown[];
    reminders: unknown[];
  };
}

const LAST_BACKUP_KEY = "financeflow:lastBackupAt";

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [
    transactions, wallets, categories, loans, loanPayments,
    budgets, savingsGoals, vehicles, fuelLogs, maintenanceLogs, reminders,
  ] = await Promise.all([
    db.transactions.toArray(),
    db.wallets.toArray(),
    db.categories.toArray(),
    db.loans.toArray(),
    db.loanPayments.toArray(),
    db.budgets.toArray(),
    db.savingsGoals.toArray(),
    db.vehicles.toArray(),
    db.fuelLogs.toArray(),
    db.maintenanceLogs.toArray(),
    db.reminders.toArray(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    appVersion: "1.0.0",
    data: {
      transactions, wallets, categories, loans, loanPayments,
      budgets, savingsGoals, vehicles, fuelLogs, maintenanceLogs, reminders,
    },
  };
}

/** Triggers a browser download of the full backup as a .json file. */
export async function downloadBackup() {
  const payload = await buildBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financeflow_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  localStorage.setItem(LAST_BACKUP_KEY, payload.exportedAt);
  return payload.exportedAt;
}

export function getLastBackupTimestamp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_BACKUP_KEY);
}

/** Validates the shape of an uploaded backup file before touching the DB. */
export function isValidBackupPayload(json: unknown): json is BackupPayload {
  if (!json || typeof json !== "object") return false;
  const obj = json as Record<string, unknown>;
  if (typeof obj.exportedAt !== "string") return false;
  if (!obj.data || typeof obj.data !== "object") return false;
  const requiredTables = [
    "transactions", "wallets", "categories", "loans", "loanPayments",
    "budgets", "savingsGoals", "vehicles", "fuelLogs", "maintenanceLogs", "reminders",
  ];
  const data = obj.data as Record<string, unknown>;
  return requiredTables.every((t) => Array.isArray(data[t]));
}

/** Wipes every table and replaces it with the contents of the backup file. */
export async function restoreFromBackup(payload: BackupPayload) {
  await db.transaction(
    "rw",
    [
      db.transactions, db.wallets, db.categories, db.loans, db.loanPayments,
      db.budgets, db.savingsGoals, db.vehicles, db.fuelLogs, db.maintenanceLogs, db.reminders,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.wallets.clear(),
        db.categories.clear(),
        db.loans.clear(),
        db.loanPayments.clear(),
        db.budgets.clear(),
        db.savingsGoals.clear(),
        db.vehicles.clear(),
        db.fuelLogs.clear(),
        db.maintenanceLogs.clear(),
        db.reminders.clear(),
      ]);
      await Promise.all([
        db.transactions.bulkAdd(payload.data.transactions as never[]),
        db.wallets.bulkAdd(payload.data.wallets as never[]),
        db.categories.bulkAdd(payload.data.categories as never[]),
        db.loans.bulkAdd(payload.data.loans as never[]),
        db.loanPayments.bulkAdd(payload.data.loanPayments as never[]),
        db.budgets.bulkAdd(payload.data.budgets as never[]),
        db.savingsGoals.bulkAdd(payload.data.savingsGoals as never[]),
        db.vehicles.bulkAdd(payload.data.vehicles as never[]),
        db.fuelLogs.bulkAdd(payload.data.fuelLogs as never[]),
        db.maintenanceLogs.bulkAdd(payload.data.maintenanceLogs as never[]),
        db.reminders.bulkAdd(payload.data.reminders as never[]),
      ]);
    }
  );
}

/** Deletes everything and re-seeds default wallets/vehicle. */
export async function resetAllData() {
  await db.transaction(
    "rw",
    [
      db.transactions, db.wallets, db.categories, db.loans, db.loanPayments,
      db.budgets, db.savingsGoals, db.vehicles, db.fuelLogs, db.maintenanceLogs, db.reminders,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.wallets.clear(),
        db.categories.clear(),
        db.loans.clear(),
        db.loanPayments.clear(),
        db.budgets.clear(),
        db.savingsGoals.clear(),
        db.vehicles.clear(),
        db.fuelLogs.clear(),
        db.maintenanceLogs.clear(),
        db.reminders.clear(),
      ]);
    }
  );
  localStorage.removeItem(LAST_BACKUP_KEY);
}
