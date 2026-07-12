from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ProfileBase(BaseModel):
    email: str
    full_name: str
    role: str = "student"
    department: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileCreate(ProfileBase):
    password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: ProfileResponse


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class CourseResponse(BaseModel):
    id: str
    name: str
    code: str
    faculty_id: Optional[str] = None
    department: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class EnrollmentResponse(BaseModel):
    id: str
    student_id: str
    course_id: str

    model_config = {"from_attributes": True}


class ChatMessageBase(BaseModel):
    role: str
    content: str


class ChatMessageResponse(ChatMessageBase):
    id: str
    session_id: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    is_pinned: bool = False
    messages: List[ChatMessageResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AskAssistantRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class AskAssistantResponse(BaseModel):
    reply: str
    session_id: str


class StreamChunk(BaseModel):
    token: str
    done: bool
    session_id: str


class RegenerateRequest(BaseModel):
    session_id: str
    message_id: str


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Citation(BaseModel):
    content: str
    source: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None


class RAGAskRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None


class RAGResponse(BaseModel):
    answer: str
    citations: List[Citation] = []


class NoteGenerateRequest(BaseModel):
    note_type: str
    topic: str
    subject: str
    additional_context: Optional[str] = None


class NoteCreate(BaseModel):
    title: str
    note_type: str
    content: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[str] = None
    metadata_json: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    note_type: Optional[str] = None
    content: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[str] = None
    metadata_json: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    user_id: str
    title: str
    note_type: str
    content: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class QuizGenerateRequest(BaseModel):
    title: str
    topic: str
    difficulty: str = "medium"
    question_count: Optional[int] = 5
    negative_marking: Optional[float] = 0
    time_limit_minutes: Optional[int] = None


class QuizSubmitAnswer(BaseModel):
    question_id: str
    user_answer: str


class QuizSubmitRequest(BaseModel):
    answers: List[QuizSubmitAnswer]


class QuizQuestionResponse(BaseModel):
    id: str
    session_id: str
    question_text: str
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    user_answer: Optional[str] = None
    is_correct: Optional[str] = None
    explanation: Optional[str] = None
    marks: float = 1.0

    model_config = {"from_attributes": True}


class QuizSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    topic: str
    difficulty: str = "medium"
    question_count: int = 5
    status: str = "in_progress"
    score: Optional[float] = None
    total_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    negative_marking: float = 0
    time_limit_minutes: Optional[int] = None
    questions: List[QuizQuestionResponse] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class QuizResultResponse(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: str
    score: Optional[float] = None
    total_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    negative_marking: float = 0
    status: str
    questions: List[QuizQuestionResponse] = []

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    user_id: str
    full_name: str
    score: float
    topic: str
    difficulty: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AttendanceSubjectCreate(BaseModel):
    name: str
    code: str
    total_classes: int = 0
    attended_classes: int = 0


class AttendanceSubjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    code: str
    total_classes: int = 0
    attended_classes: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AttendanceRecordCreate(BaseModel):
    subject_id: str
    date: str
    status: str


class AttendanceRecordResponse(BaseModel):
    id: str
    subject_id: str
    date: str
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AttendanceStatsResponse(BaseModel):
    total_classes: int
    attended: int
    percentage: float
    required_for_target: Optional[float] = None


class AttendanceChartData(BaseModel):
    labels: List[str]
    attended: List[int]
    missed: List[int]


class AttendancePrediction(BaseModel):
    subject_name: str
    current_percentage: float
    predicted_percentage: Optional[float] = None
    classes_needed: Optional[int] = None


class AttendanceExport(BaseModel):
    subjects: List[Dict[str, Any]]
    records: List[Dict[str, Any]]
    summary: Dict[str, Any]


class StudyPlanCreate(BaseModel):
    title: str
    semester: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    is_ai_generated: bool = False


class StudyPlanResponse(BaseModel):
    id: str
    user_id: str
    title: str
    semester: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    is_ai_generated: bool = False
    tasks: List["StudyTaskResponse"] = []
    sessions: List["StudySessionResponse"] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudyTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None
    status: str = "pending"
    estimated_minutes: Optional[int] = None


class StudyTaskResponse(BaseModel):
    id: str
    plan_id: str
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None
    status: str = "pending"
    estimated_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudyTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    estimated_minutes: Optional[int] = None


class StudySessionCreate(BaseModel):
    plan_id: str
    task_id: Optional[str] = None
    duration_minutes: int
    notes: Optional[str] = None
    date: str


class StudySessionResponse(BaseModel):
    id: str
    plan_id: str
    task_id: Optional[str] = None
    duration_minutes: int
    notes: Optional[str] = None
    date: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudyStreakResponse(BaseModel):
    id: str
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_study_date: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudyAnalytics(BaseModel):
    total_study_minutes: int
    total_sessions: int
    average_session_minutes: float
    current_streak: int
    longest_streak: int
    subjects_breakdown: Dict[str, int]


class ExamCountdown(BaseModel):
    exam_name: str
    date: str
    days_remaining: int


class StudyCalendarItem(BaseModel):
    date: str
    tasks: List[StudyTaskResponse] = []
    sessions: List[StudySessionResponse] = []


class FacultyContentCreate(BaseModel):
    course_id: str
    title: str
    content_type: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    due_date: Optional[str] = None


class FacultyContentResponse(BaseModel):
    id: str
    course_id: str
    faculty_id: str
    title: str
    content_type: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    due_date: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AssignmentSubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    content: Optional[str] = None
    file_url: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GradeUpdate(BaseModel):
    grade: float
    feedback: Optional[str] = None


class NoticeCreate(BaseModel):
    title: str
    content: str
    target_role: str = "all"
    department: Optional[str] = None


class NoticeResponse(BaseModel):
    id: str
    posted_by: str
    title: str
    content: str
    target_role: str = "all"
    department: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    location: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    posted_by: str
    title: str
    description: Optional[str] = None
    event_date: str
    location: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TimetableCreate(BaseModel):
    course_id: str
    faculty_id: str
    day_of_week: str
    start_time: str
    end_time: str
    room: Optional[str] = None


class TimetableResponse(BaseModel):
    id: str
    course_id: str
    faculty_id: str
    day_of_week: str
    start_time: str
    end_time: str
    room: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SubjectCreate(BaseModel):
    department_id: str
    name: str
    code: str
    credits: Optional[int] = None


class SubjectResponse(BaseModel):
    id: str
    department_id: str
    name: str
    code: str
    credits: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AdminAnalyticsResponse(BaseModel):
    user_counts: Dict[str, int]
    department_counts: Dict[str, int]
    course_counts: Dict[str, int]
    recent_logs: List["AuditLogResponse"] = []
    total_users: int
    total_courses: int
    total_departments: int


class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None


class ResumeCreate(BaseModel):
    title: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    address: Optional[str] = None
    summary: Optional[str] = None
    sections: Optional[List[Any]] = []


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    address: Optional[str] = None
    summary: Optional[str] = None
    sections: Optional[List[Any]] = []
    ats_score: int = 0
    ats_feedback: Optional[str] = None
    is_active: str = "true"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ResumeVersionResponse(BaseModel):
    id: str
    resume_id: str
    version_number: int
    title: Optional[str] = None
    sections: Optional[List[Any]] = []
    ats_score: int = 0
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InterviewSessionCreate(BaseModel):
    interview_type: str
    company: Optional[str] = None
    role: Optional[str] = None
    difficulty: str = "medium"
    question_count: int = 5


class InterviewQuestionResponse(BaseModel):
    id: str
    session_id: str
    question_text: str
    question_type: Optional[str] = None
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    user_answer: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InterviewSessionResponse(BaseModel):
    id: str
    user_id: str
    interview_type: str
    company: Optional[str] = None
    role: Optional[str] = None
    difficulty: str = "medium"
    status: str = "in_progress"
    score: Optional[float] = None
    feedback: Optional[str] = None
    question_count: int = 0
    questions: List["InterviewQuestionResponse"] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InterviewAnswerSubmit(BaseModel):
    question_id: str
    answer: str


class CodingChallengeCreate(BaseModel):
    topic: str
    difficulty: str = "medium"
    language: str = "python"


class CodingChallengeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    difficulty: str = "medium"
    topic: Optional[str] = None
    starter_code: Optional[str] = None
    language: str = "python"
    status: str = "pending"
    score: Optional[float] = None
    feedback: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CodingSubmitRequest(BaseModel):
    solution: str
    language: str


class CodingResultResponse(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None
    test_cases: List[Dict[str, Any]] = []


class AptitudeQuestionResponse(BaseModel):
    id: str
    user_id: str
    category: str
    question_text: str
    options: Optional[Any] = None
    difficulty: str = "medium"

    model_config = {"from_attributes": True}


class AptitudeAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken: Optional[int] = None


class LinkedInGenerateRequest(BaseModel):
    name: str
    current_role: str
    years_of_experience: int
    skills: List[str]
    career_goals: str


class LinkedInProfileResponse(BaseModel):
    id: str
    user_id: str
    headline: Optional[str] = None
    about: Optional[str] = None
    experience: Optional[List[Any]] = []
    education: Optional[List[Any]] = []
    skills: Optional[List[Any]] = []
    certifications: Optional[List[Any]] = []
    projects: Optional[List[Any]] = []
    ai_generated: str = "true"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlacementDashboardResponse(BaseModel):
    resume_count: int
    interview_count: int
    coding_count: int
    aptitude_count: int
    recent_interviews: List[InterviewSessionResponse] = []
    recent_coding: List[CodingChallengeResponse] = []


StudyPlanResponse.model_rebuild()
InterviewSessionResponse.model_rebuild()
AdminAnalyticsResponse.model_rebuild()
