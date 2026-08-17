import { requireAuthAction } from "@/lib/auth/guard";
import { getMemberProjects } from "@/app/(protected)/projects/queries";
import { 
  getMemberDashboardStats, 
  getRecentMemberRequests, 
  getMemberRequestStatusBreakdown 
} from "./queries";
import { MemberProjectsTable } from "@/components/member/projects/member-projects-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBreakdownBar, StatusItem } from "@/components/dashboard/status-breakdown-bar";
import { RecentMemberRequestsTable } from "@/components/member/dashboard/recent-member-requests-table";
import { FolderKanban, Inbox, Server, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const requestColorMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500" },
  ACCEPTED: { label: "Accepted", color: "bg-blue-500" },
  PROVISIONED: { label: "Provisioned", color: "bg-green-500" },
  REJECTED: { label: "Rejected", color: "bg-red-500" },
  REVOKED: { label: "Revoked", color: "bg-gray-500" },
};

export default async function MemberDashboardPage() {
  const authResult = await requireAuthAction();
  
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const userId = authResult.session.user.id;

  const [
    stats,
    recentRequests,
    requestBreakdown,
    projectData,
  ] = await Promise.all([
    getMemberDashboardStats(userId),
    getRecentMemberRequests(userId, 5),
    getMemberRequestStatusBreakdown(userId),
    getMemberProjects(userId, 1, 5),
  ]);

  const formattedRequestItems: StatusItem[] = requestBreakdown.map((r) => ({
    key: r.status,
    label: requestColorMap[r.status]?.label || r.status,
    count: r.count,
    colorClass: requestColorMap[r.status]?.color || "bg-muted-foreground",
  }));

  const userName = authResult.session.user.name || authResult.session.user.email?.split("@")[0] || "Member";

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, <span className="text-foreground font-medium">{userName}</span>. Here is an overview of your active workspaces and requests.
        </p>
      </div>

      {/* Row 1: KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Assigned Projects"
          value={stats.assignedProjects}
          icon={FolderKanban}
          description="Projects you are actively collaborating on"
          href="/projects"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={Inbox}
          description="Requests waiting for admin approval"
          href="/my-requests"
        />
        <StatCard
          label="Active Provisions"
          value={stats.provisionedResources}
          icon={Server}
          description="Successfully provisioned resources"
        />
      </div>

      {/* Row 2: Recent Requests & Request Breakdown */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMemberRequestsTable requests={recentRequests} />
        </div>
        <div className="lg:col-span-1">
          <StatusBreakdownBar
            title="My Request Pipeline"
            description="Status breakdown of your requests"
            items={formattedRequestItems}
          />
        </div>
      </div>

      {/* Row 3: Assigned Projects */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your Projects</h2>
            <p className="text-xs text-muted-foreground">Jump back into your assigned work.</p>
          </div>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground">
              View All Projects
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          <MemberProjectsTable 
            projects={projectData.projects} 
            currentPage={1} 
            totalPages={projectData.totalPages} 
            totalCount={projectData.totalCount} 
          />
        </div>
      </div>
    </div>
  );
}
