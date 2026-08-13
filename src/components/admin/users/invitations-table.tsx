"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { InvitationActions } from "./invitation-actions";
import { cn } from "@/lib/utils";

interface Invitation {
  id: string;
  email: string;
  name: string;
  roleName: string;
  inviterName: string;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TEAM_MEMBER: "text-foreground border-border bg-transparent",
  PROJECT_VIEWER: "text-foreground border-border bg-transparent",
};

export function InvitationsTable({ invitations }: { invitations: Invitation[] }) {
  if (invitations.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No pending invitations.</div>;
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
          {invitations.map((inv) => (
            <TableRow key={inv.id} className={cn(inv.isExpired && "text-muted-foreground")}>
              <TableCell className="font-medium">{inv.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-md w-32 justify-center ${inv.isExpired ? "bg-muted text-muted-foreground border-border" : (roleColors[inv.roleName] || "bg-gray-500/10 text-gray-500 border-gray-500/20")}`}>
                  {inv.roleName.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{inv.inviterName}</TableCell>
              <TableCell suppressHydrationWarning>{formatDate(inv.createdAt)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span suppressHydrationWarning>{formatDate(inv.expiresAt)}</span>
                  {inv.isExpired && <Badge variant="outline" className="text-xs">Expired</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <InvitationActions invitationId={inv.id} isExpired={inv.isExpired} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
