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
import { DeleteUserButton } from "./delete-user-button";
import { SortableTableHead, TablePagination } from "@/components/admin/table-utils";
import { useSearchParams } from "next/navigation";

interface User {
  id: string;
  email: string;
  username: string;
  role: { name: string };
  createdAt: Date;
  _count: { projectMemberships: number };
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TEAM_MEMBER: "text-foreground border-border bg-transparent",
};

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function UsersTable({ users, currentUserId, currentPage, totalPages, totalCount }: UsersTableProps) {
  const searchParams = useSearchParams();
  const isSorting = searchParams.has("sortBy");

  if (totalCount === 0) {
    return <div className="text-sm text-muted-foreground py-4">No active users found.</div>;
  }

  // We only pin the current user to the top if we are not actively sorting
  const sortedUsers = isSorting 
    ? users 
    : [...users].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return 0;
      });

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <SortableTableHead columnKey="role" title="Role" />
            <TableHead className="text-center">Projects</TableHead>
            <SortableTableHead columnKey="joinedAt" title="Joined" />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
          {sortedUsers.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-md w-24 justify-center ${roleColors[user.role.name] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                    {user.role.name.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {user._count.projectMemberships}
                </TableCell>
                <TableCell suppressHydrationWarning>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {isSelf ? (
                    <span className="text-xs font-medium text-muted-foreground pr-2">You</span>
                  ) : (
                    <DeleteUserButton userId={user.id} userName={user.username} currentUserId={currentUserId} />
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
