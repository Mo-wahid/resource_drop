"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function RequestsViewToggle({ view }: { view: "pending" | "all" }) {
  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 w-fit rounded-lg border relative">
      <Link 
        href="/admin/requests" 
        className={cn(
          "relative z-10 h-8 rounded-md px-4 text-xs flex items-center justify-center font-semibold transition-colors duration-300",
          view === "pending" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Pending Requests
        {view === "pending" && (
          <motion.div
            layoutId="requests-toggle-indicator"
            className="absolute inset-0 bg-primary shadow-sm rounded-md -z-10"
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}
      </Link>
      
      <Link 
        href="/admin/requests?view=all" 
        className={cn(
          "relative z-10 h-8 rounded-md px-4 text-xs flex items-center justify-center font-semibold transition-colors duration-300",
          view === "all" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        All Requests
        {view === "all" && (
          <motion.div
            layoutId="requests-toggle-indicator"
            className="absolute inset-0 bg-primary shadow-sm rounded-md -z-10"
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}
      </Link>
    </div>
  );
}
