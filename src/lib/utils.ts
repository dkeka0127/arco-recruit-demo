import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** D-day until an ISO date string. Returns null if no deadline (상시채용). */
export function dDay(deadline: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(deadline + "T23:59:59");
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "상시채용";
  const d = dDay(deadline);
  if (d === null) return "상시채용";
  if (d < 0) return "마감";
  if (d === 0) return "오늘 마감";
  return `D-${d}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
