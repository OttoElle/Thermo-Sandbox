export class VelHistChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.binRanges = [
      { label: '0-100', min: 0, max: 100 },
      { label: '100-200', min: 100, max: 200 },
      { label: '200-300', min: 200, max: 300 },
      { label: '300-400', min: 300, max: 400 },
      { label: '400-500', min: 400, max: 500 },
      { label: '500-600', min: 500, max: 9999 }
    ];
  }

  render(engine, target = 'global') {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#181a1f';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 24;
    const padRight = 10;
    const padTop = 10;
    const padBottom = 20;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Grid lines
    ctx.strokeStyle = '#22262e';
    ctx.lineWidth = 1;
    for (let y = padBottom; y <= h - padTop; y += 22) {
      ctx.beginPath();
      ctx.moveTo(padLeft, h - y);
      ctx.lineTo(w - padRight, h - y);
      ctx.stroke();
    }

    let speeds = null;
    if (target && target !== 'global' && target.speedSamples && target.speedSamples.length > 0) {
      speeds = target.speedSamples;
    } else if (engine.latestSpeedSamples && engine.latestSpeedSamples.length > 0) {
      speeds = engine.latestSpeedSamples;
    } else if (engine.particles && engine.particles.length > 0) {
      speeds = [];
      const pts = engine.particles;
      const step = pts.length > 1000 ? Math.max(1, Math.floor(pts.length / 1000)) : 1;
      for (let i = 0; i < pts.length; i += step) {
        const p = pts[i];
        if (p) speeds.push(typeof p.getSpeed === 'function' ? p.getSpeed() : Math.hypot(p.vel ? p.vel.x : 0, p.vel ? p.vel.y : 0));
      }
    }

    if (!speeds || speeds.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Teilchen', w / 2, h / 2);
      return;
    }

    const counts = new Array(this.binRanges.length).fill(0);
    const N = speeds.length;
    for (let i = 0; i < N; i++) {
      const spd = speeds[i];
      for (let b = 0; b < this.binRanges.length; b++) {
        if (spd >= this.binRanges[b].min && spd < this.binRanges[b].max) {
          counts[b]++;
          break;
        }
      }
    }

    const maxCount = Math.max(1, ...counts);
    const barW = chartW / this.binRanges.length;

    // Draw green bars matching screenshot
    for (let b = 0; b < this.binRanges.length; b++) {
      const c = counts[b];
      const barH = (c / maxCount) * chartH;
      const bx = padLeft + b * barW;
      const by = h - padBottom - barH;

      ctx.fillStyle = '#22c55e'; // Crisp vibrant green
      ctx.fillRect(bx + 2, by, barW - 4, barH);
    }

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.lineTo(w - padRight, h - padBottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxCount}`, padLeft - 3, padTop + 8);
    ctx.fillText('0', padLeft - 3, h - padBottom);

    ctx.textAlign = 'center';
    for (let b = 0; b < this.binRanges.length; b++) {
      const bx = padLeft + b * barW + barW * 0.5;
      ctx.fillText(this.binRanges[b].label, bx, h - 6);
    }
  }
}
