import { requireAuthAction } from "@/lib/auth/guard";
import { getMemberRequestDetail } from "@/app/(protected)/my-requests/queries";
import { notFound } from "next/navigation";
import { RequestDetailCard } from "@/components/admin/requests/request-detail-card";
import { RequestTimeline } from "@/components/admin/requests/request-timeline";
import { RequestComments } from "@/components/admin/requests/request-comments";
import { ProvisionedResourceDetails } from "@/components/member/requests/provisioned-resource-details";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@prisma/client";

import { statusColors } from "@/lib/status-colors";

export default async function MemberRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return <div>Unauthorized</div>;
  }

  const { id } = await params;
  // Ensure we only fetch if the user owns it
  const request = await getMemberRequestDetail(id, authResult.session.user.id);

  if (!request) {
    notFound();
  }

  return (
    <div className="px-8 pb-8 pt-3 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link 
          href="/my-requests" 
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-3 text-muted-foreground w-fit hover:text-foreground")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to My Requests
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Request Details</h1>
            <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs ${statusColors[request.status as RequestStatus]}`}>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Request Details */}
        <div className="md:col-span-2 space-y-8">
          <RequestDetailCard request={request} />
          
          <ProvisionedResourceDetails resource={request.provisionedResource} request={request} />
        </div>

        {/* Right Column - Actions, Timeline, Comments */}
        <div className="space-y-8">
          <RequestTimeline history={request.history} createdAt={request.createdAt} requester={request.user} />

          <RequestComments 
            requestId={request.id} 
            comments={request.comments} 
            currentUserId={authResult.session.user.id} 
          />
        </div>
      </div>
    </div>
  );
}
