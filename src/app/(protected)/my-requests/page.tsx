import { requireAuthAction } from "@/lib/auth/guard";
import { getMemberRequests, getMemberAssignedProjects } from "./queries";
import { MemberRequestsTable } from "@/components/member/requests/member-requests-table";
import { CreateRequestForm } from "@/components/member/requests/create-request-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; order?: string }>;
}) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const { page, sort, order } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;
  const sortBy = sort || "createdAt";
  const sortOrder = (order as "asc" | "desc") || "desc";

  const [requestsData, projects] = await Promise.all([
    getMemberRequests(authResult.session.user.id, currentPage, 10, sortBy, sortOrder),
    getMemberAssignedProjects(authResult.session.user.id),
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
        <Dialog>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Resource</DialogTitle>
              <DialogDescription>
                Request a new resource for one of your projects.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <CreateRequestForm projects={projects} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <MemberRequestsTable requests={requestsData.requests} />
      </div>
    </div>
  );
}
