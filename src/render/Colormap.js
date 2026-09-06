export class Colormap {
  constructor() {
    // Exact Blue -> Violet -> Magenta -> Red gradient matching user screenshot
    this.stops = [
      { t: 0.00, r: 59,  g: 130, b: 246 }, // Vibrant Blue (#3b82f6)
      { t: 0.35, r: 124, g: 58,  b: 237 }, // Deep Violet (#7c3aed)
      { t: 0.65, r: 192, g: 38,  b: 211 }, // Magenta/Purple (#c026d3)
      { t: 1.00, r: 239, g: 68,  b: 68 }  // Warm Red (#ef4444)
    ];

    this.lutSize = 256;
    this.lut = new Array(this.lutSize);
    this._generateLUT();
  }

  _generateLUT() {
    for (let i = 0; i < this.lutSize; i++) {
      const t = i / (this.lutSize - 1);
      this.lut[i] = this._sampleGradient(t);
    }
  }

  _sampleGradient(t) {
    t = Math.max(0, Math.min(1, t));
    let s0 = this.stops[0];
    let s1 = this.stops[this.stops.length - 1];

    for (let i = 0; i < this.stops.length - 1; i++) {
      if (t >= this.stops[i].t && t <= this.stops[i + 1].t) {
        s0 = this.stops[i];
        s1 = this.stops[i + 1];
        break;
      }
    }

    const range = s1.t - s0.t || 1;
    const factor = (t - s0.t) / range;

    const r = Math.round(s0.r + factor * (s1.r - s0.r));
    const g = Math.round(s0.g + factor * (s1.g - s0.g));
    const b = Math.round(s0.b + factor * (s1.b - s0.b));

    return {
      r, g, b,
      rgb: `rgb(${r}, ${g}, ${b})`
    };
  }

  getColor(normalizedValue) {
    const idx = Math.max(0, Math.min(this.lutSize - 1, Math.floor(normalizedValue * (this.lutSize - 1))));
    return this.lut[idx];
  }
}

export const thermalColormap = new Colormap();
