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
  targetId: string | null;
  details: any;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    email: string;
  } | null;
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

  const formatAuditDetails = (action: string, details: any) => {
    if (!details) return <span className="text-xs text-muted-foreground/60 italic">—</span>;
    
    try {
      switch (action) {
        case "USER_INVITE":
          return <span>Invited <span className="font-medium text-foreground">{details.email}</span> as {details.role}</span>;
        case "USER_DELETE":
          return <span>Deleted user <span className="font-medium text-foreground">{details.username || details.email}</span></span>;
        case "INVITATION_REVOKE":
          return <span>Revoked invite for <span className="font-medium text-foreground">{details.email}</span></span>;
        case "INVITATION_RESEND":
          return <span>Resent invite to <span className="font-medium text-foreground">{details.email}</span></span>;
        case "PROJECT_CREATE":
          return <span>Created project <span className="font-medium text-foreground">{details.name}</span></span>;
        case "PROJECT_UPDATE":
          return <span>Updated project status to <span className="font-medium text-foreground">{details.status}</span></span>;
        case "PROJECT_DELETE":
          return <span>Archived project</span>;
        case "PROJECT_DOC_UPLOAD":
          return <span>Uploaded <span className="font-medium text-foreground">{details.fileName}</span></span>;
        case "PROJECT_MEMBER_SYNC":
          return <span>Added {details.added}, removed {details.removed} members</span>;
        case "PROJECT_MEMBER_REMOVE":
          return <span>Removed member <span className="font-medium text-foreground text-xs">{String(details.removedUserId).substring(0, 8)}...</span></span>;
        case "PROJECT_MEMBER_UPDATE":
          return <span>Updated member role</span>;
        case "REQUEST_CREATE":
          return <span>Requested <span className="font-medium text-foreground">{details.resourceType}</span></span>;
        case "REQUEST_PROVISION":
          return <span>Provisioned {details.vaultReference ? "with vault reference" : "without vault reference"}</span>;
        case "AUTH_LOGIN_SUCCESS":
          return <span>Logged in successfully</span>;
        case "AUTH_LOGIN_FAILED":
          return <span>Failed login attempt for <span className="font-medium text-foreground">{details?.email || "unknown"}</span></span>;
        case "AUTH_LOGOUT":
          return <span>Logged out</span>;
        default:
          if (action.startsWith("REQUEST_STATUS_")) {
             return <span>Status changed from <span className="font-medium text-foreground">{details.previousStatus}</span></span>;
          }
          return (
            <span className="font-mono text-muted-foreground truncate block max-w-xs" title={JSON.stringify(details)}>
              {JSON.stringify(details)}
            </span>
          );
      }
    } catch (e) {
      return <span className="font-mono text-muted-foreground truncate block max-w-xs">{JSON.stringify(details)}</span>;
    }
  };

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
                  <span className="font-medium">{log.actor?.username || "System"}</span>
                  <span className="text-muted-foreground">{log.actor?.email || "Automated Process"}</span>
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
              <TableCell className="text-sm">
                {formatAuditDetails(log.action, log.details)}
              </TableCell>
              <TableCell>
                {log.targetId ? (
                  <span className="font-mono text-xs text-muted-foreground block" title={log.targetId}>
                    {log.targetId.length > 13 ? `${log.targetId.substring(0, 8)}...` : log.targetId}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">—</span>
                )}
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
