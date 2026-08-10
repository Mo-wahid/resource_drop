"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { revokeInvitation, resendInvitation } from "@/app/(protected)/admin/users/actions";
import { toast } from "sonner";
import { RotateCw, XCircle } from "lucide-react";

interface InvitationActionsProps {
  invitationId: string;
  isExpired: boolean;
}

export function InvitationActions({ invitationId, isExpired }: InvitationActionsProps) {
  const [isRevoking, startRevoking] = useTransition();
  const [isResending, startResending] = useTransition();

  const onRevoke = () => {
    if (!confirm("Are you sure you want to revoke this invitation? This action cannot be undone.")) return;
    
    startRevoking(async () => {
      const res = await revokeInvitation(invitationId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Invitation revoked");
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
        <Button
          variant="destructive"
          size="sm"
          onClick={onRevoke}
          disabled={isRevoking || isResending}
        >
          <XCircle className="size-4 mr-2" />
          Revoke
        </Button>
      )}
    </div>
  );
}
