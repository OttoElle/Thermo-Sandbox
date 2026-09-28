import { particleComputeWGSL, GPU_LAYOUT } from './ParticleGPUComputeShader.js';

// Bindings each entry point statically uses (pipelines use layout: 'auto').
const PIPELINE_BINDINGS = {
  clearCells: [0, 8, 10],
  countCells: [0, 1, 5, 10],
  scanBlocks: [4, 11],
  scanTotals: [0, 11],
  scanAdd: [4, 11],
  scatter: [0, 1, 2, 4, 5, 8],
  pairs: [0, 1, 4, 5],
  integrate: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  telemetry: [0, 1, 7, 9],
  advance: [8],
  compact: [0, 1, 2, 8],
  compactTail: [0, 2, 8]
};

const MAX_STAGING_BUFFERS = 3;

function segmentPointDistance(a, b, px, py) {
  const abx = b.x - a.x, aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  const t = lenSq > 1e-9 ? Math.max(0, Math.min(1, ((px - a.x) * abx + (py - a.y) * aby) / lenSq)) : 0;
  return Math.hypot(a.x + t * abx - px, a.y + t * aby - py);
}
const HISTORY_CAPACITY = 16384;

/**
 * WebGPU particle simulation. While a simulation runs, the GPU buffers are the
 * single source of truth for particle state: new particles are queued and
 * appended, removals (sinks, regulators) happen on the GPU, and the CPU only
 * receives compact telemetry via submitReadback().
 *
 * `epoch` increments whenever the particle set is replaced (upload, reset,
 * history restore, topology change). Readbacks submitted in an older epoch are
 * flagged `stale` and must be ignored.
 */
export class ParticleGPUCompute {
  constructor(device) {
    this.device = device;
    this.isSupported = !!device;

    this.capacity = GPU_LAYOUT.CAPACITY;
    this.count = 0;               // occupied slots (live + dead)
    this.maxWalls = GPU_LAYOUT.MAX_WALLS;
    this.wallCount = 0;
    this.sinkCount = 0;
    this.regulatorCount = 0;
    this.sensorCount = 0;
    this.thermalZoneCount = 0;
    this.regeneratorSlotBase = []; // first thermalTemps slot per regenerator, -1 if not uploaded
    this.pingPong = 0; // 0: A is in, B is out; 1: B is in, A is out

    this.gridTableSize = GPU_LAYOUT.MIN_GRID_TABLE; // resized per frame, see _gridTableSizeFor()
    this.cellSize = 16.0;

    this.epoch = 0;
    this.compactPending = false;

    this._pending = new Float32Array(1024 * GPU_LAYOUT.PARTICLE_FLOATS);
    this._pendingCount = 0;

    this.uniformData = new ArrayBuffer(112);
    this.uniformFloats = new Float32Array(this.uniformData);
    this.uniformU32 = new Uint32Array(this.uniformData);
    this._params = {
      dt: 0, gravityEnabled: false, gravity: 350, damping: 1.0, bounds: null,
      maxSpeedReference: 380, subSteps: 4, simModel: 0
    };

    this._wallData = new ArrayBuffer(this.maxWalls * 64);
    this._wallF32 = new Float32Array(this._wallData);
    this._wallU32 = new Uint32Array(this._wallData);

    this._zoneData = new ArrayBuffer(GPU_LAYOUT.MAX_ZONES * GPU_LAYOUT.ZONE_WORDS * 4);
    this._zoneF32 = new Float32Array(this._zoneData);
    this._zoneU32 = new Uint32Array(this._zoneData);
    this._thermalTemps = new Float32Array(GPU_LAYOUT.MAX_SLICES);
    // Wall broadphase grid (see _updateWallGrid); W = 0 means test every wall
    this._wallGrid = { W: 0, H: 0, cell: 1, originX: 0, originY: 0, globalCount: 0 };
    this._wallGridSignature = null;

    this._statBytes = GPU_LAYOUT.STAT_WORDS * 4;
    this._counterBytes = GPU_LAYOUT.COUNTER_WORDS * 4;
    this._eventBytes = GPU_LAYOUT.SINK_ABS_BASE * 4; // wall + slice events, cleared per readback
    this._stagingFree = [];
    this._stagingTotal = 0;
    this._historyPool = [];

    if (this.isSupported) {
      this._initBuffers();
      this._initPipeline();
    }
  }

  _initBuffers() {
    const dev = this.device, cap = this.capacity;
    const make = (label, size, usage) => dev.createBuffer({ label, size, usage });
    const s = GPUBufferUsage.STORAGE;
    const particleUsage = s | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    this.bufferA = make('ComputeBufA', cap * 32, particleUsage);
    this.bufferB = make('ComputeBufB', cap * 32, particleUsage);
    this.uniformBuffer = make('ComputeUniforms', 112, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    this.wallsBuffer = make('ComputeWalls', this.maxWalls * 64, s | GPUBufferUsage.COPY_DST);
    this.cellBuffer = make('ComputeGridCells', GPU_LAYOUT.MAX_GRID_TABLE * 2 * 4, s);
    this.blockSumsBuffer = make('ComputeScanBlockSums', GPU_LAYOUT.MAX_SCAN_BLOCKS * 4, s);
    this.gridLinksBuffer = make('ComputeGridLinks', cap * 2 * 4, s);
    this.auxBuffer = make('ComputeAux', GPU_LAYOUT.AUX_WORDS * 4, s | GPUBufferUsage.COPY_DST);
    this.zonesBuffer = make('ComputeZones', this._zoneData.byteLength, s | GPUBufferUsage.COPY_DST);
    this.countersBuffer = make('ComputeCounters', this._counterBytes, s | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.statsBuffer = make('ComputeStats', this._statBytes, s | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
  }

  _initPipeline() {
    const device = this.device;
    const module = device.createShaderModule({ label: 'ParticleComputeShader', code: particleComputeWGSL });
    module.getCompilationInfo().then(info => {
      for (const m of info.messages) {
        if (m.type === 'error') console.error(`ParticleComputeShader:${m.lineNum}:${m.linePos} ${m.message}`);
      }
    });
    const makePipe = (entryPoint) => device.createComputePipeline({
      label: `ParticleCompute_${entryPoint}`, layout: 'auto', compute: { module, entryPoint }
    });
    this.pipelines = {
      clearCells: makePipe('cs_clear_cells'),
      countCells: makePipe('cs_count_cells'),
      scanBlocks: makePipe('cs_scan_blocks'),
      scanTotals: makePipe('cs_scan_totals'),
      scanAdd: makePipe('cs_scan_add'),
      scatter: makePipe('cs_scatter'),
      pairs: makePipe('cs_find_pairs'),
      integrate: makePipe('cs_integrate'),
      telemetry: makePipe('cs_telemetry'),
      advance: makePipe('cs_advance_substep'),
      compact: makePipe('cs_compact'),
      compactTail: makePipe('cs_compact_tail')
    };
    // One bind group set per ping-pong direction: [A->B, B->A]
    // PIPELINE_BINDINGS must match each entry point's auto layout exactly; a
    // mismatch silently turns every dispatch into a no-op, so surface it here.
    device.pushErrorScope('validation');
    this.bindGroups = [
      this._makeBindGroups(this.bufferA, this.bufferB),
      this._makeBindGroups(this.bufferB, this.bufferA)
    ];
    device.popErrorScope().then(err => {
      if (err) console.error(`ParticleGPUCompute pipeline/bind group setup: ${err.message}`);
    });
  }

  // `cur` holds the particle state between substeps; `other` receives the
  // cell-sorted copy that pairs/integrate read before writing back to `cur`.
  _makeBindGroups(cur, other) {
    const shared = {
      0: this.uniformBuffer, 3: this.wallsBuffer, 4: this.cellBuffer, 5: this.gridLinksBuffer,
      6: this.auxBuffer, 7: this.zonesBuffer, 8: this.countersBuffer, 9: this.statsBuffer,
      10: this.cellBuffer, 11: this.blockSumsBuffer
    };
    const io = {
      countCells: [cur, null], scatter: [cur, other], pairs: [other, null], integrate: [other, cur],
      telemetry: [cur, null], compact: [cur, other], compactTail: [null, other]
    };
    const groups = {};
    for (const name of Object.keys(PIPELINE_BINDINGS)) {
      const [inBuf, outBuf] = io[name] || [null, null];
      const resources = Object.assign({ 1: inBuf, 2: outBuf }, shared);
      groups[name] = this.device.createBindGroup({
        label: `ParticleCompute_${name}`,
        layout: this.pipelines[name].getBindGroupLayout(0),
        entries: PIPELINE_BINDINGS[name].map(binding => ({ binding, resource: { buffer: resources[binding] } }))
      });
    }
    return groups;
  }

  // Power of two >= 2 * slots so buckets stay short, clamped to the table limits.
  _gridTableSizeFor(count) {
    let size = GPU_LAYOUT.MIN_GRID_TABLE;
    while (size < count * 2 && size < GPU_LAYOUT.MAX_GRID_TABLE) size *= 2;
    return size;
  }

  _currentBindGroups() {
    return this.bindGroups[this.pingPong];
  }

  // Invalidates in-flight readbacks and transient GPU accumulators.
  _bumpEpoch() {
    this.epoch++;
    this.compactPending = false;
    this._pendingCount = 0;
    if (this.isSupported) {
      this.device.queue.writeBuffer(this.countersBuffer, 0, new Uint8Array(this._eventBytes));
    }
  }

  reset() {
    this.count = 0;
    this._bumpEpoch();
  }

  uploadWalls(walls) {
    if (!this.isSupported || !walls) return;
    const count = Math.min(walls.length, this.maxWalls);
    if (count !== this.wallCount) this._bumpEpoch();
    this.wallCount = count;
    if (count === 0) return;

    const f32 = this._wallF32;
    const u32 = this._wallU32;
    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const w = walls[i];
      f32[ptr + 0] = w.p1 ? w.p1.x : 0;
      f32[ptr + 1] = w.p1 ? w.p1.y : 0;
      f32[ptr + 2] = w.p2 ? w.p2.x : 0;
      f32[ptr + 3] = w.p2 ? w.p2.y : 0;
      f32[ptr + 4] = w.normal ? w.normal.x : 0;
      f32[ptr + 5] = w.normal ? w.normal.y : 0;
      f32[ptr + 6] = w.thickness !== undefined ? w.thickness : 4;
      // Disabled segments (inactive throttle, degenerate wing) behave like an open valve.
      u32[ptr + 7] = (w.isOpen || w.disabled) ? 1 : 0;

      let typeCode = 0;
      if (w.disabled || w.type === 'manual_valve') typeCode = 1;
      else if (w.type === 'check_valve') typeCode = 2;
      else if (w.type === 'relief_valve') {
        // An open bidirectional relief valve lets flow pass both ways, like an open manual valve.
        typeCode = (w.isOpen && w.reliefMode === 'bidirectional') ? 1 : 3;
      }
      u32[ptr + 8] = typeCode;

      f32[ptr + 9] = w.allowedDirection !== undefined ? w.allowedDirection : 1.0;
      f32[ptr + 10] = w.temperature !== undefined ? w.temperature : 300.0;
      f32[ptr + 11] = w.conductivity !== undefined ? w.conductivity : 0.0;
      f32[ptr + 12] = w.vel ? w.vel.x : (w.velX || 0);
      f32[ptr + 13] = w.vel ? w.vel.y : (w.velY || 0);
      f32[ptr + 14] = 0;
      f32[ptr + 15] = 0;
      ptr += 16;
    }
    this.device.queue.writeBuffer(this.wallsBuffer, 0, this._wallData, 0, count * 64);
    this._updateWallGrid(walls, count);
  }

  // Rebuilds the wall broadphase when the static wall geometry or the set of
  // dynamic segments changed. Dynamic segments ('dynamic: true': piston faces,
  // throttle wings) go into a global list tested by every particle.
  _updateWallGrid(walls, count) {
    const L = GPU_LAYOUT;
    let h = count >>> 0;
    const mix = (v) => { h = Math.imul(h ^ (Math.round(v * 16) | 0), 16777619) >>> 0; };
    for (let i = 0; i < count; i++) {
      const w = walls[i];
      if (w.dynamic) { mix(-1 - i); continue; }
      mix(w.p1.x); mix(w.p1.y); mix(w.p2.x); mix(w.p2.y); mix(w.thickness !== undefined ? w.thickness : 4);
    }
    if (h === this._wallGridSignature) return;
    this._wallGridSignature = h;

    const global = [];
    const statics = [];
    for (let i = 0; i < count; i++) (walls[i].dynamic ? global : statics).push(i);
    const pad = (w) => L.WALL_GRID_MARGIN + (w.thickness !== undefined ? w.thickness : 4) * 0.5;

    const grid = this._wallGrid;
    grid.globalCount = global.length;
    if (statics.length === 0) {
      Object.assign(grid, { W: 1, H: 1, cell: 1, originX: -1e9, originY: -1e9 });
      const ranges = new Uint32Array([global.length, 0]);
      this.device.queue.writeBuffer(this.auxBuffer, L.AUX_RANGE_BASE * 4, ranges);
      if (global.length) this.device.queue.writeBuffer(this.auxBuffer, L.AUX_LIST_BASE * 4, new Uint32Array(global));
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of statics) {
      const w = walls[i], r = pad(w);
      minX = Math.min(minX, w.p1.x - r, w.p2.x - r); maxX = Math.max(maxX, w.p1.x + r, w.p2.x + r);
      minY = Math.min(minY, w.p1.y - r, w.p2.y - r); maxY = Math.max(maxY, w.p1.y + r, w.p2.y + r);
    }
    const dim = L.MAX_WALL_GRID_DIM;
    const cell = Math.max(32, Math.max(maxX - minX, maxY - minY) / (dim - 0.5));
    const W = Math.min(dim, Math.max(1, Math.ceil((maxX - minX) / cell)));
    const H = Math.min(dim, Math.max(1, Math.ceil((maxY - minY) / cell)));

    // A wall goes into every cell whose centre lies within pad + half diagonal of it
    const halfDiag = cell * Math.SQRT1_2;
    const cells = Array.from({ length: W * H }, () => []);
    let refs = 0;
    for (const i of statics) {
      const w = walls[i], r = pad(w);
      const gx0 = Math.max(0, Math.floor((Math.min(w.p1.x, w.p2.x) - r - minX) / cell));
      const gx1 = Math.min(W - 1, Math.floor((Math.max(w.p1.x, w.p2.x) + r - minX) / cell));
      const gy0 = Math.max(0, Math.floor((Math.min(w.p1.y, w.p2.y) - r - minY) / cell));
      const gy1 = Math.min(H - 1, Math.floor((Math.max(w.p1.y, w.p2.y) + r - minY) / cell));
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const cx = minX + (gx + 0.5) * cell, cy = minY + (gy + 0.5) * cell;
          if (segmentPointDistance(w.p1, w.p2, cx, cy) <= r + halfDiag) {
            cells[gx + gy * W].push(i);
            refs++;
          }
        }
      }
    }
    if (global.length + refs > L.MAX_WALL_REFS) {
      Object.assign(grid, { W: 0, H: 0 }); // too many references: test every wall
      return;
    }

    const ranges = new Uint32Array(2 * W * H);
    const list = new Uint32Array(global.length + refs);
    list.set(global);
    let offset = global.length;
    for (let c = 0; c < cells.length; c++) {
      ranges[2 * c] = offset;
      ranges[2 * c + 1] = cells[c].length;
      list.set(cells[c], offset);
      offset += cells[c].length;
    }
    Object.assign(grid, { W, H, cell, originX: minX, originY: minY });
    this.device.queue.writeBuffer(this.auxBuffer, L.AUX_RANGE_BASE * 4, ranges);
    this.device.queue.writeBuffer(this.auxBuffer, L.AUX_LIST_BASE * 4, list);
  }

  _writeZone(slot, x, y, w, h, active, direction, tempFilterMode, filterTemperature, maxCount) {
    const base = slot * GPU_LAYOUT.ZONE_WORDS;
    const f32 = this._zoneF32, u32 = this._zoneU32;
    f32[base + 0] = x;
    f32[base + 1] = y;
    f32[base + 2] = x + w;
    f32[base + 3] = y + h;
    u32[base + 4] = active ? 1 : 0;
    u32[base + 5] = direction;
    u32[base + 6] = tempFilterMode;
    f32[base + 7] = filterTemperature;
    u32[base + 8] = maxCount;
  }

  // Per-frame upload of sink, regulator, sensor and thermal-zone rectangles,
  // thermal slice temperatures and the regulator removal quotas.
  uploadZones({ sinks = [], regulators = [], sensors = [], heatExchangers = [], regenerators = [], regulatorQuota = null } = {}) {
    if (!this.isSupported) return;
    const L = GPU_LAYOUT;

    this.sinkCount = Math.min(sinks.length, L.MAX_SINKS);
    for (let i = 0; i < this.sinkCount; i++) {
      const s = sinks[i];
      let dirCode = 0;
      if (s.direction === 'right') dirCode = 1;
      else if (s.direction === 'left') dirCode = 2;
      else if (s.direction === 'down') dirCode = 3;
      else if (s.direction === 'up') dirCode = 4;
      let tempCode = 0;
      if (s.tempFilterMode === 'above') tempCode = 1;
      else if (s.tempFilterMode === 'below') tempCode = 2;
      const maxCount = s.maxParticles > 0 ? s.maxParticles : 0;
      this._writeZone(L.ZONE_SINK_BASE + i, s.x, s.y, s.width, s.height,
        s.isActive !== false, dirCode, tempCode, s.filterTemperature || 300, maxCount);
    }

    this.regulatorCount = Math.min(regulators.length, L.MAX_REGULATORS);
    for (let i = 0; i < this.regulatorCount; i++) {
      const r = regulators[i];
      this._writeZone(L.ZONE_REG_BASE + i, r.x, r.y, r.width, r.height, true, 0, 0, 0, 0);
    }

    this.sensorCount = Math.min(sensors.length, L.MAX_SENSORS);
    for (let i = 0; i < this.sensorCount; i++) {
      const s = sensors[i];
      this._writeZone(L.ZONE_SENSOR_BASE + i, s.x, s.y, s.width, s.height, true, 0, 0, 0, 0);
    }

    // Thermal zones: heat exchangers use one slot, regenerators one slot per slice.
    let zone = 0;
    let slot = 0;
    const temps = this._thermalTemps;
    for (let i = 0; i < heatExchangers.length && zone < L.MAX_THERMAL_ZONES && slot < L.MAX_SLICES; i++) {
      const hx = heatExchangers[i];
      temps[slot] = hx.temperature;
      this._writeThermalZone(zone++, hx, 0, 1, hx.conductivity || 0.6, slot++, false);
    }
    this.regeneratorSlotBase.length = regenerators.length;
    for (let i = 0; i < regenerators.length; i++) {
      const reg = regenerators[i];
      const slices = Math.max(1, reg.sliceCount | 0);
      if (zone >= L.MAX_THERMAL_ZONES || slot + slices > L.MAX_SLICES) {
        this.regeneratorSlotBase[i] = -1;
        continue;
      }
      this.regeneratorSlotBase[i] = slot;
      for (let k = 0; k < slices; k++) temps[slot + k] = reg.temperatures[k];
      const axis = reg.orientation === 'horizontal' ? 0 : 1;
      this._writeThermalZone(zone++, reg, axis, slices, reg.conductivity || 0.7, slot, true);
      slot += slices;
    }
    this.thermalZoneCount = zone;

    this.device.queue.writeBuffer(this.zonesBuffer, 0, this._zoneData);
    if (slot > 0) this.device.queue.writeBuffer(this.auxBuffer, 0, temps, 0, slot);
    if (regulatorQuota) {
      this.device.queue.writeBuffer(this.countersBuffer, L.REG_QUOTA_BASE * 4,
        regulatorQuota.buffer, regulatorQuota.byteOffset, L.MAX_REGULATORS * 4);
    }
  }

  _writeThermalZone(zone, el, axis, slices, conductivity, slot, recordHeat) {
    const L = GPU_LAYOUT;
    const idx = L.ZONE_THERMAL_BASE + zone;
    this._writeZone(idx, el.x, el.y, el.width, el.height, el.isActive !== false, axis, slices, conductivity, slot);
    this._zoneU32[idx * L.ZONE_WORDS + 9] = recordHeat ? 1 : 0;
  }

  // Structural sink sync: seeds the cumulative GPU absorption counters.
  uploadSinkCounters(sinks = []) {
    if (!this.isSupported) return;
    const L = GPU_LAYOUT;
    const data = new Uint32Array(L.MAX_SINKS);
    const n = Math.min(sinks.length, L.MAX_SINKS);
    for (let i = 0; i < n; i++) data[i] = Math.max(0, sinks[i].absorbedCount | 0);
    this.device.queue.writeBuffer(this.countersBuffer, L.SINK_ABS_BASE * 4, data);
    this._bumpEpoch();
  }

  _packParticles(particles, count) {
    const packed = new Float32Array(count * GPU_LAYOUT.PARTICLE_FLOATS);
    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      packed[ptr++] = p.pos ? p.pos.x : 0;
      packed[ptr++] = p.pos ? p.pos.y : 0;
      packed[ptr++] = p.vel ? p.vel.x : 0;
      packed[ptr++] = p.vel ? p.vel.y : 0;
      packed[ptr++] = p.radius || 3.5;
      packed[ptr++] = p.mass || 1.0;
      packed[ptr++] = 0.0;
      packed[ptr++] = 0.0;
    }
    return packed;
  }

  // Replaces the whole GPU particle set.
  uploadParticles(particles) {
    if (!this.isSupported || !particles) return;
    this._bumpEpoch();
    this.count = Math.min(particles.length, this.capacity);
    if (this.count === 0) return;
    const packed = this._packParticles(particles, this.count);
    this.device.queue.writeBuffer(this.getOutputBuffer(), 0, packed);
  }

  // Queues a particle for GPU append; flushed at the start of the next step.
  queueParticle(x, y, vx, vy, mass = 1) {
    const F = GPU_LAYOUT.PARTICLE_FLOATS;
    if ((this._pendingCount + 1) * F > this._pending.length) {
      const grown = new Float32Array(this._pending.length * 2);
      grown.set(this._pending);
      this._pending = grown;
    }
    const m = Math.max(0.1, mass);
    const base = this._pendingCount * F;
    this._pending[base + 0] = x;
    this._pending[base + 1] = y;
    this._pending[base + 2] = vx;
    this._pending[base + 3] = vy;
    this._pending[base + 4] = 3.5 * Math.sqrt(m);
    this._pending[base + 5] = m;
    this._pending[base + 6] = 0;
    this._pending[base + 7] = 0;
    this._pendingCount++;
  }

  get pendingCount() {
    return this._pendingCount;
  }

  // Appends are deferred while a compaction is in flight because the final
  // slot count is only known once its readback resolves.
  flushPendingParticles() {
    if (!this.isSupported || this._pendingCount === 0 || this.compactPending) return;
    const n = Math.min(this._pendingCount, this.capacity - this.count);
    if (n > 0) {
      const F = GPU_LAYOUT.PARTICLE_FLOATS;
      this.device.queue.writeBuffer(this.getOutputBuffer(), this.count * 32, this._pending, 0, n * F);
      this.count += n;
    }
    this._pendingCount = 0;
  }

  _writeUniforms() {
    const P = this._params;
    this.gridTableSize = this._gridTableSizeFor(this.count);
    const bounds = P.bounds;
    const hasBounds = !!(bounds && typeof bounds.minX === 'number' && typeof bounds.maxX === 'number');
    const subSteps = Math.max(1, P.subSteps | 0);
    this.uniformFloats[0] = P.dt / subSteps;
    this.uniformFloats[1] = P.gravity;
    this.uniformU32[2] = P.gravityEnabled ? 1 : 0;
    this.uniformFloats[3] = P.damping;
    this.uniformU32[4] = this.count;
    this.uniformFloats[5] = P.maxSpeedReference;
    this.uniformU32[6] = this.wallCount;
    this.uniformU32[7] = subSteps;
    this.uniformU32[8] = hasBounds ? 1 : 0;
    this.uniformFloats[9] = this.cellSize;
    this.uniformU32[10] = this.gridTableSize;
    this.uniformU32[11] = this.sinkCount;
    this.uniformFloats[12] = hasBounds ? bounds.minX : 0;
    this.uniformFloats[13] = hasBounds ? bounds.minY : 0;
    this.uniformFloats[14] = hasBounds ? bounds.maxX : 2500;
    this.uniformFloats[15] = hasBounds ? bounds.maxY : 2500;
    this.uniformU32[16] = P.simModel ? 1 : 0;
    this.uniformU32[17] = this.regulatorCount;
    this.uniformU32[18] = this.sensorCount;
    this.uniformU32[19] = this.thermalZoneCount;
    // Square-ish table: width = 2^ceil(log2(size) / 2)
    this.uniformU32[20] = 1 << Math.ceil(Math.log2(this.gridTableSize) / 2);
    const wg = this._wallGrid;
    this.uniformU32[21] = wg.W;
    this.uniformU32[22] = wg.H;
    this.uniformFloats[23] = wg.cell;
    this.uniformFloats[24] = wg.originX;
    this.uniformFloats[25] = wg.originY;
    this.uniformFloats[26] = GPU_LAYOUT.WALL_GRID_MARGIN;
    this.uniformU32[27] = wg.globalCount;
    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);
  }

  step(dt, gravityEnabled = false, gravity = 350, damping = 1.0, bounds = null, maxSpeedReference = 380, subSteps = 4, simModel = 0) {
    Object.assign(this._params, { dt, gravityEnabled, gravity, damping, bounds, maxSpeedReference, subSteps, simModel });
    if (!this.isSupported || this.count === 0) return this.getOutputBuffer();

    this._writeUniforms();
    const effectiveSubSteps = Math.max(1, subSteps | 0);
    const cellWorkgroups = Math.ceil(this.gridTableSize / GPU_LAYOUT.WG);
    const scanBlocks = this.gridTableSize / GPU_LAYOUT.SCAN_BLOCK;
    const particleWorkgroups = Math.ceil(this.count / GPU_LAYOUT.WG);

    this.device.queue.writeBuffer(this.countersBuffer, GPU_LAYOUT.SUBSTEP_IDX * 4, new Uint32Array(1));
    const encoder = this.device.createCommandEncoder({ label: 'ParticleComputeEncoder' });
    // A single pass: WebGPU synchronizes storage writes between dispatches.
    const pass = encoder.beginComputePass({ label: 'ParticleComputeSubSteps' });
    const bg = this._currentBindGroups();
    const dispatch = (name, workgroups) => {
      pass.setPipeline(this.pipelines[name]);
      pass.setBindGroup(0, bg[name]);
      pass.dispatchWorkgroups(workgroups);
    };
    for (let s = 0; s < effectiveSubSteps; s++) {
      // Cell-sorted grid: count -> prefix scan -> scatter into `other` in bucket order
      dispatch('clearCells', cellWorkgroups);
      dispatch('countCells', particleWorkgroups);
      dispatch('scanBlocks', scanBlocks);
      dispatch('scanTotals', 1);
      dispatch('scanAdd', scanBlocks);
      dispatch('scatter', particleWorkgroups);

      pass.setPipeline(this.pipelines.pairs);
      pass.setBindGroup(0, bg.pairs);
      pass.dispatchWorkgroups(particleWorkgroups);

      pass.setPipeline(this.pipelines.integrate);
      pass.setBindGroup(0, bg.integrate);
      pass.dispatchWorkgroups(particleWorkgroups);

      pass.setPipeline(this.pipelines.advance);
      pass.setBindGroup(0, bg.advance);
      pass.dispatchWorkgroups(1);
    }
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    return this.getOutputBuffer();
  }

  /**
   * Runs the telemetry reduction (optionally preceded by a compaction) and
   * reads back stats + event counters. Wall event counters are cleared in the
   * same submission, so each result covers exactly the steps since the
   * previous readback. Returns null when all staging buffers are busy.
   */
  submitReadback({ compact = false } = {}) {
    if (!this.isSupported) return null;
    let staging = this._stagingFree.pop();
    if (!staging) {
      if (this._stagingTotal >= MAX_STAGING_BUFFERS) return null;
      staging = this.device.createBuffer({
        label: 'ComputeReadbackStaging',
        size: this._statBytes + this._counterBytes,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      });
      this._stagingTotal++;
    }

    const L = GPU_LAYOUT;
    const epoch = this.epoch;
    const countAtSubmit = this.count;
    const workgroups = Math.ceil(this.count / L.WG);
    this._writeUniforms();

    const encoder = this.device.createCommandEncoder({ label: 'ComputeReadbackEncoder' });
    let compacted = false;
    if (compact && !this.compactPending && this.count > 0) {
      encoder.clearBuffer(this.countersBuffer, L.COMPACT_IDX * 4, 4);
      const bg = this._currentBindGroups();
      const pass = encoder.beginComputePass({ label: 'ParticleCompaction' });
      pass.setPipeline(this.pipelines.compact);
      pass.setBindGroup(0, bg.compact);
      pass.dispatchWorkgroups(workgroups);
      pass.setPipeline(this.pipelines.compactTail);
      pass.setBindGroup(0, bg.compactTail);
      pass.dispatchWorkgroups(workgroups);
      pass.end();
      this.pingPong = 1 - this.pingPong;
      this.compactPending = true;
      compacted = true;
    }

    encoder.clearBuffer(this.statsBuffer);
    if (this.count > 0) {
      const pass = encoder.beginComputePass({ label: 'ParticleTelemetry' });
      pass.setPipeline(this.pipelines.telemetry);
      pass.setBindGroup(0, this._currentBindGroups().telemetry);
      pass.dispatchWorkgroups(workgroups);
      pass.end();
    }
    encoder.copyBufferToBuffer(this.statsBuffer, 0, staging, 0, this._statBytes);
    encoder.copyBufferToBuffer(this.countersBuffer, 0, staging, this._statBytes, this._counterBytes);
    encoder.clearBuffer(this.countersBuffer, 0, this._eventBytes);
    this.device.queue.submit([encoder.finish()]);

    return staging.mapAsync(GPUMapMode.READ).then(() => {
      const words = new Uint32Array(staging.getMappedRange().slice(0));
      staging.unmap();
      this._stagingFree.push(staging);
      const stats = words.subarray(0, L.STAT_WORDS);
      const counters = words.subarray(L.STAT_WORDS);
      const stale = epoch !== this.epoch;
      if (compacted && !stale) {
        this.count = counters[L.COMPACT_IDX];
        this.compactPending = false;
      }
      return { epoch, stale, stats, counters, compacted, countAtSubmit };
    }).catch(() => {
      this._stagingFree.push(staging);
      if (compacted && epoch === this.epoch) this.compactPending = false;
      return null;
    });
  }

  static readU64(words, idx) {
    return words[idx] + words[idx + 1] * 4294967296;
  }

  // Decodes one telemetry target (0 = global, 1 + i = sensor i) into plain sums.
  static decodeTelemetryTarget(stats, target) {
    const L = GPU_LAYOUT;
    const b = target * L.STAT_TARGET_STRIDE;
    const r = (ch) => ParticleGPUCompute.readU64(stats, b + 2 * ch);
    const histStart = b + 2 * L.TELEM_SCALARS;
    return {
      count: r(0),
      kineticEnergy: r(1) / L.KE_SCALE,
      sumVx: (r(2) - r(3)) / L.V_SCALE,
      sumVy: (r(4) - r(5)) / L.V_SCALE,
      sumMVx: (r(6) - r(7)) / L.MV_SCALE,
      sumMVy: (r(8) - r(9)) / L.MV_SCALE,
      sumMass: r(10) / L.M_SCALE,
      sumSpeed: r(11) / L.V_SCALE,
      histogram: stats.subarray(histStart, histStart + L.HIST_BINS)
    };
  }

  // Expands a speed histogram into representative samples (bin centres) so
  // chart code written against raw speed samples keeps working.
  static histogramToSamples(histogram, maxSamples) {
    let total = 0;
    for (let b = 0; b < histogram.length; b++) total += histogram[b];
    const samples = [];
    if (total === 0) return samples;
    const scale = Math.min(1, maxSamples / total);
    const width = GPU_LAYOUT.HIST_BIN_WIDTH;
    for (let b = 0; b < histogram.length; b++) {
      const k = Math.round(histogram[b] * scale);
      const centre = (b + 0.5) * width;
      for (let j = 0; j < k; j++) samples.push(centre);
    }
    return samples;
  }

  // Step-back history: GPU-side copies of the particle buffer.
  captureHistory() {
    if (!this.isSupported || this.count > HISTORY_CAPACITY) return null;
    const slot = this._historyPool.pop() || {
      buffer: this.device.createBuffer({
        label: 'ComputeHistorySlot',
        size: HISTORY_CAPACITY * 32,
        usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
      }),
      count: 0
    };
    slot.count = this.count;
    if (slot.count > 0) {
      const encoder = this.device.createCommandEncoder({ label: 'ComputeHistoryCapture' });
      encoder.copyBufferToBuffer(this.getOutputBuffer(), 0, slot.buffer, 0, slot.count * 32);
      this.device.queue.submit([encoder.finish()]);
    }
    return slot;
  }

  restoreHistory(slot) {
    if (!this.isSupported || !slot) return;
    this._bumpEpoch();
    this.count = slot.count;
    if (slot.count > 0) {
      const encoder = this.device.createCommandEncoder({ label: 'ComputeHistoryRestore' });
      encoder.copyBufferToBuffer(slot.buffer, 0, this.getOutputBuffer(), 0, slot.count * 32);
      this.device.queue.submit([encoder.finish()]);
    }
    this.releaseHistory(slot);
  }

  releaseHistory(slot) {
    if (slot) this._historyPool.push(slot);
  }

  getOutputBuffer() {
    return (this.pingPong === 0) ? this.bufferA : this.bufferB;
  }

  getCount() {
    return this.count;
  }

  // Full particle readback. Expensive; intended for tests and debugging.
  async readbackParticles(maxCount = this.count) {
    if (!this.isSupported) return [];
    const readCount = Math.min(this.count, maxCount);
    if (readCount === 0) return [];
    const byteSize = readCount * 32;
    const staging = this.device.createBuffer({
      label: 'ComputeParticleReadback', size: byteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });
    const encoder = this.device.createCommandEncoder({ label: 'ComputeParticleReadback' });
    encoder.copyBufferToBuffer(this.getOutputBuffer(), 0, staging, 0, byteSize);
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    const floats = new Float32Array(staging.getMappedRange().slice(0));
    staging.unmap();
    staging.destroy();

    const result = [];
    for (let i = 0, ptr = 0; i < readCount; i++, ptr += 8) {
      result.push({
        pos: { x: floats[ptr], y: floats[ptr + 1] },
        vel: { x: floats[ptr + 2], y: floats[ptr + 3] },
        radius: floats[ptr + 4],
        mass: floats[ptr + 5],
        speedNorm: floats[ptr + 6]
      });
    }
    return result;
  }
}
