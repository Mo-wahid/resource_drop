"use client";

import { Project, ProjectDocument } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderGit2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SortableTableHead, TablePagination } from "@/components/admin/table-utils";

type ProjectWithRelations = Project & {
  creator: { username: string };
  _count: { members: number };
  documents?: Pick<ProjectDocument, "fileName" | "id">[];
};

type ProjectStatus = Project["status"];

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
  PAUSED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  COMPLETED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface ProjectsTableProps {
  projects: ProjectWithRelations[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function ProjectsTable({ projects, currentPage, totalPages, totalCount }: ProjectsTableProps) {
  const router = useRouter();

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
        <FolderGit2 className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No projects found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Get started by creating your first project to organize resources and team members.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <SortableTableHead columnKey="creator" title="Creator" />
            <TableHead className="text-right">Members</TableHead>
            <SortableTableHead columnKey="status" title="Status" className="text-center" />
            <TableHead className="text-center">Requirements</TableHead>
            <SortableTableHead columnKey="createdAt" title="Created" className="text-right hidden sm:table-cell" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const hasRequirements = project.documents && project.documents.length > 0;
            return (
              <TableRow 
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/admin/projects/${project.id}`)}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[300px]">
                  {project.description || "—"}
                </TableCell>
                <TableCell>{project.creator.username}</TableCell>
                <TableCell className="text-right">{project._count.members}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`rounded-md w-24 justify-center ${statusColors[project.status]}`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {hasRequirements ? (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-md">
                      <FileText className="size-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                  {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
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
