"use client";

import * as React from "react";
import { MIREditForm, MIREditFormProps } from "@/components/mir-form";

export {
  mirSchema as finalMirSchema,
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
export type { MIRFormValues as FinalMIRFormValues } from "@/lib/validations/mir";
export type { MIREditFormProps as FinalMIREditFormProps } from "@/components/mir-form";

export function FinalMIREditForm(props: MIREditFormProps) {
  return <MIREditForm defaultReportType="FINAL" {...props} />;
}
