import { Vector2 } from './Vector2.js';

export class Emitter {
  constructor(x, y, width = 40, height = 40, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rate = options.rate !== undefined ? options.rate : 8; // particles per second
    this.temperature = options.temperature !== undefined ? options.temperature : 350;
    this.mass = options.mass !== undefined ? options.mass : 1.0;
    this.direction = options.direction || 'right'; // 'right', 'left', 'up', 'down', 'radial', '360'
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.maxParticles = options.maxParticles !== undefined ? options.maxParticles : 0; // 0 = unlimited
    this.emittedCount = 0;
    this.timer = 0;

    this.initialEnabled = this.enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  saveSnapshot() {
    this.initialEnabled = this.enabled;
    this.emittedCount = 0;
  }

  restoreSnapshot() {
    this.enabled = this.initialEnabled;
    this.emittedCount = 0;
    this.timer = 0;
  }

  update(dt, engine) {
    if (!this.enabled || this.rate <= 0 || dt <= 0) return;
    if (this.maxParticles > 0 && this.emittedCount >= this.maxParticles) return;

    this.timer += dt;
    const interval = 1.0 / this.rate;

    const kB = 35.0;
    const thermalSpeed = Math.sqrt((2 * kB * Math.max(5, this.temperature)) / Math.max(0.01, this.mass));

    while (this.timer >= interval) {
      this.timer -= interval;
      if (this.maxParticles > 0 && this.emittedCount >= this.maxParticles) break;
      
      // Spawn position randomly inside emitter bounds
      const px = this.x + Math.random() * this.width;
      const py = this.y + Math.random() * this.height;

      let vx = 0, vy = 0;
      const spreadAngle = (Math.random() - 0.5) * 0.35; // subtle thermal divergence
      const speedFluct = thermalSpeed * (0.9 + Math.random() * 0.2);

      if (this.direction === 'right') {
        vx = speedFluct * Math.cos(spreadAngle);
        vy = speedFluct * Math.sin(spreadAngle);
      } else if (this.direction === 'left') {
        vx = -speedFluct * Math.cos(spreadAngle);
        vy = speedFluct * Math.sin(spreadAngle);
      } else if (this.direction === 'down') {
        vx = speedFluct * Math.sin(spreadAngle);
        vy = speedFluct * Math.cos(spreadAngle);
      } else if (this.direction === 'up') {
        vx = speedFluct * Math.sin(spreadAngle);
        vy = -speedFluct * Math.cos(spreadAngle);
      } else { // 'radial' or '360'
        const theta = Math.random() * Math.PI * 2;
        vx = speedFluct * Math.cos(theta);
        vy = speedFluct * Math.sin(theta);
      }

      engine.addParticle(px, py, vx, vy, this.mass);
      this.emittedCount++;
    }
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rate: this.rate,
      temperature: this.temperature,
      mass: this.mass,
      direction: this.direction,
      enabled: this.enabled,
      maxParticles: this.maxParticles
    };
  }


  static fromJSON(data) {
    return new Emitter(data.x, data.y, data.width, data.height, data);
  }
}
