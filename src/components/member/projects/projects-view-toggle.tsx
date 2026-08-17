"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function MemberProjectsViewToggle({ view }: { view: "active" | "inactive" }) {
  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 w-fit rounded-lg border relative">
      <Link 
        href="/projects" 
        className={cn(
          "relative z-10 h-8 rounded-md px-4 text-xs flex items-center justify-center font-semibold transition-colors duration-300",
          view === "active" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Active Projects
        {view === "active" && (
          <motion.div
            layoutId="member-projects-toggle-indicator"
            className="absolute inset-0 bg-primary shadow-sm rounded-md -z-10"
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}
      </Link>
      
      <Link 
        href="/projects?view=inactive" 
        className={cn(
          "relative z-10 h-8 rounded-md px-4 text-xs flex items-center justify-center font-semibold transition-colors duration-300",
          view === "inactive" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Inactive Projects
        {view === "inactive" && (
          <motion.div
            layoutId="member-projects-toggle-indicator"
            className="absolute inset-0 bg-primary shadow-sm rounded-md -z-10"
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}
      </Link>
    </div>
  );
}
