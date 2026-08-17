import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { markAsReadAction } from "@/app/(protected)/notifications/actions";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

interface NotificationItemProps {
  notification: any;
  role: string | undefined;
  onRead: () => void;
  onClose: () => void;
}

export function NotificationItem({ notification, role, onRead, onClose }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsReadAction(notification.id);
      onRead();
    }
    
    if (notification.linkUrl) {
      // Navigate to generic link, adjust for admin if it's a project link
      const finalUrl = role === "ADMIN" && notification.linkUrl.startsWith("/projects/") 
        ? notification.linkUrl.replace("/projects/", "/admin/projects/")
        : notification.linkUrl;
      router.push(finalUrl);
    } else if (notification.requestId) {
      // Navigate to the request
      const basePath = role === "ADMIN" ? "/admin/requests" : "/requests";
      router.push(`${basePath}/${notification.requestId}`);
    }
    
    onClose();
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      await markAsReadAction(notification.id);
      onRead();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "relative flex flex-col gap-1 p-4 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors group",
        !notification.isRead && "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <div className="flex gap-3 justify-between items-start">
        <div className="flex gap-3 flex-1 items-start">
          <div className="mt-1">
            {notification.isRead ? (
              <div className="w-2 h-2 rounded-full bg-transparent" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <p className={cn(
              "text-sm leading-tight",
              !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {!notification.isRead && (
          <button 
            onClick={handleMarkAsRead}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-background/80 hover:bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-sm border border-border/50"
            title="Mark as read"
          >
            <Check className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
