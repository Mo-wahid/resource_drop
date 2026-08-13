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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

const roleColors: Record<string, string> = {
  ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TEAM_MEMBER: "text-foreground border-border bg-transparent",
  PROJECT_VIEWER: "text-foreground border-border bg-transparent",
};

interface MemberTeamTableProps {
  members: any[]; // Using any for simplicity as it includes relations
}

export function MemberTeamTable({ members }: MemberTeamTableProps) {
  if (!members || members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            Project Team
          </CardTitle>
          <CardDescription>People with access to this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-4 text-center">
            No team members assigned.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          Project Team
        </CardTitle>
        <CardDescription>People with access to this project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[180px]">Role</TableHead>
                <TableHead className="w-[150px]">Assigned</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No members assigned to this project.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.user.id}>
                    <TableCell className="font-medium">{member.user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-md w-32 justify-center ${roleColors[member.role.name] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {member.role.name.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell suppressHydrationWarning>
                      {member.assignedAt ? formatDate(member.assignedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="size-8"></div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
