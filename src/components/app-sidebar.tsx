"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Inbox, 
  History, 
  LogOut, 
  Settings,
} from "lucide-react";
import { ResourceDropLogo } from "./icons/resource-drop-logo";
import { siteConfig } from "@/config/site";
import { Session } from "next-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/login/actions";

interface AppSidebarProps {
  session: Session | null;
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();
  const role = session?.user?.role;
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || "U";

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeUrl, setActiveUrl] = useState(pathname);

  useEffect(() => {
    setActiveUrl(pathname);
  }, [pathname]);

  // Define navigation items based on role
  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Projects", url: "/admin/projects", icon: FolderKanban },
    { title: "Users & Roles", url: "/admin/users", icon: Users },
    { title: "Requests", url: "/admin/requests", icon: Inbox },
    { title: "Audit Log", url: "/admin/audit-log", icon: History },
  ];

  const memberItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Requests", url: "/my-requests", icon: Inbox },
  ];

  const items = role === "ADMIN" ? adminItems : memberItems;

  return (
    <Sidebar>
      <SidebarHeader className="pt-6 pb-4 px-4 border-b border-sidebar-border">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ResourceDropLogo className="w-12 h-12 text-primary shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-brand tracking-tight">{siteConfig.nameTop}</span>
              <span className="font-bold text-brand tracking-tight">{siteConfig.nameBottom}</span>
            </div>
          </Link>
          <span className="text-sm text-muted-foreground px-1">{siteConfig.tagline}</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = activeUrl === item.url || (item.url !== "/admin" && item.url !== "/dashboard" && activeUrl.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title} className="relative z-0">
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-sidebar-primary rounded-xl shadow-md z-[-1]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                    <SidebarMenuButton 
                      size="lg"
                      render={<Link href={item.url} onClick={() => setActiveUrl(item.url)} />}
                      isActive={isActive}
                      className={cn(
                        "bg-transparent hover:bg-transparent",
                        isActive && "hover:text-sidebar-primary-foreground text-sidebar-primary-foreground"
                      )}
                    >
                      <item.icon className="ml-1 relative z-10" />
                      <span className="text-nav relative z-10">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
