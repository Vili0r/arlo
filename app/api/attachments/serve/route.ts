import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function isAllowedStorageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    // Only allow secure HTTPS protocols
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    // Block internal network and metadata service addresses (SSRF mitigation)
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "169.254.169.254" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    // Permit trusted blob domains or vercel storage hosts
    return (
      hostname.endsWith(".blob.vercel-storage.com") ||
      hostname.endsWith(".vercel-storage.com") ||
      hostname.endsWith("blob.core.windows.net") ||
      hostname.endsWith("amazonaws.com")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("url");
  const fileName = searchParams.get("filename") || "attachment";
  const isDownload = searchParams.get("download") === "true";

  if (!fileUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Security: Guard against arbitrary SSRF URLs
  if (!isAllowedStorageUrl(fileUrl)) {
    return new NextResponse("Forbidden file host or invalid URL protocol", { status: 403 });
  }

  // Multi-tenant check: If an attachment record exists for this URL, verify tenant ownership
  if (orgId) {
    const attachmentRecord = await prisma.attachment.findFirst({
      where: { fileUrl },
      select: { orgId: true },
    });

    if (attachmentRecord && attachmentRecord.orgId !== orgId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  try {
    // 1. Attempt to fetch private blob via @vercel/blob SDK using server credentials
    try {
      const blobResult = await get(fileUrl, { access: "private" });
      if (blobResult && blobResult.statusCode === 200 && blobResult.stream) {
        const contentType =
          blobResult.blob.contentType || "application/octet-stream";
        const disposition = isDownload
          ? `attachment; filename="${encodeURIComponent(fileName)}"`
          : `inline; filename="${encodeURIComponent(fileName)}"`;

        return new NextResponse(blobResult.stream as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": disposition,
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    } catch (blobErr) {
      console.warn(
        "Private blob get attempt failed, trying fallback:",
        blobErr
      );
    }

    // 2. Direct fetch fallback for public blobs
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return new NextResponse(
        `Failed to fetch file from source (${response.statusText})`,
        {
          status: response.status,
        }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(fileName)}"`
      : `inline; filename="${encodeURIComponent(fileName)}"`;

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("[Attachment Serve Error]", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(message, { status: 500 });
  }
}

