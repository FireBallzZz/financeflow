"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import type { LoanDirection } from "@/types";

export function useLoans() {
  return useLiveQuery(() => db.loans.orderBy("date").reverse().toArray(), []) ?? [];
}

export function useLoansByDirection(direction: LoanDirection) {
  return (
    useLiveQuery(
      () => db.loans.where("direction").equals(direction).reverse().sortBy("dueDate"),
      [direction]
    ) ?? []
  );
}

export function isLoanOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate || status === "paid") return false;
  return new Date(dueDate) < new Date();
}

export function useLoanSummary() {
  return (
    useLiveQuery(async () => {
      const loans = await db.loans.toArray();
      let given = 0;
      let borrowed = 0;
      let overdue = 0;
      for (const l of loans) {
        const remaining = l.amount - l.paidAmount;
        if (l.status !== "paid") {
          if (l.direction === "given") given += remaining;
          else borrowed += remaining;
          if (isLoanOverdue(l.dueDate, l.status)) overdue++;
        }
      }
      return { given, borrowed, overdue };
    }, []) ?? { given: 0, borrowed: 0, overdue: 0 }
  );
}
