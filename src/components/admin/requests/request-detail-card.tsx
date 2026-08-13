"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function RequestDetailCard({ request }: { request: any }) {
  // Parsing parameters for display
  const params = request.parameters as Record<string, any> || {};

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Request Details</CardTitle>
            <CardDescription className="mt-1">
              Submitted on {formatDate(request.createdAt)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Requester</span>
            <div className="text-sm font-medium">{request.user.username}</div>
            <div className="text-xs text-muted-foreground">{request.user.email}</div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Project</span>
            <div className="text-sm font-medium">{request.project.name}</div>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium text-muted-foreground">Resource Configuration</span>
          <div className="rounded-md border p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Type</span>
              <span className="text-sm text-muted-foreground">{request.resourceType.name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
            </div>
            
            {Object.keys(params).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(params).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium capitalize">{key}</span>
                    <span className="text-sm text-muted-foreground text-right break-all">
                      {Array.isArray(val) ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {val.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                          ))}
                        </div>
                      ) : (
                        String(val)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center italic py-2">No additional configuration required</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
