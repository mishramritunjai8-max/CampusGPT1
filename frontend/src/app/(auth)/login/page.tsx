"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Shield, Key, Mail, Sparkles } from "lucide-react";

const loginSchema = zod.object({
  email: zod.string().email({ message: "Please enter a valid email address." }),
  password: zod.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  
  const [selectedRole, setSelectedRole] = useState<"student" | "faculty" | "admin">("student");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Login with selected role as hint (for fallback mode)
      const profile = await login(values.email, values.password, selectedRole);
      
      // Determine redirect path based on user role if no specific redirect param was passed
      const destination = redirect || `/dashboard/${profile.role}`;
      router.push(destination);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Simulate/Trigger Google Login
      // For fallback or test purposes: we sign in as student/faculty based on choice
      const email = `${selectedRole}@google.com`;
      const profile = await login(email, "google-sso-bypass", selectedRole);
      router.push(redirect || `/dashboard/${profile.role}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Google Login failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-border"
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 font-bold text-white shadow-lg shadow-purple-600/30">
            C
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            CampusGPT Portal
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to access your customized dashboard
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setSelectedRole("student")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              selectedRole === "student"
                ? "bg-purple-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("faculty")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              selectedRole === "faculty"
                ? "bg-purple-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("admin")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              selectedRole === "admin"
                ? "bg-purple-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="email-input"
                  aria-label="Email Address"
                  disabled={isSubmitting}
                  placeholder={
                    selectedRole === "student" 
                      ? "student1@campusgpt.edu" 
                      : selectedRole === "faculty" 
                        ? "faculty1@campusgpt.edu" 
                        : "admin@campusgpt.edu"
                  }
                  {...register("email")}
                  className="w-full bg-secondary/30 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  id="password-input"
                  aria-label="Password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full bg-secondary/30 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            aria-label={`Sign In as ${selectedRole}`}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-purple-600 py-3.5 text-sm font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-muted-foreground uppercase">Or Continue With</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {/* SSO Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-border bg-secondary/30 py-3 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-all flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          Sign In with Google
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-purple-400 hover:text-purple-300">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
