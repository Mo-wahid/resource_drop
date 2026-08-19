import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Activity, ShieldCheck, UserCheck, FolderPlus, KeyRound, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  createdAt: Date;
  details: any;
  actor: {
    username: string;
    email: string;
  } | null;
}

export function RecentActivityList({ entries }: { entries: AuditEntry[] }) {
  const getActionIcon = (action: string) => {
    if (action.includes("USER") || action.includes("AUTH") || action.includes("LOGIN")) return UserCheck;
    if (action.includes("PROJECT")) return FolderPlus;
    if (action.includes("KEY") || action.includes("RESOURCE")) return KeyRound;
    if (action.includes("REQUEST")) return Layers;
    return Activity;
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD") || action.includes("PROVISION")) {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("REJECT") || action.includes("REVOKE")) {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    if (action.includes("UPDATE") || action.includes("SYNC") || action.includes("ACCEPT")) {
      return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className="py-0">
      <div>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div>
            <CardTitle className="text-base font-semibold">System Audit Activity</CardTitle>
            <CardDescription className="text-xs">Recent administrative and member actions</CardDescription>
          </div>
          <Link href="/admin/audit-log">
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground">
              Audit Logs
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <ShieldCheck className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No activity recorded</p>
              <p className="text-xs text-muted-foreground">Audit actions will appear here in real-time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {entries.map((entry) => {
                const Icon = getActionIcon(entry.action);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 px-4 text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground shrink-0">
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">{entry.actor?.username || "System"}</span>
                          <Badge
                            variant="outline"
                            className={`rounded-xs text-[10px] px-1.5 py-0 uppercase font-semibold ${getActionBadgeColor(
                              entry.action
                            )}`}
                          >
                            {entry.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {entry.details && typeof entry.details === "object" && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                            {JSON.stringify(entry.details).replace(/["{}]/g, "")}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground shrink-0" suppressHydrationWarning>
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
