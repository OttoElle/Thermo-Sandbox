import { Vector2 } from './Vector2.js';

export class RegeneratorMatrix {
  constructor(x, y, width = 120, height = 70, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.orientation = options.orientation || (this.width >= this.height ? 'horizontal' : 'vertical');
    this.sliceCount = options.sliceCount || 10;
    this.heatCapacity = options.heatCapacity !== undefined ? Math.max(10, options.heatCapacity) : 400; // Total Joules/K
    this.conductivity = options.conductivity !== undefined ? Math.max(0.01, Math.min(1.0, options.conductivity)) : 0.7; // Gas-matrix exchange rate
    this.axialConductivity = options.axialConductivity !== undefined ? options.axialConductivity : 0.05; // Thermal leak along matrix
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.label = options.label || 'Regenerator Matrix';

    const baseT = options.temperature !== undefined ? Math.max(5, options.temperature) : 300;
    if (Array.isArray(options.temperatures) && options.temperatures.length === this.sliceCount) {
      this.temperatures = options.temperatures.map(t => Math.max(5, t));
    } else {
      this.temperatures = new Array(this.sliceCount).fill(baseT);
    }

    this.heatAccumulators = new Array(this.sliceCount).fill(0);
    this.initialTemperatures = [...this.temperatures];
    this.initialIsActive = this.isActive;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }

  getSliceIndex(px, py) {
    if (!this.contains(px, py)) return -1;
    if (this.orientation === 'horizontal') {
      // Horizontal bands parallel to horizontal flow lines
      const frac = Math.max(0, Math.min(0.9999, (py - this.y) / this.height));
      return Math.floor(frac * this.sliceCount);
    } else {
      // Vertical bands parallel to vertical flow lines
      const frac = Math.max(0, Math.min(0.9999, (px - this.x) / this.width));
      return Math.floor(frac * this.sliceCount);
    }
  }

  getAverageTemperature() {
    if (this.temperatures.length === 0) return 300;
    const sum = this.temperatures.reduce((a, b) => a + b, 0);
    return sum / this.temperatures.length;
  }

  addHeatToSlice(idx, joules) {
    if (idx >= 0 && idx < this.sliceCount) {
      this.heatAccumulators[idx] += joules;
    }
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  update(dt) {
    if (dt <= 0 || !this.isActive) return;

    const sliceCapacity = Math.max(1, this.heatCapacity / this.sliceCount);

    // 1. Apply particle heat exchanges
    for (let i = 0; i < this.sliceCount; i++) {
      if (this.heatAccumulators[i] !== 0) {
        this.temperatures[i] += this.heatAccumulators[i] / sliceCapacity;
        this.heatAccumulators[i] = 0;
        if (this.temperatures[i] < 5) this.temperatures[i] = 5;
      }
    }

    // 2. Slow axial thermal diffusion between adjacent slices
    if (this.axialConductivity > 0 && this.sliceCount > 1) {
      const diffRate = this.axialConductivity * 8.0 * dt;
      const nextTemps = [...this.temperatures];
      for (let i = 0; i < this.sliceCount - 1; i++) {
        const flux = (this.temperatures[i + 1] - this.temperatures[i]) * diffRate;
        nextTemps[i] += flux;
        nextTemps[i + 1] -= flux;
      }
      for (let i = 0; i < this.sliceCount; i++) {
        this.temperatures[i] = Math.max(5, nextTemps[i]);
      }
    }
  }

  saveSnapshot() {
    this.initialTemperatures = [...this.temperatures];
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperatures = [...this.initialTemperatures];
    this.heatAccumulators.fill(0);
    this.isActive = this.initialIsActive;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      orientation: this.orientation,
      sliceCount: this.sliceCount,
      heatCapacity: this.heatCapacity,
      conductivity: this.conductivity,
      axialConductivity: this.axialConductivity,
      isActive: this.isActive,
      label: this.label,
      temperatures: [...this.temperatures]
    };
  }

  static fromJSON(data) {
    return new RegeneratorMatrix(data.x, data.y, data.width, data.height, data);
  }
}
