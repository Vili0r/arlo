import type {
  AuditFieldChange,
  CustomDataPayload,
  FormSchemaDefinition,
} from "@/lib/types/form-template.types";

// =============================================================================
// JSON Diff Utility for 21 CFR Part 11 Audit Trail
//
// Pure, side-effect-free function. Compares two customData JSONB payloads
// and produces a strictly-typed array of field-level changes with
// human-readable labels resolved from the FormTemplate schema.
// =============================================================================

/**
 * Performs a deep comparison of two values using JSON serialization.
 * Handles primitives, arrays, and plain objects.
 *
 * Returns `true` if the values are deeply equal, `false` otherwise.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // Fast path: reference or primitive equality
  if (a === b) return true;

  // Handle null/undefined asymmetry
  if (a == null || b == null) return a === b;

  // For objects and arrays, compare via canonical JSON serialization
  if (typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Recursively sorts object keys for deterministic JSON serialization.
 * Arrays are preserved in order (element order is semantically significant).
 */
function sortKeys(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Generates a granular diff between two customData JSONB payloads,
 * resolving each field's human-readable label from the template schema.
 *
 * Compliance: This function is designed for 21 CFR Part 11 audit trails.
 * It captures exactly which custom fields changed, their previous values,
 * and their new values — making the audit log readable by FDA inspectors.
 *
 * @param oldData - The previous customData payload (before mutation).
 *                  Pass `null` or `undefined` for CREATE operations.
 * @param newData - The new customData payload (after mutation).
 *                  Pass `null` or `undefined` for DELETE operations.
 * @param templateSchema - The FormTemplate.schemaDefinition array.
 *                         Used to resolve fieldId → human-readable label.
 *                         Must include archived fields for historical rendering.
 *
 * @returns A strictly-typed array of AuditFieldChange entries.
 *          Empty array if no changes detected.
 *
 * @example
 * ```ts
 * const changes = generateJsonDiff(
 *   { field_8f72a: "old value", field_3bc91: 42 },
 *   { field_8f72a: "new value", field_3bc91: 42, field_d0e14: true },
 *   templateSchema
 * );
 * // Returns:
 * // [
 * //   { fieldId: "field_8f72a", fieldLabel: "Custom Lot ID", oldValue: "old value", newValue: "new value" },
 * //   { fieldId: "field_d0e14", fieldLabel: "Sterile Packaging", oldValue: undefined, newValue: true },
 * // ]
 * ```
 */
export function generateJsonDiff(
  oldData: CustomDataPayload | null | undefined,
  newData: CustomDataPayload | null | undefined,
  templateSchema: FormSchemaDefinition
): AuditFieldChange[] {
  const previous = oldData ?? {};
  const current = newData ?? {};

  // Build a lookup map: fieldId → human-readable label
  // Includes archived fields so historical data can still be resolved
  const labelMap = new Map<string, string>();
  for (const field of templateSchema) {
    labelMap.set(field.fieldId, field.label);
  }

  // Collect the union of all keys across both payloads
  const allKeys = new Set<string>([
    ...Object.keys(previous),
    ...Object.keys(current),
  ]);

  const changes: AuditFieldChange[] = [];

  for (const key of allKeys) {
    const oldValue = previous[key];
    const newValue = current[key];

    // Skip unchanged fields
    if (deepEqual(oldValue, newValue)) continue;

    changes.push({
      fieldId: key,
      // Resolve human-readable label from template; fall back to raw fieldId
      // for orphaned keys (e.g., data from a removed template field)
      fieldLabel: labelMap.get(key) ?? key,
      oldValue,
      newValue,
    });
  }

  return changes;
}
