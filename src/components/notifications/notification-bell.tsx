"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import { NotificationItem } from "./notification-item";
import { getUnreadCountAction, markAllAsReadAction } from "@/app/(protected)/notifications/actions";

// We need to fetch notifications, but server actions inside components can be tricky.
// We'll create a client-callable server action to fetch notifications.
import { getNotificationsAction } from "@/app/(protected)/notifications/client-actions";

export function NotificationBell({ session }: { session: Session | null }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const role = session?.user?.role;

  const fetchUnreadCount = useCallback(async () => {
    if (!session) return;
    try {
      const count = await getUnreadCountAction();
      setUnreadCount(count);
    } catch (e) {
      console.error(e);
    }
  }, [session]);

  const fetchNotifications = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleSingleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    // Optimistic update
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    await markAllAsReadAction();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="text-muted-foreground relative" title="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-[3px] text-[10px] font-medium text-white ring-2 ring-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      } />
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 border-border shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  role={role}
                  onRead={() => handleSingleRead(notification.id)}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs mt-1 max-w-[200px]">No new notifications at the moment.</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
