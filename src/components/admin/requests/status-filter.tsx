"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";

  const handleStatusChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    
    // Reset to page 1 when filter changes
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Requests</SelectItem>
        <SelectItem value="PENDING">Pending</SelectItem>

        <SelectItem value="PROVISIONED">Provisioned</SelectItem>
        <SelectItem value="REJECTED">Rejected</SelectItem>
        <SelectItem value="REVOKED">Revoked</SelectItem>
      </SelectContent>
    </Select>
  );
}
