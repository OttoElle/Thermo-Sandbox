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

    this.uniformData = new ArrayBuffer(48);
    this.uniformFloats = new Float32Array(this.uniformData);
    this.uniformU32 = new Uint32Array(this.uniformData);

    this.pipeline = null;
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
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.wallsBuffer = device.createBuffer({
      label: 'ParticleComputeWalls',
      size: this.maxWalls * 48,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
  }

  _initPipeline() {
    const device = this.device;

    const shaderModule = device.createShaderModule({
      label: 'ParticleComputeShader',
      code: particleComputeWGSL
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'ParticleComputeBindGroupLayout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }
      ]
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'ParticleComputePipelineLayout',
      bindGroupLayouts: [bindGroupLayout]
    });

    this.pipeline = device.createComputePipeline({
      label: 'ParticleComputePipeline',
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'cs_integrate'
      }
    });

    this.bindGroupAB = device.createBindGroup({
      label: 'ParticleComputeBindGroupAB',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.bufferA } },
        { binding: 2, resource: { buffer: this.bufferB } },
        { binding: 3, resource: { buffer: this.wallsBuffer } }
      ]
    });

    this.bindGroupBA = device.createBindGroup({
      label: 'ParticleComputeBindGroupBA',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.bufferB } },
        { binding: 2, resource: { buffer: this.bufferA } },
        { binding: 3, resource: { buffer: this.wallsBuffer } }
      ]
    });
  }

  uploadWalls(walls) {
    if (!this.isSupported || !walls) return;
    const count = Math.min(walls.length, this.maxWalls);
    this.wallCount = count;
    if (count === 0) return;

    const data = new ArrayBuffer(count * 48);
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

      ptr += 12;
    }

    this.device.queue.writeBuffer(this.wallsBuffer, 0, data, 0, count * 48);
  }

  uploadParticles(particles) {
    if (!this.isSupported || !particles) return;
    this.count = Math.min(particles.length, this.capacity);
    if (this.count === 0) return;

    // Pack particles into 8 floats per particle (32 bytes)
    const packedData = new Float32Array(this.count * 8);
    let ptr = 0;
    for (let i = 0; i < this.count; i++) {
      const p = particles[i];
      packedData[ptr++] = p.pos ? p.pos.x : 0;
      packedData[ptr++] = p.pos ? p.pos.y : 0;
      packedData[ptr++] = p.vel ? p.vel.x : 0;
      packedData[ptr++] = p.vel ? p.vel.y : 0;
      packedData[ptr++] = p.radius || 3.5;
      packedData[ptr++] = p.mass || 1.0;
      packedData[ptr++] = 0.0; // speedNorm
      packedData[ptr++] = 0.0; // pad
    }

    // Write to both buffers to guarantee synchronized initial state
    const byteLength = this.count * 32;
    this.device.queue.writeBuffer(this.bufferA, 0, packedData.buffer, 0, byteLength);
    this.device.queue.writeBuffer(this.bufferB, 0, packedData.buffer, 0, byteLength);
    this.pingPong = 0;
  }

  step(dt, gravityEnabled, gravity = 350, damping = 0.98, worldWidth = 2500, worldHeight = 2500, maxSpeedReference = 380, subSteps = 4) {
    if (!this.isSupported || this.count === 0) return null;

    const effectiveSubSteps = Math.max(1, subSteps || 1);
    const subDt = dt / effectiveSubSteps;

    this.uniformFloats[0] = subDt;
    this.uniformFloats[1] = gravity;
    this.uniformU32[2] = gravityEnabled ? 1 : 0;
    this.uniformFloats[3] = damping;
    this.uniformFloats[4] = worldWidth;
    this.uniformFloats[5] = worldHeight;
    this.uniformU32[6] = this.count;
    this.uniformFloats[7] = maxSpeedReference;
    this.uniformU32[8] = this.wallCount;
    this.uniformU32[9] = effectiveSubSteps;
    this.uniformU32[10] = 0;
    this.uniformU32[11] = 0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleComputeEncoder'
    });

    const workgroupCount = Math.ceil(this.count / 64);

    for (let s = 0; s < effectiveSubSteps; s++) {
      const pass = commandEncoder.beginComputePass({
        label: `ParticleComputePass_${s}`
      });
      pass.setPipeline(this.pipeline);
      const activeBindGroup = (this.pingPong === 0) ? this.bindGroupAB : this.bindGroupBA;
      pass.setBindGroup(0, activeBindGroup);
      pass.dispatchWorkgroups(workgroupCount);
      pass.end();

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
