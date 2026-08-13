import { requireAuthAction } from "@/lib/auth/guard";
import { getMemberProjects } from "@/app/(protected)/projects/queries";
import { MemberProjectsTable } from "@/components/member/projects/member-projects-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

export default async function MemberDashboardPage() {
  const authResult = await requireAuthAction();
  
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const projectData = await getMemberProjects(authResult.session.user.id);
  const projects = projectData.projects;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {authResult.session.user.name || "Member"}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active projects you are a part of
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your Projects</h2>
          <p className="text-sm text-muted-foreground">Jump back into your assigned work.</p>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          <MemberProjectsTable 
          projects={projects} 
          currentPage={1} 
          totalPages={1} 
          totalCount={projectData.totalCount} 
        />
        </div>
      </div>
    </div>
  );
}
