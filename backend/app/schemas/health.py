"""Response schemas for service health endpoints."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health status returned by the API."""

    status: Literal["healthy"]
    service: str
    phase: str
