import { Project } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User as UserIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

type ProjectWithCreator = Project & {
  creator: { username: string };
};

export function ProjectDetailCard({ project }: { project: ProjectWithCreator }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{project.name}</CardTitle>
        <CardDescription className="text-sm mt-2 whitespace-pre-wrap">
          {project.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 shrink-0" />
            <span>Created by <span className="font-medium text-foreground">{project.creator.username}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
