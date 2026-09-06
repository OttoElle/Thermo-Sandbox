import { Vector2 } from './Vector2.js';

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

    // 1. Count particles inside zone
    const insideParticles = [];
    const allParticles = engine.particles;
    for (let i = 0; i < allParticles.length; i++) {
      const p = allParticles[i];
      if (this.contains(p.pos.x, p.pos.y)) {
        insideParticles.push(p);
      }
    }
    this.currentCount = insideParticles.length;

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
      const kB = 35.0;
      const thermalSpeed = Math.sqrt((2 * kB * Math.max(5, this.temperature)) / this.mass);

      while (this.timer >= interval && this.currentCount < this.targetCount) {
        this.timer -= interval;
        const px = this.x + 6 + Math.random() * Math.max(1, this.width - 12);
        const py = this.y + 6 + Math.random() * Math.max(1, this.height - 12);
        const theta = Math.random() * Math.PI * 2;
        const vx = thermalSpeed * Math.cos(theta);
        const vy = thermalSpeed * Math.sin(theta);
        engine.addParticle(px, py, vx, vy, this.mass);
        this.currentCount++;
      }
      if (this.currentCount >= this.targetCount) {
        this.regulationState = 'idle';
        this.timer = 0;
      }
    } else if (this.regulationState === 'absorbing') {
      this.timer += dt;
      const interval = 1.0 / Math.max(1, this.rate);

      while (this.timer >= interval && this.currentCount > this.targetCount && insideParticles.length > 0) {
        this.timer -= interval;
        const pToRemove = insideParticles.pop();
        engine.deleteParticles([pToRemove]);
        this.currentCount--;
      }
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
