import { thermalColormap } from './Colormap.js';

export class ParticleGPURenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.device = null;
    this.context = null;
    this.format = null;
    this.pipeline = null;
    this.bindGroup = null;
    this.uniformBuffer = null;
    this.quadBuffer = null;
    this.instanceBuffer = null;
    this.colormapTexture = null;
    this.sampler = null;

    this.capacity = 50000;
    this.instanceData = new Float32Array(this.capacity * 4);
    this.uniformData = new ArrayBuffer(48);
    this.uniformFloats = new Float32Array(this.uniformData);
    this.uniformU32 = new Uint32Array(this.uniformData);

    this.isSupported = false;
  }

  async init() {
    if (!navigator.gpu) {
      console.warn('WebGPU is not available in navigator.gpu.');
      this.isSupported = false;
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });

      if (!adapter) {
        console.warn('WebGPU: No appropriate GPUAdapter found.');
        this.isSupported = false;
        return false;
      }

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu');
      this.format = navigator.gpu.getPreferredCanvasFormat();

      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: 'premultiplied'
      });

      this._initBuffers();
      this._initColormapTexture();
      this._initPipeline();

      this.isSupported = true;
      return true;
    } catch (err) {
      console.error('WebGPU initialization error:', err);
      this.isSupported = false;
      return false;
    }
  }

  _initBuffers() {
    const device = this.device;

    // 1. Quad geometry buffer (TRIANGLE_STRIP unit circle quad: -1..1)
    const quadVertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0
    ]);

    this.quadBuffer = device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(this.quadBuffer, 0, quadVertices);

    // 2. Uniform buffer (48 bytes)
    this.uniformBuffer = device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // 3. Dynamic instance buffer (posX, posY, radius, speedNorm)
    this.instanceBuffer = device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
  }

  _initColormapTexture() {
    const device = this.device;
    const lutBytes = new Uint8Array(256 * 4);

    for (let i = 0; i < 256; i++) {
      const c = thermalColormap.lut[i];
      lutBytes[i * 4 + 0] = c.r;
      lutBytes[i * 4 + 1] = c.g;
      lutBytes[i * 4 + 2] = c.b;
      lutBytes[i * 4 + 3] = 255;
    }

    this.colormapTexture = device.createTexture({
      size: [256, 1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });

    device.queue.writeTexture(
      { texture: this.colormapTexture },
      lutBytes,
      { bytesPerRow: 256 * 4, rowsPerImage: 1 },
      [256, 1, 1]
    );

    this.sampler = device.createSampler({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      magFilter: 'linear'
    });
  }

  _initPipeline() {
    const device = this.device;

    const wgslSource = `
      struct Uniforms {
        uViewportSize: vec2f,
        uPan: vec2f,
        uZoom: f32,
        uColorByVelocity: u32,
        _pad: vec2f,
        uDefaultColor: vec3f,
        _pad2: f32,
      };

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      @group(0) @binding(1) var uColormap: texture_2d<f32>;
      @group(0) @binding(2) var uSampler: sampler;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) vLocalPos: vec2f,
        @location(1) vSpeedNorm: f32,
      };

      @vertex
      fn vs_main(
        @location(0) aQuad: vec2f,
        @location(1) aPos: vec2f,
        @location(2) aRadius: f32,
        @location(3) aSpeedNorm: f32
      ) -> VertexOutput {
        var out: VertexOutput;
        if (aRadius <= 0.0 || aPos.x < -50000.0) {
          out.position = vec4f(2.0, 2.0, 2.0, 1.0);
          out.vLocalPos = vec2f(0.0);
          out.vSpeedNorm = 0.0;
          return out;
        }
        out.vLocalPos = aQuad;
        out.vSpeedNorm = aSpeedNorm;

        let screenCenter = aPos * uniforms.uZoom + uniforms.uPan;
        let screenRadius = max(1.0, aRadius * uniforms.uZoom);
        let screenPos = screenCenter + aQuad * screenRadius;

        let ndc = vec2f(
          (screenPos.x / uniforms.uViewportSize.x) * 2.0 - 1.0,
          1.0 - (screenPos.y / uniforms.uViewportSize.y) * 2.0
        );

        out.position = vec4f(ndc, 0.0, 1.0);
        return out;
      }

      @fragment
      fn fs_main(in: VertexOutput) -> @location(0) vec4f {
        let distSq = dot(in.vLocalPos, in.vLocalPos);
        if (distSq > 1.0) {
          discard;
        }

        let dist = sqrt(distSq);
        let delta = fwidth(dist);
        let alpha = 1.0 - smoothstep(1.0 - delta * 1.5, 1.0, dist);

        var baseRgb: vec3f;
        if (uniforms.uColorByVelocity != 0u) {
          let uv = vec2f(clamp(in.vSpeedNorm, 0.0, 1.0), 0.5);
          baseRgb = textureSample(uColormap, uSampler, uv).rgb;
        } else {
          baseRgb = uniforms.uDefaultColor;
        }

        let borderFactor = smoothstep(0.70, 0.95, dist);
        let finalRgb = mix(baseRgb, vec3f(1.0), borderFactor * 0.45);

        return vec4f(finalRgb, alpha);
      }
    `;

    const shaderModule = device.createShaderModule({
      label: 'ParticleGPUShader',
      code: wgslSource
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'ParticleGPUBindGroupLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' }
        }
      ]
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'ParticleGPUPipelineLayout',
      bindGroupLayouts: [bindGroupLayout]
    });

    this.pipeline = device.createRenderPipeline({
      label: 'ParticleGPURenderPipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          // Buffer 0: Quad Geometry
          {
            arrayStride: 2 * 4,
            stepMode: 'vertex',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' }
            ]
          },
          // Buffer 1: Instance Attributes
          {
            arrayStride: 4 * 4,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'float32x2' },
              { shaderLocation: 2, offset: 2 * 4, format: 'float32' },
              { shaderLocation: 3, offset: 3 * 4, format: 'float32' }
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              }
            }
          }
        ]
      },
      primitive: {
        topology: 'triangle-strip'
      }
    });

    this.computePipeline = device.createRenderPipeline({
      label: 'ParticleGPUComputeRenderPipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          // Buffer 0: Quad Geometry
          {
            arrayStride: 2 * 4,
            stepMode: 'vertex',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' }
            ]
          },
          // Buffer 1: Instance Attributes from Storage Buffer (32 bytes per particle)
          {
            arrayStride: 8 * 4,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'float32x2' },     // aPos
              { shaderLocation: 2, offset: 4 * 4, format: 'float32' },   // aRadius
              { shaderLocation: 3, offset: 6 * 4, format: 'float32' }    // aSpeedNorm
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              }
            }
          }
        ]
      },
      primitive: {
        topology: 'triangle-strip'
      }
    });

    this.bindGroup = device.createBindGroup({
      label: 'ParticleGPUBindGroup',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.colormapTexture.createView() },
        { binding: 2, resource: this.sampler }
      ]
    });
  }

  resize(width, height) {
    if (!this.isSupported) return;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  clear() {
    if (!this.isSupported || !this.device || !this.context) return;
    const currentTexture = this.context.getCurrentTexture();
    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: currentTexture.createView(),
          loadOp: 'clear',
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          storeOp: 'store'
        }
      ]
    });
    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  renderGPUBuffer(buffer, count, panX, panY, zoom, maxSpeedReference = 380, colorByVelocity = true) {
    if (!this.isSupported || !this.device || !this.context || !buffer || count === 0) {
      this.clear();
      return;
    }

    this.uniformFloats[0] = this.canvas.width;
    this.uniformFloats[1] = this.canvas.height;
    this.uniformFloats[2] = panX;
    this.uniformFloats[3] = panY;
    this.uniformFloats[4] = zoom;
    this.uniformU32[5] = colorByVelocity ? 1 : 0;
    this.uniformFloats[6] = 0.0;
    this.uniformFloats[7] = 0.0;
    this.uniformFloats[8] = 56 / 255;
    this.uniformFloats[9] = 189 / 255;
    this.uniformFloats[10] = 248 / 255;
    this.uniformFloats[11] = 0.0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const currentTexture = this.context.getCurrentTexture();
    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleGPURenderCommandsZeroCopy'
    });

    const renderPass = commandEncoder.beginRenderPass({
      label: 'ParticleGPURenderPassZeroCopy',
      colorAttachments: [
        {
          view: currentTexture.createView(),
          loadOp: 'clear',
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          storeOp: 'store'
        }
      ]
    });

    renderPass.setPipeline(this.computePipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.quadBuffer);
    renderPass.setVertexBuffer(1, buffer);
    renderPass.draw(4, count, 0, 0);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  render(particles, panX, panY, zoom, maxSpeedReference = 380, colorByVelocity = true, bufferCount = 0) {
    if (!this.isSupported || !this.device || !this.context) return;

    if (particles && (particles instanceof GPUBuffer || (particles.buffer && particles.buffer instanceof GPUBuffer))) {
      const buf = (particles instanceof GPUBuffer) ? particles : particles.buffer;
      const count = bufferCount || particles.count || this.capacity;
      this.renderGPUBuffer(buf, count, panX, panY, zoom, maxSpeedReference, colorByVelocity);
      return;
    }

    const count = particles ? particles.length : 0;
    if (count === 0) {
      this.clear();
      return;
    }

    // Expand buffer if particle count exceeds capacity
    if (count > this.capacity) {
      this.capacity = Math.max(count + 10000, this.capacity * 2);
      this.instanceData = new Float32Array(this.capacity * 4);
      if (this.instanceBuffer) {
        this.instanceBuffer.destroy();
      }
      this.instanceBuffer = this.device.createBuffer({
        size: this.instanceData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }

    const data = this.instanceData;
    const invMaxSpeed = 1.0 / Math.max(1, maxSpeedReference);

    let ptr = 0;
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      data[ptr++] = p.pos.x;
      data[ptr++] = p.pos.y;
      data[ptr++] = p.radius;
      data[ptr++] = p.getSpeed() * invMaxSpeed;
    }

    // Upload instance buffer
    this.device.queue.writeBuffer(
      this.instanceBuffer,
      0,
      data.buffer,
      0,
      count * 4 * 4
    );

    // Update uniform buffer
    this.uniformFloats[0] = this.canvas.width;
    this.uniformFloats[1] = this.canvas.height;
    this.uniformFloats[2] = panX;
    this.uniformFloats[3] = panY;
    this.uniformFloats[4] = zoom;
    this.uniformU32[5] = colorByVelocity ? 1 : 0;
    this.uniformFloats[6] = 0.0;
    this.uniformFloats[7] = 0.0;
    this.uniformFloats[8] = 56 / 255;  // #38bdf8 R
    this.uniformFloats[9] = 189 / 255; // G
    this.uniformFloats[10] = 248 / 255;// B
    this.uniformFloats[11] = 0.0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const currentTexture = this.context.getCurrentTexture();
    const commandEncoder = this.device.createCommandEncoder({
      label: 'ParticleGPURenderCommands'
    });

    const renderPass = commandEncoder.beginRenderPass({
      label: 'ParticleGPURenderPass',
      colorAttachments: [
        {
          view: currentTexture.createView(),
          loadOp: 'clear',
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          storeOp: 'store'
        }
      ]
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.quadBuffer);
    renderPass.setVertexBuffer(1, this.instanceBuffer);
    renderPass.draw(4, count, 0, 0);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
