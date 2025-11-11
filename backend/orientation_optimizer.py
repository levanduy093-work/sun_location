"""Estimate optimal fixed-tilt PV orientation for the configured location.

The calculation uses pvlib's clear-sky model as a proxy for long-term solar
resource. It sweeps a grid of tilt/azimuth pairs and integrates the resulting
plane-of-array (POA) irradiance to find the best performing orientation.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Iterable, Tuple

import numpy as np
import pandas as pd

# Compatibility shim for pvlib<=0.10.x on NumPy>=2.0
if not hasattr(np, "Inf"):  # pragma: no cover
    np.Inf = np.inf  # type: ignore[attr-defined]

from pvlib import irradiance, solarposition
from pvlib.location import Location

from .solar_calculator import DEFAULT_SITE, SiteParameters


@dataclass(frozen=True)
class OrientationResult:
    tilt: float
    azimuth: float
    annual_poa_irradiance: float  # Wh/m^2 over analysed period


def _build_time_index(year: int, site: SiteParameters, freq: str = "1h") -> pd.DatetimeIndex:
    start = pd.Timestamp(year=year, month=1, day=1, tz=site.timezone)
    end = start + pd.DateOffset(years=1)
    return pd.date_range(start=start, end=end, freq=freq, inclusive="left")


def _prepare_meteorology(
    times: pd.DatetimeIndex,
    site: SiteParameters,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series]:
    # Clear-sky irradiance (Ineichen model)
    location = Location(
        latitude=site.latitude,
        longitude=site.longitude,
        tz=site.timezone,
        altitude=site.altitude,
    )
    solpos = location.get_solarposition(times, method="nrel_numpy")
    clearsky = location.get_clearsky(times, model="ineichen")
    dni_extra = irradiance.get_extra_radiation(times).rename("dni_extra")

    mask = solpos["apparent_zenith"] < 90
    return solpos.loc[mask], clearsky.loc[mask], dni_extra.loc[mask]


def optimise_orientation(
    site: SiteParameters,
    *,
    year: int,
    tilt_range: Iterable[float],
    azimuth_range: Iterable[float],
    freq: str = "1h",
) -> OrientationResult:
    times = _build_time_index(year, site, freq=freq)
    solpos, clearsky, dni_extra = _prepare_meteorology(times, site)

    best_result: OrientationResult | None = None

    solar_zenith = solpos["apparent_zenith"]
    solar_azimuth = solpos["azimuth"]

    dni = clearsky["dni"]
    ghi = clearsky["ghi"]
    dhi = clearsky["dhi"]

    for tilt in tilt_range:
        for azimuth in azimuth_range:
            poa = irradiance.get_total_irradiance(
                surface_tilt=tilt,
                surface_azimuth=azimuth % 360,
                solar_zenith=solar_zenith,
                solar_azimuth=solar_azimuth,
                dni=dni,
                ghi=ghi,
                dhi=dhi,
                dni_extra=dni_extra,
                model="haydavies",
            )
            energy = float(np.nansum(poa["poa_global"]))
            if best_result is None or energy > best_result.annual_poa_irradiance:
                best_result = OrientationResult(tilt=tilt, azimuth=azimuth % 360, annual_poa_irradiance=energy)

    if best_result is None:
        raise RuntimeError("No valid orientations evaluated")

    return best_result


def _default_tilt_range(step: float = 1.0, max_tilt: float = 60.0) -> np.ndarray:
    return np.arange(0.0, max_tilt + step, step)


def _default_azimuth_range(step: float = 5.0) -> np.ndarray:
    # 0° = North, 90° = East, 180° = South, 270° = West
    return np.arange(0.0, 360.0, step)


def calculate_optimal_orientation(
    site: SiteParameters | None = None,
    *,
    year: int,
    tilt_step: float = 1.0,
    tilt_max: float = 60.0,
    azimuth_step: float = 5.0,
    freq: str = "1h",
) -> OrientationResult:
    site_params = site or DEFAULT_SITE
    tilt_values = _default_tilt_range(step=tilt_step, max_tilt=tilt_max)
    azimuth_values = _default_azimuth_range(step=azimuth_step)
    return optimise_orientation(
        site_params,
        year=year,
        tilt_range=tilt_values,
        azimuth_range=azimuth_values,
        freq=freq,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Optimise PV fixed orientation for configured site")
    parser.add_argument("--year", type=int, default=2025, help="Year to analyse (default: %(default)s)")
    parser.add_argument("--tilt-step", type=float, default=1.0)
    parser.add_argument("--tilt-max", type=float, default=60.0)
    parser.add_argument("--azimuth-step", type=float, default=5.0)
    parser.add_argument("--freq", default="1h", help="Time resolution for simulation (default: %(default)s)")
    parser.add_argument("--lat", type=float, help="Latitude in decimal degrees")
    parser.add_argument("--lon", type=float, help="Longitude in decimal degrees")
    parser.add_argument("--alt", type=float, help="Altitude in metres")
    parser.add_argument(
        "--tz",
        default=None,
        help="Timezone name (default: site configuration or Asia/Ho_Chi_Minh)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    site = SiteParameters(
        latitude=args.lat if args.lat is not None else DEFAULT_SITE.latitude,
        longitude=args.lon if args.lon is not None else DEFAULT_SITE.longitude,
        altitude=args.alt if args.alt is not None else DEFAULT_SITE.altitude,
        timezone=args.tz or DEFAULT_SITE.timezone,
        name="CLI site",
    )
    result = calculate_optimal_orientation(
        site,
        year=args.year,
        tilt_step=args.tilt_step,
        tilt_max=args.tilt_max,
        azimuth_step=args.azimuth_step,
        freq=args.freq,
    )
    print(
        f"Optimal tilt: {result.tilt:.1f}°, azimuth: {result.azimuth:.1f}° "
        f"(annual POA ≈ {result.annual_poa_irradiance/1000:.1f} kWh/m²)"
    )


if __name__ == "__main__":
    main()


__all__ = ["calculate_optimal_orientation", "OrientationResult"]
