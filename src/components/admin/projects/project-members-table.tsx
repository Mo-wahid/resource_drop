"use client";

import { useState, useTransition } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, Trash2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { addProjectMember, removeProjectMember } from "@/app/(protected)/admin/projects/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

const roleColors: Record<string, string> = {
  ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TEAM_MEMBER: "text-foreground border-border bg-transparent",
};

export function ProjectMembersTable({
  projectId,
  members,
  eligibleMembers,
  roles
}: {
  projectId: string;
  members: Member[];
  eligibleMembers: EligibleMember[];
  roles: Role[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Add Member State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const handleAddMember = () => {
    if (!selectedUserId || !selectedRoleId) return;
    startTransition(async () => {
      const res = await addProjectMember(projectId, selectedUserId, selectedRoleId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Member added to project");
        setIsAddOpen(false);
        setSelectedUserId("");
        setSelectedRoleId("");
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

  // Filter out users who are already members
  const memberIds = members.map(m => m.user.id);
  const availableUsers = eligibleMembers.filter(u => !memberIds.includes(u.id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Members</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
            <UserPlus className="mr-2 size-3.5" />
            Add Member
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </SelectItem>
                    ))}
                    {availableUsers.length === 0 && (
                      <SelectItem value="none" disabled>No eligible users available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRoleId} onValueChange={(val) => setSelectedRoleId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isPending}>Cancel</Button>
              <Button onClick={handleAddMember} disabled={!selectedUserId || !selectedRoleId || isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      <Badge variant="outline" className={`rounded-md w-24 justify-center ${roleColors[member.role.name] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {member.role.name.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell suppressHydrationWarning>{new Date(member.assignedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                        disabled={isPending}
                        onClick={() => handleRemoveMember(member.user.id, member.user.username)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
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
