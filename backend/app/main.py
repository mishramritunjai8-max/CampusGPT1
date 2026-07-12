import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.middleware import RequestLoggingMiddleware, RateLimitMiddleware, add_exception_handlers
from app.db.init_db import init_db
from app.api import auth, student, faculty, admin, assistant, documents, notes, quiz, attendance, study_planner, faculty_portal, admin_portal, student_portal, placement

os.makedirs("logs", exist_ok=True)

logger = setup_logging(debug=settings.DEBUG)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG
)

add_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

_start_time = time.time()

@app.on_event("startup")
def on_startup():
    logger.info("Starting CampusGPT API...")
    init_db()
    logger.info("Database initialized and ready.")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": int(time.time() - _start_time),
        "database": "PostgreSQL (Supabase)" if settings.DATABASE_URL else "SQLite (Fallback local mode)",
        "ai_provider": settings.AI_PROVIDER,
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "uptime_seconds": int(time.time() - _start_time)}

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(student.router, prefix=f"{settings.API_V1_STR}/student", tags=["student"])
app.include_router(faculty.router, prefix=f"{settings.API_V1_STR}/faculty", tags=["faculty"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(assistant.router, prefix=f"{settings.API_V1_STR}/assistant", tags=["assistant"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}", tags=["documents"])
app.include_router(notes.router, prefix=f"{settings.API_V1_STR}", tags=["notes"])
app.include_router(quiz.router, prefix=f"{settings.API_V1_STR}", tags=["quiz"])
app.include_router(attendance.router, prefix=f"{settings.API_V1_STR}", tags=["attendance"])
app.include_router(study_planner.router, prefix=f"{settings.API_V1_STR}", tags=["study-planner"])
app.include_router(faculty_portal.router, prefix=f"{settings.API_V1_STR}/faculty", tags=["faculty-portal"])
app.include_router(admin_portal.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin-portal"])
app.include_router(student_portal.router, prefix=f"{settings.API_V1_STR}/student", tags=["student-portal"])
app.include_router(placement.router, prefix=f"{settings.API_V1_STR}", tags=["placement"])
