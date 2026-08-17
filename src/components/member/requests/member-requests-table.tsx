"use client";

import { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RequestStatus } from "@prisma/client";
import { Server, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteRequestButton } from "./delete-request-button";
import { SortableTableHead, TablePagination } from "@/components/admin/table-utils";

type RequestType = {
  id: string;
  status: RequestStatus;
  createdAt: Date;
  project: { name: string };
  resourceType: { name: string };
};

import { statusColors } from "@/lib/status-colors";

export function MemberRequestsTable({
  requests,
  currentPage,
  totalPages,
  totalCount,
}: {
  requests: RequestType[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}) {
  const router = useRouter();

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
        <Server className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No resource requests</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          You haven't made any resource requests yet. Click the "New Request" button above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead columnKey="project" title="Project" />
            <SortableTableHead columnKey="type" title="Resource Type" />
            <SortableTableHead columnKey="status" title="Status" />
            <SortableTableHead columnKey="createdAt" title="Date" className="text-right justify-end" />
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const canDelete = request.status === "PENDING" || request.status === "REJECTED";
            
            return (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/requests/${request.id}`)}
              >
                <TableCell className="font-medium">{request.project.name}</TableCell>
                <TableCell>
                  {request.resourceType.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-md w-28 justify-center ${statusColors[request.status]}`}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground" suppressHydrationWarning>{formatDate(request.createdAt)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canDelete && (
                    <DeleteRequestButton requestId={request.id} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
