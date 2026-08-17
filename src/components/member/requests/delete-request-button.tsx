"use client";

import { useTransition, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteResourceRequest } from "@/app/(protected)/my-requests/actions";
import { toast } from "sonner";
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

export function DeleteRequestButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent alert dialog from closing automatically
    
    startTransition(async () => {
      const result = await deleteResourceRequest(requestId);
      if (result.error) {
        if (typeof toast !== 'undefined' && toast.error) {
           toast.error(result.error);
        } else {
           alert(result.error);
        }
        setIsOpen(false);
      } else {
        if (typeof toast !== 'undefined' && toast.success) {
           toast.success("Request deleted successfully");
        }
        setIsOpen(false);
      }
    });
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger 
          render={
            <Button 
              variant="ghost" 
              size="icon-sm" 
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Delete Request"
            />
          }
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          <span className="sr-only">Delete</span>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
