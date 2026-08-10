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
import { InvitationActions } from "./invitation-actions";
import { cn } from "@/lib/utils";

interface Invitation {
  id: string;
  email: string;
  name: string;
  roleName: string;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
}

export function InvitationsTable({ invitations }: { invitations: Invitation[] }) {
  if (invitations.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No pending invitations.</div>;
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
          {invitations.map((inv) => (
            <TableRow key={inv.id} className={cn(inv.isExpired && "text-muted-foreground")}>
              <TableCell className="font-medium">{inv.name}</TableCell>
              <TableCell>{inv.email}</TableCell>
              <TableCell>
                <Badge variant={inv.isExpired ? "outline" : "secondary"}>
                  {inv.roleName}
                </Badge>
              </TableCell>
              <TableCell suppressHydrationWarning>{inv.createdAt.toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span suppressHydrationWarning>{inv.expiresAt.toLocaleDateString()}</span>
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
