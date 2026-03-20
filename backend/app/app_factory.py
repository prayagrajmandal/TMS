from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.api import router as api_router


def create_app() -> FastAPI:
    app = FastAPI(title="TMS FastAPI Backend")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"ok": True}

    app.include_router(api_router)
    return app
