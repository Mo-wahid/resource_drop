"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateRequestForm } from "./create-request-form";

export function NewRequestModal({ 
  projects,
  resourceTypes,
  defaultProjectId,
}: { 
  projects: React.ComponentProps<typeof CreateRequestForm>["projects"]
  resourceTypes: React.ComponentProps<typeof CreateRequestForm>["resourceTypes"] 
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        New Request
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Resource</DialogTitle>
          <DialogDescription>
            Request a new resource for one of your projects.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <CreateRequestForm projects={projects} resourceTypes={resourceTypes} onSuccess={() => setOpen(false)} defaultProjectId={defaultProjectId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
