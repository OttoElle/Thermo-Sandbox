import { particleComputeWGSL } from './ParticleGPUComputeShader.js';

export class ParticleGPUCompute {
  constructor(device) {
    this.device = device;
    this.isSupported = !!device;

    this.capacity = 100000;
    this.count = 0;
    this.maxWalls = 512;
    this.wallCount = 0;
    this.pingPong = 0; // 0: A is in, B is out; 1: B is in, A is out

    this.bufferA = null;
    this.bufferB = null;
    this.uniformBuffer = null;
    this.wallsBuffer = null;

    this.gridCols = 256;
    this.gridRows = 256;
    this.totalCells = this.gridCols * this.gridRows;
    this.cellSize = 14.0;

    this.cellHeadsBuffer = null;
    this.particleNextBuffer = null;
    this.bestPartnersBuffer = null;

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
    const device = this.device;
    const bufferSize = this.capacity * 32;

    this.bufferA = device.createBuffer({
      label: 'ParticleComputeBufferA',
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });

    this.bufferB = device.createBuffer({
      label: 'ParticleComputeBufferB',
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });

    this.uniformBuffer = device.createBuffer({
      label: 'ParticleComputeUniforms',
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.wallsBuffer = device.createBuffer({
      label: 'ParticleComputeWalls',
      size: this.maxWalls * 64,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    this.cellHeadsBuffer = device.createBuffer({
      label: 'ParticleComputeCellHeads',
      size: this.totalCells * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    this.particleNextBuffer = device.createBuffer({
      label: 'ParticleComputeParticleNext',
      size: this.capacity * 4,
      usage: GPUBufferUsage.STORAGE
    });

    this.bestPartnersBuffer = device.createBuffer({
      label: 'ParticleComputeBestPartners',
      size: this.capacity * 4,
      usage: GPUBufferUsage.STORAGE
    });
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
        entry(3, 'read-only-storage'), entry(4, 'storage'), entry(5, 'storage'), entry(6, 'storage')
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
        { binding: 6, resource: { buffer: this.bestPartnersBuffer } }
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
    const byteLength = this.count * 32;
    this.device.queue.writeBuffer(this.bufferA, 0, packed.buffer, 0, byteLength);
    this.device.queue.writeBuffer(this.bufferB, 0, packed.buffer, 0, byteLength);
    this.pingPong = 0;
  }

  appendParticles(newParticles) {
    if (!this.isSupported || !newParticles || newParticles.length === 0) return;
    const addCount = Math.min(newParticles.length, this.capacity - this.count);
    if (addCount <= 0) return;

    const packed = this._packParticles(newParticles, 0, addCount);
    const byteOffset = this.count * 32;
    const byteLength = addCount * 32;
    this.device.queue.writeBuffer(this.bufferA, byteOffset, packed.buffer, 0, byteLength);
    this.device.queue.writeBuffer(this.bufferB, byteOffset, packed.buffer, 0, byteLength);
    this.count += addCount;
  }

  step(dt, gravityEnabled, gravity = 350, damping = 1.0, bounds = null, maxSpeedReference = 380, subSteps = 4, simModel = 0) {
    if (!this.isSupported || this.count === 0) return null;

    const effectiveSubSteps = Math.max(1, Math.min(16, subSteps || 4));
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
    this.uniformU32[10] = this.gridCols;
    this.uniformU32[11] = this.gridRows;
    this.uniformFloats[12] = hasBounds ? bounds.minX - 50.0 : -500.0;
    this.uniformFloats[13] = hasBounds ? bounds.minY - 50.0 : -500.0;
    this.uniformFloats[14] = hasBounds ? bounds.minX : 0;
    this.uniformFloats[15] = hasBounds ? bounds.minY : 0;
    this.uniformFloats[16] = hasBounds ? bounds.maxX : 2500;
    this.uniformFloats[17] = hasBounds ? bounds.maxY : 2500;
    this.uniformU32[18] = simModel ? 1 : 0;
    this.uniformU32[19] = 0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleComputeEncoder'
    });

    const clearGridWorkgroups = Math.ceil(this.totalCells / 64);
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

  async readbackParticles(maxCount = this.count) {
    if (!this.isSupported || this.count === 0) return [];
    const readCount = Math.min(this.count, maxCount);
    const byteSize = readCount * 32;

    const stagingBuffer = this.device.createBuffer({
      label: 'ParticleReadbackStaging',
      size: byteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleReadbackEncoder'
    });
    const srcBuffer = this.getOutputBuffer();
    commandEncoder.copyBufferToBuffer(srcBuffer, 0, stagingBuffer, 0, byteSize);
    this.device.queue.submit([commandEncoder.finish()]);

    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const floats = new Float32Array(stagingBuffer.getMappedRange());

    const result = [];
    let ptr = 0;
    for (let i = 0; i < readCount; i++) {
      result.push({
        pos: { x: floats[ptr], y: floats[ptr + 1] },
        vel: { x: floats[ptr + 2], y: floats[ptr + 3] },
        radius: floats[ptr + 4],
        mass: floats[ptr + 5],
        speedNorm: floats[ptr + 6]
      });
      ptr += 8;
    }

    stagingBuffer.unmap();
    stagingBuffer.destroy();
    return result;
  }
}
