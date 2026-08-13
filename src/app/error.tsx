"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global Error Caught:", error);
  }, [error]);

  const isDatabaseError = 
    error.message.includes("Can't reach database server") ||
    error.message.includes("database is not running") ||
    error.message.includes("PrismaClientInitializationError") ||
    error.message.includes("ECONNREFUSED");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-zinc-900/50 p-8 ring-1 ring-white/10 backdrop-blur-md text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isDatabaseError ? "Database Offline" : "Something went wrong"}
          </h1>
          <p className="text-sm text-zinc-400">
            {isDatabaseError 
              ? "We couldn't connect to the database. If you are running this locally, please ensure Docker and the database container are running."
              : "An unexpected error occurred while processing your request. Please try again."}
          </p>
        </div>

        <div className="pt-4">
          <Button onClick={() => reset()} className="w-full">
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
