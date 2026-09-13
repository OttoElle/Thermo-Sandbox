import { Vector2 } from './Vector2.js';

export class Particle {
  constructor(x, y, vx = 0, vy = 0, mass = 1, id = 0, groupId = null) {
    this.id = id;
    this.groupId = groupId;
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(vx, vy);
    this.mass = Math.max(0.1, mass);
    
    // Radius scales with sqrt(mass): base radius 3.5px for mass=1
    this.baseRadius = 3.5;
    this.radius = this.baseRadius * Math.sqrt(this.mass);
    
    this.fixed = false;
    this.selected = false;
    this.tag = 'default';

    // Stored initial state for reset snapshot
    this.initialPos = new Vector2(x, y);
    this.initialVel = new Vector2(vx, vy);
    this.initialGroupId = groupId;
  }

  setMass(m) {
    this.mass = Math.max(0.1, m);
    this.radius = this.baseRadius * Math.sqrt(this.mass);
  }

  getSpeed() {
    return this.vel.length();
  }

  getSpeedSq() {
    return this.vel.lengthSq();
  }

  getKineticEnergy() {
    return 0.5 * this.mass * this.vel.lengthSq();
  }

  update(dt) {
    if (this.fixed) return;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  saveSnapshot() {
    this.initialPos = this.pos.clone();
    this.initialVel = this.vel.clone();
  }

  restoreSnapshot() {
    this.pos = this.initialPos.clone();
    this.vel = this.initialVel.clone();
  }
}
