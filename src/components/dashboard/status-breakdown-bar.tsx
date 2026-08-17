"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatusItem {
  key: string;
  label: string;
  count: number;
  colorClass: string; // e.g. "bg-amber-500", "bg-blue-500"
  badgeClass?: string; // e.g. "text-amber-500 bg-amber-500/10 border-amber-500/20"
}

interface StatusBreakdownBarProps {
  title: string;
  description?: string;
  items: StatusItem[];
  className?: string;
}

export function StatusBreakdownBar({
  title,
  description,
  items,
  className,
}: StatusBreakdownBarProps) {
  const total = items.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card className={cn("flex flex-col justify-between pt-0 pb-3", className)}>
      <CardHeader className="py-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            Total: <span className="text-foreground font-bold">{total}</span>
          </span>
        </div>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar Strip */}
        <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          {total === 0 ? (
            <div className="w-full h-full bg-muted rounded-full" />
          ) : (
            items
              .filter((item) => item.count > 0)
              .map((item) => {
                const percentage = (item.count / total) * 100;
                return (
                  <div
                    key={item.key}
                    title={`${item.label}: ${item.count} (${percentage.toFixed(1)}%)`}
                    style={{ width: `${percentage}%` }}
                    className={cn(
                      "h-full rounded-xs transition-all duration-500 hover:opacity-85",
                      item.colorClass
                    )}
                  />
                );
              })
          )}
        </div>

        {/* Legend Grid */}
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item) => {
            return (
              <div
                key={item.key}
                className="flex items-center gap-2 p-2 px-2.5 rounded-md bg-muted/30 border border-border/50 text-xs grow sm:grow-0"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("size-2 rounded-full shrink-0", item.colorClass)} />
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="font-semibold text-foreground">{item.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
