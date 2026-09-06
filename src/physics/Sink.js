export class Sink {
  constructor(x, y, width = 40, height = 40, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.absorptionEfficiency = options.absorptionEfficiency !== undefined ? options.absorptionEfficiency : 1.0;
    this.absorbedCount = 0;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  tryAbsorb(particle) {
    if (this.contains(particle.pos.x, particle.pos.y)) {
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
      absorptionEfficiency: this.absorptionEfficiency
    };
  }

  static fromJSON(data) {
    return new Sink(data.x, data.y, data.width, data.height, data);
  }
}
