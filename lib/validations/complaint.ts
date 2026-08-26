import * as z from "zod";
import { Priority, Death, ComplaintStatus } from "@prisma/client";

export const ProductEntrySchema = z.object({
  id: z.string().optional(),
  occurrence: z.string().optional(),
  materialNumber: z.string().optional(),
  materialDescription: z.string().optional(),
  serialNumber: z.string().optional(),
  batchNumber: z.string().optional(),
  annexA_Category: z.string().optional(),
  asReportedCode1: z.string().optional(),
  asReportedCode2: z.string().optional(),
  softwareVersion: z.string().optional(),
});

export const PatientEntrySchema = z.object({
  id: z.string().optional(),
  patientName: z.string().optional(),
  patientImpact: z.string().optional(),
  patientImpactDesc: z.string().optional(),
  sex: z.string().optional(),
  age: z.string().optional(),
  annexE_Code: z.string().optional(),
  annexF_Code: z.string().optional(),
});

export const AttachmentSchema = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
});

export const ComplaintFormSchema = z.object({
  shortDescription: z.string().min(1, "Short Description is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(ComplaintStatus).optional(), // optional because new forms don't have status selection
  awarenessDate: z.date(),
  dateReceived: z.date(),
  death: z.nativeEnum(Death),
  complaintOwnerId: z.string().optional(),
  
  customerName: z.string().min(1, "Customer Name is required"),
  customerType: z.string().min(1, "Customer Type is required"),
  initialReporterName: z.string().min(1, "Reporter First Name is required"),
  initialReporterSurname: z.string().min(1, "Reporter Surname is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  telNumber: z.string().optional(),
  countryEventOccurred: z.string().min(1, "Country of Event is required"),
  region: z.string().min(1, "Region is required"),

  attachments: z.array(AttachmentSchema),
  products: z.array(ProductEntrySchema),
  patients: z.array(PatientEntrySchema),
});

export type ComplaintFormValues = z.infer<typeof ComplaintFormSchema>;
