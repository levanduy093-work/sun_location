const API_BASE = window.location.origin;

async function requestJson(path, params = {}) {
  const url = new URL(path, API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

function applySiteParams(params, site) {
  if (!site) return params;
  const payload = { ...params };
  payload.lat = site.latitude;
  payload.lon = site.longitude;
  payload.alt = site.altitude;
  payload.tz = site.timezone;
  if (site.name) {
    payload.name = site.name;
  }
  return payload;
}

export async function fetchSunPosition(datetime, site) {
  const params = applySiteParams(datetime ? { datetime } : {}, site);
  return requestJson("/api/sun-position", params);
}

export async function fetchSunPath(date, interval, site) {
  const params = applySiteParams({ date, interval }, site);
  return requestJson("/api/sun-path", params);
}

export async function fetchOptimalOrientation(options, site) {
  const params = applySiteParams(
    {
      year: options?.year,
      tilt_step: options?.tiltStep,
      tilt_max: options?.tiltMax,
      azimuth_step: options?.azimuthStep,
      freq: options?.freq,
    },
    site,
  );
  return requestJson("/api/optimal-orientation", params);
}
