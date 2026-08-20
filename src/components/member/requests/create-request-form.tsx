"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestFormSchema, type RequestFormInput } from "@/lib/validation/request";
import { createResourceRequest } from "@/app/(protected)/my-requests/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Loader2, GitBranch, HardDrive, Key, Database, FolderGit2, Send, Puzzle, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { TagsInput } from "@/components/ui/tags-input";

type AssignedProject = {
  id: string;
  name: string;
};

type ResourceType = {
  id: string;
  name: string;
  isCustom: boolean;
};

const getIcon = (name: string, isCustom: boolean) => {
  if (isCustom) return Puzzle;
  if (name === "github_repo") return GitBranch;
  if (name === "object_storage") return HardDrive;
  if (name === "api_key") return Key;
  if (name === "database") return Database;
  return Puzzle;
};

export function CreateRequestForm({
  projects,
  resourceTypes,
  onSuccess,
  defaultProjectId,
}: {
  projects: AssignedProject[];
  resourceTypes: ResourceType[];
  onSuccess?: () => void;
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<RequestFormInput>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      projectId: defaultProjectId || "",
      resourceType: "github_repo",
    } as RequestFormInput, // cast to handle the discriminated union correctly
  });

  const resourceType = watch("resourceType");
  const projectId = watch("projectId");

  // Re-register dynamically rendered fields to make sure RHF tracks them properly when switching types
  const handleResourceTypeChange = (type: string | null) => {
    if (!type) return;
    setValue("resourceType", type as any);
    // Reset specific fields when switching to prevent lingering validation errors
    if (type === "object_storage") {
      setValue("purpose", "");
    } else if (type === "api_key") {
      setValue("keys", []);
    } else if (type === "database") {
      setValue("engine", "postgresql");
    } else if (type === "create_custom") {
      setValue("customName", "");
      setValue("customDescription", "");
    }
  };

  const onSubmit = (data: RequestFormInput) => {
    setError(null);
    startTransition(async () => {
      const res = await createResourceRequest(data);
      if (res.error) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setFormError(field as any, { message: messages[0] });
            }
          });
        } else {
          setError(res.error);
        }
      } else {
        toast.success("Request created successfully");
        if (onSuccess) onSuccess();
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="projectId" required>Project</Label>
        <Select 
          value={projectId} 
          onValueChange={(val) => setValue("projectId", val || "")}
        >
          <SelectTrigger>
            <span className="flex flex-1 items-center gap-2 text-left text-sm">
              <FolderGit2 className="size-4 text-muted-foreground" />
              {projects.find((p) => p.id === projectId)?.name || "Select a project"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {projects.length === 0 ? (
              <SelectItem value="none" disabled>No assigned projects</SelectItem>
            ) : (
              projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="size-4 text-muted-foreground" />
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.projectId && (
          <p className="text-tiny font-medium text-destructive">{errors.projectId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resourceType" required>Resource Type</Label>
        <Select 
          value={resourceType} 
          onValueChange={handleResourceTypeChange}
        >
          <SelectTrigger>
            <span className="flex flex-1 items-center gap-2 text-left text-sm">
              {(() => {
                if (resourceType === "create_custom") {
                  return (
                    <>
                      <PlusCircle className="size-4 text-muted-foreground" />
                      <span>Create custom request...</span>
                    </>
                  );
                }
                const rt = resourceTypes.find((r) => r.name === resourceType);
                if (rt) {
                  const Icon = getIcon(rt.name, rt.isCustom);
                  const displayName = rt.name === "github_repo" ? "GitHub Repo" : 
                                      rt.name === "object_storage" ? "Object Storage Bucket" : 
                                      rt.name === "api_key" ? "API Key" : 
                                      rt.name === "database" ? "Database" : rt.name;
                  return (
                    <>
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{displayName}</span>
                    </>
                  );
                }
                return <span>Select a resource type</span>;
              })()}
            </span>
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((r) => {
              const Icon = getIcon(r.name, r.isCustom);
              const displayName = r.name === "github_repo" ? "GitHub Repo" : 
                                  r.name === "object_storage" ? "Object Storage Bucket" : 
                                  r.name === "api_key" ? "API Key" : 
                                  r.name === "database" ? "Database" : r.name;
              return (
                <SelectItem key={r.name} value={r.name}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{displayName}</span>
                  </div>
                </SelectItem>
              );
            })}
            <SelectItem value="create_custom">
              <div className="flex items-center gap-2 text-primary">
                <PlusCircle className="size-4" />
                <span>Create custom request...</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {/* @ts-ignore */}
        {errors.resourceType && (
          // @ts-ignore
          <p className="text-tiny font-medium text-destructive">{errors.resourceType.message}</p>
        )}
      </div>

      {resourceType !== "github_repo" && (
        <div className="pt-2 border-t border-border mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {resourceType === "object_storage" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="purpose" required>Purpose</Label>
                <Input id="purpose" placeholder="Briefly describe what this will be used for..." {...register("purpose")} />
                {/* @ts-ignore */}
                {errors.purpose && (
                  // @ts-ignore
                  <p className="text-tiny font-medium text-destructive">{errors.purpose.message}</p>
                )}
              </div>
            </div>
          )}

          {resourceType === "api_key" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="keys" required>Keys</Label>
                <TagsInput 
                  // @ts-ignore
                  value={watch("keys") || []}
                  onChange={(newKeys) => setValue("keys", newKeys as any)}
                  placeholder="e.g. STRIPE_SECRET_KEY"
                />
                {/* @ts-ignore */}
                {errors.keys && (
                  // @ts-ignore
                  <p className="text-tiny font-medium text-destructive">{errors.keys.message}</p>
                )}
              </div>
            </div>
          )}

          {resourceType === "database" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="engine" required>Database Engine</Label>
                <Select 
                  // @ts-ignore
                  value={watch("engine")} 
                  onValueChange={(val) => setValue("engine", val as any)}
                >
                  <SelectTrigger>
                    <span className="flex flex-1 text-left text-sm capitalize">
                      {/* @ts-ignore */}
                      {watch("engine") || "postgresql"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
                {/* @ts-ignore */}
                {errors.engine && (
                  // @ts-ignore
                  <p className="text-tiny font-medium text-destructive">{errors.engine.message}</p>
                )}
              </div>
            </div>
          )}

          {resourceType === "create_custom" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="customName" required>Custom Resource Name</Label>
                <Input id="customName" placeholder="e.g. AWS EC2 Instance" {...register("customName")} />
                {/* @ts-ignore */}
                {errors.customName && (
                  // @ts-ignore
                  <p className="text-tiny font-medium text-destructive">{errors.customName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customDescription">Description (Optional)</Label>
                <Input id="customDescription" placeholder="Any specific requirements..." {...register("customDescription")} />
                {/* @ts-ignore */}
                {errors.customDescription && (
                  // @ts-ignore
                  <p className="text-tiny font-medium text-destructive">{errors.customDescription.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto transition-all">
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Send className="mr-2 size-4" />
          )}
          Submit Request
        </Button>
      </div>
    </form>
  );
}
