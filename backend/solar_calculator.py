"""Solar position calculation helpers for the Solar Mirror Optimizer backend."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from functools import lru_cache
from typing import Optional

import numpy as _np
import pandas as pd
import pytz

# Compatibility shim for pvlib<=0.10.x on NumPy>=2.0 which removed np.Inf
if not hasattr(_np, "Inf"):  # pragma: no cover - defensive coding
    _np.Inf = _np.inf  # type: ignore[attr-defined]

from pvlib import solarposition

from . import config


@dataclass(frozen=True)
class SunPosition:
    """Represents a single sun-position sample."""

    timestamp: datetime
    elevation: float
    azimuth: float
    zenith: float

    @property
    def is_daytime(self) -> bool:
        return self.elevation > 0


@dataclass(frozen=True)
class SiteParameters:
    latitude: float
    longitude: float
    altitude: float
    timezone: str
    name: str = "Custom Location"


DEFAULT_SITE = SiteParameters(
    latitude=config.LATITUDE,
    longitude=config.LONGITUDE,
    altitude=config.ALTITUDE,
    timezone=config.TIMEZONE,
    name="TP. Hồ Chí Minh, Việt Nam",
)


@lru_cache(maxsize=16)
def _timezone_for(site: SiteParameters) -> pytz.BaseTzInfo:
    return pytz.timezone(site.timezone)


def _ensure_timezone(value: datetime, tz: pytz.BaseTzInfo) -> datetime:
    """Ensure a datetime is timezone-aware in the provided timezone."""

    if value.tzinfo is None:
        return tz.localize(value)
    return value.astimezone(tz)


def _round(value: float) -> float:
    return round(float(value), 2)


def _build_position(timestamp: pd.Timestamp, solpos_row: pd.Series) -> SunPosition:
    return SunPosition(
        timestamp=timestamp.to_pydatetime(),
        elevation=_round(solpos_row["apparent_elevation"]),
        azimuth=_round(solpos_row["azimuth"]),
        zenith=_round(solpos_row["apparent_zenith"]),
    )


def get_sun_position(
    when: Optional[datetime] = None,
    *,
    site: SiteParameters | None = None,
) -> SunPosition:
    """Return the sun position for the provided datetime (defaults to now)."""

    site_params = site or DEFAULT_SITE
    tz = _timezone_for(site_params)
    target_time = _ensure_timezone(when or datetime.now(tz=tz), tz)
    times = pd.DatetimeIndex([target_time])
    solpos = solarposition.spa_python(
        times,
        latitude=site_params.latitude,
        longitude=site_params.longitude,
        altitude=site_params.altitude,
    )
    return _build_position(times[0], solpos.iloc[0])


def get_sun_path(
    target_date: date | str | None = None,
    *,
    interval_minutes: int = config.UPDATE_INTERVAL,
    site: SiteParameters | None = None,
) -> dict:
    """Return the sun path data for a given date."""

    if interval_minutes <= 0:
        raise ValueError("interval_minutes must be positive")

    site_params = site or DEFAULT_SITE
    tz = _timezone_for(site_params)

    if target_date is None:
        target_date = datetime.now(tz=tz).date()
    elif isinstance(target_date, str):
        target_date = datetime.strptime(target_date, "%Y-%m-%d").date()

    start = tz.localize(datetime.combine(target_date, time(0, 0)))
    end = start + timedelta(days=1)
    times = pd.date_range(start=start, end=end, freq=f"{interval_minutes}min", inclusive="left")

    solpos = solarposition.spa_python(
        times,
        latitude=site_params.latitude,
        longitude=site_params.longitude,
        altitude=site_params.altitude,
    )

    path = []
    for ts, row in solpos.iterrows():
        path.append(
            {
                "time": ts.tz_convert(tz).strftime("%H:%M"),
                "elevation": _round(row["apparent_elevation"]),
                "azimuth": _round(row["azimuth"]),
            }
        )

    rise_set_df = solarposition.sun_rise_set_transit_spa(
        times=pd.DatetimeIndex([start]),
        latitude=site_params.latitude,
        longitude=site_params.longitude,
        how="numpy",
    )

    def _format_event(event: pd.Timestamp) -> Optional[str]:
        if pd.isna(event):
            return None
        return event.tz_convert(tz).strftime("%H:%M")

    sunrise = _format_event(rise_set_df.iloc[0]["sunrise"])
    sunset = _format_event(rise_set_df.iloc[0]["sunset"])
    solar_noon = _format_event(rise_set_df.iloc[0]["transit"])

    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "timezone": site_params.timezone,
        "location": {
            "latitude": site_params.latitude,
            "longitude": site_params.longitude,
            "altitude": site_params.altitude,
            "name": site_params.name,
            "timezone": site_params.timezone,
        },
        "sunrise": sunrise,
        "sunset": sunset,
        "solar_noon": solar_noon,
        "path": path,
    }


__all__ = [
    "get_sun_position",
    "get_sun_path",
    "SunPosition",
    "SiteParameters",
    "DEFAULT_SITE",
]
