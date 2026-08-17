import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  href,
  className,
}: StatCardProps) {
  const content = (
    <Card className={cn("transition-all duration-200 hover:border-foreground/20 hover:shadow-xs", href && "cursor-pointer", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="p-2 rounded-lg bg-muted/60 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
