export class ChamberChart {
  static render(canvas, sensor, metric = 'temp') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, w, h);

    let data = metric === 'temp' ? sensor.historyTemp : sensor.historyPressure;
    let time = sensor.historyTime;

    if (!data || data.length === 0) {
      const currentVal = metric === 'temp' ? sensor.temperature : sensor.pressure;
      if (typeof currentVal === 'number' && !isNaN(currentVal)) {
        data = [currentVal, currentVal];
        time = [0, 1.0];
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Collecting data...', w / 2, h / 2 + 3);
        return;
      }
    } else if (data.length === 1) {
      data = [data[0], data[0]];
      time = [time[0] || 0, (time[0] || 0) + 1.0];
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
      pv: 'P-V Indicator Diagram',
      pt: 'P-T State Diagram',
      ts: 'T-s State Diagram',
      hist: 'Velocity Distribution f(v)'
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

    // 1. Histogram Metric
    if (this.metric === 'hist') {
      const binRanges = [
        { min: 0, max: 100 },
        { min: 100, max: 200 },
        { min: 200, max: 300 },
        { min: 300, max: 400 },
        { min: 400, max: 500 },
        { min: 500, max: 99999 }
      ];
      const speeds = [...((this.target === 'global' ? engine.latestSpeedSamples : this.target.speedSamples) || [])];
      if (speeds.length === 0 && this.target === 'global' && engine.particles && engine.particles.length > 0) {
        const sampleCount = Math.min(500, engine.particles.length);
        for (let i = 0; i < sampleCount; i++) {
          speeds.push(engine.particles[i].getSpeed());
        }
      }
      if (speeds.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Collecting velocity data...', w / 2, h / 2);
        return;
      }
      const counts = new Array(binRanges.length).fill(0);
      for (let i = 0; i < speeds.length; i++) {
        const s = speeds[i];
        for (let b = 0; b < binRanges.length; b++) {
          if (s >= binRanges[b].min && s < binRanges[b].max) {
            counts[b]++;
            break;
          }
        }
      }
      const maxCount = Math.max(1, ...counts);
      const barW = chartW / binRanges.length;
      for (let b = 0; b < binRanges.length; b++) {
        const barH = (counts[b] / maxCount) * chartH;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(padL + b * barW + 2, h - padB - barH, barW - 4, barH);
      }
      ctx.strokeStyle = '#242935';
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${maxCount}`, padL - 3, padT + 8);
      ctx.fillText('0', padL - 3, h - padB);
      return;
    }

    // 2. State & Indicator Diagrams (P-V, P-T, T-s)
    if (this.metric === 'pv' || this.metric === 'pt' || this.metric === 'ts') {
      const isGlobal = this.target === 'global';
      const pArr = isGlobal ? engine.historyPressure : this.target.historyPressure;
      const tArr = isGlobal ? engine.historyTemp : this.target.historyTemp;
      const vArr = isGlobal ? engine.historyVolume : this.target.historyVolume;

      let xArr = [], yArr = [];
      let strokeCol = '#f59e0b';
      if (this.metric === 'pv') {
        xArr = vArr || []; yArr = pArr || []; strokeCol = '#f59e0b';
      } else if (this.metric === 'pt') {
        xArr = tArr || []; yArr = pArr || []; strokeCol = '#ec4899';
      } else if (this.metric === 'ts') {
        xArr = (vArr && tArr) ? tArr.map((t, idx) => Math.log(Math.max(1, t)) + 0.6 * Math.log(Math.max(1, vArr[idx] || 1))) : [];
        yArr = tArr || [];
        strokeCol = '#38bdf8';
      }

      if (!xArr || xArr.length === 0 || !yArr || yArr.length === 0) {
        const curP = isGlobal ? ((engine.stats.particleCount / 2500) * 35.0 * engine.stats.systemTemperature * 10) : this.target.pressure;
        const curT = isGlobal ? engine.stats.systemTemperature : this.target.temperature;
        const curV = isGlobal ? (2500 * 2500) : this.target.volume;
        if (this.metric === 'pv') { xArr = [curV, curV]; yArr = [curP, curP]; }
        else if (this.metric === 'pt') { xArr = [curT, curT]; yArr = [curP, curP]; }
        else if (this.metric === 'ts') {
          const curS = Math.log(Math.max(1, curT)) + 0.6 * Math.log(Math.max(1, curV));
          xArr = [curS, curS]; yArr = [curT, curT];
        }
      } else if (xArr.length === 1 && yArr.length === 1) {
        xArr = [xArr[0], xArr[0]];
        yArr = [yArr[0], yArr[0]];
      }

      if (!xArr || xArr.length < 2 || !yArr || yArr.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Collecting state points...', w / 2, h / 2);
        return;
      }

      let minX = Math.min(...xArr), maxX = Math.max(...xArr);
      let minY = Math.min(...yArr), maxY = Math.max(...yArr);
      if (minX === maxX) { minX -= 10; maxX += 10; }
      if (minY === maxY) { minY -= 10; maxY += 10; }

      ctx.strokeStyle = '#242935';
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
      ctx.stroke();

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const len = Math.min(xArr.length, yArr.length);
      for (let i = 0; i < len; i++) {
        const x = padL + ((xArr[i] - minX) / (maxX - minX || 1)) * chartW;
        const y = h - padB - ((yArr[i] - minY) / (maxY - minY || 1)) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(maxY)}`, padL - 3, padT + 8);
      ctx.fillText(`${Math.round(minY)}`, padL - 3, h - padB);
      return;
    }

    // 3. Time Series Curves
    let timeArr = [];
    let dataArr = [];
    let strokeColor = '#38bdf8';

    if (this.target === 'global') {
      timeArr = (engine.historyTime && engine.historyTime.length > 0) ? [...engine.historyTime] : [];
      if (this.metric === 'temp') { dataArr = [...(engine.historyTemp || [])]; strokeColor = '#38bdf8'; }
      else if (this.metric === 'pressure') { dataArr = [...(engine.historyPressure || [])]; strokeColor = '#f59e0b'; }
      else if (this.metric === 'volume') { dataArr = [...(engine.historyVolume || [])]; strokeColor = '#22c55e'; }
      else if (this.metric === 'count') { dataArr = [...(engine.historyCount || [])]; strokeColor = '#a855f7'; }
      else if (this.metric === 'kinetic') { dataArr = [...(engine.historyKineticEnergy || [])]; strokeColor = '#ec4899'; }
      else if (this.metric === 'drift') { dataArr = [...(engine.historyDrift || [])]; strokeColor = '#22c55e'; }
    } else {
      const s = this.target;
      timeArr = (s.historyTime && s.historyTime.length > 0) ? [...s.historyTime] : [];
      if (this.metric === 'temp') { dataArr = [...(s.historyTemp || [])]; strokeColor = s.color || '#38bdf8'; }
      else if (this.metric === 'pressure') { dataArr = [...(s.historyPressure || [])]; strokeColor = '#f59e0b'; }
      else if (this.metric === 'volume') { dataArr = [...(s.historyVolume || [])]; strokeColor = '#22c55e'; }
      else if (this.metric === 'count') { dataArr = [...(s.historyCount || [])]; strokeColor = '#a855f7'; }
      else if (this.metric === 'kinetic') { dataArr = [...(s.historyKineticEnergy || [])]; strokeColor = '#ec4899'; }
      else if (this.metric === 'drift') { dataArr = [...(s.historyDrift || [])]; strokeColor = '#22c55e'; }
    }

    if (!dataArr || dataArr.length === 0) {
      let curVal = 0;
      if (this.target === 'global') {
        if (this.metric === 'temp') curVal = engine.stats.systemTemperature;
        else if (this.metric === 'pressure') curVal = (engine.stats.particleCount / 2500) * 35.0 * engine.stats.systemTemperature * 10;
        else if (this.metric === 'volume') curVal = 2500 * 2500;
        else if (this.metric === 'count') curVal = engine.stats.particleCount;
        else if (this.metric === 'kinetic') curVal = engine.stats.totalKineticEnergy;
        else if (this.metric === 'drift') curVal = (engine.historyDrift && engine.historyDrift.length > 0) ? engine.historyDrift[0] : 0;
      } else {
        const s = this.target;
        if (this.metric === 'temp') curVal = s.temperature;
        else if (this.metric === 'pressure') curVal = s.pressure;
        else if (this.metric === 'volume') curVal = s.volume;
        else if (this.metric === 'count') curVal = s.particleCount;
        else if (this.metric === 'kinetic') curVal = s.kineticEnergy;
        else if (this.metric === 'drift') curVal = s.displayDriftSpeed || 0;
      }
      dataArr = [curVal, curVal];
      timeArr = [engine.totalTime || 0, (engine.totalTime || 0) + 1.0];
    } else if (dataArr.length === 1) {
      dataArr = [dataArr[0], dataArr[0]];
      timeArr = [timeArr[0] || 0, (timeArr[0] || 0) + 1.0];
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
