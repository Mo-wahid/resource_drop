import { notFound } from "next/navigation";
import { requireRoleAction } from "@/lib/auth/guard";
import { getProjectDetail, getEligibleMembers, getRoles, getProjectRequests } from "@/app/(protected)/admin/projects/queries";
import { ProjectRequestsTable } from "@/components/projects/project-requests-table";
import { RequirementsUpload } from "@/components/admin/projects/requirements-upload";
import { ProjectMembersTable } from "@/components/admin/projects/project-members-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ProjectStatusSelect } from "@/components/admin/projects/project-status-select";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const project = await getProjectDetail(id);
  if (!project) {
    notFound();
  }

  const [eligibleMembers, roles, projectRequests] = await Promise.all([
    getEligibleMembers(),
    getRoles(),
    getProjectRequests(id)
  ]);
  
  const requirementsFilename = project.documents?.[0]?.fileName || null;

  return (
    <div className="px-8 pb-8 pt-3 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link 
          href="/admin/projects"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 text-muted-foreground w-fit hover:text-foreground" })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Projects
        </Link>
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <ProjectStatusSelect projectId={project.id} initialStatus={project.status} />
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
          
          <ProjectMembersTable 
            projectId={project.id}
            members={project.members}
            eligibleMembers={eligibleMembers}
            roles={roles}
            isProjectActive={project.status !== "COMPLETED" && project.status !== "ARCHIVED"}
          />

          <ProjectRequestsTable 
            requests={projectRequests} 
            isAdmin 
            isProjectActive={project.status !== "COMPLETED" && project.status !== "ARCHIVED"}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <RequirementsUpload 
            projectId={project.id}
            existingFilename={requirementsFilename}
            isProjectActive={project.status !== "COMPLETED" && project.status !== "ARCHIVED"}
          />
        </div>
      </div>
    </div>
  );
}
