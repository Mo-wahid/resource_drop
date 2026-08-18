import { requireRoleAction } from "@/lib/auth/guard";
import { getAuditLogs } from "./queries";
import { AuditLogTable } from "@/components/admin/audit-log/audit-log-table";
import { AuditActionFilter } from "@/components/admin/audit-log/audit-action-filter";
import { AuditAdvancedFilters } from "@/components/admin/audit-log/audit-advanced-filters";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    sortBy?: string; 
    sortOrder?: string; 
    action?: string;
    actorId?: string;
    targetId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const { page, sortBy, sortOrder, action, actorId, targetId, startDate, endDate } = await searchParams;
  const currentPage = page ? parseInt(page as string) : 1;
  const currentSortBy = (sortBy as string) || "createdAt";
  const currentSortOrder = (sortOrder as "asc" | "desc") || "desc";

  const { logs, totalPages, totalCount } = await getAuditLogs({
    page: currentPage,
    pageSize: 15,
    sortBy: currentSortBy,
    sortOrder: currentSortOrder,
    actionFilter: action as string,
    actorId,
    targetId,
    startDate,
    endDate
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Comprehensive record of security events, administrative updates, and user activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AuditActionFilter />
          <AuditAdvancedFilters />
        </div>
      </div>

      <div className="animate-in fade-in duration-300">
        <AuditLogTable
          logs={logs}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
