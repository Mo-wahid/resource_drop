import { getProjects, getEligibleMembers } from "./queries";
import { ProjectsTable } from "@/components/admin/projects/projects-table";
import { CreateProjectModal } from "@/components/admin/projects/create-project-modal";
import { ProjectsViewToggle } from "@/components/admin/projects/projects-view-toggle";
import { requireRoleAction } from "@/lib/auth/guard";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const view = params.view === "inactive" ? "inactive" : "active";
  
  const page = parseInt(params.page as string) || 1;
  const sortBy = params.sortBy as string | undefined;
  const sortOrder = (params.sortOrder as "asc" | "desc") || "asc";

  const authResult = await requireRoleAction("ADMIN");
  
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const [projectData, eligibleMembers] = await Promise.all([
    getProjects(view, page, 8, sortBy, sortOrder),
    getEligibleMembers()
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage project workspaces and resource allocations.</p>
        </div>
        <CreateProjectModal eligibleMembers={eligibleMembers} />
      </div>

      <div className="flex flex-col gap-4">
        <ProjectsViewToggle view={view} />
        <div key={`${view}-${page}`} className={`animate-in fade-in ${view === "active" ? "slide-in-from-right-4" : "slide-in-from-left-4"} duration-500 ease-out fill-mode-both`}>
          <ProjectsTable 
            projects={projectData.projects} 
            currentPage={page} 
            totalPages={projectData.totalPages} 
            totalCount={projectData.totalCount} 
          />
        </div>
      </div>
    </div>
  );
}
