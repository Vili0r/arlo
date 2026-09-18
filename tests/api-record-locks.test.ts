import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as releaseLockHandler } from "@/app/api/record-locks/release/route";
import { POST as releaseAllLocksHandler } from "@/app/api/record-locks/release-all/route";
import { LockEntityType } from "@prisma/client";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    recordLock: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("POST /api/record-locks/release", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, orgId: null });
    const req = new Request("http://localhost:3000/api/record-locks/release", {
      method: "POST",
      body: JSON.stringify({ entityType: LockEntityType.Complaint, recordId: "cmp_1" }),
    });

    const res = await releaseLockHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if body is missing or empty", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1", orgId: "org_1" });
    const req = new Request("http://localhost:3000/api/record-locks/release", {
      method: "POST",
      body: "",
    });

    const res = await releaseLockHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing body");
  });

  it("should return 400 if required parameters are missing in body", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1", orgId: "org_1" });
    const req = new Request("http://localhost:3000/api/record-locks/release", {
      method: "POST",
      body: JSON.stringify({ recordId: "cmp_1" }), // Missing entityType
    });

    const res = await releaseLockHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing parameters");
  });

  it("should delete matching lock record and return success: true", async () => {
    mockAuth.mockResolvedValue({ userId: "user_qa", orgId: "org_alpha" });
    mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 1 });

    const req = new Request("http://localhost:3000/api/record-locks/release", {
      method: "POST",
      body: JSON.stringify({
        entityType: LockEntityType.Complaint,
        recordId: "cmp_alpha_99",
      }),
    });

    const res = await releaseLockHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockPrisma.recordLock.deleteMany).toHaveBeenCalledWith({
      where: {
        orgId: "org_alpha",
        entityType: LockEntityType.Complaint,
        recordId: "cmp_alpha_99",
        lockedById: "user_qa",
      },
    });
  });
});

describe("POST /api/record-locks/release-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await releaseAllLocksHandler();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should delete all locks for the active user and return released count", async () => {
    mockAuth.mockResolvedValue({ userId: "user_engineer_1" });
    mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 4 });

    const res = await releaseAllLocksHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.releasedLocksCount).toBe(4);
    expect(mockPrisma.recordLock.deleteMany).toHaveBeenCalledWith({
      where: {
        lockedById: "user_engineer_1",
      },
    });
  });
});
