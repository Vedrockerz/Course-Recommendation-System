from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(example="ok")
    message: str = Field(example="AI Course Recommendation API is running")


class RecommendationItem(BaseModel):
    course_title: str
    platform: Optional[str] = None
    level: Optional[str] = None
    duration_category: Optional[str] = None
    duration_hours: Optional[float] = None
    rating: Optional[float] = None
    reviewcount: Optional[float] = None
    course_url: Optional[str] = None


class RecommendationResponse(BaseModel):
    query: str
    top_k: int
    count: int
    results: List[RecommendationItem]


class SimilarResponse(BaseModel):
    course_name: str
    top_k: int
    count: int
    results: List[RecommendationItem]


class ErrorResponse(BaseModel):
    detail: str
