import { Vector2 } from './Vector2.js';
import { Particle } from './Particle.js';
import { ParticleGroup } from './ParticleGroup.js';
import { SpatialGrid } from './SpatialGrid.js';
import { Wall } from './Wall.js';
import { Piston } from './Piston.js';
import { Reservoir } from './Reservoir.js';
import { SensorZone } from './SensorZone.js';
import { Emitter } from './Emitter.js';
import { Sink } from './Sink.js';
import { ThermalBlock } from './ThermalBlock.js';
import { HeatExchanger } from './HeatExchanger.js';
import { RegeneratorMatrix } from './RegeneratorMatrix.js';
import { TextLabel } from './TextLabel.js';
import { Regulator } from './Regulator.js';
import { ThrottleValve } from './ThrottleValve.js';
import { CycleSequencer } from '../control/CycleSequencer.js';

export class Engine {
  constructor(width = 2500, height = 2500) {
    this.width = width;
    this.height = height;
    this.sequencer = new CycleSequencer();

    this.particles = [];
    this.walls = [];
    this.throttleValves = [];
    this.pistons = [];
    this.sensors = [];
    this.reservoirs = [];
    this.emitters = [];
    this.sinks = [];
    this.regulators = [];
    this.thermalBlocks = [];
    this.heatExchangers = [];
    this.regenerators = [];
    this.textLabels = [];
    this.particleGroups = [];
    this.elements = []; // Unified canvas objects layer stack (z-order)

    this.grid = new SpatialGrid(width, height, 25);

    this.subSteps = 4;
    this.timeScale = 1.0;
    this.isPaused = true;
    this.simModel = 'hard_sphere'; // 'hard_sphere' or 'lennard_jones'
    this.gravityEnabled = false;
    this.gravity = 350; // px/s^2 (+y downward)
    
    this.totalTime = 0;
    this.nextParticleId = 1;

    this.stats = {
      particleCount: 0,
      totalKineticEnergy: 0,
      meanSpeed: 0,
      systemTemperature: 0,
      fps: 60
    };

    // System Telemetry History
    this.historyTime = [];
    this.historyTemp = [];
    this.historyPressure = [];
    this.historyVolume = [];
    this.historyCount = [];
    this.historyKineticEnergy = [];
  }

  clear() {
    this.particles = [];
    this.walls = [];
    this.throttleValves = [];
    this.pistons = [];
    this.sensors = [];
    this.reservoirs = [];
    this.emitters = [];
    this.sinks = [];
    this.regulators = [];
    this.thermalBlocks = [];
    this.heatExchangers = [];
    this.regenerators = [];
    this.textLabels = [];
    this.particleGroups = [];
    this.elements = [];
    this.grid.clear();
    this.totalTime = 0;
    this.historyTime = [];
    this.historyTemp = [];
    this.historyPressure = [];
    this.historyVolume = [];
    this.historyCount = [];
    this.historyKineticEnergy = [];
    if (this.sequencer) {
      this.sequencer.reset();
    }
    this._updateStats();
  }

  addParticle(x, y, vx, vy, mass = 1, groupId = null) {
    const p = new Particle(x, y, vx, vy, mass, this.nextParticleId++, groupId);
    this.particles.push(p);
    return p;
  }

  addWall(x1, y1, x2, y2, options = {}) {
    const w = new Wall(x1, y1, x2, y2, options);
    this.walls.push(w);
    this.elements.push(w);
    return w;
  }

  addThrottleValve(x1, y1, x2, y2, options = {}) {
    const tv = new ThrottleValve(x1, y1, x2, y2, options);
    this.throttleValves.push(tv);
    this.elements.push(tv);
    return tv;
  }

  addPiston(options = {}) {
    const p = new Piston(options);
    this.pistons.push(p);
    this.elements.push(p);
    return p;
  }

  addSensor(options = {}) {
    const s = new SensorZone(options);
    this.sensors.push(s);
    this.elements.push(s);
    return s;
  }

  addReservoir(x, y, width, height, options = {}) {
    const r = new Reservoir(x, y, width, height, options);
    this.reservoirs.push(r);
    this.elements.push(r);
    return r;
  }

  addEmitter(x, y, width, height, options = {}) {
    const e = new Emitter(x, y, width, height, options);
    this.emitters.push(e);
    this.elements.push(e);
    return e;
  }

  addSink(x, y, width, height, options = {}) {
    const s = new Sink(x, y, width, height, options);
    this.sinks.push(s);
    this.elements.push(s);
    return s;
  }

  addRegulator(x, y, width, height, options = {}) {
    const r = new Regulator(x, y, width, height, options);
    this.regulators.push(r);
    this.elements.push(r);
    return r;
  }

  addThermalBlock(x, y, width, height, options = {}) {
    const b = new ThermalBlock(x, y, width, height, options);
    this.thermalBlocks.push(b);
    this.elements.push(b);
    return b;
  }

  addHeatExchanger(x, y, width, height, options = {}) {
    const hx = new HeatExchanger(x, y, width, height, options);
    this.heatExchangers.push(hx);
    this.elements.push(hx);
    return hx;
  }

  addRegeneratorMatrix(x, y, width, height, options = {}) {
    const reg = new RegeneratorMatrix(x, y, width, height, options);
    this.regenerators.push(reg);
    this.elements.push(reg);
    return reg;
  }

  addTextLabel(x, y, text, options = {}) {
    const l = new TextLabel(x, y, text, options);
    this.textLabels.push(l);
    this.elements.push(l);
    return l;
  }

  _randomGaussian(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  spawnGasRaster(x, y, width, height, count, mass, temperature, velocityMode = 'uniform_speed', groupLabel = null) {
    const kB = 35.0;
    const pad = 12;
    const effW = Math.max(20, width - pad * 2);
    const effH = Math.max(20, height - pad * 2);

    const aspect = effW / effH;
    const cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
    const rows = Math.max(1, Math.ceil(count / cols));
    
    const stepX = cols > 1 ? effW / (cols - 1) : 0;
    const stepY = rows > 1 ? effH / (rows - 1) : 0;

    const groupId = 'pg_' + Math.random().toString(36).substring(2, 9);
    const label = groupLabel || `Spawner ${this.particleGroups.length + 1} (${Math.round(temperature)}K)`;
    const group = new ParticleGroup({
      id: groupId,
      label: label,
      x, y, width, height,
      temperature, mass, count: 0
    });

    let spawned = 0;
    for (let r = 0; r < rows && spawned < count; r++) {
      for (let c = 0; c < cols && spawned < count; c++) {
        const px = x + pad + (cols > 1 ? c * stepX : effW * 0.5);
        const py = y + pad + (rows > 1 ? r * stepY : effH * 0.5);

        let vx = 0, vy = 0;
        if (velocityMode === 'uniform_speed') {
          const speed = Math.sqrt((2 * kB * Math.max(5, temperature)) / mass);
          const theta = Math.random() * Math.PI * 2;
          vx = speed * Math.cos(theta);
          vy = speed * Math.sin(theta);
        } else {
          const sigma = Math.sqrt((kB * Math.max(5, temperature)) / mass);
          vx = this._randomGaussian(0, sigma);
          vy = this._randomGaussian(0, sigma);
        }

        this.addParticle(px, py, vx, vy, mass, groupId);
        spawned++;
      }
    }

    group.count = spawned;
    this.particleGroups.push(group);
    this.elements.push(group);
    return group;
  }

  deleteParticleGroup(group) {
    this.particleGroups = this.particleGroups.filter(g => g !== group && g.id !== group.id);
    this.elements = this.elements.filter(el => el !== group && el.id !== group.id);
    const pts = this.particles.filter(p => p.groupId === group.id);
    this.deleteParticles(pts);
  }

  setGroupTemperature(group, newT) {
    group.temperature = newT;
    const kB = 35.0;
    const targetSpeed = Math.sqrt((2 * kB * Math.max(5, newT)) / group.mass);
    const pts = group.getActiveParticles(this);
    for (const p of pts) {
      const spd = p.getSpeed();
      if (spd > 0.001) {
        p.vel.x = (p.vel.x / spd) * targetSpeed;
        p.vel.y = (p.vel.y / spd) * targetSpeed;
      } else {
        const theta = Math.random() * Math.PI * 2;
        p.vel.x = targetSpeed * Math.cos(theta);
        p.vel.y = targetSpeed * Math.sin(theta);
      }
    }
  }

  setGroupMass(group, newM) {
    group.mass = newM;
    const pts = group.getActiveParticles(this);
    for (const p of pts) {
      p.setMass(newM);
    }
  }

  setLoadedProfile(profileState) {
    if (profileState.profileName) this.currentProfileName = profileState.profileName;
    this.loadedProfileJSON = JSON.stringify(profileState);
    this.importState(profileState, false);
  }

  resetToLoadedProfile() {
    if (this.loadedProfileJSON) {
      const state = JSON.parse(this.loadedProfileJSON);
      this._applyState(state);
    } else if (this.initialSnapshot) {
      const state = JSON.parse(this.initialSnapshot);
      this._applyState(state);
    }
    this.totalTime = 0;
    this.isPaused = true;
    this._updateStats();
  }

  saveSimStartSnapshot() {
    this.simStartSnapshot = JSON.stringify(this.exportState(this.currentProfileName || 'SimStart'));
  }

  restoreSimStartSnapshot() {
    if (this.simStartSnapshot) {
      const state = JSON.parse(this.simStartSnapshot);
      this._applyState(state);
    } else {
      for (let i = 0; i < this.particles.length; i++) this.particles[i].restoreSnapshot();
      for (let i = 0; i < this.walls.length; i++) this.walls[i].restoreSnapshot();
      for (let i = 0; i < this.pistons.length; i++) this.pistons[i].restoreSnapshot();
      for (let i = 0; i < this.thermalBlocks.length; i++) this.thermalBlocks[i].restoreSnapshot();
      for (let i = 0; i < this.reservoirs.length; i++) this.reservoirs[i].restoreSnapshot();
      for (let i = 0; i < this.heatExchangers.length; i++) this.heatExchangers[i].restoreSnapshot();
      for (let i = 0; i < this.regenerators.length; i++) this.regenerators[i].restoreSnapshot();
      for (let i = 0; i < this.regulators.length; i++) this.regulators[i].restoreSnapshot();
    }
    for (let i = 0; i < this.sensors.length; i++) this.sensors[i].clearHistory();
    this.totalTime = 0;
    this.isPaused = true;
    this._updateStats();
  }

  saveInitialSnapshot(profileName = null) {
    if (profileName) this.currentProfileName = profileName;
    for (let i = 0; i < this.particles.length; i++) this.particles[i].saveSnapshot();
    for (let i = 0; i < this.walls.length; i++) this.walls[i].saveSnapshot();
    for (let i = 0; i < this.pistons.length; i++) this.pistons[i].saveSnapshot();
    for (let i = 0; i < this.thermalBlocks.length; i++) this.thermalBlocks[i].saveSnapshot();
    for (let i = 0; i < this.reservoirs.length; i++) this.reservoirs[i].saveSnapshot();
    for (let i = 0; i < this.heatExchangers.length; i++) this.heatExchangers[i].saveSnapshot();
    for (let i = 0; i < this.regenerators.length; i++) this.regenerators[i].saveSnapshot();
    for (let i = 0; i < this.regulators.length; i++) this.regulators[i].saveSnapshot();
    for (let i = 0; i < (this.throttleValves || []).length; i++) this.throttleValves[i].saveSnapshot();
    for (let i = 0; i < this.sensors.length; i++) this.sensors[i].clearHistory();
    this.totalTime = 0;
    this.initialSnapshot = JSON.stringify(this.exportState(this.currentProfileName || 'Profile'));
    if (!this.loadedProfileJSON) {
      this.loadedProfileJSON = this.initialSnapshot;
    }
  }

  restoreInitialSnapshot() {
    this.resetToLoadedProfile();
  }

  step(dt) {
    if (this.isPaused || dt <= 0) return;

    const effectiveDt = dt * this.timeScale;
    const subDt = effectiveDt / this.subSteps;

    // 0. Precision Cycle Sequencer (Coordinates valves, pistons & thermals per phase)
    if (this.sequencer && this.sequencer.isEnabled) {
      this.sequencer.step(effectiveDt, this);
    }

    // 1. Particle Emitters & Regulators & Throttle Valves
    for (let i = 0; i < this.emitters.length; i++) {
      this.emitters[i].update(effectiveDt, this);
    }
    for (let i = 0; i < this.regulators.length; i++) {
      this.regulators[i].update(effectiveDt, this);
    }
    for (let i = 0; i < (this.throttleValves || []).length; i++) {
      this.throttleValves[i].update(effectiveDt);
    }

    // 2. Sub-step Physics
    for (let step = 0; step < this.subSteps; step++) {
      this._subStep(subDt);
    }

    this.totalTime += effectiveDt;

    // 3. Thermal Coupling: Reservoirs -> Walls
    for (let i = 0; i < this.reservoirs.length; i++) {
      const res = this.reservoirs[i];
      for (let j = 0; j < this.walls.length; j++) {
        res.applyThermalCoupling(this.walls[j], effectiveDt);
      }
    }

    // 4. Thermal Coupling: Walls -> Walls
    for (let i = 0; i < this.walls.length; i++) {
      const w1 = this.walls[i];
      if (w1.conductivity <= 0) continue;

      for (let j = i + 1; j < this.walls.length; j++) {
        const w2 = this.walls[j];
        if (w2.conductivity <= 0) continue;

        if (
          w1.p1.distanceToSq(w2.p1) < 64 ||
          w1.p1.distanceToSq(w2.p2) < 64 ||
          w1.p2.distanceToSq(w2.p1) < 64 ||
          w1.p2.distanceToSq(w2.p2) < 64
        ) {
          w1.conductTo(w2, effectiveDt);
        }
      }
    }

    // 5. Update Components
    for (let i = 0; i < this.walls.length; i++) this.walls[i].update(effectiveDt);
    for (let i = 0; i < this.pistons.length; i++) this.pistons[i].update(effectiveDt, this.totalTime);
    for (let i = 0; i < this.thermalBlocks.length; i++) this.thermalBlocks[i].update(effectiveDt);
    for (let i = 0; i < this.regenerators.length; i++) this.regenerators[i].update(effectiveDt);
    for (let i = 0; i < this.sensors.length; i++) this.sensors[i].updateMeasurements(this.particles, this.totalTime);

    this._updateStats();
  }

  _subStep(dt) {
    // 1. Move particles
    const applyGravity = this.gravityEnabled;
    const gStep = this.gravity * dt;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.fixed) {
        if (applyGravity) {
          p.vel.y += gStep;
        }
        p.update(dt);
      }
    }

    // 2. Spatial Grid Particle Collision
    this.grid.populate(this.particles);

    if (this.simModel === 'lennard_jones') {
      this.grid.forEachPair((p1, p2) => this._resolveLennardJones(p1, p2, dt));
    } else {
      this.grid.forEachPair((p1, p2) => this._resolveParticleCollision(p1, p2));
    }

    // 3. Wall, Piston, ThermalBlock & Sink Collisions
    const sinksCount = this.sinks.length;
    let writeIdx = 0;
    const count = this.particles.length;

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      
      // Sink Check
      let absorbed = false;
      if (sinksCount > 0) {
        for (let s = 0; s < sinksCount; s++) {
          if (this.sinks[s].tryAbsorb(p)) {
            absorbed = true;
            break;
          }
        }
      }
      if (absorbed) continue;

      // Walls
      for (let j = 0; j < this.walls.length; j++) {
        this._resolveWallCollision(p, this.walls[j], dt);
      }

      // Throttle Valves
      for (let tv = 0; tv < (this.throttleValves || []).length; tv++) {
        this.throttleValves[tv].resolveParticleCollision(p, dt);
      }

      // Pistons
      for (let k = 0; k < this.pistons.length; k++) {
        this._resolvePistonCollision(p, this.pistons[k], dt);
      }

      // Solid Thermal Storage Blocks
      for (let b = 0; b < this.thermalBlocks.length; b++) {
        this._resolveThermalBlockCollision(p, this.thermalBlocks[b], dt);
      }

      // Solid Isothermal Reservoirs
      for (let r = 0; r < this.reservoirs.length; r++) {
        this._resolveReservoirCollision(p, this.reservoirs[r], dt);
      }

      // Permeable Isothermal Heat Exchangers
      for (let hx = 0; hx < this.heatExchangers.length; hx++) {
        this._resolveHeatExchanger(p, this.heatExchangers[hx], dt);
      }

      // Permeable Regenerator Matrices
      for (let reg = 0; reg < this.regenerators.length; reg++) {
        this._resolveRegeneratorMatrix(p, this.regenerators[reg], dt);
      }

      if (writeIdx !== i) {
        this.particles[writeIdx] = p;
      }
      writeIdx++;
    }

    if (writeIdx < count) {
      this.particles.length = writeIdx;
    }
  }

  _resolveParticleCollision(p1, p2) {
    const dx = p2.pos.x - p1.pos.x;
    const dy = p2.pos.y - p1.pos.y;
    const distSq = dx * dx + dy * dy;
    const minDist = p1.radius + p2.radius;

    if (distSq < minDist * minDist && distSq > 0.00001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Position correction
      const overlap = (minDist - dist) * 0.5;
      if (!p1.fixed) { p1.pos.x -= nx * overlap; p1.pos.y -= ny * overlap; }
      if (!p2.fixed) { p2.pos.x += nx * overlap; p2.pos.y += ny * overlap; }

      // Relative velocity
      const rvx = p2.vel.x - p1.vel.x;
      const rvy = p2.vel.y - p1.vel.y;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const inv1 = p1.fixed ? 0 : 1 / p1.mass;
        const inv2 = p2.fixed ? 0 : 1 / p2.mass;
        const invSum = inv1 + inv2;

        if (invSum > 0) {
          const impMag = (-2.0 * velAlongNormal) / invSum;
          const ix = impMag * nx;
          const iy = impMag * ny;

          if (!p1.fixed) { p1.vel.x -= ix * inv1; p1.vel.y -= iy * inv1; }
          if (!p2.fixed) { p2.vel.x += ix * inv2; p2.vel.y += iy * inv2; }
        }
      }
    }
  }

  _resolveLennardJones(p1, p2, dt) {
    const dx = p2.pos.x - p1.pos.x;
    const dy = p2.pos.y - p1.pos.y;
    const distSq = dx * dx + dy * dy;
    const sigma = (p1.radius + p2.radius) * 0.9;
    const sigmaSq = sigma * sigma;
    const rCutSq = sigmaSq * 6.25; // 2.5 sigma cutoff

    if (distSq < rCutSq && distSq > 0.0001) {
      const invDistSq = 1.0 / distSq;
      const s_r2 = sigmaSq * invDistSq;
      const s_r6 = s_r2 * s_r2 * s_r2;
      const s_r12 = s_r6 * s_r6;
      
      const epsilon = 30.0;
      let forceOverDist = 24.0 * epsilon * (2.0 * s_r12 - s_r6) * invDistSq;

      // Force clamping at +/- 1000
      const fSq = forceOverDist * forceOverDist * distSq;
      if (fSq > 1000000.0) {
        const dist = Math.sqrt(distSq);
        forceOverDist = (forceOverDist > 0 ? 1000.0 : -1000.0) / dist;
      }

      const fx = forceOverDist * dx;
      const fy = forceOverDist * dy;

      if (!p1.fixed) {
        p1.vel.x -= (fx / p1.mass) * dt;
        p1.vel.y -= (fy / p1.mass) * dt;
      }
      if (!p2.fixed) {
        p2.vel.x += (fx / p2.mass) * dt;
        p2.vel.y += (fy / p2.mass) * dt;
      }
    }
  }

  _resolveWallCollision(p, wall, dt) {
    if (wall.type === 'manual_valve' && wall.isOpen) return;
    if (wall.type === 'relief_valve' && wall.isOpen && wall.reliefMode === 'bidirectional') return;

    if (!this._wallClosestHelper) this._wallClosestHelper = { x: 0, y: 0 };
    wall.getClosestPointCoords(p.pos.x, p.pos.y, this._wallClosestHelper);
    const dx = p.pos.x - this._wallClosestHelper.x;
    const dy = p.pos.y - this._wallClosestHelper.y;
    const distSq = dx * dx + dy * dy;
    const effRad = p.radius + wall.thickness * 0.5;

    if (distSq < effRad * effRad) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const ny = dy / dist;

      if (wall.type === 'check_valve' || (wall.type === 'relief_valve' && wall.isOpen && wall.reliefMode === 'oneway')) {
        const flow = p.vel.x * wall.normal.x + p.vel.y * wall.normal.y;
        if (flow * wall.allowedDirection > 0) return;
      }

      const pen = effRad - dist;
      p.pos.x += nx * pen;
      p.pos.y += ny * pen;

      const velAlongNormal = p.vel.x * nx + p.vel.y * ny;
      if (velAlongNormal < 0) {
        let newVx = p.vel.x - 2 * velAlongNormal * nx;
        let newVy = p.vel.y - 2 * velAlongNormal * ny;

        if (wall.conductivity > 0) {
          const kB = 35.0;
          const targetSpeedSq = (2 * kB * wall.temperature) / p.mass;
          const curSpeedSq = newVx * newVx + newVy * newVy;
          const alpha = wall.conductivity * 0.8;
          const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
          const factor = curSpeedSq > 0.001 ? Math.sqrt(blendSq / curSpeedSq) : 1;

          const eBefore = 0.5 * p.mass * curSpeedSq;
          newVx *= factor;
          newVy *= factor;
          const eAfter = 0.5 * p.mass * (newVx * newVx + newVy * newVy);
          wall.addHeat(-(eAfter - eBefore));
        }

        p.vel.x = newVx;
        p.vel.y = newVy;
        wall.recordImpulse(2 * p.mass * Math.abs(velAlongNormal));
      }
    }
  }

  _resolvePistonCollision(p, piston, dt) {
    const bounds = piston.getBounds();
    const pr = p.radius;

    if (
      p.pos.x + pr >= bounds.left &&
      p.pos.x - pr <= bounds.right &&
      p.pos.y + pr >= bounds.top &&
      p.pos.y - pr <= bounds.bottom
    ) {
      if (piston.orientation === 'horizontal') {
        const isLeft = p.pos.x < piston.x;
        const vPiston = piston.velocity;

        if (isLeft) {
          p.pos.x = bounds.left - pr;
          const relVel = p.vel.x - vPiston;
          if (relVel > 0) {
            const m1 = p.mass;
            const m2 = Math.max(1, piston.mass);
            const imp = (2 * m1 * m2 * (vPiston - p.vel.x)) / (m1 + m2);
            p.vel.x += imp / m1;
            piston.accumulatedImpulseLeft += Math.abs(imp);
          }
        } else {
          p.pos.x = bounds.right + pr;
          const relVel = p.vel.x - vPiston;
          if (relVel < 0) {
            const m1 = p.mass;
            const m2 = Math.max(1, piston.mass);
            const imp = (2 * m1 * m2 * (vPiston - p.vel.x)) / (m1 + m2);
            p.vel.x += imp / m1;
            piston.accumulatedImpulseRight += Math.abs(imp);
          }
        }
      } else {
        const isTop = p.pos.y < piston.y;
        const vPiston = piston.velocity;

        if (isTop) {
          p.pos.y = bounds.top - pr;
          const relVel = p.vel.y - vPiston;
          if (relVel > 0) {
            p.vel.y = 2 * vPiston - p.vel.y;
            piston.accumulatedImpulseLeft += 2 * p.mass * Math.abs(relVel);
          }
        } else {
          p.pos.y = bounds.bottom + pr;
          const relVel = p.vel.y - vPiston;
          if (relVel < 0) {
            p.vel.y = 2 * vPiston - p.vel.y;
            piston.accumulatedImpulseRight += 2 * p.mass * Math.abs(relVel);
          }
        }
      }
    }
  }

  _resolveHeatExchanger(p, hx, dt) {
    if (!hx.isActive || !hx.contains(p.pos.x, p.pos.y)) return;
    const kB = 35.0;
    const targetTemp = Math.max(5, hx.temperature);
    const targetSpeedSq = (2 * kB * targetTemp) / Math.max(0.01, p.mass);
    const curSpeedSq = p.getSpeedSq();
    if (curSpeedSq < 0.0001) return;

    const alpha = Math.min(1.0, (hx.conductivity || 0.6) * 6.0 * dt);
    const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
    if (blendSq > 0 && !isNaN(blendSq)) {
      const factor = Math.sqrt(blendSq / curSpeedSq);
      if (!isNaN(factor) && isFinite(factor) && factor > 0) {
        p.vel.multiplyScalar(factor);
      }
    }
  }

  _resolveRegeneratorMatrix(p, reg, dt) {
    if (!reg.isActive || !reg.contains(p.pos.x, p.pos.y)) return;
    const sliceIdx = reg.getSliceIndex(p.pos.x, p.pos.y);
    if (sliceIdx < 0 || sliceIdx >= reg.sliceCount) return;

    const kB = 35.0;
    const sliceTemp = Math.max(5, reg.temperatures[sliceIdx] || 300);
    const targetSpeedSq = (2 * kB * sliceTemp) / Math.max(0.01, p.mass);
    const curSpeedSq = p.getSpeedSq();
    if (curSpeedSq < 0.0001) return;

    const alpha = Math.min(1.0, (reg.conductivity || 0.7) * 6.0 * dt);
    const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
    if (blendSq > 0 && !isNaN(blendSq)) {
      const factor = Math.sqrt(blendSq / curSpeedSq);
      if (!isNaN(factor) && isFinite(factor) && factor > 0) {
        const eBefore = 0.5 * p.mass * curSpeedSq;
        p.vel.multiplyScalar(factor);
        const eAfter = 0.5 * p.mass * p.getSpeedSq();
        reg.addHeatToSlice(sliceIdx, -(eAfter - eBefore));
      }
    }
  }

  _resolveThermalBlockCollision(p, block, dt) {
    const bounds = block.getBounds();
    const pr = p.radius;

    if (
      p.pos.x + pr >= bounds.left &&
      p.pos.x - pr <= bounds.right &&
      p.pos.y + pr >= bounds.top &&
      p.pos.y - pr <= bounds.bottom
    ) {
      const dl = Math.abs(p.pos.x - bounds.left);
      const dr = Math.abs(bounds.right - p.pos.x);
      const dt_ = Math.abs(p.pos.y - bounds.top);
      const db = Math.abs(bounds.bottom - p.pos.y);
      const minD = Math.min(dl, dr, dt_, db);

      if (minD === dl) { p.pos.x = bounds.left - pr; p.vel.x = -Math.abs(p.vel.x); }
      else if (minD === dr) { p.pos.x = bounds.right + pr; p.vel.x = Math.abs(p.vel.x); }
      else if (minD === dt_) { p.pos.y = bounds.top - pr; p.vel.y = -Math.abs(p.vel.y); }
      else { p.pos.y = bounds.bottom + pr; p.vel.y = Math.abs(p.vel.y); }

      if (block.isActive && block.conductivity > 0) {
        const kB = 35.0;
        const targetTemp = Math.max(5, block.temperature);
        const targetSpeedSq = (2 * kB * targetTemp) / Math.max(0.01, p.mass);
        const curSpeedSq = p.getSpeedSq();
        if (curSpeedSq > 0.0001) {
          const alpha = Math.min(1.0, block.conductivity * 0.8);
          const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
          if (blendSq > 0 && !isNaN(blendSq)) {
            const factor = Math.sqrt(blendSq / curSpeedSq);
            if (!isNaN(factor) && isFinite(factor) && factor > 0) {
              const eBefore = 0.5 * p.mass * curSpeedSq;
              p.vel.multiplyScalar(factor);
              const eAfter = 0.5 * p.mass * p.getSpeedSq();
              block.addHeat(-(eAfter - eBefore));
            }
          }
        }
      }
    }
  }

  _resolveReservoirCollision(p, res, dt) {
    const bounds = res.getBounds();
    const pr = p.radius;

    if (
      p.pos.x + pr >= bounds.left &&
      p.pos.x - pr <= bounds.right &&
      p.pos.y + pr >= bounds.top &&
      p.pos.y - pr <= bounds.bottom
    ) {
      const dl = Math.abs(p.pos.x - bounds.left);
      const dr = Math.abs(bounds.right - p.pos.x);
      const dt_ = Math.abs(p.pos.y - bounds.top);
      const db = Math.abs(bounds.bottom - p.pos.y);
      const minD = Math.min(dl, dr, dt_, db);

      if (minD === dl) { p.pos.x = bounds.left - pr; p.vel.x = -Math.abs(p.vel.x); }
      else if (minD === dr) { p.pos.x = bounds.right + pr; p.vel.x = Math.abs(p.vel.x); }
      else if (minD === dt_) { p.pos.y = bounds.top - pr; p.vel.y = -Math.abs(p.vel.y); }
      else { p.pos.y = bounds.bottom + pr; p.vel.y = Math.abs(p.vel.y); }

      if (res.isActive && res.conductance > 0) {
        const kB = 35.0;
        const targetTemp = Math.max(5, res.temperature);
        const targetSpeedSq = (2 * kB * targetTemp) / Math.max(0.01, p.mass);
        const curSpeedSq = p.getSpeedSq();
        if (curSpeedSq > 0.0001) {
          const alpha = Math.min(1.0, res.conductance * 0.8);
          const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
          if (blendSq > 0 && !isNaN(blendSq)) {
            const factor = Math.sqrt(blendSq / curSpeedSq);
            if (!isNaN(factor) && isFinite(factor) && factor > 0) {
              p.vel.multiplyScalar(factor);
            }
          }
        }
      }
    }
  }

  _updateStats() {
    let totalE = 0;
    let speedSum = 0;
    const count = this.particles.length;

    for (let i = 0; i < count; i++) {
      const spd = this.particles[i].getSpeed();
      speedSum += spd;
      totalE += 0.5 * this.particles[i].mass * spd * spd;
    }

    this.stats.particleCount = count;
    this.stats.totalKineticEnergy = totalE;
    this.stats.meanSpeed = count > 0 ? speedSum / count : 0;
    const kB = 35.0;
    this.stats.systemTemperature = count > 0 ? totalE / (count * kB) : 0;

    // Record continuous time series
    if (this.historyTime && (this.historyTime.length === 0 || this.totalTime - this.historyTime[this.historyTime.length - 1] >= 0.045)) {
      this.historyTime.push(this.totalTime);
      this.historyTemp.push(this.stats.systemTemperature);
      this.historyPressure.push((count / 2500) * kB * this.stats.systemTemperature * 10);
      this.historyVolume.push(2500 * 2500);
      this.historyCount.push(count);
      this.historyKineticEnergy.push(totalE);

      if (this.historyTime.length > 600) {
        this.historyTime.shift();
        this.historyTemp.shift();
        this.historyPressure.shift();
        this.historyVolume.shift();
        this.historyCount.shift();
        this.historyKineticEnergy.shift();
      }
    }
  }

  exportState(profileName = 'Standardprofil') {
    return {
      version: '3.0',
      profileName: profileName,
      simModel: this.simModel || 'hard_sphere',
      gravityEnabled: !!this.gravityEnabled,
      gravity: this.gravity || 350,
      timestamp: new Date().toISOString(),
      walls: this.walls.map(w => w.toJSON()),
      throttleValves: (this.throttleValves || []).map(tv => tv.toJSON()),
      reservoirs: this.reservoirs.map(r => r.toJSON()),
      pistons: this.pistons.map(p => p.toJSON()),
      sensors: this.sensors.map(s => s.toJSON()),
      emitters: this.emitters.map(e => e.toJSON()),
      sinks: this.sinks.map(s => s.toJSON()),
      regulators: this.regulators.map(r => r.toJSON()),
      thermalBlocks: this.thermalBlocks.map(b => b.toJSON()),
      heatExchangers: this.heatExchangers.map(h => h.toJSON()),
      regenerators: this.regenerators.map(r => r.toJSON()),
      textLabels: this.textLabels.map(l => l.toJSON()),
      particleGroups: this.particleGroups.map(g => g.toJSON()),
      cycleSequencer: this.sequencer ? this.sequencer.exportState() : null,
      particles: this.particles.map(p => ({
        x: p.initialPos.x,
        y: p.initialPos.y,
        vx: p.initialVel.x,
        vy: p.initialVel.y,
        mass: p.mass,
        tag: p.tag,
        groupId: p.groupId
      }))
    };
  }

  _applyState(state) {
    this.clear();

    if (state.profileName) this.currentProfileName = state.profileName;
    if (state.simModel) this.simModel = state.simModel;
    if (state.gravityEnabled !== undefined) this.gravityEnabled = !!state.gravityEnabled;
    if (state.gravity !== undefined) this.gravity = state.gravity;
    if (state.walls) this.walls = state.walls.map(w => Wall.fromJSON(w));
    if (state.throttleValves) this.throttleValves = state.throttleValves.map(tv => ThrottleValve.fromJSON(tv));
    if (state.reservoirs) this.reservoirs = state.reservoirs.map(r => Reservoir.fromJSON(r));
    if (state.pistons) this.pistons = state.pistons.map(p => Piston.fromJSON(p));
    if (state.sensors) this.sensors = state.sensors.map(s => SensorZone.fromJSON(s));
    if (state.emitters) this.emitters = state.emitters.map(e => Emitter.fromJSON(e));
    if (state.sinks) this.sinks = state.sinks.map(s => Sink.fromJSON(s));
    if (state.regulators) this.regulators = state.regulators.map(r => Regulator.fromJSON(r));
    if (state.thermalBlocks) this.thermalBlocks = state.thermalBlocks.map(b => ThermalBlock.fromJSON(b));
    if (state.heatExchangers) this.heatExchangers = state.heatExchangers.map(h => HeatExchanger.fromJSON(h));
    if (state.regenerators) this.regenerators = state.regenerators.map(r => RegeneratorMatrix.fromJSON(r));
    if (state.textLabels) this.textLabels = state.textLabels.map(l => TextLabel.fromJSON(l));
    if (state.particleGroups) this.particleGroups = state.particleGroups.map(g => ParticleGroup.fromJSON(g));

    this.elements = [
      ...this.walls,
      ...(this.throttleValves || []),
      ...this.reservoirs,
      ...this.thermalBlocks,
      ...this.heatExchangers,
      ...this.regenerators,
      ...this.sensors,
      ...this.emitters,
      ...this.sinks,
      ...this.regulators,
      ...this.textLabels,
      ...this.particleGroups,
      ...this.pistons
    ];

    if (state.particles) {
      for (let i = 0; i < state.particles.length; i++) {
        const pd = state.particles[i];
        this.addParticle(pd.x, pd.y, pd.vx, pd.vy, pd.mass || 1, pd.groupId || null);
      }
    }

    for (let i = 0; i < this.sensors.length; i++) this.sensors[i].clearHistory();
    this.totalTime = 0;
    this.isPaused = true;

    if (state.cycleSequencer && this.sequencer) {
      this.sequencer.importState(state.cycleSequencer);
      if (this.sequencer.steps.length === 0) {
        this.sequencer.addStep({ name: 'Step 1' });
      }
    } else if (this.sequencer) {
      this.sequencer.reset();
      this.sequencer.steps = [];
      this.sequencer.addStep({ name: 'Step 1' });
      this.sequencer.phases = this.sequencer.steps;
    }

    this._updateStats();
  }

  importState(state, updateProfile = true) {
    this._applyState(state);
    this.initialSnapshot = JSON.stringify(state);
    if (updateProfile || !this.loadedProfileJSON) {
      this.loadedProfileJSON = JSON.stringify(state);
    }
  }

  // Particle Queries & Deletion
  findParticleAt(wx, wy, hitRadius = 10) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const dx = p.pos.x - wx;
      const dy = p.pos.y - wy;
      const r = Math.max(p.radius + 3, hitRadius);
      if (dx * dx + dy * dy <= r * r) {
        return p;
      }
    }
    return null;
  }

  findParticlesInRect(minX, minY, maxX, maxY) {
    const matched = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pos.x >= minX && p.pos.x <= maxX && p.pos.y >= minY && p.pos.y <= maxY) {
        matched.push(p);
      }
    }
    return matched;
  }

  deleteParticles(particlesToDelete) {
    if (!particlesToDelete || particlesToDelete.length === 0) return;
    const deleteSet = new Set(Array.isArray(particlesToDelete) ? particlesToDelete : [particlesToDelete]);
    this.particles = this.particles.filter(p => !deleteSet.has(p));
    this._updateStats();
  }

  // Unified Layer Ordering (Z-Index) across ALL canvas elements
  reorderElements(fromIndex, toIndex) {
    if (
      fromIndex < 0 || fromIndex >= this.elements.length ||
      toIndex < 0 || toIndex >= this.elements.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const [item] = this.elements.splice(fromIndex, 1);
    this.elements.splice(toIndex, 0, item);
  }

  bringToFront(item) {
    const idx = this.elements.indexOf(item);
    if (idx !== -1 && idx < this.elements.length - 1) {
      this.elements.splice(idx, 1);
      this.elements.push(item);
    }
  }

  sendToBack(item) {
    const idx = this.elements.indexOf(item);
    if (idx > 0) {
      this.elements.splice(idx, 1);
      this.elements.unshift(item);
    }
  }

  bringForward(item) {
    const idx = this.elements.indexOf(item);
    if (idx !== -1 && idx < this.elements.length - 1) {
      const temp = this.elements[idx];
      this.elements[idx] = this.elements[idx + 1];
      this.elements[idx + 1] = temp;
    }
  }

  sendBackward(item) {
    const idx = this.elements.indexOf(item);
    if (idx > 0) {
      const temp = this.elements[idx];
      this.elements[idx] = this.elements[idx - 1];
      this.elements[idx - 1] = temp;
    }
  }
}
