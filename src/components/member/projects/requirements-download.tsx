"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RequirementsDownloadProps {
  projectId: string;
  filename: string | null;
}

export function RequirementsDownload({ projectId, filename }: RequirementsDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/download-url`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get download URL");
      }

      // Open the presigned URL in a new tab
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          Requirements
        </CardTitle>
        <CardDescription>
          Project specifications and architecture
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filename ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <FileText className="size-8 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate" title={filename}>
                  {filename}
                </span>
                <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal rounded-sm">PDF</Badge>
                  Secure File
                </span>
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <Button onClick={handleDownload} disabled={isDownloading} className="w-full">
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Download className="mr-2 size-4" />
                  Download File
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-2 flex flex-col items-center justify-center text-center gap-2 border border-dashed rounded-lg p-6 bg-muted/20">
            <FileText className="size-8 text-muted-foreground/50" />
            <p>No requirements document uploaded for this project.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
