const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  is_pinned: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusgpt_token")
      : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getSessions(): Promise<ChatSession[]> {
  return request("/assistant/sessions");
}

export async function createSession(title = "New Chat"): Promise<ChatSession> {
  return request(`/assistant/sessions?title=${encodeURIComponent(title)}`, {
    method: "POST",
  });
}

export async function getSession(id: string): Promise<ChatSession> {
  return request(`/assistant/sessions/${id}`);
}

export async function updateSession(
  id: string,
  data: { title?: string; is_pinned?: string }
): Promise<ChatSession> {
  return request(`/assistant/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await request(`/assistant/sessions/${id}`, { method: "DELETE" });
}

export async function searchSessions(q: string): Promise<ChatSession[]> {
  return request(`/assistant/sessions/search?q=${encodeURIComponent(q)}`);
}

export async function askAssistant(data: {
  message: string;
  session_id?: string;
  history?: { role: string; content: string }[];
}): Promise<{ content: string; session_id: string; created_at: string }> {
  return request("/assistant/ask", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function streamAssistant(
  data: {
    message: string;
    session_id?: string;
    history?: { role: string; content: string }[];
  },
  onToken: (token: string) => void,
  onDone: (sessionId: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): void {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusgpt_token")
      : null;

  fetch(`${API_BASE}/assistant/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              onDone(json.session_id);
              return;
            }
            onToken(json.token);
          } catch {
            // ignore parse errors
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err);
      }
    });
}

export async function regenerateResponse(data: {
  session_id: string;
  message_id?: string;
}): Promise<{ content: string; session_id: string; created_at: string }> {
  return request("/assistant/regenerate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSuggestions(): Promise<{ suggestions: string[] }> {
  return request("/assistant/suggestions", { method: "POST" });
}

// ─── Document / RAG API ───────────────────────────────────────

export interface Citation {
  document_id: string;
  document_name: string;
  page_number: number;
  chunk_text: string;
  relevance_score: number;
}

export interface RAGResponse {
  content: string;
  session_id: string;
  citations: Citation[];
  created_at: string;
}

export interface DocumentInfo {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  created_at: string;
}

export async function uploadDocument(file: File): Promise<DocumentInfo> {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Upload failed");
  }
  return res.json();
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  return request("/documents");
}

export async function searchDocuments(q: string): Promise<DocumentInfo[]> {
  return request(`/documents/search?q=${encodeURIComponent(q)}`);
}

export async function deleteDocument(id: string): Promise<void> {
  await request(`/documents/${id}`, { method: "DELETE" });
}

export async function ragAsk(data: {
  message: string;
  session_id?: string;
  history?: { role: string; content: string }[];
  use_rag?: boolean;
  top_k?: number;
}): Promise<RAGResponse> {
  return request("/rag/ask", { method: "POST", body: JSON.stringify(data) });
}

// ─── Notes Generator API ────────────────────────────────────

export interface NoteInfo {
  id: string;
  user_id: string;
  title: string;
  note_type: string;
  content: string;
  source_document_id: string | null;
  source_document_name: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteTypeMeta {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export async function getNoteTypes(): Promise<NoteTypeMeta[]> {
  return request("/note-types");
}

export async function generateNote(data: {
  document_id: string;
  note_type: string;
  custom_topic?: string;
}): Promise<NoteInfo> {
  return request("/notes/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function streamNoteGenerate(
  data: {
    document_id: string;
    note_type: string;
    custom_topic?: string;
  },
  onToken: (token: string) => void,
  onDone: (noteId: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): void {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;

  fetch(`${API_BASE}/notes/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              onDone(json.note_id);
              return;
            }
            onToken(json.token);
          } catch {
            // skip
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err);
    });
}

export async function listNotes(q?: string, noteType?: string): Promise<NoteInfo[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (noteType) params.set("note_type", noteType);
  const qs = params.toString();
  return request(`/notes${qs ? `?${qs}` : ""}`);
}

export async function searchNotes(q: string): Promise<NoteInfo[]> {
  return request(`/notes/search?q=${encodeURIComponent(q)}`);
}

export async function getNote(id: string): Promise<NoteInfo> {
  return request(`/notes/${id}`);
}

export async function deleteNote(id: string): Promise<void> {
  await request(`/notes/${id}`, { method: "DELETE" });
}

export async function updateNote(
  id: string,
  data: { title?: string; content?: string; tags?: string }
): Promise<NoteInfo> {
  return request(`/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getNoteExportUrl(id: string, format: "pdf" | "docx" | "md"): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;
  const url = `${API_BASE}/notes/${id}/export?format=${format}`;
  return token ? `${url}&token=${encodeURIComponent(token)}` : url;
}

export async function downloadNoteExport(id: string, format: "pdf" | "docx" | "md"): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;
  const url = `${API_BASE}/notes/${id}/export?format=${format}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`Export failed: ${res.status}`);

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?(.+?)"?$/);
  const filename = match?.[1] || `notes.${format}`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// ─── Quiz Generator API ─────────────────────────────────────

export interface QuizConfig {
  question_types: { key: string; label: string; icon: string; description: string }[];
  difficulties: { key: string; label: string; description: string }[];
}

export interface QuizQuestionData {
  id: string;
  session_id: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  marks: number;
  difficulty: string;
  topic: string | null;
  user_answer: string | null;
  is_correct: string | null;
  time_taken: number | null;
  created_at: string;
}

export interface QuizSessionData {
  id: string;
  user_id: string;
  document_id: string | null;
  document_name: string | null;
  title: string;
  question_types: string[];
  difficulty: string;
  time_limit: number;
  negative_marking: string;
  total_questions: number;
  total_marks: number;
  obtained_marks: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  questions: QuizQuestionData[];
}

export interface QuizSessionBrief {
  id: string;
  title: string;
  difficulty: string;
  total_questions: number;
  total_marks: number;
  obtained_marks: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface QuizResult {
  session_id: string;
  total_questions: number;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
  accuracy_by_type: Record<string, { correct: number; total: number }>;
  accuracy_by_difficulty: Record<string, { correct: number; total: number }>;
  accuracy_by_topic: Record<string, { correct: number; total: number }>;
  rank: number | null;
  total_participants: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  total_marks: number;
  percentage: number;
  accuracy: number;
  time_taken: number;
  completed_at: string;
}

export async function getQuizConfig(): Promise<QuizConfig> {
  return request("/quiz/config");
}

export async function generateQuiz(data: {
  document_id: string;
  question_types: string[];
  difficulty: string;
  num_questions: number;
  time_limit: number;
  negative_marking: boolean;
}): Promise<QuizSessionData> {
  return request("/quiz/generate", { method: "POST", body: JSON.stringify(data) });
}

export async function listQuizSessions(): Promise<QuizSessionBrief[]> {
  return request("/quiz/sessions");
}

export async function getQuizSession(id: string): Promise<QuizSessionData> {
  return request(`/quiz/sessions/${id}`);
}

export async function submitQuiz(
  sessionId: string,
  answers: { question_id: string; answer: string; time_taken?: number }[]
): Promise<QuizResult> {
  return request(`/quiz/submit/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
  return request(`/quiz/leaderboard/${sessionId}`);
}

export async function deleteQuizSession(id: string): Promise<void> {
  await request(`/quiz/sessions/${id}`, { method: "DELETE" });
}

// ─── Attendance API ────────────────────────────────────────

export interface AttendanceSubjectInfo {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  semester: string | null;
  total_classes: number;
  attended_classes: number;
  attendance_pct: number;
  need_for_safe: number;
  safe_to_miss: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordInfo {
  id: string;
  subject_id: string;
  user_id: string;
  date: string;
  status: string;
  created_at: string;
  subject_name: string | null;
}

export interface AttendanceStats {
  overall_pct: number;
  total_classes: number;
  total_present: number;
  total_absent: number;
  total_leave: number;
  subjects: AttendanceSubjectInfo[];
}

export interface AttendanceChartData {
  monthly: { month: string; present: number; absent: number; total: number; pct: number }[];
  weekly: { week: string; present: number; absent: number }[];
  subject_breakdown: { name: string; present: number; absent: number; total: number; pct: number }[];
  semester_stats: { semester: string; total: number; present: number; pct: number }[];
}

export interface AttendancePrediction {
  subject_id: string;
  subject_name: string;
  current_pct: number;
  needed_to_reach_75: number;
  safe_to_miss_from_now: number;
  projected_pct_after_5_absences: number;
  projected_pct_after_10_absences: number;
  warning: boolean;
}

export interface CalendarDay {
  day: number;
  status: string;
  hasRecord: boolean;
}

export async function listAttendanceSubjects(semester?: string): Promise<AttendanceSubjectInfo[]> {
  const params = semester ? `?semester=${encodeURIComponent(semester)}` : "";
  return request(`/attendance/subjects${params}`);
}

export async function createAttendanceSubject(data: { name: string; code?: string; semester?: string }): Promise<AttendanceSubjectInfo> {
  return request("/attendance/subjects", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAttendanceSubject(id: string, data: { name?: string; code?: string; semester?: string }): Promise<AttendanceSubjectInfo> {
  return request(`/attendance/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteAttendanceSubject(id: string): Promise<void> {
  await request(`/attendance/subjects/${id}`, { method: "DELETE" });
}

export async function listAttendanceRecords(subjectId?: string): Promise<AttendanceRecordInfo[]> {
  const params = subjectId ? `?subject_id=${encodeURIComponent(subjectId)}` : "";
  return request(`/attendance/records${params}`);
}

export async function createAttendanceRecord(data: { subject_id: string; date: string; status: string }): Promise<AttendanceRecordInfo> {
  return request("/attendance/records", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAttendanceRecord(id: string, data: { status: string }): Promise<AttendanceRecordInfo> {
  return request(`/attendance/records/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  await request(`/attendance/records/${id}`, { method: "DELETE" });
}

export async function getAttendanceStats(): Promise<AttendanceStats> {
  return request("/attendance/stats");
}

export async function getAttendanceCharts(): Promise<AttendanceChartData> {
  return request("/attendance/charts");
}

export async function getAttendancePredictions(): Promise<AttendancePrediction[]> {
  return request("/attendance/predictions");
}

export async function getAttendanceCalendar(year?: number, month?: number): Promise<CalendarDay[]> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  const qs = params.toString();
  return request(`/attendance/calendar${qs ? `?${qs}` : ""}`);
}

export async function getAttendanceSemesters(): Promise<string[]> {
  return request("/attendance/semesters");
}

export async function downloadAttendanceExport(format: "pdf" | "docx" | "md"): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;
  const url = `${API_BASE}/attendance/export?format=${format}`;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?(.+?)"?$/);
  const filename = match?.[1] || `attendance.${format}`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// ─── Study Planner API ─────────────────────────────────────

export interface StudyPlanInfo {
  id: string;
  user_id: string;
  title: string;
  semester: string | null;
  start_date: string | null;
  end_date: string | null;
  subjects: string[];
  ai_generated: string;
  created_at: string;
  updated_at: string;
  task_count: number;
  completed_tasks: number;
}

export interface StudyTaskInfo {
  id: string;
  user_id: string;
  plan_id: string | null;
  subject: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  estimated_minutes: number;
  completed_at: string | null;
  created_at: string;
}

export interface StudySessionInfo {
  id: string;
  user_id: string;
  task_id: string | null;
  subject: string | null;
  duration_minutes: number;
  focus_score: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface StudyStreakInfo {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_study_days: number;
  total_focus_minutes: number;
}

export interface StudyAnalytics {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  total_focus_hours: number;
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  total_study_days: number;
  tasks_by_priority: Record<string, number>;
  tasks_by_subject: Record<string, number>;
  focus_by_subject: Record<string, number>;
  weekly_data: { week: string; sessions: number; minutes: number }[];
  monthly_data: { month: string; sessions: number; minutes: number }[];
}

export async function listPlans(): Promise<StudyPlanInfo[]> {
  return request("/planner/plans");
}

export async function createPlan(data: { title: string; semester?: string; start_date?: string; end_date?: string; subjects?: string[] }): Promise<StudyPlanInfo> {
  return request("/planner/plans", { method: "POST", body: JSON.stringify(data) });
}

export async function updatePlan(id: string, data: { title?: string; semester?: string; start_date?: string; end_date?: string; subjects?: string[] }): Promise<StudyPlanInfo> {
  return request(`/planner/plans/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deletePlan(id: string): Promise<void> {
  await request(`/planner/plans/${id}`, { method: "DELETE" });
}

export async function generateAIStudyPlan(data: { subjects: string[]; semester?: string; start_date: string; end_date: string; hours_per_day: number }): Promise<{ plan_id: string; title: string; tasks_created: number }> {
  return request("/planner/ai-plan", { method: "POST", body: JSON.stringify(data) });
}

export async function listTasks(status?: string, planId?: string): Promise<StudyTaskInfo[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (planId) params.set("plan_id", planId);
  const qs = params.toString();
  return request(`/planner/tasks${qs ? `?${qs}` : ""}`);
}

export async function createTask(data: { plan_id?: string; subject: string; title: string; description?: string; priority?: string; due_date?: string; estimated_minutes?: number }): Promise<StudyTaskInfo> {
  return request("/planner/tasks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTask(id: string, data: { subject?: string; title?: string; description?: string; priority?: string; status?: string; due_date?: string; estimated_minutes?: number }): Promise<StudyTaskInfo> {
  return request(`/planner/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteTask(id: string): Promise<void> {
  await request(`/planner/tasks/${id}`, { method: "DELETE" });
}

export async function startStudySession(data: { task_id?: string; subject?: string; duration_minutes: number; focus_score?: number }): Promise<StudySessionInfo> {
  return request("/planner/sessions", { method: "POST", body: JSON.stringify(data) });
}

export async function listSessions(): Promise<StudySessionInfo[]> {
  return request("/planner/sessions");
}

export async function deletePlannerSession(id: string): Promise<void> {
  await request(`/planner/sessions/${id}`, { method: "DELETE" });
}

export async function getStreak(): Promise<StudyStreakInfo> {
  return request("/planner/streak");
}

export async function getPlannerAnalytics(): Promise<StudyAnalytics> {
  return request("/planner/analytics");
}

export async function getPlannerCalendar(year?: number, month?: number): Promise<{ tasks: { id: string; title: string; subject: string; priority: string; status: string; day: number | null }[] }> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  const qs = params.toString();
  return request(`/planner/calendar${qs ? `?${qs}` : ""}`);
}

export async function getExamCountdowns(): Promise<{ subject: string; exam_date: string; days_remaining: number; preparation_pct: number }[]> {
  return request("/planner/exam-countdowns");
}

// ─── Faculty Portal API ─────────────────────────────────

export interface FacultyContentInfo {
  id: string; user_id: string; content_type: string; title: string;
  description: string | null; file_path: string | null; file_type: string | null;
  file_size: number; course_id: string | null; course_name: string | null;
  subject: string | null; year: number | null; due_date: string | null;
  submission_count: number; created_at: string; updated_at: string;
}

export interface NoticeInfo {
  id: string; title: string; content: string; posted_by: string;
  poster_name: string | null; course_id: string | null; course_name: string | null;
  priority: string; created_at: string;
}

export interface EventInfo {
  id: string; title: string; description: string | null;
  event_date: string; event_time: string | null; location: string | null;
  created_by: string; creator_name: string | null; event_type: string; created_at: string;
}

export interface TimetableInfo {
  id: string; course_id: string; course_name: string | null;
  faculty_id: string; faculty_name: string | null; subject: string | null;
  day_of_week: number; start_time: string; end_time: string;
  room: string | null; created_at: string;
}

export interface SubmissionInfo {
  id: string; assignment_id: string; student_id: string;
  student_name: string | null; file_path: string | null; file_type: string | null;
  submitted_at: string; grade: string | null; feedback: string | null; graded_at: string | null;
}

export interface DepartmentInfo {
  id: string; name: string; code: string; description: string | null;
  created_at: string; subject_count: number;
}

export interface SubjectInfo {
  id: string; name: string; code: string; department_id: string | null;
  credits: number; description: string | null; created_at: string;
}

export interface AuditLogInfo {
  id: string; user_id: string | null; user_name: string | null;
  action: string; resource: string; resource_id: string | null;
  details: string | null; ip_address: string | null; created_at: string;
}

export interface AdminAnalytics {
  total_users: number; total_students: number; total_faculty: number;
  total_admins: number; total_courses: number; total_departments: number;
  total_subjects: number; total_documents: number; total_notes: number;
  total_quizzes: number; active_users_today: number;
  users_by_department: Record<string, number>;
  courses_by_department: Record<string, number>;
}

export interface CourseWithEnrollment {
  id: string; code: string; name: string; description: string | null;
  faculty_id: string | null; faculty_name: string | null; enrollment_count: number;
}

// Faculty Portal
export async function getFacultyPortalDashboard(): Promise<any> {
  return request("/faculty/portal/dashboard");
}

export async function listFacultyContent(contentType?: string, courseId?: string): Promise<FacultyContentInfo[]> {
  const params = new URLSearchParams();
  if (contentType) params.set("content_type", contentType);
  if (courseId) params.set("course_id", courseId);
  const qs = params.toString();
  return request(`/faculty/portal/content${qs ? `?${qs}` : ""}`);
}

export async function uploadFacultyContent(data: FormData): Promise<FacultyContentInfo> {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;
  const res = await fetch(`${API_BASE}/faculty/portal/content`, {
    method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: data,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({detail: res.statusText})); throw new Error(e.detail || "Upload failed"); }
  return res.json();
}

export async function updateFacultyContent(id: string, data: any): Promise<FacultyContentInfo> {
  return request(`/faculty/portal/content/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteFacultyContent(id: string): Promise<void> {
  await request(`/faculty/portal/content/${id}`, { method: "DELETE" });
}

export async function listSubmissions(assignmentId?: string): Promise<SubmissionInfo[]> {
  const params = assignmentId ? `?assignment_id=${encodeURIComponent(assignmentId)}` : "";
  return request(`/faculty/portal/submissions${params}`);
}

export async function gradeSubmission(id: string, data: { grade: string; feedback?: string }): Promise<void> {
  await request(`/faculty/portal/submissions/${id}/grade`, { method: "PUT", body: JSON.stringify(data) });
}

export async function listNotices(courseId?: string): Promise<NoticeInfo[]> {
  const params = courseId ? `?course_id=${encodeURIComponent(courseId)}` : "";
  return request(`/faculty/portal/notices${params}`);
}

export async function createNotice(data: { title: string; content: string; course_id?: string; priority?: string }): Promise<NoticeInfo> {
  return request("/faculty/portal/notices", { method: "POST", body: JSON.stringify(data) });
}

export async function updateNotice(id: string, data: any): Promise<NoticeInfo> {
  return request(`/faculty/portal/notices/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteNotice(id: string): Promise<void> {
  await request(`/faculty/portal/notices/${id}`, { method: "DELETE" });
}

export async function listEvents(): Promise<EventInfo[]> {
  return request("/faculty/portal/events");
}

export async function createEvent(data: { title: string; description?: string; event_date: string; event_time?: string; location?: string; event_type?: string }): Promise<EventInfo> {
  return request("/faculty/portal/events", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteEvent(id: string): Promise<void> {
  await request(`/faculty/portal/events/${id}`, { method: "DELETE" });
}

export async function listTimetable(courseId?: string): Promise<TimetableInfo[]> {
  const params = courseId ? `?course_id=${encodeURIComponent(courseId)}` : "";
  return request(`/faculty/portal/timetable${params}`);
}

export async function createTimetableEntry(data: { course_id: string; subject?: string; day_of_week: number; start_time: string; end_time: string; room?: string }): Promise<TimetableInfo> {
  return request("/faculty/portal/timetable", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTimetableEntry(id: string, data: any): Promise<TimetableInfo> {
  return request(`/faculty/portal/timetable/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  await request(`/faculty/portal/timetable/${id}`, { method: "DELETE" });
}

export async function getMyCourses(): Promise<{ id: string; code: string; name: string; description: string | null; enrollment_count: number }[]> {
  return request("/faculty/portal/courses");
}

export async function updateMyCourse(id: string, data: { name?: string; description?: string }): Promise<any> {
  return request(`/faculty/portal/courses/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteMyCourse(id: string): Promise<void> {
  await request(`/faculty/portal/courses/${id}`, { method: "DELETE" });
}

export async function getCourseStudents(courseId: string): Promise<{ enrollment_id: string; student_id: string; name: string; email: string; grade: string | null }[]> {
  return request(`/faculty/portal/courses/${courseId}/students`);
}

// Admin Portal
export async function getAdminPortalDashboard(): Promise<any> {
  return request("/admin/portal/dashboard");
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return request("/admin/portal/analytics");
}

export async function listAllUsers(role?: string, department?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (department) params.set("department", department);
  const qs = params.toString();
  return request(`/admin/portal/users${qs ? `?${qs}` : ""}`);
}

export async function getUser(id: string): Promise<any> {
  return request(`/admin/portal/users/${id}`);
}

export async function updateUser(id: string, data: any): Promise<any> {
  return request(`/admin/portal/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteUser(id: string): Promise<void> {
  await request(`/admin/portal/users/${id}`, { method: "DELETE" });
}

export async function listDepartments(): Promise<DepartmentInfo[]> {
  return request("/admin/portal/departments");
}

export async function createDepartment(data: { name: string; code: string; description?: string }): Promise<DepartmentInfo> {
  return request("/admin/portal/departments", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDepartment(id: string, data: any): Promise<DepartmentInfo> {
  return request(`/admin/portal/departments/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteDepartment(id: string): Promise<void> {
  await request(`/admin/portal/departments/${id}`, { method: "DELETE" });
}

export async function listAdminSubjects(departmentId?: string): Promise<SubjectInfo[]> {
  const params = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : "";
  return request(`/admin/portal/subjects${params}`);
}

export async function createSubject(data: { name: string; code: string; department_id?: string; credits?: number; description?: string }): Promise<SubjectInfo> {
  return request("/admin/portal/subjects", { method: "POST", body: JSON.stringify(data) });
}

export async function updateSubject(id: string, data: any): Promise<SubjectInfo> {
  return request(`/admin/portal/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteSubject(id: string): Promise<void> {
  await request(`/admin/portal/subjects/${id}`, { method: "DELETE" });
}

export async function listAllCourses(): Promise<CourseWithEnrollment[]> {
  return request("/admin/portal/courses");
}

export async function listAuditLogs(limit?: number, action?: string): Promise<AuditLogInfo[]> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (action) params.set("action", action);
  const qs = params.toString();
  return request(`/admin/portal/audit-logs${qs ? `?${qs}` : ""}`);
}

export async function listAllNotices(): Promise<any[]> {
  return request("/admin/portal/all-notices");
}

// ─── Student Portal API ──────────────────────────────────

export async function getStudentPortalDashboard(): Promise<any> {
  return request("/student/portal/dashboard");
}

export async function listStudentContent(courseId?: string, contentType?: string): Promise<FacultyContentInfo[]> {
  const params = new URLSearchParams();
  if (courseId) params.set("course_id", courseId);
  if (contentType) params.set("content_type", contentType);
  const qs = params.toString();
  return request(`/student/portal/content${qs ? `?${qs}` : ""}`);
}

export async function listStudentNotices(courseId?: string): Promise<NoticeInfo[]> {
  const params = courseId ? `?course_id=${encodeURIComponent(courseId)}` : "";
  return request(`/student/portal/notices${params}`);
}

export async function listStudentEvents(): Promise<EventInfo[]> {
  return request("/student/portal/events");
}

export async function listStudentTimetable(): Promise<TimetableInfo[]> {
  return request("/student/portal/timetable");
}

export async function listStudentAssignments(courseId?: string): Promise<FacultyContentInfo[]> {
  const params = courseId ? `?course_id=${encodeURIComponent(courseId)}` : "";
  return request(`/student/portal/assignments${params}`);
}

export async function submitAssignment(assignmentId: string): Promise<any> {
  return request(`/student/portal/assignments/${assignmentId}/submit`, { method: "POST" });
}

export async function getStudentGrades(): Promise<any[]> {
  return request("/student/portal/grades");
}

// ─── Placement Assistant API ─────────────────────────────

export interface ResumeInfo {
  id: string; user_id: string; title: string;
  full_name: string | null; email: string | null; phone: string | null;
  linkedin: string | null; portfolio: string | null; address: string | null;
  summary: string | null; sections: any[]; ats_score: number;
  ats_feedback: string | null; is_active: string; created_at: string; updated_at: string;
  version_count: number;
}

export interface ResumeSection {
  type: string; title: string; items: any[];
}

export interface ResumeVersionInfo {
  id: string; resume_id: string; version_number: number;
  title: string | null; sections: any[]; ats_score: number; created_at: string;
}

export interface InterviewSessionInfo {
  id: string; user_id: string; interview_type: string;
  company: string | null; role: string | null; difficulty: string;
  status: string; score: number | null; feedback: string | null;
  started_at: string; completed_at: string | null;
  questions: any[]; question_count: number;
}

export interface CompanyQuestionInfo {
  id: string; company: string; role: string | null;
  question_text: string; question_type: string;
  answer: string | null; source: string | null; created_at: string;
}

export interface CodingChallengeInfo {
  id: string; title: string; description: string; difficulty: string;
  topic: string | null; starter_code: string | null; language: string;
  status: string; score: number | null; feedback: string | null; created_at: string;
}

export interface AptitudeQuestionInfo {
  id: string; category: string; question_text: string;
  options: string[] | null; correct_answer: string | null;
  explanation: string | null; difficulty: string;
  user_answer: string | null; is_correct: string | null;
}

export interface LinkedInProfileInfo {
  id: string; headline: string | null; about: string | null;
  experience: any[]; education: any[]; skills: string[];
  certifications: any[]; projects: any[];
  ai_generated: string; created_at: string; updated_at: string;
}

// Placement Dashboard
export async function getPlacementDashboard(): Promise<any> {
  return request("/placement/dashboard");
}

// Resumes
export async function listResumes(): Promise<ResumeInfo[]> {
  return request("/placement/resumes");
}

export async function createResume(data: any): Promise<ResumeInfo> {
  return request("/placement/resumes", { method: "POST", body: JSON.stringify(data) });
}

export async function getResume(id: string): Promise<ResumeInfo> {
  return request(`/placement/resumes/${id}`);
}

export async function updateResume(id: string, data: any): Promise<ResumeInfo> {
  return request(`/placement/resumes/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteResume(id: string): Promise<void> {
  await request(`/placement/resumes/${id}`, { method: "DELETE" });
}

export async function reviewResume(id: string): Promise<any> {
  return request(`/placement/resumes/${id}/review`, { method: "POST" });
}

export async function listResumeVersions(id: string): Promise<ResumeVersionInfo[]> {
  return request(`/placement/resumes/${id}/versions`);
}

// LinkedIn
export async function generateLinkedIn(data: any): Promise<any> {
  return request("/placement/linkedin/generate", { method: "POST", body: JSON.stringify(data) });
}

export async function getLinkedInProfile(): Promise<LinkedInProfileInfo> {
  return request("/placement/linkedin");
}

// Interviews
export async function generateInterview(data: any): Promise<InterviewSessionInfo> {
  return request("/placement/interviews/generate", { method: "POST", body: JSON.stringify(data) });
}

export async function listInterviews(): Promise<InterviewSessionInfo[]> {
  return request("/placement/interviews");
}

export async function getInterview(id: string): Promise<InterviewSessionInfo> {
  return request(`/placement/interviews/${id}`);
}

export async function submitInterviewAnswer(sessionId: string, data: { question_id: string; answer: string }): Promise<void> {
  await request(`/placement/interviews/${sessionId}/answer`, { method: "POST", body: JSON.stringify(data) });
}

export async function evaluateInterview(sessionId: string): Promise<any> {
  return request(`/placement/interviews/${sessionId}/evaluate`, { method: "POST" });
}

// Company Questions
export async function listCompanyQuestions(company?: string): Promise<CompanyQuestionInfo[]> {
  const params = company ? `?company=${encodeURIComponent(company)}` : "";
  return request(`/placement/company-questions${params}`);
}

export async function createCompanyQuestion(data: any): Promise<CompanyQuestionInfo> {
  return request("/placement/company-questions", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteCompanyQuestion(id: string): Promise<void> {
  await request(`/placement/company-questions/${id}`, { method: "DELETE" });
}

export async function listCompanies(): Promise<string[]> {
  return request("/placement/company-questions/companies");
}

// Coding
export async function listCodingChallenges(topic?: string): Promise<CodingChallengeInfo[]> {
  const params = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return request(`/placement/coding${params}`);
}

export async function generateCodingChallenge(data: any): Promise<CodingChallengeInfo> {
  return request("/placement/coding/generate", { method: "POST", body: JSON.stringify(data) });
}

export async function getCodingChallenge(id: string): Promise<CodingChallengeInfo> {
  return request(`/placement/coding/${id}`);
}

export async function submitCodingSolution(id: string, data: { solution: string; language: string }): Promise<any> {
  return request(`/placement/coding/${id}/submit`, { method: "POST", body: JSON.stringify(data) });
}

// Aptitude
export async function listAptitudeQuestions(category?: string, difficulty?: string): Promise<AptitudeQuestionInfo[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (difficulty) params.set("difficulty", difficulty);
  const qs = params.toString();
  return request(`/placement/aptitude${qs ? `?${qs}` : ""}`);
}

export async function generateAptitudeQuestions(category?: string, difficulty?: string, count?: number): Promise<AptitudeQuestionInfo[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (difficulty) params.set("difficulty", difficulty);
  if (count) params.set("count", String(count));
  const qs = params.toString();
  return request(`/placement/aptitude/generate${qs ? `?${qs}` : ""}`, { method: "POST" });
}

export async function submitAptitudeAnswer(data: { question_id: string; answer: string; time_taken: number }): Promise<any> {
  return request("/placement/aptitude/submit", { method: "POST", body: JSON.stringify(data) });
}

export function streamRagAsk(
  data: {
    message: string;
    session_id?: string;
    history?: { role: string; content: string }[];
    use_rag?: boolean;
    top_k?: number;
  },
  onToken: (token: string) => void,
  onDone: (sessionId: string, citations: Citation[]) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): void {
  const token = typeof window !== "undefined" ? localStorage.getItem("campusgpt_token") : null;

  fetch(`${API_BASE}/rag/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              onDone(json.session_id, json.citations || []);
              return;
            }
            onToken(json.token);
          } catch {
            // skip
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err);
    });
}
