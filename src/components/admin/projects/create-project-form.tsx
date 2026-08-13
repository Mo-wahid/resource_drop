"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validation/project";
import { createProject } from "@/app/(protected)/admin/projects/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MemberSelectField } from "./member-select-field";
import { RequirementsUploadField } from "./requirements-upload-field";

type EligibleMember = {
  id: string;
  username: string;
  email: string;
};

export function CreateProjectForm({ 
  onSuccess,
  eligibleMembers
}: { 
  onSuccess?: () => void,
  eligibleMembers: EligibleMember[]
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Pre-generate a UUID so the upload component knows where to put the file in MinIO
  const [projectId] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      id: projectId,
      name: "",
      description: "",
      memberIds: [],
      requirementsDocument: undefined,
    },
  });

  const memberIds = watch("memberIds") || [];

  const onSubmit = (data: CreateProjectInput) => {
    setError(null);
    startTransition(async () => {
      const res = await createProject(data);
      if (res.error) {
        if (res.fieldErrors) {
          if (res.fieldErrors.name) setFormError("name", { message: res.fieldErrors.name[0] });
          if (res.fieldErrors.description) setFormError("description", { message: res.fieldErrors.description[0] });
        } else {
          setError(res.error);
        }
      } else if (res.success && res.projectId) {
        toast.success(`Project "${data.name}" created`);
        if (onSuccess) onSuccess();
        router.push(`/admin/projects/${res.projectId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 min-w-0 w-full">
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" required>Project Name</Label>
        <Input id="name" placeholder="E.g. Apollo Mission" {...register("name")} />
        {errors.name && (
          <p className="text-tiny font-medium text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" required>Description</Label>
        <Textarea 
          id="description" 
          placeholder="Briefly describe the purpose of this project..." 
          className="resize-none h-20"
          {...register("description")} 
        />
        {errors.description && (
          <p className="text-tiny font-medium text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Requirements Document</Label>
        <RequirementsUploadField 
          projectId={projectId} 
          onUploadComplete={(data) => setValue("requirementsDocument", data)}
          onRemove={() => setValue("requirementsDocument", undefined)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Team Members</Label>
        <MemberSelectField 
          eligibleMembers={eligibleMembers}
          selectedIds={memberIds}
          onChange={(ids) => setValue("memberIds", ids)}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Project
        </Button>
      </div>
    </form>
  );
}
