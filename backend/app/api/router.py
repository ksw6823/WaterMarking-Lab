from fastapi import APIRouter

from app.api.endpoints.detections import router as detections_router
from app.api.endpoints.generations import router as generations_router
from app.api.endpoints.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(generations_router, prefix="/generations", tags=["generations"])
api_router.include_router(detections_router, prefix="/detections", tags=["detections"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])

