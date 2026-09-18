from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.meetings import get_meeting_or_404
from app.database import get_db

router = APIRouter(prefix="/api", tags=["action-items"])


@router.get("/meetings/{meeting_id}/action-items", response_model=list[schemas.ActionItem])
def list_action_items(meeting_id: int, db: Session = Depends(get_db)):
    return get_meeting_or_404(meeting_id, db).action_items


@router.post("/meetings/{meeting_id}/action-items", response_model=schemas.ActionItem, status_code=201)
def create_action_item(
    meeting_id: int, payload: schemas.ActionItemCreate, db: Session = Depends(get_db)
):
    get_meeting_or_404(meeting_id, db)
    item = models.ActionItem(meeting_id=meeting_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/action-items/{item_id}", response_model=schemas.ActionItem)
def update_action_item(
    item_id: int, payload: schemas.ActionItemUpdate, db: Session = Depends(get_db)
):
    item = db.get(models.ActionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.ActionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    db.delete(item)
    db.commit()
