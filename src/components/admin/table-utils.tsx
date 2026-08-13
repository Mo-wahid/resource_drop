"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnKey: string;
  title: string;
}

export function SortableTableHead({ columnKey, title, className, ...props }: SortableTableHeadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy");
  const currentSortOrder = searchParams.get("sortOrder") || "asc";
  
  const isActive = currentSortBy === columnKey;

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (isActive) {
      if (currentSortOrder === "asc") {
        params.set("sortOrder", "desc");
      } else {
        // If already descending, clicking again clears the sort
        params.delete("sortBy");
        params.delete("sortOrder");
      }
    } else {
      params.set("sortBy", columnKey);
      params.set("sortOrder", "asc");
    }
    
    // Reset to page 1 when sorting changes
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors select-none group", className)} 
      onClick={toggleSort}
      {...props}
    >
      <div className={cn("flex items-center gap-1.5 w-fit", className?.includes("text-right") ? "ml-auto" : "", className?.includes("text-center") ? "mx-auto" : "")}>
        {title}
        <div className="flex items-center justify-center size-4 text-muted-foreground group-hover:text-foreground transition-colors">
          {!isActive && <ArrowUpDown className="size-3 opacity-50" />}
          {isActive && currentSortOrder === "asc" && <ArrowUp className="size-3" />}
          {isActive && currentSortOrder === "desc" && <ArrowDown className="size-3" />}
        </div>
      </div>
    </TableHead>
  );
}

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function TablePagination({ currentPage, totalPages, totalCount }: TablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalCount === 0) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="text-xs text-muted-foreground">
        Showing total of <span className="font-medium text-foreground">{totalCount}</span> items
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span> of <span className="font-medium text-foreground">{totalPages || 1}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={currentPage <= 1}
            onClick={() => router.push(createPageUrl(currentPage - 1))}
          >
            <ChevronLeft className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={currentPage >= totalPages}
            onClick={() => router.push(createPageUrl(currentPage + 1))}
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
