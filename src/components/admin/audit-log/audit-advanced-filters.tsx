"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterIcon } from "lucide-react";

export function AuditAdvancedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [actorId, setActorId] = useState(searchParams.get("actorId") || "");
  const [targetId, setTargetId] = useState(searchParams.get("targetId") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const [open, setOpen] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (actorId) params.set("actorId", actorId);
    else params.delete("actorId");

    if (targetId) params.set("targetId", targetId);
    else params.delete("targetId");

    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");
    
    params.delete("page"); // Reset to page 1

    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("actorId");
    params.delete("targetId");
    params.delete("startDate");
    params.delete("endDate");
    params.delete("page");

    setActorId("");
    setTargetId("");
    setStartDate("");
    setEndDate("");

    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const hasActiveFilters = !!searchParams.get("actorId") || !!searchParams.get("targetId") || !!searchParams.get("startDate") || !!searchParams.get("endDate");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant={hasActiveFilters ? "default" : "outline"} className="gap-2" />}>
        <FilterIcon className="size-4" />
        More Filters
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Advanced Filters</h4>
          
          <div className="space-y-2">
            <Label htmlFor="actorId">Actor ID</Label>
            <Input 
              id="actorId" 
              placeholder="e.g. 550e8400-e29b..." 
              value={actorId} 
              onChange={e => setActorId(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetId">Entity / Target ID</Label>
            <Input 
              id="targetId" 
              placeholder="e.g. 550e8400-e29b..." 
              value={targetId} 
              onChange={e => setTargetId(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date"
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date"
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
            <Button size="sm" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
