from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from . import crud, schemas

app = FastAPI(title="Job Application Tracker API")

# Dev convenience: create tables if they don't exist
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/applications", response_model=list[schemas.ApplicationOut])
def list_apps(
    q: str | None = Query(default=None, description="Search company or role"),
    status: str | None = Query(default=None, description="Applied|Interview|Offer|Rejected"),
    sort: str = Query(default="-created_at", description="e.g. -created_at, created_at, company"),
    db: Session = Depends(get_db),
):
    try:
        return crud.list_applications(db, q=q, status=status, sort=sort)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/applications", response_model=schemas.ApplicationOut, status_code=201)
def create_app(payload: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    return crud.create_application(db, payload)

@app.get("/applications/{app_id}", response_model=schemas.ApplicationOut)
def get_app(app_id: int, db: Session = Depends(get_db)):
    obj = crud.get_application(db, app_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return obj

@app.put("/applications/{app_id}", response_model=schemas.ApplicationOut)
def update_app(app_id: int, payload: schemas.ApplicationUpdate, db: Session = Depends(get_db)):
    obj = crud.get_application(db, app_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return crud.update_application(db, obj, payload)

@app.delete("/applications/{app_id}", status_code=204)
def delete_app(app_id: int, db: Session = Depends(get_db)):
    obj = crud.get_application(db, app_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Application not found")
    crud.delete_application(db, obj)
    return None
