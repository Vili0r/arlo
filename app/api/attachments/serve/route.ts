import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
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
          },
        });
      }
    } catch (blobErr) {
      console.warn(
        "Private blob get attempt failed, trying fallback:",
        blobErr
      );
    }

    // 2. Direct fetch fallback for public blobs or other URLs
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
      },
    });
  } catch (error: unknown) {
    console.error("[Attachment Serve Error]", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(message, { status: 500 });
  }
}
