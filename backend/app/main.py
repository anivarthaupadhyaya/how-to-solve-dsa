"""FastAPI application entrypoint configuring CORS and core routes."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routers.auth import router as auth_router
from app.routers.items import router as items_router
from app.routers.reviews import router as reviews_router
from app.routers.subjects import router as subjects_router
from app.routers.tags import router as tags_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Attach slowapi state and rate limit exceeded exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure Cross-Origin Resource Sharing (CORS) driven by CORS_ORIGINS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routers
app.include_router(auth_router)
app.include_router(subjects_router)
app.include_router(items_router)
app.include_router(tags_router)
app.include_router(reviews_router)


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Service health check endpoint returning server availability status."""
    return {"status": "ok"}

