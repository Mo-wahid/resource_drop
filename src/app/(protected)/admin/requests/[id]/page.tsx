import { requireAuthAction } from "@/lib/auth/guard";
import { getAdminRequestDetail } from "../queries";
import { notFound } from "next/navigation";
import { RequestDetailCard } from "@/components/admin/requests/request-detail-card";
import { RequestActions } from "@/components/admin/requests/request-actions";
import { RequestTimeline } from "@/components/admin/requests/request-timeline";
import { RequestComments } from "@/components/admin/requests/request-comments";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@prisma/client";

import { ProvisionResourceForm } from "@/components/admin/requests/provision-resource-form";
import { CheckCircle2 } from "lucide-react";

const statusColors: Record<RequestStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ACCEPTED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PROVISIONED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  REVOKED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session || authResult.session.user.role !== "ADMIN") {
    return <div>Unauthorized</div>;
  }

  const { id } = await params;
  const request = await getAdminRequestDetail(id);

  if (!request) {
    notFound();
  }

  return (
    <div className="px-8 pb-8 pt-3 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link 
          href="/admin/requests" 
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-3 text-muted-foreground w-fit hover:text-foreground")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Requests
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Manage Request</h1>
            <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs ${statusColors[request.status as RequestStatus]}`}>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
          <RequestActions request={request} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Request Details */}
        <div className="md:col-span-2 space-y-8">
          <RequestDetailCard request={request} />
          
          {request.status === "PENDING" || request.status === "ACCEPTED" ? (
            <ProvisionResourceForm request={request} />
          ) : request.status === "PROVISIONED" ? (
            <Card className="shadow-sm border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center text-green-600">
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-base font-medium">Resource Provisioned</p>
                  <p className="text-sm mt-1 text-green-600/80">This resource has been successfully provisioned for the member.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
                  <p className="text-sm font-medium">Request Closed</p>
                  <p className="text-xs mt-1">This request was rejected or revoked.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Timeline, Comments */}
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
