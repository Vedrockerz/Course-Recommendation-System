from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(example="ok", description="Status of the API")
    backend_ready: bool = Field(example=True, description="Whether recommendation engine is ready")
    uptime: float = Field(example=3600.5, description="Uptime in seconds")
    timestamp: datetime = Field(description="Server timestamp (ISO 8601)")
    environment: str = Field(example="production", description="Deployment environment")
    version: str = Field(example="1.0.0", description="API version")


class ErrorResponse(BaseModel):
    error: bool = Field(example=True, description="Error flag")
    message: str = Field(description="Human-readable error message")
    code: str = Field(example="BACKEND_TIMEOUT", description="Error code for programmatic handling")
    timestamp: datetime = Field(description="When the error occurred")


class RecommendationItem(BaseModel):
    course_title: str
    platform: Optional[str] = None
    level: Optional[str] = None
    duration_category: Optional[str] = None
    duration_hours: Optional[float] = None
    rating: Optional[float] = None
    reviewcount: Optional[float] = None
    course_url: Optional[str] = None
    image: Optional[str] = None
    similarity_score: Optional[float] = None
    metadata: Optional[str] = None


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


class YouTubeItem(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    channel_title: Optional[str] = None
    published_date: Optional[datetime] = None
    video_url: Optional[str] = None
    type: str = Field(example="video")
    source: str = Field(example="youtube")


class YouTubeResponse(BaseModel):
    query: str
    top_k: int
    count: int
    results: List[YouTubeItem]


class ErrorResponse(BaseModel):
    detail: str
