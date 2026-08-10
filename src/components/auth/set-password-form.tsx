"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteSchema, type AcceptInviteInput } from "@/lib/validation/invite";
import { acceptInvitation } from "@/app/(auth)/register/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function SetPasswordForm({ rawToken, email }: { rawToken: string; email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      username: email.split("@")[0], // Pre-fill with email prefix
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: AcceptInviteInput) => {
    setServerError(null);
    startTransition(async () => {
      // 1. Accept the invitation
      const res = await acceptInvitation(rawToken, data.username, data.password, data.confirmPassword);
      if (res.error) {
        if (res.fieldErrors) {
          if (res.fieldErrors.username) setFormError("username", { message: res.fieldErrors.username[0] });
          if (res.fieldErrors.password) setFormError("password", { message: res.fieldErrors.password[0] });
          if (res.fieldErrors.confirmPassword) setFormError("confirmPassword", { message: res.fieldErrors.confirmPassword[0] });
        } else {
          setServerError(res.error);
        }
        return;
      }

      // 2. Show success state and redirect to login
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="size-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Account Activated!</h3>
        <p className="text-sm text-muted-foreground">
          Your account is ready. Redirecting you to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="space-y-1 mb-2">
        <p className="text-sm font-medium">Welcome to the team!</p>
        <p className="text-xs text-muted-foreground">Choose a username and set a secure password to activate your account.</p>
      </div>

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

      {/* Username Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="username"
            placeholder="johndoe"
            disabled={isPending || isSubmitting}
            className="h-11 pl-10 rounded-input bg-muted/50"
            aria-invalid={!!errors.username}
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p className="text-tiny text-destructive">{errors.username.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending || isSubmitting}
            className="h-11 pl-10 pr-10 rounded-input bg-muted/50"
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
          <p className="text-tiny text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending || isSubmitting}
            className="h-11 pl-10 pr-10 rounded-input bg-muted/50"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-tiny text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending || isSubmitting} className="w-full h-11 rounded-input mt-2 text-sm font-medium">
        {(isPending || isSubmitting) ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Activating...
          </>
        ) : (
          "Activate Account"
        )}
      </Button>
    </form>
  );
}
