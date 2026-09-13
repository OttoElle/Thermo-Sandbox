export class ChamberChart {
  static render(canvas, sensor, metric = 'temp') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, w, h);

    const data = metric === 'temp' ? sensor.historyTemp : sensor.historyPressure;
    const time = sensor.historyTime;

    if (!data || data.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Collecting data...', w / 2, h / 2 + 3);
      return;
    }

    const padL = 34, padR = 10, padT = 8, padB = 16;
    const chartW = w - padL - padR, chartH = h - padT - padB;

    let minVal = Math.min(...data);
    let maxVal = Math.max(...data);
    if (minVal === maxVal) {
      minVal -= 5;
      maxVal += 5;
    }
    const range = maxVal - minVal || 1;
    const minTime = time[0] || 0;
    const maxTime = Math.max(minTime + 1.0, time[time.length - 1] || 1);
    const duration = maxTime - minTime || 1;

    // Grid lines
    ctx.strokeStyle = '#242935';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
    ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB);
    ctx.stroke();

    // Data Line
    const strokeColor = metric === 'temp' ? (sensor.color || '#38bdf8') : '#f59e0b';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const timeFrac = Math.max(0, Math.min(1, ((time[i] || minTime) - minTime) / duration));
      const valFrac = Math.max(0, Math.min(1, (data[i] - minVal) / range));
      const x = padL + timeFrac * chartW;
      const y = h - padB - valFrac * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxVal)}`, padL - 3, padT + 8);
    ctx.fillText(`${Math.round(minVal)}`, padL - 3, h - padB);
  }
}

export class DashboardChart {
  constructor(id, target, metric, canvas = null) {
    this.id = id;
    this.target = target; // 'global' or sensor instance
    this.metric = metric; // 'temp', 'pressure', 'volume', 'count', 'kinetic', 'drift', 'pv'
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  getTitle() {
    const targetName = this.target === 'global' ? 'Global System' : (this.target.label || 'Chamber');
    const metricLabels = {
      temp: 'Temperature T(t) [K]',
      pressure: 'Pressure P(t) [Pa]',
      volume: 'Volume V(t) [px²]',
      count: 'Particles N(t)',
      kinetic: 'Kinetic Energy E_kin(t) [J]',
      drift: 'Drift Velocity |v_drift|(t) [px/s]',
      pv: 'P-V Indicator Diagram'
    };
    return `${metricLabels[this.metric] || this.metric} · ${targetName}`;
  }

  render(engine) {
    if (!this.canvas) return;
    if (!this.ctx) this.ctx = this.canvas.getContext('2d');
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, w, h);

    const padL = 36;
    const padR = 10;
    const padT = 8;
    const padB = 16;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    let timeArr = [];
    let dataArr = [];
    let strokeColor = '#38bdf8';

    if (this.target === 'global') {
      timeArr = engine.historyTime || [];
      if (this.metric === 'temp') { dataArr = engine.historyTemp || []; strokeColor = '#38bdf8'; }
      else if (this.metric === 'pressure') { dataArr = engine.historyPressure || []; strokeColor = '#f59e0b'; }
      else if (this.metric === 'volume') { dataArr = engine.historyVolume || []; strokeColor = '#22c55e'; }
      else if (this.metric === 'count') { dataArr = engine.historyCount || []; strokeColor = '#a855f7'; }
      else if (this.metric === 'kinetic') { dataArr = engine.historyKineticEnergy || []; strokeColor = '#ec4899'; }
      else if (this.metric === 'drift') { dataArr = [0]; strokeColor = '#22c55e'; }
    } else {
      const s = this.target;
      timeArr = s.historyTime || [];
      if (this.metric === 'temp') { dataArr = s.historyTemp || []; strokeColor = s.color || '#38bdf8'; }
      else if (this.metric === 'pressure') { dataArr = s.historyPressure || []; strokeColor = '#f59e0b'; }
      else if (this.metric === 'volume') { dataArr = s.historyVolume || []; strokeColor = '#22c55e'; }
      else if (this.metric === 'count') { dataArr = s.historyCount || []; strokeColor = '#a855f7'; }
      else if (this.metric === 'kinetic') { dataArr = s.historyKineticEnergy || []; strokeColor = '#ec4899'; }
      else if (this.metric === 'drift') { dataArr = s.historyDrift || []; strokeColor = '#22c55e'; }
      else if (this.metric === 'pv') {
        const pArr = s.historyPressure || [];
        const vArr = s.historyVolume || [];
        if (pArr.length < 2) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Collecting P-V loop...', w / 2, h / 2);
          return;
        }
        let minP = Math.min(...pArr), maxP = Math.max(...pArr);
        let minV = Math.min(...vArr), maxV = Math.max(...vArr);
        if (minP === maxP) { minP -= 10; maxP += 10; }
        if (minV === maxV) { minV -= 50; maxV += 50; }

        ctx.strokeStyle = '#242935';
        ctx.beginPath();
        ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
        ctx.stroke();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < pArr.length; i++) {
          const x = padL + ((vArr[i] - minV) / (maxV - minV || 1)) * chartW;
          const y = h - padB - ((pArr[i] - minP) / (maxP - minP || 1)) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }
    }

    if (!dataArr || dataArr.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Collecting data...', w / 2, h / 2);
      return;
    }

    let minVal = Math.min(...dataArr);
    let maxVal = Math.max(...dataArr);
    if (minVal === maxVal) {
      minVal -= 5;
      maxVal += 5;
    }
    const range = maxVal - minVal || 1;
    const minTime = timeArr[0] || 0;
    const maxTime = Math.max(minTime + 1.0, timeArr[timeArr.length - 1] || 1);
    const duration = maxTime - minTime || 1;

    // Grid lines
    ctx.strokeStyle = '#242935';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    // Line curve
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let i = 0; i < dataArr.length; i++) {
      const timeFrac = Math.max(0, Math.min(1, ((timeArr[i] || minTime) - minTime) / duration));
      const valFrac = Math.max(0, Math.min(1, (dataArr[i] - minVal) / range));
      const x = padL + timeFrac * chartW;
      const y = h - padB - valFrac * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Scale labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxVal)}`, padL - 3, padT + 7);
    ctx.fillText(`${Math.round(minVal)}`, padL - 3, h - padB);
    ctx.fillText(`${maxTime.toFixed(1)}s`, w - padR, h - padB + 11);
  }
}
