import { Vector2 } from './Vector2.js';

export class SensorZone {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.label = options.label || 'Kammer';
    this.x = options.x !== undefined ? options.x : 100;
    this.y = options.y !== undefined ? options.y : 100;
    this.width = options.width !== undefined ? options.width : 200;
    this.height = options.height !== undefined ? options.height : 300;
    this.color = options.color || '#38bdf8';

    // Measurements
    this.particleCount = 0;
    this.temperature = 300;
    this.pressure = 100; // in Pa
    this.density = 0;
    this.volume = this.width * this.height;
    this.kineticEnergy = 0;

    // Drift Velocity Metrics
    this.driftVx = 0;
    this.driftVy = 0;
    this.driftSpeed = 0;
    this.displayDriftSpeed = 0;
    this.driftAngle = 0;

    // Continuous Time History for Line Charts
    this.historyTime = [];
    this.historyTemp = [];
    this.historyPressure = [];
    this.historyVolume = [];
    this.historyCount = [];
    this.historyKineticEnergy = [];
    this.historyDrift = [];

    // Piston Binding for Dynamic Chamber Expansion / Compression
    if (options.pistonBinding) {
      this.pistonBinding = {
        pistonId: options.pistonBinding.pistonId || null,
        edge: options.pistonBinding.edge || 'right',
        lockCrossDimension: options.pistonBinding.lockCrossDimension !== false,
        fixedOpposite: options.pistonBinding.fixedOpposite !== undefined ? options.pistonBinding.fixedOpposite : null
      };
    } else {
      this.pistonBinding = null;
    }
  }

  contains(pos) {
    return (
      pos.x >= this.x &&
      pos.x <= this.x + this.width &&
      pos.y >= this.y &&
      pos.y <= this.y + this.height
    );
  }

  getArea() {
    return this.width * this.height;
  }

  updateMeasurements(particles, currentTime = 0) {
    let sampleCount = 0, sumVx = 0, sumVy = 0, sumMVx = 0, sumMVy = 0, sumMass = 0, sampleKinetic = 0;
    const speedSamples = [];
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (this.contains(p.pos)) {
        sampleCount++;
        sumVx += p.vel.x; sumVy += p.vel.y;
        sumMVx += p.mass * p.vel.x; sumMVy += p.mass * p.vel.y;
        sumMass += p.mass;
        const spdSq = p.getSpeedSq();
        sampleKinetic += 0.5 * p.mass * spdSq;
        if (speedSamples.length < 500) speedSamples.push(Math.sqrt(spdSq));
      }
    }
    this._processMetrics(sampleCount, sumVx, sumVy, sumMVx, sumMVy, sumMass, sampleKinetic, 1.0, currentTime, speedSamples);
  }

  updateMeasurementsFromGPU(floats, count, scaleFactor = 1.0, currentTime = 0) {
    let sampleCount = 0, sumVx = 0, sumVy = 0, sumMVx = 0, sumMVy = 0, sumMass = 0, sampleKinetic = 0;
    const speedSamples = [];
    const minX = this.x, maxX = this.x + this.width;
    const minY = this.y, maxY = this.y + this.height;

    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const px = floats[ptr], py = floats[ptr + 1];
      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        sampleCount++;
        const vx = floats[ptr + 2], vy = floats[ptr + 3], m = floats[ptr + 5];
        sumVx += vx; sumVy += vy;
        sumMVx += m * vx; sumMVy += m * vy;
        sumMass += m;
        const spdSq = vx * vx + vy * vy;
        sampleKinetic += 0.5 * m * spdSq;
        if (speedSamples.length < 500) speedSamples.push(Math.sqrt(spdSq));
      }
      ptr += 8;
    }
    this._processMetrics(sampleCount, sumVx, sumVy, sumMVx, sumMVy, sumMass, sampleKinetic, scaleFactor, currentTime, speedSamples);
  }

  _processMetrics(sampleCount, sumVx, sumVy, sumMVx, sumMVy, sumMass, sampleKinetic, scaleFactor = 1.0, currentTime = 0, speedSamples = []) {
    const effectiveCount = Math.round(sampleCount * scaleFactor);
    this.particleCount = effectiveCount;
    const area = this.getArea();
    this.volume = area;
    this.density = area > 0 ? (effectiveCount / area) * 1000 : 0;
    this.kineticEnergy = sampleKinetic * scaleFactor;
    this.speedSamples = speedSamples;

    if (sampleCount > 0) {
      const rawMeanVx = sumVx / sampleCount;
      const rawMeanVy = sumVy / sampleCount;

      this.driftVx = this.driftVx * 0.90 + rawMeanVx * 0.10;
      this.driftVy = this.driftVy * 0.90 + rawMeanVy * 0.10;
      this.driftSpeed = Math.hypot(this.driftVx, this.driftVy);
      this.driftAngle = Math.atan2(this.driftVy, this.driftVx);

      const sumThermal = Math.max(0, sampleKinetic - (rawMeanVx * sumMVx + rawMeanVy * sumMVy) + 0.5 * (rawMeanVx * rawMeanVx + rawMeanVy * rawMeanVy) * sumMass);
      const kB = 35.0;
      this.temperature = Math.max(5, sumThermal / (sampleCount * kB));
      this.pressure = ((effectiveCount / (area || 1)) * kB * this.temperature * 100);

      const vThermal = Math.sqrt((2 * kB * this.temperature) / 1.0);
      const fluctuationThreshold = Math.max(12.0, (vThermal / Math.sqrt(Math.max(1, effectiveCount))) * 0.7);

      if (this.driftSpeed > fluctuationThreshold && this.driftSpeed > 15.0) {
        this.displayDriftSpeed = this.driftSpeed;
      } else {
        this.displayDriftSpeed = 0;
      }
    } else {
      this.driftVx *= 0.85;
      this.driftVy *= 0.85;
      this.driftSpeed = 0;
      this.displayDriftSpeed = 0;
    }

    if (this.historyTime.length === 0 || currentTime - this.historyTime[this.historyTime.length - 1] >= 0.045) {
      this.historyTime.push(currentTime);
      this.historyTemp.push(this.temperature);
      this.historyPressure.push(this.pressure);
      this.historyVolume.push(this.volume);
      this.historyCount.push(this.particleCount);
      this.historyKineticEnergy.push(this.kineticEnergy);
      this.historyDrift.push(this.displayDriftSpeed);

      if (this.historyTime.length > 600) {
        this.historyTime.shift();
        this.historyTemp.shift();
        this.historyPressure.shift();
        this.historyVolume.shift();
        this.historyCount.shift();
        this.historyKineticEnergy.shift();
        this.historyDrift.shift();
      }
    }
  }

  clearHistory() {
    this.historyTime = [];
    this.historyTemp = [];
    this.historyPressure = [];
    this.historyVolume = [];
    this.historyCount = [];
    this.historyKineticEnergy = [];
    this.historyDrift = [];
    this.driftVx = 0;
    this.driftVy = 0;
    this.driftSpeed = 0;
    this.displayDriftSpeed = 0;
  }

  bindToPiston(piston, edge = 'right', lockCrossDimension = true) {
    if (!piston) {
      this.unbindPiston();
      return;
    }
    let fixedOpposite = null;
    if (edge === 'right') {
      fixedOpposite = this.x;
    } else if (edge === 'left') {
      fixedOpposite = this.x + this.width;
    } else if (edge === 'bottom') {
      fixedOpposite = this.y;
    } else if (edge === 'top') {
      fixedOpposite = this.y + this.height;
    }

    this.pistonBinding = {
      pistonId: piston.id,
      edge,
      lockCrossDimension,
      fixedOpposite
    };
    this.updateBoundsFromPiston(piston);
  }

  unbindPiston() {
    this.pistonBinding = null;
  }

  updateBoundsFromPiston(piston) {
    if (!this.pistonBinding || !this.pistonBinding.pistonId || !piston) return;
    const pb = this.pistonBinding;
    const pBounds = piston.getBounds();

    if (piston.orientation === 'horizontal') {
      if (pb.edge === 'right') {
        // Chamber is to the left of piston; its right edge matches the piston's left face
        const targetRight = pBounds.left;
        this.width = Math.max(15, targetRight - this.x);
      } else if (pb.edge === 'left') {
        // Chamber is to the right of piston; its left edge matches the piston's right face
        const fixedRight = (pb.fixedOpposite !== null && pb.fixedOpposite !== undefined) ? pb.fixedOpposite : (this.x + this.width);
        const targetLeft = pBounds.right;
        this.x = targetLeft;
        this.width = Math.max(15, fixedRight - targetLeft);
      }
      if (pb.lockCrossDimension !== false) {
        this.y = pBounds.top;
        this.height = piston.height;
      }
    } else { // vertical orientation
      if (pb.edge === 'bottom') {
        // Chamber is above piston; its bottom edge matches the piston's top face
        const targetBottom = pBounds.top;
        this.height = Math.max(15, targetBottom - this.y);
      } else if (pb.edge === 'top') {
        // Chamber is below piston; its top edge matches the piston's bottom face
        const fixedBottom = (pb.fixedOpposite !== null && pb.fixedOpposite !== undefined) ? pb.fixedOpposite : (this.y + this.height);
        const targetTop = pBounds.bottom;
        this.y = targetTop;
        this.height = Math.max(15, fixedBottom - targetTop);
      }
      if (pb.lockCrossDimension !== false) {
        this.x = pBounds.left;
        this.width = piston.width;
      }
    }

    this.volume = this.width * this.height;
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: this.color,
      pistonBinding: this.pistonBinding ? { ...this.pistonBinding } : null
    };
  }

  static fromJSON(data) {
    return new SensorZone(data);
  }
}
