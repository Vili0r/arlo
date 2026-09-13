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

export const ROLE_LABELS: Record<string, string> = {
  "org:admin": "Administrator",
  "org:qa_manager": "QA Manager",
  "org:qa_approver": "QA Approver",
  "org:qa_reviewer": "QA Reviewer",
  "org:quality_engineer": "Quality Engineer",
  "org:complaint_investigator": "Complaint Investigator",
  "org:capa_owner": "CAPA Owner",
  "org:vigilance_lead": "Vigilance Lead",
  "org:member": "Member",
  "org:read_only": "Read Only",
  admin: "Administrator",
  qa_manager: "QA Manager",
  qa_approver: "QA Approver",
  qa_reviewer: "QA Reviewer",
  quality_engineer: "Quality Engineer",
  complaint_investigator: "Complaint Investigator",
  capa_owner: "CAPA Owner",
  vigilance_lead: "Vigilance Lead",
  member: "Member",
  read_only: "Read Only",
};

export function formatRoleName(
  role?: string | null,
  fallback = "Authorized Signer"
): string {
  if (!role) return fallback;
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const cleaned = role.replace(/^org:/, "").replace(/_/g, " ");
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}


