import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadFileToBlob } from "@/lib/actions/upload";
import { PERMISSIONS } from "@/lib/auth-guard";

const { mockRequireOrgAuth, mockPutBlob } = vi.hoisted(() => ({
  mockRequireOrgAuth: vi.fn(),
  mockPutBlob: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: (...args: any[]) => mockRequireOrgAuth(...args),
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
  },
}));

vi.mock("@vercel/blob", () => ({
  put: (...args: any[]) => mockPutBlob(...args),
}));

describe("uploadFileToBlob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require COMPLAINTS_CREATE permission", async () => {
    mockRequireOrgAuth.mockRejectedValue(new Error("Forbidden: Missing permissions"));
    const formData = new FormData();
    formData.append("file", new File(["test-content"], "test.pdf", { type: "application/pdf" }));

    await expect(uploadFileToBlob(formData)).rejects.toThrow("Forbidden: Missing permissions");
    expect(mockRequireOrgAuth).toHaveBeenCalledWith(PERMISSIONS.COMPLAINTS_CREATE);
  });

  it("should throw error if file is missing in formData", async () => {
    mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_1" });
    const formData = new FormData();

    await expect(uploadFileToBlob(formData)).rejects.toThrow("No file provided");
  });

  it("should upload file to private blob storage and return file metadata", async () => {
    mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_1" });
    mockPutBlob.mockResolvedValue({
      url: "https://storage.blob.vercel-storage.com/attachments/pump-log-xyz123.csv",
    });

    const fileContent = "timestamp,event\n2026-09-18,motor_stall";
    const file = new File([fileContent], "pump-log.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadFileToBlob(formData);

    expect(result).toEqual({
      fileUrl: "https://storage.blob.vercel-storage.com/attachments/pump-log-xyz123.csv",
      fileName: "pump-log.csv",
      fileSize: file.size,
      mimeType: "text/csv",
    });
    expect(mockPutBlob).toHaveBeenCalledWith("pump-log.csv", file, {
      access: "private",
      addRandomSuffix: true,
    });
  });
});
