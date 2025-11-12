import { fetchOptimalOrientation, fetchSunPath, fetchSunPosition } from "./api.js";
import { SolarCanvas } from "./canvas.js";

const PRESET_LOCATIONS = {
  hcm: {
    name: "TP. Hồ Chí Minh, Việt Nam",
    latitude: 10.8231,
    longitude: 106.6297,
    altitude: 19,
    timezone: "Asia/Ho_Chi_Minh",
  },
  hanoi: {
    name: "Hà Nội, Việt Nam",
    latitude: 21.0278,
    longitude: 105.8342,
    altitude: 10,
    timezone: "Asia/Bangkok",
  },
  danang: {
    name: "Đà Nẵng, Việt Nam",
    latitude: 16.0471,
    longitude: 108.2068,
    altitude: 5,
    timezone: "Asia/Bangkok",
  },
  tokyo: {
    name: "Tokyo, Nhật Bản",
    latitude: 35.6762,
    longitude: 139.6503,
    altitude: 40,
    timezone: "Asia/Tokyo",
  },
  sydney: {
    name: "Sydney, Úc",
    latitude: -33.8688,
    longitude: 151.2093,
    altitude: 58,
    timezone: "Australia/Sydney",
  },
};

const canvas = new SolarCanvas(document.getElementById("solarCanvas"));

const locationPresetSelect = document.getElementById("locationPreset");
const latitudeInput = document.getElementById("latitudeInput");
const longitudeInput = document.getElementById("longitudeInput");
const altitudeInput = document.getElementById("altitudeInput");
const timezoneInput = document.getElementById("timezoneInput");
const orientationYearInput = document.getElementById("orientationYear");
const applyLocationButton = document.getElementById("applyLocationButton");
const activeLocationLabel = document.getElementById("activeLocationLabel");
const timezoneReadout = document.getElementById("timezoneReadout");

const datePicker = document.getElementById("datePicker");
const timeSlider = document.getElementById("timeSlider");
const playPauseButton = document.getElementById("playPauseButton");
const resetButton = document.getElementById("resetButton");
const speedButtons = document.querySelectorAll(".speed-control button[data-speed]");

const currentTimeReadout = document.getElementById("currentTime");
const elevationReadout = document.getElementById("elevationReadout");
const azimuthReadout = document.getElementById("azimuthReadout");
const zenithReadout = document.getElementById("zenithReadout");
const sunriseReadout = document.getElementById("sunriseReadout");
const sunsetReadout = document.getElementById("sunsetReadout");
const solarNoonReadout = document.getElementById("solarNoonReadout");

const orientationDirectionReadout = document.getElementById("orientationDirection");
const orientationTiltReadout = document.getElementById("orientationTilt");
const orientationAzimuthReadout = document.getElementById("orientationAzimuth");
const orientationEnergyReadout = document.getElementById("orientationEnergy");
const orientationSummary = document.getElementById("orientationSummary");

let currentSite = { ...PRESET_LOCATIONS.hcm };
let orientationYear = new Date().getFullYear();
let dateFormatter = buildDateFormatter(currentSite.timezone);

let pathData = null;
let orientationData = null;
let isPlaying = false;
let speedMultiplier = 1;
let selectedDate = null;
let currentMinutes = 0;
let lastFrameTimestamp = null;

function buildDateFormatter(timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function updateDateFormatter() {
  dateFormatter = buildDateFormatter(currentSite.timezone);
}

function formatNumber(value, decimals = 1) {
  return Number(value ?? 0).toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pad(value) {
  return value.toString().padStart(2, "0");
}

function parseTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngleDeg(a, b, t) {
  const delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

function formatClock(minutesValue) {
  const totalSeconds = Math.floor(minutesValue * 60);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function preparePathData(data) {
  const samples = (data?.path ?? []).map((entry) => ({
    minutes: parseTimeToMinutes(entry.time),
    elevation: Number(entry.elevation),
    azimuth: Number(entry.azimuth),
  }));
  if (samples.length && samples[samples.length - 1].minutes < 1440) {
    const last = samples[samples.length - 1];
    samples.push({ ...last, minutes: 1440 });
  }
  return { ...data, samples };
}

function getInterpolatedPosition(minutesValue) {
  if (!pathData || !pathData.samples?.length) {
    return null;
  }

  const samples = pathData.samples;
  if (minutesValue <= samples[0].minutes) {
    const s = samples[0];
    return {
      elevation: s.elevation,
      azimuth: s.azimuth,
      zenith: +(90 - s.elevation).toFixed(2),
      isDaytime: s.elevation > 0,
    };
  }

  for (let i = 0; i < samples.length - 1; i += 1) {
    const current = samples[i];
    const next = samples[i + 1];
    if (minutesValue <= next.minutes) {
      const windowSpan = next.minutes - current.minutes || 1;
      const t = (minutesValue - current.minutes) / windowSpan;
      const elevation = lerp(current.elevation, next.elevation, t);
      const azimuth = lerpAngleDeg(current.azimuth, next.azimuth, t);
      return {
        elevation: +elevation.toFixed(2),
        azimuth: +azimuth.toFixed(2),
        zenith: +(90 - elevation).toFixed(2),
        isDaytime: elevation > 0,
      };
    }
  }

  const last = samples[samples.length - 1];
  return {
    elevation: last.elevation,
    azimuth: last.azimuth,
    zenith: +(90 - last.elevation).toFixed(2),
    isDaytime: last.elevation > 0,
  };
}

function updateBodyMode(isDaytime) {
  document.body.classList.toggle("night-mode", !isDaytime);
}

function updateReadouts(position) {
  if (!position) {
    elevationReadout.textContent = "--.--°";
    azimuthReadout.textContent = "--.--°";
    zenithReadout.textContent = "--.--°";
    return;
  }
  elevationReadout.textContent = `${formatNumber(position.elevation, 2)}°`;
  azimuthReadout.textContent = `${formatNumber(position.azimuth, 2)}°`;
  zenithReadout.textContent = `${formatNumber(position.zenith, 2)}°`;
}

function updateSunriseInfo() {
  sunriseReadout.textContent = pathData?.sunrise ?? "--:--";
  sunsetReadout.textContent = pathData?.sunset ?? "--:--";
  solarNoonReadout.textContent = pathData?.solar_noon ?? "--:--";
}

function updateCurrentTimeDisplay() {
  currentTimeReadout.textContent = formatClock(currentMinutes);
  timeSlider.value = Math.round(currentMinutes);
}

function renderScene() {
  const position = getInterpolatedPosition(currentMinutes);
  updateReadouts(position);
  updateBodyMode(position ? position.isDaytime : false);
  canvas.render({
    elevation: position?.elevation,
    azimuth: position?.azimuth,
    isDaytime: position?.isDaytime ?? false,
    pathSamples: pathData?.samples,
  });
}

function setPlayState(playing) {
  isPlaying = playing;
  playPauseButton.textContent = playing ? "Tạm dừng" : "Phát";
}

function setSpeed(speed) {
  speedMultiplier = speed;
  speedButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.speed) === speed);
  });
}

function updateLocationLabel() {
  activeLocationLabel.textContent = currentSite.name;
}

function updateTimezoneReadout() {
  timezoneReadout.textContent = currentSite.timezone;
}

function findPresetKey(site) {
  return (
    Object.entries(PRESET_LOCATIONS).find(([, preset]) => {
      const sameLat = Math.abs(preset.latitude - site.latitude) < 1e-4;
      const sameLon = Math.abs(preset.longitude - site.longitude) < 1e-4;
      return sameLat && sameLon && preset.timezone === site.timezone;
    })?.[0] ?? null
  );
}

function fillInputsFromSite(site, { skipPresetUpdate = false } = {}) {
  latitudeInput.value = Number.isFinite(site.latitude) ? site.latitude.toFixed(4) : "";
  longitudeInput.value = Number.isFinite(site.longitude) ? site.longitude.toFixed(4) : "";
  altitudeInput.value = Number.isFinite(site.altitude) ? site.altitude.toFixed(0) : "";
  timezoneInput.value = site.timezone ?? "";

  if (!skipPresetUpdate) {
    const presetKey = findPresetKey(site);
    locationPresetSelect.value = presetKey ?? "custom";
  }
}

function parseSiteFromInputs() {
  const lat = parseFloat(latitudeInput.value);
  const lon = parseFloat(longitudeInput.value);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    alert("Vui lòng nhập vĩ độ và kinh độ hợp lệ.");
    return null;
  }
  const altitude = Number.isFinite(parseFloat(altitudeInput.value))
    ? parseFloat(altitudeInput.value)
    : currentSite.altitude ?? 0;
  const timezone = timezoneInput.value.trim() || currentSite.timezone;

  const preset = PRESET_LOCATIONS[locationPresetSelect.value];
  const name = preset
    ? preset.name
    : `Tọa độ (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;

  return {
    latitude: lat,
    longitude: lon,
    altitude,
    timezone,
    name,
  };
}

function setOrientationLoading() {
  orientationDirectionReadout.textContent = "Đang tính...";
  orientationTiltReadout.textContent = "--°";
  orientationAzimuthReadout.textContent = "--°";
  orientationEnergyReadout.textContent = "-- kWh/m²";
  orientationSummary.textContent = "Đang tính toán khuyến nghị đặt tấm pin...";
}

function updateOrientationDisplay(orientation, year) {
  if (!orientation) {
    orientationDirectionReadout.textContent = "--";
    orientationTiltReadout.textContent = "--°";
    orientationAzimuthReadout.textContent = "--°";
    orientationEnergyReadout.textContent = "-- kWh/m²";
    orientationSummary.textContent = "Chưa có dữ liệu khuyến nghị. Hãy thử cập nhật vị trí hoặc kiểm tra lại kết nối.";
    return;
  }

  const azText = `${formatNumber(orientation.azimuth, 1)}°`;
  orientationDirectionReadout.textContent = orientation.direction_label
    ? `${orientation.direction_label} (${azText})`
    : azText;
  orientationTiltReadout.textContent = `${formatNumber(orientation.tilt, 1)}°`;
  orientationAzimuthReadout.textContent = azText;
  orientationEnergyReadout.textContent = `${formatNumber(orientation.annual_poa_kwh_m2, 1)} kWh/m²`;
  const directionLabel = orientation.direction_label
    ? orientation.direction_label
    : `theo góc azimuth ${azText}`;
  orientationSummary.textContent = `Năm ${year}: nên đặt mặt pin hướng ${directionLabel} với góc nghiêng khoảng ${formatNumber(orientation.tilt, 1)}°. Năng lượng ước tính ${formatNumber(orientation.annual_poa_kwh_m2, 1)} kWh/m².`;
}

async function refreshOrientation() {
  setOrientationLoading();
  try {
    const response = await fetchOptimalOrientation(
      {
        year: orientationYear,
        tiltStep: 1,
        tiltMax: 60,
        azimuthStep: 5,
      },
      currentSite,
    );
    orientationData = response.orientation;
    updateOrientationDisplay(orientationData, response.year);
  } catch (error) {
    console.error("Không thể tính toán khuyến nghị đặt tấm pin:", error);
    updateOrientationDisplay(null, orientationYear);
  }
}

async function loadSunPath(dateString) {
  try {
    const data = await fetchSunPath(dateString, 60, currentSite);
    pathData = preparePathData(data);

    if (data?.location) {
      currentSite = {
        ...currentSite,
        latitude: Number(data.location.latitude),
        longitude: Number(data.location.longitude),
        altitude: Number(data.location.altitude ?? currentSite.altitude),
        name: data.location.name || currentSite.name,
      };
    }
    if (data?.timezone) {
      currentSite.timezone = data.timezone;
    }

    fillInputsFromSite(currentSite, { skipPresetUpdate: true });
    updateLocationLabel();
    updateTimezoneReadout();
    updateDateFormatter();
    updateSunriseInfo();
  } catch (error) {
    console.error("Không thể tải dữ liệu quỹ đạo Mặt Trời:", error);
  }
}

async function resetToNow() {
  try {
    setPlayState(false);
    const snapshot = await fetchSunPosition(undefined, currentSite);
    if (snapshot?.location) {
      currentSite = {
        ...currentSite,
        latitude: Number(snapshot.location.latitude ?? currentSite.latitude),
        longitude: Number(snapshot.location.longitude ?? currentSite.longitude),
        altitude: Number(snapshot.location.altitude ?? currentSite.altitude),
        name: snapshot.location.name || currentSite.name,
        timezone: snapshot.location.timezone || currentSite.timezone,
      };
      fillInputsFromSite(currentSite, { skipPresetUpdate: true });
      updateLocationLabel();
      updateTimezoneReadout();
      updateDateFormatter();
    }

    const [datePart, timePart] = snapshot.timestamp.split("T");
    const [hours, minutes, secondsWithOffset] = timePart.split(":");
    const seconds = secondsWithOffset.substring(0, 2);

    selectedDate = datePart;
    datePicker.value = selectedDate;

    currentMinutes = Number(hours) * 60 + Number(minutes) + Number(seconds) / 60;

    await loadSunPath(selectedDate);
    updateCurrentTimeDisplay();
    renderScene();
  } catch (error) {
    console.error("Không thể tải vị trí hiện tại của Mặt Trời:", error);
  }
}

function handleSliderInput(event) {
  setPlayState(false);
  currentMinutes = Number(event.target.value);
  updateCurrentTimeDisplay();
  renderScene();
}

async function handleDateChange(event) {
  const newDate = event.target.value;
  if (!newDate) {
    return;
  }
  selectedDate = newDate;
  setPlayState(false);
  currentMinutes = 0;
  await loadSunPath(selectedDate);
  updateCurrentTimeDisplay();
  renderScene();
}

function animationLoop(timestamp) {
  if (lastFrameTimestamp === null) {
    lastFrameTimestamp = timestamp;
  }
  const deltaMs = timestamp - lastFrameTimestamp;
  lastFrameTimestamp = timestamp;

  if (isPlaying) {
    const deltaMinutes = (deltaMs / 60000) * speedMultiplier;
    currentMinutes = (currentMinutes + deltaMinutes) % 1440;
    if (currentMinutes < 0) {
      currentMinutes += 1440;
    }
    updateCurrentTimeDisplay();
  }

  renderScene();
  requestAnimationFrame(animationLoop);
}

function initControls() {
  playPauseButton.addEventListener("click", () => {
    setPlayState(!isPlaying);
  });

  resetButton.addEventListener("click", () => {
    resetToNow();
  });

  timeSlider.addEventListener("input", handleSliderInput);
  datePicker.addEventListener("change", handleDateChange);

  speedButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const speed = Number(button.dataset.speed);
      setSpeed(speed);
    });
  });

  locationPresetSelect.addEventListener("change", () => {
    const preset = PRESET_LOCATIONS[locationPresetSelect.value];
    if (preset) {
      currentSite = { ...preset };
      fillInputsFromSite(currentSite, { skipPresetUpdate: true });
      updateLocationLabel();
      updateTimezoneReadout();
      updateDateFormatter();
    }
  });

  [latitudeInput, longitudeInput, altitudeInput, timezoneInput].forEach((input) => {
    input.addEventListener("input", () => {
      locationPresetSelect.value = "custom";
    });
  });

  orientationYearInput.addEventListener("change", () => {
    const parsed = parseInt(orientationYearInput.value, 10);
    if (Number.isFinite(parsed)) {
      orientationYear = Math.min(Math.max(parsed, 1900), 2100);
      orientationYearInput.value = orientationYear;
      refreshOrientation();
    } else {
      orientationYearInput.value = orientationYear;
    }
  });

  applyLocationButton.addEventListener("click", async () => {
    const site = parseSiteFromInputs();
    if (!site) {
      return;
    }
    const parsedYear = parseInt(orientationYearInput.value, 10);
    if (Number.isFinite(parsedYear)) {
      orientationYear = Math.min(Math.max(parsedYear, 1900), 2100);
      orientationYearInput.value = orientationYear;
    } else {
      orientationYearInput.value = orientationYear;
    }
    currentSite = site;
    updateLocationLabel();
    updateTimezoneReadout();
    updateDateFormatter();
    await resetToNow();
    await refreshOrientation();
  });
}

async function initialize() {
  initControls();
  setSpeed(1);

  orientationYear = new Date().getFullYear();
  orientationYearInput.value = orientationYear;

  fillInputsFromSite(currentSite);
  updateLocationLabel();
  updateTimezoneReadout();
  updateDateFormatter();

  await resetToNow();
  await refreshOrientation();

  requestAnimationFrame(animationLoop);
}

initialize();
