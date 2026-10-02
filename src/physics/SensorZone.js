import { appendHistory, lastHistoryTime, resetHistory, HISTORY_INTERVAL } from './HistoryBuffer.js';
import { Vector2 } from './Vector2.js';
import { KB, PRESSURE_SCALE, idealGasPressure } from './Constants.js';

const FACE_WINDOW = 0.3; // s, averaging window of the piston face pressure

export class SensorZone {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.label = options.label || 'Kammer';
    this.x = options.x !== undefined ? options.x : 100;
    this.y = options.y !== undefined ? options.y : 100;
    this.width = options.width !== undefined ? options.width : 200;
    this.height = options.height !== undefined ? options.height : 300;
    this.color = options.color || '#38bdf8';

    // Measurements
    this.particleCount = 0;
    this.temperature = 300;
    this.pressure = 100; // in Pa
    this.density = 0;
    this.volume = this.width * this.height;
    this.kineticEnergy = 0;

    // Drift Velocity Metrics
    this.driftVx = 0;
    this.driftVy = 0;
    this.driftSpeed = 0;
    this.displayDriftSpeed = 0;
    this.driftAngle = 0;

    // Continuous time history for the charts (see HistoryBuffer.js)
    resetHistory(this);

    // Piston bindings: the zone edge facing a piston follows its face. A
    // chamber between two pistons binds one piston per side.
    this.pistonBinding = SensorZone._binding(options.pistonBinding);
    this.pistonBinding2 = SensorZone._binding(options.pistonBinding2);

    // Pressure on the bound piston faces (momentum flux), averaged per history sample
    this.facePressure = null;
    this._faces = [];
    this._faceSamples = []; // { t, impulse } of the bound faces within FACE_WINDOW
  }

  static _binding(b) {
    return b && b.pistonId ? { pistonId: b.pistonId, edge: b.edge || 'right', lockCrossDimension: b.lockCrossDimension !== false } : null;
  }

  contains(pos) {
    return (
      pos.x >= this.x &&
      pos.x <= this.x + this.width &&
      pos.y >= this.y &&
      pos.y <= this.y + this.height
    );
  }

  getArea() {
    return this.width * this.height;
  }

  updateMeasurements(particles, currentTime = 0) {
    let sampleCount = 0, sumVx = 0, sumVy = 0, sumMVx = 0, sumMVy = 0, sumMass = 0, sampleKinetic = 0;
    const speedSamples = [];
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (this.contains(p.pos)) {
        sampleCount++;
        sumVx += p.vel.x; sumVy += p.vel.y;
        sumMVx += p.mass * p.vel.x; sumMVy += p.mass * p.vel.y;
        sumMass += p.mass;
        const spdSq = p.getSpeedSq();
        sampleKinetic += 0.5 * p.mass * spdSq;
        if (speedSamples.length < 500) speedSamples.push(Math.sqrt(spdSq));
      }
    }
    this._processMetrics(sampleCount, sumVx, sumVy, sumMVx, sumMVy, sumMass, sampleKinetic, 1.0, currentTime, speedSamples);
  }

  _processMetrics(sampleCount, sumVx, sumVy, sumMVx, sumMVy, sumMass, sampleKinetic, scaleFactor = 1.0, currentTime = 0, speedSamples = []) {
    const effectiveCount = Math.round(sampleCount * scaleFactor);
    this.particleCount = effectiveCount;
    const area = this.getArea();
    this.density = area > 0 ? (effectiveCount / area) * 1000 : 0;
    this.kineticEnergy = sampleKinetic * scaleFactor;
    this.volume = this.width * this.height;
    this.speedSamples = speedSamples;

    if (sampleCount > 0) {
      const rawMeanVx = sumVx / sampleCount;
      const rawMeanVy = sumVy / sampleCount;

      this.driftVx = this.driftVx * 0.90 + rawMeanVx * 0.10;
      this.driftVy = this.driftVy * 0.90 + rawMeanVy * 0.10;
      this.driftSpeed = Math.hypot(this.driftVx, this.driftVy);
      this.driftAngle = Math.atan2(this.driftVy, this.driftVx);

      const sumThermal = Math.max(0, sampleKinetic - (rawMeanVx * sumMVx + rawMeanVy * sumMVy) + 0.5 * (rawMeanVx * rawMeanVx + rawMeanVy * rawMeanVy) * sumMass);
      this.temperature = Math.max(5, sumThermal / (sampleCount * KB));
      this.pressure = idealGasPressure(effectiveCount, area, this.temperature);

      const vThermal = Math.sqrt((2 * KB * this.temperature) / 1.0);
      const fluctuationThreshold = Math.max(12.0, (vThermal / Math.sqrt(Math.max(1, effectiveCount))) * 0.7);

      if (this.driftSpeed > fluctuationThreshold && this.driftSpeed > 15.0) {
        this.displayDriftSpeed = this.driftSpeed;
      } else {
        this.displayDriftSpeed = 0;
      }
    } else {
      this.driftVx *= 0.85;
      this.driftVy *= 0.85;
      this.driftSpeed = 0;
      this.displayDriftSpeed = 0;
    }

    const last = lastHistoryTime(this);
    if (last === null || currentTime - last >= HISTORY_INTERVAL) {
      this._sampleFacePressure();
      appendHistory(this, {
        t: currentTime, temp: this.temperature, pressure: this.pressure, volume: this.volume,
        count: this.particleCount, kinetic: this.kineticEnergy, drift: this.displayDriftSpeed,
        facePressure: this.facePressure ?? NaN
      });
    }
  }

  clearHistory() {
    resetHistory(this);
    this.facePressure = null;
    this._faceSamples = [];
    this.driftVx = 0;
    this.driftVy = 0;
    this.driftSpeed = 0;
    this.displayDriftSpeed = 0;
  }

  getPistonBindings() {
    return [this.pistonBinding, this.pistonBinding2].filter(b => b && b.pistonId);
  }

  // slot 1 = primary binding, slot 2 = the piston on the opposite side.
  bindToPiston(piston, edge = 'right', lockCrossDimension = true, slot = 1) {
    if (!piston) {
      this.unbindPiston(slot);
      return;
    }
    const binding = { pistonId: piston.id, edge, lockCrossDimension };
    if (slot === 2) this.pistonBinding2 = binding;
    else this.pistonBinding = binding;
    this.updateBoundsFromPistons(id => (id === piston.id ? piston : null));
  }

  // Without a slot both bindings are removed.
  unbindPiston(slot = null) {
    if (slot === null || slot === 1) this.pistonBinding = slot === null ? null : this.pistonBinding2;
    if (slot === null || slot === 1 || slot === 2) this.pistonBinding2 = null;
    this._faces = [];
    this.facePressure = null;
  }

  updateBoundsFromPiston(piston) {
    this.updateBoundsFromPistons(id => (piston && id === piston.id ? piston : null));
  }

  // Moves the bound edges onto the piston faces; `getPiston(id)` resolves a binding.
  updateBoundsFromPistons(getPiston) {
    let left = this.x, right = this.x + this.width, top = this.y, bottom = this.y + this.height;
    const faces = [];
    for (const b of this.getPistonBindings()) {
      const piston = getPiston(b.pistonId);
      if (!piston) continue;
      const pb = piston.getBounds();
      const alongX = b.edge === 'left' || b.edge === 'right';
      if (b.edge === 'right') right = pb.left;
      else if (b.edge === 'left') left = pb.right;
      else if (b.edge === 'bottom') bottom = pb.top;
      else if (b.edge === 'top') top = pb.bottom;
      if (b.lockCrossDimension !== false) {
        if (alongX) { top = pb.top; bottom = pb.bottom; } else { left = pb.left; right = pb.right; }
      }
      // Piston face toward the gas: impulse "Left" is the left/top face (see Engine.getGPUWalls)
      faces.push({ piston, side: (b.edge === 'right' || b.edge === 'bottom') ? 'Left' : 'Right', length: alongX ? piston.height : piston.width });
    }
    this._faces = faces;
    if (faces.length === 0) return;
    if (right - left < 15) {
      if (this.pistonBinding?.edge === 'left' && !this.pistonBinding2) left = right - 15; else right = left + 15;
    }
    if (bottom - top < 15) {
      if (this.pistonBinding?.edge === 'top' && !this.pistonBinding2) top = bottom - 15; else bottom = top + 15;
    }
    this.x = left; this.y = top;
    this.width = right - left; this.height = bottom - top;
    this.volume = this.width * this.height;
  }

  // Pressure on the bound piston faces from the momentum the gas transfers to
  // them (P = F / L, same scale as the gas pressure), averaged over FACE_WINDOW:
  // single samples hold only a few wall hits. The pistons time-stamp their
  // impulse totals with the sim time they were measured at (GPU readbacks
  // arrive frames later), and the average is written to the history sample at
  // the centre of its window: a trailing or delayed average lags behind the
  // volume and biases the P-V work of every stroke. `facePressure` itself is
  // the latest average (for display and conditions).
  _sampleFacePressure() {
    if (this._faces.length === 0) {
      this.facePressure = null;
      this._faceSamples.length = 0;
      return;
    }
    let impulse = 0, length = 0, t = Infinity;
    for (const f of this._faces) {
      impulse += f.piston['impulseTotal' + f.side] || 0;
      length += f.length;
      t = Math.min(t, f.piston.impulseTime ?? 0);
    }
    const win = this._faceSamples;
    const last = win[win.length - 1];
    if (last && (t < last.t || impulse < last.impulse)) win.length = 0; // reset / new piston
    else if (last && t === last.t) return; // no new measurement yet
    win.push({ t, impulse });
    while (win.length > 2 && t - win[1].t >= FACE_WINDOW) win.shift();
    const first = win[0];
    if (t - first.t <= 1e-6 || length <= 0) return;
    this.facePressure = (impulse - first.impulse) / (t - first.t) / length * PRESSURE_SCALE;

    // History sample closest to the window centre
    const centre = 0.5 * (first.t + t);
    const times = this.historyTime;
    let i = times.length - 1;
    while (i > 0 && times[i - 1] >= centre) i--;
    if (i > 0 && centre - times[i - 1] < times[i] - centre) i--;
    if (i >= 0 && Math.abs(times[i] - centre) <= HISTORY_INTERVAL) this.historyFacePressure[i] = this.facePressure;
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: this.color,
      pistonBinding: this.pistonBinding ? { ...this.pistonBinding } : null,
      pistonBinding2: this.pistonBinding2 ? { ...this.pistonBinding2 } : null
    };
  }

  static fromJSON(data) {
    return new SensorZone(data);
  }
}
