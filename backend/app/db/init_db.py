from app.db.session import engine, SessionLocal
from app.models.models import Base, Profile, Course, Enrollment, ChatSession, ChatMessage
from app.core.security import create_access_token
import datetime


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Profile).first()
        if existing:
            return
        
        admin = Profile(id="demo-admin-id", email="admin@campusgpt.com", full_name="Admin User", role="admin", department="Administration")
        faculty1 = Profile(id="demo-faculty-1-id", email="faculty1@campusgpt.com", full_name="Dr. Sarah Wilson", role="faculty", department="Computer Science")
        faculty2 = Profile(id="demo-faculty-2-id", email="faculty2@campusgpt.com", full_name="Prof. James Brown", role="faculty", department="Mathematics")
        student1 = Profile(id="demo-student-1-id", email="student1@campusgpt.com", full_name="Alice Johnson", role="student", department="Computer Science")
        student2 = Profile(id="demo-student-2-id", email="student2@campusgpt.com", full_name="Bob Smith", role="student", department="Mathematics")
        
        db.add_all([admin, faculty1, faculty2, student1, student2])
        db.commit()
        
        course1 = Course(id="course-cs101", name="Introduction to Programming", code="CS101", faculty_id="demo-faculty-1-id", department="Computer Science", description="Fundamentals of programming using Python")
        course2 = Course(id="course-cs201", name="Data Structures", code="CS201", faculty_id="demo-faculty-1-id", department="Computer Science", description="Advanced data structures and algorithms")
        course3 = Course(id="course-math101", name="Calculus I", code="MATH101", faculty_id="demo-faculty-2-id", department="Mathematics", description="Differential and integral calculus")
        
        db.add_all([course1, course2, course3])
        db.commit()
        
        db.add_all([
            Enrollment(id="enr-1", student_id="demo-student-1-id", course_id="course-cs101"),
            Enrollment(id="enr-2", student_id="demo-student-1-id", course_id="course-cs201"),
            Enrollment(id="enr-3", student_id="demo-student-1-id", course_id="course-math101"),
            Enrollment(id="enr-4", student_id="demo-student-2-id", course_id="course-math101"),
        ])
        db.commit()
        
        session = ChatSession(id="demo-session-1", user_id="demo-student-1-id", title="Getting Started with Python")
        db.add(session)
        db.commit()
        
        msg1 = ChatMessage(id="msg-1", session_id="demo-session-1", role="user", content="What is a variable in Python?")
        msg2 = ChatMessage(id="msg-2", session_id="demo-session-1", role="assistant", content="A variable in Python is a name that references a value stored in memory. Python is dynamically typed, so you don't need to declare the type explicitly.")
        db.add_all([msg1, msg2])
        db.commit()
    finally:
        db.close()
