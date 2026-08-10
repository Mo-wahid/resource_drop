import { getActiveUsers, getPendingInvitations } from "./queries";
import { UsersTable } from "./_components/users-table";
import { InvitationsTable } from "./_components/invitations-table";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireRoleAction } from "@/lib/auth/guard";

export default async function AdminUsersPage() {
  await requireRoleAction("ADMIN"); // Just to be absolutely safe

  const [activeUsers, pendingInvitations] = await Promise.all([
    getActiveUsers(),
    getPendingInvitations(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
          <p className="text-muted-foreground mt-1">Manage team members and invitations.</p>
        </div>
        <Link href="/admin/users/invite" className={buttonVariants()}>
          <UserPlus className="size-4 mr-2" />
          Invite User
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Pending Invitations</h2>
        <InvitationsTable invitations={pendingInvitations} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Active Users</h2>
        <UsersTable users={activeUsers} />
      </div>
    </div>
  );
}
