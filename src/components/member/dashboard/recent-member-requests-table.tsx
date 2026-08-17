"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { statusColors } from "@/lib/status-colors";
import { RequestStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

interface MemberRequestItem {
  id: string;
  status: RequestStatus;
  createdAt: Date;
  project: { name: string };
  resourceType: { name: string };
}

export function RecentMemberRequestsTable({ requests }: { requests: MemberRequestItem[] }) {
  const router = useRouter();

  return (
    <Card className="py-0">
      <div>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div>
            <CardTitle className="text-base font-semibold">My Recent Requests</CardTitle>
            <CardDescription className="text-xs">Your latest resource provisioning inquiries</CardDescription>
          </div>
          <Link href="/my-requests">
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground">
              View All
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Inbox className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No requests made yet</p>
              <p className="text-xs text-muted-foreground">Requests you submit for your projects will appear here.</p>
            </div>
          ) : (
            <div className="border-t border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Resource Type</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/requests/${request.id}`)}
                    >
                      <TableCell className="font-medium max-w-[180px] truncate">
                        {request.project.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.resourceType.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-md text-[10px] px-2 py-0.5 font-medium ${statusColors[request.status]}`}
                        >
                          {request.status.replace(/_/g, " ")}
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
      </div>
    </Card>
  );
}
