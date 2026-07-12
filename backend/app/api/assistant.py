from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.models.models import Profile, ChatSession, ChatMessage
from app.core.security import get_current_user

router = APIRouter()

@router.get("/sessions")
def list_sessions(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    result = []
    for s in sessions:
        msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        result.append({
            "id": s.id,
            "title": s.title,
            "is_pinned": str(s.is_pinned).lower(),
            "message_count": msg_count,
            "created_at": str(s.created_at),
            "updated_at": str(s.updated_at)
        })
    return result

@router.get("/sessions/search")
def search_sessions(q: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.title.ilike(f"%{q}%")
    ).order_by(ChatSession.updated_at.desc()).all()
    result = []
    for s in sessions:
        msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        result.append({
            "id": s.id,
            "title": s.title,
            "is_pinned": str(s.is_pinned).lower(),
            "message_count": msg_count,
            "created_at": str(s.created_at),
            "updated_at": str(s.updated_at)
        })
    return result

@router.post("/sessions")
def create_session(
    data: Optional[dict] = None,
    title: Optional[str] = None,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session_title = "New Chat"
    if data and "title" in data:
        session_title = data["title"]
    elif title:
        session_title = title
        
    session = ChatSession(user_id=current_user.id, title=session_title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "id": session.id,
        "title": session.title,
        "is_pinned": "false",
        "created_at": str(session.created_at),
        "updated_at": str(session.updated_at)
    }

@router.get("/sessions/{session_id}")
def get_session(session_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()
    return {
        "id": session.id,
        "title": session.title,
        "is_pinned": str(session.is_pinned).lower(),
        "created_at": str(session.created_at),
        "updated_at": str(session.updated_at),
        "messages": [{"id": m.id, "sender": m.role, "content": m.content, "created_at": str(m.created_at)} for m in messages]
    }

@router.patch("/sessions/{session_id}")
def update_session(session_id: str, data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "title" in data:
        session.title = data["title"]
    if "is_pinned" in data:
        is_pinned = data["is_pinned"]
        if isinstance(is_pinned, str):
            session.is_pinned = is_pinned.lower() == "true"
        else:
            session.is_pinned = bool(is_pinned)
            
    db.commit()
    db.refresh(session)
    return {
        "id": session.id,
        "title": session.title,
        "is_pinned": str(session.is_pinned).lower(),
        "created_at": str(session.created_at),
        "updated_at": str(session.updated_at)
    }

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in messages]

@router.post("/ask")
def ask_assistant(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session_id = data.get("session_id")
    message = data.get("message", "")
    if not session_id:
        session = ChatSession(user_id=current_user.id, title=message[:50])
        db.add(session)
        db.commit()
        session_id = session.id
    user_msg = ChatMessage(session_id=session_id, role="user", content=message)
    db.add(user_msg)
    from app.services.ai_service import get_ai_response
    reply = get_ai_response(message)
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()
    return {"content": reply, "session_id": session_id, "created_at": str(assistant_msg.created_at)}

@router.post("/ask/stream")
def ask_stream(data: dict, current_user: Profile = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    import json
    from app.services.ai_service import get_ai_stream
    message = data.get("message", "")
    async def generate():
        full = ""
        for token in get_ai_stream(message):
            full += token
            yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
        import uuid
        yield f"data: {json.dumps({'token': '', 'done': True, 'session_id': str(uuid.uuid4())})}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/regenerate")
def regenerate_response(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    last_user_msg = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "user"
    ).order_by(ChatMessage.created_at.desc()).first()
    if not last_user_msg:
        raise HTTPException(status_code=404, detail="No user message found to regenerate response")
    
    db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "assistant",
        ChatMessage.created_at > last_user_msg.created_at
    ).delete()
    
    from app.services.ai_service import get_ai_response
    reply = get_ai_response(last_user_msg.content)
    
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()
    
    return {
        "content": reply,
        "session_id": session_id,
        "created_at": str(assistant_msg.created_at)
    }

@router.post("/suggestions")
def get_suggestions(current_user: Profile = Depends(get_current_user)):
    return {
        "suggestions": [
            "Explain neural network backpropagation in simple terms.",
            "Create a study plan for my upcoming Calculus exam.",
            "Help me write a professional summary for my software engineering resume.",
            "What are the key concepts of data structures and algorithms?"
        ]
    }
