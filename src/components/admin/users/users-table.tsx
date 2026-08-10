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

interface User {
  id: string;
  email: string;
  username: string;
  role: { name: string };
  createdAt: Date;
}

import { DeleteUserButton } from "./delete-user-button";

export function UsersTable({ users, currentUserId }: { users: User[], currentUserId: string }) {
  if (users.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No active users found.</div>;
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role.name === "ADMIN" ? "default" : "secondary"}>
                  {user.role.name}
                </Badge>
              </TableCell>
              <TableCell suppressHydrationWarning>{user.createdAt.toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DeleteUserButton userId={user.id} userName={user.username} currentUserId={currentUserId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
