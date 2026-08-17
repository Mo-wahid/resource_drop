"use client";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead,
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { SortableTableHead, TablePagination } from "@/components/admin/table-utils";

type AuditEntry = {
  id: string;
  action: string;
  targetId: string;
  details: any;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    email: string;
  };
};

export function AuditLogTable({
  logs,
  currentPage,
  totalPages,
  totalCount,
}: {
  logs: AuditEntry[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}) {
  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD") || action.includes("PROVISION")) {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("REJECT") || action.includes("REVOKE")) {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    if (action.includes("UPDATE") || action.includes("SYNC") || action.includes("ACCEPT")) {
      return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
        <ShieldCheck className="size-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-lg font-medium">No audit entries found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          System events and operations will be logged here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead columnKey="actor" title="Actor" />
            <SortableTableHead columnKey="action" title="Action" />
            <TableHead>Details</TableHead>
            <TableHead>Target ID</TableHead>
            <SortableTableHead columnKey="createdAt" title="Timestamp" className="text-right justify-end" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{log.actor.username}</span>
                  <span className="text-muted-foreground">{log.actor.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`rounded-xs text-[11px] px-2 py-0.5 uppercase font-semibold ${getActionBadgeColor(
                    log.action
                  )}`}
                >
                  {log.action.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                {log.details ? (
                  <span className="text-muted-foreground font-mono truncate block" title={JSON.stringify(log.details)}>
                    {JSON.stringify(log.details)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-mono text-muted-foreground truncate block max-w-[120px]" title={log.targetId}>
                  {log.targetId}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground" suppressHydrationWarning>
                {formatDate(log.createdAt)}
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
