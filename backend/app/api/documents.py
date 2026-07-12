from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Document
from app.core.security import get_current_user
import os, uuid

router = APIRouter()

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ".bin"
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(upload_dir, filename)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    doc = Document(
        user_id=current_user.id,
        filename=filename,
        original_name=file.filename or "unknown",
        file_type=ext.lower(),
        file_size=len(content),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "filename": doc.original_name, "file_type": doc.file_type, "file_size": doc.file_size}

@router.get("/documents")
def list_documents(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return [{"id": d.id, "filename": d.original_name, "file_type": d.file_type, "file_size": d.file_size, "created_at": str(d.created_at)} for d in docs]

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    path = os.path.join("uploads", doc.filename)
    if os.path.exists(path):
        os.remove(path)
    db.delete(doc)
    db.commit()
    return {"ok": True}
