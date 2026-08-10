"use client";

import { useTransition, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/app/(protected)/admin/users/actions";
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

export function DeleteUserButton({ userId, userName, currentUserId }: { userId: string; userName: string; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Disable button if user is trying to delete themselves
  const isSelf = currentUserId === userId;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent alert dialog from closing automatically
    
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        if (typeof toast !== 'undefined' && toast.error) {
           toast.error(result.error);
        } else {
           alert(result.error);
        }
        setIsOpen(false);
      } else {
        if (typeof toast !== 'undefined' && toast.success) {
           toast.success("User deleted successfully");
        }
        setIsOpen(false);
      }
    });
  };

  if (isSelf) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger 
        render={
          <Button 
            variant="ghost" 
            size="icon-sm" 
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Delete User"
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the user account for <strong>{userName}</strong>. 
            This action cannot be undone.
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
              "Delete User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
