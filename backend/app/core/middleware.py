import time
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("campusgpt")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)"
        )
        response.headers["X-Process-Time"] = str(duration_ms)
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._requests = {}
        self._last_prune = time.time()

    async def dispatch(self, request: Request, call_next):
        from app.core.config import settings
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        window = settings.RATE_LIMIT_WINDOW_SECONDS
        max_reqs = settings.RATE_LIMIT_REQUESTS
        now = time.time()
        
        # Periodically prune expired IP records to prevent memory leak
        if now - self._last_prune > 300:
            inactive_ips = []
            for ip, timestamps in list(self._requests.items()):
                valid_timestamps = [t for t in timestamps if now - t < window]
                if not valid_timestamps:
                    inactive_ips.append(ip)
                else:
                    self._requests[ip] = valid_timestamps
            for ip in inactive_ips:
                self._requests.pop(ip, None)
            self._last_prune = now
        
        if client_ip not in self._requests:
            self._requests[client_ip] = []
        
        self._requests[client_ip] = [t for t in self._requests[client_ip] if now - t < window]
        
        if len(self._requests[client_ip]) >= max_reqs:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        self._requests[client_ip].append(now)
        return await call_next(request)


def add_exception_handlers(app):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        detail = []
        for err in errors:
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            msg = err.get("msg", "")
            detail.append(f"{loc}: {msg}")
        logger.warning(f"Validation error: {detail}")
        return JSONResponse(
            status_code=422,
            content={"detail": detail or "Validation error"},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Please try again later."},
        )
