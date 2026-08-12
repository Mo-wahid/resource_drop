"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, X, FileText, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function RequirementsUploadField({
  projectId,
  onUploadComplete,
  onRemove,
}: {
  projectId: string;
  onUploadComplete: (data: { key: string; filename: string }) => void;
  onRemove: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = async (fileToUpload: File) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);
    setIsSuccess(false);

    try {
      // 1. Get presigned URL
      const res = await fetch(`/api/projects/${projectId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: fileToUpload.name,
          contentType: fileToUpload.type,
          fileSize: fileToUpload.size,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate upload URL");
      }

      const { url, key } = await res.json();

      // 2. Upload directly to MinIO using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload aborted"));

        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", fileToUpload.type);
        xhr.send(fileToUpload);
      });

      setIsSuccess(true);
      onUploadComplete({ key, filename: fileToUpload.name });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (selected?: File) => {
    setError(null);
    setIsSuccess(false);
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Only PDF, Markdown (.md), and DOCX files are allowed.");
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("File exceeds the 10MB size limit.");
      return;
    }

    setFile(selected);
    uploadFile(selected).catch(console.error);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    setFile(null);
    setIsSuccess(false);
    setProgress(0);
    setError(null);
    onRemove();
  };

  return (
    <div
      className="min-w-0 w-full"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {!file ? (
        <div className={cn(
          "flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-md bg-muted/20 gap-2 transition-colors duration-200 cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.md,.docx,application/pdf,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <FileUp className="size-5 text-muted-foreground" />
          <div className="text-center">
            <span className="text-sm font-medium text-primary">Click to upload</span>
            <span className="text-sm text-muted-foreground"> or drag and drop</span>
          </div>
          <p className="text-xs text-muted-foreground">PDF, MD, or DOCX — max 10MB</p>
          {error && <span className="text-xs font-medium text-destructive">{error}</span>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 border rounded-md bg-muted/50 min-w-0 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            {!isUploading && (
              <Button type="button" variant="ghost" size="icon" className="size-7" onClick={handleRemove}>
                <X className="size-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>

          {error && (
            <div className="p-2.5 text-xs font-medium text-destructive bg-destructive/10 rounded-md flex items-center justify-between">
              <span>{error}</span>
              <Button type="button" variant="outline" size="xs" onClick={() => uploadFile(file)} className="h-6">
                <RefreshCw className="size-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="p-2 text-xs font-medium text-green-700 bg-green-500/10 rounded-md flex items-center dark:text-green-400">
              <CheckCircle2 className="size-3.5 mr-1.5 shrink-0" />
              Uploaded — will be attached on save.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
