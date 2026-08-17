import { requireAuthAction } from "@/lib/auth/guard";
import { getAdminRequests } from "./queries";
import { AdminRequestsTable } from "@/components/admin/requests/admin-requests-table";
import { StatusFilter } from "@/components/admin/requests/status-filter";
import { RequestsViewToggle } from "@/components/admin/requests/requests-view-toggle";
import { RequestStatus } from "@prisma/client";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string; status?: string; view?: string }>;
}) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session || authResult.session.user.role !== "ADMIN") {
    return <div>Unauthorized</div>;
  }

  const { page, sortBy: sortParam, sortOrder: orderParam, status, view: viewParam } = await searchParams;
  const view = (viewParam as "pending" | "all") || "pending";
  const currentPage = page ? parseInt(page as string) : 1;
  const sortBy = (sortParam as string) || "status";
  const sortOrder = (orderParam as "asc" | "desc") || "asc";
  
  // If view is pending, force status to PENDING and ACCEPTED
  const statusFilter = view === "pending" ? ["PENDING", "ACCEPTED"] as RequestStatus[] : ((status as RequestStatus | "ALL") || "ALL");

  const requestsData = await getAdminRequests(currentPage, 10, sortBy, sortOrder, statusFilter);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Queue</h1>
          <p className="text-muted-foreground mt-1">
            Manage and provision all resource requests across the platform.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {view === "all" && <StatusFilter />}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <RequestsViewToggle view={view} />
        <div key={`${view}-${currentPage}`} className={`animate-in fade-in ${view === "pending" ? "slide-in-from-right-4" : "slide-in-from-left-4"} duration-500 ease-out fill-mode-both`}>
          <AdminRequestsTable 
            requests={requestsData.requests} 
            currentPage={currentPage}
            totalPages={requestsData.totalPages}
            totalCount={requestsData.totalCount}
          />
        </div>
      </div>
    </div>
  );
}
