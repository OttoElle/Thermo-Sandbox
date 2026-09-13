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
    let count = 0;
    let sumVx = 0;
    let sumVy = 0;
    let sumMVx = 0;
    let sumMVy = 0;
    let sumMass = 0;
    let totalKinetic = 0;
    let sumThermalEnergy = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (this.contains(p.pos)) {
        count++;
        sumVx += p.vel.x;
        sumVy += p.vel.y;
        sumMVx += p.mass * p.vel.x;
        sumMVy += p.mass * p.vel.y;
        sumMass += p.mass;
        totalKinetic += 0.5 * p.mass * p.getSpeedSq();
      }
    }

    this.particleCount = count;
    const area = this.getArea();
    this.volume = area;
    this.density = area > 0 ? (count / area) * 1000 : 0;
    this.kineticEnergy = totalKinetic;

    if (count > 0) {
      const rawMeanVx = sumVx / count;
      const rawMeanVy = sumVy / count;

      // Heavy low-pass exponential smoothing for macroscopic drift velocity (tau ~ 1.5s)
      this.driftVx = this.driftVx * 0.90 + rawMeanVx * 0.10;
      this.driftVy = this.driftVy * 0.90 + rawMeanVy * 0.10;
      this.driftSpeed = Math.sqrt(this.driftVx * this.driftVx + this.driftVy * this.driftVy);
      this.driftAngle = Math.atan2(this.driftVy, this.driftVx);

      // Single-pass thermal energy (Verschiebungssatz: sum 0.5*m*(v - v_mean)^2)
      sumThermalEnergy = Math.max(0, totalKinetic - (rawMeanVx * sumMVx + rawMeanVy * sumMVy) + 0.5 * (rawMeanVx * rawMeanVx + rawMeanVy * rawMeanVy) * sumMass);

      const kB = 35.0;
      this.temperature = Math.max(5, sumThermalEnergy / (count * kB));
      this.pressure = ((count / (area || 1)) * kB * this.temperature * 100);

      // Distinguish genuine bulk flow (trend) from random Brownian / thermal fluctuations:
      // Thermal speed v_th ~ sqrt(2 * kB * T / m)
      const vThermal = Math.sqrt((2 * kB * this.temperature) / 1.0);
      const fluctuationThreshold = Math.max(12.0, (vThermal / Math.sqrt(count)) * 0.7);

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

    // Record continuous time history (sampled every ~0.05s)
    if (this.historyTime.length === 0 || currentTime - this.historyTime[this.historyTime.length - 1] >= 0.045) {
      this.historyTime.push(currentTime);
      this.historyTemp.push(this.temperature);
      this.historyPressure.push(this.pressure);
      this.historyVolume.push(this.volume);
      this.historyCount.push(this.particleCount);
      this.historyKineticEnergy.push(this.kineticEnergy);
      this.historyDrift.push(this.displayDriftSpeed);

      // Keep up to 600 points (~30 seconds of high-resolution continuous trace)
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

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: this.color
    };
  }

  static fromJSON(data) {
    return new SensorZone(data);
  }
}
