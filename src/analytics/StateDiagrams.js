export class StateDiagrams {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'PV';
    this.history = [];
    this.maxHistory = 150;
  }

  setMode(mode) {
    this.mode = mode;
  }

  recordState(v, p, t) {
    if (isNaN(v) || isNaN(p) || isNaN(t)) return;
    this.history.push({ V: v, P: p, T: t, time: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  clear() {
    this.history = [];
  }

  render(engine) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (engine.pistons.length > 0) {
      const piston = engine.pistons[0];
      const vol = piston.getPos() - piston.minPos;
      const p = Math.max(0.1, piston.forceLeft / (piston.height || 1));
      const t = engine.stats.systemTemperature;
      this.recordState(vol, p, t);
    } else if (engine.sensors.length > 0) {
      const s = engine.sensors[0];
      this.recordState(s.getArea() / 100, s.pressure, s.temperature);
    }

    const chartLeft = 28;
    const chartRight = w - 10;
    const chartBottom = h - 18;
    const chartTop = 10;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let y = chartBottom; y >= chartTop; y -= 25) {
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }
    for (let x = chartLeft; x <= chartRight; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartBottom);
      ctx.stroke();
    }

    if (this.history.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Warte auf Messdaten...', w / 2, h / 2);
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < this.history.length; i++) {
      const d = this.history[i];
      const xVal = d.V;
      const yVal = this.mode === 'PV' ? d.P : d.T;

      if (xVal < minX) minX = xVal;
      if (xVal > maxX) maxX = xVal;
      if (yVal < minY) minY = yVal;
      if (yVal > maxY) maxY = yVal;
    }

    const padX = Math.max(10, (maxX - minX) * 0.15);
    const padY = Math.max(5, (maxY - minY) * 0.15);
    minX = Math.max(0, minX - padX);
    maxX += padX;
    minY = Math.max(0, minY - padY);
    maxY += padY;

    const scaleX = chartWidth / (maxX - minX || 1);
    const scaleY = chartHeight / (maxY - minY || 1);

    // Trajectory curve (Clean Cyan / Blue like in screenshot)
    ctx.lineWidth = 2;
    for (let i = 1; i < this.history.length; i++) {
      const p0 = this.history[i - 1];
      const p1 = this.history[i];

      const x0 = chartLeft + (p0.V - minX) * scaleX;
      const y0 = chartBottom - ((this.mode === 'PV' ? p0.P : p0.T) - minY) * scaleY;
      const x1 = chartLeft + (p1.V - minX) * scaleX;
      const y1 = chartBottom - ((this.mode === 'PV' ? p1.P : p1.T) - minY) * scaleY;

      const alpha = (i / this.history.length) * 0.8 + 0.2;
      ctx.strokeStyle = this.mode === 'PV' ? `rgba(2, 132, 199, ${alpha})` : `rgba(217, 70, 239, ${alpha})`;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Latest point
    const latest = this.history[this.history.length - 1];
    const curX = chartLeft + (latest.V - minX) * scaleX;
    const curY = chartBottom - ((this.mode === 'PV' ? latest.P : latest.T) - minY) * scaleY;

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Baseline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(this.mode === 'PV' ? 'P' : 'T', chartLeft - 4, chartTop + 10);
    ctx.textAlign = 'center';
    ctx.fillText('V', chartLeft + chartWidth / 2, chartBottom + 12);
  }
}
