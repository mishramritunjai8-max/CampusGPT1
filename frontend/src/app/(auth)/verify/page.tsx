"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center space-y-6 glass-panel p-8 rounded-2xl border border-border"
      >
        <div className="flex justify-center text-emerald-400">
          <CheckCircle className="h-14 w-14" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Verify Email
          </h2>
          <p className="text-sm text-muted-foreground">
            We have sent a verification code to your academic inbox
          </p>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed px-4">
          Please click the link in your email to complete registration. If you didn't receive it, check your spam folder or resend.
        </p>
        <div className="space-y-3 pt-4">
          <Link 
            href="/login" 
            className="block w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20"
          >
            Go to Login
          </Link>
          <button 
            type="button"
            className="w-full text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Resend Email
          </button>
        </div>
      </motion.div>
    </div>
  );
}
