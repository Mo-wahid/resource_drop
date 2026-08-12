"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeInvitation, resendInvitation } from "@/app/(protected)/admin/users/actions";
import { toast } from "sonner";
import { RotateCw, XCircle, Loader2 } from "lucide-react";
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

interface InvitationActionsProps {
  invitationId: string;
  isExpired: boolean;
}

export function InvitationActions({ invitationId, isExpired }: InvitationActionsProps) {
  const [isRevoking, startRevoking] = useTransition();
  const [isResending, startResending] = useTransition();
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  const onRevoke = (e: React.MouseEvent) => {
    e.preventDefault();
    
    startRevoking(async () => {
      const res = await revokeInvitation(invitationId);
      if (res.error) {
        toast.error(res.error);
        setIsRevokeOpen(false);
      } else {
        toast.success("Invitation revoked");
        setIsRevokeOpen(false);
      }
    });
  };

  const onResend = () => {
    startResending(async () => {
      const res = await resendInvitation(invitationId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Invitation resent");
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onResend}
        disabled={isRevoking || isResending}
      >
        <RotateCw className={`size-4 mr-2 ${isResending ? "animate-spin" : ""}`} />
        Resend
      </Button>
      {!isExpired && (
        <AlertDialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="sm"
                disabled={isRevoking || isResending}
              >
                {isRevoking ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="size-4 mr-2" />
                )}
                Revoke
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke this invitation? This action cannot be undone and the invite link will immediately become invalid.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isRevoking}
                onClick={onRevoke}
              >
                {isRevoking ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  "Revoke"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
