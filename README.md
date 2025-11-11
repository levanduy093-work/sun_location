# Solar Mirror Optimizer

Web-based visualization tool that animates the sun's daily trajectory for any user-selected location. The project provides high-accuracy solar geometry (SPA algorithm) via a Flask API and a vanilla JavaScript front-end to support solar mirror/PV optimisation research, including automatic tilt/azimuth suggestions for fixed panels.

## Project Structure

```
solar-mirror-optimizer/
├── backend/
│   ├── app.py                 # Flask API entrypoint
│   ├── config.py              # Location & visualisation constants
│   ├── requirements.txt       # Python dependencies (pip)
│   └── solar_calculator.py    # SPA-based solar calculations
├── frontend/
│   ├── index.html             # Main UI
│   ├── css/style.css          # Layout & theme (day/night)
│   └── js/                    # Vanilla JS modules (API, canvas, animation)
└── tests/
    └── test_solar_calculator.py
```

## Environment Setup

The project targets Python 3.9+ with `pvlib` and `numpy` 1.26.x for maximum compatibility. Create a dedicated Conda environment to avoid NumPy 2.x issues:

```bash
conda create -n solar-mirror python=3.10 numpy=1.26 flask pvlib pandas pytz
conda activate solar-mirror
pip install -r backend/requirements.txt
```

> **Note:** If you must run with NumPy 2.x, `backend/solar_calculator.py` includes a compatibility shim for `pvlib<=0.10.x` that reintroduces `np.Inf`. Accuracy remains unaffected.

## Running the Backend

```bash
conda activate solar-mirror
export FLASK_APP=backend.app
flask run --reload
```

The API exposes:
- `GET /api/sun-position` – current position or ISO datetime query (`?datetime=2025-11-11T14:00:00+07:00`)
- `GET /api/sun-path` – full-day samples (`?date=YYYY-MM-DD&interval=minutes`)
- `GET /api/optimal-orientation` – annual clearsky-based fixed-tilt recommendation (`?year=2025&tilt_step=1&tilt_max=60&azimuth_step=5`)

> All endpoints accept optional location overrides: `lat`, `lon`, `alt` (metres), `tz` (IANA timezone) and `name`.

### Estimating a Fixed-Tilt PV Orientation

Use the clear-sky optimiser to approximate the best fixed-tilt orientation for the configured (or overridden) site:

```bash
python -m backend.orientation_optimizer --year 2025 --tilt-max 60 --tilt-step 1 --azimuth-step 5
```

The script sweeps tilt/azimuth pairs and reports the combination that maximises annual plane-of-array irradiance (kWh/m²). Use finer steps for higher accuracy or change `--freq` (default hourly) for seasonal studies.

You can override the default Ho Chi Minh City site via `--lat`, `--lon`, `--alt` and `--tz` arguments if you prefer CLI-based experiments.

## Frontend Usage

Open `frontend/index.html` in a modern browser while the Flask server runs (or serve the `frontend/` directory via Flask static routes). The canvas shows:
- Real-time sun location with day/night themes
- Sunrise, sunset, and solar noon readouts
- Playback controls: phát/tạm dừng, đưa về hiện tại, tốc độ mô phỏng, thanh trượt thời gian
- Location selector (preset cities or manual lat/lon/alt/tz), automatic timezone handling, and Vietnamese UI copy
- PV panel recommendation card: optimal heading, tilt angle, and estimated annual energy for the chosen year/location

## Testing

Run unit tests with PyTest:

```bash
conda activate solar-mirror
pytest
```

`tests/test_solar_calculator.py` validates solar elevations/azimuths against NOAA-grade SPA results (±0.2° tolerance) and checks path sampling plus input validation.

## Next Steps

- Mirror control optimisation layer
- Responsive layout + mobile ergonomics
- Offline caching of solar paths
- Additional geolocations via configuration
