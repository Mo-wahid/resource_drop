import { requireAuthAction } from "@/lib/auth/guard";
import { getMemberProjects } from "./queries";
import { MemberProjectsTable } from "@/components/member/projects/member-projects-table";

export default async function MemberProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page as string) || 1;
  const sortBy = params.sortBy as string | undefined;
  const sortOrder = (params.sortOrder as "asc" | "desc") || "asc";

  const authResult = await requireAuthAction();
  
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const projectData = await getMemberProjects(authResult.session.user.id, page, 8, sortBy, sortOrder);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-1">View the projects you are assigned to.</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <MemberProjectsTable 
          projects={projectData.projects} 
          currentPage={page} 
          totalPages={projectData.totalPages} 
          totalCount={projectData.totalCount} 
        />
      </div>
    </div>
  );
}
