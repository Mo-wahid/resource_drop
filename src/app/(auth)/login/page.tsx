"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from "lucide-react";

import { loginSchema, LoginInput } from "@/lib/validation/auth";
import { loginAction } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResourceDropLogo } from "@/components/icons/resource-drop-logo";
import { siteConfig } from "@/config/site";

function LoginContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    const result = await loginAction(data);

    if (result.error) {
      setServerError(result.error);
    } else if (result.success) {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
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

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full"
      >
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-8 pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {/* Server Error */}
              <AnimatePresence mode="wait">
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{serverError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@resourcedrop.local"
                    autoComplete="email"
                    disabled={isSubmitting}
                    className="h-11 pl-10 rounded-xl bg-muted/50"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="h-11 pl-10 pr-10 rounded-xl bg-muted/50"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl mt-1 text-sm font-medium">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
