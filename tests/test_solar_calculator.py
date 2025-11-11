from datetime import datetime
import math
from pathlib import Path
import sys

import pytest
import pytz

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:  # pragma: no cover - import guard
    sys.path.insert(0, str(PROJECT_ROOT))

from backend import config
from backend.orientation_optimizer import calculate_optimal_orientation
from backend.solar_calculator import SiteParameters, get_sun_path, get_sun_position

TZ = pytz.timezone(config.TIMEZONE)


def to_timezone(dt):
    return TZ.localize(dt) if dt.tzinfo is None else dt.astimezone(TZ)


def test_solar_position_accuracy_mid_morning():
    target = to_timezone(datetime(2025, 3, 20, 9, 0, 0))
    position = get_sun_position(target)
    assert math.isclose(position.elevation, 43.74, abs_tol=0.2)
    assert math.isclose(position.azimuth, 100.70, abs_tol=0.2)


def test_solar_position_accuracy_afternoon():
    target = to_timezone(datetime(2025, 11, 11, 14, 0, 0))
    position = get_sun_position(target)
    assert math.isclose(position.elevation, 44.84, abs_tol=0.2)
    assert math.isclose(position.azimuth, 231.55, abs_tol=0.2)


def test_sun_path_sampling_and_events():
    path = get_sun_path("2025-11-11", interval_minutes=60)
    assert path["date"] == "2025-11-11"
    assert path["sunrise"] == "05:47"
    assert path["sunset"] == "17:27"
    assert path["solar_noon"] == "11:37"
    assert len(path["path"]) == 24
    ten_am = next(item for item in path["path"] if item["time"] == "10:00")
    assert math.isclose(ten_am["elevation"], 52.87, abs_tol=0.2)
    assert math.isclose(ten_am["azimuth"], 139.32, abs_tol=0.2)


def test_invalid_interval_raises():
    with pytest.raises(ValueError):
        get_sun_path("2025-11-11", interval_minutes=0)


def test_custom_site_integration():
    hanoi = SiteParameters(
        latitude=21.0278,
        longitude=105.8342,
        altitude=10,
        timezone="Asia/Bangkok",
        name="Hà Nội",
    )
    path = get_sun_path("2025-11-11", interval_minutes=120, site=hanoi)
    assert path["location"]["name"] == "Hà Nội"
    assert math.isclose(path["location"]["latitude"], hanoi.latitude, abs_tol=1e-4)


def test_orientation_optimizer_runs():
    site = SiteParameters(
        latitude=config.LATITUDE,
        longitude=config.LONGITUDE,
        altitude=config.ALTITUDE,
        timezone=config.TIMEZONE,
        name="Test",
    )
    result = calculate_optimal_orientation(site, year=2025, tilt_step=5, tilt_max=40, azimuth_step=30)
    assert 0 <= result.tilt <= 40
    assert 0 <= result.azimuth < 360
