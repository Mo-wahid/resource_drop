"use client";

import { useState, useTransition } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { UserPlus, Loader2, Trash2, Users } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { syncProjectMembers, removeProjectMember, updateProjectMemberRole } from "@/app/(protected)/admin/projects/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MemberSelectField } from "./member-select-field";

type Member = {
  user: { id: string; username: string; email: string };
  role: { id: string; name: string };
  assignedAt: Date;
};

type Role = { id: string; name: string };

type EligibleMember = {
  id: string;
  username: string;
  email: string;
};

function MemberRow({ 
  member, 
  roles, 
  isPending, 
  isProjectActive,
  onRoleChange, 
  onRemove 
}: { 
  member: Member,
  roles: Role[], 
  isPending: boolean,
  isProjectActive: boolean,
  onRoleChange: (userId: string, roleId: string) => void,
  onRemove: (userId: string, username: string) => void
}) {
  // Fully controlled state to avoid Base UI errors and ensure SelectValue resolves correctly
  const [roleId, setRoleId] = useState(member.role.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{member.user.username}</TableCell>
      <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
      <TableCell>
        <Select 
          value={roleId} 
          onValueChange={(val) => {
            if (!val) return;
            setRoleId(val);
            onRoleChange(member.user.id, val);
          }}
          disabled={isPending || !isProjectActive}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs border-transparent hover:border-border transition-colors">
            <SelectValue>
              {roles.find(r => r.id === roleId)?.name.replace('_', ' ')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell suppressHydrationWarning>{formatDate(member.assignedAt)}</TableCell>
      <TableCell className="text-right">
        {isProjectActive && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive" 
            disabled={isPending}
            onClick={() => onRemove(member.user.id, member.user.username)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ProjectMembersTable({
  projectId,
  members,
  eligibleMembers,
  roles,
  isProjectActive = true,
}: {
  projectId: string;
  members: Member[];
  eligibleMembers: EligibleMember[];
  roles: Role[];
  isProjectActive?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const memberIds = members.map(m => m.user.id);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(memberIds);

  const handleSyncMembers = () => {
    if (isPending) return;
    startTransition(async () => {
      const res = await syncProjectMembers(projectId, selectedUserIds);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Project members updated");
        setIsAddOpen(false);
        router.refresh();
      }
    });
  };

  const handleRemoveMember = (userId: string, username: string) => {
    startTransition(async () => {
      const res = await removeProjectMember(projectId, userId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${username} removed from project`);
        router.refresh();
      }
    });
  };

  const handleRoleChange = (userId: string, roleId: string) => {
    startTransition(async () => {
      const res = await updateProjectMemberRole(projectId, userId, roleId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Role updated");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            Project Team
          </CardTitle>
          <CardDescription className="mt-1">People with access to this project</CardDescription>
        </div>
        {isProjectActive && (
          <Dialog 
            open={isAddOpen} 
            onOpenChange={(open) => {
              if (open) setSelectedUserIds(members.map(m => m.user.id));
              setIsAddOpen(open);
            }}
          >
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="h-8">
                <UserPlus className="mr-2 size-3.5" />
                Manage Members
              </Button>
            } />
            <DialogContent className="overflow-visible">
              <DialogHeader>
                <DialogTitle>Manage Project Members</DialogTitle>
                <DialogDescription>
                  Select members to add to the project. Unselecting an existing member will remove them.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team Members</label>
                  <MemberSelectField 
                    eligibleMembers={eligibleMembers}
                    selectedIds={selectedUserIds}
                    onChange={setSelectedUserIds}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isPending}>Cancel</Button>
                <Button 
                  onClick={handleSyncMembers} 
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[200px]">Role</TableHead>
                <TableHead className="w-[150px]">Assigned</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                  <MemberRow 
                    key={member.user.id} 
                    member={member} 
                    roles={roles} 
                    isPending={isPending} 
                    isProjectActive={isProjectActive}
                    onRoleChange={handleRoleChange} 
                    onRemove={handleRemoveMember} 
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
