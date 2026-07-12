"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate reset request
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
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
          <Link href="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3 w-3" /> Back to Sign In
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a recovery link
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-6">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle className="h-12 w-12" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              If an account exists with <strong className="text-purple-400">{email}</strong>, we have sent instructions to reset your password.
            </p>
            <Link 
              href="/login" 
              className="inline-block w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 transition-all"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@university.edu"
                  className="w-full bg-secondary/30 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full rounded-xl bg-purple-600 py-3.5 text-sm font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Send Recovery Email
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
