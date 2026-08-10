import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { HeaderActions } from "@/components/header-actions";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <main className="w-full flex-1 flex flex-col min-h-screen bg-background text-foreground">
        <div className="flex h-12 shrink-0 items-center gap-4 border-b px-4 lg:px-6">
          <SidebarTrigger className="shrink-0" />
          <HeaderActions session={session} />
        </div>
        <div className="w-full max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
