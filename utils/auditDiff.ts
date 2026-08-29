export type AuditFieldChange = {
  field: string;
  oldValue: any;
  newValue: any;
};

export const DEFAULT_IGNORED_METADATA_KEYS = [
  'id',
  'createdAt',
  'updatedAt',
  'orgId',
  'complaintId',
  'investigationId',
  'vigilanceId',
  'communicationId',
  'taskId',
];

/**
 * Recursively clones a value while stripping out database metadata keys.
 */
export function stripMetadata(
  value: any,
  ignoredKeys: string[] = DEFAULT_IGNORED_METADATA_KEYS
): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripMetadata(item, ignoredKeys));
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (ignoredKeys.includes(k)) {
        continue;
      }
      cleaned[k] = stripMetadata(v, ignoredKeys);
    }
    return cleaned;
  }

  return value;
}

/**
 * Deep equality helper that handles Dates, Arrays, and Objects.
 */
function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;

  // Handle Date comparisons or ISO date string vs Date
  const isADate = a instanceof Date || (typeof a === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(a));
  const isBDate = b instanceof Date || (typeof b === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(b));
  if (isADate && isBDate) {
    const aTime = new Date(a).getTime();
    const bTime = new Date(b).getTime();
    if (!isNaN(aTime) && !isNaN(bTime)) return aTime === bTime;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isDeepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Compares two records and generates a diff of their fields.
 * Recursively ignores internal database metadata keys (e.g. `id`, `createdAt`, `updatedAt`, `orgId`, `complaintId`).
 */
export function generateAuditDiff<T extends Record<string, any>>(
  oldRecord: T,
  newRecord: T,
  customIgnoreFields: string[] = []
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];
  const ignoredTopLevel = new Set([...DEFAULT_IGNORED_METADATA_KEYS, ...customIgnoreFields]);
  const allKeys = new Set([...Object.keys(oldRecord || {}), ...Object.keys(newRecord || {})]);

  for (const key of allKeys) {
    if (ignoredTopLevel.has(key)) continue;

    const rawOldVal = oldRecord ? oldRecord[key] : undefined;
    const rawNewVal = newRecord ? newRecord[key] : undefined;

    const cleanOldVal = stripMetadata(rawOldVal);
    const cleanNewVal = stripMetadata(rawNewVal);

    if (!isDeepEqual(cleanOldVal, cleanNewVal)) {
      changes.push({
        field: key,
        oldValue: cleanOldVal ?? null,
        newValue: cleanNewVal ?? null,
      });
    }
  }

  return changes;
}
