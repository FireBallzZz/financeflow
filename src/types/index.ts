// Central type definitions for every entity stored in IndexedDB via Dexie.
// Keeping these separate from db/schema.ts lets components import types
// without pulling in the Dexie runtime.

export type TransactionType = "income" | "expense";

export type WalletType = "cash" | "bank" | "bkash" | "nagad" | "rocket" | "custom";

export type LoanDirection = "given" | "borrowed";

export type LoanStatus = "unpaid" | "partially_paid" | "paid";

export type BikeMaintenanceType =
  | "engine_oil"
  | "brake_pads"
  | "chain"
  | "chain_sprocket"
  | "tyres"
  | "battery"
  | "air_filter"
  | "washing"
  | "accessories"
  | "parking"
  | "toll"
  | "fine"
  | "insurance"
  | "registration"
  | "other";

export type ReminderCategory =
  | "loan_due"
  | "bike_service"
  | "bike_insurance"
  | "bike_registration"
  | "budget"
  | "savings_goal"
  | "custom";

export type ReminderTrigger = "date" | "odometer";

export interface Category {
  id?: number;
  name: string;
  type: TransactionType;
  icon: string; // lucide-react icon name
  color: string; // hex
  isCustom: boolean;
}

export interface Wallet {
  id?: number;
  name: string;
  type: WalletType;
  openingBalance: number;
  color: string;
  isDefault: boolean;
  archived: boolean;
  createdAt: string;
}

export interface Transaction {
  id?: number;
  amount: number;
  type: TransactionType;
  category: string;
  walletId: number;
  date: string; // ISO datetime
  note?: string;
  /** Present only for the two legs of a wallet-to-wallet transfer. */
  transferId?: string;
  createdAt: string;
}

export interface Loan {
  id?: number;
  direction: LoanDirection;
  person: string;
  phone?: string;
  amount: number;
  date: string;
  dueDate?: string;
  paidAmount: number;
  status: LoanStatus;
  notes?: string;
  createdAt: string;
  /** Wallet that received the money (borrowed) or paid it out (given). */
  walletId: number;
  /** The linked transaction created when this loan was recorded, so edits/deletes keep the wallet balance in sync. */
  transactionId?: number;
}

export interface LoanPayment {
  id?: number;
  loanId: number;
  amount: number;
  date: string;
  note?: string;
  /** Wallet used for this repayment. */
  walletId: number;
  /** The linked transaction created for this repayment. */
  transactionId?: number;
}

export interface Budget {
  id?: number;
  category: string; // "Overall" or a specific expense category
  amount: number;
  month: number; // 1-12
  year: number;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  description?: string;
  createdAt: string;
  isCompleted: boolean;
}

export interface Vehicle {
  id?: number;
  name: string;
  isDefault: boolean;
}

export interface FuelLog {
  id?: number;
  vehicleId: number;
  date: string;
  amount: number;
  liters: number;
  pricePerLiter: number;
  odometer: number;
  note?: string;
  /** Wallet the fuel was paid from. */
  walletId: number;
  /** The linked expense transaction created for this fuel log. */
  transactionId?: number;
}

export interface MaintenanceLog {
  id?: number;
  vehicleId: number;
  type: BikeMaintenanceType;
  date: string;
  amount: number;
  odometer?: number;
  note?: string;
  /** Wallet the maintenance was paid from. */
  walletId: number;
  /** The linked expense transaction created for this maintenance log. */
  transactionId?: number;
}

export interface Reminder {
  id?: number;
  category: ReminderCategory;
  title: string;
  trigger: ReminderTrigger;
  dueDate?: string;
  dueOdometer?: number;
  isRecurring: boolean;
  isActive: boolean;
  linkedId?: number;
  createdAt: string;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
}

export type DateRangePreset = "week" | "month" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}
