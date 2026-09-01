"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  File as FileIcon,
  Loader2,
  Eye,
  Download,
  ExternalLink,
  FileText,
  FileImage,
  Film,
  Music,
} from "lucide-react";
import { uploadFileToBlob } from "@/lib/actions/upload";
import { AttachmentInput } from "@/lib/actions/complaints";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UploadedFile extends AttachmentInput {
  id: string;
  state: "uploading" | "done" | "error";
  file: File;
}

interface FileUploaderProps {
  attachments: AttachmentInput[];
  onChange: (attachments: AttachmentInput[]) => void;
  disabled?: boolean;
}

export function FileUploader({ attachments, onChange, disabled }: FileUploaderProps) {
  const [uploads, setUploads] = React.useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = React.useState<UploadedFile | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync external changes (like initial load in edit form)
  React.useEffect(() => {
    setUploads((prev) => {
      // We only sync initial attachments that are already uploaded and don't exist in our state
      const existingUrls = new Set(
        prev.filter((u) => u.fileUrl).map((u) => u.fileUrl)
      );
      const newUploads = attachments
        .filter((a) => a.fileUrl && !existingUrls.has(a.fileUrl))
        .map((a) => ({
          ...a,
          id: a.fileUrl,
          state: "done" as const,
          file: new File([], a.fileName, { type: a.mimeType || "" }), // Dummy file
        }));

      if (newUploads.length > 0) {
        return [...prev, ...newUploads];
      }
      return prev;
    });
  }, [attachments]);

  const notifyChange = (newUploads: UploadedFile[]) => {
    const doneUploads = newUploads
      .filter((u) => u.state === "done")
      .map((u) => ({
        fileUrl: u.fileUrl,
        fileName: u.fileName,
        fileSize: u.fileSize,
        mimeType: u.mimeType,
      }));
    onChange(doneUploads);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileUrl: "",
      state: "uploading" as const,
    }));

    setUploads((prev) => [...prev, ...newUploads]);
    notifyChange([...uploads, ...newUploads]);

    // Upload files sequentially
    for (const uploadItem of newUploads) {
      try {
        const formData = new FormData();
        formData.append("file", uploadItem.file);

        const result = await uploadFileToBlob(formData);

        setUploads((prev) => {
          const updated = prev.map((u) =>
            u.id === uploadItem.id
              ? { ...u, ...result, state: "done" as const }
              : u
          );
          setTimeout(() => notifyChange(updated), 0);
          return updated;
        });
      } catch (error) {
        console.error("Upload failed for", uploadItem.fileName, error);
        setUploads((prev) => {
          const updated = prev.map((u) =>
            u.id === uploadItem.id ? { ...u, state: "error" as const } : u
          );
          setTimeout(() => notifyChange(updated), 0);
          return updated;
        });
      }
    }

    // Clear the input so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploads((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      setTimeout(() => notifyChange(updated), 0);
      return updated;
    });
    if (previewFile?.id === id) {
      setPreviewFile(null);
    }
  };

  const getAuthenticatedServeUrl = (
    fileUrl: string,
    fileName?: string,
    download?: boolean
  ) => {
    if (!fileUrl) return "";
    const params = new URLSearchParams();
    params.set("url", fileUrl);
    if (fileName) params.set("filename", fileName);
    if (download) params.set("download", "true");
    return `/api/attachments/serve?${params.toString()}`;
  };

  const handleDownload = async (url: string, fileName: string) => {
    if (!url) return;
    setIsDownloading(true);
    const serveUrl = getAuthenticatedServeUrl(url, fileName, true);

    try {
      const response = await fetch(serveUrl);
      if (!response.ok) {
        throw new Error(`Download response status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Blob download failed, using direct serve URL fallback", err);
      const link = document.createElement("a");
      link.href = serveUrl;
      link.download = fileName || "attachment";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const getFileIcon = (mimeType?: string | null, fileName?: string) => {
    if (mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName || "")) {
      return <FileImage className="text-purple-500 h-4 w-4" />;
    }
    if (mimeType?.startsWith("video/") || /\.(mp4|webm|mov|avi)$/i.test(fileName || "")) {
      return <Film className="text-blue-500 h-4 w-4" />;
    }
    if (mimeType?.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(fileName || "")) {
      return <Music className="text-amber-500 h-4 w-4" />;
    }
    if (mimeType === "application/pdf" || /\.pdf$/i.test(fileName || "")) {
      return <FileText className="text-rose-500 h-4 w-4" />;
    }
    return <FileIcon className="text-muted-foreground h-4 w-4" />;
  };

  const isImage = (mimeType?: string | null, fileName?: string) => {
    return (
      mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName || "")
    );
  };

  const isPdf = (mimeType?: string | null, fileName?: string) => {
    return mimeType === "application/pdf" || /\.pdf$/i.test(fileName || "");
  };

  const isVideo = (mimeType?: string | null, fileName?: string) => {
    return mimeType?.startsWith("video/") || /\.(mp4|webm|mov|avi)$/i.test(fileName || "");
  };

  const isAudio = (mimeType?: string | null, fileName?: string) => {
    return mimeType?.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(fileName || "");
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      {!disabled && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Click to upload files</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload images, PDFs, reports, or evidence files
          </p>
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Attachment Items Grid */}
      {uploads.length > 0 && (
        <AttachmentGroup>
          {uploads.map((upload) => {
            const hasUrl = upload.state === "done" && !!upload.fileUrl;
            const imgFile = isImage(upload.mimeType, upload.fileName);
            const serveUrl = getAuthenticatedServeUrl(
              upload.fileUrl,
              upload.fileName
            );

            return (
              <Attachment
                key={upload.id}
                state={upload.state}
                className="group/item hover:border-primary/50 transition-all shadow-xs"
              >
                {/* Media Thumbnail with click to preview */}
                <AttachmentMedia
                  variant={imgFile ? "image" : "icon"}
                  onClick={() => hasUrl && setPreviewFile(upload)}
                  className={hasUrl ? "cursor-pointer" : undefined}
                >
                  {imgFile && upload.fileUrl ? (
                    <img
                      src={serveUrl}
                      alt={upload.fileName}
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                    />
                  ) : (
                    getFileIcon(upload.mimeType, upload.fileName)
                  )}
                </AttachmentMedia>

                {/* File Information */}
                <AttachmentContent
                  onClick={() => hasUrl && setPreviewFile(upload)}
                  className={hasUrl ? "cursor-pointer select-none" : undefined}
                >
                  <AttachmentTitle className="hover:underline cursor-pointer">
                    {upload.fileName}
                  </AttachmentTitle>
                  <AttachmentDescription>
                    {upload.fileSize ? formatBytes(upload.fileSize) : ""}
                    {upload.state === "uploading" && " (Uploading...)"}
                    {upload.state === "error" && " (Failed)"}
                  </AttachmentDescription>
                </AttachmentContent>

                {/* Action Buttons: View, Download, Remove */}
                <AttachmentActions>
                  {upload.state === "uploading" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />
                  )}

                  {hasUrl && (
                    <>
                      {/* View / Preview Button */}
                      <AttachmentAction
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile(upload);
                        }}
                        title="View / Preview"
                        className="hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="sr-only">View</span>
                      </AttachmentAction>

                      {/* Download Button */}
                      <AttachmentAction
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(upload.fileUrl, upload.fileName);
                        }}
                        title="Download file"
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only">Download</span>
                      </AttachmentAction>
                    </>
                  )}

                  {/* Remove Button */}
                  {!disabled && (
                    <AttachmentAction
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(upload.id);
                      }}
                      title="Remove attachment"
                      className="hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove</span>
                    </AttachmentAction>
                  )}
                </AttachmentActions>
              </Attachment>
            );
          })}
        </AttachmentGroup>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-6 bg-card border border-border">
            <DialogHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border shrink-0">
                    {getFileIcon(previewFile.mimeType, previewFile.fileName)}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-sm font-semibold truncate block">
                      {previewFile.fileName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{previewFile.fileSize ? formatBytes(previewFile.fileSize) : "N/A"}</span>
                      {previewFile.mimeType && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] font-mono py-0">
                            {previewFile.mimeType}
                          </Badge>
                        </>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Preview Body with Authenticated URL Stream */}
            <div className="flex-1 overflow-auto py-4 flex items-center justify-center min-h-[300px] max-h-[60vh] rounded-lg bg-muted/20 border border-border/60">
              {isImage(previewFile.mimeType, previewFile.fileName) && previewFile.fileUrl ? (
                <div className="relative max-h-full max-w-full flex items-center justify-center p-2">
                  <img
                    src={getAuthenticatedServeUrl(previewFile.fileUrl, previewFile.fileName)}
                    alt={previewFile.fileName}
                    className="max-h-[55vh] max-w-full object-contain rounded-md shadow-sm"
                  />
                </div>
              ) : isPdf(previewFile.mimeType, previewFile.fileName) && previewFile.fileUrl ? (
                <iframe
                  src={getAuthenticatedServeUrl(previewFile.fileUrl, previewFile.fileName)}
                  title={previewFile.fileName}
                  className="w-full h-[55vh] rounded-md border-0 bg-background"
                />
              ) : isVideo(previewFile.mimeType, previewFile.fileName) && previewFile.fileUrl ? (
                <video
                  src={getAuthenticatedServeUrl(previewFile.fileUrl, previewFile.fileName)}
                  controls
                  className="max-h-[55vh] max-w-full rounded-md shadow-sm"
                />
              ) : isAudio(previewFile.mimeType, previewFile.fileName) && previewFile.fileUrl ? (
                <div className="p-8 text-center space-y-4">
                  <Music className="h-16 w-16 text-muted-foreground mx-auto" />
                  <audio
                    src={getAuthenticatedServeUrl(previewFile.fileUrl, previewFile.fileName)}
                    controls
                    className="w-full max-w-md"
                  />
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto stroke-1" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{previewFile.fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inline preview is not available for this file type. You can download or open it in a new window.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewFile(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {previewFile.fileUrl && (
                  <>
                    <a
                      href={getAuthenticatedServeUrl(previewFile.fileUrl, previewFile.fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1.5 text-xs inline-flex items-center"
                      )}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open in New Tab</span>
                    </a>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isDownloading}
                      onClick={() =>
                        handleDownload(previewFile.fileUrl, previewFile.fileName)
                      }
                      className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>Download</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
