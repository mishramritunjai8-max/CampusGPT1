"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import { 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  GraduationCap, 
  Shield, 
  Bell, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  User, 
  Settings,
  Calendar,
  Layers,
  FileText,
  NotebookPen,
  BrainCircuit,
  CalendarCheck,
  CalendarRange,
  Briefcase
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Auto redirect if user state loads and is null
  useEffect(() => {
    // If not authenticated (no token or cookies), redirect is handled by middleware.
    // However, if user object loads and is null, we redirect to login to be safe.
    if (!token && !localStorage.getItem("campusgpt_token")) {
      router.push("/login");
    }
  }, [user, token, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying secure academic credentials...</p>
        </div>
      </div>
    );
  }

  // Navigation Links based on role
  const getNavLinks = () => {
    const base = [
      {
        href: `/dashboard/${user.role}`,
        label: "Home Dashboard",
        icon: <Layers className="h-5 w-5" />
      },
      {
        href: "/dashboard/chat",
        label: "AI Chat Assistant",
        icon: <MessageSquare className="h-5 w-5 text-purple-400" />
      },
      {
        href: "/dashboard/documents",
        label: "Document Library",
        icon: <FileText className="h-5 w-5 text-blue-400" />
      },
      {
        href: "/dashboard/notes",
        label: "AI Notes Generator",
        icon: <NotebookPen className="h-5 w-5 text-emerald-400" />
      },
      {
        href: "/dashboard/quiz",
        label: "Quiz Generator",
        icon: <BrainCircuit className="h-5 w-5 text-amber-400" />
      },
      {
        href: "/dashboard/attendance",
        label: "Attendance",
        icon: <CalendarCheck className="h-5 w-5 text-green-400" />
      },
      {
        href: "/dashboard/study-planner",
        label: "Study Planner",
        icon: <CalendarRange className="h-5 w-5 text-rose-400" />
      },
      {
        href: "/dashboard/placement",
        label: "Placement Assistant",
        icon: <Briefcase className="h-5 w-5 text-cyan-400" />
      }
    ];

    if (user.role === "student") {
      return [
        ...base,
        { href: `/dashboard/student/courses`, label: "Course Work", icon: <BookOpen className="h-5 w-5" /> },
      ];
    } else if (user.role === "faculty") {
      return [
        ...base,
        { href: `/dashboard/faculty/grading`, label: "Grade Manager", icon: <GraduationCap className="h-5 w-5" /> },
      ];
    } else if (user.role === "admin") {
      return [
        ...base,
        { href: `/dashboard/admin/users`, label: "Manage Roles", icon: <Shield className="h-5 w-5" /> },
      ];
    }
    return base;
  };

  const navLinks = getNavLinks();

  const notifications = [
    { id: 1, title: "AI Grade Synced", description: "Your homework was graded by AI Assistant.", time: "10m ago" },
    { id: 2, title: "Exam Reminder", description: "CS301 Midterm exam is scheduled in 2 days.", time: "1h ago" },
    { id: 3, title: "Syllabus Generated", description: "Calculus syllabus outline draft is ready.", time: "1d ago" }
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-all duration-300">
      
      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? "80px" : "260px" }}
        className="hidden md:flex flex-col border-r border-border bg-card/40 backdrop-blur-xl relative z-30 overflow-hidden"
      >
        {/* Branding header */}
        <div className="h-16 flex items-center px-4 justify-between border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 font-bold text-white shadow shadow-purple-600/30">
              C
            </div>
            {!sidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent truncate"
              >
                CampusGPT
              </motion.span>
            )}
          </div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 border-b border-border overflow-hidden">
          <div className="flex items-center gap-3 bg-secondary/35 p-3 rounded-xl border border-border/40">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 uppercase">
              {user.full_name ? user.full_name.substring(0, 2) : "US"}
            </div>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <h4 className="text-xs font-bold text-foreground truncate">{user.full_name}</h4>
                <span className="text-[10px] uppercase font-semibold text-purple-400 block mt-0.5 tracking-wider">
                  {user.role} role
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive 
                    ? "bg-purple-600 text-white shadow shadow-purple-600/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {link.icon}
                {!sidebarCollapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {link.label}
                  </motion.span>
                )}
                {/* Active Indicator dots */}
                {isActive && sidebarCollapsed && (
                  <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {!sidebarCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col p-4 md:hidden"
            >
              <div className="flex items-center justify-between pb-6 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 font-bold text-white shadow shadow-purple-600/30">
                    C
                  </div>
                  <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    CampusGPT
                  </span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User capsule */}
              <div className="flex items-center gap-3 bg-secondary/35 p-3 rounded-xl border border-border/40 mb-6">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 uppercase">
                  {user.full_name ? user.full_name.substring(0, 2) : "US"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground truncate">{user.full_name}</h4>
                  <span className="text-[10px] uppercase font-semibold text-purple-400 tracking-wider">
                    {user.role} role
                  </span>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-purple-600 text-white shadow" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border pt-4 space-y-1">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header / Navbar */}
        <header className="h-16 border-b border-border bg-card/10 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-20">
          
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-secondary text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search */}
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search campus files, chats, grades, AI actions..."
                value={searchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl py-2 pl-9 pr-4 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent transition-all"
              />
              {/* Search suggestions dropdown */}
              <AnimatePresence>
                {showSearchSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1.5"
                  >
                    <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Quick Commands</div>
                      <Link href="/dashboard/chat" className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg font-medium text-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Start AI study guide session
                      </Link>
                      <Link href="/dashboard/notes" className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg font-medium text-foreground">
                        <NotebookPen className="h-3.5 w-3.5 text-emerald-400" /> Generate AI notes from documents
                      </Link>
                      <Link href={`/dashboard/${user.role}`} className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg font-medium text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" /> View class calendar schedule
                      </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            
            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="p-2 rounded-xl bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground relative transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" />
              </button>
              
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl p-4 shadow-2xl z-50 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-xs font-bold text-foreground">Academic Notifications</span>
                        <button className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold">Mark all read</button>
                      </div>
                      <div className="space-y-2.5">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-2.5 rounded-xl bg-secondary/25 hover:bg-secondary/45 border border-border/30 transition-all text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-foreground">
                              <span>{notif.title}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">{notif.time}</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{notif.description}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <div className="h-7 w-7 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-xs text-purple-400 uppercase">
                  {user.full_name ? user.full_name.substring(0, 2) : "US"}
                </div>
              </button>
              
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1"
                    >
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="font-bold text-foreground truncate">{user.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      
                      <Link 
                        href={`/dashboard/${user.role}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg font-medium text-foreground"
                      >
                        <User className="h-4 w-4 text-muted-foreground" /> View Profile
                      </Link>
                      
                      <button 
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-red-500/10 text-red-400 rounded-lg font-medium text-left"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
