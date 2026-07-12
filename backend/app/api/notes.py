from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Note
from app.schemas.schemas import NoteGenerateRequest, NoteResponse
from app.core.security import get_current_user
from app.services.notes_generator import generate_note_content
from app.services.export_service import export_note
from fastapi.responses import Response
import uuid

router = APIRouter()

@router.get("/notes/types")
def get_note_types():
    from app.api.note_types import NOTE_TYPES
    return NOTE_TYPES

@router.get("/notes")
def list_notes(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.created_at.desc()).all()
    return [NoteResponse.model_validate(n) for n in notes]

@router.post("/notes/generate")
def generate_note(data: NoteGenerateRequest, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    content = generate_note_content(data.note_type, data.topic, data.subject, data.additional_context)
    note = Note(user_id=current_user.id, title=f"{data.note_type.title()} - {data.topic}", note_type=data.note_type, content=content, subject=data.subject, topic=data.topic)
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteResponse.model_validate(note)

@router.post("/notes/generate/stream")
def generate_note_stream(data: NoteGenerateRequest, current_user: Profile = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    import json
    from app.services.notes_generator import generate_note_content_stream
    async def stream():
        full = ""
        for token in generate_note_content_stream(data.note_type, data.topic, data.subject, data.additional_context):
            full += token
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
    return StreamingResponse(stream(), media_type="text/event-stream")

@router.get("/notes/{note_id}")
def get_note(note_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse.model_validate(note)

@router.delete("/notes/{note_id}")
def delete_note(note_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}

@router.get("/notes/{note_id}/export/{format}")
def export_note_endpoint(note_id: str, format: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    content, media_type, filename = export_note(note, format)
    return Response(content=content, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})
