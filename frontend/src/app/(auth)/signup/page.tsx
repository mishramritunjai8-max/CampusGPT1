"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { Mail, Key, User, Sparkles, BookOpen, GraduationCap } from "lucide-react";

const signupSchema = zod.object({
  fullName: zod.string().min(2, { message: "Name must be at least 2 characters." }),
  email: zod.string().email({ message: "Please enter a valid email address." }),
  password: zod.string().min(6, { message: "Password must be at least 6 characters." }),
  role: zod.enum(["student", "faculty"]),
});

type SignupFormValues = zod.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "student",
    }
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await signup(values.email, values.password, values.fullName, values.role);
      
      setSuccessMessage("Account created successfully! Check your email to verify your registration.");
      setTimeout(() => {
        // Redirect to login page or directly dashboard
        router.push(`/dashboard/${values.role}`);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Sign up failed. Please check registration fields.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
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
            Create Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Join CampusGPT and start boosting your productivity
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  id="fullname-input"
                  aria-label="Full Name"
                  disabled={isSubmitting}
                  placeholder="Alice Smith"
                  {...register("fullName")}
                  className="w-full bg-secondary/30 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
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
                  placeholder="alice@university.edu"
                  {...register("email")}
                  className="w-full bg-secondary/30 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
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

            {/* Role Radio Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">I am registering as a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="role-student-button"
                  aria-label="Register as Student"
                  onClick={() => setValue("role", "student")}
                  className={`py-3 px-4 border rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    selectedRole === "student"
                      ? "bg-purple-600/10 border-purple-500 text-purple-400"
                      : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Student
                </button>
                <button
                  type="button"
                  id="role-faculty-button"
                  aria-label="Register as Faculty Member"
                  onClick={() => setValue("role", "faculty")}
                  className={`py-3 px-4 border rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    selectedRole === "faculty"
                      ? "bg-purple-600/10 border-purple-500 text-purple-400"
                      : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Faculty
                </button>
              </div>
              {errors.role && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.role.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            id="signup-submit-button"
            aria-label="Create Free Account"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-purple-600 py-3.5 text-sm font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Create Free Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
