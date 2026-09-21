import { particleComputeWGSL } from './ParticleGPUComputeShader.js';

export class ParticleGPUCompute {
  constructor(device) {
    this.device = device;
    this.isSupported = !!device;

    this.capacity = 1000000;
    this.count = 0;
    this.maxWalls = 512;
    this.wallCount = 0;
    this.pingPong = 0; // 0: A is in, B is out; 1: B is in, A is out

    this.bufferA = null;
    this.bufferB = null;
    this.uniformBuffer = null;
    this.wallsBuffer = null;

    this.gridTableSize = 131072;
    this.cellSize = 16.0;

    this.cellHeadsBuffer = null;
    this.particleNextBuffer = null;
    this.bestPartnersBuffer = null;

    this.telemetryStagingBuffer = null;
    this.isTelemetryPending = false;

    this.uniformData = new ArrayBuffer(80);
    this.uniformFloats = new Float32Array(this.uniformData);
    this.uniformU32 = new Uint32Array(this.uniformData);

    this.pipelineClearGrid = null;
    this.pipelineBuildGrid = null;
    this.pipelineFindPairs = null;
    this.pipelineIntegrate = null;
    this.bindGroupAB = null;
    this.bindGroupBA = null;

    if (this.isSupported) {
      this._initBuffers();
      this._initPipeline();
    }
  }

  _initBuffers() {
    const dev = this.device, cap = this.capacity;
    const make = (label, size, usage) => dev.createBuffer({ label, size, usage });
    const s = GPUBufferUsage.STORAGE;
    this.bufferA = make('ComputeBufA', cap * 32, s | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.bufferB = make('ComputeBufB', cap * 32, s | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.uniformBuffer = make('ComputeUniforms', 80, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    this.wallsBuffer = make('ComputeWalls', this.maxWalls * 64, s | GPUBufferUsage.COPY_DST);
    this.cellHeadsBuffer = make('ComputeCellHeads', this.gridTableSize * 4, s | GPUBufferUsage.COPY_DST);
    this.particleNextBuffer = make('ComputeParticleNext', cap * 4, s);
    this.bestPartnersBuffer = make('ComputeBestPartners', cap * 4, s);
    this.sinksBuffer = make('ComputeSinks', 64 * 48, s | GPUBufferUsage.COPY_DST);
    this.telemetryStagingBuffer = make('ComputeTelemetryStaging', 50000 * 32, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
  }

  _initPipeline() {
    const device = this.device;

    const shaderModule = device.createShaderModule({
      label: 'ParticleComputeShader',
      code: particleComputeWGSL
    });

    const entry = (binding, type) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type } });
    const bindGroupLayout = device.createBindGroupLayout({
      label: 'ParticleComputeBindGroupLayout',
      entries: [
        entry(0, 'uniform'), entry(1, 'read-only-storage'), entry(2, 'storage'),
        entry(3, 'read-only-storage'), entry(4, 'storage'), entry(5, 'storage'),
        entry(6, 'storage'), entry(7, 'read-only-storage')
      ]
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'ParticleComputePipelineLayout',
      bindGroupLayouts: [bindGroupLayout]
    });

    const makePipe = (entryPoint, label) => device.createComputePipeline({
      label, layout: pipelineLayout, compute: { module: shaderModule, entryPoint }
    });
    this.pipelineClearGrid = makePipe('cs_clear_grid', 'ParticleComputePipelineClearGrid');
    this.pipelineBuildGrid = makePipe('cs_build_grid', 'ParticleComputePipelineBuildGrid');
    this.pipelineFindPairs = makePipe('cs_find_pairs', 'ParticleComputePipelineFindPairs');
    this.pipelineIntegrate = makePipe('cs_integrate', 'ParticleComputePipelineIntegrate');

    const makeBG = (inBuf, outBuf, label) => device.createBindGroup({
      label, layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: inBuf } },
        { binding: 2, resource: { buffer: outBuf } },
        { binding: 3, resource: { buffer: this.wallsBuffer } },
        { binding: 4, resource: { buffer: this.cellHeadsBuffer } },
        { binding: 5, resource: { buffer: this.particleNextBuffer } },
        { binding: 6, resource: { buffer: this.bestPartnersBuffer } },
        { binding: 7, resource: { buffer: this.sinksBuffer } }
      ]
    });
    this.bindGroupAB = makeBG(this.bufferA, this.bufferB, 'ParticleComputeBindGroupAB');
    this.bindGroupBA = makeBG(this.bufferB, this.bufferA, 'ParticleComputeBindGroupBA');
  }

  uploadWalls(walls) {
    if (!this.isSupported || !walls) return;
    const count = Math.min(walls.length, this.maxWalls);
    this.wallCount = count;
    if (count === 0) return;

    const data = new ArrayBuffer(count * 64);
    const f32 = new Float32Array(data);
    const u32 = new Uint32Array(data);

    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const w = walls[i];
      f32[ptr + 0] = w.p1 ? w.p1.x : 0;
      f32[ptr + 1] = w.p1 ? w.p1.y : 0;
      f32[ptr + 2] = w.p2 ? w.p2.x : 0;
      f32[ptr + 3] = w.p2 ? w.p2.y : 0;
      f32[ptr + 4] = w.normal ? w.normal.x : 0;
      f32[ptr + 5] = w.normal ? w.normal.y : 0;
      f32[ptr + 6] = w.thickness || 4;
      u32[ptr + 7] = w.isOpen ? 1 : 0;

      let typeCode = 0;
      if (w.type === 'manual_valve') typeCode = 1;
      else if (w.type === 'check_valve') typeCode = 2;
      else if (w.type === 'relief_valve') typeCode = 3;
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

    this.device.queue.writeBuffer(this.wallsBuffer, 0, data, 0, count * 64);
  }

  uploadSinks(sinks) {
    if (!this.isSupported) return;
    const list = sinks || [];
    const count = Math.min(list.length, 64);
    this.sinkCount = count;
    if (count === 0) {
      const zero = new Uint32Array(12);
      this.device.queue.writeBuffer(this.sinksBuffer, 0, zero.buffer, 0, 48);
      return;
    }

    const data = new ArrayBuffer(count * 48);
    const f32 = new Float32Array(data);
    const u32 = new Uint32Array(data);

    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const s = list[i];
      f32[ptr + 0] = s.x;
      f32[ptr + 1] = s.y;
      f32[ptr + 2] = s.x + s.width;
      f32[ptr + 3] = s.y + s.height;

      const isUnlimited = !s.maxParticles || s.maxParticles <= 0;
      const isLimitReached = !isUnlimited && (s.absorbedCount >= s.maxParticles);
      u32[ptr + 4] = (s.isActive !== false && !isLimitReached) ? 1 : 0;

      let dirCode = 0;
      if (s.direction === 'right') dirCode = 1;
      else if (s.direction === 'left') dirCode = 2;
      else if (s.direction === 'down') dirCode = 3;
      else if (s.direction === 'up') dirCode = 4;
      u32[ptr + 5] = dirCode;

      let tempCode = 0;
      if (s.tempFilterMode === 'above') tempCode = 1;
      else if (s.tempFilterMode === 'below') tempCode = 2;
      u32[ptr + 6] = tempCode;

      f32[ptr + 7] = s.filterTemperature || 300;
      f32[ptr + 8] = 0; f32[ptr + 9] = 0;
      f32[ptr + 10] = 0; f32[ptr + 11] = 0;

      ptr += 12;
    }
    this.device.queue.writeBuffer(this.sinksBuffer, 0, data, 0, count * 48);
  }

  uploadRawParticleBuffer(compactedFloats, count) {
    if (!this.isSupported || !compactedFloats) return;
    this.count = count;
    this.device.queue.writeBuffer(this.bufferA, 0, compactedFloats.buffer, compactedFloats.byteOffset, count * 32);
    this.device.queue.writeBuffer(this.bufferB, 0, compactedFloats.buffer, compactedFloats.byteOffset, count * 32);
  }

  _packParticles(particles, startIdx, count) {
    const packed = new Float32Array(count * 8);
    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const p = particles[startIdx + i];
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

  uploadParticles(particles) {
    if (!this.isSupported || !particles) return;
    this.count = Math.min(particles.length, this.capacity);
    if (this.count === 0) return;
    const packed = this._packParticles(particles, 0, this.count);
    this.device.queue.writeBuffer(this.bufferA, 0, packed);
    this.device.queue.writeBuffer(this.bufferB, 0, packed);
  }

  appendParticles(newParticles) {
    if (!this.isSupported || !newParticles || newParticles.length === 0) return;
    const appendCount = Math.min(newParticles.length, this.capacity - this.count);
    if (appendCount <= 0) return;

    const packed = this._packParticles(newParticles, 0, appendCount);
    const byteOffset = this.count * 32;
    this.device.queue.writeBuffer(this.bufferA, byteOffset, packed);
    this.device.queue.writeBuffer(this.bufferB, byteOffset, packed);
    this.count += appendCount;
  }

  step(dt, gravityEnabled = false, gravity = 350, damping = 1.0, bounds = null, maxSpeedReference = 380, subSteps = 4, simModel = 0) {
    if (!this.isSupported || this.count === 0) return this.getOutputBuffer();

    const effectiveSubSteps = Math.max(1, subSteps);
    const subDt = dt / effectiveSubSteps;

    const hasBounds = !!(bounds && typeof bounds.minX === 'number' && typeof bounds.maxX === 'number');

    // 80 bytes uniform layout conforming to SimParams
    this.uniformFloats[0] = subDt;
    this.uniformFloats[1] = gravity;
    this.uniformU32[2] = gravityEnabled ? 1 : 0;
    this.uniformFloats[3] = damping;
    this.uniformU32[4] = this.count;
    this.uniformFloats[5] = maxSpeedReference;
    this.uniformU32[6] = this.wallCount;
    this.uniformU32[7] = effectiveSubSteps;
    this.uniformU32[8] = hasBounds ? 1 : 0;
    this.uniformFloats[9] = this.cellSize;
    this.uniformU32[10] = this.gridTableSize;
    this.uniformU32[11] = this.sinkCount || 0;
    this.uniformFloats[12] = hasBounds ? bounds.minX : 0;
    this.uniformFloats[13] = hasBounds ? bounds.minY : 0;
    this.uniformFloats[14] = hasBounds ? bounds.maxX : 2500;
    this.uniformFloats[15] = hasBounds ? bounds.maxY : 2500;
    this.uniformU32[16] = simModel ? 1 : 0;
    this.uniformU32[17] = 0;
    this.uniformU32[18] = 0;
    this.uniformU32[19] = 0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleComputeEncoder'
    });

    const clearGridWorkgroups = Math.ceil(this.gridTableSize / 64);
    const particleWorkgroups = Math.ceil(this.count / 64);

    for (let s = 0; s < effectiveSubSteps; s++) {
      const activeBindGroup = (this.pingPong === 0) ? this.bindGroupAB : this.bindGroupBA;

      // Pass 1: Clear Spatial Hash Grid
      const passClear = commandEncoder.beginComputePass({ label: `ClearGrid_${s}` });
      passClear.setPipeline(this.pipelineClearGrid);
      passClear.setBindGroup(0, activeBindGroup);
      passClear.dispatchWorkgroups(clearGridWorkgroups);
      passClear.end();

      // Pass 2: Populate Spatial Hash Grid
      const passBuild = commandEncoder.beginComputePass({ label: `BuildGrid_${s}` });
      passBuild.setPipeline(this.pipelineBuildGrid);
      passBuild.setBindGroup(0, activeBindGroup);
      passBuild.dispatchWorkgroups(particleWorkgroups);
      passBuild.end();

      // Pass 3: Find Mutual Collision Pairs
      const passPairs = commandEncoder.beginComputePass({ label: `FindPairs_${s}` });
      passPairs.setPipeline(this.pipelineFindPairs);
      passPairs.setBindGroup(0, activeBindGroup);
      passPairs.dispatchWorkgroups(particleWorkgroups);
      passPairs.end();

      // Pass 4: Mutual Elastic Impulse & Wall-CCD Collision + Integration
      const passIntegrate = commandEncoder.beginComputePass({ label: `Integrate_${s}` });
      passIntegrate.setPipeline(this.pipelineIntegrate);
      passIntegrate.setBindGroup(0, activeBindGroup);
      passIntegrate.dispatchWorkgroups(particleWorkgroups);
      passIntegrate.end();

      this.pingPong = 1 - this.pingPong;
    }

    this.device.queue.submit([commandEncoder.finish()]);

    return this.getOutputBuffer();
  }

  getOutputBuffer() {
    return (this.pingPong === 0) ? this.bufferA : this.bufferB;
  }

  getCount() {
    return this.count;
  }

  async fetchTelemetry(sampleCap = 50000) {
    if (!this.isSupported || this.count === 0 || this.isTelemetryPending) return null;
    const readCount = Math.min(this.count, sampleCap);
    const byteSize = readCount * 32;

    if (!this.telemetryStagingBuffer || this.telemetryStagingBuffer.size < byteSize) {
      if (this.telemetryStagingBuffer) this.telemetryStagingBuffer.destroy();
      this.telemetryStagingBuffer = this.device.createBuffer({
        label: 'ComputeTelemetryStaging',
        size: Math.max(byteSize, 50000 * 32),
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      });
    }

    this.isTelemetryPending = true;
    const enc = this.device.createCommandEncoder({ label: 'TelemetryEncoder' });
    enc.copyBufferToBuffer(this.getOutputBuffer(), 0, this.telemetryStagingBuffer, 0, byteSize);
    this.device.queue.submit([enc.finish()]);

    try {
      await this.telemetryStagingBuffer.mapAsync(GPUMapMode.READ);
      const mapped = this.telemetryStagingBuffer.getMappedRange(0, byteSize);
      const floats = new Float32Array(mapped.slice(0));
      this.telemetryStagingBuffer.unmap();
      this.isTelemetryPending = false;
      return { floats, count: readCount, totalCount: this.count };
    } catch (e) {
      this.isTelemetryPending = false;
      return null;
    }
  }

  async readbackParticles(maxCount = this.count) {
    const data = await this.fetchTelemetry(maxCount);
    if (!data) return [];
    const { floats, count } = data;
    const result = [];
    let ptr = 0;
    for (let i = 0; i < count; i++) {
      result.push({
        pos: { x: floats[ptr], y: floats[ptr + 1] },
        vel: { x: floats[ptr + 2], y: floats[ptr + 3] },
        radius: floats[ptr + 4],
        mass: floats[ptr + 5],
        speedNorm: floats[ptr + 6]
      });
      ptr += 8;
    }
    return result;
  }
}
