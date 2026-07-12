"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, CheckCircle2, Clock, Target, Flame,
  Sparkles, Plus, Trash2, Play, Square, Search,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  BookOpen, Calendar, TrendingUp, ListTodo, BarChart3,
  Sun, Moon, Timer, Pause,
} from "lucide-react";
import * as api from "@/lib/api";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-green-500/10 text-green-400 border-green-500/20",
};

const PRIORITY_BG: Record<string, string> = {
  high: "from-red-500 to-rose-600",
  medium: "from-amber-500 to-orange-600",
  low: "from-green-500 to-emerald-600",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-400",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function StudyPlannerPage() {
  const { user } = useAuth();

  // ─── Tab state ──────────────────────────────────────────
  const [tab, setTab] = useState<"dashboard" | "plans" | "tasks" | "timer">("dashboard");

  // ─── Dashboard ───────────────────────────────────────────
  const [analytics, setAnalytics] = useState<api.StudyAnalytics | null>(null);
  const [streak, setStreak] = useState<api.StudyStreakInfo | null>(null);
  const [recentTasks, setRecentTasks] = useState<api.StudyTaskInfo[]>([]);

  // ─── Plans ───────────────────────────────────────────────
  const [plans, setPlans] = useState<api.StudyPlanInfo[]>([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planSemester, setPlanSemester] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [planSubjects, setPlanSubjects] = useState("");
  const [planEditId, setPlanEditId] = useState<string | null>(null);

  // ─── AI Plan ─────────────────────────────────────────────
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiSubjects, setAiSubjects] = useState("");
  const [aiSemester, setAiSemester] = useState("");
  const [aiStart, setAiStart] = useState("");
  const [aiEnd, setAiEnd] = useState("");
  const [aiHours, setAiHours] = useState(4);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // ─── Tasks ───────────────────────────────────────────────
  const [tasks, setTasks] = useState<api.StudyTaskInfo[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>("");
  const [taskPlanFilter, setTaskPlanFilter] = useState<string>("");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDue, setTaskDue] = useState("");
  const [taskMinutes, setTaskMinutes] = useState(30);
  const [taskPlanId, setTaskPlanId] = useState("");
  const [taskDeleteId, setTaskDeleteId] = useState<string | null>(null);

  // ─── Pomodoro ────────────────────────────────────────────
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timerSubject, setTimerSubject] = useState("");
  const [timerTaskId, setTimerTaskId] = useState("");
  const [sessions, setSessions] = useState<api.StudySessionInfo[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Calendar ────────────────────────────────────────────
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calendarTasks, setCalendarTasks] = useState<{ id: string; title: string; subject: string; priority: string; status: string; day: number | null }[]>([]);

  // ─── Load ────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      const [a, s, t] = await Promise.all([
        api.getPlannerAnalytics(),
        api.getStreak(),
        api.listTasks().then(ts => ts.slice(0, 5)),
      ]);
      setAnalytics(a);
      setStreak(s);
      setRecentTasks(t);
    } catch { /* ignore */ }
  }, []);

  const loadPlans = useCallback(async () => {
    try { setPlans(await api.listPlans()); } catch { /* ignore */ }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setTasks(await api.listTasks(taskFilter || undefined, taskPlanFilter || undefined));
    } catch { /* ignore */ }
  }, [taskFilter, taskPlanFilter]);

  const loadSessions = useCallback(async () => {
    try { setSessions(await api.listSessions()); } catch { /* ignore */ }
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      const data = await api.getPlannerCalendar(calYear, calMonth + 1);
      setCalendarTasks(data.tasks);
    } catch { /* ignore */ }
  }, [calYear, calMonth]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { loadCalendar(); }, [loadCalendar]);
  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ─── Plan CRUD ──────────────────────────────────────────
  async function handleSavePlan() {
    const subjects = planSubjects.split(",").map(s => s.trim()).filter(Boolean);
    if (planEditId) {
      await api.updatePlan(planEditId, { title: planTitle, semester: planSemester, start_date: planStart, end_date: planEnd, subjects });
    } else {
      await api.createPlan({ title: planTitle, semester: planSemester, start_date: planStart, end_date: planEnd, subjects });
    }
    resetPlanForm();
    await loadPlans();
  }

  function editPlan(p: api.StudyPlanInfo) {
    setPlanTitle(p.title);
    setPlanSemester(p.semester || "");
    setPlanStart(p.start_date ? p.start_date.split("T")[0] : "");
    setPlanEnd(p.end_date ? p.end_date.split("T")[0] : "");
    setPlanSubjects(p.subjects.join(", "));
    setPlanEditId(p.id);
    setShowCreatePlan(true);
  }

  function resetPlanForm() {
    setShowCreatePlan(false);
    setPlanTitle("");
    setPlanSemester("");
    setPlanStart("");
    setPlanEnd("");
    setPlanSubjects("");
    setPlanEditId(null);
  }

  // ─── AI Plan ─────────────────────────────────────────────
  async function handleAiGenerate() {
    setAiGenerating(true);
    setAiResult(null);
    try {
      const res = await api.generateAIStudyPlan({
        subjects: aiSubjects.split(",").map(s => s.trim()).filter(Boolean),
        semester: aiSemester || undefined,
        start_date: aiStart,
        end_date: aiEnd,
        hours_per_day: aiHours,
      });
      setAiResult(`Plan "${res.title}" created with ${res.tasks_created} tasks.`);
      await loadPlans();
      await loadTasks();
    } catch (e: any) {
      setAiResult(`Error: ${e.message}`);
    }
    setAiGenerating(false);
  }

  // ─── Task CRUD ──────────────────────────────────────────
  async function handleSaveTask() {
    await api.createTask({
      plan_id: taskPlanId || undefined,
      subject: taskSubject,
      title: taskTitle,
      description: taskDesc || undefined,
      priority: taskPriority,
      due_date: taskDue || undefined,
      estimated_minutes: taskMinutes,
    });
    resetTaskForm();
    await loadTasks();
    await loadDashboard();
  }

  function resetTaskForm() {
    setShowCreateTask(false);
    setTaskTitle("");
    setTaskSubject("");
    setTaskDesc("");
    setTaskPriority("medium");
    setTaskDue("");
    setTaskMinutes(30);
    setTaskPlanId("");
  }

  async function handleToggleTask(t: api.StudyTaskInfo) {
    const newStatus = t.status === "completed" ? "pending" : "completed";
    await api.updateTask(t.id, { status: newStatus });
    await loadTasks();
    await loadDashboard();
  }

  async function handleDeleteTask(id: string) {
    await api.deleteTask(id);
    setTaskDeleteId(null);
    await loadTasks();
    await loadDashboard();
  }

  // ─── Pomodoro ────────────────────────────────────────────
  function startTimer() {
    if (timerRunning) return;
    setTimerRunning(true);
    setTimerPaused(false);
  }

  function pauseTimer() {
    setTimerPaused(true);
  }

  function resumeTimer() {
    setTimerPaused(false);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerMode("focus");
    setTimerMinutes(25);
    setTimerSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function completeSession() {
    const elapsed = timerMode === "focus" ? 25 - timerMinutes : 0;
    if (elapsed > 0 && timerMode === "focus") {
      try {
        await api.startStudySession({
          task_id: timerTaskId || undefined,
          subject: timerSubject || undefined,
          duration_minutes: 25 - timerMinutes,
          focus_score: 80,
        });
        await loadSessions();
        await loadDashboard();
      } catch { /* ignore */ }
    }
    resetTimer();
  }

  useEffect(() => {
    if (!timerRunning || timerPaused) return;
    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev > 0) return prev - 1;
        setTimerMinutes(m => {
          if (m > 0) return m - 1;
          setTimerRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Auto-complete
          if (timerMode === "focus") {
            api.startStudySession({
              task_id: timerTaskId || undefined,
              subject: timerSubject || undefined,
              duration_minutes: 25,
              focus_score: 90,
            }).then(() => {
              loadSessions();
              loadDashboard();
            }).catch(() => {});
          }
          return 0;
        });
        return 59;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timerPaused, timerMode, timerTaskId, timerSubject, loadSessions, loadDashboard]);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();

  const taskMap = new Map<number, typeof calendarTasks>();
  calendarTasks.forEach(t => {
    if (t.day === null) return;
    if (!taskMap.has(t.day)) taskMap.set(t.day, []);
    taskMap.get(t.day)!.push(t);
  });

  // ─── Render ──────────────────────────────────────────────
  const tabTabs = [
    { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "plans", label: "Plans", icon: <BookOpen className="h-4 w-4" /> },
    { key: "tasks", label: "Tasks", icon: <ListTodo className="h-4 w-4" /> },
    { key: "timer", label: "Pomodoro", icon: <Timer className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan your studies, track progress, stay on fire 🔥</p>
        </div>
      </div>

      {/* ─── Tab Bar ────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {tabTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

            {/* Hero Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Streak", value: analytics?.current_streak ?? 0, icon: <Flame className="h-5 w-5 text-orange-400" />, sub: `Best: ${analytics?.longest_streak ?? 0}d` },
                { label: "Completion", value: analytics ? `${Math.round(analytics.completion_rate * 100)}%` : "0%", icon: <CheckCircle2 className="h-5 w-5 text-green-400" />, sub: `${analytics?.completed_tasks ?? 0}/${analytics?.total_tasks ?? 0} tasks` },
                { label: "Focus Hours", value: analytics ? `${analytics.total_focus_hours.toFixed(1)}h` : "0h", icon: <Clock className="h-5 w-5 text-blue-400" />, sub: `${analytics?.total_sessions ?? 0} sessions` },
                { label: "Study Days", value: analytics?.total_study_days ?? 0, icon: <Calendar className="h-5 w-5 text-purple-400" />, sub: "total days" },
              ].map((stat, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center">{stat.icon}</div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="text-[10px] text-muted-foreground/70">{stat.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => setTab("plans")} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/50 transition-all">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <div className="text-left">
                  <div className="text-sm font-semibold">AI Study Plan</div>
                  <div className="text-xs text-muted-foreground">Generate with AI</div>
                </div>
              </button>
              <button onClick={() => { setTab("tasks"); setShowCreateTask(true); }} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/50 transition-all">
                <Plus className="h-5 w-5 text-green-400" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Add Task</div>
                  <div className="text-xs text-muted-foreground">Quick add task</div>
                </div>
              </button>
              <button onClick={() => setTab("timer")} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/50 transition-all">
                <Timer className="h-5 w-5 text-rose-400" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Pomodoro</div>
                  <div className="text-xs text-muted-foreground">Focus session</div>
                </div>
              </button>
              <button onClick={() => setTab("plans")} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/50 transition-all">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <div className="text-left">
                  <div className="text-sm font-semibold">{plans.length} Plans</div>
                  <div className="text-xs text-muted-foreground">View all plans</div>
                </div>
              </button>
            </div>

            {/* Recent Tasks + Calendar Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><ListTodo className="h-4 w-4" /> Recent Tasks</h3>
                <div className="space-y-2">
                  {recentTasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet. Create one!</p>}
                  {recentTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20">
                      <button onClick={() => handleToggleTask(t)} className="shrink-0">
                        {t.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                          <span>{t.subject}</span>
                          {t.due_date && <span>• Due {formatDateShort(t.due_date)}</span>}
                        </div>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[t.status])}>{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak + Focus */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Weekly Focus</h3>
                <div className="space-y-2">
                  {(analytics?.weekly_data ?? []).length === 0 && <p className="text-xs text-muted-foreground">No data yet. Start studying!</p>}
                  {(analytics?.weekly_data ?? []).slice(-4).map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{w.week}</span>
                      <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (w.minutes / 60) * 20)}%` }} />
                      </div>
                      <span className="text-xs font-medium w-16 text-right">{w.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar Mini */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const td = taskMap.get(day);
                  const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                  return (
                    <div key={day} className={cn(
                      "p-1.5 rounded-lg min-h-[2.5rem] flex flex-col items-center",
                      isToday ? "bg-purple-600 text-white font-bold" : td ? "bg-secondary/40" : ""
                    )}>
                      <span>{day}</span>
                      {td && <span className="text-[8px] text-muted-foreground mt-0.5">{td.length}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "plans" && (
          <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { resetPlanForm(); setShowCreatePlan(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all">
                <Plus className="h-4 w-4" /> New Plan
              </button>
              <button onClick={() => { setShowAiForm(true); setShowCreatePlan(false); }} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all">
                <Sparkles className="h-4 w-4 text-purple-400" /> AI Generate
              </button>
            </div>

            {/* AI Form */}
            <AnimatePresence>
              {showAiForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-400" /> AI Study Plan Generator</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Subjects (comma-separated)</label>
                        <input value={aiSubjects} onChange={e => setAiSubjects(e.target.value)} placeholder="Math, Physics, Programming" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Semester</label>
                        <input value={aiSemester} onChange={e => setAiSemester(e.target.value)} placeholder="Fall 2026" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                        <input type="date" value={aiStart} onChange={e => setAiStart(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">End Date</label>
                        <input type="date" value={aiEnd} onChange={e => setAiEnd(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Hours per Day</label>
                        <input type="number" min={1} max={12} value={aiHours} onChange={e => setAiHours(Number(e.target.value))} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAiGenerate} disabled={aiGenerating || !aiSubjects || !aiStart || !aiEnd} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50">
                        {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Plan
                      </button>
                      <button onClick={() => setShowAiForm(false)} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all">Cancel</button>
                    </div>
                    {aiResult && <p className="text-xs text-muted-foreground">{aiResult}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create/Edit Plan Form */}
            <AnimatePresence>
              {showCreatePlan && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold">{planEditId ? "Edit Plan" : "New Plan"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Title</label>
                        <input value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder="Midterm Study Plan" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Semester</label>
                        <input value={planSemester} onChange={e => setPlanSemester(e.target.value)} placeholder="Fall 2026" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                        <input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">End Date</label>
                        <input type="date" value={planEnd} onChange={e => setPlanEnd(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">Subjects (comma-separated)</label>
                        <input value={planSubjects} onChange={e => setPlanSubjects(e.target.value)} placeholder="Math, Physics, Programming" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSavePlan} disabled={!planTitle} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50">
                        {planEditId ? "Update Plan" : "Create Plan"}
                      </button>
                      <button onClick={resetPlanForm} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.length === 0 && (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                  No study plans yet. Create one manually or use AI generation!
                </div>
              )}
              {plans.map((p, i) => {
                const progress = p.task_count > 0 ? (p.completed_tasks / p.task_count) * 100 : 0;
                return (
                  <motion.div
                    key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{p.title}</h3>
                        <p className="text-xs text-muted-foreground">{p.semester || "No semester"}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => editPlan(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Plus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { api.deletePlan(p.id); loadPlans(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {p.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.subjects.map((s, j) => <span key={j} className="text-[10px] px-2 py-0.5 bg-secondary rounded-full">{s}</span>)}
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{p.completed_tasks}/{p.task_count} tasks</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex gap-3">
                      {p.start_date && <span>{formatDateShort(p.start_date)}</span>}
                      {p.end_date && <span>→ {formatDateShort(p.end_date)}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === "tasks" && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Filters + Create */}
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={() => { resetTaskForm(); setShowCreateTask(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all">
                <Plus className="h-4 w-4" /> Add Task
              </button>
              <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select value={taskPlanFilter} onChange={e => setTaskPlanFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600">
                <option value="">All Plans</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {/* Create Task Form */}
            <AnimatePresence>
              {showCreateTask && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold">New Task</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Title *</label>
                        <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Review Chapter 5" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Subject</label>
                        <input value={taskSubject} onChange={e => setTaskSubject(e.target.value)} placeholder="Mathematics" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Priority</label>
                        <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                        <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Est. Minutes</label>
                        <input type="number" min={5} value={taskMinutes} onChange={e => setTaskMinutes(Number(e.target.value))} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Plan (optional)</label>
                        <select value={taskPlanId} onChange={e => setTaskPlanId(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                          <option value="">No plan</option>
                          {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <input value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Optional notes..." className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveTask} disabled={!taskTitle} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50">Add Task</button>
                      <button onClick={resetTaskForm} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Task List */}
            <div className="space-y-2">
              {tasks.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">No tasks found. Add one!</div>
              )}
              {tasks.map((t, i) => (
                <motion.div
                  key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className={cn(
                    "bg-card border border-border rounded-2xl p-4 flex items-center gap-4 transition-all",
                    t.status === "completed" ? "opacity-60" : "hover:border-purple-500/20"
                  )}
                >
                  <button onClick={() => handleToggleTask(t)} className="shrink-0">
                    {t.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-purple-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", t.status === "completed" && "line-through text-muted-foreground")}>{t.title}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>{t.subject}</span>
                      {t.due_date && <span>Due {formatDateShort(t.due_date)}</span>}
                      {t.estimated_minutes && <span>{t.estimated_minutes}m</span>}
                      {t.description && <span className="text-muted-foreground/60">{t.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {taskDeleteId === t.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDeleteTask(t.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg font-medium">Delete</button>
                        <button onClick={() => setTaskDeleteId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg font-medium">No</button>
                      </div>
                    ) : (
                      <>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", PRIORITY_COLORS[t.priority])}>{t.priority}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[t.status])}>{t.status}</span>
                        <button onClick={() => setTaskDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "timer" && (
          <motion.div key="timer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pomodoro Timer */}
              <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center">
                <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><Timer className="h-4 w-4 text-rose-400" /> Pomodoro Timer</h3>
                <div className="text-7xl font-mono font-bold tracking-wider mb-8 tabular-nums">
                  {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
                </div>
                <div className="flex gap-3 mb-6">
                  {!timerRunning ? (
                    <button onClick={startTimer} className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">
                      <Play className="h-5 w-5" /> Start Focus
                    </button>
                  ) : timerPaused ? (
                    <button onClick={resumeTimer} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all">
                      <Play className="h-5 w-5" /> Resume
                    </button>
                  ) : (
                    <button onClick={pauseTimer} className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-sm font-bold hover:bg-amber-700 transition-all">
                      <Pause className="h-5 w-5" /> Pause
                    </button>
                  )}
                  {timerRunning && (
                    <button onClick={completeSession} className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-2xl text-sm font-bold hover:bg-secondary transition-all">
                      <Square className="h-5 w-5" /> Stop
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-center text-xs text-muted-foreground">
                  <span className={cn("px-3 py-1 rounded-full", timerMode === "focus" ? "bg-rose-500/10 text-rose-400" : "bg-green-500/10 text-green-400")}>
                    {timerMode === "focus" ? "Focus" : "Break"}
                  </span>
                  <span>25 min focus / 5 min break</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-6 w-full">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <input value={timerSubject} onChange={e => setTimerSubject(e.target.value)} placeholder="Math" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-600" />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground">Task (optional)</label>
                    <select value={timerTaskId} onChange={e => setTimerTaskId(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-600">
                      <option value="">No task</option>
                      {tasks.filter(t => t.status !== "completed").slice(0, 10).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Session History */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Session History</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sessions.length === 0 && <p className="text-xs text-muted-foreground">No sessions yet. Start your first Pomodoro!</p>}
                  {sessions.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 text-xs">
                      <div>
                        <span className="font-medium">{s.subject || "General"}</span>
                        <span className="text-muted-foreground ml-2">{s.duration_minutes}min</span>
                        {s.focus_score && <span className="text-green-400 ml-2">Focus: {s.focus_score}%</span>}
                      </div>
                      <span className="text-muted-foreground">{formatDateShort(s.completed_at || s.started_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
