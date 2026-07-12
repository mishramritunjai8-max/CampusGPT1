"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, GraduationCap, Shield,
  BookOpen, Building2, FileText, BarChart3,
  Plus, Trash2, Search, Loader2, CheckCircle2,
  AlertCircle, Bell, Clock, Globe, Database,
  Activity, UserCheck, UserX, Settings,
  X, Pencil,
} from "lucide-react";
import * as api from "@/lib/api";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

type TabId = "dashboard" | "users" | "academics" | "system";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("dashboard");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  // ─── Dashboard ─────────────────────────────────────────
  const [dashData, setDashData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<api.AdminAnalytics | null>(null);

  // ─── Users ─────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState("");
  const [editUserDept, setEditUserDept] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // ─── Academics ─────────────────────────────────────────
  const [acadSubTab, setAcadSubTab] = useState<"departments" | "subjects" | "courses">("departments");
  const [departments, setDepartments] = useState<api.DepartmentInfo[]>([]);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptDelId, setDeptDelId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<api.SubjectInfo[]>([]);
  const [showSubjForm, setShowSubjForm] = useState(false);
  const [subjName, setSubjName] = useState("");
  const [subjCode, setSubjCode] = useState("");
  const [subjDept, setSubjDept] = useState("");
  const [subjCredits, setSubjCredits] = useState(3);
  const [subjDesc, setSubjDesc] = useState("");
  const [subjDelId, setSubjDelId] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<api.CourseWithEnrollment[]>([]);

  // ─── System ────────────────────────────────────────────
  const [sysSubTab, setSysSubTab] = useState<"audit" | "notices">("audit");
  const [auditLogs, setAuditLogs] = useState<api.AuditLogInfo[]>([]);
  const [allNotices, setAllNotices] = useState<any[]>([]);

  // ─── Loaders ───────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([
        api.getAdminPortalDashboard(),
        api.getAdminAnalytics(),
      ]);
      setDashData(d);
      setAnalytics(a);
    } catch { /* ignore */ }
  }, []);

  const loadUsers = useCallback(async () => {
    try { setUsers(await api.listAllUsers(userRoleFilter || undefined)); } catch { /* ignore */ }
  }, [userRoleFilter]);

  const loadDepartments = useCallback(async () => {
    try { setDepartments(await api.listDepartments()); } catch { /* ignore */ }
  }, []);

  const loadSubjects = useCallback(async () => {
    try { setSubjects(await api.listAdminSubjects()); } catch { /* ignore */ }
  }, []);

  const loadCourses = useCallback(async () => {
    try { setAllCourses(await api.listAllCourses()); } catch { /* ignore */ }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try { setAuditLogs(await api.listAuditLogs(50)); } catch { /* ignore */ }
  }, []);

  const loadAllNotices = useCallback(async () => {
    try { setAllNotices(await api.listAllNotices()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadDepartments(); }, [loadDepartments]);
  useEffect(() => { loadSubjects(); }, [loadSubjects]);
  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { loadAuditLogs(); }, [loadAuditLogs]);
  useEffect(() => { loadAllNotices(); }, [loadAllNotices]);

  // ─── User Actions ──────────────────────────────────────
  async function handleSaveUser() {
    if (!editUserId) return;
    const data: any = {};
    if (editUserRole) data.role = editUserRole;
    if (editUserDept) data.department = editUserDept;
    if (editUserName) data.full_name = editUserName;
    await api.updateUser(editUserId, data);
    setEditUserId(null);
    await loadUsers();
    await loadDashboard();
  }

  async function handleDeleteUser(id: string) {
    await api.deleteUser(id);
    setDeleteUserId(null);
    await loadUsers();
    await loadDashboard();
  }

  // ─── Department Actions ────────────────────────────────
  async function handleCreateDept() {
    await api.createDepartment({ name: deptName, code: deptCode, description: deptDesc || undefined });
    setShowDeptForm(false);
    setDeptName(""); setDeptCode(""); setDeptDesc("");
    await loadDepartments();
    await loadDashboard();
  }

  async function handleDeleteDept(id: string) {
    await api.deleteDepartment(id);
    setDeptDelId(null);
    await loadDepartments();
    await loadDashboard();
  }

  // ─── Subject Actions ──────────────────────────────────
  async function handleCreateSubj() {
    await api.createSubject({
      name: subjName, code: subjCode,
      department_id: subjDept || undefined,
      credits: subjCredits, description: subjDesc || undefined,
    });
    setShowSubjForm(false);
    setSubjName(""); setSubjCode(""); setSubjDept(""); setSubjCredits(3); setSubjDesc("");
    await loadSubjects();
    await loadDashboard();
  }

  async function handleDeleteSubj(id: string) {
    await api.deleteSubject(id);
    setSubjDelId(null);
    await loadSubjects();
  }

  // ─── Tabs ───────────────────────────────────────────────
  const mainTabs = [
    { id: "dashboard" as TabId, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "users" as TabId, label: "Users", icon: <Users className="h-4 w-4" /> },
    { id: "academics" as TabId, label: "Academics", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "system" as TabId, label: "System", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">System management, users, departments, and analytics</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: analytics?.total_users ?? 0, icon: <Users className="h-5 w-5 text-blue-400" /> },
                { label: "Students", value: analytics?.total_students ?? 0, icon: <UserCheck className="h-5 w-5 text-green-400" /> },
                { label: "Faculty", value: analytics?.total_faculty ?? 0, icon: <GraduationCap className="h-5 w-5 text-amber-400" /> },
                { label: "Courses", value: analytics?.total_courses ?? 0, icon: <BookOpen className="h-5 w-5 text-purple-400" /> },
                { label: "Departments", value: analytics?.total_departments ?? 0, icon: <Building2 className="h-5 w-5 text-rose-400" /> },
                { label: "Subjects", value: analytics?.total_subjects ?? 0, icon: <Globe className="h-5 w-5 text-cyan-400" /> },
                { label: "Documents", value: analytics?.total_documents ?? 0, icon: <FileText className="h-5 w-5 text-indigo-400" /> },
                { label: "Active Today", value: analytics?.active_users_today ?? 0, icon: <Activity className="h-5 w-5 text-pink-400" /> },
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
              {/* Recent Users */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Recent Users</h3>
                <div className="space-y-2">
                  {(dashData?.recent_users ?? []).length === 0 && <p className="text-xs text-muted-foreground">No users</p>}
                  {(dashData?.recent_users ?? []).map((u: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 text-xs">
                      <div className="h-8 w-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-xs font-bold text-purple-400 uppercase">
                        {u.full_name ? u.full_name.substring(0, 2) : "?"}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{u.full_name}</div>
                        <div className="text-muted-foreground">{u.email}</div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full font-medium text-[10px]",
                        u.role === "admin" ? "bg-purple-500/10 text-purple-400" :
                        u.role === "faculty" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                      )}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Logs */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</h3>
                <div className="space-y-1.5">
                  {(dashData?.recent_logs ?? []).length === 0 && <p className="text-xs text-muted-foreground">No recent activity</p>}
                  {(dashData?.recent_logs ?? []).map((l: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-secondary/20 text-[10px] font-mono">
                      <span className={cn("font-semibold",
                        l.action === "create" ? "text-green-400" :
                        l.action === "update" ? "text-blue-400" :
                        l.action === "delete" ? "text-red-400" : "text-muted-foreground"
                      )}>[{l.action.toUpperCase()}]</span>{" "}
                      <span className="text-muted-foreground">{l.resource}</span>
                      {l.details && <span className="text-muted-foreground/60"> — {l.details}</span>}
                      <span className="text-muted-foreground/40 ml-2">{formatDate(l.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Users by Department */}
            {analytics?.users_by_department && Object.keys(analytics.users_by_department).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Users by Department</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.users_by_department).map(([dept, count]) => (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-40">{dept}</span>
                      <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${Math.min(100, ((count as number) / (analytics.total_users || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════ USERS ═══════════════════════════ */}
        {tab === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600">
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
              </select>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600" />
              </div>
              <span className="text-xs text-muted-foreground">{users.length} users</span>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(userSearch
                      ? users.filter(u => (u.full_name || "").toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                      : users
                    ).map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/10">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-purple-600/10 flex items-center justify-center text-xs font-bold text-purple-400 uppercase">
                              {u.full_name ? u.full_name.substring(0, 2) : "?"}
                            </div>
                            <span className="font-medium">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3">
                          {editUserId === u.id ? (
                            <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)} className="bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs">
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={cn("px-2 py-0.5 rounded-full font-medium",
                              u.role === "admin" ? "bg-purple-500/10 text-purple-400" :
                              u.role === "faculty" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                            )}>{u.role}</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {editUserId === u.id ? (
                            <input value={editUserDept} onChange={e => setEditUserDept(e.target.value)} className="bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs w-28" />
                          ) : u.department || "—"}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {editUserId === u.id ? (
                              <>
                                <button onClick={handleSaveUser} className="px-2 py-1 bg-purple-600 text-white text-[10px] rounded-lg font-medium">Save</button>
                                <button onClick={() => setEditUserId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg">Cancel</button>
                              </>
                            ) : deleteUserId === u.id ? (
                              <>
                                <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg font-medium">Delete</button>
                                <button onClick={() => setDeleteUserId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg">No</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditUserId(u.id); setEditUserRole(u.role); setEditUserDept(u.department || ""); setEditUserName(u.full_name || ""); }}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteUserId(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ ACADEMICS ═══════════════════════ */}
        {tab === "academics" && (
          <motion.div key="academics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
              {[
                { id: "departments" as const, label: "Departments", icon: <Building2 className="h-4 w-4" /> },
                { id: "subjects" as const, label: "Subjects", icon: <BookOpen className="h-4 w-4" /> },
                { id: "courses" as const, label: "Courses", icon: <GraduationCap className="h-4 w-4" /> },
              ].map(st => (
                <button key={st.id} onClick={() => setAcadSubTab(st.id)}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    acadSubTab === st.id ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  )}>{st.icon} {st.label}</button>
              ))}
            </div>

            {acadSubTab === "departments" && (
              <>
                <button onClick={() => setShowDeptForm(!showDeptForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all w-fit">
                  <Plus className="h-4 w-4" /> Add Department
                </button>

                <AnimatePresence>
                  {showDeptForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold">New Department</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">Name *</label>
                            <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Computer Science" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Code *</label>
                            <input value={deptCode} onChange={e => setDeptCode(e.target.value)} placeholder="CS" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-muted-foreground">Description</label>
                            <input value={deptDesc} onChange={e => setDeptDesc(e.target.value)} placeholder="Department description..." className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateDept} disabled={!deptName || !deptCode} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Create</button>
                          <button onClick={() => setShowDeptForm(false)} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map(d => (
                    <div key={d.id} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-purple-600/10 flex items-center justify-center font-bold text-purple-400 text-sm">{d.code}</div>
                        {deptDelId === d.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDeleteDept(d.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg">Delete</button>
                            <button onClick={() => setDeptDelId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeptDelId(d.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                      <h4 className="font-bold text-sm mt-3">{d.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                      <div className="text-[10px] text-muted-foreground mt-2">{d.subject_count} subjects</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {acadSubTab === "subjects" && (
              <>
                <button onClick={() => setShowSubjForm(!showSubjForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all w-fit">
                  <Plus className="h-4 w-4" /> Add Subject
                </button>

                <AnimatePresence>
                  {showSubjForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold">New Subject</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">Name *</label>
                            <input value={subjName} onChange={e => setSubjName(e.target.value)} placeholder="Data Structures" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Code *</label>
                            <input value={subjCode} onChange={e => setSubjCode(e.target.value)} placeholder="CS201" className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Department</label>
                            <select value={subjDept} onChange={e => setSubjDept(e.target.value)} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600">
                              <option value="">Select</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Credits</label>
                            <input type="number" min={1} max={6} value={subjCredits} onChange={e => setSubjCredits(Number(e.target.value))} className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-muted-foreground">Description</label>
                            <input value={subjDesc} onChange={e => setSubjDesc(e.target.value)} placeholder="Subject description..." className="w-full mt-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateSubj} disabled={!subjName || !subjCode} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Create</button>
                          <button onClick={() => setShowSubjForm(false)} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        <th className="text-left p-3 font-medium">Code</th>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Credits</th>
                        <th className="text-left p-3 font-medium">Department</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(s => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/10">
                          <td className="p-3 font-medium">{s.code}</td>
                          <td className="p-3">{s.name}</td>
                          <td className="p-3">{s.credits}</td>
                          <td className="p-3 text-muted-foreground">{s.department_id ? departments.find(d => d.id === s.department_id)?.name || "—" : "—"}</td>
                          <td className="p-3">
                            {subjDelId === s.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDeleteSubj(s.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg">Delete</button>
                                <button onClick={() => setSubjDelId(null)} className="px-2 py-1 bg-card border border-border text-[10px] rounded-lg">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setSubjDelId(s.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {acadSubTab === "courses" && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left p-3 font-medium">Code</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Faculty</th>
                      <th className="text-left p-3 font-medium">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.map(c => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/10">
                        <td className="p-3 font-medium">{c.code}</td>
                        <td className="p-3">{c.name}</td>
                        <td className="p-3 text-muted-foreground">{c.faculty_name || "—"}</td>
                        <td className="p-3">{c.enrollment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════ SYSTEM ══════════════════════════ */}
        {tab === "system" && (
          <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
              {[
                { id: "audit" as const, label: "Audit Logs", icon: <Activity className="h-4 w-4" /> },
                { id: "notices" as const, label: "All Notices", icon: <Bell className="h-4 w-4" /> },
              ].map(st => (
                <button key={st.id} onClick={() => setSysSubTab(st.id)}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    sysSubTab === st.id ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  )}>{st.icon} {st.label}</button>
              ))}
            </div>

            {sysSubTab === "audit" && (
              <div className="space-y-1.5">
                {auditLogs.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No audit logs</p>}
                {auditLogs.map(l => (
                  <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border text-xs">
                    <div className={cn("h-2 w-2 rounded-full mt-1 shrink-0",
                      l.action === "create" ? "bg-green-400" :
                      l.action === "update" ? "bg-blue-400" :
                      l.action === "delete" ? "bg-red-400" : "bg-muted-foreground"
                    )} />
                    <div className="flex-1">
                      <div className="font-medium">
                        <span className={cn("font-semibold",
                          l.action === "create" ? "text-green-400" :
                          l.action === "update" ? "text-blue-400" :
                          l.action === "delete" ? "text-red-400" : ""
                        )}>{l.action.toUpperCase()}</span> {l.resource}
                        {l.user_name && <span className="text-muted-foreground"> by {l.user_name}</span>}
                      </div>
                      {l.details && <div className="text-muted-foreground mt-0.5">{l.details}</div>}
                      <div className="text-muted-foreground/50 mt-0.5">{formatDate(l.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sysSubTab === "notices" && (
              <div className="space-y-2">
                {allNotices.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No notices posted</p>}
                {allNotices.map((n: any) => (
                  <div key={n.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                        n.priority === "urgent" ? "bg-red-500/10 text-red-400" :
                        n.priority === "important" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                      )}>{n.priority}</span>
                      <h4 className="text-sm font-bold">{n.title}</h4>
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.content}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-2">
                      {n.poster_name && <span>By: {n.poster_name}</span>}
                      {n.course_name && <span>Course: {n.course_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
