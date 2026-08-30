import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUserName(
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    identifier?: string | null;
  } | null,
  fallback = "Unassigned"
): string {
  if (!user) return fallback;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return user.email || user.identifier || fallback;
}

