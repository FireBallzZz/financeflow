import type { BikeMaintenanceType, WalletType } from "@/types";

export const CURRENCY_SYMBOL = "৳";
export const CURRENCY_CODE = "BDT";

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "UtensilsCrossed", color: "#f59e0b" },
  { name: "Transport", icon: "Bus", color: "#6366f1" },
  { name: "Shopping", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Bike", icon: "Bike", color: "#64748b" },
  { name: "Fuel", icon: "Fuel", color: "#f97316" },
  { name: "Education", icon: "GraduationCap", color: "#06b6d4" },
  { name: "Medical", icon: "HeartPulse", color: "#ef4444" },
  { name: "Bills", icon: "Receipt", color: "#8b5cf6" },
  { name: "Entertainment", icon: "Clapperboard", color: "#14b8a6" },
  { name: "Family", icon: "Users", color: "#22c55e" },
  { name: "Investment", icon: "TrendingUp", color: "#0ea5e9" },
  { name: "Loan Given", icon: "HandCoins", color: "#0891b2" },
  { name: "Loan Repayment", icon: "Undo2", color: "#f43f5e" },
  { name: "Others", icon: "MoreHorizontal", color: "#84cc16" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "Briefcase", color: "#10b981" },
  { name: "Business", icon: "Store", color: "#0ea5e9" },
  { name: "Freelance", icon: "Laptop", color: "#6366f1" },
  { name: "Investment", icon: "TrendingUp", color: "#14b8a6" },
  { name: "Gift", icon: "Gift", color: "#ec4899" },
  { name: "Loan Received", icon: "HandCoins", color: "#0891b2" },
  { name: "Loan Collection", icon: "Undo2", color: "#22c55e" },
  { name: "Loan Return", icon: "Undo2", color: "#06b6d4" },
  { name: "Others", icon: "MoreHorizontal", color: "#84cc16" },
] as const;

export const WALLET_LABELS: Record<WalletType, string> = {
  cash: "Cash",
  bank: "Bank",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  custom: "Custom",
};

export const WALLET_ICONS: Record<WalletType, string> = {
  cash: "Banknote",
  bank: "Landmark",
  bkash: "Smartphone",
  nagad: "Smartphone",
  rocket: "Rocket",
  custom: "Wallet",
};

export const WALLET_COLORS: Record<WalletType, string> = {
  cash: "#22c55e",
  bank: "#4f46e5",
  bkash: "#e2136e",
  nagad: "#f7941d",
  rocket: "#8c3494",
  custom: "#64748b",
};

export const BIKE_MAINTENANCE_LABELS: Record<BikeMaintenanceType, string> = {
  engine_oil: "Engine Oil",
  brake_pads: "Brake Pads",
  chain: "Chain",
  chain_sprocket: "Chain Sprocket",
  tyres: "Tyres",
  battery: "Battery",
  air_filter: "Air Filter",
  washing: "Washing",
  accessories: "Accessories",
  parking: "Parking",
  toll: "Toll",
  fine: "Fine",
  insurance: "Insurance",
  registration: "Registration",
  other: "Other",
};

export const BIKE_MAINTENANCE_ICONS: Record<BikeMaintenanceType, string> = {
  engine_oil: "Droplet",
  brake_pads: "Disc",
  chain: "Link",
  chain_sprocket: "CircleDot",
  tyres: "CircleDashed",
  battery: "BatteryCharging",
  air_filter: "Wind",
  washing: "Droplets",
  accessories: "Wrench",
  parking: "ParkingSquare",
  toll: "Ticket",
  fine: "Gavel",
  insurance: "ShieldCheck",
  registration: "FileText",
  other: "MoreHorizontal",
};

export const CHART_PALETTE = [
  "#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#22c55e", "#ec4899", "#84cc16", "#0ea5e9", "#64748b",
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/transactions", label: "Transactions", icon: "Receipt" },
  { href: "/loans", label: "Loans", icon: "HandCoins" },
  { href: "/bike", label: "Bike", icon: "Bike" },
  { href: "/budgets", label: "Budget", icon: "PieChart" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/calendar", label: "Calendar", icon: "CalendarDays" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

// Subset shown in the mobile bottom nav bar (5 slots, matching common
// mobile-finance-app conventions — the rest live behind "More").
export const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
  { href: "/transactions", label: "History", icon: "Receipt" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/more", label: "More", icon: "Menu" },
] as const;
