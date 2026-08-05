import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
      <div className="max-w-4xl w-full flex flex-col items-center text-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the ResourceDrop Admin Control Panel. You have been correctly routed based on your ADMIN role.
          </p>
        </div>
        
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button variant="outline" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
