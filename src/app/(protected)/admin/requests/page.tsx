import { requireAuthAction } from "@/lib/auth/guard";
import { getAdminRequests } from "./queries";
import { AdminRequestsTable } from "@/components/admin/requests/admin-requests-table";
import { StatusFilter } from "@/components/admin/requests/status-filter";
import { RequestStatus } from "@prisma/client";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string; status?: string }>;
}) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session || authResult.session.user.role !== "ADMIN") {
    return <div>Unauthorized</div>;
  }

  const { page, sortBy: sortParam, sortOrder: orderParam, status } = await searchParams;
  const currentPage = page ? parseInt(page as string) : 1;
  const sortBy = (sortParam as string) || "status";
  const sortOrder = (orderParam as "asc" | "desc") || "asc";
  const statusFilter = (status as RequestStatus | "ALL") || "ALL";

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
          <StatusFilter />
        </div>
      </div>

      <div key={currentPage} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <AdminRequestsTable 
          requests={requestsData.requests} 
          currentPage={currentPage}
          totalPages={requestsData.totalPages}
          totalCount={requestsData.totalCount}
        />
      </div>
    </div>
  );
}
