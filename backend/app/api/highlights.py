from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.meetings import get_meeting_or_404
from app.database import get_db

router = APIRouter(prefix="/api", tags=["highlights"])


@router.get("/highlights", response_model=list[schemas.Highlight])
def list_all_highlights(db: Session = Depends(get_db)):
    return db.query(models.Highlight).order_by(models.Highlight.created_at.desc()).all()


@router.get("/meetings/{meeting_id}/highlights", response_model=list[schemas.Highlight])
def list_highlights(meeting_id: int, db: Session = Depends(get_db)):
    return get_meeting_or_404(meeting_id, db).highlights


@router.post("/meetings/{meeting_id}/highlights", response_model=schemas.Highlight, status_code=201)
def create_highlight(
    meeting_id: int, payload: schemas.HighlightCreate, db: Session = Depends(get_db)
):
    get_meeting_or_404(meeting_id, db)
    highlight = models.Highlight(meeting_id=meeting_id, **payload.model_dump())
    db.add(highlight)
    db.commit()
    db.refresh(highlight)
    return highlight


@router.delete("/highlights/{highlight_id}", status_code=204)
def delete_highlight(highlight_id: int, db: Session = Depends(get_db)):
    highlight = db.get(models.Highlight, highlight_id)
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    db.delete(highlight)
    db.commit()
