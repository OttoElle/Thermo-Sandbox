export class ParticleGroup {
  constructor(options = {}) {
    this.id = options.id || 'pg_' + Math.random().toString(36).substring(2, 9);
    this.label = options.label || 'Gas Group';
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.mass = options.mass !== undefined ? options.mass : 1.0;
    this.count = options.count !== undefined ? options.count : 0;
    this.x = options.x !== undefined ? options.x : 0;
    this.y = options.y !== undefined ? options.y : 0;
    this.width = options.width !== undefined ? options.width : 0;
    this.height = options.height !== undefined ? options.height : 0;
    this.groupId = this.id;
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      temperature: this.temperature,
      mass: this.mass,
      count: this.count,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  static fromJSON(data) {
    return new ParticleGroup(data);
  }

  getActiveParticles(engine) {
    if (!engine || !engine.particles) return [];
    return engine.particles.filter(p => p.groupId === this.id);
  }

  getActiveCount(engine) {
    return this.getActiveParticles(engine).length;
  }

  getAverageTemperature(engine) {
    const pts = this.getActiveParticles(engine);
    if (pts.length === 0) return this.temperature;
    const kB = 35.0;
    let sumE = 0;
    for (let i = 0; i < pts.length; i++) {
      sumE += pts[i].getKineticEnergy();
    }
    return Math.max(5, sumE / (pts.length * kB));
  }
}