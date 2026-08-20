import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { HeaderActions } from "@/components/header-actions";

import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4 lg:px-6">
          <SidebarTrigger className="shrink-0" />
          <HeaderActions session={session} />
        </header>
        <div className="flex-1 w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
