"use client";

import * as React from "react";
import { MIREditForm, MIREditFormProps } from "@/components/mir-form";

export {
  mirSchema as initialMirSchema,
  mirSchema,
  STATUS_LABEL,
  REPORT_TYPE_OPTIONS,
  CLASSIFICATION_OPTIONS,
  AUTHORITY_PRESETS,
  SUBMISSION_METHODS,
  DEVICE_RELATEDNESS_OPTIONS,
  CAUSALITY_OPTIONS,
  SERIOUSNESS_OPTIONS,
  RISK_ASSESSMENT_OPTIONS,
} from "@/lib/validations/mir";
export type { MIRFormValues as InitialMIRFormValues } from "@/lib/validations/mir";
export type { MIREditFormProps as InitialMIREditFormProps } from "@/components/mir-form";

export function InitialMIREditForm(props: MIREditFormProps) {
  return <MIREditForm defaultReportType="INITIAL" {...props} />;
}
