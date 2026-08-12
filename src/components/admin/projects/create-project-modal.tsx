"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "./create-project-form";

export function CreateProjectModal({
  eligibleMembers
}: {
  eligibleMembers: { id: string; username: string; email: string }[]
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="solid">
          <FolderPlus className="mr-2 size-4" />
          New Project
        </Button>
      } />
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Set up a project workspace with documents and team members.
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm onSuccess={() => setIsOpen(false)} eligibleMembers={eligibleMembers} />
      </DialogContent>
    </Dialog>
  );
}
