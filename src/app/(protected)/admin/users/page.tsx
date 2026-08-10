import { getActiveUsers, getPendingInvitations } from "./queries";
import { UsersTable } from "@/components/admin/users/users-table";
import { InvitationsTable } from "@/components/admin/users/invitations-table";
import { InviteUserModal } from "@/components/admin/users/invite-user-modal";
import { requireRoleAction } from "@/lib/auth/guard";

export default async function AdminUsersPage() {
  const authResult = await requireRoleAction("ADMIN"); // Just to be absolutely safe
  
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

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
        <InviteUserModal />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Pending Invitations</h2>
        <InvitationsTable invitations={pendingInvitations} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Active Users</h2>
        <UsersTable users={activeUsers} currentUserId={authResult.session.user.id} />
      </div>
    </div>
  );
}
