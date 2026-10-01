// One chart: time series, state diagram (P-V, P-T, T-s) or velocity histogram
// of a target ('global', a sensor zone, or 'sensors'). Draws crisp on HiDPI,
// with nice-number axes and units, a legend from two series on, a crosshair +
// tooltip on hover, and P-V loops coloured per sequencer cycle (current cycle
// bright, earlier ones faded) with the work per cycle.
import { AXIS, CHART_PALETTE, TIME_METRICS, XY_METRICS, cycleWork, formatValue, metricKind, metricTitle, speedSamples, timeSeries, xySeries } from './chartData.js';

const THEME = {
  surface: '#12141a', grid: '#1f232c', axis: '#2d3342',
  text: '#9ca3af', textDim: '#64748b', textMain: '#e5e7eb', tooltip: 'rgba(12, 14, 19, 0.96)'
};
const FONT = "'JetBrains Mono', monospace";

function niceStep(range, count) {
  const raw = range / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function niceTicks(min, max, count) {
  const step = niceStep(max - min, count);
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

// First index with arr[i] >= v (arr ascending).
function lowerBound(arr, v) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function paddedRange(min, max) {
  if (!Number.isFinite(min)) return [0, 1];
  if (max - min < 1e-9) {
    const d = Math.abs(min) * 0.05 || 1;
    return [min - d, max + d];
  }
  const pad = (max - min) * 0.06;
  return [min - pad, max + pad];
}

const axisTitle = (key) => {
  const a = AXIS[key];
  return a ? `${a.symbol}${a.unit ? ` [${a.unit}]` : ''}` : key;
};

export class ChartView {
  constructor(canvas, spec = {}, { large = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spec = { target: 'global', metric: 'temp', ...spec };
    this.large = large;
    this.view = { mode: 'all' }; // 'all' | { mode: 'last', span } | { mode: 'range', t0, t1 }
    this.hover = null;
    this.engine = null;
    this.cssH = parseFloat(canvas.getAttribute('height')) || 100;
    if (!large) {
      canvas.style.width = '100%';
      canvas.style.height = `${this.cssH}px`;
    }
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.render(this.engine);
    });
    canvas.addEventListener('mouseleave', () => {
      this.hover = null;
      this.render(this.engine);
    });
  }

  setSpec(spec) {
    this.spec = { ...this.spec, ...spec };
    this.render(this.engine);
  }

  title() {
    const t = this.spec.target;
    const who = t === 'global' ? 'System' : t === 'sensors' ? 'Sensors' : (t?.label || 'Sensor');
    return `${metricTitle(this.spec.metric)} · ${who}`;
  }

  _size() {
    const c = this.canvas;
    const w = c.clientWidth || parseFloat(c.getAttribute('width')) || 300;
    const h = this.large ? (c.clientHeight || 400) : this.cssH;
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (c.width !== pw || c.height !== ph) {
      c.width = pw;
      c.height = ph;
    }
    return { w, h, dpr };
  }

  render(engine) {
    if (!engine) return;
    this.engine = engine;
    if (this.canvas.isConnected && this.canvas.clientWidth === 0) return; // collapsed / hidden
    const { w, h, dpr } = this._size();
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = THEME.surface;
    ctx.fillRect(0, 0, w, h);
    const kind = metricKind(this.spec.metric);
    if (kind === 'time') this._renderTime(ctx, w, h, engine);
    else if (kind === 'xy') this._renderXY(ctx, w, h, engine);
    else this._renderHist(ctx, w, h, engine);
  }

  // -------------------------------------------------------------------------
  // Shared drawing helpers
  // -------------------------------------------------------------------------
  _layout(w, h, legend) {
    const L = this.large ? 64 : 42;
    const top = (legend ? (this.large ? 26 : 16) : 0) + (this.large ? 12 : 7);
    const bottom = this.large ? 40 : 17;
    return { x0: L, x1: w - (this.large ? 20 : 8), y0: top, y1: h - bottom };
  }

  _message(ctx, w, h, text) {
    ctx.fillStyle = THEME.textDim;
    ctx.font = `${this.large ? 13 : 10}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  }

  _axes(ctx, plot, xr, yr, xKey, yKey, xFmt) {
    const fs = this.large ? 11 : 9;
    ctx.font = `${fs}px ${FONT}`;
    ctx.lineWidth = 1;
    const yTicks = niceTicks(yr[0], yr[1], this.large ? 6 : 3);
    const sy = (v) => plot.y1 - (v - yr[0]) / (yr[1] - yr[0]) * (plot.y1 - plot.y0);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yTicks.forEach((v, i) => {
      const y = Math.round(sy(v)) + 0.5;
      ctx.strokeStyle = THEME.grid;
      ctx.beginPath(); ctx.moveTo(plot.x0, y); ctx.lineTo(plot.x1, y); ctx.stroke();
      ctx.fillStyle = THEME.text;
      const unit = !this.large && i === yTicks.length - 1 ? AXIS[yKey]?.unit : '';
      ctx.fillText(formatValue(v, unit), plot.x0 - 5, y);
    });
    const xTicks = niceTicks(xr[0], xr[1], this.large ? 8 : 4);
    const sx = (v) => plot.x0 + (v - xr[0]) / (xr[1] - xr[0]) * (plot.x1 - plot.x0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    xTicks.forEach(v => {
      const x = sx(v);
      if (x < plot.x0 - 1 || x > plot.x1 + 1) return;
      if (this.large) {
        ctx.strokeStyle = THEME.grid;
        ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, plot.y0); ctx.lineTo(Math.round(x) + 0.5, plot.y1); ctx.stroke();
      }
      ctx.fillStyle = THEME.text;
      ctx.fillText(xFmt(v), x, plot.y1 + 4);
    });
    ctx.strokeStyle = THEME.axis;
    ctx.beginPath(); ctx.moveTo(plot.x0, plot.y1 + 0.5); ctx.lineTo(plot.x1, plot.y1 + 0.5); ctx.stroke();
    if (this.large) {
      ctx.fillStyle = THEME.textDim;
      ctx.font = `11px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(axisTitle(xKey), (plot.x0 + plot.x1) / 2, plot.y1 + 22);
      ctx.save();
      ctx.translate(14, (plot.y0 + plot.y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText(axisTitle(yKey), 0, 0);
      ctx.restore();
    }
    return { sx, sy };
  }

  _legend(ctx, series, plot) {
    if (series.length < 2) return;
    ctx.font = `${this.large ? 12 : 9.5}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let x = plot.x0;
    const y = this.large ? 12 : 7;
    for (const s of series) {
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y - 1.5, 12, 3);
      ctx.fillStyle = THEME.text;
      ctx.fillText(s.name, x + 16, y);
      x += 16 + ctx.measureText(s.name).width + 14;
    }
  }

  _dot(ctx, x, y, color, r) {
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = THEME.surface;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  _tooltip(ctx, w, h, x, y, lines) {
    const fs = this.large ? 12 : 10;
    ctx.font = `${fs}px ${FONT}`;
    const lh = fs + 5;
    const width = Math.max(...lines.map(l => ctx.measureText(l.text).width + (l.color ? 14 : 0))) + 16;
    const height = lines.length * lh + 10;
    let bx = x + 12, by = Math.max(4, Math.min(h - height - 4, y - height / 2));
    if (bx + width > w - 4) bx = x - width - 12;
    ctx.fillStyle = THEME.tooltip;
    ctx.strokeStyle = THEME.axis;
    ctx.beginPath();
    ctx.roundRect(bx, by, width, height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    lines.forEach((l, i) => {
      const ly = by + 5 + lh * (i + 0.5);
      let tx = bx + 8;
      if (l.color) {
        ctx.fillStyle = l.color;
        ctx.fillRect(tx, ly - 4, 8, 8);
        tx += 14;
      }
      ctx.fillStyle = i === 0 ? THEME.textDim : THEME.textMain;
      ctx.fillText(l.text, tx, ly);
    });
  }

  // Visible time window [t0, t1] for the current view.
  _timeWindow(tMin, tMax) {
    let t0 = tMin, t1 = tMax;
    if (this.view.mode === 'last') t0 = Math.max(tMin, tMax - this.view.span);
    else if (this.view.mode === 'range') { t0 = this.view.t0; t1 = this.view.t1; }
    if (t1 - t0 < 1) t1 = t0 + 1;
    return [t0, t1];
  }

  _dataExtent(series) {
    let tMin = Infinity, tMax = -Infinity;
    for (const s of series) {
      if (s.t.length === 0) continue;
      tMin = Math.min(tMin, s.t[0]);
      tMax = Math.max(tMax, s.t[s.t.length - 1]);
    }
    return Number.isFinite(tMin) ? [tMin, tMax] : null;
  }

  // -------------------------------------------------------------------------
  // Time series
  // -------------------------------------------------------------------------
  _renderTime(ctx, w, h, engine) {
    const metric = TIME_METRICS[this.spec.metric];
    const series = timeSeries(engine, this.spec.target, this.spec.metric).filter(s => s.t.length > 0);
    const extent = this._dataExtent(series);
    if (!extent || series.every(s => s.t.length < 2)) return this._message(ctx, w, h, 'Start the simulation to record data');
    const [t0, t1] = this._timeWindow(extent[0], extent[1]);

    let yMin = Infinity, yMax = -Infinity;
    const ranges = series.map(s => {
      const a = Math.max(0, lowerBound(s.t, t0) - 1), b = Math.min(s.t.length, lowerBound(s.t, t1) + 1);
      for (let i = a; i < b; i++) { if (s.y[i] < yMin) yMin = s.y[i]; if (s.y[i] > yMax) yMax = s.y[i]; }
      return [a, b];
    });
    const plot = this._layout(w, h, series.length > 1);
    this.lastWindow = [t0, t1];
    this.lastPlot = plot;
    const yr = paddedRange(yMin, yMax);
    const { sx, sy } = this._axes(ctx, plot, [t0, t1], yr, 'time', this.spec.metric, v => `${formatValue(v)} s`);
    this._legend(ctx, series, plot);

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x0, plot.y0 - 2, plot.x1 - plot.x0, plot.y1 - plot.y0 + 4);
    ctx.clip();
    ctx.lineWidth = this.large ? 2 : 1.6;
    ctx.lineJoin = 'round';
    series.forEach((s, k) => {
      const [a, b] = ranges[k];
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      // Min/max per pixel column keeps peaks when there are more points than pixels.
      let col = null, cMin = 0, cMax = 0, started = false;
      const flush = () => {
        if (col === null) return;
        if (!started) { ctx.moveTo(col, sy(cMin)); started = true; }
        ctx.lineTo(col, sy(cMin));
        if (cMax !== cMin) ctx.lineTo(col, sy(cMax));
      };
      for (let i = a; i < b; i++) {
        const x = Math.round(sx(s.t[i]));
        if (x !== col) { flush(); col = x; cMin = cMax = s.y[i]; }
        else { cMin = Math.min(cMin, s.y[i]); cMax = Math.max(cMax, s.y[i]); }
      }
      flush();
      ctx.stroke();
    });
    ctx.restore();

    // Current value marker at the end of each series (when it's in view)
    series.forEach(s => {
      const i = s.t.length - 1;
      if (s.t[i] >= t0 && s.t[i] <= t1) this._dot(ctx, sx(s.t[i]), sy(s.y[i]), s.color, this.large ? 3.5 : 2.5);
    });

    if (this.hover && this.hover.x >= plot.x0 && this.hover.x <= plot.x1) {
      const t = t0 + (this.hover.x - plot.x0) / (plot.x1 - plot.x0) * (t1 - t0);
      ctx.strokeStyle = THEME.textDim;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(this.hover.x) + 0.5, plot.y0); ctx.lineTo(Math.round(this.hover.x) + 0.5, plot.y1); ctx.stroke();
      const lines = [{ text: `t = ${t.toFixed(2)} s` }];
      series.forEach(s => {
        let i = Math.min(s.t.length - 1, lowerBound(s.t, t));
        if (i > 0 && Math.abs(s.t[i - 1] - t) < Math.abs(s.t[i] - t)) i--;
        this._dot(ctx, sx(s.t[i]), sy(s.y[i]), s.color, this.large ? 3.5 : 2.5);
        lines.push({ color: s.color, text: `${series.length > 1 ? s.name + ': ' : ''}${formatValue(s.y[i], metric.unit)}` });
      });
      this._tooltip(ctx, w, h, this.hover.x, this.hover.y, lines);
    }
  }

  // -------------------------------------------------------------------------
  // State diagrams
  // -------------------------------------------------------------------------
  _renderXY(ctx, w, h, engine) {
    const def = XY_METRICS[this.spec.metric];
    const series = xySeries(engine, this.spec.target, this.spec.metric).filter(s => s.x.length > 1);
    if (series.length === 0) {
      return this._message(ctx, w, h, def.x === 'volume' && engine.sensors.length === 0
        ? 'Place a sensor zone to plot its P-V loop' : 'Start the simulation to record data');
    }
    const extent = this._dataExtent(series);
    const [t0, t1] = this._timeWindow(extent[0], extent[1]);
    const vis = series.map(s => [Math.max(0, lowerBound(s.t, t0)), Math.min(s.t.length, lowerBound(s.t, t1) + 1)]);
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    series.forEach((s, k) => {
      for (let i = vis[k][0]; i < vis[k][1]; i++) {
        xMin = Math.min(xMin, s.x[i]); xMax = Math.max(xMax, s.x[i]);
        yMin = Math.min(yMin, s.y[i]); yMax = Math.max(yMax, s.y[i]);
      }
    });
    const plot = this._layout(w, h, series.length > 1);
    this.lastWindow = [t0, t1];
    this.lastPlot = plot;
    const xr = paddedRange(xMin, xMax), yr = paddedRange(yMin, yMax);
    const { sx, sy } = this._axes(ctx, plot, xr, yr, def.x, def.y, v => formatValue(v));
    this._legend(ctx, series, plot);

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x0, plot.y0, plot.x1 - plot.x0, plot.y1 - plot.y0);
    ctx.clip();
    ctx.lineJoin = 'round';
    series.forEach((s, k) => {
      const [a, b] = vis[k];
      const current = s.cycle[b - 1] || 0;
      // Earlier cycles faded, the running cycle bright
      for (const pass of ['old', 'current']) {
        ctx.globalAlpha = pass === 'old' ? 0.28 : 1;
        ctx.lineWidth = pass === 'old' ? 1.2 : (this.large ? 2 : 1.6);
        ctx.strokeStyle = s.color;
        ctx.beginPath();
        let pen = false;
        for (let i = a; i < b; i++) {
          const isCurrent = (s.cycle[i] || 0) === current;
          if ((pass === 'current') !== isCurrent) { pen = false; continue; }
          const x = sx(s.x[i]), y = sy(s.y[i]);
          if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    ctx.restore();
    series.forEach((s, k) => {
      const i = vis[k][1] - 1;
      this._dot(ctx, sx(s.x[i]), sy(s.y[i]), s.color, this.large ? 4 : 3);
    });

    if (this.spec.metric === 'pv') this._workLabel(ctx, plot, series, vis);

    if (this.hover && this.hover.x >= plot.x0 && this.hover.x <= plot.x1 && this.hover.y >= plot.y0 && this.hover.y <= plot.y1) {
      let best = null;
      series.forEach((s, k) => {
        for (let i = vis[k][0]; i < vis[k][1]; i++) {
          const d = Math.hypot(sx(s.x[i]) - this.hover.x, sy(s.y[i]) - this.hover.y);
          if (!best || d < best.d) best = { d, s, i };
        }
      });
      if (best && best.d < 40) {
        const { s, i } = best;
        this._dot(ctx, sx(s.x[i]), sy(s.y[i]), s.color, this.large ? 4 : 3);
        this._tooltip(ctx, w, h, sx(s.x[i]), sy(s.y[i]), [
          { text: `t = ${s.t[i].toFixed(2)} s${s.cycle[i] ? ` · cycle ${s.cycle[i]}` : ''}` },
          { color: s.color, text: `${AXIS[def.x].symbol} = ${formatValue(s.x[i], AXIS[def.x].unit)}` },
          { color: s.color, text: `${AXIS[def.y].symbol} = ${formatValue(s.y[i], AXIS[def.y].unit)}` }
        ]);
      }
    }
  }

  // Work done by the gas per sequencer cycle (W = ∮P dV); without cycles the path integral.
  _workLabel(ctx, plot, series, vis) {
    const lines = [];
    series.forEach((s, k) => {
      const part = { t: s.t.slice(vis[k][0], vis[k][1]), x: s.x.slice(vis[k][0], vis[k][1]), y: s.y.slice(vis[k][0], vis[k][1]), cycle: s.cycle.slice(vis[k][0], vis[k][1]) };
      const cycles = cycleWork(part);
      const prefix = series.length > 1 ? `${s.name}: ` : '';
      const hasCycles = cycles.some(c => c.cycle > 0);
      if (!hasCycles) {
        const total = cycles.reduce((sum, c) => sum + c.work, 0);
        lines.push(`${prefix}W = ${formatValue(total, 'J')}`);
        return;
      }
      const done = cycles.filter(c => c.complete);
      const shown = this.large ? done.slice(-5) : done.slice(-1);
      shown.forEach(c => lines.push(`${prefix}W(cycle ${c.cycle}) = ${formatValue(c.work, 'J')}`));
      if (shown.length === 0) lines.push(`${prefix}cycle ${cycles[cycles.length - 1].cycle} running`);
    });
    if (this.large) lines.push('W > 0: work done by the gas');
    const fs = this.large ? 11.5 : 9;
    ctx.font = `${fs}px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => {
      ctx.fillStyle = i === lines.length - 1 && this.large ? THEME.textDim : THEME.textMain;
      ctx.fillText(l, plot.x1 - 4, plot.y0 + 3 + i * (fs + 4));
    });
  }

  // -------------------------------------------------------------------------
  // Velocity histogram
  // -------------------------------------------------------------------------
  _histBins(engine) {
    const speeds = speedSamples(engine, this.spec.target);
    if (!speeds.length) return null;
    const vMax = Math.max(400, ...speeds);
    const width = niceStep(vMax, this.large ? 24 : 12);
    const counts = new Array(Math.ceil(vMax / width) + 1).fill(0);
    speeds.forEach(v => { counts[Math.min(counts.length - 1, Math.floor(v / width))]++; });
    return { width, counts, total: speeds.length };
  }

  _renderHist(ctx, w, h, engine) {
    const bins = this._histBins(engine);
    if (!bins) return this._message(ctx, w, h, 'No particles');
    const plot = this._layout(w, h, false);
    const xMax = bins.counts.length * bins.width;
    const yMax = Math.max(...bins.counts);
    const { sx, sy } = this._axes(ctx, plot, [0, xMax], [0, yMax * 1.08 || 1], 'speed', 'count', v => formatValue(v));
    const barW = sx(bins.width) - sx(0);
    let hovered = -1;
    if (this.hover && this.hover.x >= plot.x0 && this.hover.x <= plot.x1) hovered = Math.floor((this.hover.x - plot.x0) / barW);
    bins.counts.forEach((c, i) => {
      if (c === 0) return;
      const x = sx(i * bins.width) + 1, y = sy(c);
      ctx.fillStyle = CHART_PALETTE[0];
      ctx.globalAlpha = hovered === -1 || hovered === i ? 1 : 0.55;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1, barW - 2), plot.y1 - y, [Math.min(4, barW / 3), Math.min(4, barW / 3), 0, 0]);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (hovered >= 0 && hovered < bins.counts.length) {
      const lo = hovered * bins.width;
      this._tooltip(ctx, w, h, this.hover.x, this.hover.y, [
        { text: `${formatValue(lo)}–${formatValue(lo + bins.width)} px/s` },
        { color: CHART_PALETTE[0], text: `${bins.counts[hovered]} of ${bins.total} particles` }
      ]);
    }
  }

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------
  toCSV(engine = this.engine) {
    const kind = metricKind(this.spec.metric);
    if (kind === 'hist') {
      const bins = this._histBins(engine);
      return ['speed_from_px_s,speed_to_px_s,count', ...(bins ? bins.counts.map((c, i) => `${i * bins.width},${(i + 1) * bins.width},${c}`) : [])].join('\n');
    }
    if (kind === 'xy') {
      const def = XY_METRICS[this.spec.metric];
      const rows = [`series,time_s,${def.x},${def.y},cycle`];
      xySeries(engine, this.spec.target, this.spec.metric).forEach(s => {
        for (let i = 0; i < s.x.length; i++) rows.push(`"${s.name}",${s.t[i]},${s.x[i]},${s.y[i]},${s.cycle[i] || 0}`);
      });
      return rows.join('\n');
    }
    const rows = [`series,time_s,${this.spec.metric},cycle`];
    timeSeries(engine, this.spec.target, this.spec.metric).forEach(s => {
      for (let i = 0; i < s.t.length; i++) rows.push(`"${s.name}",${s.t[i]},${s.y[i]},${s.cycle[i] || 0}`);
    });
    return rows.join('\n');
  }
}
