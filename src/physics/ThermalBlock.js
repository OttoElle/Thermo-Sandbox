import { Vector2 } from './Vector2.js';

export class ThermalBlock {
  constructor(x, y, width = 80, height = 60, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'solid'; // Solid thermal obstacle
    this.temperature = options.temperature !== undefined ? Math.max(5, options.temperature) : 300;
    this.heatCapacity = options.heatCapacity !== undefined ? Math.max(10, options.heatCapacity) : 300; // Joules/K
    this.conductivity = options.conductivity !== undefined ? Math.max(0.01, Math.min(1.0, options.conductivity)) : 0.6; // Surface thermal coupling
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.heatAccumulator = 0;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
    this.label = options.label || `Thermal Storage (${Math.round(this.temperature)}K)`;
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

  addHeat(joules) {
    if (this.isActive) {
      this.heatAccumulator += joules;
    }
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0 && this.isActive) {
      this.temperature += this.heatAccumulator / this.heatCapacity;
      this.heatAccumulator = 0;
      if (this.temperature < 5) this.temperature = 5;
    }
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
    this.heatAccumulator = 0;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      type: this.type,
      temperature: this.temperature,
      heatCapacity: this.heatCapacity,
      conductivity: this.conductivity,
      isActive: this.isActive,
      label: this.label
    };
  }

  static fromJSON(data) {
    return new ThermalBlock(data.x, data.y, data.width, data.height, data);
  }
}
