"""API router endpoints package."""

from app.routers.auth import router as auth_router
from app.routers.subjects import router as subjects_router
from app.routers.items import router as items_router

__all__ = ["auth_router", "subjects_router", "items_router"]
