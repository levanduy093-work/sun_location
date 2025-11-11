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

## Lý thuyết và thuật toán

### 1. Tính toán quỹ đạo Mặt Trời (Backend)

- **Đầu vào:** `SiteParameters` (vĩ độ, kinh độ, cao độ, múi giờ), ngày/giờ yêu cầu, bước lấy mẫu.
- **Thuật toán:** sử dụng `pvlib.solarposition.spa_python` (Solar Position Algorithm - SPA) để tính các góc thiên văn (elevation, azimuth, zenith) theo tiêu chuẩn NOAA với sai số ~0.01°.  
  - SPA xử lý hiệu chỉnh khí quyển, độ lệch trục, phương trình thời gian và tự động nhận múi giờ.
  - Hàm `get_sun_position` trả về cấu trúc `SunPosition` gồm góc cao (elevation), góc phương (azimuth), góc thiên đỉnh (zenith) và cờ `is_daytime`.
- **Quỹ đạo cả ngày:** `get_sun_path` tạo dãy thời gian `DatetimeIndex`, lặp SPA và gom thành mảng `{time, elevation, azimuth}`.  
  - Bình minh/hoàng hôn/solar noon lấy từ `solarposition.sun_rise_set_transit_spa`, đảm bảo đồng nhất với SPA.
- **Múi giờ:** mọi thời gian đều được chuẩn hóa qua `pytz.timezone(site.timezone)`, giúp kết quả chính xác cho mọi địa điểm người dùng nhập.

### 2. Khuyến nghị hướng đặt tấm pin

- **Bài toán:** tìm hướng (azimuth) và góc nghiêng (tilt) cố định cho tấm PV tối đa hóa tổng bức xạ trong năm.
- **Dữ liệu:** mô hình bầu trời quang `pvlib.location.Location.get_clearsky` (Ineichen) → DNI/GHI/DHI.  
  - Tính năng lượng tới mặt phẳng thông qua `pvlib.irradiance.get_total_irradiance` (mô hình Hay-Davies).
- **Chiến lược:** quét lưới các giá trị tilt (0…`tilt_max`, bước `tilt_step`) và azimuth (0…360°, bước `azimuth_step`).  
  - Tại mỗi cặp, tích lũy `poa_global` trong năm → chọn giá trị cao nhất.  
  - Trả về `OrientationResult` gồm tilt tối ưu, azimuth tối ưu, năng lượng ước tính (Wh/m²), kèm nhãn hướng tiếng Việt (Bắc, Đông, …).
- **Sử dụng:**  
  - API `/api/optimal-orientation` nhận thêm tham số `lat/lon/alt/tz` và tham số quét (tilt_step, tilt_max, azimuth_step, freq).  
  - Frontend hiển thị kết quả và mô tả bằng tiếng Việt.

### 3. Hiển thị & mô phỏng (Frontend)

- **Nội suy thời gian:** danh sách mẫu (elevation, azimuth) theo phút; khi người dùng kéo thanh trượt, hệ thống nội suy tuyến tính elevation và dùng hàm `lerpAngleDeg` để nội suy góc phương có chu kỳ 360°.  
- **Canvas 2D:** `computeSunCanvasPosition` chuyển đổi góc thiên văn thành tọa độ:  
  - `x = center + r * cos(azimuth) * cos(elevation)`  
  - `y = center - r * sin(azimuth) * cos(elevation)`  
  - Bảo đảm quỹ đạo từ Đông sang Tây, Mặt Trời biến mất khi `y` vượt đường chân trời.
- **Vòng lặp animation:** requestAnimationFrame 60 fps, tăng/giảm thời gian nội bộ theo tốc độ người dùng chọn, đồng bộ hiển thị và cập nhật bảng thông tin.
- **Quản lý vị trí:** preset cho các thành phố phổ biến; người dùng có thể nhập tọa độ tay → frontend gửi `lat/lon/alt/tz` cho backend, đồng thời cập nhật năm cần tối ưu.

### 4. API và dữ liệu trả về

- `/api/sun-position`: trả về góc tại thời điểm hiện tại/ISO, kèm metadata địa điểm/múi giờ.  
- `/api/sun-path`: trả về đường đi cả ngày (`path`, `sunrise`, `sunset`, `solar_noon`, `location`).  
- `/api/optimal-orientation`: trả về hướng đặt tối ưu, góc nghiêng, năng lượng ước tính, nhãn hướng và thông tin địa điểm.
- Mọi endpoint cho phép override bằng tham số truy vấn (lat, lon, alt|altitude, tz, name) để phân tích nhiều khu vực.

### 5. Kiểm thử & đảm bảo chất lượng

- `pytest` kiểm chứng:  
  - Góc mặt trời vào các thời điểm chuẩn (so với NOAA ±0.2°).  
  - Tổng số mẫu quỹ đạo, bình minh/hoàng hôn, solar noon.  
  - Việc truyền tọa độ tùy chỉnh không phá vỡ dữ liệu trả về.  
  - Thuật toán tối ưu luôn trả tilt/azimuth trong phạm vi mong đợi.
- Giao diện cung cấp cảnh báo và ghi log lỗi nếu API không phản hồi, đảm bảo người dùng nắm tình trạng tính toán.

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
