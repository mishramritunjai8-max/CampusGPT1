"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Download,
  CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, BarChart3,
  PieChart, Target, BookOpen, Users, Percent, Loader2, Filter,
  Edit3, X, Check, AlertCircle, Calendar, Eye,
} from "lucide-react";
import * as api from "@/lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AttendancePage() {
  const { user } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "subjects" | "calendar" | "records">("dashboard");

  // Data state
  const [stats, setStats] = useState<api.AttendanceStats | null>(null);
  const [charts, setCharts] = useState<api.AttendanceChartData | null>(null);
  const [predictions, setPredictions] = useState<api.AttendancePrediction[]>([]);
  const [subjects, setSubjects] = useState<api.AttendanceSubjectInfo[]>([]);
  const [records, setRecords] = useState<api.AttendanceRecordInfo[]>([]);
  const [calendar, setCalendar] = useState<api.CalendarDay[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("");

  // Calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);

  // Modals
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [showSubjectDetail, setShowSubjectDetail] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [newSubject, setNewSubject] = useState({ name: "", code: "", semester: "" });
  const [newRecord, setNewRecord] = useState({ subject_id: "", date: new Date().toISOString().slice(0,10), status: "present" });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, p, subs, sems] = await Promise.all([
        api.getAttendanceStats(),
        api.getAttendanceCharts(),
        api.getAttendancePredictions(),
        api.listAttendanceSubjects(selectedSemester || undefined),
        api.getAttendanceSemesters(),
      ]);
      setStats(s);
      setCharts(c);
      setPredictions(p);
      setSubjects(subs);
      setSemesters(sems);
    } catch {}
    setLoading(false);
  }, [selectedSemester]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    api.getAttendanceCalendar(calYear, calMonth).then(setCalendar).catch(() => {});
  }, [calYear, calMonth]);

  const loadRecords = async (subjectId?: string) => {
    try {
      const data = await api.listAttendanceRecords(subjectId || undefined);
      setRecords(data);
    } catch {}
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) return;
    try {
      await api.createAttendanceSubject({
        name: newSubject.name,
        code: newSubject.code || undefined,
        semester: newSubject.semester || undefined,
      });
      setShowAddSubject(false);
      setNewSubject({ name: "", code: "", semester: "" });
      loadAll();
    } catch {}
  };

  const handleMarkAttendance = async () => {
    if (!newRecord.subject_id || !newRecord.date) return;
    try {
      await api.createAttendanceRecord(newRecord);
      setShowMarkAttendance(false);
      setNewRecord({ subject_id: "", date: new Date().toISOString().slice(0,10), status: "present" });
      loadAll();
    } catch {}
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await api.deleteAttendanceRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      loadAll();
    } catch {}
    setDeleteConfirm(null);
  };

  const calDaysInMonth = new Date(calYear, calMonth, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const calDays: (number | null)[] = Array(calFirstDay).fill(null);
  for (let i = 1; i <= calDaysInMonth; i++) calDays.push(i);

  const maxBar = charts ? Math.max(...charts.monthly.map(m => m.total), 1) : 1;

  const selectedSubject = subjects.find(s => s.id === showSubjectDetail);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track, predict, and analyze your academic attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
            <button onClick={() => api.downloadAttendanceExport("pdf")} className="p-2 rounded-xl bg-card border border-border hover:bg-secondary"><Download className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 overflow-x-auto">
        {[
          { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
          { key: "subjects", label: "Subjects", icon: <BookOpen className="h-4 w-4" /> },
          { key: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
          { key: "records", label: "Records", icon: <Clock className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key ? "bg-green-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >{tab.icon}{tab.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-green-400" /></div>
      ) : (
        <>
          {/* ═══ DASHBOARD TAB ═══ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Hero */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_70%)]" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="3"
                        strokeDasharray={`${stats?.overall_pct || 0} ${100 - (stats?.overall_pct || 0)}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{stats?.overall_pct || 0}%</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold">Overall Attendance</h2>
                    <p className="text-green-100 text-sm mt-1">
                      {stats?.total_present} present out of {stats?.total_classes} classes
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-green-100">
                      <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />{stats?.total_present} Present</span>
                      <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{stats?.total_absent} Absent</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{stats?.total_leave} Leave</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Subject cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((s) => {
                  const color = s.status === "good" ? "from-green-500 to-emerald-500" : s.status === "warning" ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";
                  const Icon = s.status === "good" ? CheckCircle : s.status === "warning" ? AlertTriangle : XCircle;
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => { setShowSubjectDetail(s.id); loadRecords(s.id); }}
                    >
                      <div className={`h-1.5 bg-gradient-to-r ${color}`} />
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{s.name}</p>
                            {s.code && <p className="text-[10px] text-muted-foreground">{s.code}</p>}
                          </div>
                          <Icon className={`h-5 w-5 shrink-0 ${s.status === "good" ? "text-green-400" : s.status === "warning" ? "text-amber-400" : "text-red-400"}`} />
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="text-2xl font-bold">{s.attendance_pct}%</span>
                            <span className="text-xs text-muted-foreground ml-1">{s.attended_classes}/{s.total_classes}</span>
                          </div>
                          {s.status !== "good" && <span className="text-[10px] text-amber-400">Need {s.need_for_safe} more</span>}
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${s.attendance_pct}%` }} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Charts */}
              {charts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Monthly chart */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400" />Monthly Attendance</h3>
                    {charts.monthly.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>
                    ) : (
                      <div className="flex items-end gap-2 h-32">
                        {charts.monthly.slice(-6).map((m) => (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col items-center justify-end h-24 gap-0.5">
                              <div className="w-full bg-green-500/30 rounded-t" style={{ height: `${(m.present / maxBar) * 100}%` }} />
                              <div className="w-full bg-red-500/30 rounded-t" style={{ height: `${(m.absent / maxBar) * 100}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{m.month.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subject breakdown */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><PieChart className="h-4 w-4 text-blue-400" />Subject Breakdown</h3>
                    {charts.subject_breakdown.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {charts.subject_breakdown.map((sb) => (
                          <div key={sb.name} className="space-y-1">
                            <div className="flex justify-between text-xs"><span className="truncate">{sb.name}</span><span>{sb.pct}%</span></div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: `${sb.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Semester stats */}
                  {charts.semester_stats.length > 0 && (
                    <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-purple-400" />Semester Statistics</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {charts.semester_stats.map((sem) => (
                          <div key={sem.semester} className="bg-secondary/30 rounded-xl p-4 text-center">
                            <p className="text-xs text-muted-foreground">{sem.semester}</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{sem.pct}%</p>
                            <p className="text-xs text-muted-foreground">{sem.present}/{sem.total} classes</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predictions */}
                  {predictions.length > 0 && (
                    <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-amber-400" />Attendance Predictions</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {predictions.map((p) => (
                          <div key={p.subject_id} className={`rounded-xl p-4 border ${p.warning ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"}`}>
                            <p className="font-bold text-sm">{p.subject_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">Current: {p.current_pct}%</p>
                            {p.warning ? (
                              <div className="mt-2 space-y-1 text-xs">
                                <p className="text-amber-400">Need {p.needed_to_reach_75} more classes to reach 75%</p>
                                <p className="text-red-400">After 5 absences: {p.projected_pct_after_5_absences}%</p>
                              </div>
                            ) : (
                              <div className="mt-2 space-y-1 text-xs">
                                <p className="text-green-400">Safe to miss {p.safe_to_miss_from_now} classes</p>
                                <p className="text-muted-foreground">After 5 absences: {p.projected_pct_after_5_absences}%</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ SUBJECTS TAB ═══ */}
          {activeTab === "subjects" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p>
                <button onClick={() => setShowAddSubject(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                ><Plus className="h-4 w-4" />Add Subject</button>
              </div>

              {subjects.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-bold">No Subjects</p>
                  <p className="text-sm text-muted-foreground">Add your first subject to start tracking attendance.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Subject</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Total</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Present</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">%</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Need X</th>
                        <th className="text-right p-3 font-medium text-muted-foreground text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subjects.map((s) => (
                        <tr key={s.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="p-3">
                            <p className="font-medium">{s.name}</p>
                            {s.code && <p className="text-[10px] text-muted-foreground">{s.code}</p>}
                          </td>
                          <td className="p-3 text-center">{s.total_classes}</td>
                          <td className="p-3 text-center">{s.attended_classes}</td>
                          <td className="p-3 text-center font-bold">{s.attendance_pct}%</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              s.status === "good" ? "bg-green-500/10 text-green-400" :
                              s.status === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                            }`}>{s.status}</span>
                          </td>
                          <td className="p-3 text-center text-xs">{s.status !== "good" ? `${s.need_for_safe} more` : "-"}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => { setShowSubjectDetail(s.id); loadRecords(s.id); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ CALENDAR TAB ═══ */}
          {activeTab === "calendar" && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => { if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                  className="p-2 rounded-xl hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
                <h3 className="font-bold text-lg">{MONTHS[calMonth - 1]} {calYear}</h3>
                <button onClick={() => { if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                  className="p-2 rounded-xl hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} />;
                  const dayData = calendar.find(c => c.day === d);
                  const hasRecord = dayData?.hasRecord;
                  const status = dayData?.status;
                  const color = status === "present" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                    status === "absent" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                    status === "leave" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "";
                  return (
                    <div key={d} className={`aspect-square rounded-xl flex items-center justify-center text-sm border border-transparent ${color || "hover:bg-secondary/30"}`}>
                      <span>{d}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500/40" /> Present</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/40" /> Absent</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/40" /> Leave</span>
              </div>
            </div>
          )}

          {/* ═══ RECORDS TAB ═══ */}
          {activeTab === "records" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{records.length} record{records.length !== 1 ? "s" : ""}</p>
                <button onClick={() => setShowMarkAttendance(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                ><Plus className="h-4 w-4" />Mark Attendance</button>
              </div>
              {records.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-bold">No Records</p>
                  <p className="text-sm text-muted-foreground">Start marking attendance to see records here.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Subject</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-right p-3 font-medium text-muted-foreground text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="p-3">{formatDate(r.date)}</td>
                          <td className="p-3">{r.subject_name || "Unknown"}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              r.status === "present" ? "bg-green-500/10 text-green-400" :
                              r.status === "absent" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                            }`}>{r.status}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Subject Detail Modal ─── */}
      <AnimatePresence>{showSubjectDetail && selectedSubject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSubjectDetail(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div><h3 className="font-bold text-lg">{selectedSubject.name}</h3>{selectedSubject.code && <p className="text-xs text-muted-foreground">{selectedSubject.code}</p>}</div>
              <button onClick={() => setShowSubjectDetail(null)} className="p-1.5 rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/20 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{selectedSubject.attendance_pct}%</p><p className="text-[10px] text-muted-foreground">Attendance</p></div>
              <div className="bg-secondary/20 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{selectedSubject.total_classes}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
              <div className="bg-secondary/20 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{selectedSubject.attended_classes}</p><p className="text-[10px] text-muted-foreground">Present</p></div>
            </div>
            {selectedSubject.status !== "good" && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-400 text-xs">You need {selectedSubject.need_for_safe} more consecutive classes to reach 75% safe attendance.</span>
              </div>
            )}
            {records.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">Recent Records</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {records.slice(0, 20).map((r) => (
                    <div key={r.id} className="flex justify-between text-xs p-2 rounded-lg bg-secondary/10">
                      <span>{formatDate(r.date)}</span>
                      <span className={r.status === "present" ? "text-green-400" : r.status === "absent" ? "text-red-400" : "text-amber-400"}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ─── Add Subject Modal ─── */}
      <AnimatePresence>{showAddSubject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSubject(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-bold">Add Subject</h3><button onClick={() => setShowAddSubject(false)} className="p-1 rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button></div>
            <input value={newSubject.name} onChange={(e) => setNewSubject(p => ({ ...p, name: e.target.value }))} placeholder="Subject name *" className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-600" />
            <input value={newSubject.code} onChange={(e) => setNewSubject(p => ({ ...p, code: e.target.value }))} placeholder="Subject code (e.g. CS101)" className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-600" />
            <input value={newSubject.semester} onChange={(e) => setNewSubject(p => ({ ...p, semester: e.target.value }))} placeholder="Semester (e.g. Fall 2026)" className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-600" />
            <button onClick={handleAddSubject} disabled={!newSubject.name.trim()}
              className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >Add Subject</button>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ─── Mark Attendance Modal ─── */}
      <AnimatePresence>{showMarkAttendance && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowMarkAttendance(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-bold">Mark Attendance</h3><button onClick={() => setShowMarkAttendance(false)} className="p-1 rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button></div>
            <select value={newRecord.subject_id} onChange={(e) => setNewRecord(p => ({ ...p, subject_id: e.target.value }))}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
            ><option value="">Select subject...</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input type="date" value={newRecord.date} onChange={(e) => setNewRecord(p => ({ ...p, date: e.target.value }))}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-600" />
            <div className="grid grid-cols-3 gap-2">
              {["present", "absent", "leave"].map((st) => (
                <button key={st} onClick={() => setNewRecord(p => ({ ...p, status: st }))}
                  className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${
                    newRecord.status === st ? "bg-green-600 text-white border-green-500" : "bg-secondary/20 border-border hover:bg-secondary/40"
                  }`}>{st}</button>
              ))}
            </div>
            <button onClick={handleMarkAttendance} disabled={!newRecord.subject_id || !newRecord.date}
              className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >Mark Attendance</button>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>{deleteConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <div><h3 className="font-bold">Delete</h3><p className="text-xs text-muted-foreground">This cannot be undone.</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/70">Cancel</button>
              <button onClick={() => handleDeleteRecord(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
