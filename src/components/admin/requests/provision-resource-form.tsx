"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { provisionRequestAction } from "@/app/(protected)/admin/requests/actions";
import { Loader2 } from "lucide-react";
import { RequirementsUploadField } from "@/components/admin/projects/requirements-upload-field";

export function ProvisionResourceForm({ request }: { request: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resourceType = request.resourceType.name;
  const isCustom = request.resourceType.isCustom;

  // Dynamic state based on resource type
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [attachment, setAttachment] = useState<{ url: string; filename: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await provisionRequestAction(request.id, {
      connectionDetails: formData,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.filename,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Resource provisioned successfully!");
    }
    
    setIsSubmitting(false);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (request.status !== "PENDING") {
    return null;
  }

  // Validation logic
  let isValid = false;
  if (isCustom) {
    isValid = !!(formData.genericText?.trim() || attachment);
  } else if (resourceType === "github_repo") {
    isValid = !!formData.repositoryUrl?.trim();
  } else if (resourceType === "database") {
    isValid = !!formData.connectionString?.trim();
  } else if (resourceType === "object_storage") {
    isValid = !!(formData.bucketName?.trim() && formData.accessKeyId?.trim() && formData.secretAccessKey?.trim());
  } else if (resourceType === "api_key") {
    if (request.parameters?.keys && Array.isArray(request.parameters.keys) && request.parameters.keys.length > 0) {
      isValid = request.parameters.keys.every((k: string) => !!formData[k]?.trim());
    } else {
      isValid = !!formData.apiKey?.trim();
    }
  }

  return (
    <Card className="shadow-sm border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Provision Resource</CardTitle>
        <CardDescription>
          Enter the final connection details or credentials to provision this resource for the member.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isCustom && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="genericText">Details / Instructions</Label>
                <Textarea 
                  id="genericText" 
                  placeholder="Enter credentials, links, or instructions..." 
                  onChange={e => handleInputChange("genericText", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <RequirementsUploadField 
                  projectId={request.projectId} 
                  onUploadComplete={(data) => setAttachment(data)}
                  onRemove={() => setAttachment(null)}
                />
              </div>
            </div>
          )}

          {!isCustom && resourceType === "github_repo" && (
            <div className="space-y-2">
              <Label htmlFor="repoUrl">Repository URL</Label>
              <Input 
                id="repoUrl" 
                placeholder="https://github.com/org/repo" 
                required 
                onChange={e => handleInputChange("repositoryUrl", e.target.value)}
              />
            </div>
          )}

          {!isCustom && resourceType === "database" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="connectionString">Connection String</Label>
                <Input 
                  id="connectionString" 
                  placeholder="postgresql://user:pass@host:5432/db" 
                  required 
                  onChange={e => handleInputChange("connectionString", e.target.value)}
                />
              </div>
            </>
          )}

          {!isCustom && resourceType === "object_storage" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bucketName">Bucket Name / URL</Label>
                <Input 
                  id="bucketName" 
                  placeholder="s3://my-bucket" 
                  required 
                  onChange={e => handleInputChange("bucketName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessKey">Access Key ID</Label>
                <Input 
                  id="accessKey" 
                  placeholder="AKIA..." 
                  required 
                  onChange={e => handleInputChange("accessKeyId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Access Key</Label>
                <Input 
                  id="secretKey" 
                  type="password"
                  placeholder="Secret key..." 
                  required 
                  onChange={e => handleInputChange("secretAccessKey", e.target.value)}
                />
              </div>
            </>
          )}

          {!isCustom && resourceType === "api_key" && (
            <>
              <div className="space-y-2">
                <Label>API Keys</Label>
                {request.parameters?.keys && Array.isArray(request.parameters.keys) && request.parameters.keys.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Please provide a key for each requested tag.
                  </p>
                )}
                
                {request.parameters?.keys && Array.isArray(request.parameters.keys) && request.parameters.keys.length > 0 ? (
                  request.parameters.keys.map((keyTag: string) => (
                    <div key={keyTag} className="flex flex-col gap-1.5 mb-3">
                      <Label htmlFor={`key-${keyTag}`} className="text-xs font-medium text-foreground">{keyTag} Key</Label>
                      <Input 
                        id={`key-${keyTag}`}
                        placeholder={`Enter key for ${keyTag}...`}
                        required
                        onChange={e => handleInputChange(keyTag, e.target.value)}
                      />
                    </div>
                  ))
                ) : (
                  <Input 
                    placeholder="Enter API key..."
                    required
                    onChange={e => handleInputChange("apiKey", e.target.value)}
                  />
                )}
              </div>
            </>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Provisioning
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
