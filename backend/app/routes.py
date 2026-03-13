from difflib import get_close_matches
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException, Query, Request

from src.utils.logger import logging

from app.schemas import (
    RecommendationResponse,
    SimilarResponse,
)


router = APIRouter()


def _format_results(rows) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    for row in rows.to_dict(orient="records"):
        duration_category = row.get("duration_category") or row.get("Duration_Category")

        results.append(
            {
                "course_title": row.get("course_title"),
                "platform": row.get("platform"),
                "level": row.get("level"),
                "duration_category": duration_category,
                "duration_hours": row.get("duration_hours"),
                "rating": row.get("rating"),
                "reviewcount": row.get("reviewcount"),
                "course_url": row.get("course_url"),
                "image": row.get("image") if row.get("image") not in (None, "No_Image", "") else None,
                "similarity_score": row.get("similarity_score"),
                "metadata": row.get("metadata"),
            }
        )

    return results


@router.get(
    "/health",
    summary="Readiness health check",
    tags=["Health"],
)
def health_check(request: Request) -> Dict[str, str]:
    if getattr(request.app.state, "is_ready", False):
        return {"status": "ok"}
    raise HTTPException(status_code=503, detail="AI recommendation engine is initializing")


@router.get(
    "/",
    summary="API status",
    tags=["Health"],
)
def root_status() -> Dict[str, str]:
    return {"status": "running"}


def _ensure_engine_ready(request: Request) -> None:
    if not getattr(request.app.state, "is_ready", False):
        raise HTTPException(status_code=503, detail="AI recommendation engine is initializing")


@router.get(
    "/recommend",
    response_model=RecommendationResponse,
    summary="Recommend courses by query",
    responses={
        200: {
            "description": "Successful recommendations",
            "content": {
                "application/json": {
                    "example": {
                        "query": "machine learning",
                        "top_k": 5,
                        "count": 2,
                        "results": [
                            {
                                "course_title": "Machine Learning A-Z",
                                "platform": "Udemy",
                                "level": "Beginner",
                                "duration_category": "Long",
                                "duration_hours": 42.5,
                                "rating": 4.5,
                                "reviewcount": 166138,
                                "course_url": "https://www.udemy.com/course/machinelearning",
                            },
                            {
                                "course_title": "Introduction to Machine Learning",
                                "platform": "Coursera",
                                "level": "Intermediate",
                                "duration_category": "Medium",
                                "duration_hours": 10.0,
                                "rating": 4.7,
                                "reviewcount": 2100,
                                "course_url": "https://www.coursera.org/learn/intro-machine-learning",
                            },
                        ],
                    }
                }
            },
        }
    },
)
def recommend_courses(
    request: Request,
    query: str = Query(..., min_length=2, description="Search text, skill, or intent"),
    level: str | None = Query(None, description="Optional level filter (e.g., Beginner)"),
    duration_category: str | None = Query(None, description="Optional duration filter: Short/Medium/Long/Unknown"),
    top_k: int = Query(5, ge=1, le=50, description="Number of recommendations"),
) -> RecommendationResponse:
    try:
        logging.info("/recommend called")
        _ensure_engine_ready(request)

        artifact_config = request.app.state.artifact_config
        content_model = request.app.state.content_model
        hybrid_model = request.app.state.hybrid_model

        candidate_pool = max(artifact_config.faiss_candidate_pool, top_k * 10)

        raw_results = content_model.get_recommendations(query=query, candidate_pool=candidate_pool)

        final_df = hybrid_model.recommend_best_learning(
            results_df=raw_results,
            level_filter=level,
            duration_category_filter=duration_category,
            top_n=top_k,
        )

        payload = _format_results(final_df)

        return RecommendationResponse(
            query=query,
            top_k=top_k,
            count=len(payload),
            results=payload,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("Error in /recommend")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(exc)}") from exc


@router.get(
    "/similar",
    response_model=SimilarResponse,
    summary="Get similar courses by course name",
    responses={
        200: {
            "description": "Successful similar-course recommendations",
            "content": {
                "application/json": {
                    "example": {
                        "course_name": "Machine Learning A-Z",
                        "top_k": 5,
                        "count": 2,
                        "results": [
                            {
                                "course_title": "Machine Learning with Python",
                                "platform": "Udemy",
                                "level": "Beginner",
                                "duration_category": "Long",
                                "duration_hours": 30.0,
                                "rating": 4.6,
                                "reviewcount": 98000,
                                "course_url": "https://www.udemy.com/course/machine-learning-with-python",
                            },
                            {
                                "course_title": "Applied Machine Learning",
                                "platform": "Coursera",
                                "level": "Intermediate",
                                "duration_category": "Medium",
                                "duration_hours": 12.0,
                                "rating": 4.8,
                                "reviewcount": 8400,
                                "course_url": "https://www.coursera.org/learn/applied-machine-learning",
                            },
                        ],
                    }
                }
            },
        },
        404: {
            "description": "Course not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Course name not found. Please provide a valid course title.",
                    }
                }
            },
        },
    },
)
def similar_courses(
    request: Request,
    course_name: str = Query(..., min_length=2, description="Exact course title to find similar courses"),
    level: str | None = Query(None, description="Optional level filter (e.g., Beginner)"),
    duration_category: str | None = Query(None, description="Optional duration filter: Short/Medium/Long/Unknown"),
    top_k: int = Query(5, ge=1, le=50, description="Number of similar recommendations"),
) -> SimilarResponse:
    try:
        logging.info("/similar called")
        _ensure_engine_ready(request)

        artifact_config = request.app.state.artifact_config
        content_model = request.app.state.content_model
        hybrid_model = request.app.state.hybrid_model
        df = request.app.state.df

        title_lookup = {str(title).strip().lower(): str(title) for title in df["course_title"].astype(str).tolist()}

        normalized_input = course_name.strip().lower()

        if normalized_input in title_lookup:
            resolved_course_name = title_lookup[normalized_input]
        else:
            close_matches = get_close_matches(
                course_name,
                df["course_title"].astype(str).tolist(),
                n=3,
                cutoff=0.8,
            )

            suggestion_text = f" Suggestions: {', '.join(close_matches)}" if close_matches else ""

            raise HTTPException(
                status_code=404,
                detail=f"Course name not found. Please provide a valid course title.{suggestion_text}",
            )

        candidate_pool = max(artifact_config.faiss_candidate_pool, top_k * 10)

        raw_results = content_model.recommend_by_course_name(
            course_name=resolved_course_name,
            candidate_pool=candidate_pool,
        )

        final_df = hybrid_model.recommend_best_learning(
            results_df=raw_results,
            level_filter=level,
            duration_category_filter=duration_category,
            top_n=top_k,
        )

        payload = _format_results(final_df)

        return SimilarResponse(
            course_name=resolved_course_name,
            top_k=top_k,
            count=len(payload),
            results=payload,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("Error in /similar")
        raise HTTPException(status_code=500, detail=f"Failed to generate similar courses: {str(exc)}") from exc
