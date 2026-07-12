from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
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
        result.append({"id": s.id, "title": s.title, "is_pinned": s.is_pinned, "message_count": msg_count, "created_at": str(s.created_at), "updated_at": str(s.updated_at)})
    return result

@router.post("/sessions")
def create_session(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = ChatSession(user_id=current_user.id, title=data.get("title", "New Chat"))
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "created_at": str(session.created_at)}

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
    return {"reply": reply, "session_id": session_id}

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
