# Trình Tối Ưu Hóa Gương Năng Lượng Mặt Trời

Công cụ trực quan hóa dựa trên web mô phỏng quỹ đạo hàng ngày của Mặt Trời cho bất kỳ vị trí nào do người dùng chọn. Dự án cung cấp tính toán hình học mặt trời độ chính xác cao (thuật toán SPA) thông qua API Flask và giao diện frontend JavaScript thuần để hỗ trợ nghiên cứu tối ưu hóa gương năng lượng mặt trời/PV, bao gồm các đề xuất tự động về góc nghiêng/azimuth cho các tấm pin cố định.

## Cấu Trúc Dự Án

```
sun_location/
├── backend/
│   ├── app.py                 # Điểm vào API Flask
│   ├── config.py              # Hằng số vị trí & trực quan hóa
│   ├── requirements.txt       # Các phụ thuộc Python (pip)
│   ├── solar_calculator.py    # Tính toán mặt trời dựa trên SPA
│   └── orientation_optimizer.py  # Tối ưu hóa hướng đặt tấm pin
├── frontend/
│   ├── index.html             # Giao diện chính
│   ├── css/style.css          # Bố cục & chủ đề (ngày/đêm)
│   └── js/                    # Các module JavaScript thuần (API, canvas, animation)
│       ├── api.js             # Giao tiếp với API backend
│       ├── canvas.js          # Vẽ canvas và tính toán vị trí
│       ├── animation.js       # Điều khiển animation
│       └── locations.js       # Quản lý vị trí
├── scripts/
│   ├── dev_up.sh              # Khởi động backend và frontend
│   └── dev_down.sh            # Dừng các server
├── tests/
│   └── test_solar_calculator.py
└── environment.yml            # Cấu hình Conda environment (tùy chọn)
```

## Chạy Dự Án

Dự án sử dụng conda environment để quản lý dependencies. Script sẽ tự động kích hoạt conda environment trước khi khởi động server.

### Yêu cầu

- Conda đã được cài đặt và cấu hình
- Conda environment `solar-mirror` đã được tạo từ file `environment.yml`:
  ```bash
  conda env create -f environment.yml
  ```

### Khởi động dự án

```bash
./scripts/dev_up.sh
```

Script này sẽ:
- Tự động kích hoạt conda environment `solar-mirror` (hoặc environment được chỉ định qua biến `CONDA_ENV`)
- Khởi động Flask backend tại `http://127.0.0.1:8000`
- Khởi động frontend server tại `http://127.0.0.1:3000`

Nhấn `Ctrl+C` để dừng cả hai server.

### Dừng dự án

```bash
./scripts/dev_down.sh
```

### Cấu hình (tùy chọn)

Bạn có thể thay đổi cổng và conda environment bằng cách set các biến môi trường trước khi chạy:

```bash
export FLASK_PORT=8000
export FRONTEND_PORT=3000
export CONDA_ENV=solar-mirror  # Tên conda environment (mặc định: solar-mirror)
./scripts/dev_up.sh
```

## API Endpoints

Backend Flask cung cấp các endpoint sau:

- `GET /api/sun-position` – vị trí hiện tại hoặc truy vấn datetime ISO (`?datetime=2025-11-11T14:00:00+07:00`)
- `GET /api/sun-path` – mẫu cả ngày (`?date=YYYY-MM-DD&interval=minutes`)
- `GET /api/optimal-orientation` – khuyến nghị góc nghiêng cố định dựa trên clearsky hàng năm (`?year=2025&tilt_step=1&tilt_max=60&azimuth_step=5`)

> Tất cả các endpoint chấp nhận ghi đè vị trí tùy chọn: `lat`, `lon`, `alt` (mét), `tz` (múi giờ IANA) và `name`.

### Ước Tính Hướng Đặt Tấm PV Cố Định (CLI)

Sử dụng công cụ tối ưu hóa clear-sky để ước tính hướng đặt tấm pin cố định tốt nhất cho địa điểm đã cấu hình:

```bash
conda activate solar-mirror
python -m backend.orientation_optimizer --year 2025 --tilt-max 60 --tilt-step 1 --azimuth-step 5
```

Script sẽ quét các cặp tilt/azimuth và báo cáo kết hợp tối đa hóa bức xạ mặt phẳng tấm pin hàng năm (kWh/m²). Sử dụng bước nhỏ hơn để có độ chính xác cao hơn hoặc thay đổi `--freq` (mặc định theo giờ) cho các nghiên cứu theo mùa.

Bạn có thể ghi đè địa điểm mặc định Thành phố Hồ Chí Minh thông qua các tham số `--lat`, `--lon`, `--alt` và `--tz` nếu bạn muốn thử nghiệm qua CLI.

## Sử Dụng Frontend

Sau khi khởi động dự án bằng `scripts/dev_up.sh`, mở trình duyệt và truy cập `http://127.0.0.1:3000` để sử dụng ứng dụng. Canvas hiển thị:
- Vị trí mặt trời theo thời gian thực với chủ đề ngày/đêm
- Thông tin bình minh, hoàng hôn và giữa trưa mặt trời
- Điều khiển phát lại: phát/tạm dừng, đưa về hiện tại, tốc độ mô phỏng, thanh trượt thời gian
- Bộ chọn vị trí (các thành phố có sẵn hoặc nhập thủ công lat/lon/alt/tz), xử lý múi giờ tự động và giao diện tiếng Việt
- Thẻ khuyến nghị tấm pin PV: hướng tối ưu, góc nghiêng và năng lượng hàng năm ước tính cho năm/vị trí đã chọn

## Lý Thuyết và Thuật Toán

### 1. Tính Toán Quỹ Đạo Mặt Trời (Backend)

- **Đầu vào:** `SiteParameters` (vĩ độ, kinh độ, cao độ, múi giờ), ngày/giờ yêu cầu, bước lấy mẫu.
- **Thuật toán:** sử dụng `pvlib.solarposition.spa_python` (Solar Position Algorithm - SPA) để tính các góc thiên văn (elevation, azimuth, zenith) theo tiêu chuẩn NOAA với sai số ~0.01°.  
  - SPA xử lý hiệu chỉnh khí quyển, độ lệch trục, phương trình thời gian và tự động nhận múi giờ.
  - Hàm `get_sun_position` trả về cấu trúc `SunPosition` gồm góc cao (elevation), góc phương (azimuth), góc thiên đỉnh (zenith) và cờ `is_daytime`.
- **Quỹ đạo cả ngày:** `get_sun_path` tạo dãy thời gian `DatetimeIndex`, lặp SPA và gom thành mảng `{time, elevation, azimuth}`.  
  - Bình minh/hoàng hôn/solar noon lấy từ `solarposition.sun_rise_set_transit_spa`, đảm bảo đồng nhất với SPA.
- **Múi giờ:** mọi thời gian đều được chuẩn hóa qua `pytz.timezone(site.timezone)`, giúp kết quả chính xác cho mọi địa điểm người dùng nhập.

### 2. Khuyến Nghị Hướng Đặt Tấm Pin

- **Bài toán:** tìm hướng (azimuth) và góc nghiêng (tilt) cố định cho tấm PV tối đa hóa tổng bức xạ trong năm.
- **Dữ liệu:** mô hình bầu trời quang `pvlib.location.Location.get_clearsky` (Ineichen) → DNI/GHI/DHI.  
  - Tính năng lượng tới mặt phẳng thông qua `pvlib.irradiance.get_total_irradiance` (mô hình Hay-Davies).
- **Chiến lược:** quét lưới các giá trị tilt (0…`tilt_max`, bước `tilt_step`) và azimuth (0…360°, bước `azimuth_step`).  
  - Tại mỗi cặp, tích lũy `poa_global` trong năm → chọn giá trị cao nhất.  
  - Trả về `OrientationResult` gồm tilt tối ưu, azimuth tối ưu, năng lượng ước tính (Wh/m²), kèm nhãn hướng tiếng Việt (Bắc, Đông, …).
- **Sử dụng:**  
  - API `/api/optimal-orientation` nhận thêm tham số `lat/lon/alt/tz` và tham số quét (tilt_step, tilt_max, azimuth_step, freq).  
  - Frontend hiển thị kết quả và mô tả bằng tiếng Việt.

### 3. Hiển Thị & Mô Phỏng (Frontend)

- **Nội suy thời gian:** danh sách mẫu (elevation, azimuth) theo phút; khi người dùng kéo thanh trượt, hệ thống nội suy tuyến tính elevation và dùng hàm `lerpAngleDeg` để nội suy góc phương có chu kỳ 360°.  
- **Canvas 2D:** `computeSunCanvasPosition` chuyển đổi góc thiên văn thành tọa độ:  
  - `x = center + r * cos(azimuth) * cos(elevation)`  
  - `y = center - r * sin(azimuth) * cos(elevation)`  
  - Bảo đảm quỹ đạo từ Đông sang Tây, Mặt Trời biến mất khi `y` vượt đường chân trời.
- **Vòng lặp animation:** requestAnimationFrame 60 fps, tăng/giảm thời gian nội bộ theo tốc độ người dùng chọn, đồng bộ hiển thị và cập nhật bảng thông tin.
- **Quản lý vị trí:** preset cho các thành phố phổ biến; người dùng có thể nhập tọa độ tay → frontend gửi `lat/lon/alt/tz` cho backend, đồng thời cập nhật năm cần tối ưu.

### 4. API và Dữ Liệu Trả Về

- `/api/sun-position`: trả về góc tại thời điểm hiện tại/ISO, kèm metadata địa điểm/múi giờ.  
- `/api/sun-path`: trả về đường đi cả ngày (`path`, `sunrise`, `sunset`, `solar_noon`, `location`).  
- `/api/optimal-orientation`: trả về hướng đặt tối ưu, góc nghiêng, năng lượng ước tính, nhãn hướng và thông tin địa điểm.
- Mọi endpoint cho phép override bằng tham số truy vấn (lat, lon, alt|altitude, tz, name) để phân tích nhiều khu vực.

### 5. Kiểm Thử & Đảm Bảo Chất Lượng

- `pytest` kiểm chứng:  
  - Góc mặt trời vào các thời điểm chuẩn (so với NOAA ±0.2°).  
  - Tổng số mẫu quỹ đạo, bình minh/hoàng hôn, solar noon.  
  - Việc truyền tọa độ tùy chỉnh không phá vỡ dữ liệu trả về.  
  - Thuật toán tối ưu luôn trả tilt/azimuth trong phạm vi mong đợi.
- Giao diện cung cấp cảnh báo và ghi log lỗi nếu API không phản hồi, đảm bảo người dùng nắm tình trạng tính toán.

## Kiểm Thử

Chạy các bài kiểm thử đơn vị với PyTest:

```bash
# Kích hoạt conda environment
conda activate solar-mirror

# Chạy tests
pytest
```

`tests/test_solar_calculator.py` xác thực các góc elevation/azimuth của mặt trời so với kết quả SPA cấp NOAA (dung sai ±0.2°) và kiểm tra lấy mẫu đường đi cũng như xác thực đầu vào.

## Các Bước Tiếp Theo

- Lớp tối ưu hóa điều khiển gương
- Bố cục responsive + ergonomics di động
- Lưu trữ cache ngoại tuyến của các đường đi mặt trời
- Thêm các địa điểm địa lý qua cấu hình
