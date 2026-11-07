"""CropWise local API.

    cd backend && ../ml/.venv/bin/python -m uvicorn cropwise_api.main:app --host 127.0.0.1 --port 8000

Binds to localhost only: this is a single-machine system, nothing is hosted.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import Settings, get_settings
from .jobs import JobManager, ModelHost
from .ml.base import MlError
from .ml.registry import build_leaf_classifier, build_soil_reader
from .routes import router
from .state import AppState
from .storage import AnalysisRepo, UploadStore

log = logging.getLogger("cropwise")


def create_app(settings: Settings | None = None, *, leaf_factory=build_leaf_classifier) -> FastAPI:
    """``leaf_factory`` lets tests (or a future model) swap the classifier without touching routes."""
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        uploads = UploadStore(settings)
        repo = AnalysisRepo(settings)
        leaf = ModelHost(settings, leaf_factory)
        soil_reader = build_soil_reader(settings)
        jobs = JobManager(settings, uploads, repo, leaf, soil_reader)
        app.state.cropwise = AppState(settings, uploads, repo, leaf, soil_reader, jobs)

        if settings.preload_model:
            try:
                model = leaf.get()
                log.info("Leaf model ready: %s run=%s device=%s", model.info.model_id, model.info.run_id, model.info.device)
            except MlError as exc:
                # Keep serving: /health reports the problem and the first analysis retries the load.
                log.error("Leaf model not loaded at startup: %s", exc.message)
        try:
            yield
        finally:
            jobs.shutdown()

    app = FastAPI(title="CropWise local API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
        allow_credentials=True,
    )

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        # The web client reads `fieldErrors` at the top level of 400/422 bodies.
        body = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        field_errors: dict[str, str] = {}
        for err in exc.errors():
            loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
            field_errors[".".join(loc) or "request"] = err["type"]
        return JSONResponse(status_code=422, content={"message": "Validation failed", "fieldErrors": field_errors})

    app.include_router(router, prefix=settings.api_prefix)
    return app


app = create_app()
