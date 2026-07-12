"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar,
  FileText, Upload, Plus, Trash2, GraduationCap,
  Users, Bell, Clock, Sparkles, Download, Search,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Pencil, X, Eye, Globe, DoorOpen,
  Timer, Notebook, BookMarked, CalendarDays,
  Layers, PanelRightClose, ListTodo, BarChart3,
} from "lucide-react";
import * as api from "@/lib/api";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

const PRIORITY_BADGE: Record<string, string> = {
  normal: "bg-blue-500/10 text-blue-400",
  important: "bg-amber-500/10 text-amber-400",
  urgent: "bg-red-500/10 text-red-400",
};

const CONTENT_ICONS: Record<string, React.ReactNode> = {
  notes: <Notebook className="h-4 w-4" />,
  assignments: <ClipboardList className="h-4 w-4" />,
  pyqs: <BookMarked className="h-4 w-4" />,
};

type TabId = "dashboard" | "content" | "classroom" | "schedule";
type ContentSubTab = "notes" | "assignments" | "pyqs";

export default function FacultyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("dashboard");

  useEffect(() => {
    if (user && user.role !== "faculty" && user.role !== "admin") {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  // ─── Dashboard ─────────────────────────────────────────
  const [dashData, setDashData] = useState<any>(null);

  // ─── Content ───────────────────────────────────────────
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>("notes");
  const [contentList, setContentList] = useState<api.FacultyContentInfo[]>([]);
  const [courses, setCourses] = useState<{ id: string; code: string; name: string; enrollment_count: number }[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentDesc, setContentDesc] = useState("");
  const [contentCourse, setContentCourse] = useState("");
  const [contentSubject, setContentSubject] = useState("");
  const [contentYear, setContentYear] = useState(new Date().getFullYear());
  const [contentDue, setContentDue] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentUploading, setContentUploading] = useState(false);
  const [contentDelId, setContentDelId] = useState<string | null>(null);

  // ─── Classroom ─────────────────────────────────────────
  const [classSubTab, setClassSubTab] = useState<"courses" | "notices" | "submissions">("courses");
  const [notices, setNotices] = useState<api.NoticeInfo[]>([]);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticePriority, setNoticePriority] = useState("normal");
  const [noticeCourse, setNoticeCourse] = useState("");
  const [noticeDelId, setNoticeDelId] = useState<string | null>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [submissions, setSubmissions] = useState<api.SubmissionInfo[]>([]);
  const [gradeValues, setGradeValues] = useState<Record<string, string>>({});
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>({});
  const [selectedAssignment, setSelectedAssignment] = useState("");

  // ─── Schedule ──────────────────────────────────────────
  const [schedSubTab, setSchedSubTab] = useState<"timetable" | "events">("timetable");
  const [timetable, setTimetable] = useState<api.TimetableInfo[]>([]);
  const [showTtForm, setShowTtForm] = useState(false);
  const [ttCourse, setTtCourse] = useState("");
  const [ttSubject, setTtSubject] = useState("");
  const [ttDay, setTtDay] = useState(0);
  const [ttStart, setTtStart] = useState("09:00");
  const [ttEnd, setTtEnd] = useState("10:30");
  const [ttRoom, setTtRoom] = useState("");
  const [ttDelId, setTtDelId] = useState<string | null>(null);
  const [events, setEvents] = useState<api.EventInfo[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evLoc, setEvLoc] = useState("");
  const [evType, setEvType] = useState("academic");
  const [evDelId, setEvDelId] = useState<string | null>(null);

  // ─── Loaders ───────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try { setDashData(await api.getFacultyPortalDashboard()); } catch { /* ignore */ }
  }, []);

  const loadCourses = useCallback(async () => {
    try { setCourses(await api.getMyCourses()); } catch { /* ignore */ }
  }, []);

  const loadContent = useCallback(async () => {
    try { setContentList(await api.listFacultyContent(contentSubTab)); } catch { /* ignore */ }
  }, [contentSubTab]);

  const loadNotices = useCallback(async () => {
    try { setNotices(await api.listNotices()); } catch { /* ignore */ }
  }, []);

  const loadTimetable = useCallback(async () => {
    try { setTimetable(await api.listTimetable()); } catch { /* ignore */ }
  }, []);

  const loadEvents = useCallback(async () => {
    try { setEvents(await api.listEvents()); } catch { /* ignore */ }
  }, []);

  const loadSubmissions = useCallback(async () => {
    try { setSubmissions(await api.listSubmissions(selectedAssignment || undefined)); } catch { /* ignore */ }
  }, [selectedAssignment]);

  const loadCourseStudents = useCallback(async (courseId: string) => {
    if (!courseId) return;
    try { setCourseStudents(await api.getCourseStudents(courseId)); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { loadContent(); }, [loadContent]);
  useEffect(() => { loadNotices(); }, [loadNotices]);
  useEffect(() => { loadTimetable(); }, [loadTimetable]);
  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);
  useEffect(() => { if (selectedCourseId) loadCourseStudents(selectedCourseId); }, [selectedCourseId, loadCourseStudents]);

  // ─── Content Actions ───────────────────────────────────
  async function handleUploadContent() {
    if (!contentTitle) return;
    setContentUploading(true);
    const formData = new FormData();
    formData.append("content_type", contentSubTab);
    formData.append("title", contentTitle);
    if (contentDesc) formData.append("description", contentDesc);
    if (contentCourse) formData.append("course_id", contentCourse);
    if (contentSubject) formData.append("subject", contentSubject);
    if (contentSubTab === "pyqs") formData.append("year", String(contentYear));
    if (contentDue) formData.append("due_date", contentDue);
    if (contentFile) formData.append("file", contentFile);
    try {
      await api.uploadFacultyContent(formData);
      resetContentForm();
      await loadContent();
      await loadDashboard();
    } catch (e: any) { alert(e.message); }
    setContentUploading(false);
  }

  function resetContentForm() {
    setShowContentForm(false);
    setContentTitle(""); setContentDesc(""); setContentCourse("");
    setContentSubject(""); setContentYear(new Date().getFullYear());
    setContentDue(""); setContentFile(null);
  }

  async function handleDeleteContent(id: string) {
    await api.deleteFacultyContent(id);
    setContentDelId(null);
    await loadContent();
    await loadDashboard();
  }

  // ─── Notice Actions ────────────────────────────────────
  async function handleCreateNotice() {
    if (!noticeTitle || !noticeContent) return;
    await api.createNotice({
      title: noticeTitle, content: noticeContent,
      course_id: noticeCourse || undefined, priority: noticePriority,
    });
    setShowNoticeForm(false);
    setNoticeTitle(""); setNoticeContent(""); setNoticePriority("normal"); setNoticeCourse("");
    await loadNotices();
    await loadDashboard();
  }

  async function handleDeleteNotice(id: string) {
    await api.deleteNotice(id);
    setNoticeDelId(null);
    await loadNotices();
  }

  // ─── Timetable Actions ─────────────────────────────────
  async function handleCreateTt() {
    await api.createTimetableEntry({
      course_id: ttCourse, subject: ttSubject || undefined,
      day_of_week: ttDay, start_time: ttStart, end_time: ttEnd,
      room: ttRoom || undefined,
    });
    setShowTtForm(false);
    setTtCourse(""); setTtSubject(""); setTtRoom("");
    await loadTimetable();
    await loadDashboard();
  }

  async function handleDeleteTt(id: string) {
    await api.deleteTimetableEntry(id);
    setTtDelId(null);
    await loadTimetable();
  }

  // ─── Event Actions ─────────────────────────────────────
  async function handleCreateEvent() {
    if (!evTitle || !evDate) return;
    await api.createEvent({
      title: evTitle, description: evDesc || undefined,
      event_date: evDate, event_time: evTime || undefined,
      location: evLoc || undefined, event_type: evType,
    });
    setShowEventForm(false);
    setEvTitle(""); setEvDesc(""); setEvDate(""); setEvTime(""); setEvLoc(""); setEvType("academic");
    await loadEvents();
    await loadDashboard();
  }

  async function handleDeleteEvent(id: string) {
    await api.deleteEvent(id);
    setEvDelId(null);
    await loadEvents();
  }

  // ─── Grade Actions ─────────────────────────────────────
  async function handleGrade(submissionId: string) {
    const grade = gradeValues[submissionId];
    if (!grade) return;
    await api.gradeSubmission(submissionId, { grade, feedback: feedbackValues[submissionId] || undefined });
    setGradeValues(prev => ({ ...prev, [submissionId]: "" }));
    await loadSubmissions();
  }

  // ─── Tabs ───────────────────────────────────────────────
  const mainTabs = [
    { id: "dashboard" as TabId, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "content" as TabId, label: "Content", icon: <FileText className="h-4 w-4" /> },
    { id: "classroom" as TabId, label: "Classroom", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "schedule" as TabId, label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
  ];

  const contentSubTabs: { id: ContentSubTab; label: string }[] = [
    { id: "notes", label: "Notes" },
    { id: "assignments", label: "Assignments" },
    { id: "pyqs", label: "PYQs" },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage courses, content, notices, and more</p>
        </div>
        <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full font-medium">{user?.full_name}</span>
      </div>

      {/* ─── Main Tabs ─────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
        {mainTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>{t.icon} {t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════ DASHBOARD ═══════════════════════ */}
        {tab === "dashboard" && (
          <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Courses", value: dashData?.courses_count ?? 0, icon: <BookOpen className="h-5 w-5 text-blue-400" /> },
                { label: "Enrollments", value: dashData?.total_enrollments ?? 0, icon: <Users className="h-5 w-5 text-green-400" /> },
                { label: "Content", value: dashData?.content_count ?? 0, icon: <FileText className="h-5 w-5 text-amber-400" /> },
                { label: "Pending Grades", value: dashData?.pending_submissions ?? 0, icon: <ClipboardList className="h-5 w-5 text-rose-400" /> },
                { label: "Notices", value: dashData?.notices_count ?? 0, icon: <Bell className="h-5 w-5 text-purple-400" /> },
                { label: "Events", value: dashData?.events_count ?? 0, icon: <CalendarDays className="h-5 w-5 text-indigo-400" /> },
                { label: "Timetable", value: dashData?.timetable_count ?? 0, icon: <Clock className="h-5 w-5 text-cyan-400" /> },
                { label: "All Content", value: dashData?.content_count ?? 0, icon: <Layers className="h-5 w-5 text-pink-400" /> },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">{s.icon}</div>
                  <div>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Courses */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" /> My Courses</h3>
                <div className="space-y-2">
                  {(dashData?.courses ?? []).length === 0 && <p className="text-xs text-muted-foreground">No courses assigned</p>}
                  {(dashData?.courses ?? []).map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20">
                      <div className="h-8 w-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-xs font-bold text-purple-400">{c.code}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notices */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /> Recent Notices</h3>
                <div className="space-y-2">
                  {(dashData?.recent_notices ?? []).length === 0 && <p className="text-xs text-muted-foreground">No notices posted</p>}
                  {(dashData?.recent_notices ?? []).map((n: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-secondary/20">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", PRIORITY_BADGE[n.priority] || PRIORITY_BADGE.normal)}>{n.priority}</span>
                        <span className="text-xs font-medium">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatDateShort(n.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Content */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Recent Uploads</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(dashData?.recent_content ?? []).length === 0 && <p className="text-xs text-muted-foreground col-span-full">No content uploaded yet</p>}
                {(dashData?.recent_content ?? []).map((c: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/20 text-xs">
                    <div className="flex items-center gap-1.5 text-foreground font-medium mb-1">
                      {CONTENT_ICONS[c.content_type]} {c.title}
                    </div>
                    <span className="text-muted-foreground">{c.content_type} • {formatDateShort(c.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ CONTENT ═════════════════════════ */}
        {tab === "content" && (
          <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
              {contentSubTabs.map(st => (
                <button key={st.id} onClick={() => { setContentSubTab(st.id); setShowContentForm(false); }}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    contentSubTab === st.id ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  )}>{CONTENT_ICONS[st.id]} {st.label}</button>
              ))}
            </div>

            <button onClick={() => setShowContentForm(!showContentForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all w-fit">
              <Upload className="h-4 w-4" /> Upload {contentSubTab === "notes" ? "Notes" : contentSubTab === "assignments" ? "Assignment" : "PYQ"}
            </button>

            <AnimatePresence>
              {showContentForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold">Upload {contentSubTab === "notes" ? "Notes" : contentSubTab === "assignments" ? "Assignment" : "PYQ"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Title *</label>
                        <input value={contentTitle} onChange={e => setContentTitle(e.target.value)} placeholder="Chapter 5: Calculus" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Course</label>
                        <select value={contentCourse} onChange={e => setContentCourse(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                          <option value="">Select course</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Subject</label>
                        <input value={contentSubject} onChange={e => setContentSubject(e.target.value)} placeholder="Mathematics" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                      {contentSubTab === "pyqs" && (
                        <div>
                          <label className="text-xs text-muted-foreground">Year</label>
                          <input type="number" value={contentYear} onChange={e => setContentYear(Number(e.target.value))} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        </div>
                      )}
                      {contentSubTab === "assignments" && (
                        <div>
                          <label className="text-xs text-muted-foreground">Due Date</label>
                          <input type="date" value={contentDue} onChange={e => setContentDue(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground">Description</label>
                        <input value={contentDesc} onChange={e => setContentDesc(e.target.value)} placeholder="Description of the content..." className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">File (PDF, DOCX, etc.)</label>
                      <input type="file" onChange={e => setContentFile(e.target.files?.[0] || null)} className="w-full mt-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-600/10 file:text-purple-400 hover:file:bg-purple-600/20" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleUploadContent} disabled={!contentTitle || contentUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50">
                        {contentUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                      </button>
                      <button onClick={resetContentForm} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content List */}
            <div className="space-y-2">
              {contentList.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No {contentSubTab} uploaded yet</p>}
              {contentList.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">{CONTENT_ICONS[item.content_type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                      {item.course_name && <span>{item.course_name}</span>}
                      {item.subject && <span>{item.subject}</span>}
                      {item.year && <span>Year: {item.year}</span>}
                      {item.due_date && <span>Due: {formatDateShort(item.due_date)}</span>}
                      {item.file_type && <span>.{item.file_type}</span>}
                      {item.submission_count > 0 && <span className="text-green-400">{item.submission_count} submissions</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {contentDelId === item.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDeleteContent(item.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg font-medium">Delete</button>
                        <button onClick={() => setContentDelId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg font-medium">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setContentDelId(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════ CLASSROOM ═══════════════════════ */}
        {tab === "classroom" && (
          <motion.div key="classroom" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
              {[
                { id: "courses" as const, label: "Courses & Students", icon: <Users className="h-4 w-4" /> },
                { id: "notices" as const, label: "Notices", icon: <Bell className="h-4 w-4" /> },
                { id: "submissions" as const, label: "Submissions", icon: <ClipboardList className="h-4 w-4" /> },
              ].map(st => (
                <button key={st.id} onClick={() => setClassSubTab(st.id)}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    classSubTab === st.id ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  )}>{st.icon} {st.label}</button>
              ))}
            </div>

            {classSubTab === "courses" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="text-sm font-bold mb-3">Courses</h3>
                  <div className="space-y-2">
                    {courses.map(c => (
                      <div key={c.id}
                        onClick={() => setSelectedCourseId(c.id)}
                        className={cn("p-3 rounded-xl cursor-pointer transition-all",
                          selectedCourseId === c.id ? "bg-purple-600/10 border border-purple-500/30" : "bg-secondary/20 hover:bg-secondary/40"
                        )}>
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.code} • {c.enrollment_count} enrolled</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="text-sm font-bold mb-3">Students</h3>
                  {!selectedCourseId ? (
                    <p className="text-xs text-muted-foreground">Select a course to view students</p>
                  ) : courseStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No students enrolled</p>
                  ) : (
                    <div className="space-y-2">
                      {courseStudents.map((s: any) => (
                        <div key={s.student_id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 text-xs">
                          <div>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-muted-foreground ml-2">{s.email}</span>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full font-medium",
                            s.grade ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                          )}>{s.grade || "Ungraded"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {classSubTab === "notices" && (
              <>
                <button onClick={() => setShowNoticeForm(!showNoticeForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all w-fit">
                  <Bell className="h-4 w-4" /> Post Notice
                </button>

                <AnimatePresence>
                  {showNoticeForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold">Post Notice</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">Title *</label>
                            <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="Exam Schedule" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Course (optional)</label>
                            <select value={noticeCourse} onChange={e => setNoticeCourse(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                              <option value="">All Courses</option>
                              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Priority</label>
                            <select value={noticePriority} onChange={e => setNoticePriority(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                              <option value="normal">Normal</option>
                              <option value="important">Important</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-muted-foreground">Content *</label>
                            <textarea value={noticeContent} onChange={e => setNoticeContent(e.target.value)} rows={4} placeholder="Notice details..." className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateNotice} disabled={!noticeTitle || !noticeContent} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Post Notice</button>
                          <button onClick={() => setShowNoticeForm(false)} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  {notices.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No notices posted</p>}
                  {notices.map(n => (
                    <div key={n.id} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", PRIORITY_BADGE[n.priority])}>{n.priority}</span>
                          <h4 className="text-sm font-bold">{n.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{formatDate(n.created_at)}</span>
                          {noticeDelId === n.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDeleteNotice(n.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg">Delete</button>
                              <button onClick={() => setNoticeDelId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setNoticeDelId(n.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{n.content}</p>
                      {n.course_name && <span className="text-[10px] text-muted-foreground mt-2 block">Course: {n.course_name}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {classSubTab === "submissions" && (
              <>
                <div className="flex items-center gap-3">
                  <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600">
                    <option value="">All Assignments</option>
                    {contentList.filter(c => c.content_type === "assignments").map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  {submissions.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No submissions yet</p>}
                  {submissions.map(s => (
                    <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.student_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">Submitted: {formatDate(s.submitted_at)}</div>
                        {s.grade && <span className="text-xs text-green-400">Grade: {s.grade}</span>}
                      </div>
                      {s.grade ? (
                        <span className="text-xs text-green-400 font-medium">{s.grade}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input value={gradeValues[s.id] || ""} onChange={e => setGradeValues(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Grade" className="w-20 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          <input value={feedbackValues[s.id] || ""} onChange={e => setFeedbackValues(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Feedback" className="w-32 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          <button onClick={() => handleGrade(s.id)} disabled={!gradeValues[s.id]} className="px-3 py-1 bg-purple-600 text-white text-[10px] rounded-lg font-medium disabled:opacity-50">Grade</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ═══════════════ SCHEDULE ════════════════════════ */}
        {tab === "schedule" && (
          <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
              {[
                { id: "timetable" as const, label: "Timetable", icon: <Clock className="h-4 w-4" /> },
                { id: "events" as const, label: "Events", icon: <CalendarDays className="h-4 w-4" /> },
              ].map(st => (
                <button key={st.id} onClick={() => setSchedSubTab(st.id)}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    schedSubTab === st.id ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  )}>{st.icon} {st.label}</button>
              ))}
            </div>

            {schedSubTab === "timetable" && (
              <>
                <button onClick={() => setShowTtForm(!showTtForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all w-fit">
                  <Plus className="h-4 w-4" /> Add Timetable Entry
                </button>

                <AnimatePresence>
                  {showTtForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold">New Timetable Entry</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">Course *</label>
                            <select value={ttCourse} onChange={e => setTtCourse(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                              <option value="">Select</option>
                              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Subject</label>
                            <input value={ttSubject} onChange={e => setTtSubject(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Day</label>
                            <select value={ttDay} onChange={e => setTtDay(Number(e.target.value))} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Start Time</label>
                            <input type="time" value={ttStart} onChange={e => setTtStart(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">End Time</label>
                            <input type="time" value={ttEnd} onChange={e => setTtEnd(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Room</label>
                            <input value={ttRoom} onChange={e => setTtRoom(e.target.value)} placeholder="Room 301" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateTt} disabled={!ttCourse} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Add Entry</button>
                          <button onClick={() => setShowTtForm(false)} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timetable Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {DAY_NAMES.map((day, idx) => {
                    const dayEntries = timetable.filter(e => e.day_of_week === idx);
                    return (
                      <div key={idx} className="bg-card border border-border rounded-2xl p-3 min-h-[200px]">
                        <h4 className="text-xs font-bold text-center mb-2 pb-2 border-b border-border">{day}</h4>
                        <div className="space-y-1.5">
                          {dayEntries.length === 0 && <p className="text-[10px] text-muted-foreground text-center">—</p>}
                          {dayEntries.map(e => (
                            <div key={e.id} className="p-1.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-[10px]">
                              <div className="font-medium truncate">{e.course_name || e.subject}</div>
                              <div className="text-muted-foreground">{e.start_time} - {e.end_time}</div>
                              {e.room && <div className="text-muted-foreground">📍{e.room}</div>}
                              {ttDelId === e.id ? (
                                <div className="flex gap-1 mt-1">
                                  <button onClick={() => handleDeleteTt(e.id)} className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded">Delete</button>
                                  <button onClick={() => setTtDelId(null)} className="px-1.5 py-0.5 bg-card border border-border text-[8px] rounded">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setTtDelId(e.id)} className="mt-1 text-red-400 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {schedSubTab === "events" && (
              <>
                <button onClick={() => setShowEventForm(!showEventForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all w-fit">
                  <Plus className="h-4 w-4" /> Create Event
                </button>

                <AnimatePresence>
                  {showEventForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold">New Event</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">Title *</label>
                            <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Midterm Exam" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Date *</label>
                            <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Time</label>
                            <input type="time" value={evTime} onChange={e => setEvTime(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Location</label>
                            <input value={evLoc} onChange={e => setEvLoc(e.target.value)} placeholder="Auditorium" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Type</label>
                            <select value={evType} onChange={e => setEvType(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                              <option value="academic">Academic</option>
                              <option value="cultural">Cultural</option>
                              <option value="sports">Sports</option>
                              <option value="holiday">Holiday</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-muted-foreground">Description</label>
                            <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} rows={3} placeholder="Event details..." className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateEvent} disabled={!evTitle || !evDate} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Create Event</button>
                          <button onClick={() => setShowEventForm(false)} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No events created</p>}
                  {events.map(e => (
                    <div key={e.id} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                          e.event_type === "academic" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                        )}>{e.event_type}</span>
                        {evDelId === e.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDeleteEvent(e.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg">Delete</button>
                            <button onClick={() => setEvDelId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setEvDelId(e.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                      <h4 className="font-bold text-sm mt-2">{e.title}</h4>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>📅 {formatDate(e.event_date)} {e.event_time && `⏰ ${e.event_time}`}</p>
                        {e.location && <p>📍 {e.location}</p>}
                        {e.description && <p className="text-muted-foreground/70">{e.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
