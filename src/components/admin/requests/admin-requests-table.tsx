"use client";

import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RequestStatus } from "@prisma/client";
import { Server } from "lucide-react";
import { SortableTableHead, TablePagination } from "@/components/admin/table-utils";

type RequestType = {
  id: string;
  status: RequestStatus;
  createdAt: Date;
  project: { name: string };
  user: { username: string; email: string };
  resourceType: { name: string };
};

import { statusColors } from "@/lib/status-colors";

export function AdminRequestsTable({
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
        <h3 className="text-lg font-medium">No requests found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          There are currently no resource requests matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead columnKey="user" title="Requester" />
            <SortableTableHead columnKey="project" title="Project" />
            <SortableTableHead columnKey="type" title="Resource Type" />
            <SortableTableHead columnKey="status" title="Status" />
            <SortableTableHead columnKey="createdAt" title="Date" className="text-right justify-end" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow 
              key={request.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/admin/requests/${request.id}`)}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{request.user.username}</span>
                  <span className="text-xs text-muted-foreground">{request.user.email}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{request.project.name}</TableCell>
              <TableCell>
                {request.resourceType.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-md w-28 justify-center ${statusColors[request.status]}`}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground" suppressHydrationWarning>
                {formatDate(request.createdAt)}
              </TableCell>
            </TableRow>
          ))}
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
