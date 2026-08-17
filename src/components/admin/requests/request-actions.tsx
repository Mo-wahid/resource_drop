"use client";

import { useState } from "react";
import { RequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateRequestStatus } from "@/app/(protected)/admin/requests/actions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Play, Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";


export function RequestActions({ request }: { request: any }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState<RequestStatus | null>(null);

  const handleAction = async (action: RequestStatus) => {
    setActionType(action);
    setIsPending(true);
    const result = await updateRequestStatus(request.id, action, notes);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Request status updated successfully");
      setNotes("");
      router.refresh();
    }
    
    setIsPending(false);
    setActionType(null);
  };

  if (request.status === "REJECTED" || request.status === "REVOKED") {
    return null; // terminal states, no actions
  }

  return (
    <div className="flex flex-wrap gap-2">
      {request.status === "PENDING" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button className="gap-2 w-full sm:w-auto">
                    <CheckCircle2 className="size-4" />
                    Accept Request
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accept Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the request as accepted and notify the user. You can proceed with provisioning the resource.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Textarea 
                      placeholder="Optional notes for the user..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNotes("")}>Cancel</AlertDialogCancel>
                    <Button 
                      onClick={() => handleAction("ACCEPTED")} 
                      disabled={isPending}
                    >
                      {isPending && actionType === "ACCEPTED" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Confirm Accept
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button variant="destructive" className="gap-2 w-full sm:w-auto">
                    <XCircle className="size-4" />
                    Reject Request
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reject the request and notify the user. This action is terminal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Textarea 
                      placeholder="Reason for rejection (recommended)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNotes("")}>Cancel</AlertDialogCancel>
                    <Button 
                      variant="destructive"
                      onClick={() => handleAction("REJECTED")} 
                      disabled={isPending}
                    >
                      {isPending && actionType === "REJECTED" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Confirm Reject
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {request.status === "ACCEPTED" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button variant="destructive" className="gap-2 w-full sm:w-auto">
                    <XCircle className="size-4" />
                    Reject Request
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reject the previously accepted request.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Textarea 
                      placeholder="Reason for rejection..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNotes("")}>Cancel</AlertDialogCancel>
                    <Button 
                      variant="destructive"
                      onClick={() => handleAction("REJECTED")} 
                      disabled={isPending}
                    >
                      {isPending && actionType === "REJECTED" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Confirm Reject
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {request.status === "PROVISIONED" && (
            <AlertDialog>
              <AlertDialogTrigger render={
                <Button variant="destructive" className="gap-2 w-full sm:w-auto">
                  <Ban className="size-4" />
                  Revoke Access
                </Button>
              } />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the resource request as revoked. Ensure you have actually torn down or removed access to the underlying resource manually.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Textarea 
                    placeholder="Reason for revocation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setNotes("")}>Cancel</AlertDialogCancel>
                  <Button 
                    variant="destructive"
                    onClick={() => handleAction("REVOKED")} 
                    disabled={isPending}
                  >
                    {isPending && actionType === "REVOKED" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Confirm Revoke
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
    </div>
  );
}
