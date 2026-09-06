import { Vector2 } from './Vector2.js';

export class HeatExchanger {
  constructor(x, y, width = 80, height = 60, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.temperature = options.temperature !== undefined ? Math.max(5, options.temperature) : 300; // Constant Kelvin (T_body)
    this.conductivity = options.conductivity !== undefined ? Math.max(0.01, Math.min(1.0, options.conductivity)) : 0.6; // Coupling rate kappa
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.label = options.label || `Heat Exchanger (${Math.round(this.temperature)}K)`;
    this.initialTemperature = this.temperature;
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

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      temperature: this.temperature,
      conductivity: this.conductivity,
      isActive: this.isActive,
      label: this.label
    };
  }

  static fromJSON(data) {
    return new HeatExchanger(data.x, data.y, data.width, data.height, data);
  }
}
