"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { requestPasswordReset } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResourceDropLogo } from "@/components/icons/resource-drop-logo";
import { siteConfig } from "@/config/site";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    await requestPasswordReset(formData);
    
    // Always show success regardless of the outcome to prevent email enumeration
    setIsSubmitting(false);
    setIsSuccess(true);
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
          Password Recovery
        </p>
      </motion.div>

      {/* Reset Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full"
      >
        <Card className="rounded-card shadow-lg">
          <CardContent className="p-8 pt-8">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center space-y-4 py-4"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <CheckCircle2 className="size-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Check your email</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If an account with that email exists, we've sent a password reset link. Please check your inbox (and spam folder).
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 h-11"
                    onClick={() => router.push("/login")}
                  >
                    Return to login
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <form onSubmit={onSubmit} className="flex flex-col gap-5">
                    <div className="space-y-1.5 text-center mb-2">
                      <p className="text-sm text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    {/* Email Field */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="email" className="text-sm font-semibold" required>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="admin@resourcedrop.local"
                          autoComplete="email"
                          disabled={isSubmitting}
                          className="h-11 pl-10 rounded-input bg-muted/50"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button variant="auth" type="submit" disabled={isSubmitting} className="w-full h-11 rounded-input mt-2 text-sm font-medium">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>

                    <div className="text-center mt-2">
                      <Link 
                        href="/login" 
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="mr-2 size-4" />
                        Back to login
                      </Link>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
