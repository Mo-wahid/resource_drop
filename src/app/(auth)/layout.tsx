import React from "react";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative auth-bg flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 overflow-hidden select-none">
      <main className="relative z-10 w-full max-w-md flex flex-col items-center justify-center my-auto">
        {children}
      </main>
      <footer className="relative z-10 mt-8 text-center text-xs text-slate-500 tracking-wide">
        © 2026 {siteConfig.nameFull.toLowerCase()} - Musketeer Developers
      </footer>
    </div>
  );
}
