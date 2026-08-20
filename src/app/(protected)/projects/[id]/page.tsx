import { requireProjectMembership } from "@/lib/auth/guard";
import { getMemberProjectDetail, getMemberProjectRequests } from "../queries";
import { getMemberAssignedProjects, getResourceTypes } from "@/app/(protected)/my-requests/queries";
import { ProjectRequestsTable } from "@/components/projects/project-requests-table";
import { NewRequestModal } from "@/components/member/requests/new-request-modal";
import { MemberTeamTable } from "@/components/member/projects/member-team-table";
import { RequirementsDownload } from "@/components/member/projects/requirements-download";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PLANNING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
  PAUSED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  COMPLETED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export default async function MemberProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Guard ensures only assigned members can view the page
  const authResult = await requireProjectMembership(id);
  
  if ("error" in authResult) {
    if (authResult.error === "Unauthorized") return <div>Unauthorized</div>;
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You are not assigned to this project.</p>
        <Link href="/projects" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
          Return to Projects
        </Link>
      </div>
    );
  }

  const [project, memberRequests, allProjects, resourceTypes] = await Promise.all([
    getMemberProjectDetail(id, authResult.session.user.id),
    getMemberProjectRequests(id, authResult.session.user.id),
    getMemberAssignedProjects(authResult.session.user.id),
    getResourceTypes(),
  ]);
  
  // This shouldn't happen because of the guard, but TypeScript needs it
  if (!project) {
    return <div>Project not found</div>;
  }

  const requirementsFilename = project.documents?.[0]?.fileName || null;

  return (
    <div className="px-8 pb-8 pt-3 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link 
            href="/projects"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 text-muted-foreground w-fit hover:text-foreground" })}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Projects
          </Link>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className={`rounded-md px-2.5 py-0.5 text-sm font-medium ${statusColors[project.status] || "bg-muted text-muted-foreground"}`}>
                {project.status}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <UserIcon className="size-4 shrink-0" />
                <span>Created by <span className="font-medium text-foreground">{project.creator.username}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 shrink-0" />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 sm:mt-8">
          <NewRequestModal projects={allProjects} resourceTypes={resourceTypes} defaultProjectId={project.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
          
          <MemberTeamTable members={project.members} />

          <ProjectRequestsTable 
            requests={memberRequests} 
            isProjectActive={project.status !== "COMPLETED" && project.status !== "ARCHIVED"}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <RequirementsDownload 
            projectId={project.id}
            filename={requirementsFilename}
          />
        </div>
      </div>
    </div>
  );
}
