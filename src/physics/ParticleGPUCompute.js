export class ParticleGPUCompute {
  constructor(device) {
    this.device = device;
    this.isSupported = !!device;

    this.capacity = 100000;
    this.count = 0;
    this.pingPong = 0; // 0: A is in, B is out; 1: B is in, A is out

    this.bufferA = null;
    this.bufferB = null;
    this.uniformBuffer = null;

    this.uniformData = new ArrayBuffer(32);
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
    // 32 bytes per particle: pos(8), vel(8), radius(4), mass(4), speedNorm(4), pad(4)
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
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  }

  _initPipeline() {
    const device = this.device;

    const wgslSource = `
      struct SimParams {
        dt: f32,
        gravity: f32,
        gravityEnabled: u32,
        damping: f32,
        worldWidth: f32,
        worldHeight: f32,
        particleCount: u32,
        maxSpeedReference: f32,
      };

      struct Particle {
        pos: vec2f,
        vel: vec2f,
        radius: f32,
        mass: f32,
        speedNorm: f32,
        pad: f32,
      };

      @group(0) @binding(0) var<uniform> params: SimParams;
      @group(0) @binding(1) var<storage, read> particlesIn: array<Particle>;
      @group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;

      @compute @workgroup_size(64)
      fn cs_integrate(@builtin(global_invocation_id) global_id: vec3u) {
        let idx = global_id.x;
        if (idx >= params.particleCount) {
          return;
        }

        var p = particlesIn[idx];

        // 1. Gravity acceleration
        if (params.gravityEnabled != 0u) {
          p.vel.y += params.gravity * params.dt;
        }

        // 2. Position numerical integration
        p.pos += p.vel * params.dt;

        // 3. World boundary reflections (0..worldWidth, 0..worldHeight)
        let r = p.radius;
        if (p.pos.x - r < 0.0) {
          p.pos.x = r;
          p.vel.x = -p.vel.x * params.damping;
        } else if (p.pos.x + r > params.worldWidth) {
          p.pos.x = params.worldWidth - r;
          p.vel.x = -p.vel.x * params.damping;
        }

        if (p.pos.y - r < 0.0) {
          p.pos.y = r;
          p.vel.y = -p.vel.y * params.damping;
        } else if (p.pos.y + r > params.worldHeight) {
          p.pos.y = params.worldHeight - r;
          p.vel.y = -p.vel.y * params.damping;
        }

        // 4. Normalized speed for colormap sampling
        let speed = length(p.vel);
        let maxRef = max(1.0, params.maxSpeedReference);
        p.speedNorm = clamp(speed / maxRef, 0.0, 1.0);

        particlesOut[idx] = p;
      }
    `;

    const shaderModule = device.createShaderModule({
      label: 'ParticleComputeShader',
      code: wgslSource
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'ParticleComputeBindGroupLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' }
        }
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

    // Ping-Pong BindGroups: A->B and B->A
    this.bindGroupAB = device.createBindGroup({
      label: 'ParticleComputeBindGroupAB',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.bufferA } },
        { binding: 2, resource: { buffer: this.bufferB } }
      ]
    });

    this.bindGroupBA = device.createBindGroup({
      label: 'ParticleComputeBindGroupBA',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.bufferB } },
        { binding: 2, resource: { buffer: this.bufferA } }
      ]
    });
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

  step(dt, gravityEnabled, gravity = 350, damping = 0.98, worldWidth = 2500, worldHeight = 2500, maxSpeedReference = 380) {
    if (!this.isSupported || this.count === 0) return null;

    // Update uniform buffer
    this.uniformFloats[0] = dt;
    this.uniformFloats[1] = gravity;
    this.uniformU32[2] = gravityEnabled ? 1 : 0;
    this.uniformFloats[3] = damping;
    this.uniformFloats[4] = worldWidth;
    this.uniformFloats[5] = worldHeight;
    this.uniformU32[6] = this.count;
    this.uniformFloats[7] = maxSpeedReference;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleComputeEncoder'
    });

    const pass = commandEncoder.beginComputePass({
      label: 'ParticleComputePass'
    });
    pass.setPipeline(this.pipeline);

    // Select active ping-pong bind group
    const activeBindGroup = (this.pingPong === 0) ? this.bindGroupAB : this.bindGroupBA;
    pass.setBindGroup(0, activeBindGroup);

    const workgroupCount = Math.ceil(this.count / 64);
    pass.dispatchWorkgroups(workgroupCount);
    pass.end();

    this.device.queue.submit([commandEncoder.finish()]);

    // Current output buffer is the one written to:
    // If pingPong was 0 (A->B), output is B. If pingPong was 1 (B->A), output is A.
    const outputBuffer = (this.pingPong === 0) ? this.bufferB : this.bufferA;

    // Advance ping-pong state for next step
    this.pingPong = 1 - this.pingPong;

    return outputBuffer;
  }

  getOutputBuffer() {
    // Current available valid particle state
    return (this.pingPong === 0) ? this.bufferA : this.bufferB;
  }

  getCount() {
    return this.count;
  }
}
