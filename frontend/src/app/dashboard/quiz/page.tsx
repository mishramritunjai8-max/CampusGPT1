"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks, CheckCircle, Type, MessageSquareText, Code,
  Sparkles, Clock, Trophy, BarChart3, Award, Zap, Brain,
  ChevronLeft, ChevronRight, Loader2, Check, X, AlertCircle,
  Flag, Play, RotateCcw, Trash2, Search, FileText,
  Timer, Shield, Target, Percent, BookOpen, Users,
} from "lucide-react";
import * as api from "@/lib/api";

const ICONS: Record<string, React.ReactNode> = {
  ListChecks: <ListChecks className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Type: <Type className="h-5 w-5" />,
  MessageSquareText: <MessageSquareText className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
};

const QTYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill in the Blanks",
  short_answer: "Short Answer",
  coding: "Coding",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeStr(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function QuizPage() {
  const { user } = useAuth();

  // View state: config | taking | results | history
  const [view, setView] = useState<"config" | "taking" | "results" | "history">("config");

  // Config state
  const [documents, setDocuments] = useState<api.DocumentInfo[]>([]);
  const [quizConfig, setQuizConfig] = useState<api.QuizConfig | null>(null);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(0);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Taking state
  const [session, setSession] = useState<api.QuizSessionData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const qStartRef = useRef(Date.now());

  // Results state
  const [result, setResult] = useState<api.QuizResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<api.LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // History state
  const [history, setHistory] = useState<api.QuizSessionBrief[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    api.getQuizConfig().then(setQuizConfig).catch(() => {});
    api.listDocuments().then(setDocuments).catch(() => {});
  }, []);

  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmitQuiz();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleGenerate = async () => {
    if (!selectedDoc || selectedTypes.length === 0) return;
    setGenerating(true);
    try {
      const s = await api.generateQuiz({
        document_id: selectedDoc,
        question_types: selectedTypes,
        difficulty,
        num_questions: numQuestions,
        time_limit: timeLimit,
        negative_marking: negativeMarking,
      });
      setSession(s);
      setAnswers({});
      setQuestionTimes({});
      setCurrentQ(0);
      setTimeRemaining(timeLimit * 60);
      setTimerActive(timeLimit > 0);
      qStartRef.current = Date.now();
      setView("taking");
    } catch (err: any) {
      alert("Failed to generate quiz: " + err.message);
    }
    setGenerating(false);
  };

  const handleAnswer = (qId: string, answer: string) => {
    const elapsed = Math.floor((Date.now() - qStartRef.current) / 1000);
    setQuestionTimes((prev) => ({ ...prev, [qId]: (prev[qId] || 0) + elapsed }));
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
    qStartRef.current = Date.now();
  };

  const goNext = () => {
    if (session && currentQ < session.questions.length - 1) {
      setCurrentQ((p) => p + 1);
      qStartRef.current = Date.now();
    }
  };
  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
      qStartRef.current = Date.now();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);

    try {
      const ansList = session.questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
        time_taken: questionTimes[q.id] || 0,
      }));
      const r = await api.submitQuiz(session.id, ansList);
      setResult(r);
      try {
        const lb = await api.getLeaderboard(session.id);
        setLeaderboard(lb);
      } catch {}
      setView("results");
    } catch (err: any) {
      alert("Submit failed: " + err.message);
    }
    setSubmitting(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.listQuizSessions();
      setHistory(data);
    } catch {}
    setHistoryLoading(false);
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await api.deleteQuizSession(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {}
    setDeleteConfirm(null);
  };

  const retakeQuiz = () => {
    setView("config");
    setSession(null);
    setResult(null);
    setLeaderboard([]);
  };

  const q = session?.questions[currentQ];
  const progress = session ? ((currentQ + 1) / session.questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      {view !== "taking" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Quiz Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create and take AI-powered quizzes from your documents</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
            <button onClick={() => setView("config")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "config" ? "bg-amber-600 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
              <Sparkles className="h-4 w-4 inline mr-1.5" />Create
            </button>
            <button onClick={() => { loadHistory(); setView("history"); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "history" ? "bg-amber-600 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
              <BarChart3 className="h-4 w-4 inline mr-1.5" />History
            </button>
          </div>
        </div>
      )}

      {view === "taking" && session && (
        <div className="space-y-4">
          {/* Timer bar */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <span className="text-sm font-bold text-foreground">{session.title}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  Q{currentQ + 1}/{session.questions.length}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-green-400" /> {answeredCount}/{session.questions.length}
              </span>
              {timeLimit > 0 && (
                <span className={`flex items-center gap-1.5 text-sm font-bold ${timeRemaining < 60 ? "text-red-400" : "text-foreground"}`}>
                  <Clock className="h-4 w-4" />{timeStr(timeRemaining)}
                </span>
              )}
              <button onClick={handleSubmitQuiz} disabled={submitting} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          {/* Question card */}
          {q && (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Question header */}
              <div className="px-6 py-4 border-b border-border bg-secondary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-600/10 text-amber-400 font-bold text-sm">{currentQ + 1}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-600/10 text-amber-400 font-medium">{QTYPE_LABELS[q.question_type] || q.question_type}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-full bg-secondary/50">{q.difficulty}</span>
                  <span className="px-2 py-1 rounded-full bg-secondary/50">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
                  {q.topic && <span className="px-2 py-1 rounded-full bg-secondary/50">{q.topic}</span>}
                </div>
              </div>

              {/* Question text */}
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{q.question_text}</p>
              </div>

              {/* Answer area */}
              <div className="px-6 pb-6 space-y-2">
                {(q.question_type === "mcq" && q.options) && q.options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(q.id, opt.charAt(0))}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm text-left transition-all border ${
                      answers[q.id] === opt.charAt(0)
                        ? "bg-amber-600/10 border-amber-500/50 text-foreground"
                        : "bg-secondary/20 border-border hover:bg-secondary/40"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      answers[q.id] === opt.charAt(0) ? "bg-amber-600 text-white" : "bg-secondary text-muted-foreground"
                    }`}>{opt.charAt(0)}</span>
                    <span>{opt.slice(3)}</span>
                  </button>
                ))}

                {q.question_type === "true_false" && (
                  <div className="flex gap-3">
                    {["True", "False"].map((opt) => (
                      <button key={opt} onClick={() => handleAnswer(q.id, opt)}
                        className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl text-sm font-medium transition-all border ${
                          answers[q.id] === opt ? "bg-amber-600/10 border-amber-500/50 text-foreground" : "bg-secondary/20 border-border hover:bg-secondary/40"
                        }`}
                      >
                        {opt === "True" ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}{opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.question_type === "fill_blank" && (
                  <input type="text" value={answers[q.id] || ""} onChange={(e) => handleAnswer(q.id, e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                )}

                {(q.question_type === "short_answer" || q.question_type === "coding") && (
                  <textarea value={answers[q.id] || ""} onChange={(e) => handleAnswer(q.id, e.target.value)}
                    placeholder={q.question_type === "coding" ? "Write your code here..." : "Type your answer..."}
                    rows={q.question_type === "coding" ? 8 : 4}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-600 resize-y"
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={goPrev} disabled={currentQ === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex gap-1.5">
              {session.questions.map((_, i) => (
                <button key={i} onClick={() => { setCurrentQ(i); qStartRef.current = Date.now(); }}
                  className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                    i === currentQ ? "bg-amber-600 text-white scale-110" :
                    answers[session.questions[i].id] ? "bg-green-600/30 text-green-400" : "bg-secondary text-muted-foreground"
                  }`}
                >{i + 1}</button>
              ))}
            </div>
            <button onClick={goNext} disabled={!session || currentQ >= session.questions.length - 1} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-30">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {view === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Document */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-amber-400" />Source Document</h3>
              <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-600">
                <option value="">Select a document...</option>
                {documents.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}
              </select>
              {documents.length === 0 && <p className="text-xs text-muted-foreground">Upload documents first in Document Library.</p>}
            </div>

            {/* Difficulty */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><Brain className="h-4 w-4 text-purple-400" />Difficulty</h3>
              <div className="grid grid-cols-3 gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`py-2.5 rounded-xl text-sm font-medium transition-all border capitalize ${
                    difficulty === d ? "bg-amber-600 text-white border-amber-500" : "bg-secondary/20 border-border hover:bg-secondary/40"
                  }`}>{d}</button>
                ))}
              </div>
            </div>

            {/* Timer & Neg marking */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2"><Timer className="h-4 w-4 text-blue-400" />Timer (min)</span>
                <input type="number" min={0} max={120} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-20 bg-secondary/40 border border-border rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2"><Shield className="h-4 w-4 text-red-400" />Negative Marking</span>
                <button onClick={() => setNegativeMarking(!negativeMarking)} className={`relative w-11 h-6 rounded-full transition-colors ${negativeMarking ? "bg-amber-600" : "bg-secondary"}`}>
                  <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white" animate={{ x: negativeMarking ? 20 : 0 }} />
                </button>
              </div>
            </div>

            {/* Question count */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><Target className="h-4 w-4 text-green-400" />Questions</h3>
              <input type="range" min={5} max={30} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full accent-amber-600" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span><span className="font-bold text-foreground">{numQuestions}</span><span>30</span>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!selectedDoc || selectedTypes.length === 0 || generating}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20 hover:shadow-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Quiz...</> : <><Zap className="h-4 w-4" /> Generate Quiz</>}
            </button>
          </div>

          {/* Question Types */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">Question Types</h2>
              <p className="text-sm text-muted-foreground mb-5">Select one or more question types for your quiz</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizConfig?.question_types.map((qt) => {
                  const sel = selectedTypes.includes(qt.key);
                  return (
                    <button key={qt.key} onClick={() => toggleType(qt.key)}
                      className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all border ${
                        sel ? "bg-amber-600/10 border-amber-500/40" : "bg-secondary/10 border-border hover:bg-secondary/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        sel ? "bg-amber-600 text-white" : "bg-secondary text-muted-foreground"
                      }`}>{ICONS[qt.icon] || <ListChecks className="h-5 w-5" />}</div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{qt.label}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{qt.description}</p>
                      </div>
                      {sel && <Check className="h-4 w-4 text-amber-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview info */}
            {selectedTypes.length > 0 && selectedDoc && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center"><Zap className="h-6 w-6 text-amber-400" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">Ready to Generate</p>
                  <p className="text-xs text-muted-foreground">
                    {numQuestions} {difficulty} questions · {selectedTypes.length} type{selectedTypes.length > 1 ? "s" : ""} · {timeLimit > 0 ? `${timeLimit} min timer` : "No timer"} · {negativeMarking ? "Negative marking ON" : "No negative marking"}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {view === "results" && result && (
        <div className="space-y-6">
          {/* Score hero */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="relative z-10">
              <Award className="h-12 w-12 mx-auto mb-3 text-amber-200" />
              <h2 className="text-3xl font-bold mb-1">{result.percentage}%</h2>
              <p className="text-amber-100 text-sm">{result.obtained_marks} / {result.total_marks} marks</p>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="text-center"><span className="block text-2xl font-bold text-green-300">{result.correct_count}</span><span className="text-amber-100 text-xs">Correct</span></div>
                <div className="text-center"><span className="block text-2xl font-bold text-red-300">{result.incorrect_count}</span><span className="text-amber-100 text-xs">Wrong</span></div>
                <div className="text-center"><span className="block text-2xl font-bold text-amber-200">{result.unanswered_count}</span><span className="text-amber-100 text-xs">Skipped</span></div>
              </div>
            </div>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-400" />
              <div className="text-lg font-bold">{timeStr(result.time_taken_seconds)}</div>
              <div className="text-[10px] text-muted-foreground">Time Taken</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-1 text-purple-400" />
              <div className="text-lg font-bold">{result.total_questions}</div>
              <div className="text-[10px] text-muted-foreground">Questions</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <div className="text-lg font-bold">{result.rank ? `#${result.rank}` : "-"}</div>
              <div className="text-[10px] text-muted-foreground">Rank</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <Percent className="h-5 w-5 mx-auto mb-1 text-amber-400" />
              <div className="text-lg font-bold">{result.percentage}%</div>
              <div className="text-[10px] text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Accuracy analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "By Type", data: result.accuracy_by_type, icon: <ListChecks className="h-4 w-4" /> },
              { title: "By Difficulty", data: result.accuracy_by_difficulty, icon: <Brain className="h-4 w-4" /> },
              { title: "By Topic", data: result.accuracy_by_topic, icon: <BookOpen className="h-4 w-4" /> },
            ].map((section) => (
              <div key={section.title} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">{section.icon}{section.title}</h3>
                {Object.entries(section.data).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data</p>
                ) : Object.entries(section.data).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="capitalize">{key}</span><span>{val.correct}/{val.total}</span></div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${(val.correct / Math.max(val.total, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={retakeQuiz} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors">
              <RotateCcw className="h-4 w-4" /> New Quiz
            </button>
            {result.total_participants > 1 && (
              <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors">
                <Trophy className="h-4 w-4 text-amber-400" /> Leaderboard
              </button>
            )}
          </div>

          {/* Leaderboard */}
          <AnimatePresence>{showLeaderboard && leaderboard.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border font-bold text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" />Leaderboard</div>
              <div className="divide-y divide-border">
                {leaderboard.map((e) => (
                  <div key={e.rank} className={`flex items-center justify-between px-5 py-3 ${e.user_id === user?.id ? "bg-amber-600/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        e.rank === 1 ? "bg-yellow-500 text-white" : e.rank === 2 ? "bg-gray-400 text-white" : e.rank === 3 ? "bg-amber-700 text-white" : "bg-secondary text-muted-foreground"
                      }`}>{e.rank}</span>
                      <div><span className="text-sm font-medium">{e.username}</span>{e.user_id === user?.id && <span className="text-[10px] text-amber-400 ml-2">(You)</span>}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{e.score}/{e.total_marks}</span>
                      <span className="text-xs text-muted-foreground ml-2">({e.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}</AnimatePresence>

          {/* Review questions */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border font-bold text-sm">Review Questions</div>
            <div className="divide-y divide-border">
              {session?.questions.map((q, i) => {
                const ua = answers[q.id] || "";
                const ca = q.correct_answer;
                const correct = ua.toLowerCase() === ca.toLowerCase();
                return (
                  <div key={q.id} className="px-5 py-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        ua ? (correct ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400") : "bg-secondary text-muted-foreground"
                      }`}>
                        {ua ? (correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />) : "-"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
                          <span className="text-muted-foreground">Your answer: <span className={correct ? "text-green-400" : "text-red-400"}>{ua || "(skipped)"}</span></span>
                          {!correct && <span className="text-green-400">Correct: {ca}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search quizzes..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <button onClick={loadHistory} className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">Refresh</button>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>
          ) : history.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4"><Trophy className="h-8 w-8 text-amber-400" /></div>
              <h3 className="text-lg font-bold mb-1">No Quiz History</h3>
              <p className="text-sm text-muted-foreground">Complete a quiz to see your history here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.filter((h) => !historySearch || h.title.toLowerCase().includes(historySearch.toLowerCase())).map((h) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-amber-600/5 transition-all group"
                >
                  <div className={`h-2 ${h.difficulty === "easy" ? "bg-green-500" : h.difficulty === "medium" ? "bg-amber-500" : "bg-red-500"}`} />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{h.title}</p>
                      </div>
                      <button onClick={() => setDeleteConfirm(h.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize px-2 py-0.5 rounded-full bg-secondary/50">{h.difficulty}</span>
                      <span>{h.total_questions} Q</span>
                      <span>{h.total_marks} marks</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      {h.status === "completed" ? (
                        <span className="text-xs font-bold text-green-400 flex items-center gap-1"><Check className="h-3 w-3" />{h.obtained_marks}/{h.total_marks}</span>
                      ) : (
                        <span className="text-xs text-amber-400 flex items-center gap-1"><Clock className="h-3 w-3" />In Progress</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatDate(h.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>{deleteConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <div><h3 className="font-bold">Delete Quiz</h3><p className="text-xs text-muted-foreground">This cannot be undone.</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/70">Cancel</button>
              <button onClick={() => handleDeleteHistory(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
