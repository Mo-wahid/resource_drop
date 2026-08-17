import { requireRoleAction } from "@/lib/auth/guard";
import { 
  getAdminDashboardStats, 
  getRecentPendingRequests, 
  getAdminRequestStatusBreakdown, 
  getAdminProjectStatusBreakdown,
  getRecentAuditEntries
} from "./queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBreakdownBar, StatusItem } from "@/components/dashboard/status-breakdown-bar";
import { RecentRequestsTable } from "@/components/admin/dashboard/recent-requests-table";
import { RecentActivityList } from "@/components/admin/dashboard/recent-activity-list";
import { Users, FolderKanban, Inbox, Server } from "lucide-react";

const requestColorMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500" },

  PROVISIONED: { label: "Provisioned", color: "bg-green-500" },
  REJECTED: { label: "Rejected", color: "bg-red-500" },
  REVOKED: { label: "Revoked", color: "bg-gray-500" },
};

const projectColorMap: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "Planning", color: "bg-blue-500" },
  ACTIVE: { label: "Active", color: "bg-green-500" },
  PAUSED: { label: "Paused", color: "bg-amber-500" },
  COMPLETED: { label: "Completed", color: "bg-purple-500" },
  ARCHIVED: { label: "Archived", color: "bg-gray-500" },
};

export default async function AdminDashboardPage() {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const [
    stats,
    pendingRequests,
    requestBreakdown,
    projectBreakdown,
    recentAudit,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getRecentPendingRequests(3),
    getAdminRequestStatusBreakdown(),
    getAdminProjectStatusBreakdown(),
    getRecentAuditEntries(3),
  ]);

  const formattedRequestItems: StatusItem[] = requestBreakdown.map((r) => ({
    key: r.status,
    label: requestColorMap[r.status]?.label || r.status,
    count: r.count,
    colorClass: requestColorMap[r.status]?.color || "bg-muted-foreground",
  }));

  const formattedProjectItems: StatusItem[] = projectBreakdown.map((p) => ({
    key: p.status,
    label: projectColorMap[p.status]?.label || p.status,
    count: p.count,
    colorClass: projectColorMap[p.status]?.color || "bg-muted-foreground",
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time metrics, active queues, and infrastructure distribution.
        </p>
      </div>

      {/* Row 1: KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Active accounts in organization"
          href="/admin/users"
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={FolderKanban}
          description="Planning & Active status"
          href="/admin/projects"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={Inbox}
          description="Awaiting review & provisioning"
          href="/admin/requests"
        />
        <StatCard
          label="Resource Types"
          value={stats.provisionedResources}
          icon={Server}
          description="Active infrastructure components"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column: Tables & Lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RecentRequestsTable requests={pendingRequests} />
          <RecentActivityList entries={recentAudit} />
        </div>

        {/* Right Column: Status Breakdown Bars */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <StatusBreakdownBar
            title="Request Pipeline"
            description="All-time distribution of requests"
            items={formattedRequestItems}
          />
          <StatusBreakdownBar
            title="Project Distribution"
            description="Projects by lifecycle phase"
            items={formattedProjectItems}
          />
        </div>
      </div>
    </div>
  );
}
