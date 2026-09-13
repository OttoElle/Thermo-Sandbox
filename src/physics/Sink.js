export class Sink {
  constructor(x, y, width = 40, height = 40, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.absorptionEfficiency = options.absorptionEfficiency !== undefined ? options.absorptionEfficiency : 1.0;
    this.direction = options.direction || '360'; // '360', 'right', 'left', 'down', 'up'
    this.maxParticles = options.maxParticles !== undefined ? options.maxParticles : 0; // 0 = unlimited
    this.tempFilterMode = options.tempFilterMode || 'all'; // 'all', 'above', 'below'
    this.filterTemperature = options.filterTemperature !== undefined ? options.filterTemperature : 300; // Kelvin
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.absorbedCount = 0;

    this.initialIsActive = this.isActive;
    this.initialAbsorbedCount = 0;
  }

  toggle() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  saveSnapshot() {
    this.initialIsActive = this.isActive;
    this.initialAbsorbedCount = this.absorbedCount;
  }

  restoreSnapshot() {
    this.isActive = this.initialIsActive;
    this.absorbedCount = 0;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  tryAbsorb(particle) {
    if (!this.isActive) return false;
    if (this.maxParticles > 0 && this.absorbedCount >= this.maxParticles) return false;

    if (this.contains(particle.pos.x, particle.pos.y)) {
      // Direction Filter
      if (this.direction === 'right' && particle.vel.x <= 0) return false;
      if (this.direction === 'left' && particle.vel.x >= 0) return false;
      if (this.direction === 'down' && particle.vel.y <= 0) return false;
      if (this.direction === 'up' && particle.vel.y >= 0) return false;

      // Temperature Filter
      if (this.tempFilterMode !== 'all') {
        const kB = 35.0;
        const vSq = particle.vel.x * particle.vel.x + particle.vel.y * particle.vel.y;
        const pTemp = (particle.mass * vSq) / (2 * kB);
        if (this.tempFilterMode === 'above' && pTemp < this.filterTemperature) return false;
        if (this.tempFilterMode === 'below' && pTemp > this.filterTemperature) return false;
      }

      if (Math.random() <= this.absorptionEfficiency) {
        this.absorbedCount++;
        return true; // remove particle
      }
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      absorptionEfficiency: this.absorptionEfficiency,
      direction: this.direction,
      maxParticles: this.maxParticles,
      tempFilterMode: this.tempFilterMode,
      filterTemperature: this.filterTemperature,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Sink(data.x, data.y, data.width, data.height, data);
  }
}

