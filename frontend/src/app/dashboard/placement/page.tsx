"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, Briefcase, Code2, Brain,
  Globe, Plus, Trash2, Eye, Play, RotateCcw, CheckCircle2,
  Loader2, Upload, Sparkles, Clock, Award, Star, ChevronRight,
  AlertCircle, Download, BookOpen, Target, BarChart3,
  X, Save, RefreshCw, ChevronLeft, ChevronDown, ChevronUp,
  GripVertical, Edit3, History, MessageSquare, User,
  Building2, GraduationCap, Lightbulb, Timer,
  BookMarked, ScrollText, Check, ArrowRight
} from "lucide-react";
import * as api from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

const INTERVIEW_TYPES: Record<string, string> = {
  mock: "Mock Interview",
  hr: "HR Interview",
  behavioral: "Behavioral",
  technical: "Technical",
};

const CODING_LANGUAGES = ["python", "javascript", "java", "cpp", "go", "rust"];
const APTITUDE_CATEGORIES = ["quantitative", "logical", "verbal", "data_interpretation"];

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function PlacementAssistantPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"dashboard" | "resume" | "interviews" | "coding" | "aptitude" | "company-questions" | "linkedin">("dashboard");

  // ─── Dashboard ───────────────────────────────────────────
  const [dashData, setDashData] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(true);

  // ─── Resume Builder ──────────────────────────────────────
  const [resumes, setResumes] = useState<api.ResumeInfo[]>([]);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [resumeEditId, setResumeEditId] = useState<string | null>(null);
  const [resumeTitle, setResumeTitle] = useState("");
  const [resumeFullName, setResumeFullName] = useState("");
  const [resumeEmail, setResumeEmail] = useState("");
  const [resumePhone, setResumePhone] = useState("");
  const [resumeLinkedin, setResumeLinkedin] = useState("");
  const [resumePortfolio, setResumePortfolio] = useState("");
  const [resumeAddress, setResumeAddress] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");
  const [resumeSections, setResumeSections] = useState<any[]>([
    { type: "education", title: "Education", items: [""] },
    { type: "experience", title: "Experience", items: [""] },
    { type: "skills", title: "Skills", items: [""] },
  ]);
  const [resumeDelId, setResumeDelId] = useState<string | null>(null);
  const [resumeReviewing, setResumeReviewing] = useState<string | null>(null);
  const [resumeReviewResult, setResumeReviewResult] = useState<any>(null);
  const [showResumeReview, setShowResumeReview] = useState<string | null>(null);
  const [resumeVersions, setResumeVersions] = useState<api.ResumeVersionInfo[]>([]);
  const [showResumeVersions, setShowResumeVersions] = useState<string | null>(null);
  const [savingResume, setSavingResume] = useState(false);

  // ─── Interview Practice ──────────────────────────────────
  const [interviews, setInterviews] = useState<api.InterviewSessionInfo[]>([]);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [intType, setIntType] = useState("mock");
  const [intCompany, setIntCompany] = useState("");
  const [intRole, setIntRole] = useState("");
  const [intDifficulty, setIntDifficulty] = useState("medium");
  const [intGenerating, setIntGenerating] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<api.InterviewSessionInfo | null>(null);
  const [intAnswers, setIntAnswers] = useState<Record<string, string>>({});
  const [intEvaluating, setIntEvaluating] = useState(false);
  const [intEvalResult, setIntEvalResult] = useState<any>(null);

  // ─── Coding Practice ─────────────────────────────────────
  const [codingChallenges, setCodingChallenges] = useState<api.CodingChallengeInfo[]>([]);
  const [showCodingForm, setShowCodingForm] = useState(false);
  const [codingTopic, setCodingTopic] = useState("");
  const [codingDifficulty, setCodingDifficulty] = useState("medium");
  const [codingLang, setCodingLang] = useState("python");
  const [codingGenerating, setCodingGenerating] = useState(false);
  const [currentCoding, setCurrentCoding] = useState<api.CodingChallengeInfo | null>(null);
  const [codingSolution, setCodingSolution] = useState("");
  const [codingSubmitting, setCodingSubmitting] = useState(false);
  const [codingResult, setCodingResult] = useState<any>(null);
  const [codingFilter, setCodingFilter] = useState("");

  // ─── Aptitude Practice ───────────────────────────────────
  const [aptQuestions, setAptQuestions] = useState<api.AptitudeQuestionInfo[]>([]);
  const [aptCategory, setAptCategory] = useState("quantitative");
  const [aptDifficulty, setAptDifficulty] = useState("medium");
  const [aptCount, setAptCount] = useState(10);
  const [aptGenerating, setAptGenerating] = useState(false);
  const [aptAnswers, setAptAnswers] = useState<Record<string, string>>({});
  const [aptSubmitting, setAptSubmitting] = useState(false);
  const [aptResult, setAptResult] = useState<any>(null);
  const [aptTimer, setAptTimer] = useState(0);
  const [aptTimerActive, setAptTimerActive] = useState(false);
  const [aptStarted, setAptStarted] = useState(false);
  const [aptCurrentIdx, setAptCurrentIdx] = useState(0);

  // ─── Company Questions ───────────────────────────────────
  const [companyQs, setCompanyQs] = useState<api.CompanyQuestionInfo[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [cqCompanyFilter, setCqCompanyFilter] = useState("");
  const [showCqForm, setShowCqForm] = useState(false);
  const [cqCompany, setCqCompany] = useState("");
  const [cqRole, setCqRole] = useState("");
  const [cqQuestion, setCqQuestion] = useState("");
  const [cqType, setCqType] = useState("technical");
  const [cqAnswer, setCqAnswer] = useState("");

  // ─── LinkedIn Generator ──────────────────────────────────
  const [linkedinProfile, setLinkedinProfile] = useState<api.LinkedInProfileInfo | null>(null);
  const [liGenerating, setLiGenerating] = useState(false);
  const [liName, setLiName] = useState("");
  const [liCurrentRole, setLiCurrentRole] = useState("");
  const [liExpYears, setLiExpYears] = useState(2);
  const [liSkills, setLiSkills] = useState("");
  const [liGoals, setLiGoals] = useState("");

  // ═══════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (tab === "dashboard") loadDashboard();
    else if (tab === "resume") loadResumes();
    else if (tab === "interviews") loadInterviews();
    else if (tab === "coding") loadCoding();
    else if (tab === "aptitude") { loadAptitude(); }
    else if (tab === "company-questions") loadCompanyQs();
    else if (tab === "linkedin") loadLinkedin();
  }, [tab]);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const data = await api.getPlacementDashboard();
      setDashData(data);
    } catch { /* ignore */ }
    setLoadingDash(false);
  }, []);

  const loadResumes = useCallback(async () => {
    try { setResumes(await api.listResumes()); } catch { /* noop */ }
  }, []);

  const loadInterviews = useCallback(async () => {
    try { setInterviews(await api.listInterviews()); } catch { /* noop */ }
  }, []);

  const loadCoding = useCallback(async () => {
    try { setCodingChallenges(await api.listCodingChallenges()); } catch { /* noop */ }
  }, []);

  const loadAptitude = useCallback(async () => {
    try { setAptQuestions(await api.listAptitudeQuestions()); } catch { /* noop */ }
  }, []);

  const loadCompanyQs = useCallback(async () => {
    try {
      setCompanies(await api.listCompanies());
      setCompanyQs(await api.listCompanyQuestions());
    } catch { /* noop */ }
  }, []);

  const loadLinkedin = useCallback(async () => {
    try { setLinkedinProfile(await api.getLinkedInProfile()); } catch { /* noop */ }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // RESUME HANDLERS
  // ═══════════════════════════════════════════════════════════

  function resetResumeForm() {
    setResumeTitle("");
    setResumeFullName("");
    setResumeEmail("");
    setResumePhone("");
    setResumeLinkedin("");
    setResumePortfolio("");
    setResumeAddress("");
    setResumeSummary("");
    setResumeSections([
      { type: "education", title: "Education", items: [""] },
      { type: "experience", title: "Experience", items: [""] },
      { type: "skills", title: "Skills", items: [""] },
    ]);
    setResumeEditId(null);
  }

  function openEditResume(r: api.ResumeInfo) {
    setResumeEditId(r.id);
    setResumeTitle(r.title);
    setResumeFullName(r.full_name || "");
    setResumeEmail(r.email || "");
    setResumePhone(r.phone || "");
    setResumeLinkedin(r.linkedin || "");
    setResumePortfolio(r.portfolio || "");
    setResumeAddress(r.address || "");
    setResumeSummary(r.summary || "");
    setResumeSections(r.sections?.length ? r.sections : [{ type: "education", title: "Education", items: [""] }]);
    setShowResumeForm(true);
  }

  async function saveResume() {
    setSavingResume(true);
    const payload = {
      title: resumeTitle || "Untitled Resume",
      full_name: resumeFullName,
      email: resumeEmail,
      phone: resumePhone,
      linkedin: resumeLinkedin,
      portfolio: resumePortfolio,
      address: resumeAddress,
      summary: resumeSummary,
      sections: resumeSections,
    };
    try {
      if (resumeEditId) {
        await api.updateResume(resumeEditId, payload);
      } else {
        await api.createResume(payload);
      }
      setShowResumeForm(false);
      resetResumeForm();
      await loadResumes();
    } catch (e: any) { alert(e.message || "Failed to save resume"); }
    setSavingResume(false);
  }

  async function deleteResume(id: string) {
    try {
      await api.deleteResume(id);
      setResumeDelId(null);
      await loadResumes();
    } catch { alert("Failed to delete"); }
  }

  async function reviewResume(id: string) {
    setResumeReviewing(id);
    setResumeReviewResult(null);
    setShowResumeReview(id);
    try {
      const result = await api.reviewResume(id);
      setResumeReviewResult(result);
    } catch { alert("Failed to review resume"); }
    setResumeReviewing(null);
  }

  async function loadVersions(id: string) {
    setShowResumeVersions(id);
    try {
      setResumeVersions(await api.listResumeVersions(id));
    } catch { alert("Failed to load versions"); }
  }

  function addSectionItem(idx: number) {
    setResumeSections((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], items: [...updated[idx].items, ""] };
      return updated;
    });
  }

  function updateSectionItem(sectionIdx: number, itemIdx: number, value: string) {
    setResumeSections((prev) => {
      const updated = [...prev];
      const items = [...updated[sectionIdx].items];
      items[itemIdx] = value;
      updated[sectionIdx] = { ...updated[sectionIdx], items };
      return updated;
    });
  }

  function removeSectionItem(sectionIdx: number, itemIdx: number) {
    setResumeSections((prev) => {
      const updated = [...prev];
      const items = updated[sectionIdx].items.filter((_: any, i: number) => i !== itemIdx);
      updated[sectionIdx] = { ...updated[sectionIdx], items };
      return updated;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // INTERVIEW HANDLERS
  // ═══════════════════════════════════════════════════════════

  async function generateInterview() {
    setIntGenerating(true);
    try {
      const session = await api.generateInterview({
        interview_type: intType,
        company: intCompany || undefined,
        role: intRole || undefined,
        difficulty: intDifficulty,
        question_count: 5,
      });
      setCurrentInterview(session);
      setShowInterviewForm(false);
      setIntAnswers({});
      setIntEvalResult(null);
      await loadInterviews();
    } catch (e: any) { alert(e.message || "Failed to generate interview"); }
    setIntGenerating(false);
  }

  async function startInterview(session: api.InterviewSessionInfo) {
    setCurrentInterview(session);
    setIntAnswers({});
    setIntEvalResult(null);
  }

  async function evaluateInterviewSession() {
    if (!currentInterview) return;
    setIntEvaluating(true);
    try {
      const result = await api.evaluateInterview(currentInterview.id);
      setIntEvalResult(result);
      setCurrentInterview((prev) => prev ? { ...prev, status: "completed", score: result.overall_score, feedback: result.feedback } : prev);
      await loadInterviews();
    } catch (e: any) { alert(e.message || "Failed to evaluate"); }
    setIntEvaluating(false);
  }

  // ═══════════════════════════════════════════════════════════
  // CODING HANDLERS
  // ═══════════════════════════════════════════════════════════

  async function generateCoding() {
    setCodingGenerating(true);
    try {
      const challenge = await api.generateCodingChallenge({
        topic: codingTopic || undefined,
        difficulty: codingDifficulty,
        language: codingLang,
      });
      setCurrentCoding(challenge);
      setShowCodingForm(false);
      setCodingSolution("");
      setCodingResult(null);
      await loadCoding();
    } catch (e: any) { alert(e.message || "Failed to generate coding challenge"); }
    setCodingGenerating(false);
  }

  async function submitCoding() {
    if (!currentCoding) return;
    setCodingSubmitting(true);
    try {
      const result = await api.submitCodingSolution(currentCoding.id, {
        solution: codingSolution,
        language: currentCoding.language || "python",
      });
      setCodingResult(result);
      setCurrentCoding((prev) => prev ? { ...prev, status: "completed", score: result.score, feedback: result.feedback } : prev);
      await loadCoding();
    } catch (e: any) { alert(e.message || "Failed to submit"); }
    setCodingSubmitting(false);
  }

  function openCoding(challenge: api.CodingChallengeInfo) {
    setCurrentCoding(challenge);
    setCodingSolution(challenge.starter_code || "");
    setCodingResult(null);
  }

  // ═══════════════════════════════════════════════════════════
  // APTITUDE HANDLERS
  // ═══════════════════════════════════════════════════════════

  async function generateAptitude() {
    setAptGenerating(true);
    try {
      const questions = await api.generateAptitudeQuestions(aptCategory, aptDifficulty, aptCount);
      setAptQuestions(questions);
      setAptAnswers({});
      setAptResult(null);
      setAptCurrentIdx(0);
      setAptStarted(true);
      setAptTimer(0);
      setAptTimerActive(true);
    } catch (e: any) { alert(e.message || "Failed to generate aptitude questions"); }
    setAptGenerating(false);
  }

  useEffect(() => {
    let interval: any;
    if (aptTimerActive) {
      interval = setInterval(() => setAptTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [aptTimerActive]);

  async function submitAptitude() {
    setAptSubmitting(true);
    setAptTimerActive(false);
    try {
      let correct = 0;
      let total = aptQuestions.length;
      for (const q of aptQuestions) {
        const ans = aptAnswers[q.id];
        if (ans) {
          await api.submitAptitudeAnswer({ question_id: q.id, answer: ans, time_taken: aptTimer });
        } else {
          await api.submitAptitudeAnswer({ question_id: q.id, answer: "", time_taken: aptTimer });
        }
        const updatedQs = await api.listAptitudeQuestions();
        const updatedQ = updatedQs.find((uq) => uq.id === q.id);
        if (updatedQ?.is_correct === "true") correct++;
      }
      setAptResult({ score: correct, total, correct, percentage: Math.round((correct / total) * 100), time_taken: aptTimer });
      await loadAptitude();
    } catch (e: any) { alert(e.message || "Failed to submit"); }
    setAptSubmitting(false);
  }

  // ═══════════════════════════════════════════════════════════
  // COMPANY QUESTIONS HANDLERS
  // ═══════════════════════════════════════════════════════════

  async function saveCompanyQ() {
    try {
      await api.createCompanyQuestion({
        company: cqCompany,
        role: cqRole || undefined,
        question_text: cqQuestion,
        question_type: cqType,
        answer: cqAnswer || undefined,
      });
      setShowCqForm(false);
      setCqCompany("");
      setCqRole("");
      setCqQuestion("");
      setCqType("technical");
      setCqAnswer("");
      await loadCompanyQs();
    } catch (e: any) { alert(e.message || "Failed to save"); }
  }

  // ═══════════════════════════════════════════════════════════
  // LINKEDIN HANDLERS
  // ═══════════════════════════════════════════════════════════

  async function generateLinkedIn() {
    setLiGenerating(true);
    try {
      const profile = await api.generateLinkedIn({
        name: liName,
        current_role: liCurrentRole,
        years_of_experience: liExpYears,
        skills: liSkills.split(",").map((s) => s.trim()).filter(Boolean),
        career_goals: liGoals,
      });
      setLinkedinProfile(profile);
    } catch (e: any) { alert(e.message || "Failed to generate LinkedIn profile"); }
    setLiGenerating(false);
  }

  // ═══════════════════════════════════════════════════════════
  // NAV BUTTONS
  // ═══════════════════════════════════════════════════════════

  const tabs: { id: typeof tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "resume", label: "Resume Builder", icon: <FileText className="h-4 w-4" /> },
    { id: "interviews", label: "Interviews", icon: <Briefcase className="h-4 w-4" /> },
    { id: "coding", label: "Coding", icon: <Code2 className="h-4 w-4" /> },
    { id: "aptitude", label: "Aptitude", icon: <Brain className="h-4 w-4" /> },
    { id: "company-questions", label: "Company Q", icon: <Building2 className="h-4 w-4" /> },
    { id: "linkedin", label: "LinkedIn", icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] to-[#141b2d] p-4 md:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-cyan-400" />
          Placement Assistant
        </h1>
        <p className="text-gray-400 mt-1 ml-11">AI-powered placement preparation toolkit</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700/50 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t.id
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
            )}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* DASHBOARD TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "dashboard" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          {loadingDash ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-cyan-400 animate-spin" /></div>
          ) : dashData ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Resumes", value: dashData.resume_count || 0, icon: <FileText className="h-5 w-5" />, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400" },
                  { label: "Interviews", value: dashData.interview_count || 0, icon: <Briefcase className="h-5 w-5" />, color: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400" },
                  { label: "Coding Challenges", value: dashData.coding_count || 0, icon: <Code2 className="h-5 w-5" />, color: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400" },
                  { label: "Aptitude Qs", value: dashData.aptitude_count || 0, icon: <Brain className="h-5 w-5" />, color: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-gradient-to-br ${s.color} rounded-xl border p-5`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm opacity-80">{s.label}</span>
                      {s.icon}
                    </div>
                    <div className="text-3xl font-bold">{s.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-cyan-400" /> Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Build Resume", action: () => { setTab("resume"); setTimeout(() => setShowResumeForm(true), 100); }, icon: <FileText className="h-5 w-5" />, color: "hover:border-blue-500/30 hover:bg-blue-500/5" },
                    { label: "Practice Interview", action: () => { setTab("interviews"); setTimeout(() => setShowInterviewForm(true), 100); }, icon: <Briefcase className="h-5 w-5" />, color: "hover:border-purple-500/30 hover:bg-purple-500/5" },
                    { label: "Coding Challenge", action: () => { setTab("coding"); setTimeout(() => setShowCodingForm(true), 100); }, icon: <Code2 className="h-5 w-5" />, color: "hover:border-green-500/30 hover:bg-green-500/5" },
                    { label: "Aptitude Test", action: () => setTab("aptitude"), icon: <Brain className="h-5 w-5" />, color: "hover:border-amber-500/30 hover:bg-amber-500/5" },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={a.action}
                      className={`flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-700/30 bg-[#1e2740] text-gray-300 ${a.color} transition-all`}
                    >
                      {a.icon}
                      <span className="text-sm font-medium">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Items */}
              {(dashData.recent_interviews?.length > 0 || dashData.recent_coding?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashData.recent_interviews?.length > 0 && (
                    <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-purple-400" /> Recent Interviews</h3>
                      <div className="space-y-2">
                        {dashData.recent_interviews.slice(0, 5).map((iv: any) => (
                          <div key={iv.id} className="flex items-center justify-between text-sm text-gray-400">
                            <span>{INTERVIEW_TYPES[iv.interview_type] || iv.interview_type}{iv.company ? ` @ ${iv.company}` : ""}</span>
                            <span className={cn("px-2 py-0.5 rounded text-xs", iv.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400")}>{iv.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {dashData.recent_coding?.length > 0 && (
                    <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Code2 className="h-4 w-4 text-green-400" /> Recent Coding</h3>
                      <div className="space-y-2">
                        {dashData.recent_coding.slice(0, 5).map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between text-sm text-gray-400">
                            <span>{c.title}</span>
                            <span className={cn("px-2 py-0.5 rounded text-xs", DIFFICULTY_COLORS[c.difficulty] || "")}>{c.difficulty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Could not load dashboard data</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* RESUME BUILDER TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "resume" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-400" /> My Resumes</h2>
            <button
              onClick={() => { resetResumeForm(); setShowResumeForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-all text-sm"
            >
              <Plus className="h-4 w-4" /> New Resume
            </button>
          </div>

          {showResumeForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">{resumeEditId ? "Edit Resume" : "Create Resume"}</h3>
                <button onClick={() => { setShowResumeForm(false); resetResumeForm(); }} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title</label>
                  <input value={resumeTitle} onChange={(e) => setResumeTitle(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  <input value={resumeFullName} onChange={(e) => setResumeFullName(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input value={resumeEmail} onChange={(e) => setResumeEmail(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone</label>
                  <input value={resumePhone} onChange={(e) => setResumePhone(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">LinkedIn URL</label>
                  <input value={resumeLinkedin} onChange={(e) => setResumeLinkedin(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Portfolio URL</label>
                  <input value={resumePortfolio} onChange={(e) => setResumePortfolio(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Address</label>
                  <input value={resumeAddress} onChange={(e) => setResumeAddress(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Professional Summary</label>
                  <textarea value={resumeSummary} onChange={(e) => setResumeSummary(e.target.value)} rows={3} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none" />
                </div>
              </div>

              {/* Sections */}
              <h4 className="text-sm font-medium text-gray-300 mb-3">Resume Sections</h4>
              {resumeSections.map((section, sIdx) => (
                <div key={sIdx} className="bg-[#0d1425] rounded-lg border border-gray-700/50 p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      value={section.title}
                      onChange={(e) => setResumeSections((prev) => {
                        const updated = [...prev];
                        updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                        return updated;
                      })}
                      className="bg-transparent border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                    <span className="text-xs text-gray-500 uppercase">{section.type}</span>
                  </div>
                  {section.items.map((item: string, iIdx: number) => (
                    <div key={iIdx} className="flex items-center gap-2 mb-1">
                      <input
                        value={item}
                        onChange={(e) => updateSectionItem(sIdx, iIdx, e.target.value)}
                        placeholder="Enter detail..."
                        className="flex-1 bg-[#1a2236] border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                      />
                      {section.items.length > 1 && (
                        <button onClick={() => removeSectionItem(sIdx, iIdx)} className="text-red-400 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addSectionItem(sIdx)} className="text-xs text-cyan-400 hover:text-cyan-300 mt-2">+ Add item</button>
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => { setShowResumeForm(false); resetResumeForm(); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={saveResume} disabled={savingResume} className="flex items-center gap-2 px-5 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-all text-sm disabled:opacity-50">
                  {savingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {resumeEditId ? "Update" : "Create"} Resume
                </button>
              </div>
            </motion.div>
          )}

          {/* Resume List */}
          <div className="space-y-3">
            {resumes.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No resumes yet. Create your first resume!</p>
              </div>
            ) : (
              resumes.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{r.title}</h3>
                        <span className={cn("px-2 py-0.5 rounded text-xs", STATUS_COLORS[r.is_active === "true" ? "active" : "draft"])}>
                          {r.is_active === "true" ? "Active" : "Draft"}
                        </span>
                      </div>
                      {r.full_name && <p className="text-sm text-gray-400">{r.full_name}{r.email ? ` — ${r.email}` : ""}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>ATS: {r.ats_score}/100</span>
                        <span>Versions: {r.version_count}</span>
                        <span>Updated: {formatDate(r.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { resetResumeForm(); openEditResume(r); }} className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title="Edit"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => reviewResume(r.id)} disabled={resumeReviewing === r.id} className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all" title="ATS Review">
                        {resumeReviewing === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                      </button>
                      <button onClick={() => loadVersions(r.id)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Versions"><History className="h-4 w-4" /></button>
                      <button onClick={() => setResumeDelId(r.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {/* ATS Review */}
                  {showResumeReview === r.id && resumeReviewResult && (
                    <div className="mt-4 bg-[#0d1425] rounded-lg border border-purple-500/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">ATS Review — Score: {resumeReviewResult.ats_score}/100</span>
                      </div>
                      <p className="text-xs text-gray-400 whitespace-pre-wrap">{resumeReviewResult.feedback}</p>
                    </div>
                  )}

                  {/* Versions */}
                  {showResumeVersions === r.id && (
                    <div className="mt-4 bg-[#0d1425] rounded-lg border border-blue-500/20 p-4">
                      <h4 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2"><History className="h-4 w-4" /> Version History</h4>
                      {resumeVersions.length === 0 ? (
                        <p className="text-xs text-gray-500">No versions found</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {resumeVersions.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-xs text-gray-400 bg-[#1a2236] rounded px-3 py-2">
                              <span>v{v.version_number} — {v.title || "Untitled"}</span>
                              <span>ATS: {v.ats_score} — {formatDate(v.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete Confirmation */}
                  {resumeDelId === r.id && (
                    <div className="mt-3 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-300 flex-1">Delete this resume?</span>
                      <button onClick={() => deleteResume(r.id)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30">Delete</button>
                      <button onClick={() => setResumeDelId(null)} className="px-3 py-1 text-gray-400 rounded text-xs hover:text-white">Cancel</button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* INTERVIEWS TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "interviews" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {currentInterview ? (
            <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  {INTERVIEW_TYPES[currentInterview.interview_type]} Interview
                  {currentInterview.company && <span className="text-sm text-gray-400">@ {currentInterview.company}</span>}
                </h3>
                <button onClick={() => { setCurrentInterview(null); setIntEvalResult(null); }} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              {currentInterview.status === "completed" && intEvalResult ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center min-w-[120px]">
                      <div className="text-3xl font-bold text-purple-300">{intEvalResult.overall_score || currentInterview.score}/100</div>
                      <div className="text-xs text-gray-400 mt-1">Overall Score</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{intEvalResult.feedback || currentInterview.feedback}</p>
                    </div>
                  </div>
                  {intEvalResult.question_scores && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Question Scores</h4>
                      {intEvalResult.question_scores.map((qs: any, i: number) => (
                        <div key={i} className="bg-[#0d1425] rounded-lg border border-gray-700/30 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{qs.question}</span>
                            <span className="text-purple-300 font-medium">{qs.score}/10</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{qs.feedback}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setCurrentInterview(null); setIntEvalResult(null); }} className="mt-4 px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg">Back to list</button>
                </div>
              ) : (
                <div>
                  {currentInterview.questions?.map((q: any, i: number) => (
                    <div key={q.id || i} className="mb-4 bg-[#0d1425] rounded-lg border border-gray-700/30 p-4">
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="text-purple-400 font-medium">Q{i + 1}.</span> {q.question_text || q.question}
                      </p>
                      {q.options && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {q.options.map((opt: string, oi: number) => (
                            <button
                              key={oi}
                              onClick={() => setIntAnswers((prev) => ({ ...prev, [q.id || `q${i}`]: opt }))}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs border transition-all",
                                intAnswers[q.id || `q${i}`] === opt
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                  : "bg-[#1a2236] text-gray-400 border-gray-700 hover:border-gray-600"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      {!q.options && (
                        <textarea
                          value={intAnswers[q.id || `q${i}`] || ""}
                          onChange={(e) => setIntAnswers((prev) => ({ ...prev, [q.id || `q${i}`]: e.target.value }))}
                          placeholder="Type your answer..."
                          rows={3}
                          className="w-full bg-[#1a2236] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={evaluateInterviewSession}
                    disabled={intEvaluating}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                  >
                    {intEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Submit & Evaluate All Answers
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-400" /> Interview Practice</h2>
                <button
                  onClick={() => setShowInterviewForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all text-sm"
                >
                  <Sparkles className="h-4 w-4" /> New Interview
                </button>
              </div>

              {showInterviewForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Generate Interview</h3>
                    <button onClick={() => setShowInterviewForm(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Interview Type</label>
                      <select value={intType} onChange={(e) => setIntType(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50">
                        <option value="mock">Mock Interview</option>
                        <option value="hr">HR Interview</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                      <select value={intDifficulty} onChange={(e) => setIntDifficulty(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Company (optional)</label>
                      <input value={intCompany} onChange={(e) => setIntCompany(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" placeholder="e.g. Google" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Role (optional)</label>
                      <input value={intRole} onChange={(e) => setIntRole(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" placeholder="e.g. SDE" />
                    </div>
                  </div>
                  <button onClick={generateInterview} disabled={intGenerating} className="flex items-center gap-2 px-5 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-50">
                    {intGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate Interview
                  </button>
                </motion.div>
              )}

              <div className="space-y-3">
                {interviews.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No interviews yet. Start a practice session!</p>
                  </div>
                ) : (
                  interviews.map((iv) => (
                    <motion.div key={iv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white">{INTERVIEW_TYPES[iv.interview_type] || iv.interview_type}</h3>
                            <span className={cn("px-2 py-0.5 rounded text-xs", DIFFICULTY_COLORS[iv.difficulty])}>{iv.difficulty}</span>
                            <span className={cn("px-2 py-0.5 rounded text-xs", STATUS_COLORS[iv.status === "completed" ? "completed" : "active"])}>{iv.status}</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {iv.company ? `@ ${iv.company} ` : ""}{iv.role ? `— ${iv.role}` : ""}
                            {iv.score != null ? ` | Score: ${iv.score}/100` : ""}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{iv.question_count} questions</span>
                            <span>Started: {formatDate(iv.started_at)}</span>
                          </div>
                        </div>
                        {iv.status !== "completed" && (
                          <button onClick={() => startInterview(iv)} className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all text-sm">
                            <Play className="h-4 w-4" /> Continue
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* CODING TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "coding" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {currentCoding ? (
            <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-green-400" />
                    {currentCoding.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("px-2 py-0.5 rounded text-xs", DIFFICULTY_COLORS[currentCoding.difficulty])}>{currentCoding.difficulty}</span>
                    <span className="text-xs text-gray-400">{currentCoding.language} | {currentCoding.topic}</span>
                  </div>
                </div>
                <button onClick={() => { setCurrentCoding(null); setCodingResult(null); }} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="bg-[#0d1425] rounded-lg border border-gray-700/30 p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Problem Description</h4>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{currentCoding.description}</p>
                {currentCoding.starter_code && (
                  <pre className="mt-3 bg-[#1a2236] rounded-lg p-3 text-xs text-gray-300 overflow-x-auto"><code>{currentCoding.starter_code}</code></pre>
                )}
              </div>

              {currentCoding.status === "completed" && codingResult ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center min-w-[120px]">
                      <div className="text-3xl font-bold text-green-300">{codingResult.score || currentCoding.score}/100</div>
                      <div className="text-xs text-gray-400 mt-1">Score</div>
                    </div>
                    <div className="flex-1">
                      {codingResult.test_cases && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-400">Test Cases: {codingResult.test_cases.passed}/{codingResult.test_cases.total}</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{codingResult.feedback || currentCoding.feedback}</p>
                    </div>
                  </div>
                  <button onClick={() => { setCurrentCoding(null); setCodingResult(null); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg">Back to list</button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Solution ({currentCoding.language || "python"})</label>
                  <textarea
                    value={codingSolution}
                    onChange={(e) => setCodingSolution(e.target.value)}
                    rows={12}
                    className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-green-500/50 resize-none"
                    placeholder="Write your code here..."
                  />
                  <button
                    onClick={submitCoding}
                    disabled={codingSubmitting || !codingSolution.trim()}
                    className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                  >
                    {codingSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Submit Solution
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Code2 className="h-5 w-5 text-green-400" /> Coding Practice</h2>
                <button
                  onClick={() => setShowCodingForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all text-sm"
                >
                  <Sparkles className="h-4 w-4" /> Generate Challenge
                </button>
              </div>

              {showCodingForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Generate Coding Challenge</h3>
                    <button onClick={() => setShowCodingForm(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Topic</label>
                      <input value={codingTopic} onChange={(e) => setCodingTopic(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50" placeholder="e.g. arrays, dp" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                      <select value={codingDifficulty} onChange={(e) => setCodingDifficulty(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Language</label>
                      <select value={codingLang} onChange={(e) => setCodingLang(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50">
                        {CODING_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={generateCoding} disabled={codingGenerating} className="flex items-center gap-2 px-5 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all text-sm disabled:opacity-50">
                    {codingGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate Challenge
                  </button>
                </motion.div>
              )}

              <div className="space-y-3">
                {codingChallenges.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Code2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No coding challenges yet. Generate one to start practicing!</p>
                  </div>
                ) : (
                  codingChallenges.map((c) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white">{c.title}</h3>
                            <span className={cn("px-2 py-0.5 rounded text-xs", DIFFICULTY_COLORS[c.difficulty])}>{c.difficulty}</span>
                            <span className={cn("px-2 py-0.5 rounded text-xs", STATUS_COLORS[c.status === "completed" ? "completed" : "active"])}>{c.status}</span>
                          </div>
                          <p className="text-sm text-gray-400">{c.language}{c.topic ? ` | ${c.topic}` : ""}{c.score != null ? ` | Score: ${c.score}/100` : ""}</p>
                          <p className="text-xs text-gray-500 mt-1">{c.description?.slice(0, 120)}...</p>
                        </div>
                        <button onClick={() => openCoding(c)} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all text-sm">
                          {c.status === "completed" ? <Eye className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {c.status === "completed" ? "View" : "Solve"}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* APTITUDE TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "aptitude" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {aptStarted && aptQuestions.length > 0 ? (
            <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
              {/* Timer & Progress */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-300 font-mono">{Math.floor(aptTimer / 60)}:{String(aptTimer % 60).padStart(2, "0")}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Question {aptCurrentIdx + 1} of {aptQuestions.length}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aptQuestions.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-3 h-3 rounded-full border transition-all cursor-pointer",
                        i === aptCurrentIdx ? "bg-amber-400 border-amber-400 scale-125" : aptAnswers[aptQuestions[i].id] ? "bg-green-500/50 border-green-500" : "bg-gray-700 border-gray-600"
                      )}
                      onClick={() => setAptCurrentIdx(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="bg-[#0d1425] rounded-lg border border-gray-700/30 p-6 mb-6">
                <p className="text-lg text-white mb-4">{aptQuestions[aptCurrentIdx].question_text}</p>
                {aptQuestions[aptCurrentIdx].options?.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAptAnswers((prev) => ({ ...prev, [aptQuestions[aptCurrentIdx].id]: opt }))}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg mb-2 border text-sm transition-all",
                      aptAnswers[aptQuestions[aptCurrentIdx].id] === opt
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-[#1a2236] text-gray-400 border-gray-700 hover:border-gray-600"
                    )}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setAptCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={aptCurrentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                {aptCurrentIdx < aptQuestions.length - 1 ? (
                  <button
                    onClick={() => setAptCurrentIdx((i) => i + 1)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submitAptitude}
                    disabled={aptSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-50"
                  >
                    {aptSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Submit All Answers
                  </button>
                )}
              </div>

              {/* Results */}
              {aptResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/20 rounded-full p-3">
                      <Award className="h-8 w-8 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Aptitude Results</h3>
                      <p className="text-sm text-gray-400">You scored {aptResult.correct} out of {aptResult.total} ({aptResult.percentage}%)</p>
                      <p className="text-xs text-gray-500 mt-1">Time taken: {Math.floor(aptResult.time_taken / 60)}m {aptResult.time_taken % 60}s</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Brain className="h-5 w-5 text-amber-400" /> Aptitude Practice</h2>
              </div>

              <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6 max-w-lg">
                <h3 className="font-semibold text-white mb-4">Start Practice Session</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Category</label>
                    <select value={aptCategory} onChange={(e) => setAptCategory(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50">
                      <option value="quantitative">Quantitative Aptitude</option>
                      <option value="logical">Logical Reasoning</option>
                      <option value="verbal">Verbal Ability</option>
                      <option value="data_interpretation">Data Interpretation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                    <select value={aptDifficulty} onChange={(e) => setAptDifficulty(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Number of Questions</label>
                    <select value={aptCount} onChange={(e) => setAptCount(Number(e.target.value))} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <button
                    onClick={generateAptitude}
                    disabled={aptGenerating}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-50"
                  >
                    {aptGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    Start Practice
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* COMPANY QUESTIONS TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "company-questions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-400" /> Company Questions</h2>
            <button
              onClick={() => setShowCqForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm"
            >
              <Plus className="h-4 w-4" /> Add Question
            </button>
          </div>

          {/* Company Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCqCompanyFilter("")}
              className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all", !cqCompanyFilter ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-[#1a2236] text-gray-400 border-gray-700 hover:border-gray-600")}
            >
              All
            </button>
            {companies.map((c) => (
              <button
                key={c}
                onClick={() => setCqCompanyFilter(c)}
                className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all", cqCompanyFilter === c ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-[#1a2236] text-gray-400 border-gray-700 hover:border-gray-600")}
              >
                {c}
              </button>
            ))}
          </div>

          {showCqForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Add Question</h3>
                <button onClick={() => setShowCqForm(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Company</label>
                  <input value={cqCompany} onChange={(e) => setCqCompany(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role</label>
                  <input value={cqRole} onChange={(e) => setCqRole(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select value={cqType} onChange={(e) => setCqType(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="aptitude">Aptitude</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Question</label>
                  <textarea value={cqQuestion} onChange={(e) => setCqQuestion(e.target.value)} rows={2} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Answer (optional)</label>
                  <textarea value={cqAnswer} onChange={(e) => setCqAnswer(e.target.value)} rows={3} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
                </div>
              </div>
              <button onClick={saveCompanyQ} className="flex items-center gap-2 px-5 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm">
                <Save className="h-4 w-4" /> Save Question
              </button>
            </motion.div>
          )}

          <div className="space-y-3">
            {companyQs.filter((q) => !cqCompanyFilter || q.company === cqCompanyFilter).length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No questions yet. Add company-specific questions!</p>
              </div>
            ) : (
              companyQs.filter((q) => !cqCompanyFilter || q.company === cqCompanyFilter).map((q) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">{q.company}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-400">{q.question_type}</span>
                        {q.role && <span className="text-xs text-gray-500">{q.role}</span>}
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{q.question_text}</p>
                      {q.answer && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-400 cursor-pointer">View Answer</summary>
                          <p className="text-xs text-gray-400 mt-1 p-2 bg-[#0d1425] rounded">{q.answer}</p>
                        </details>
                      )}
                    </div>
                    <button onClick={() => api.deleteCompanyQuestion(q.id).then(loadCompanyQs)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* LINKEDIN TAB */}
      {/* ───────────────────────────────────────────────────── */}
      {tab === "linkedin" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Globe className="h-5 w-5 text-blue-400" /> LinkedIn Profile Generator</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
              <h3 className="font-semibold text-white mb-4">Generate AI-Powered Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  <input value={liName} onChange={(e) => setLiName(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Current Role</label>
                  <input value={liCurrentRole} onChange={(e) => setLiCurrentRole(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Years of Experience</label>
                  <input type="number" value={liExpYears} onChange={(e) => setLiExpYears(Number(e.target.value))} min={0} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Skills (comma separated)</label>
                  <input value={liSkills} onChange={(e) => setLiSkills(e.target.value)} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="Python, React, Machine Learning" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Career Goals</label>
                  <textarea value={liGoals} onChange={(e) => setLiGoals(e.target.value)} rows={3} className="w-full bg-[#0d1425] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none" placeholder="Looking for SDE roles at top tech companies..." />
                </div>
                <button
                  onClick={generateLinkedIn}
                  disabled={liGenerating || !liName}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                >
                  {liGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Profile
                </button>
              </div>
            </div>

            {/* Generated Profile */}
            <div className="bg-[#1a2236] rounded-xl border border-gray-700/50 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-blue-400" /> Profile Preview</h3>
              {linkedinProfile ? (
                <div className="space-y-4">
                  <div className="bg-[#0d1425] rounded-lg border border-gray-700/30 p-4">
                    <p className="text-lg font-semibold text-white">{liName || "Your Name"}</p>
                    <p className="text-sm text-blue-300">{linkedinProfile.headline}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About</h4>
                    <p className="text-sm text-gray-300">{linkedinProfile.about}</p>
                  </div>
                  {linkedinProfile.experience?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Experience</h4>
                      {linkedinProfile.experience.map((exp: any, i: number) => (
                        <div key={i} className="bg-[#0d1425] rounded-lg p-3 mb-2">
                          <p className="text-sm font-medium text-white">{exp.title} @ {exp.company}</p>
                          <p className="text-xs text-gray-400">{exp.duration}</p>
                          <p className="text-xs text-gray-500 mt-1">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {linkedinProfile.skills?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {linkedinProfile.skills.map((s: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-xs border border-blue-500/20">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {linkedinProfile.education?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Education</h4>
                      {linkedinProfile.education.map((edu: any, i: number) => (
                        <div key={i} className="text-sm text-gray-300">{edu.school || edu.institution} — {edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Generated: {formatDateTime(linkedinProfile.created_at)}</p>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Fill in your details and generate an AI-powered LinkedIn profile</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
