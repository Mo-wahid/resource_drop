import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@prisma/client";

const statusColors: Record<RequestStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",

  PROVISIONED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  REVOKED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RequestTimeline({ 
  history,
  createdAt,
  requester
}: { 
  history: any[];
  createdAt: Date;
  requester: { username: string };
}) {
  const safeHistory = history || [];
  const hasPending = safeHistory.some(h => h.newStatus === "PENDING");
  
  const fullHistory = hasPending 
    ? safeHistory 
    : [
        {
          id: "synthetic-pending",
          newStatus: "PENDING",
          changer: requester || { username: "Unknown" },
          changedAt: createdAt || new Date(),
          notes: "Request submitted."
        },
        ...safeHistory
      ].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());

  if (!fullHistory || fullHistory.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l ml-3 pl-4 space-y-6">
          {fullHistory.map((event, index) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-1 ring-border" />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{event.changer.username}</span>
                  <span className="text-sm text-muted-foreground">changed status to</span>
                  <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs ${statusColors[event.newStatus as RequestStatus]}`}>
                    {event.newStatus.replace('_', ' ')}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(event.changedAt)}
                </span>
                {event.notes && (
                  <div className="mt-2 text-sm text-foreground bg-muted/30 border p-3 rounded-md">
                    {event.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
