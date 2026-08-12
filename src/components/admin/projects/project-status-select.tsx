"use client";

import * as React from "react";
import { Project } from "@prisma/client";
import { updateProjectStatus } from "@/app/(protected)/admin/projects/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProjectStatus = Project["status"];

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
  PAUSED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
  COMPLETED: "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
};

const menuItemColors: Record<ProjectStatus, string> = {
  PLANNING: "text-blue-500 focus:bg-blue-500/10 focus:text-blue-500",
  ACTIVE: "text-green-500 focus:bg-green-500/10 focus:text-green-500",
  PAUSED: "text-yellow-500 focus:bg-yellow-500/10 focus:text-yellow-500",
  COMPLETED: "text-purple-500 focus:bg-purple-500/10 focus:text-purple-500",
  ARCHIVED: "text-gray-500 focus:bg-gray-500/10 focus:text-gray-500",
};

interface ProjectStatusSelectProps {
  projectId: string;
  initialStatus: ProjectStatus;
}

export function ProjectStatusSelect({ projectId, initialStatus }: ProjectStatusSelectProps) {
  const [status, setStatus] = React.useState<ProjectStatus>(initialStatus);
  const [isPending, startTransition] = React.useTransition();

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, newStatus);
      if (result?.error) {
        toast.error(result.error);
        setStatus(initialStatus); // revert
      } else {
        toast.success(`Project status updated to ${newStatus}`);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none" disabled={isPending}>
        <Badge 
          variant="outline" 
          className={cn(
            "cursor-pointer transition-colors px-3 py-1 flex items-center gap-1.5 rounded-md",
            statusColors[status],
            isPending && "opacity-70 cursor-not-allowed"
          )}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
          {status.replace('_', ' ')}
          {!isPending && <ChevronDown className="size-3 opacity-60" />}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[140px]">
        {Object.keys(statusColors).map((s) => {
          const projectStatus = s as ProjectStatus;
          return (
            <DropdownMenuItem 
              key={projectStatus} 
              className={cn("text-xs cursor-pointer font-medium mb-0.5", menuItemColors[projectStatus])}
              onClick={() => handleStatusChange(projectStatus)}
            >
              {projectStatus.replace('_', ' ')}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
