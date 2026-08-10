"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteForm } from "./invite-form";

export function InviteUserModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="solid">
          <UserPlus className="mr-2 size-4" />
          Invite User
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            Send an email invitation to join the team. They will be prompted to set up their account.
          </DialogDescription>
        </DialogHeader>
        <InviteForm onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
