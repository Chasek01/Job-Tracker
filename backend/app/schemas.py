from datetime import date, datetime
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from .models import ApplicationStatus

class ApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    status: ApplicationStatus = ApplicationStatus.APPLIED

    date_applied: Optional[date] = None
    location: Optional[str] = Field(default=None, max_length=200)
    job_url: Optional[HttpUrl] = None
    salary_range: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company: Optional[str] = Field(default=None, min_length=1, max_length=200)
    role: Optional[str] = Field(default=None, min_length=1, max_length=200)
    status: Optional[ApplicationStatus] = None

    date_applied: Optional[date] = None
    location: Optional[str] = Field(default=None, max_length=200)
    job_url: Optional[HttpUrl] = None
    salary_range: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = None

class ApplicationOut(ApplicationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
