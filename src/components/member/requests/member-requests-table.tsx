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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteResourceRequest } from "@/app/(protected)/my-requests/actions";
import { toast } from "sonner";

import { SortableTableHead, TablePagination } from "@/components/admin/table-utils";

type RequestType = {
  id: string;
  status: RequestStatus;
  createdAt: Date;
  project: { name: string };
  resourceType: { name: string };
};

const statusColors: Record<RequestStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ACCEPTED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PROVISIONED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  REVOKED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeletingId(id);
    const result = await deleteResourceRequest(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Request deleted successfully");
      router.refresh();
    }
    setDeletingId(null);
  };

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
                    <AlertDialog>
                      <AlertDialogTrigger 
                        render={
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10">
                            {deletingId === request.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        } 
                      />
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this resource request. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button 
                            variant="destructive" 
                            onClick={(e) => handleDelete(e, request.id)}
                            disabled={deletingId === request.id}
                          >
                            {deletingId === request.id ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Request"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
