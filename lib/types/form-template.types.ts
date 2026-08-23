// =============================================================================
// Dynamic Form Template Types
// JSONB Template Pattern for 21 CFR Part 11 Compliant Custom Fields
// =============================================================================

/**
 * Supported custom field types for FormTemplate schemaDefinition.
 * Each type maps to a specific UI input component and validation rule.
 */
export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox";

/**
 * A single field definition inside FormTemplate.schemaDefinition.
 *
 * Compliance note: Fields are NEVER physically deleted from the schema.
 * When an admin removes a field, `archived` is set to `true` so that
 * historical Complaint data referencing that field remains renderable
 * for FDA audit and inspection purposes.
 */
export interface FormFieldDefinition {
  /** Immutable hash key, e.g. "field_8f72a". Used as the key in customData. */
  fieldId: string;

  /** Human-readable label displayed in the UI and audit logs. */
  label: string;

  /** The input type for this field. */
  type: CustomFieldType;

  /** Whether the field is mandatory on the complaint form. */
  required: boolean;

  /**
   * Soft-delete flag. When true, the field is hidden from new forms
   * but remains in the schema so historical data can be rendered.
   * NEVER physically remove a field definition — 21 CFR Part 11.
   */
  archived: boolean;

  /** Valid options for "select" and "multiselect" field types. */
  options?: string[];

  /** Display order on the form (ascending). */
  order: number;

  /** Placeholder text for text/textarea/number inputs. */
  placeholder?: string;

  /** Help text displayed below the field input. */
  helpText?: string;
}

/**
 * The full template schema stored in FormTemplate.schemaDefinition.
 * This is the blueprint that defines which custom fields exist for
 * an organization's entity type (e.g., "Complaint").
 */
export type FormSchemaDefinition = FormFieldDefinition[];

/**
 * The customData payload stored on Complaint (and future entity types).
 * Keys are immutable fieldId hashes (e.g., "field_8f72a"), never
 * human-readable labels. Values are the user-entered data.
 *
 * @example
 * {
 *   "field_8f72a": "Lot 2026-A",
 *   "field_3bc91": 42,
 *   "field_d0e14": ["Option A", "Option B"],
 *   "field_aa1f2": true
 * }
 */
export type CustomDataPayload = Record<string, unknown>;

/**
 * A single entry in the granular audit diff produced by generateJsonDiff.
 * Stored in AuditLog.fieldChanges as Array<AuditFieldChange>.
 *
 * FDA inspectors can read this to see exactly which custom field changed,
 * what the previous value was, and what the new value is — with the
 * human-readable label resolved from the template schema.
 */
export interface AuditFieldChange {
  /** The immutable field hash key, e.g. "field_8f72a". */
  fieldId: string;

  /**
   * The human-readable label resolved from the FormTemplate schema.
   * Falls back to the raw fieldId if the field is not found in the template
   * (e.g., orphaned data from a template migration).
   */
  fieldLabel: string;

  /** The value before the change. `undefined` if the field was newly added. */
  oldValue: unknown;

  /** The value after the change. `undefined` if the field was removed. */
  newValue: unknown;
}

// =============================================================================
// Utility: Generate a unique, immutable field ID
// =============================================================================

/**
 * Generates a unique, immutable field ID for use as a customData key.
 * Format: "field_" + 8 random hex characters (e.g., "field_8f72a3b1").
 *
 * Uses crypto.randomUUID() and takes the first 8 hex chars for
 * sufficient uniqueness within a single template's field set.
 */
export function generateFieldId(): string {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return `field_${uuid.slice(0, 8)}`;
}
