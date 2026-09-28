import { Vector2 } from './Vector2.js';
import { KB } from './Constants.js';

export class Regulator {
  constructor(x, y, width = 80, height = 80, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.targetCount = options.targetCount !== undefined ? options.targetCount : 50;
    this.hysteresis = options.hysteresis !== undefined ? options.hysteresis : 3;
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.mass = options.mass !== undefined ? options.mass : 1.0;
    this.rate = options.rate !== undefined ? options.rate : 15; // max adjustment particles per second
    this.isActive = options.isActive !== undefined ? options.isActive : true;

    this.currentCount = 0;
    this.regulationState = 'idle'; // 'idle', 'emitting', or 'absorbing'
    this.timer = 0;
    this.initialActive = this.isActive;

    // GPU mode: last zone population measured on the GPU plus the net change
    // this regulator requested since (emitted minus requested removals).
    this.gpuCount = 0;
    this.gpuDelta = 0;
  }

  resetGPUCount(count) {
    this.gpuCount = count;
    this.gpuDelta = 0;
  }

  // `deltaAtSubmit` is gpuDelta at the time the readback was submitted; those
  // changes are already reflected in `count`.
  applyGPUCount(count, deltaAtSubmit = 0) {
    this.gpuCount = count;
    this.gpuDelta -= deltaAtSubmit;
  }

  toggle() {
    this.isActive = !this.isActive;
    if (!this.isActive) {
      this.regulationState = 'idle';
      this.timer = 0;
    }
    return this.isActive;
  }

  saveSnapshot() {
    this.initialActive = this.isActive;
  }

  restoreSnapshot() {
    this.isActive = this.initialActive;
    this.regulationState = 'idle';
    this.timer = 0;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  update(dt, engine) {
    if (dt <= 0) return;

    // 1. Count particles inside zone (GPU mode: last GPU measurement + own pending changes)
    const gpuMode = engine.isGPUSimulating();
    const insideParticles = [];
    if (gpuMode) {
      this.currentCount = Math.max(0, this.gpuCount + this.gpuDelta);
    } else {
      const allParticles = engine.particles;
      for (let i = 0; i < allParticles.length; i++) {
        const p = allParticles[i];
        if (this.contains(p.pos.x, p.pos.y)) {
          insideParticles.push(p);
        }
      }
      this.currentCount = insideParticles.length;
    }

    if (!this.isActive) {
      this.regulationState = 'idle';
      this.timer = 0;
      return;
    }

    const lowerBound = this.targetCount - this.hysteresis;
    const upperBound = this.targetCount + this.hysteresis;

    // 2. State transitions with deadband hysteresis
    if (this.currentCount < lowerBound) {
      this.regulationState = 'emitting';
    } else if (this.currentCount > upperBound) {
      this.regulationState = 'absorbing';
    } else if (
      (this.regulationState === 'emitting' && this.currentCount >= this.targetCount) ||
      (this.regulationState === 'absorbing' && this.currentCount <= this.targetCount)
    ) {
      this.regulationState = 'idle';
      this.timer = 0;
    }

    // 3. Execution of active regulation
    if (this.regulationState === 'emitting') {
      this.timer += dt;
      const interval = 1.0 / Math.max(1, this.rate);
      const thermalSpeed = Math.sqrt((2 * KB * Math.max(5, this.temperature)) / this.mass);

      while (this.timer >= interval && this.currentCount < this.targetCount) {
        this.timer -= interval;
        const px = this.x + 6 + Math.random() * Math.max(1, this.width - 12);
        const py = this.y + 6 + Math.random() * Math.max(1, this.height - 12);
        const theta = Math.random() * Math.PI * 2;
        const vx = thermalSpeed * Math.cos(theta);
        const vy = thermalSpeed * Math.sin(theta);
        engine.addParticle(px, py, vx, vy, this.mass);
        this.currentCount++;
        if (gpuMode) this.gpuDelta++;
      }
      if (this.currentCount >= this.targetCount) {
        this.regulationState = 'idle';
        this.timer = 0;
      }
    } else if (this.regulationState === 'absorbing') {
      this.timer += dt;
      const interval = 1.0 / Math.max(1, this.rate);
      const toRemove = [];
      let gpuRemovals = 0;

      while (this.timer >= interval && this.currentCount > this.targetCount && (gpuMode || insideParticles.length > 0)) {
        this.timer -= interval;
        if (gpuMode) {
          gpuRemovals++;
          this.gpuDelta--;
        } else {
          toRemove.push(insideParticles.pop());
        }
        this.currentCount--;
      }
      if (gpuRemovals > 0) engine.requestGPURegulatorRemoval(this, gpuRemovals);
      if (toRemove.length > 0) engine.deleteParticles(toRemove);
      if (this.currentCount <= this.targetCount) {
        this.regulationState = 'idle';
        this.timer = 0;
      }
    } else {
      this.timer = 0;
    }
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      targetCount: this.targetCount,
      hysteresis: this.hysteresis,
      temperature: this.temperature,
      mass: this.mass,
      rate: this.rate,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Regulator(data.x, data.y, data.width, data.height, {
      id: data.id,
      targetCount: data.targetCount,
      hysteresis: data.hysteresis,
      temperature: data.temperature,
      mass: data.mass,
      rate: data.rate,
      isActive: data.isActive
    });
  }
}
