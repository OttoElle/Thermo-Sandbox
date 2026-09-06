export class TempTimeChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'temp'; // 'temp' or 'pv'
  }

  setMode(mode) {
    this.mode = mode;
  }

  render(engine) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, w, h);

    if (this.mode === 'pv') {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P-V Diagram Active', w / 2, h / 2);
      return;
    }

    const padL = 36;
    const padR = 12;
    const padT = 12;
    const padB = 20;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    // Grid lines
    ctx.strokeStyle = '#242935';
    ctx.lineWidth = 1;
    for (let y = padB; y <= h - padT; y += 22) {
      ctx.beginPath();
      ctx.moveTo(padL, h - y);
      ctx.lineTo(w - padR, h - y);
      ctx.stroke();
    }

    // Determine data source: Sensors if present, otherwise Global System Telemetry
    const sensors = engine.sensors;
    const hasSensorData = sensors.length > 0 && sensors.some(s => s.historyTemp && s.historyTemp.length >= 2);
    const hasGlobalData = engine.historyTemp && engine.historyTemp.length >= 2;

    if (!hasSensorData && !hasGlobalData) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for telemetry...', w / 2, h / 2);
      return;
    }

    // Dynamic scale computation
    let minVal = Infinity;
    let maxVal = -Infinity;
    let minTime = Infinity;
    let maxTime = -Infinity;

    if (hasSensorData) {
      sensors.forEach(s => {
        if (!s.historyTemp || s.historyTemp.length === 0) return;
        s.historyTemp.forEach(v => {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        });
        if (s.historyTime && s.historyTime.length > 0) {
          if (s.historyTime[0] < minTime) minTime = s.historyTime[0];
          if (s.historyTime[s.historyTime.length - 1] > maxTime) maxTime = s.historyTime[s.historyTime.length - 1];
        }
      });
    } else if (hasGlobalData) {
      engine.historyTemp.forEach(v => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
      minTime = engine.historyTime[0];
      maxTime = engine.historyTime[engine.historyTime.length - 1];
    }

    if (minVal === maxVal || minVal === Infinity) {
      minVal = 250;
      maxVal = 350;
    } else {
      minVal = Math.max(0, Math.floor(minVal - 10));
      maxVal = Math.ceil(maxVal + 10);
    }
    const rangeVal = maxVal - minVal || 1;
    const duration = Math.max(1.0, maxTime - minTime);

    const chamberColors = ['#38bdf8', '#ef4444', '#22c55e', '#f59e0b', '#a855f7'];

    // Draw sensor traces
    if (hasSensorData) {
      sensors.forEach((sensor, sIdx) => {
        const histT = sensor.historyTemp;
        const histTime = sensor.historyTime;
        if (!histT || histT.length < 2) return;

        ctx.strokeStyle = sensor.color || chamberColors[sIdx % chamberColors.length];
        ctx.lineWidth = 1.8;
        ctx.beginPath();

        for (let i = 0; i < histT.length; i++) {
          const tFrac = Math.max(0, Math.min(1, (histTime[i] - minTime) / duration));
          const valFrac = Math.max(0, Math.min(1, (histT[i] - minVal) / rangeVal));
          const x = padL + tFrac * chartW;
          const y = h - padB - valFrac * chartH;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    } else if (hasGlobalData) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < engine.historyTemp.length; i++) {
        const tFrac = Math.max(0, Math.min(1, (engine.historyTime[i] - minTime) / duration));
        const valFrac = Math.max(0, Math.min(1, (engine.historyTemp[i] - minVal) / rangeVal));
        const x = padL + tFrac * chartW;
        const y = h - padB - valFrac * chartH;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    // Scale labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8.5px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxVal)}K`, padL - 4, padT + 8);
    ctx.fillText(`${Math.round((minVal + maxVal) * 0.5)}K`, padL - 4, padT + chartH * 0.5 + 3);
    ctx.fillText(`${Math.round(minVal)}K`, padL - 4, h - padB);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxTime.toFixed(1)}s`, w - padR, h - padB + 12);
  }
}
