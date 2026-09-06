import { Vector2 } from './Vector2.js';

export class Reservoir {
  constructor(x, y, width = 80, height = 60, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.temperature = options.temperature !== undefined ? Math.max(5, options.temperature) : 500; // Constant Kelvin
    this.conductance = options.conductance !== undefined ? Math.max(0.01, Math.min(1.0, options.conductance)) : 0.8; // Coupling factor to walls and particles
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.label = options.label || `Isotherm Block (${Math.round(this.temperature)}K)`;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBounds() {
    if (!this._bounds) this._bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    this._bounds.left = this.x;
    this._bounds.right = this.x + this.width;
    this._bounds.top = this.y;
    this._bounds.bottom = this.y + this.height;
    return this._bounds;
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
  }

  intersectsSegment(p1, p2) {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    return !(maxX < this.x || minX > this.x + this.width || maxY < this.y || minY > this.y + this.height);
  }

  applyThermalCoupling(wall, dt) {
    if (!this.isActive) return;
    if (this.intersectsSegment(wall.p1, wall.p2) && wall.conductivity > 0) {
      const deltaT = this.temperature - wall.temperature;
      const heatRate = this.conductance * wall.conductivity * deltaT * 120;
      wall.addHeat(heatRate * dt);
    }
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      temperature: this.temperature,
      conductance: this.conductance,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Reservoir(data.x, data.y, data.width, data.height, data);
  }
}
