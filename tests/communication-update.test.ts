import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationStatus, AuditAction } from "@prisma/client";

const { mockTx, mockPrisma, mockAuthCtx } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_investigator_1",
    orgId: "org_test456",
  };

  const tx = {
    customerCommunication: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback) => callback(tx)),
    customerCommunication: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return { mockTx: tx, mockPrisma: prismaObj, mockAuthCtx: authCtx };
});

// Mock dependencies
vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { updateCustomerCommunication } from "@/lib/actions/communication";

describe("Customer Communication - Save & Update Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_investigator_1";
    mockAuthCtx.orgId = "org_test456";
  });

  const baseCommunication = {
    id: "comm_101",
    orgId: "org_test456",
    complaintId: "cmp_456",
    status: CommunicationStatus.OPEN,
    communicationDate: new Date("2026-08-10T14:30:00Z"),
    questionAsked: "Could you confirm the lot number and return sample availability?",
    customerResponse: "The lot number is LOT-9981. We have one sample retained.",
    internalNotes: "Follow up with courier for return label.",
    authorId: "user_investigator_1",
    author: {
      email: "investigator@arlo.io",
      firstName: "Alex",
      lastName: "Taylor",
    },
    attachments: [
      {
        id: "att_1",
        fileUrl: "https://blob.vercel.com/email-thread.pdf",
        fileName: "email-thread.pdf",
        fileSize: 1048576,
        mimeType: "application/pdf",
      },
    ],
  };

  describe("Saving and updating communication details", () => {
    it("should successfully update question asked, customer response, and internal notes", async () => {
      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication) // Initial lookup for diffing baseline
        .mockResolvedValueOnce({
          ...baseCommunication,
          questionAsked: "Updated inquiry: Did the pump exhibit error code E-42?",
          customerResponse: "Yes, error code E-42 displayed on the LCD panel.",
          internalNotes: "Confirmed hardware fault code.",
        }); // Lookup post-update

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        questionAsked: "Updated inquiry: Did the pump exhibit error code E-42?",
        customerResponse: "Yes, error code E-42 displayed on the LCD panel.",
        internalNotes: "Confirmed hardware fault code.",
      });

      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_update_1" });

      const result = await updateCustomerCommunication({
        communicationId: "comm_101",
        questionAsked: "Updated inquiry: Did the pump exhibit error code E-42?",
        customerResponse: "Yes, error code E-42 displayed on the LCD panel.",
        internalNotes: "Confirmed hardware fault code.",
      });

      expect(result).toBeDefined();
      expect(result.questionAsked).toBe("Updated inquiry: Did the pump exhibit error code E-42?");
      expect(result.customerResponse).toBe("Yes, error code E-42 displayed on the LCD panel.");
      expect(result.internalNotes).toBe("Confirmed hardware fault code.");

      // Verify update payload in database
      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: {
          id: "comm_101",
          orgId: "org_test456",
        },
        data: {
          status: CommunicationStatus.OPEN,
          questionAsked: "Updated inquiry: Did the pump exhibit error code E-42?",
          customerResponse: "Yes, error code E-42 displayed on the LCD panel.",
          internalNotes: "Confirmed hardware fault code.",
          communicationDate: baseCommunication.communicationDate,
        },
      });

      // Verify 21 CFR Part 11 AuditLog creation
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "CustomerCommunication",
            entityId: "comm_101",
            action: AuditAction.UPDATE,
            changedById: "user_investigator_1",
            complaintId: "cmp_456",
            reason: "Updated customer communication record",
          }),
        })
      );

      // Verify exact audit field diffs
      const auditPayload = mockTx.auditLog.create.mock.calls[0][0].data;
      const fieldChanges = auditPayload.fieldChanges as Array<{ field: string; oldValue: any; newValue: any }>;
      expect(fieldChanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "questionAsked",
            oldValue: "Could you confirm the lot number and return sample availability?",
            newValue: "Updated inquiry: Did the pump exhibit error code E-42?",
          }),
          expect.objectContaining({
            field: "customerResponse",
            oldValue: "The lot number is LOT-9981. We have one sample retained.",
            newValue: "Yes, error code E-42 displayed on the LCD panel.",
          }),
          expect.objectContaining({
            field: "internalNotes",
            oldValue: "Follow up with courier for return label.",
            newValue: "Confirmed hardware fault code.",
          }),
        ])
      );
    });

    it("should update communication date when provided as a string or Date object", async () => {
      const newDateStr = "2026-08-20T09:00:00.000Z";
      const newDateObj = new Date(newDateStr);

      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce({
          ...baseCommunication,
          communicationDate: newDateObj,
        });

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        communicationDate: newDateObj,
      });

      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_date_1" });

      const result = await updateCustomerCommunication({
        communicationId: "comm_101",
        communicationDate: newDateStr,
      });

      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            communicationDate: newDateObj,
          }),
        })
      );
      expect(result.communicationDate).toEqual(newDateObj);
    });

    it("should preserve existing fields when only partial fields are updated", async () => {
      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce({
          ...baseCommunication,
          internalNotes: "Internal note added only.",
        });

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        internalNotes: "Internal note added only.",
      });

      mockTx.auditLog.create.mockResolvedValue({ id: "audit_partial" });

      await updateCustomerCommunication({
        communicationId: "comm_101",
        internalNotes: "Internal note added only.",
      });

      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_101", orgId: "org_test456" },
        data: {
          status: CommunicationStatus.OPEN,
          questionAsked: baseCommunication.questionAsked,
          customerResponse: baseCommunication.customerResponse,
          internalNotes: "Internal note added only.",
          communicationDate: baseCommunication.communicationDate,
        },
      });
    });

    it("should support updating status with custom audit reason", async () => {
      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce({
          ...baseCommunication,
          status: CommunicationStatus.IN_PROGRESS,
        });

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.IN_PROGRESS,
      });

      mockTx.auditLog.create.mockResolvedValue({ id: "audit_status_custom" });

      await updateCustomerCommunication({
        communicationId: "comm_101",
        status: CommunicationStatus.IN_PROGRESS,
        reason: "Customer requested additional test protocol before answering",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.STATUS_CHANGE,
            reason: "Customer requested additional test protocol before answering",
          }),
        })
      );
    });
  });

  describe("Attachment management", () => {
    it("should upload and attach new files to the customer communication and parent complaint", async () => {
      const newAttachments = [
        {
          fileUrl: "https://blob.vercel.com/customer-photo-1.jpg",
          fileName: "customer-photo-1.jpg",
          fileSize: 2048500,
          mimeType: "image/jpeg",
        },
        {
          fileUrl: "https://blob.vercel.com/hospital-letter.pdf",
          fileName: "hospital-letter.pdf",
          fileSize: 524288,
          mimeType: "application/pdf",
        },
      ];

      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce({
          ...baseCommunication,
          attachments: [...baseCommunication.attachments, ...newAttachments],
        });

      mockTx.attachment.createMany.mockResolvedValue({ count: 2 });
      mockTx.customerCommunication.update.mockResolvedValue(baseCommunication);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_att_1" });

      await updateCustomerCommunication({
        communicationId: "comm_101",
        newAttachments,
      });

      // Verify attachments created with complaint and communication links
      expect(mockTx.attachment.createMany).toHaveBeenCalledWith({
        data: [
          {
            orgId: "org_test456",
            complaintId: "cmp_456",
            communicationId: "comm_101",
            fileUrl: "https://blob.vercel.com/customer-photo-1.jpg",
            fileName: "customer-photo-1.jpg",
            fileSize: 2048500,
            mimeType: "image/jpeg",
            uploadedById: "user_investigator_1",
          },
          {
            orgId: "org_test456",
            complaintId: "cmp_456",
            communicationId: "comm_101",
            fileUrl: "https://blob.vercel.com/hospital-letter.pdf",
            fileName: "hospital-letter.pdf",
            fileSize: 524288,
            mimeType: "application/pdf",
            uploadedById: "user_investigator_1",
          },
        ],
      });
    });

    it("should handle null or optional attachment metadata (fileSize, mimeType)", async () => {
      const newAttachments = [
        {
          fileUrl: "https://blob.vercel.com/audio-log.wav",
          fileName: "audio-log.wav",
        },
      ];

      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce(baseCommunication);

      mockTx.attachment.createMany.mockResolvedValue({ count: 1 });
      mockTx.customerCommunication.update.mockResolvedValue(baseCommunication);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_att_2" });

      await updateCustomerCommunication({
        communicationId: "comm_101",
        newAttachments,
      });

      expect(mockTx.attachment.createMany).toHaveBeenCalledWith({
        data: [
          {
            orgId: "org_test456",
            complaintId: "cmp_456",
            communicationId: "comm_101",
            fileUrl: "https://blob.vercel.com/audio-log.wav",
            fileName: "audio-log.wav",
            fileSize: null,
            mimeType: null,
            uploadedById: "user_investigator_1",
          },
        ],
      });
    });
  });

  describe("Multi-tenant isolation and error handling", () => {
    it("should reject update and throw error when communication record does not exist", async () => {
      mockTx.customerCommunication.findUnique.mockResolvedValue(null);

      await expect(
        updateCustomerCommunication({
          communicationId: "comm_non_existent",
          internalNotes: "Should fail",
        })
      ).rejects.toThrow("Customer communication record not found or access denied.");

      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should enforce tenant isolation and reject update when communication belongs to another organization", async () => {
      // simulate query with orgId yielding null due to mismatch
      mockTx.customerCommunication.findUnique.mockResolvedValue(null);

      await expect(
        updateCustomerCommunication({
          communicationId: "comm_other_org",
          internalNotes: "Cross tenant attempt",
        })
      ).rejects.toThrow("Customer communication record not found or access denied.");

      expect(mockTx.customerCommunication.findUnique).toHaveBeenCalledWith({
        where: {
          id: "comm_other_org",
          orgId: "org_test456",
        },
        include: expect.any(Object),
      });

      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
