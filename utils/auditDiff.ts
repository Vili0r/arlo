export type AuditFieldChange = {
  field: string;
  oldValue: any;
  newValue: any;
};

/**
 * Compares two objects and generates a diff of their fields.
 * Ignores unmodified fields and common system fields like `updatedAt`.
 */
export function generateAuditDiff<T extends Record<string, any>>(
  oldRecord: T,
  newRecord: T,
  ignoreFields: string[] = ['updatedAt', 'createdAt']
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];
  const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);

  for (const key of allKeys) {
    if (ignoreFields.includes(key)) continue;

    const oldVal = oldRecord[key];
    const newVal = newRecord[key];

    // Basic equality check. For deep objects (like JSON fields), we stringify.
    const oldStr = typeof oldVal === 'object' && oldVal !== null ? JSON.stringify(oldVal) : oldVal;
    const newStr = typeof newVal === 'object' && newVal !== null ? JSON.stringify(newVal) : newVal;

    if (oldStr !== newStr) {
      changes.push({
        field: key,
        oldValue: oldVal ?? null,
        newValue: newVal ?? null,
      });
    }
  }

  return changes;
}
