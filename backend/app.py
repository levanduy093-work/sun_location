"""Flask application exposing solar position endpoints for the Solar Mirror Optimizer."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

import pytz
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pytz import UnknownTimeZoneError

from .orientation_optimizer import OrientationResult, calculate_optimal_orientation
from .solar_calculator import (
    DEFAULT_SITE,
    SiteParameters,
    SunPosition,
    get_sun_path,
    get_sun_position,
)

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path="",
)
CORS(app)


def _parse_datetime(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("Invalid datetime format. Use ISO-8601 e.g. 2025-11-11T14:00:00+07:00") from exc


def _site_from_request() -> SiteParameters | None:
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    altitude = request.args.get("alt", type=float)
    if altitude is None:
        altitude = request.args.get("altitude", type=float)
    timezone_name = request.args.get("tz")
    name = request.args.get("name")

    if all(value is None for value in (lat, lon, altitude, timezone_name, name)):
        return None

    if lat is None or lon is None:
        raise ValueError("Latitude (lat) and longitude (lon) must be provided for custom locations.")

    altitude = altitude if altitude is not None else DEFAULT_SITE.altitude
    timezone_name = timezone_name or DEFAULT_SITE.timezone
    try:
        pytz.timezone(timezone_name)
    except UnknownTimeZoneError as exc:
        raise ValueError("Invalid timezone identifier.") from exc

    return SiteParameters(
        latitude=lat,
        longitude=lon,
        altitude=altitude,
        timezone=timezone_name,
        name=name or "Địa điểm người dùng",
    )


def _serialize_position(position: SunPosition, site: SiteParameters) -> dict:
    return {
        "timestamp": position.timestamp.isoformat(),
        "elevation": position.elevation,
        "azimuth": position.azimuth,
        "zenith": position.zenith,
        "is_daytime": position.is_daytime,
        "location": {
            "latitude": site.latitude,
            "longitude": site.longitude,
            "altitude": site.altitude,
            "timezone": site.timezone,
            "name": site.name,
        },
    }


def _site_payload(site: SiteParameters) -> dict:
    return {
        "latitude": site.latitude,
        "longitude": site.longitude,
        "altitude": site.altitude,
        "timezone": site.timezone,
        "name": site.name,
    }


def _orientation_payload(result: OrientationResult, site: SiteParameters) -> dict:
    cardinal_labels = [
        "Bắc",
        "Đông-Bắc",
        "Đông",
        "Đông-Nam",
        "Nam",
        "Tây-Nam",
        "Tây",
        "Tây-Bắc",
    ]
    azimuth_normalised = result.azimuth % 360
    idx = int(((azimuth_normalised + 22.5) % 360) // 45)
    direction_label = cardinal_labels[idx]
    return {
        "tilt": round(result.tilt, 2),
        "azimuth": round(azimuth_normalised, 2),
        "direction_label": direction_label,
        "annual_poa_kwh_m2": round(result.annual_poa_irradiance / 1000, 2),
        "site": _site_payload(site),
    }


@app.route("/api/sun-position")
def sun_position():
    datetime_param = request.args.get("datetime")
    try:
        target_dt = _parse_datetime(datetime_param) if datetime_param else None
        site = _site_from_request() or DEFAULT_SITE
        position = get_sun_position(target_dt, site=site)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(_serialize_position(position, site))


@app.route("/api/sun-path")
def sun_path():
    date_param = request.args.get("date")
    interval_param = request.args.get("interval", type=int)
    try:
        if interval_param is not None and interval_param <= 0:
            raise ValueError("Interval must be a positive integer of minutes.")
        site = _site_from_request() or DEFAULT_SITE
        if interval_param is not None:
            payload = get_sun_path(target_date=date_param, interval_minutes=interval_param, site=site)
        else:
            payload = get_sun_path(target_date=date_param, site=site)
        payload["location"] = _site_payload(site)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(payload)


@app.route("/api/optimal-orientation")
def optimal_orientation():
    try:
        site = _site_from_request() or DEFAULT_SITE
        year = request.args.get("year", type=int) or datetime.now().year
        tilt_step = request.args.get("tilt_step", default=1.0, type=float)
        tilt_max = request.args.get("tilt_max", default=60.0, type=float)
        az_step = request.args.get("azimuth_step", default=5.0, type=float)
        freq = request.args.get("freq", default="1h")

        if tilt_step <= 0 or tilt_max <= 0 or az_step <= 0:
            raise ValueError("Step sizes and limits must be positive numbers.")
        if tilt_max > 90:
            raise ValueError("Tilt angle sweep should not exceed 90 degrees.")

        result = calculate_optimal_orientation(
            site,
            year=year,
            tilt_step=tilt_step,
            tilt_max=tilt_max,
            azimuth_step=az_step,
            freq=freq,
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(
        {
            "year": year,
            "tilt_step": tilt_step,
            "tilt_max": tilt_max,
            "azimuth_step": az_step,
            "orientation": _orientation_payload(result, site),
        }
    )


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/css/<path:filename>")
def css(filename: str):
    return send_from_directory(FRONTEND_DIR / "css", filename)


@app.route("/js/<path:filename>")
def js(filename: str):
    return send_from_directory(FRONTEND_DIR / "js", filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
