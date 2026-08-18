"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ResourceDropLogo } from "@/components/icons/resource-drop-logo";
import { siteConfig } from "@/config/site";

export default function NotFoundPage() {
  return (
    <div className="relative auth-bg flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 overflow-hidden select-none">
      <main className="relative z-10 w-full max-w-md flex flex-col items-center justify-center my-auto">
        
        {/* Logo + Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center mb-10 text-center"
        >
          <ResourceDropLogo className="w-15 h-15 mb-4" />
          <h1 className="text-3xl text-white tracking-tight">
            <span className="font-light capitalize">{siteConfig.nameTop.toLowerCase()}</span><span className="font-bold capitalize">{siteConfig.nameBottom.toLowerCase()}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            {siteConfig.tagline}
          </p>
        </motion.div>

        {/* 404 Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="w-full"
        >
          <Card className="rounded-card shadow-lg">
            <CardContent className="p-8 flex flex-col items-center text-center gap-5">
              <div className="rounded-full bg-muted/50 p-4">
                <SearchX className="size-10 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">Page Not Found</h2>
                <p className="text-sm text-muted-foreground">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>

              <Link href="/" className={buttonVariants({ variant: "auth", className: "w-full h-11 rounded-input mt-2 text-sm font-medium" })}>
                <ArrowLeft className="mr-2 size-4" />
                Back to safety
              </Link>
            </CardContent>
          </Card>
        </motion.div>

      </main>
      <footer className="relative z-10 mt-8 text-center text-xs text-slate-500 tracking-wide">
        © 2026 {siteConfig.nameFull.toLowerCase()} - Musketeer Developers
      </footer>
    </div>
  );
}
