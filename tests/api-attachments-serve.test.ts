import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/attachments/serve/route";

const { mockAuth, mockPrisma, mockGetBlob } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    attachment: {
      findFirst: vi.fn(),
    },
  },
  mockGetBlob: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@vercel/blob", () => ({
  get: (...args: any[]) => mockGetBlob(...args),
}));

describe("GET /api/attachments/serve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, orgId: null });
    const req = new NextRequest("http://localhost:3000/api/attachments/serve?url=https://test.blob.vercel-storage.com/file.pdf");

    const res = await GET(req);
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toContain("Unauthorized");
  });

  it("should return 400 when url query parameter is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123", orgId: "org_123" });
    const req = new NextRequest("http://localhost:3000/api/attachments/serve");

    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Missing url parameter");
  });

  it("should return 403 when url points to an internal/disallowed address (SSRF mitigation)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123", orgId: "org_123" });

    const forbiddenUrls = [
      "http://169.254.169.254/latest/meta-data/",
      "http://localhost:5432/dump",
      "http://127.0.0.1:8080/secret",
      "https://attacker-controlled-site.com/exploit.exe",
      "ftp://example.com/file.txt",
    ];

    for (const url of forbiddenUrls) {
      const req = new NextRequest(`http://localhost:3000/api/attachments/serve?url=${encodeURIComponent(url)}`);
      const res = await GET(req);
      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain("Forbidden file host or invalid URL protocol");
    }
  });

  it("should return 403 when attachment belongs to another tenant", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123", orgId: "org_tenant_A" });
    mockPrisma.attachment.findFirst.mockResolvedValue({
      orgId: "org_tenant_B", // Different tenant
    });

    const fileUrl = "https://my-store.public.blob.vercel-storage.com/patient-report.pdf";
    const req = new NextRequest(`http://localhost:3000/api/attachments/serve?url=${encodeURIComponent(fileUrl)}`);

    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toBe("Forbidden");
    expect(mockPrisma.attachment.findFirst).toHaveBeenCalledWith({
      where: { fileUrl },
      select: { orgId: true },
    });
  });

  it("should return stream with proper headers when blob is fetched successfully via private blob SDK", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123", orgId: "org_tenant_A" });
    mockPrisma.attachment.findFirst.mockResolvedValue({
      orgId: "org_tenant_A",
    });

    const fileUrl = "https://my-store.public.blob.vercel-storage.com/evidence.pdf";
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("PDF-BINARY-CONTENT"));
        controller.close();
      },
    });

    mockGetBlob.mockResolvedValue({
      statusCode: 200,
      stream: mockStream,
      blob: {
        contentType: "application/pdf",
      },
    });

    const req = new NextRequest(
      `http://localhost:3000/api/attachments/serve?url=${encodeURIComponent(fileUrl)}&filename=evidence.pdf&download=true`
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=\"evidence.pdf\"");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
