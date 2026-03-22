from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests

from src.utils.logger import logging


YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


@dataclass
class YouTubeResult:
    title: str
    description: str
    thumbnail: Optional[str]
    channel_title: str
    published_at: Optional[str]
    video_url: Optional[str]
    content_type: str
    source: str = "youtube"


class YouTubeService:
    """Small wrapper around YouTube Data API search for learning resources."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_max_results: Optional[int] = None,
        timeout_seconds: Optional[int] = None,
    ) -> None:
        self.api_key = (api_key or os.getenv("YOUTUBE_API_KEY", "")).strip()
        self.default_max_results = int(os.getenv("YOUTUBE_MAX_RESULTS", str(default_max_results or 6)))
        self.timeout_seconds = int(os.getenv("YOUTUBE_TIMEOUT_SECONDS", str(timeout_seconds or 8)))

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def fetch_learning_resources(self, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """Fetch videos/playlists and normalize into a UI-friendly schema."""
        if not self.enabled:
            logging.info("YouTube API key not configured; skipping live resource fetch")
            return []

        cleaned_query = query.strip()
        if not cleaned_query:
            return []

        requested = top_k if top_k is not None else self.default_max_results
        max_results = max(1, min(int(requested), 15))

        params = {
            "part": "snippet",
            "q": f"{cleaned_query} tutorial course",
            "type": "video,playlist",
            "order": "relevance",
            "maxResults": max_results,
            "key": self.api_key,
        }

        try:
            response = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=self.timeout_seconds)
            response.raise_for_status()
            payload = response.json() if response.content else {}
            items = payload.get("items", [])
            normalized_items: List[Dict[str, Any]] = []
            for item in items:
                normalized = self._normalize_item(item)
                if normalized is not None:
                    normalized_items.append(normalized)
            return normalized_items
        except requests.RequestException as exc:
            logging.warning("YouTube API request failed: %s", str(exc))
            return []
        except Exception:
            logging.exception("Unexpected YouTube integration error")
            return []

    def _normalize_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        id_obj = item.get("id") or {}
        snippet = item.get("snippet") or {}

        resource_kind = str(id_obj.get("kind") or "")
        if resource_kind.endswith("video"):
            resource_type = "video"
            resource_id = id_obj.get("videoId")
            resource_url = f"https://www.youtube.com/watch?v={resource_id}" if resource_id else None
        elif resource_kind.endswith("playlist"):
            resource_type = "playlist"
            resource_id = id_obj.get("playlistId")
            resource_url = f"https://www.youtube.com/playlist?list={resource_id}" if resource_id else None
        else:
            return None

        thumb_obj = snippet.get("thumbnails") or {}
        thumbnail = (
            (thumb_obj.get("high") or {}).get("url")
            or (thumb_obj.get("medium") or {}).get("url")
            or (thumb_obj.get("default") or {}).get("url")
        )

        published_at = self._to_iso_date(snippet.get("publishedAt"))

        result = YouTubeResult(
            title=str(snippet.get("title") or "Untitled"),
            description=str(snippet.get("description") or ""),
            thumbnail=thumbnail,
            channel_title=str(snippet.get("channelTitle") or "Unknown Channel"),
            published_at=published_at,
            video_url=resource_url,
            content_type=resource_type,
        )

        return {
            "title": result.title,
            "description": result.description,
            "thumbnail": result.thumbnail,
            "channel_title": result.channel_title,
            "published_date": result.published_at,
            "video_url": result.video_url,
            "type": result.content_type,
            "source": result.source,
        }

    @staticmethod
    def _to_iso_date(raw_value: Any) -> Optional[str]:
        if not raw_value:
            return None
        try:
            parsed = datetime.fromisoformat(str(raw_value).replace("Z", "+00:00"))
            return parsed.astimezone(timezone.utc).isoformat()
        except Exception:
            return None
