"""Small, dependency-free client for the public MAST API."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

MAST_INVOKE_URL = "https://mast.stsci.edu/api/v0/invoke"
MAST_DOWNLOAD_URL = "https://mast.stsci.edu/api/v0.1/Download/file"


class MastServiceError(RuntimeError):
    """Raised when MAST cannot satisfy a request."""


class MastService:
    """Search MAST observations and retrieve light-curve product metadata."""

    def __init__(self, *, timeout: float = 25.0) -> None:
        self.timeout = timeout

    def search(
        self, target: str, missions: tuple[str, ...], *, limit: int = 20
    ) -> list[dict[str, Any]]:
        target = target.strip()
        if not target:
            return []
        request = {
            "service": "Mast.Name.Lookup",
            "params": {"input": target, "format": "json"},
            "format": "json",
        }
        lookup = self._invoke(request)
        resolved = lookup.get("resolvedCoordinate") or []
        if not isinstance(resolved, list) or not resolved:
            return []
        coordinate = resolved[0]
        if (
            not isinstance(coordinate, dict)
            or not isinstance(coordinate.get("ra"), (int, float))
            or not isinstance(coordinate.get("decl"), (int, float))
        ):
            raise MastServiceError("MAST returned invalid target coordinates.")
        request = {
            "service": "Mast.Caom.Cone",
            "params": {
                "ra": coordinate["ra"],
                "dec": coordinate["decl"],
                "radius": 0.02,
            },
            "format": "json",
            "pagesize": 200,
            "page": 1,
        }
        observations = self._invoke(request).get("data", [])
        selected = [
            row
            for row in observations
            if str(row.get("obs_collection", "")).upper() in missions
        ]
        results: list[dict[str, Any]] = []
        # Bound sequential product metadata calls for crowded target fields.
        for observation in selected[:50]:
            products = self._products(str(observation.get("obsid", "")))
            for product in products:
                filename = str(product.get("productFilename", ""))
                if not filename.lower().endswith(("lc.fits", "llc.fits", "slc.fits")):
                    continue
                results.append(
                    {
                        "target_name": str(observation.get("target_name") or target),
                        "mission": str(observation.get("obs_collection", "")),
                        "observation_period": _observation_period(observation),
                        "format": "FITS",
                        "filename": filename,
                        "data_uri": str(product.get("dataURI", "")),
                        "size_bytes": _safe_size(product.get("size")),
                    }
                )
                if len(results) >= limit:
                    return results
        return results

    def download(self, data_uri: str) -> tuple[str, bytes]:
        if not data_uri.startswith("mast:") or "\r" in data_uri or "\n" in data_uri:
            raise MastServiceError("Invalid MAST product identifier.")
        url = f"{MAST_DOWNLOAD_URL}?{urlencode({'uri': data_uri})}"
        try:
            with urlopen(
                Request(url, headers={"User-Agent": "ExoVision-AI/1.0"}),
                timeout=self.timeout,
            ) as response:
                content = response.read(25 * 1024 * 1024 + 1)
        except (HTTPError, URLError, TimeoutError) as error:
            raise MastServiceError(f"MAST download failed: {error}") from error
        if len(content) > 25 * 1024 * 1024:
            raise MastServiceError("MAST product exceeds the 25 MB import limit.")
        if not content.startswith(b"SIMPLE"):
            raise MastServiceError("MAST did not return a valid FITS product.")
        filename = Path(data_uri.rsplit("/", 1)[-1]).name
        if not filename.lower().endswith(".fits"):
            filename = "mast-lightcurve.fits"
        return filename, content

    def _products(self, observation_id: str) -> list[dict[str, Any]]:
        if not observation_id:
            return []
        payload = self._invoke(
            {
                "service": "Mast.Caom.Products",
                "params": {"obsid": observation_id},
                "format": "json",
            }
        )
        return payload.get("data", [])

    def _invoke(self, request_payload: dict[str, Any]) -> dict[str, Any]:
        body = urlencode({"request": json.dumps(request_payload)}).encode("utf-8")
        try:
            with urlopen(
                Request(
                    MAST_INVOKE_URL,
                    data=body,
                    headers={"User-Agent": "ExoVision-AI/1.0"},
                ),
                timeout=self.timeout,
            ) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            raise MastServiceError(f"MAST request failed: {error}") from error
        if not isinstance(payload, dict):
            raise MastServiceError("MAST returned an invalid response payload.")
        return payload


def _observation_period(observation: dict[str, Any]) -> str:
    start, end = observation.get("t_min"), observation.get("t_max")
    if isinstance(start, (int, float)) and isinstance(end, (int, float)):
        return f"MJD {start:.2f}–{end:.2f}"
    return "Archive observation"


def _safe_size(value: Any) -> int:
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0
