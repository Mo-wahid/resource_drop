"use client";

import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RequestStatus } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { statusColors } from "@/lib/status-colors";

type ProjectRequest = {
  id: string;
  status: RequestStatus;
  createdAt: Date;
  user?: { username: string; email: string };
  resourceType: { name: string };
};

export function ProjectRequestsTable({
  requests,
  isAdmin = false,
  isProjectActive = true,
}: {
  requests: ProjectRequest[];
  isAdmin?: boolean;
  isProjectActive?: boolean;
}) {
  const router = useRouter();

  const basePath = isAdmin ? "/admin/requests" : "/requests";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          {isAdmin ? "All Requests" : "My Requests"}
        </CardTitle>
        <CardDescription className="mt-1">
          {isAdmin
            ? "All resource requests for this project"
            : "Your resource requests for this project"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/20">
            <ClipboardList className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No requests found for this project.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Requester</TableHead>}
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className={isProjectActive ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => isProjectActive && router.push(`${basePath}/${request.id}`)}
                  >
                    {isAdmin && request.user && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{request.user.username}</span>
                          <span className="text-xs text-muted-foreground">{request.user.email}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
