import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a price string like "USD 12345" or "CHF 99,999" into "USD 12,345" or "CHF 99,999" consistently
// If only a number is provided, returns with commas: "12,345"
// Keeps the original currency/token prefix if present
export function formatPrice(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number") return raw.toLocaleString();
  const str = String(raw).trim();
  if (!str) return "";
  const match = str.match(/^(\D+)?\s*(\d[\d.,]*)/);
  if (!match) return str;
  const currency = (match[1] || '').trim();
  const numeric = match[2].replace(/[\s,]/g, '');
  const withCommas = Number(numeric).toLocaleString();
  return `${currency ? currency + ' ' : ''}${withCommas}`;
}