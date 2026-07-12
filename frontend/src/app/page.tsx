"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  GraduationCap, 
  Shield, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  ArrowRight, 
  CheckCircle,
  Users,
  Terminal,
  BookOpen
} from "lucide-react";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
      title: "Context-Aware AI Tutor",
      description: "Chat with an assistant that knows your courses, syllabus, and assignment due dates. Get personalized help 24/7."
    },
    {
      icon: <Calendar className="h-6 w-6 text-blue-500" />,
      title: "Smart Course Hub",
      description: "Keep track of upcoming classes, exams, and attendance in real-time. Syncs directly with faculty rosters."
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-emerald-500" />,
      title: "Faculty Syllabus Builder",
      description: "Generates custom lecture outlines, weekly quizzes, and course material drafts with deep learning models."
    },
    {
      icon: <Shield className="h-6 w-6 text-orange-500" />,
      title: "Role-Based Security",
      description: "Strict PostgreSQL Row Level Security policies ensure students, faculty, and admins only see what they own."
    }
  ];

  const testimonials = [
    {
      name: "Sophia Carter",
      role: "Computer Science Senior",
      avatar: "SC",
      quote: "CampusGPT is like having a private tutor and personal organizer in one place. My grades improved, and I stay on top of all deadlines."
    },
    {
      name: "Dr. Marcus Vance",
      role: "Associate Professor of Physics",
      avatar: "MV",
      quote: "The automatic quiz writer and syllabus drafts save me hours of prep every week. I can focus on actual teaching and research."
    },
    {
      name: "Chief Technology Officer",
      role: "State University Systems",
      avatar: "CIO",
      quote: "Enterprise security and simple Supabase authentication. Easy implementation, minimal overhead, and extremely high student adoption."
    }
  ];

  const faqs = [
    {
      question: "Is CampusGPT private and secure?",
      answer: "Yes, absolutely. CampusGPT utilizes row-level security (RLS) on PostgreSQL. Your personal information, grades, and chats are encrypted and accessible only by you and verified university portals."
    },
    {
      question: "Can I connect it to my university systems?",
      answer: "We support integrations with Canvas, Blackboard, and Banner. Faculty and admins can sync rosters and syllabi via standard API gateways."
    },
    {
      question: "What AI models does the assistant run on?",
      answer: "CampusGPT operates on a hybrid AI system: a local offline Ollama provider (llama3.2) for secure/cost-effective use, and API support for Google Gemini and OpenAI GPT models."
    },
    {
      question: "How do roles work?",
      answer: "When logging in, your role (Student, Faculty, or Admin) determines your dashboard layout, capabilities, and data access level."
    }
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
      {/* Dynamic Purple/Indigo Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 font-bold text-white shadow-lg shadow-purple-600/30">
                C
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                CampusGPT
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {user ? (
                <Link 
                  href={`/dashboard/${user.role}`}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Enter Portal
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    Sign In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-secondary text-foreground"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-border bg-background px-4 py-4 space-y-3"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Features</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Testimonials</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">FAQ</a>
              <div className="pt-4 flex flex-col gap-2">
                {user ? (
                  <Link 
                    href={`/dashboard/${user.role}`}
                    className="w-full text-center rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Enter Portal
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center rounded-lg border border-border py-2 text-sm font-semibold text-foreground">
                      Sign In
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full text-center rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-purple-400 mb-8"
        >
          <Sparkles className="h-4 w-4" /> Next-generation University AI Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6"
        >
          Your AI-powered college{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
            co-pilot
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10"
        >
          An integrated SaaS dashboard assisting students with studies, enabling faculty with grading, and helping admins manage security.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link 
            href="/signup" 
            className="rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2 group"
          >
            Create Free Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#features" 
            className="rounded-xl border border-border bg-secondary/30 px-8 py-4 text-base font-semibold text-foreground hover:bg-secondary/80 transition-all"
          >
            Explore Features
          </a>
        </motion.div>

        {/* High-Fidelity UI Screenshot Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 w-full max-w-5xl rounded-2xl glass-panel p-2 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-indigo-500/10 rounded-2xl pointer-events-none" />
          <div className="rounded-xl bg-neutral-950 overflow-hidden border border-white/5 aspect-[16/9] flex flex-col">
            {/* Window title bar */}
            <div className="h-10 bg-neutral-900 border-b border-white/5 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">dashboard/student - CampusGPT</span>
              <div className="w-12" />
            </div>
            
            {/* Inside portal mock */}
            <div className="flex-1 grid grid-cols-12 text-left">
              {/* Mock sidebar */}
              <div className="col-span-3 bg-neutral-900/50 border-r border-white/5 p-4 space-y-4 hidden sm:block">
                <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                  <Sparkles className="h-4 w-4" /> CampusGPT Portal
                </div>
                <div className="space-y-1 pt-4">
                  <div className="bg-white/5 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Dashboard
                  </div>
                  <div className="text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> AI Chat
                  </div>
                  <div className="text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Class Schedule
                  </div>
                </div>
              </div>
              
              {/* Mock content panel */}
              <div className="col-span-12 sm:col-span-9 p-6 space-y-6 bg-black">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Welcome back, Alice Smith</h3>
                    <p className="text-xs text-muted-foreground">Major: Computer Science | GPA: 3.85</p>
                  </div>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                    Student Role
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cumulative GPA</span>
                    <h4 className="text-2xl font-black text-purple-400">3.85</h4>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full w-[96%]" />
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Attendance Rate</span>
                    <h4 className="text-2xl font-black text-emerald-400">98.2%</h4>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[98%]" />
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Exam</span>
                    <h4 className="text-sm font-bold text-white truncate">CS301 Neural Nets</h4>
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                      In 2 days
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" /> Ask Assistant: CS301 Study Planner
                  </h4>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs text-muted-foreground italic">
                    "Alice, here is your study schedule for Neural Networks exam: Focus on backpropagation formulas, LSTM weights configurations, and transformer attention matrix computations..."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Powerful features built for academia
          </h2>
          <p className="text-muted-foreground text-lg">
            CampusGPT combines smart natural language models with a structured database framework to empower everyone on campus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl glass-panel flex gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/50 border border-border">
                {feat.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Loved by students and professors alike
          </h2>
          <p className="text-muted-foreground text-lg">
            See how CampusGPT is transforming college operations and making study workflows ten times faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-border bg-secondary/10 flex flex-col justify-between">
              <p className="text-muted-foreground text-sm italic mb-6 leading-relaxed">
                "{test.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{test.name}</h4>
                  <p className="text-xs text-muted-foreground">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-border rounded-xl overflow-hidden bg-secondary/5">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-foreground hover:bg-secondary/10 transition-colors"
              >
                <span>{faq.question}</span>
                <span className="text-xl text-muted-foreground">{activeFaq === idx ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border bg-secondary/10"
                  >
                    <p className="p-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-neutral-950 py-12 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 font-bold text-white">
              C
            </div>
            <span className="font-bold text-white tracking-tight">CampusGPT</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CampusGPT Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
