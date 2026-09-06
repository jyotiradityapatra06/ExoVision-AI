"""NASA dataset discovery and sample-data endpoints."""

from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Response, status

from app.api.dependencies import CurrentUser
from app.core.security import authenticated_identity, enforce_rate_limit
from app.services.nasa import KeplerService, MastService, MastServiceError, TessService

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/search")
def search_datasets(
    user: CurrentUser,
    target: str = Query(min_length=1, max_length=120),
    mission: Literal["all", "kepler", "tess"] = "all",
):
    """Resolve a target and return downloadable Kepler/TESS light curves."""
    enforce_rate_limit("mast_search", authenticated_identity(user))
    try:
        if mission == "kepler":
            return KeplerService().search(target)
        if mission == "tess":
            return TessService().search(target)
        return MastService().search(target, ("KEPLER", "K2", "TESS"))
    except MastServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "NASA MAST archive is temporarily unavailable. "
                "Please retry the search."
            ),
        ) from error


@router.get("/download")
def download_dataset(
    user: CurrentUser,
    data_uri: str = Query(min_length=6, max_length=500),
) -> Response:
    """Proxy one validated MAST FITS product so it can enter the upload API."""
    enforce_rate_limit("mast_download", authenticated_identity(user))
    try:
        filename, content = MastService().download(data_uri)
    except MastServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "NASA MAST archive is temporarily unavailable. "
                "Please retry the search."
            ),
        ) from error
    return Response(
        content,
        media_type="application/fits",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/demo")
def download_demo_dataset(_user: CurrentUser) -> Response:
    """Return the repository's deterministic transit sample."""
    sample = (
        Path(__file__).resolve().parents[4]
        / "data"
        / "samples"
        / "exoplanet_demo_transit.fits"
    )
    if not sample.is_file():
        raise HTTPException(status_code=404, detail="Demo dataset is not installed.")
    return Response(
        sample.read_bytes(),
        media_type="application/fits",
        headers={"Content-Disposition": f'attachment; filename="{sample.name}"'},
    )
