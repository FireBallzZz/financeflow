import type { Transaction, Budget, Loan, FuelLog, MaintenanceLog } from "@/types";
import { isTransfer } from "@/lib/utils";

export interface Insight {
  id: string;
  tone: "positive" | "warning" | "neutral";
  message: string;
}

interface InsightsInput {
  transactions: Transaction[];
  budgets: Budget[];
  loans: Loan[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function isInMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

/**
 * Generates simple, explainable, entirely-local "insights" by comparing this
 * month's numbers against last month's and against budgets. No ML, no
 * external API — just straightforward arithmetic over the user's own data.
 */
export function generateInsights(input: InsightsInput): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const expenses = input.transactions.filter((t) => t.type === "expense" && !isTransfer(t));
  const income = input.transactions.filter((t) => t.type === "income" && !isTransfer(t));

  // --- Category spending change vs last month ---
  const categories = Array.from(new Set(expenses.map((t) => t.category)));
  for (const cat of categories) {
    const thisMonthTotal = sum(
      expenses.filter((t) => t.category === cat && isInMonth(t.date, thisYear, thisMonth)).map((t) => t.amount)
    );
    const lastMonthTotal = sum(
      expenses.filter((t) => t.category === cat && isInMonth(t.date, lastMonthYear, lastMonth)).map((t) => t.amount)
    );
    if (lastMonthTotal > 0 && thisMonthTotal > 0) {
      const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      if (Math.abs(change) >= 15) {
        insights.push({
          id: `cat-${cat}`,
          tone: change > 0 ? "warning" : "positive",
          message: `Your ${cat} spending ${change > 0 ? "increased" : "decreased"} by ${Math.abs(
            Math.round(change)
          )}% this month.`,
        });
      }
    }
  }

  // --- Budget exceeded ---
  const monthBudgets = input.budgets.filter((b) => b.month === thisMonth + 1 && b.year === thisYear);
  for (const b of monthBudgets) {
    const spent =
      b.category === "Overall"
        ? sum(expenses.filter((t) => isInMonth(t.date, thisYear, thisMonth)).map((t) => t.amount))
        : sum(
            expenses
              .filter((t) => t.category === b.category && isInMonth(t.date, thisYear, thisMonth))
              .map((t) => t.amount)
          );
    if (spent > b.amount) {
      insights.push({
        id: `budget-${b.category}`,
        tone: "warning",
        message: `You have exceeded your ${b.category} budget this month.`,
      });
    } else if (b.amount > 0 && spent / b.amount >= 0.85) {
      insights.push({
        id: `budget-near-${b.category}`,
        tone: "warning",
        message: `You're close to your ${b.category} budget limit — ${Math.round((spent / b.amount) * 100)}% used.`,
      });
    }
  }

  // --- Loans outstanding ---
  const outstandingGiven = sum(
    input.loans.filter((l) => l.direction === "given" && l.status !== "paid").map((l) => l.amount - l.paidAmount)
  );
  const outstandingBorrowed = sum(
    input.loans.filter((l) => l.direction === "borrowed" && l.status !== "paid").map((l) => l.amount - l.paidAmount)
  );
  if (outstandingGiven > 0) {
    insights.push({
      id: "loans-given",
      tone: "neutral",
      message: `You have ৳${outstandingGiven.toLocaleString()} outstanding to collect from loans.`,
    });
  }
  if (outstandingBorrowed > 0) {
    insights.push({
      id: "loans-borrowed",
      tone: "neutral",
      message: `You owe ৳${outstandingBorrowed.toLocaleString()} in borrowed loans.`,
    });
  }

  const overdueLoans = input.loans.filter(
    (l) => l.status !== "paid" && l.dueDate && new Date(l.dueDate) < now
  );
  if (overdueLoans.length > 0) {
    insights.push({
      id: "loans-overdue",
      tone: "warning",
      message: `${overdueLoans.length} loan${overdueLoans.length > 1 ? "s are" : " is"} overdue.`,
    });
  }

  // --- Savings trend ---
  const thisMonthIncome = sum(income.filter((t) => isInMonth(t.date, thisYear, thisMonth)).map((t) => t.amount));
  const thisMonthExpense = sum(expenses.filter((t) => isInMonth(t.date, thisYear, thisMonth)).map((t) => t.amount));
  const lastMonthIncome = sum(income.filter((t) => isInMonth(t.date, lastMonthYear, lastMonth)).map((t) => t.amount));
  const lastMonthExpense = sum(
    expenses.filter((t) => isInMonth(t.date, lastMonthYear, lastMonth)).map((t) => t.amount)
  );
  const thisMonthNet = thisMonthIncome - thisMonthExpense;
  const lastMonthNet = lastMonthIncome - lastMonthExpense;
  if (lastMonthIncome > 0 || lastMonthExpense > 0) {
    if (thisMonthNet > lastMonthNet && thisMonthNet > 0) {
      insights.push({
        id: "savings-up",
        tone: "positive",
        message: "Your savings increased compared to last month. Nice work!",
      });
    } else if (thisMonthNet < lastMonthNet && thisMonthNet < lastMonthNet * 0.85) {
      insights.push({
        id: "savings-down",
        tone: "warning",
        message: "Your net savings dropped compared to last month.",
      });
    }
  }

  // --- Bike expense trend ---
  const bikeThisMonth = sum([
    ...input.fuelLogs.filter((f) => isInMonth(f.date, thisYear, thisMonth)).map((f) => f.amount),
    ...input.maintenanceLogs.filter((m) => isInMonth(m.date, thisYear, thisMonth)).map((m) => m.amount),
  ]);
  const bikeLastMonth = sum([
    ...input.fuelLogs.filter((f) => isInMonth(f.date, lastMonthYear, lastMonth)).map((f) => f.amount),
    ...input.maintenanceLogs.filter((m) => isInMonth(m.date, lastMonthYear, lastMonth)).map((m) => m.amount),
  ]);
  if (bikeLastMonth > 0 && bikeThisMonth > bikeLastMonth * 1.15) {
    insights.push({
      id: "bike-up",
      tone: "warning",
      message: "Bike expenses are higher than last month.",
    });
  }

  return insights.slice(0, 8);
}
