"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { Session } from "next-auth";
import { signOutAction } from "@/app/(auth)/login/actions";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface HeaderActionsProps {
  session: Session | null;
}

export function HeaderActions({ session }: HeaderActionsProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const role = session?.user?.role;
  const username = session?.user?.name || session?.user?.email?.split('@')[0] || "User";
  const userInitial = username.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOutAction();
  };

  return (
    <div className="flex items-center gap-2 ml-auto">
      <NotificationBell session={session} />

      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="rounded-full size-8">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col px-2 py-1.5">
            <span className="truncate font-semibold text-sm">{username}</span>
            <span className="truncate text-xs text-muted-foreground uppercase">{role}</span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={(e) => {
              // Base UI uses onClick instead of Radix's onSelect
              handleSignOut();
            }}
          >
            {isSigningOut ? (
              <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin mr-2" />
            ) : (
              <LogOut className="mr-2 size-4" />
            )}
            <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
