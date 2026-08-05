"use client";
import { useEffect } from "react";
import { seedDatabaseIfEmpty } from "@/db/schema";

/** Runs once on first client mount to seed default wallets/vehicle. */
export function DbSeed() {
  useEffect(() => {
    seedDatabaseIfEmpty();
  }, []);
  return null;
}
