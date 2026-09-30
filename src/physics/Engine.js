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
import { GPU_LAYOUT } from './ParticleGPUComputeShader.js';
import { ParticleGPUCompute } from './ParticleGPUCompute.js';
import { KB, WORLD_SIZE, idealGasPressure } from './Constants.js';

// Element class -> Engine list holding its instances (serialization key too).
const ELEMENT_LISTS = [
  [Wall, 'walls'], [ThrottleValve, 'throttleValves'], [Piston, 'pistons'], [Reservoir, 'reservoirs'],
  [SensorZone, 'sensors'], [Emitter, 'emitters'], [Sink, 'sinks'], [Regulator, 'regulators'],
  [ThermalBlock, 'thermalBlocks'], [HeatExchanger, 'heatExchangers'], [RegeneratorMatrix, 'regenerators'],
  [TextLabel, 'textLabels'], [ParticleGroup, 'particleGroups']
];

export class Engine {
  constructor(width = WORLD_SIZE, height = WORLD_SIZE) {
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

    this.subSteps = 4; // per 1/60 s of simulated time, see _subStepsFor()
    this.timeScale = 1.0;
    this.isPaused = true;
    this.simModel = 'hard_sphere'; // 'hard_sphere' or 'lennard_jones'
    this.gravityEnabled = false;
    this.gravity = 350; // px/s^2 (+y downward)
    this.gpuCompute = null;
    this.useGPUCompute = false;
    this.ambientBounds = null;

    // GPU-mode transient state. While simulating on the GPU, `this.particles`
    // holds the edit-time particle set only; live state stays in VRAM.
    this._deferToGPU = false;
    // GPU exchange data per wall segment. Measured impulse goes into pending
    // buffers that are credited exactly once, drained over the following frames.
    // Heat is applied to the elements as soon as it is read back and
    // acknowledged to the GPU per thermal body (see _uploadGPUBodies).
    this._gpuWallPendingFront = new Float64Array(GPU_LAYOUT.MAX_WALLS);  // impulse, particle on +normal side
    this._gpuWallPendingBack = new Float64Array(GPU_LAYOUT.MAX_WALLS);
    this._gpuDrainTime = 0.016;
    this._gpuWallOwners = [];
    this._gpuWallBodies = [];       // thermal body per GPU wall segment, -1 = none
    this._gpuWallTemps = [];        // uploaded temperature per segment (incl. heat deficit)
    this._gpuBodyRefs = [];         // element per wall-owner body index
    this._gpuBodyInvC = new Float32Array(GPU_LAYOUT.MAX_BODIES);
    this._gpuBodyGen = 0;           // bumped when the body assignment changes
    this._gpuBodySigRefs = [];
    this._gpuBodySigSlots = [];
    this._gpuRegulatorQuota = new Uint32Array(GPU_LAYOUT.MAX_REGULATORS);
    this._gpuLastEventTime = 0;
    this._gpuDeadSlots = 0;
    this._gpuReadbacks = new Set();
    
    this.totalTime = 0;
    this.nextParticleId = 1;

    this.stats = {
      particleCount: 0,
      totalKineticEnergy: 0,
      meanSpeed: 0,
      systemTemperature: 0,
      pressure: 0,
      volume: width * height,
      fps: 60
    };

    // System Telemetry History
    this.historyTime = [];
    this.historyTemp = [];
    this.historyPressure = [];
    this.historyVolume = [];
    this.historyCount = [];
    this.historyKineticEnergy = [];
    this.historyDrift = [];
    this.latestSpeedSamples = [];
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
    if (this.gpuCompute) {
      this.gpuCompute.reset();
    }
    this._resetGPUTransientState();
    this.syncWallsToGPU();
    this.syncSinksToGPU();
    this.totalTime = 0;
    this.historyTime = [];
    this.historyTemp = [];
    this.historyPressure = [];
    this.historyVolume = [];
    this.historyCount = [];
    this.historyKineticEnergy = [];
    this.historyDrift = [];
    this.latestSpeedSamples = [];
    if (this.sequencer) {
      this.sequencer.reset();
    }
    this._updateStats();
  }

  addParticle(x, y, vx, vy, mass = 1, groupId = null) {
    if (this._deferToGPU) {
      // Spawned during a GPU step (emitters, regulators): goes straight to VRAM.
      this.gpuCompute.queueParticle(x, y, vx, vy, mass);
      return null;
    }
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

  getPistonById(id) {
    if (!id) return null;
    return this.pistons.find(p => p.id === id) || null;
  }

  updateBoundSensors() {
    for (let i = 0; i < this.sensors.length; i++) {
      const s = this.sensors[i];
      if (s.pistonBinding && s.pistonBinding.pistonId) {
        const p = this.getPistonById(s.pistonBinding.pistonId);
        if (p) {
          s.updateBoundsFromPiston(p);
        } else {
          s.unbindPiston();
        }
      }
    }
  }

  addSensor(x, y, width, height, options = {}) {
    let opts = options;
    if (typeof x === 'object' && x !== null) {
      opts = x;
    } else if (typeof x === 'number') {
      opts = { ...options, x, y, width, height };
    }
    const s = new SensorZone(opts);
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
    this.syncSinksToGPU();
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

  // Registers an element instance in its type list and on top of the z-order.
  addElement(el) {
    const entry = ELEMENT_LISTS.find(([cls]) => el instanceof cls);
    if (!entry) return null;
    this[entry[1]].push(el);
    this.elements.push(el);
    if (el instanceof Sink) this.syncSinksToGPU();
    return el;
  }

  // Deep copy of an element with a fresh id (not registered yet).
  cloneElement(el) {
    const entry = ELEMENT_LISTS.find(([cls]) => el instanceof cls);
    if (!entry) return null;
    const data = JSON.parse(JSON.stringify(el.toJSON()));
    delete data.id;
    const copy = entry[0].fromJSON(data);
    if (el.groupId) copy.groupId = el.groupId;
    return copy;
  }

  _randomGaussian(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  spawnGasRaster(x, y, width, height, count, mass, temperature, velocityMode = 'uniform_speed', groupLabel = null) {
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
        const jx = (Math.random() - 0.5) * Math.min(stepX * 0.25, 2.0);
        const jy = (Math.random() - 0.5) * Math.min(stepY * 0.25, 2.0);
        const px = x + pad + (cols > 1 ? c * stepX : effW * 0.5) + jx;
        const py = y + pad + (rows > 1 ? r * stepY : effH * 0.5) + jy;

        let vx = 0, vy = 0;
        if (velocityMode === 'uniform_speed') {
          const speed = Math.sqrt((2 * KB * Math.max(5, temperature)) / mass);
          const theta = Math.random() * Math.PI * 2;
          vx = speed * Math.cos(theta);
          vy = speed * Math.sin(theta);
        } else {
          const sigma = Math.sqrt((KB * Math.max(5, temperature)) / mass);
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
    const targetSpeed = Math.sqrt((2 * KB * Math.max(5, newT)) / group.mass);
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
    this.syncParticlesToGPU();
    this.syncWallsToGPU();
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
    this.syncParticlesToGPU();
    this.syncWallsToGPU();
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

  enableGPUCompute(gpuCompute) {
    this.gpuCompute = gpuCompute;
    this.useGPUCompute = true;
    this.syncParticlesToGPU();
    this.syncWallsToGPU();
    this.syncSinksToGPU();
  }

  disableGPUCompute() {
    this.useGPUCompute = false;
  }

  isGPUSimulating() {
    return !!(this.gpuCompute && this.useGPUCompute && this.gpuCompute.isSupported);
  }

  // Replaces the GPU particle set with the CPU (edit-time) particle set.
  syncParticlesToGPU() {
    if (this.gpuCompute && this.useGPUCompute && this.particles) {
      this.gpuCompute.uploadParticles(this.particles);
      this._resetGPUTransientState();
    }
  }

  // Called whenever the GPU particle set is replaced: discards event rates and
  // re-derives regulator counts from the (now authoritative) CPU particles.
  _resetGPUTransientState() {
    this._clearGPUEventRates();
    this._gpuRegulatorQuota.fill(0);
    for (let i = 0; i < this.regulators.length; i++) {
      const reg = this.regulators[i];
      let inside = 0;
      for (let j = 0; j < this.particles.length; j++) {
        const p = this.particles[j];
        if (reg.contains(p.pos.x, p.pos.y)) inside++;
      }
      reg.resetGPUCount(inside);
    }
  }

  // Restores a step-back snapshot captured with gpuCompute.captureHistory().
  restoreGPUHistory(slot) {
    if (!this.gpuCompute || !slot) return;
    this.gpuCompute.restoreHistory(slot);
    this._clearGPUEventRates();
  }

  _clearGPUEventRates() {
    this._gpuWallPendingFront.fill(0);
    this._gpuWallPendingBack.fill(0);
    this._gpuLastEventTime = this.totalTime;
    this._gpuDeadSlots = 0;
  }

  // Flattens every particle-blocking element into GPU wall segments. The
  // parallel `_gpuWallOwners` table ({ kind, ref }) routes the per-segment
  // momentum and heat measured on the GPU back to the owning element;
  // `_gpuWallBodies` maps segments to thermal bodies (one per finite-capacity
  // element, reservoirs have none).
  // `atFrameStart`: piston faces are placed where they were before this
  // frame's piston update; the shader then sweeps them with their velocity.
  getGPUWalls(atFrameStart = false) {
    const list = [];
    const owners = [];
    const add = (seg, kind, ref) => { list.push(seg); owners.push({ kind, ref }); };
    const segment = (x1, y1, x2, y2, nx, ny, extra) => Object.assign({
      p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, normal: { x: nx, y: ny },
      thickness: 0, isOpen: false, type: 'standard', allowedDirection: 1,
      temperature: 300, conductivity: 0, vel: { x: 0, y: 0 }
    }, extra);
    // Solid rectangles become four outward-facing zero-thickness edges.
    const addRect = (r, kind, temperature, conductivity) => {
      const x0 = r.x, y0 = r.y, x1 = r.x + r.width, y1 = r.y + r.height;
      const thermal = { temperature, conductivity };
      add(segment(x0, y0, x1, y0, 0, -1, thermal), kind, r);
      add(segment(x0, y1, x1, y1, 0, 1, thermal), kind, r);
      add(segment(x0, y0, x0, y1, -1, 0, thermal), kind, r);
      add(segment(x1, y0, x1, y1, 1, 0, thermal), kind, r);
    };

    for (let i = 0; i < this.walls.length; i++) add(this.walls[i], 'wall', this.walls[i]);

    for (let k = 0; k < this.pistons.length; k++) {
      const p = this.pistons[k];
      const hw = p.width * 0.5;
      const hh = p.height * 0.5;
      const px = atFrameStart && p._frameStartX !== undefined ? p._frameStartX : p.x;
      const py = atFrameStart && p._frameStartY !== undefined ? p._frameStartY : p.y;
      const thermal = { thickness: 6, temperature: p.temperature, conductivity: p.conductivity, dynamic: true };
      if (p.orientation === 'horizontal') {
        const extH = hh + 25;
        const face = Object.assign({ vel: { x: atFrameStart ? p.velocity : 0, y: 0 } }, thermal);
        add(segment(px - hw, py - extH, px - hw, py + extH, -1, 0, face), 'pistonLeft', p);
        add(segment(px + hw, py - extH, px + hw, py + extH, 1, 0, face), 'pistonRight', p);
      } else {
        const extW = hw + 25;
        const face = Object.assign({ vel: { x: 0, y: atFrameStart ? p.velocity : 0 } }, thermal);
        add(segment(px - extW, py - hh, px + extW, py - hh, 0, -1, face), 'pistonLeft', p);
        add(segment(px - extW, py + hh, px + extW, py + hh, 0, 1, face), 'pistonRight', p);
      }
    }

    // Throttle valves: the two wedge wings of the variable orifice
    const throttles = this.throttleValves || [];
    for (let i = 0; i < throttles.length; i++) {
      const tv = throttles[i];
      const disabled = !tv.isActive || tv.openRatio >= 0.999 || tv.wingLength <= 0.5;
      const wing = { thickness: tv.thickness, temperature: tv.temperature, conductivity: tv.conductivity, disabled, dynamic: true };
      add(segment(tv.p1.x, tv.p1.y, tv.wing1End.x, tv.wing1End.y, tv.normal.x, tv.normal.y, wing), 'throttle', tv);
      add(segment(tv.wing2Start.x, tv.wing2Start.y, tv.p2.x, tv.p2.y, tv.normal.x, tv.normal.y, wing), 'throttle', tv);
    }

    for (let i = 0; i < this.reservoirs.length; i++) {
      const r = this.reservoirs[i];
      addRect(r, 'reservoir', r.temperature, r.isActive ? r.conductance : 0);
    }
    for (let i = 0; i < this.thermalBlocks.length; i++) {
      const b = this.thermalBlocks[i];
      addRect(b, 'thermalBlock', b.temperature, b.isActive ? b.conductivity : 0);
    }

    this._gpuWallOwners = owners;
    const bodyOf = new Map();
    const bodyRefs = [];
    this._gpuWallBodies = owners.map(({ kind, ref }) => {
      if (kind === 'reservoir') return -1;
      let body = bodyOf.get(ref);
      if (body === undefined) {
        body = bodyRefs.length;
        bodyOf.set(ref, body);
        bodyRefs.push(ref);
      }
      return body;
    });
    this._gpuBodyRefs = bodyRefs;
    // The GPU gets the true body temperature: heat still in the accumulator at
    // upload time is a deficit below the 5 K display floor (see Wall.update);
    // hiding it would let the body hand out that energy again.
    this._gpuWallTemps = owners.map(({ kind, ref }, i) =>
      (kind === 'reservoir' || !(ref.heatCapacity > 0))
        ? list[i].temperature
        : ref.temperature + (ref.heatAccumulator || 0) / ref.heatCapacity);
    return list;
  }

  syncWallsToGPU(atFrameStart = false) {
    if (this.gpuCompute && this.useGPUCompute) {
      const gpuWalls = this.getGPUWalls(atFrameStart);
      this.gpuCompute.uploadWalls(gpuWalls || [], this._gpuWallBodies, this._gpuWallTemps);
    }
  }

  // Uploads 1 / heat capacity per thermal body: wall owners (index from
  // getGPUWalls) and regenerator slices (SLICE_BODY_BASE + temperature slot).
  // The GPU adds the heat it recorded but the CPU has not applied yet, so it
  // sees the current body temperature despite the readback latency; without
  // this, small-capacity elements overshoot every frame and gain energy.
  _uploadGPUBodies() {
    const gpu = this.gpuCompute;
    const refs = this._gpuBodyRefs;
    const slots = gpu.regeneratorSlotBase;
    const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
    if (!sameList(refs, this._gpuBodySigRefs) || !sameList(slots, this._gpuBodySigSlots)) {
      this._gpuBodySigRefs = refs.slice();
      this._gpuBodySigSlots = slots.slice();
      this._gpuBodyGen++;
      gpu.resetThermalBodies();
    }

    const invC = this._gpuBodyInvC;
    invC.fill(0);
    const inverse = (el, capacity) => (capacity > 0 && el.isActive !== false) ? 1 / capacity : 0;
    for (let b = 0; b < refs.length && b < GPU_LAYOUT.SLICE_BODY_BASE; b++) {
      invC[b] = inverse(refs[b], refs[b].heatCapacity);
    }
    for (let i = 0; i < this.regenerators.length; i++) {
      const base = slots[i];
      if (base === undefined || base < 0) continue;
      const reg = this.regenerators[i];
      const sliceCapacity = Math.max(1, reg.heatCapacity / reg.sliceCount);
      for (let k = 0; k < reg.sliceCount; k++) {
        invC[GPU_LAYOUT.SLICE_BODY_BASE + base + k] = inverse(reg, sliceCapacity);
      }
    }
    gpu.uploadBodies(invC);
  }

  // Structural sink sync (sink added/removed/reset): seeds GPU absorption counters.
  syncSinksToGPU() {
    if (this.gpuCompute && this.useGPUCompute) {
      this.gpuCompute.uploadSinkCounters(this.sinks || []);
    }
  }

  // Queues `count` particle removals inside a regulator zone for the next GPU step.
  requestGPURegulatorRemoval(regulator, count) {
    const idx = this.regulators.indexOf(regulator);
    if (idx >= 0 && idx < this._gpuRegulatorQuota.length && count > 0) {
      this._gpuRegulatorQuota[idx] += count;
    }
  }

  step(dt) {
    if (this.isPaused || dt <= 0) return;

    const effectiveDt = dt * this.timeScale;

    // 0. Precision Cycle Sequencer (Coordinates valves, pistons & thermals per phase)
    if (this.sequencer && this.sequencer.isEnabled) {
      this.sequencer.step(effectiveDt, this);
    }

    // 1. Particle Emitters & Regulators & Throttle Valves (Active in both GPU and CPU modes)
    const gpuMode = this.isGPUSimulating();
    this._deferToGPU = gpuMode;
    try {
      for (let i = 0; i < this.emitters.length; i++) {
        this.emitters[i].update(effectiveDt, this);
      }
      for (let i = 0; i < this.regulators.length; i++) {
        this.regulators[i].update(effectiveDt, this);
      }
    } finally {
      this._deferToGPU = false;
    }
    for (let i = 0; i < (this.throttleValves || []).length; i++) {
      this.throttleValves[i].update(effectiveDt);
    }

    if (gpuMode) {
      this._stepGPU(effectiveDt);
      return;
    }

    const subSteps = this._subStepsFor(effectiveDt);
    const subDt = effectiveDt / subSteps;

    // 2. Sub-step Physics
    for (let step = 0; step < subSteps; step++) {
      this._subStep(subDt);
    }

    this.totalTime += effectiveDt;
    this._updateComponents(effectiveDt);
    for (let i = 0; i < this.sensors.length; i++) this.sensors[i].updateMeasurements(this.particles, this.totalTime);

    this._updateStats();
  }

  // `subSteps` is the number of substeps per 1/60 s of simulated time, so the
  // substep length stays constant regardless of refresh rate and time scale.
  _subStepsFor(dt) {
    return Math.min(64, Math.max(1, Math.ceil(dt * 60 * this.subSteps - 1e-6)));
  }

  _stepGPU(dt) {
    const gpu = this.gpuCompute;
    gpu.flushPendingParticles();
    this._applyGPUEventRates(dt);
    for (let i = 0; i < this.pistons.length; i++) {
      this.pistons[i]._frameStartX = this.pistons[i].x;
      this.pistons[i]._frameStartY = this.pistons[i].y;
    }
    this._updateComponents(dt);

    this.syncWallsToGPU(true);
    gpu.uploadZones({
      sinks: this.sinks, regulators: this.regulators, sensors: this.sensors,
      heatExchangers: this.heatExchangers, regenerators: this.regenerators,
      regulatorQuota: this._gpuRegulatorQuota
    });
    this._gpuRegulatorQuota.fill(0);
    this._uploadGPUBodies();

    const modelType = (this.simModel === 'lennard_jones') ? 1 : 0;
    gpu.step(dt, this.gravityEnabled, this.gravity, 1.0, this.ambientBounds, 380, this._subStepsFor(dt), modelType);
    this.totalTime += dt;
    this._submitGPUReadback();
  }

  // Feeds GPU-measured momentum back into the CPU-side element models, spread
  // evenly over frames at the last measured rate.
  _applyGPUEventRates(dt) {
    const f = Math.min(1, dt / Math.max(dt, this._gpuDrainTime));
    const drain = (buf, i) => {
      const amount = buf[i] * f;
      buf[i] -= amount;
      return amount;
    };

    const owners = this._gpuWallOwners;
    const n = Math.min(owners.length, GPU_LAYOUT.MAX_WALLS);
    for (let i = 0; i < n; i++) {
      const { kind, ref } = owners[i];
      const front = drain(this._gpuWallPendingFront, i);
      const back = drain(this._gpuWallPendingBack, i);
      switch (kind) {
        case 'wall':
          ref.accumulatedImpulse += front + back;
          break;
        case 'pistonLeft':
          ref.accumulatedImpulseLeft += front + back;
          break;
        case 'pistonRight':
          ref.accumulatedImpulseRight += front + back;
          break;
        case 'throttle':
          ref.accumulatedImpulseSide1 += front;
          ref.accumulatedImpulseSide2 += back;
          break;
      }
    }
  }

  _submitGPUReadback() {
    const gpu = this.gpuCompute;
    const deadThreshold = Math.max(32, gpu.count * 0.05);
    const compact = this._gpuDeadSlots >= deadThreshold;
    const info = {
      simTime: this.totalTime,
      bodyGen: this._gpuBodyGen,
      regulatorDelta: this.regulators.slice(0, GPU_LAYOUT.MAX_REGULATORS).map(r => r.gpuDelta)
    };
    const promise = gpu.submitReadback({ compact });
    if (!promise) return null;
    const tracked = promise
      .then(res => { if (res) this._applyGPUReadback(res, info); })
      .finally(() => this._gpuReadbacks.delete(tracked));
    this._gpuReadbacks.add(tracked);
    return tracked;
  }

  // Waits for in-flight readbacks, then forces a fresh one (tests, exports).
  async awaitGPUTelemetry() {
    if (!this.isGPUSimulating()) return false;
    await Promise.all([...this._gpuReadbacks]);
    const promise = this._submitGPUReadback();
    if (promise) await promise;
    return !!promise;
  }

  _applyGPUReadback(res, info) {
    if (res.stale) return;
    const L = GPU_LAYOUT;
    const { stats, counters } = res;

    // Global system
    const g = ParticleGPUCompute.decodeTelemetryTarget(stats, 0);
    this._gpuDeadSlots = res.compacted ? 0 : Math.max(0, res.countAtSubmit - g.count);
    const n = g.count;
    this.stats.particleCount = n;
    this.stats.totalKineticEnergy = g.kineticEnergy;
    this.stats.meanSpeed = n > 0 ? g.sumSpeed / n : 0;
    this.stats.systemTemperature = n > 0 ? g.kineticEnergy / (n * KB) : 0;
    this.latestSpeedSamples = ParticleGPUCompute.histogramToSamples(g.histogram, 1000);
    const drift = n > 0 ? Math.hypot(g.sumVx / n, g.sumVy / n) : 0;
    this._recordHistory(n, this.stats.systemTemperature, g.kineticEnergy, drift);

    // Sensor chambers
    const nSensors = Math.min(this.sensors.length, L.MAX_SENSORS);
    for (let i = 0; i < nSensors; i++) {
      const t = ParticleGPUCompute.decodeTelemetryTarget(stats, 1 + i);
      this.sensors[i]._processMetrics(t.count, t.sumVx, t.sumVy, t.sumMVx, t.sumMVy, t.sumMass,
        t.kineticEnergy, 1.0, this.totalTime, ParticleGPUCompute.histogramToSamples(t.histogram, 500));
    }

    // Regulator zone populations
    const nRegs = Math.min(this.regulators.length, L.MAX_REGULATORS, info.regulatorDelta.length);
    for (let i = 0; i < nRegs; i++) {
      this.regulators[i].applyGPUCount(stats[L.STAT_REG_BASE + i], info.regulatorDelta[i]);
    }

    // Sink absorption (cumulative GPU counters)
    const nSinks = Math.min(this.sinks.length, L.MAX_SINKS);
    for (let i = 0; i < nSinks; i++) {
      const sink = this.sinks[i];
      sink.absorbedCount = counters[L.SINK_ABS_BASE + i];
      if (sink.maxParticles > 0 && sink.absorbedCount >= sink.maxParticles) {
        sink.isActive = false;
      }
    }

    // Wall-segment momentum over the covered sim interval
    const covered = info.simTime - this._gpuLastEventTime;
    this._gpuLastEventTime = info.simTime;
    const raw = (idx) => ParticleGPUCompute.readU64(counters, idx);
    const nWalls = this.gpuCompute.wallCount;
    if (covered > 1e-6) {
      this._gpuDrainTime = covered;
      for (let i = 0; i < nWalls; i++) {
        const b = i * L.WALL_EV_STRIDE;
        this._gpuWallPendingFront[i] += raw(b) / L.EV_SCALE;
        this._gpuWallPendingBack[i] += raw(b + 2) / L.EV_SCALE;
      }
    }

    // Heat goes straight into the elements (applied at their next update) and
    // is acknowledged to the GPU in the same fixed-point units it was counted in.
    const gpu = this.gpuCompute;
    const ack = info.bodyGen === this._gpuBodyGen;
    const owners = this._gpuWallOwners;
    for (let i = 0; i < nWalls && i < owners.length; i++) {
      const b = i * L.WALL_EV_STRIDE;
      const units = raw(b + 4) - raw(b + 6);
      if (units === 0) continue;
      // Reservoirs have infinite heat capacity: nothing to accumulate
      if (owners[i].kind !== 'reservoir') owners[i].ref.addHeat(units / L.EV_SCALE);
      if (ack) gpu.ackBodyHeat(this._gpuWallBodies[i], units);
    }
    const slotBase = gpu.regeneratorSlotBase;
    for (let i = 0; i < this.regenerators.length; i++) {
      const base = slotBase[i];
      if (base === undefined || base < 0) continue;
      const reg = this.regenerators[i];
      for (let k = 0; k < reg.sliceCount; k++) {
        const b = L.SLICE_HEAT_BASE + (base + k) * L.SLICE_EV_STRIDE;
        const units = raw(b) - raw(b + 2);
        if (units === 0) continue;
        reg.addHeatToSlice(k, units / L.EV_SCALE);
        if (ack) gpu.ackBodyHeat(L.SLICE_BODY_BASE + base + k, units);
      }
    }
  }

  // Thermal couplings and element updates shared by the CPU and GPU paths.
  _updateComponents(effectiveDt) {
    // Thermal Coupling: Reservoirs -> Walls
    for (let i = 0; i < this.reservoirs.length; i++) {
      const res = this.reservoirs[i];
      for (let j = 0; j < this.walls.length; j++) {
        res.applyThermalCoupling(this.walls[j], effectiveDt);
      }
    }

    // Thermal Coupling: Walls -> Walls
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

    // Update Components
    for (let i = 0; i < this.walls.length; i++) this.walls[i].update(effectiveDt);
    for (let i = 0; i < this.pistons.length; i++) this.pistons[i].update(effectiveDt, this.totalTime);
    for (let i = 0; i < this.thermalBlocks.length; i++) this.thermalBlocks[i].update(effectiveDt);
    for (let i = 0; i < this.regenerators.length; i++) this.regenerators[i].update(effectiveDt);
    this.updateBoundSensors();
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

    const effRad = p.radius + wall.thickness * 0.5;

    // 1. Continuous Collision Detection (CCD): Check path segment from P_old to P_new
    const oldX = p.pos.x - p.vel.x * dt;
    const oldY = p.pos.y - p.vel.y * dt;
    const vx = p.pos.x - oldX;
    const vy = p.pos.y - oldY;

    const wx = wall.p2.x - wall.p1.x;
    const wy = wall.p2.y - wall.p1.y;

    const denom = vx * wy - vy * wx;

    if (Math.abs(denom) > 1e-6) {
      const dx13 = wall.p1.x - oldX;
      const dy13 = wall.p1.y - oldY;

      const t = (dx13 * wy - dy13 * wx) / denom;
      const u = (dx13 * vy - dy13 * vx) / denom;

      const wallLen = Math.hypot(wx, wy);
      const eps = wallLen > 0 ? (effRad / wallLen) : 0;

      if (t >= 0 && t <= 1.0 && u >= -eps && u <= 1.0 + eps) {
        const vDotN = p.vel.x * wall.normal.x + p.vel.y * wall.normal.y;

        if (wall.type === 'check_valve' || (wall.type === 'relief_valve' && wall.isOpen && wall.reliefMode === 'oneway')) {
          if (vDotN * wall.allowedDirection > 0) return;
        }

        const nx = vDotN < 0 ? wall.normal.x : -wall.normal.x;
        const ny = vDotN < 0 ? wall.normal.y : -wall.normal.y;

        const hitX = oldX + vx * t;
        const hitY = oldY + vy * t;

        const velAlongNormal = p.vel.x * nx + p.vel.y * ny;
        if (velAlongNormal < 0) {
          let newVx = p.vel.x - 2 * velAlongNormal * nx;
          let newVy = p.vel.y - 2 * velAlongNormal * ny;

          if (wall.conductivity > 0) {
            // Surface contacts target 1.5 kB T (2D flux-weighted mean energy), see ParticleGPUComputeShader wallBounce()
            const targetSpeedSq = (3 * KB * wall.temperature) / p.mass;
            const curSpeedSq = newVx * newVx + newVy * newVy;
            const alpha = Math.min(1, wall.conductivity * 0.8);
            const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
            const factor = curSpeedSq > 0.001 ? Math.sqrt(blendSq / curSpeedSq) : 1;

            const eBefore = 0.5 * p.mass * curSpeedSq;
            newVx *= factor;
            newVy *= factor;
            const eAfter = 0.5 * p.mass * (newVx * newVx + newVy * newVy);
            wall.addHeat(-(eAfter - eBefore));
            wall.addConductance(alpha * 1.5 * KB);
          }

          p.vel.x = newVx;
          p.vel.y = newVy;
          wall.recordImpulse(2 * p.mass * Math.abs(velAlongNormal));
        }

        const remainT = (1.0 - t) * dt;
        p.pos.x = hitX + nx * (effRad + 0.05) + p.vel.x * remainT;
        p.pos.y = hitY + ny * (effRad + 0.05) + p.vel.y * remainT;
        return;
      }
    }

    // 2. Discrete Fallback (for resting contact or proximity overlap)
    if (!this._wallClosestHelper) this._wallClosestHelper = { x: 0, y: 0 };
    wall.getClosestPointCoords(p.pos.x, p.pos.y, this._wallClosestHelper);
    const dx = p.pos.x - this._wallClosestHelper.x;
    const dy = p.pos.y - this._wallClosestHelper.y;
    const distSq = dx * dx + dy * dy;

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
          const targetSpeedSq = (3 * KB * wall.temperature) / p.mass;
          const curSpeedSq = newVx * newVx + newVy * newVy;
          const alpha = Math.min(1, wall.conductivity * 0.8);
          const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
          const factor = curSpeedSq > 0.001 ? Math.sqrt(blendSq / curSpeedSq) : 1;

          const eBefore = 0.5 * p.mass * curSpeedSq;
          newVx *= factor;
          newVy *= factor;
          const eAfter = 0.5 * p.mass * (newVx * newVx + newVy * newVy);
          wall.addHeat(-(eAfter - eBefore));
          wall.addConductance(alpha * 1.5 * KB);
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
    const targetTemp = Math.max(5, hx.temperature);
    const targetSpeedSq = (2 * KB * targetTemp) / Math.max(0.01, p.mass);
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

    const sliceTemp = Math.max(5, reg.temperatures[sliceIdx] || 300);
    const targetSpeedSq = (2 * KB * sliceTemp) / Math.max(0.01, p.mass);
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
        reg.addConductanceToSlice(sliceIdx, alpha * KB);
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
        const targetTemp = Math.max(5, block.temperature);
        const targetSpeedSq = (3 * KB * targetTemp) / Math.max(0.01, p.mass);
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
              block.addConductance(alpha * 1.5 * KB);
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
        const targetTemp = Math.max(5, res.temperature);
        const targetSpeedSq = (3 * KB * targetTemp) / Math.max(0.01, p.mass);
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
    let sumVx = 0;
    let sumVy = 0;
    const count = this.particles.length;
    const speedSamples = [];

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const spd = p.getSpeed();
      speedSum += spd;
      sumVx += p.vel.x;
      sumVy += p.vel.y;
      totalE += 0.5 * p.mass * spd * spd;
      if (speedSamples.length < 1000) {
        speedSamples.push(spd);
      }
    }

    this.latestSpeedSamples = speedSamples;
    this.stats.particleCount = count;
    this.stats.totalKineticEnergy = totalE;
    this.stats.meanSpeed = count > 0 ? speedSum / count : 0;
    this.stats.systemTemperature = count > 0 ? totalE / (count * KB) : 0;
    const globalDrift = count > 0 ? Math.hypot(sumVx / count, sumVy / count) : 0;
    this._recordHistory(count, this.stats.systemTemperature, totalE, globalDrift);
  }

  // Appends one sample to the global time series (throttled to ~22 Hz sim time).
  // Also sets stats.volume/pressure (whole world, same formula as sensor zones).
  _recordHistory(count, temperature, kineticEnergy, drift) {
    this.stats.volume = this.width * this.height;
    this.stats.pressure = idealGasPressure(count, this.stats.volume, temperature);
    if (!this.historyTime) return;
    const last = this.historyTime.length > 0 ? this.historyTime[this.historyTime.length - 1] : null;
    if (last !== null && this.totalTime - last < 0.045) return;
    this.historyTime.push(this.totalTime);
    this.historyTemp.push(temperature);
    this.historyPressure.push(this.stats.pressure);
    this.historyVolume.push(this.stats.volume);
    this.historyCount.push(count);
    this.historyKineticEnergy.push(kineticEnergy);
    this.historyDrift.push(drift);

    if (this.historyTime.length > 600) {
      this.historyTime.shift();
      this.historyTemp.shift();
      this.historyPressure.shift();
      this.historyVolume.shift();
      this.historyCount.shift();
      this.historyKineticEnergy.shift();
      this.historyDrift.shift();
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
      elementOrder: this.elements.map(el => el.id),
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
    // Restore the saved z-order (files without it keep the type order).
    if (Array.isArray(state.elementOrder)) {
      const rank = new Map(state.elementOrder.map((id, i) => [id, i]));
      const fallback = state.elementOrder.length;
      this.elements.sort((a, b) => (rank.get(a.id) ?? fallback) - (rank.get(b.id) ?? fallback));
    }

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

    this.syncParticlesToGPU();
    this.syncWallsToGPU();
    this.syncSinksToGPU();
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
    this.syncParticlesToGPU();
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
