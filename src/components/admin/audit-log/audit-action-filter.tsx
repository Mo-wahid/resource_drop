"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AuditActionFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentAction = searchParams.get("action") || "ALL";

  const handleActionChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "ALL") {
      params.delete("action");
    } else {
      params.set("action", value);
    }
    
    // Reset to page 1 when filter changes
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentAction} onValueChange={handleActionChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by action" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Actions</SelectItem>
        <SelectItem value="USER_">User Administration</SelectItem>
        <SelectItem value="PROJECT_">Project Lifecycle</SelectItem>
        <SelectItem value="REQUEST_">Resource Requests</SelectItem>
        <SelectItem value="INVITATION_">Invitations</SelectItem>
      </SelectContent>
    </Select>
  );
}