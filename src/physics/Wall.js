import { Vector2 } from './Vector2.js';

export class Wall {
  constructor(x1, y1, x2, y2, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.p1 = new Vector2(x1, y1);
    this.p2 = new Vector2(x2, y2);
    
    // Type: 'standard', 'manual_valve', 'check_valve', 'relief_valve'
    this.type = options.type || 'standard';

    // Thermal property: Wärmeleitfähigkeit kappa in [0, 1]
    this.conductivity = options.conductivity !== undefined ? options.conductivity : 0.0; // 0 = vollständig isolierend
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.heatCapacity = options.heatCapacity !== undefined ? options.heatCapacity : 80;
    this.heatAccumulator = 0;

    // Valve properties
    this.isOpen = options.isOpen !== undefined ? options.isOpen : false;
    this.allowedDirection = options.allowedDirection !== undefined ? options.allowedDirection : 1; // 1 = along normal, -1 = opposite
    this.triggerPressure = options.triggerPressure !== undefined ? options.triggerPressure : 250; // Threshold Pa for relief_valve
    this.reliefMode = options.reliefMode || 'oneway'; // 'oneway' or 'bidirectional'

    this.thickness = options.thickness || 4;

    // Pressure tracking
    this.accumulatedImpulse = 0;
    this.currentPressure = 0;
    this.smoothedPressure = 0;

    // Initial snapshot state
    this.initialTemperature = this.temperature;
    this.initialIsOpen = this.isOpen;
    if (options.groupId) this.groupId = options.groupId;

    this._updateGeometry();
  }

  _updateGeometry() {
    this.dir = new Vector2(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    this.length = this.dir.length();
    this.lenSq = this.length * this.length;
    this.unitDir = this.length > 0 ? this.dir.clone().normalize() : new Vector2(1, 0);
    this.normal = new Vector2(-this.unitDir.y, this.unitDir.x);
  }

  setPoints(x1, y1, x2, y2) {
    this.p1.set(x1, y1);
    this.p2.set(x2, y2);
    this._updateGeometry();
  }

  getClosestPointCoords(px, py, out) {
    if (this.lenSq <= 0.00001) {
      out.x = this.p1.x;
      out.y = this.p1.y;
      return out;
    }
    const vx = px - this.p1.x;
    const vy = py - this.p1.y;
    const t = Math.max(0, Math.min(1, (vx * this.dir.x + vy * this.dir.y) / this.lenSq));
    out.x = this.p1.x + t * this.dir.x;
    out.y = this.p1.y + t * this.dir.y;
    return out;
  }

  getClosestPoint(p) {
    if (this.length === 0) return this.p1.clone();
    const v = new Vector2(p.x - this.p1.x, p.y - this.p1.y);
    const t = Math.max(0, Math.min(1, v.dot(this.dir) / (this.length * this.length)));
    return new Vector2(
      this.p1.x + t * this.dir.x,
      this.p1.y + t * this.dir.y
    );
  }

  addHeat(joules) {
    this.heatAccumulator += joules;
  }

  recordImpulse(impulseMagnitude) {
    this.accumulatedImpulse += impulseMagnitude;
  }

  toggleValve() {
    if (this.type === 'manual_valve') {
      this.isOpen = !this.isOpen;
    }
  }

  flipDirection() {
    this.allowedDirection = -this.allowedDirection;
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0) {
      this.temperature += this.heatAccumulator / this.heatCapacity;
      this.heatAccumulator = 0;
      if (this.temperature < 5) this.temperature = 5;
    }

    if (dt > 0 && this.length > 0) {
      this.currentPressure = this.accumulatedImpulse / (this.length * dt);
      this.smoothedPressure = this.smoothedPressure * 0.85 + this.currentPressure * 0.15;
      this.accumulatedImpulse = 0;

      if (this.type === 'relief_valve') {
        if (this.smoothedPressure >= this.triggerPressure) {
          this.isOpen = true;
        } else if (this.smoothedPressure < this.triggerPressure * 0.75) {
          this.isOpen = false;
        }
      }
    }
  }

  conductTo(otherWall, dt) {
    if (this.conductivity <= 0 || otherWall.conductivity <= 0) return;
    const effConductivity = (this.conductivity + otherWall.conductivity) * 0.5;
    const deltaT = otherWall.temperature - this.temperature;
    const qRate = effConductivity * deltaT * 50;
    this.addHeat(qRate * dt);
    otherWall.addHeat(-qRate * dt);
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsOpen = this.isOpen;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isOpen = this.initialIsOpen;
    this.heatAccumulator = 0;
    this.accumulatedImpulse = 0;
    this.currentPressure = 0;
    this.smoothedPressure = 0;
  }

  toJSON() {
    return {
      id: this.id,
      p1: { x: this.p1.x, y: this.p1.y },
      p2: { x: this.p2.x, y: this.p2.y },
      type: this.type,
      conductivity: this.conductivity,
      temperature: this.temperature,
      heatCapacity: this.heatCapacity,
      isOpen: this.isOpen,
      allowedDirection: this.allowedDirection,
      triggerPressure: this.triggerPressure,
      reliefMode: this.reliefMode,
      thickness: this.thickness,
      groupId: this.groupId || undefined
    };
  }

  static fromJSON(data) {
    return new Wall(data.p1.x, data.p1.y, data.p2.x, data.p2.y, data);
  }
}
