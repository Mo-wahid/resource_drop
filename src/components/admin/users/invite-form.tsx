"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteFormSchema, type InviteFormInput } from "@/lib/validation/invite";
import { createInvitation } from "@/app/(protected)/admin/users/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function InviteForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<InviteFormInput>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "TEAM_MEMBER",
    },
  });

  const onSubmit = (data: InviteFormInput) => {
    setError(null);
    startTransition(async () => {
      const res = await createInvitation(data);
      if (res.error) {
        if (res.fieldErrors) {
          if (res.fieldErrors.email) setFormError("email", { message: res.fieldErrors.email[0] });
          if (res.fieldErrors.role) setFormError("role", { message: res.fieldErrors.role[0] });
        } else {
          setError(res.error);
        }
      } else {
        toast.success(`Invitation sent to ${data.email}`);
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" required>Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
          {errors.email && (
            <p className="text-tiny font-medium text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role" required>Role</Label>
          <Select onValueChange={(v) => { if (v) setValue("role", v as "ADMIN" | "TEAM_MEMBER") }} value={watch("role")}>
            <SelectTrigger>
              {watch("role") ? (
                <span className="flex flex-1 text-left">
                  {watch("role") === "ADMIN" ? "Admin" : watch("role") === "TEAM_MEMBER" ? "Team Member" : watch("role")}
                </span>
              ) : (
                <SelectValue placeholder="Select a role" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-tiny font-medium text-destructive">{errors.role.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="solid" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Send Invitation
        </Button>
      </div>
    </form>
  );
}
