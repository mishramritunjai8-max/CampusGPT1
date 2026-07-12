"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckSquare, 
  FileText, 
  PlusCircle, 
  MessageSquare,
  ChevronRight,
  Award,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "student" && user.role !== "admin") {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, router]);
  const [completedAssignments, setCompletedAssignments] = useState<number[]>([1]);

  const toggleAssignment = (id: number) => {
    setCompletedAssignments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Dashboard Cards Mock Data
  const analyticsCards = [
    { title: "Cumulative GPA", value: "3.85", sub: "Top 5% of class", progress: 96, color: "text-purple-400", barColor: "bg-purple-500" },
    { title: "Attendance Rate", value: "98.2%", sub: "1 excused absence", progress: 98, color: "text-emerald-400", barColor: "bg-emerald-500" },
    { title: "Completed Credits", value: "84 / 120", sub: "Junior status", progress: 70, color: "text-blue-400", barColor: "bg-blue-500" },
    { title: "Exam Countdown", value: "2 Days", sub: "CS301 Neural Networks", progress: 20, color: "text-rose-400", barColor: "bg-rose-500" }
  ];

  const upcomingClasses = [
    { code: "CS101", name: "Intro to Computer Science", time: "10:00 AM", room: "Turing Hall, 204", professor: "Alan Turing" },
    { code: "CS301", name: "AI & Neural Networks", time: "1:00 PM", room: "Lovelace Lab, 102", professor: "Alan Turing" }
  ];

  const assignments = [
    { id: 1, title: "Implement backpropagation", course: "CS301", due: "Tonight, 11:59 PM", urgency: "high" },
    { id: 2, title: "Calculus Series convergence", course: "MATH201", due: "Tomorrow", urgency: "medium" },
    { id: 3, title: "Draft course project outline", course: "CS101", due: "July 12", urgency: "low" }
  ];

  const recentNotes = [
    { title: "Recursion Stack Outline", course: "CS101", date: "Jul 7", content: "Stack frames, base cases, memory heaps overview." },
    { title: "Backprop Weight Derivations", course: "CS301", date: "Jul 6", content: "Chain rule application, gradient descent formulas." }
  ];

  const recentChats = [
    { id: "demo-chat-session-id", title: "CS101 Homework Help", lastMsg: "Recursion is a programming technique..." },
    { id: "chat-2", title: "Syllabus details for CS301", lastMsg: "Week 3 covers transformers and LLMs..." }
  ];

  const activities = [
    { action: "Syllabus updated", detail: "CS301 syllabus edited by Alan Turing", time: "2h ago" },
    { action: "Grade uploaded", detail: "Calculus Quiz 4 grade sync: A", time: "4h ago" },
    { action: "AI Query made", detail: "Generated notes for Python stack frames", time: "1d ago" }
  ];

  // Calendar Highlighted Dates
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const classDays = [2, 4, 7, 9, 14, 16, 21, 23, 28, 30]; // Mon/Wed
  const examDays = [10];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Student Workstation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track metrics, schedule study sessions, and review AI summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard/chat" 
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/10 flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" /> Study with CampusGPT AI
          </Link>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="p-5 rounded-2xl glass-panel border border-border flex flex-col justify-between h-36"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.title}</span>
              <Award className={`h-4.5 w-4.5 ${card.color}`} />
            </div>
            <div className="mt-2 space-y-1">
              <h3 className={`text-2xl font-black text-white`}>{card.value}</h3>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </div>
            <div className="w-full bg-secondary/65 h-1.5 rounded-full overflow-hidden mt-4">
              <div className={`${card.barColor} h-full`} style={{ width: `${card.progress}%` }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Main Sections */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column widgets */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Upcoming Classes */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" /> Today's Class Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingClasses.map((cls, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-secondary/25 border border-border/40 hover:bg-secondary/40 transition-all flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      {cls.code}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{cls.time}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{cls.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Prof. {cls.professor} • {cls.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart - Premium Custom SVG */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" /> GPA Progression Trend
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                +4.2% Semester Gain
              </span>
            </div>
            
            {/* SVG Line Chart */}
            <div className="h-48 w-full relative pt-4">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal gridlines */}
                <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Fill area */}
                <path
                  d="M0,112.5 Q100,90 125,75 T250,56.25 T375,37.5 T500,20 L500,150 L0,150 Z"
                  fill="url(#chartGradient)"
                />
                {/* Chart line */}
                <path
                  d="M0,112.5 Q100,90 125,75 T250,56.25 T375,37.5 T500,20"
                  fill="none"
                  stroke="rgb(168, 85, 247)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Chart points */}
                <circle cx="125" cy="75" r="4.5" fill="rgb(168, 85, 247)" stroke="black" strokeWidth="1.5" />
                <circle cx="250" cy="56.25" r="4.5" fill="rgb(168, 85, 247)" stroke="black" strokeWidth="1.5" />
                <circle cx="375" cy="37.5" r="4.5" fill="rgb(168, 85, 247)" stroke="black" strokeWidth="1.5" />
                <circle cx="500" cy="20" r="4.5" fill="white" stroke="rgb(168, 85, 247)" strokeWidth="2" />
              </svg>
              
              {/* Chart labels */}
              <div className="flex justify-between text-[9px] text-muted-foreground mt-2 font-mono uppercase">
                <span>Freshman Fall</span>
                <span>Freshman Spring</span>
                <span>Sophomore Fall</span>
                <span>Sophomore Spring</span>
                <span>Junior Fall</span>
              </div>
            </div>
          </div>

          {/* Recent AI Chats */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" /> Recent AI Tutor Conversations
            </h3>
            <div className="space-y-2">
              {recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  href="/dashboard/chat"
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-border/30 transition-all text-xs group"
                >
                  <div className="space-y-0.5 truncate pr-4">
                    <span className="font-bold text-white block truncate">{chat.title}</span>
                    <p className="text-muted-foreground truncate">{chat.lastMsg}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column widgets */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Quick Actions */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground">Quick Academic Tasks</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link href="/dashboard/chat" className="p-3 rounded-xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-400 text-center flex flex-col items-center gap-1.5 transition-colors">
                <Sparkles className="h-4.5 w-4.5" /> Ask Tutor
              </Link>
              <button className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-center flex flex-col items-center gap-1.5 transition-colors">
                <FileText className="h-4.5 w-4.5" /> Notes Wiki
              </button>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-purple-400" /> July 2026
              </span>
              <span className="text-[10px] text-muted-foreground">Summer Term</span>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
              {/* Day headers */}
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="font-bold text-muted-foreground uppercase">{d}</span>
              ))}
              
              {/* Dates */}
              {daysInMonth.map((day) => {
                const isClass = classDays.includes(day);
                const isExam = examDays.includes(day);
                return (
                  <span
                    key={day}
                    className={`py-1.5 rounded-lg font-mono relative flex items-center justify-center ${
                      isExam
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold"
                        : isClass
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                          : "hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    {day}
                    {/* Small dots */}
                    {isClass && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-purple-500" />}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Assignments Checklist */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-purple-400" /> Deliverables Checklist
            </h3>
            <div className="space-y-3">
              {assignments.map((item) => {
                const completed = completedAssignments.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleAssignment(item.id)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/15 hover:bg-secondary/35 border border-border/30 transition-all cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={completed}
                      readOnly
                      className="mt-0.5 h-4 w-4 rounded border-border text-purple-600 focus:ring-purple-500 focus:ring-opacity-25"
                    />
                    <div className="space-y-0.5">
                      <span className={`font-semibold text-white block ${completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.title}
                      </span>
                      <div className="flex gap-2 items-center text-[10px] text-muted-foreground mt-1">
                        <span className="bg-secondary px-1.5 py-0.5 rounded font-mono font-bold text-foreground">{item.course}</span>
                        <span>Due {item.due}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Notes summaries */}
          <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" /> Recent AI Syllabus Outlines
            </h3>
            <div className="space-y-3">
              {recentNotes.map((note, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-secondary/15 border border-border/30 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white truncate pr-2">{note.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{note.date}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed truncate">{note.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
