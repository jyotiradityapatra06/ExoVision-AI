"""Small, dependency-free client for the public MAST API."""

from __future__ import annotations

import json
import logging
import re
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

MAST_INVOKE_URL = "https://mast.stsci.edu/api/v0/invoke"
MAST_DOWNLOAD_URL = "https://mast.stsci.edu/api/v0.1/Download/file"
logger = logging.getLogger(__name__)


class MastServiceError(RuntimeError):
    """Raised when MAST cannot satisfy a request."""


class MastService:
    """Search MAST observations and retrieve light-curve product metadata."""

    def __init__(self, *, timeout: float = 20.0, attempts: int = 2) -> None:
        self.timeout = timeout
        self.attempts = max(1, attempts)

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
        tess_target_id = self._tess_target_id(target, coordinate, missions)
        request = _observation_request(coordinate, missions, tess_target_id)
        observations = _data_rows(self._invoke(request), "observation search")
        logger.info("MAST observations found: %d target=%s", len(observations), target)
        selected = [
            row
            for row in observations
            if isinstance(row, dict)
            and _mission_matches(row.get("obs_collection"), missions)
            and str(row.get("target_name", "")).upper() not in {"TESS FFI", "TICA FFI"}
        ]
        logger.info(
            "Filtered mission observations: %d target=%s missions=%s",
            len(selected),
            target,
            ",".join(missions),
        )
        observations_by_id = {
            str(row.get("obsid")): row for row in selected if row.get("obsid")
        }
        product_observation_ids = list(observations_by_id)[:50]
        products = self._products(",".join(product_observation_ids))
        logger.info("Products found: %d target=%s", len(products), target)
        results: list[dict[str, Any]] = []
        seen_uris: set[str] = set()
        fits_products = sorted(products, key=_product_priority)
        fits_count = 0
        for product in fits_products:
            if not isinstance(product, dict):
                continue
            filename = str(product.get("productFilename", ""))
            data_uri = str(product.get("dataURI", ""))
            if not filename.lower().endswith(".fits") or not data_uri.startswith(
                "mast:"
            ):
                continue
            fits_count += 1
            if data_uri in seen_uris:
                continue
            observation = observations_by_id.get(str(product.get("obsID")))
            if observation is None:
                observation = selected[0] if selected else {}
            seen_uris.add(data_uri)
            results.append(
                {
                    "target_name": str(observation.get("target_name") or target),
                    "mission": str(observation.get("obs_collection", "")),
                    "observation_period": _observation_period(observation),
                    "format": "FITS",
                    "filename": filename,
                    "data_uri": data_uri,
                    "size_bytes": _safe_size(product.get("size")),
                }
            )
            if len(results) >= limit:
                break
        logger.info("Light curve FITS files: %d target=%s", fits_count, target)
        return results

    def _tess_target_id(
        self,
        target: str,
        coordinate: dict[str, Any],
        missions: tuple[str, ...],
    ) -> str | None:
        if "TESS" not in {mission.upper() for mission in missions}:
            return None
        tic_match = re.fullmatch(r"\s*TIC[ -]?(\d+)\s*", target, re.IGNORECASE)
        if tic_match:
            return tic_match.group(1)
        if not re.fullmatch(r"\s*TOI[ -]?\d+(?:\.\d+)?\s*", target, re.IGNORECASE):
            return None
        payload = self._invoke(
            {
                "service": "Mast.Catalogs.Tic.Cone",
                "params": {
                    "ra": coordinate["ra"],
                    "dec": coordinate["decl"],
                    "radius": 0.001,
                },
                "format": "json",
                "pagesize": 1,
                "page": 1,
            }
        )
        matches = _data_rows(payload, "TIC catalog lookup")
        tic_id = matches[0].get("ID") if matches else None
        return str(tic_id) if tic_id is not None else None

    def download(self, data_uri: str) -> tuple[str, bytes]:
        if not data_uri.startswith("mast:") or "\r" in data_uri or "\n" in data_uri:
            raise MastServiceError("Invalid MAST product identifier.")
        url = f"{MAST_DOWNLOAD_URL}?{urlencode({'uri': data_uri})}"
        content: bytes | None = None
        last_error: Exception | None = None
        for attempt in range(self.attempts):
            try:
                with urlopen(
                    Request(url, headers={"User-Agent": "ExoVision-AI/1.0"}),
                    timeout=self.timeout,
                ) as response:
                    content = response.read(25 * 1024 * 1024 + 1)
                break
            except (HTTPError, URLError, TimeoutError) as error:
                last_error = error
                self._retry_delay(attempt)
        if content is None:
            raise MastServiceError(
                "MAST download is temporarily unavailable."
            ) from last_error
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
        return _data_rows(payload, "product search")

    def _invoke(self, request_payload: dict[str, Any]) -> dict[str, Any]:
        body = urlencode({"request": json.dumps(request_payload)}).encode("utf-8")
        last_error: Exception | None = None
        for attempt in range(self.attempts):
            try:
                deadline = time.monotonic() + self.timeout
                while True:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise TimeoutError("MAST request polling timed out")
                    with urlopen(
                        Request(
                            MAST_INVOKE_URL,
                            data=body,
                            headers={"User-Agent": "ExoVision-AI/1.0"},
                        ),
                        timeout=remaining,
                    ) as response:
                        payload = json.loads(response.read().decode("utf-8"))
                    if not isinstance(payload, dict):
                        raise MastServiceError(
                            "MAST returned an invalid response payload."
                        )
                    archive_status = str(payload.get("status", "")).upper()
                    if archive_status == "EXECUTING":
                        time.sleep(0.25)
                        continue
                    if archive_status in {"ERROR", "FAILED"}:
                        raise MastServiceError(
                            "MAST could not complete the archive request."
                        )
                    return payload
            except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
                last_error = error
                self._retry_delay(attempt)
        raise MastServiceError(
            "MAST archive request timed out or failed."
        ) from last_error

    def _retry_delay(self, attempt: int) -> None:
        if attempt + 1 < self.attempts:
            time.sleep(0.5 * (2**attempt))


def _data_rows(payload: dict[str, Any], operation: str) -> list[dict[str, Any]]:
    rows = payload.get("data", [])
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise MastServiceError(f"MAST returned invalid {operation} data.")
    return rows


def _mission_matches(value: Any, missions: tuple[str, ...]) -> bool:
    collection = " ".join(str(value or "").upper().replace("_", " ").split())
    aliases: set[str] = set()
    if "KEPLER" in collection:
        aliases.add("KEPLER")
    if collection == "K2" or collection.startswith("K2 "):
        aliases.add("K2")
    if "TESS" in collection:
        aliases.add("TESS")
    return bool(aliases.intersection(mission.upper() for mission in missions))


def _mission_filter_values(missions: tuple[str, ...]) -> list[str]:
    values: list[str] = []
    for mission in missions:
        normalized = mission.upper()
        if normalized == "KEPLER":
            values.extend(["Kepler", "KEPLER", "Kepler Mission"])
        elif normalized == "K2":
            values.extend(["K2", "K2 Mission"])
        elif normalized == "TESS":
            values.extend(["TESS", "TESS Mission"])
    return list(dict.fromkeys(values))


def _observation_request(
    coordinate: dict[str, Any],
    missions: tuple[str, ...],
    tess_target_id: str | None,
) -> dict[str, Any]:
    filters = [
        {"paramName": "dataproduct_type", "values": ["cube", "timeseries"]},
        {"paramName": "project", "values": _mission_filter_values(missions)},
    ]
    if tess_target_id:
        filters.append({"paramName": "target_name", "values": [tess_target_id]})
        service = "Mast.Caom.Filtered"
        params: dict[str, Any] = {"columns": "*", "filters": filters}
    else:
        service = "Mast.Caom.Filtered.Position"
        params = {
            "columns": "*",
            "filters": filters,
            "position": (f"{coordinate['ra']}, {coordinate['decl']}, 0.0000000277778"),
        }
    return {
        "service": service,
        "params": params,
        "format": "json",
        "pagesize": 100,
        "page": 1,
    }


def _product_priority(product: Any) -> tuple[int, str]:
    if not isinstance(product, dict):
        return (3, "")
    filename = str(product.get("productFilename", "")).lower()
    subgroup = str(product.get("productSubGroupDescription", "")).upper()
    if filename.endswith(("_lc.fits", "_llc.fits", "_slc.fits")):
        return (0, filename)
    if subgroup in {"LC", "LLC", "SLC", "LIGHTCURVE"}:
        return (1, filename)
    return (2, filename)


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
