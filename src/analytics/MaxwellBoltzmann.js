import { thermalColormap } from '../render/Colormap.js';

export class MaxwellBoltzmannAnalyzer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.numBins = 24;
    this.maxSpeed = 350;
  }

  render(engine) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Clean white card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const particles = engine.particles;
    const N = particles.length;

    // Light grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let y = h - 20; y >= 10; y -= 25) {
      ctx.beginPath();
      ctx.moveTo(25, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    if (N === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Teilchen', w / 2, h / 2);
      return;
    }

    const bins = new Array(this.numBins).fill(0);
    const binWidth = this.maxSpeed / this.numBins;

    let speedSumSq = 0;

    for (let i = 0; i < N; i++) {
      const speed = particles[i].getSpeed();
      const binIdx = Math.min(this.numBins - 1, Math.floor(speed / binWidth));
      bins[binIdx]++;
      speedSumSq += speed * speed;
    }

    const vSqMean = speedSumSq / N;
    const kB_sim = 35.0;
    const effectiveT = vSqMean / (2 * kB_sim);

    const maxCount = Math.max(1, ...bins);
    const chartLeft = 25;
    const chartRight = w - 10;
    const chartBottom = h - 18;
    const chartTop = 12;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    const barW = chartWidth / this.numBins;

    // Draw Bars (Clean rounded bars like in screenshot)
    for (let i = 0; i < this.numBins; i++) {
      const count = bins[i];
      const barH = (count / maxCount) * (chartHeight * 0.85);
      const bx = chartLeft + i * barW;
      const by = chartBottom - barH;

      const normSpeed = ((i + 0.5) * binWidth) / this.maxSpeed;
      const color = thermalColormap.getColor(normSpeed);

      ctx.fillStyle = color.rgba(0.75);
      ctx.fillRect(bx + 1, by, barW - 2, barH);
    }

    // Theory Curve
    if (effectiveT > 1) {
      const sigmaSq = kB_sim * effectiveT;
      ctx.beginPath();
      ctx.strokeStyle = '#0284c7'; // Dark blue / teal
      ctx.lineWidth = 1.8;

      let first = true;
      for (let px = 0; px <= chartWidth; px += 2) {
        const v = (px / chartWidth) * this.maxSpeed;
        const theoreticalProb = (v / sigmaSq) * Math.exp(-(v * v) / (2 * sigmaSq));
        const theoreticalCount = theoreticalProb * binWidth * N;
        const py = chartBottom - (theoreticalCount / maxCount) * (chartHeight * 0.85);

        if (first) {
          ctx.moveTo(chartLeft + px, Math.max(chartTop, py));
          first = false;
        } else {
          ctx.lineTo(chartLeft + px, Math.max(chartTop, py));
        }
      }
      ctx.stroke();
    }

    // Baseline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', chartLeft + 4, chartBottom + 12);
    ctx.fillText(`${this.maxSpeed} px/s`, chartRight - 15, chartBottom + 12);
  }
}
