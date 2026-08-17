"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileUp, X, FileText, Loader2, RefreshCw } from "lucide-react";
import { confirmRequirementsUpload, removeRequirementsDocument } from "@/app/(protected)/admin/projects/actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function RequirementsUpload({
  projectId,
  existingFilename,
}: {
  projectId: string;
  existingFilename?: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
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

      // 2. Upload directly to MinIO
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

      // 3. Confirm with application server
      const confirmRes = await confirmRequirementsUpload(projectId, key, fileToUpload.name);

      if (confirmRes.error) {
        throw new Error(confirmRes.error);
      }

      setIsSuccess(true);
      toast.success("Requirements document uploaded successfully");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (selected?: File) => {
    setError(null);
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

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await removeRequirementsDocument(projectId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setFile(null);
      setIsSuccess(false);
      setProgress(0);
      setError(null);
      toast.success("Document removed");
    } catch (err) {
      toast.error("Failed to remove document");
    } finally {
      setIsRemoving(false);
    }
  };

  if (existingFilename && !file && !isSuccess) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-primary/10 rounded-md shrink-0">
            <FileText className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate" title={existingFilename}>{existingFilename}</p>
            <p className="text-xs text-muted-foreground truncate">Uploaded requirements document</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger 
            render={<Button variant="destructive" size="sm" className="shrink-0" disabled={isRemoving} />}
          >
            {isRemoving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <X className="size-4 mr-1.5" />}
            Remove
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove requirements document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The document will be permanently removed from this project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} variant="destructive">
                Remove Document
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-colors duration-200 min-w-0 w-full",
        isDragging ? "border-primary bg-primary/5 border-dashed" : ""
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          Requirements
        </CardTitle>
        <CardDescription>
          Accepted formats: PDF, MD, DOCX. Max size: 10MB. Or drag and drop here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

      {!file && !isSuccess ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer gap-3 group"
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.md,.docx,application/pdf,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <div className="p-3 bg-primary/10 rounded-full group-hover:scale-105 transition-transform duration-200">
            <FileUp className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <span className="text-primary font-medium hover:underline">Click to upload</span>
            <span className="text-muted-foreground text-sm"> or drag and drop</span>
          </div>
          {error && <span className="text-xs font-medium text-destructive">{error}</span>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 min-w-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="text-sm font-medium truncate">{file?.name || existingFilename}</span>
              {file && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
            {!isUploading && (
              <AlertDialog>
                <AlertDialogTrigger 
                  render={<Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" disabled={isRemoving} />}
                >
                  {isRemoving ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <X className="size-4 text-muted-foreground" />}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove requirements document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The document will be permanently removed from this project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} variant="destructive">
                      Remove Document
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 rounded-md flex items-center justify-between">
              <span>{error}</span>
              <Button type="button" variant="outline" size="xs" onClick={() => file && uploadFile(file)} className="h-6">
                <RefreshCw className="size-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-1.5">
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
        </div>
      )}
      </CardContent>
    </Card>
  );
}
