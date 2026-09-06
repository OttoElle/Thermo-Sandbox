import { Vector2 } from './Vector2.js';

export class ThrottleValve {
  constructor(x1, y1, x2, y2, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.p1 = new Vector2(x1, y1);
    this.p2 = new Vector2(x2, y2);
    this.thickness = options.thickness !== undefined ? options.thickness : 6;
    this.openRatio = options.openRatio !== undefined ? Math.max(0, Math.min(1, options.openRatio)) : 0.3; // 0.0 to 1.0
    
    // Thermal properties
    this.conductivity = options.conductivity !== undefined ? options.conductivity : 0.0;
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.heatCapacity = options.heatCapacity !== undefined ? options.heatCapacity : 80;
    this.heatAccumulator = 0;

    // Pressure tracking
    this.accumulatedImpulseSide1 = 0;
    this.accumulatedImpulseSide2 = 0;
    this.smoothedP1 = 0;
    this.smoothedP2 = 0;
    this.deltaP = 0;

    // Active state
    this.isActive = options.isActive !== undefined ? options.isActive : true;

    // Initial snapshot
    this.initialOpenRatio = this.openRatio;
    this.initialP1 = this.p1.clone();
    this.initialP2 = this.p2.clone();
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;

    this._updateGeometry();
  }

  _updateGeometry() {
    this.dir = new Vector2(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    this.length = this.dir.length();
    this.unitDir = this.length > 0 ? this.dir.clone().normalize() : new Vector2(1, 0);
    this.normal = new Vector2(-this.unitDir.y, this.unitDir.x);
    this.midPoint = new Vector2((this.p1.x + this.p2.x) * 0.5, (this.p1.y + this.p2.y) * 0.5);

    // Calculate wings and gap
    const solidFraction = Math.max(0, 1.0 - this.openRatio);
    this.wingLength = (this.length * solidFraction) * 0.5;
    this.gapWidth = this.length * this.openRatio;

    // Wing 1: p1 to wing1End
    this.wing1End = new Vector2(
      this.p1.x + this.unitDir.x * this.wingLength,
      this.p1.y + this.unitDir.y * this.wingLength
    );

    // Wing 2: wing2Start to p2
    this.wing2Start = new Vector2(
      this.p2.x - this.unitDir.x * this.wingLength,
      this.p2.y - this.unitDir.y * this.wingLength
    );
  }

  setPoints(x1, y1, x2, y2) {
    this.p1.set(x1, y1);
    this.p2.set(x2, y2);
    this._updateGeometry();
  }

  setOpenRatio(ratio) {
    this.openRatio = Math.max(0, Math.min(1.0, ratio));
    this._updateGeometry();
  }

  toggle() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  addHeat(joules) {
    if (this.isActive) {
      this.heatAccumulator += joules;
    }
  }

  saveSnapshot() {
    this.initialOpenRatio = this.openRatio;
    this.initialP1 = this.p1.clone();
    this.initialP2 = this.p2.clone();
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.openRatio = this.initialOpenRatio;
    this.p1.copy(this.initialP1);
    this.p2.copy(this.initialP2);
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
    this.accumulatedImpulseSide1 = 0;
    this.accumulatedImpulseSide2 = 0;
    this.deltaP = 0;
    this._updateGeometry();
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0 && this.isActive) {
      this.temperature += this.heatAccumulator / this.heatCapacity;
      this.heatAccumulator = 0;
      if (this.temperature < 5) this.temperature = 5;
    }

    if (dt > 0 && this.length > 0) {
      const p1Inst = this.accumulatedImpulseSide1 / (this.length * dt);
      const p2Inst = this.accumulatedImpulseSide2 / (this.length * dt);
      this.smoothedP1 = this.smoothedP1 * 0.85 + p1Inst * 0.15;
      this.smoothedP2 = this.smoothedP2 * 0.85 + p2Inst * 0.15;
      this.deltaP = Math.abs(this.smoothedP1 - this.smoothedP2);
      this.accumulatedImpulseSide1 = 0;
      this.accumulatedImpulseSide2 = 0;
    }
  }

  _closestPointOnSegment(p, a, b) {
    const ab = new Vector2(b.x - a.x, b.y - a.y);
    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    if (abLenSq === 0) return a.clone();
    const ap = new Vector2(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ap.dot(ab) / abLenSq));
    return new Vector2(a.x + t * ab.x, a.y + t * ab.y);
  }

  resolveParticleCollision(p, dt) {
    if (!this.isActive || this.openRatio >= 0.999) return;

    // Check collision against Wing 1
    if (this.wingLength > 0.5) {
      this._resolveWingCollision(p, this.p1, this.wing1End);
    }
    // Check collision against Wing 2
    if (this.wingLength > 0.5) {
      this._resolveWingCollision(p, this.wing2Start, this.p2);
    }
  }

  _resolveWingCollision(p, a, b) {
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const abLenSq = abX * abX + abY * abY;
    let closestX = a.x;
    let closestY = a.y;
    if (abLenSq > 0.00001) {
      const apX = p.pos.x - a.x;
      const apY = p.pos.y - a.y;
      const t = Math.max(0, Math.min(1, (apX * abX + apY * abY) / abLenSq));
      closestX = a.x + t * abX;
      closestY = a.y + t * abY;
    }
    const dx = p.pos.x - closestX;
    const dy = p.pos.y - closestY;
    const distSq = dx * dx + dy * dy;
    const effRad = p.radius + this.thickness * 0.5;

    if (distSq < effRad * effRad) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const ny = dy / dist;

      // Push particle out
      const pen = effRad - dist;
      p.pos.x += nx * pen;
      p.pos.y += ny * pen;

      const velAlongNormal = p.vel.x * nx + p.vel.y * ny;
      if (velAlongNormal < 0) {
        let newVx = p.vel.x - 2 * velAlongNormal * nx;
        let newVy = p.vel.y - 2 * velAlongNormal * ny;

        if (this.conductivity > 0) {
          const kB = 35.0;
          const targetSpeedSq = (2 * kB * this.temperature) / p.mass;
          const curSpeedSq = newVx * newVx + newVy * newVy;
          const alpha = this.conductivity * 0.8;
          const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
          const factor = curSpeedSq > 0.001 ? Math.sqrt(blendSq / curSpeedSq) : 1;

          const eBefore = 0.5 * p.mass * curSpeedSq;
          newVx *= factor;
          newVy *= factor;
          const eAfter = 0.5 * p.mass * (newVx * newVx + newVy * newVy);
          this.addHeat(-(eAfter - eBefore));
        }

        p.vel.x = newVx;
        p.vel.y = newVy;

        const imp = 2 * p.mass * Math.abs(velAlongNormal);
        // Distinguish side 1 vs side 2 by dot product with wall normal
        if (nx * this.normal.x + ny * this.normal.y > 0) {
          this.accumulatedImpulseSide1 += imp;
        } else {
          this.accumulatedImpulseSide2 += imp;
        }
      }
    }
  }

  toJSON() {
    return {
      id: this.id,
      p1: { x: this.p1.x, y: this.p1.y },
      p2: { x: this.p2.x, y: this.p2.y },
      thickness: this.thickness,
      openRatio: this.openRatio,
      conductivity: this.conductivity,
      temperature: this.temperature,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new ThrottleValve(data.p1.x, data.p1.y, data.p2.x, data.p2.y, {
      id: data.id,
      thickness: data.thickness,
      openRatio: data.openRatio,
      conductivity: data.conductivity,
      temperature: data.temperature,
      isActive: data.isActive
    });
  }
}
