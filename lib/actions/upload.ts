"use server";

import { put } from "@vercel/blob";
import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";

export async function uploadFileToBlob(formData: FormData) {
  await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  const blob = await put(file.name, file, { access: "private" });

  return {
    fileUrl: blob.url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
