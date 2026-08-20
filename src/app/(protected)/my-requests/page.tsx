import { requireAuthAction } from "@/lib/auth/guard";
import { getMemberRequests, getMemberAssignedProjects, getResourceTypes } from "./queries";
import { MemberRequestsTable } from "@/components/member/requests/member-requests-table";
import { NewRequestModal } from "@/components/member/requests/new-request-modal";

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const { page, sortBy: sortParam, sortOrder: orderParam } = await searchParams;
  const currentPage = page ? parseInt(page as string) : 1;
  const sortBy = (sortParam as string) || "createdAt";
  const sortOrder = (orderParam as "asc" | "desc") || "desc";

  const [requestsData, projects, resourceTypes] = await Promise.all([
    getMemberRequests(authResult.session.user.id, currentPage, 10, sortBy, sortOrder),
    getMemberAssignedProjects(authResult.session.user.id),
    getResourceTypes(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage your resource requests across all projects.
          </p>
        </div>
        <NewRequestModal projects={projects} resourceTypes={resourceTypes} />
      </div>

      <div key={currentPage} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <MemberRequestsTable 
          requests={requestsData.requests} 
          currentPage={currentPage}
          totalPages={requestsData.totalPages}
          totalCount={requestsData.totalCount}
        />
      </div>
    </div>
  );
}
