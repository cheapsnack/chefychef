import type { GroceryCategory } from "./types";

/**
 * Rough average shelf life (in days) per category. These are convenience
 * estimates for reminders only — NOT food-safety guidance.
 */
export const SHELF_LIFE_DAYS: Record<GroceryCategory, number> = {
  produce: 7,
  dairy: 10,
  meat: 4,
  seafood: 2,
  bakery: 5,
  frozen: 90,
  pantry: 180,
  other: 14,
};

/** Format a Date as a local YYYY-MM-DD string (no timezone shifting). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local-midnight Date. */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole-day difference between two ISO dates (target - from). */
export function daysBetween(fromISO: string, targetISO: string): number {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(targetISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * expiry_date = purchase_date + shelf_life_days[category]
 * Used when the user leaves the expiry date blank.
 */
export function estimateExpiryDate(
  purchaseDateISO: string,
  category: GroceryCategory,
): string {
  return addDays(purchaseDateISO, SHELF_LIFE_DAYS[category]);
}

export function daysUntilExpiry(expiryISO: string, todayISOStr = todayISO()): number {
  return daysBetween(todayISOStr, expiryISO);
}
