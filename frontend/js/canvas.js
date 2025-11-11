const CANVAS_CONFIG = {
  width: 800,
  height: 600,
  centerX: 400,
  centerY: 400,
  radius: 250,
};

const COLORS = {
  daySky: "#87CEEB",
  nightSky: "#191970",
  dayGround: "#90EE90",
  nightGround: "#2F4F4F",
  houseDay: "#8B4513",
  houseNight: "#696969",
  sun: "#FFD700",
  sunGlow: "#FFA500",
  moon: "#F0E68C",
  path: "rgba(255,255,255,0.7)",
  grid: "rgba(255,255,255,0.25)",
};

export function computeSunCanvasPosition(elevationDeg, azimuthDeg, customCenter) {
  const { centerX, centerY, radius } = customCenter ?? CANVAS_CONFIG;
  const elevationRad = (elevationDeg * Math.PI) / 180;
  const azimuthRad = ((azimuthDeg - 90) * Math.PI) / 180;

  const x = centerX + radius * Math.cos(azimuthRad) * Math.cos(elevationRad);
  const y = centerY - radius * Math.sin(azimuthRad) * Math.cos(elevationRad);
  return { x, y };
}

export class SolarCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this._setupCanvas();
  }

  _setupCanvas() {
    const ratio = this.devicePixelRatio;
    const { width, height } = this.canvas;
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(ratio, ratio);
  }

  clear(isDaytime) {
    const skyColor = isDaytime ? COLORS.daySky : COLORS.nightSky;
    const groundColor = isDaytime ? COLORS.dayGround : COLORS.nightGround;
    const { width, height, centerY } = CANVAS_CONFIG;

    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, skyColor);
    gradient.addColorStop(0.75, skyColor);
    gradient.addColorStop(1, groundColor);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // Ground strip for emphasis
    this.ctx.fillStyle = groundColor;
    this.ctx.fillRect(0, centerY, width, height - centerY);
  }

  drawHouse(isDaytime) {
    const { centerX, centerY } = CANVAS_CONFIG;
    const baseWidth = 80;
    const baseHeight = 50;
    const roofHeight = 35;

    this.ctx.fillStyle = isDaytime ? COLORS.houseDay : COLORS.houseNight;
    this.ctx.fillRect(centerX - baseWidth / 2, centerY - baseHeight, baseWidth, baseHeight);

    this.ctx.beginPath();
    this.ctx.moveTo(centerX - baseWidth / 2 - 6, centerY - baseHeight);
    this.ctx.lineTo(centerX, centerY - baseHeight - roofHeight);
    this.ctx.lineTo(centerX + baseWidth / 2 + 6, centerY - baseHeight);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawCompassLines() {
    const { centerX, centerY, radius } = CANVAS_CONFIG;
    this.ctx.save();
    this.ctx.strokeStyle = COLORS.grid;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 6]);

    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const xEnd = centerX + radius * Math.cos(rad);
      const yEnd = centerY + radius * Math.sin(rad);
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(xEnd, yEnd);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawSunPath() {
    const { centerX, centerY, radius } = CANVAS_CONFIG;
    this.ctx.save();
    this.ctx.strokeStyle = COLORS.path;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 8]);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI, false);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSun(elevationDeg, azimuthDeg) {
    const { x, y } = computeSunCanvasPosition(elevationDeg, azimuthDeg);
    if (y > CANVAS_CONFIG.centerY) {
      return; // below horizon
    }

    const radius = 15;
    const gradient = this.ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 1.8);
    gradient.addColorStop(0, COLORS.sun);
    gradient.addColorStop(1, `${COLORS.sunGlow}00`);

    this.ctx.save();
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.fillStyle = COLORS.sun;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawMoon() {
    const { centerX, centerY, radius } = CANVAS_CONFIG;
    const x = centerX - radius * 0.6;
    const y = centerY - radius * 0.7;
    const moonRadius = 14;

    this.ctx.save();
    this.ctx.fillStyle = COLORS.moon;
    this.ctx.beginPath();
    this.ctx.arc(x, y, moonRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.nightSky;
    this.ctx.beginPath();
    this.ctx.arc(x + 6, y - 2, moonRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  render({ elevation, azimuth, isDaytime }) {
    this.clear(isDaytime);
    this.drawSunPath();
    this.drawCompassLines();
    this.drawHouse(isDaytime);

    if (isDaytime && elevation !== undefined && azimuth !== undefined) {
      this.drawSun(elevation, azimuth);
    } else {
      this.drawMoon();
    }
  }
}
