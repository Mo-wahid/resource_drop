import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function ProvisionedResourceDetails({ resource, request }: { resource: any; request: any }) {
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
    if (request.status === "PENDING" || request.status === "ACCEPTED") {
      return (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
              <p className="text-sm font-medium">Provisioning in Progress</p>
              <p className="text-xs mt-1">Your resource will be set up by an administrator soon.</p>
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
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex flex-col space-y-1.5 p-3 rounded-md bg-background border border-green-500/20">
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm font-mono break-all">{String(value)}</span>
                  </div>
                </div>
              ))}
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
