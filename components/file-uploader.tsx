"use client";

import * as React from "react";
import { UploadCloud, X, File, Loader2 } from "lucide-react";
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

interface UploadedFile extends AttachmentInput {
  id: string;
  state: "uploading" | "done" | "error";
  file: File;
}

interface FileUploaderProps {
  attachments: AttachmentInput[];
  onChange: (attachments: AttachmentInput[]) => void;
}

export function FileUploader({ attachments, onChange }: FileUploaderProps) {
  const [uploads, setUploads] = React.useState<UploadedFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync external changes (like initial load in edit form)
  React.useEffect(() => {
    // We only sync initial attachments that are already uploaded and don't exist in our state
    const existingUrls = new Set(uploads.map(u => u.fileUrl));
    const newUploads = attachments
      .filter(a => !existingUrls.has(a.fileUrl))
      .map(a => ({
        ...a,
        id: a.fileUrl,
        state: "done" as const,
        file: new File([], a.fileName, { type: a.mimeType || "" }), // Dummy file
      }));
    
    if (newUploads.length > 0) {
      setUploads(prev => [...prev, ...newUploads]);
    }
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
    notifyChange([...uploads, ...newUploads]); // Won't include these yet as they are uploading

    // Upload files sequentially (or in parallel)
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
          notifyChange(updated);
          return updated;
        });
      } catch (error) {
        console.error("Upload failed for", uploadItem.fileName, error);
        setUploads((prev) => {
          const updated = prev.map((u) =>
            u.id === uploadItem.id ? { ...u, state: "error" as const } : u
          );
          notifyChange(updated);
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
      notifyChange(updated);
      return updated;
    });
  };

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">Click to upload files</p>
        <p className="text-xs text-muted-foreground mt-1">Upload images, PDFs, or documents</p>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {uploads.length > 0 && (
        <AttachmentGroup>
          {uploads.map((upload) => (
            <Attachment 
              key={upload.id} 
              state={upload.state}
            >
              <AttachmentMedia variant={upload.mimeType?.startsWith("image/") ? "image" : "icon"}>
                {upload.mimeType?.startsWith("image/") && upload.fileUrl ? (
                  <img src={upload.fileUrl} alt={upload.fileName} />
                ) : (
                  <File className="text-muted-foreground" />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{upload.fileName}</AttachmentTitle>
                <AttachmentDescription>
                  {upload.fileSize ? formatBytes(upload.fileSize) : ""}
                  {upload.state === "uploading" && " (Uploading...)"}
                  {upload.state === "error" && " (Failed)"}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(upload.id);
                  }}
                  title="Remove"
                >
                  <X />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      )}
    </div>
  );
}
