"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ProvisionedResourceDetails({ resource, request }: { resource: any; request: any }) {
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleVisibility = (key: string) => {
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (request.status === "REJECTED" || request.status === "REVOKED") {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
            <p className="text-sm font-medium">Request Closed</p>
            <p className="text-xs mt-1">This request was rejected or revoked.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resource) {
    if (request.status === "PENDING") {
      return (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
              <p className="text-sm font-medium">Awaiting Review</p>
              <p className="text-xs mt-1">Your request is currently awaiting admin review.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    
    return null;
  }

  const details = resource.connectionDetails || {};

  return (
    <Card className="shadow-sm border-green-500/20 bg-green-500/5 pt-0">
      <CardHeader className="pt-4 pb-3 border-b border-green-500/10 mb-4 bg-green-500/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-green-800">Resource Provisioned</CardTitle>
            <CardDescription className="text-green-700/80 mt-1">
              Provisioned on {formatDate(resource.createdAt)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Render dynamic details based on keys */}
        {Object.keys(details).length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-green-900">Connection Details & Credentials</p>
            
            <div className="grid gap-3">
              {Object.entries(details).map(([key, value]) => {
                const textValue = String(value);
                const isVisible = visibleFields[key];
                
                return (
                  <div key={key} className="flex flex-col space-y-1.5 p-3 rounded-md bg-background border border-green-500/20">
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-mono break-all">
                        {isVisible ? textValue : '•'.repeat(Math.min(textValue.length, 32))}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleVisibility(key)}
                          title={isVisible ? "Hide value" : "Show value"}
                        >
                          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          <span className="sr-only">Toggle visibility</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(textValue)}
                          title="Copy to clipboard"
                        >
                          <Copy className="size-4" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic py-2">
            No specific connection details were provided.
          </div>
        )}

      </CardContent>
    </Card>
  );
}
