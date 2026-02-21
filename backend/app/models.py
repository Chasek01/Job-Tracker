import enum
from datetime import datetime, date
from sqlalchemy import String, Text, Date, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

class ApplicationStatus(str, enum.Enum):
    APPLIED = "Applied"
    INTERVIEW = "Interview"
    OFFER = "Offer"
    REJECTED = "Rejected"

class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    company: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(200), nullable=False)

    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )

    date_applied: Mapped[date | None] = mapped_column(Date, nullable=True)

    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    job_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    salary_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
