from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import Application, ApplicationStatus
from .schemas import ApplicationCreate, ApplicationUpdate

def list_applications(
    db: Session,
    q: str | None = None,
    status: str | None = None,
    sort: str = "-created_at",
):
    stmt = select(Application)

    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where((Application.company.ilike(like)) | (Application.role.ilike(like)))

    if status:
        stmt = stmt.where(Application.status == ApplicationStatus(status))

    key = sort.lstrip("-")
    desc = sort.startswith("-")

    col_map = {
        "date_applied": Application.date_applied,
        "created_at": Application.created_at,
        "updated_at": Application.updated_at,
        "company": Application.company,
    }
    col = col_map.get(key, Application.created_at)
    stmt = stmt.order_by(col.desc() if desc else col.asc())

    return db.scalars(stmt).all()

def get_application(db: Session, app_id: int) -> Application | None:
    return db.get(Application, app_id)

def create_application(db: Session, data: ApplicationCreate) -> Application:
    obj = Application(
        company=data.company,
        role=data.role,
        status=ApplicationStatus(data.status),
        date_applied=data.date_applied,
        location=data.location,
        job_url=str(data.job_url) if data.job_url else None,
        salary_range=data.salary_range,
        notes=data.notes,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_application(db: Session, obj: Application, data: ApplicationUpdate) -> Application:
    patch = data.model_dump(exclude_unset=True)

    if "status" in patch and patch["status"] is not None:
        patch["status"] = ApplicationStatus(patch["status"])
    if "job_url" in patch and patch["job_url"] is not None:
        patch["job_url"] = str(patch["job_url"])

    for k, v in patch.items():
        setattr(obj, k, v)

    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj

def delete_application(db: Session, obj: Application) -> None:
    db.delete(obj)
    db.commit()
