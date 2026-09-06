import { thermalColormap } from './Colormap.js';

export class ParticleGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.isSupported = false;

    try {
      this.gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
      });
      if (this.gl) {
        this.isSupported = true;
      }
    } catch (e) {
      console.warn('WebGL 2 is not supported, falling back to 2D Canvas:', e);
      this.isSupported = false;
      return;
    }

    if (!this.isSupported) return;

    this.capacity = 50000;
    // 4 floats per instance: posX, posY, radius, speedNorm
    this.instanceData = new Float32Array(this.capacity * 4);

    this._initShaders();
    this._initBuffers();
    this._initColormapTexture();
  }

  _initShaders() {
    const gl = this.gl;

    const vsSource = `#version 300 es
      precision highp float;

      layout(location = 0) in vec2 aQuad;
      layout(location = 1) in vec2 aPos;
      layout(location = 2) in float aRadius;
      layout(location = 3) in float aSpeedNorm;

      uniform vec2 uViewportSize;
      uniform vec2 uPan;
      uniform float uZoom;

      out vec2 vLocalPos;
      out float vSpeedNorm;

      void main() {
        vLocalPos = aQuad;
        vSpeedNorm = aSpeedNorm;

        vec2 screenCenter = aPos * uZoom + uPan;
        float screenRadius = max(1.0, aRadius * uZoom);
        vec2 screenPos = screenCenter + aQuad * screenRadius;

        vec2 ndc = vec2((screenPos.x / uViewportSize.x) * 2.0 - 1.0,
                        1.0 - (screenPos.y / uViewportSize.y) * 2.0);

        gl_Position = vec4(ndc, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;

      in vec2 vLocalPos;
      in float vSpeedNorm;

      uniform sampler2D uColormap;
      uniform bool uColorByVelocity;
      uniform vec3 uDefaultColor;

      out vec4 fragColor;

      void main() {
        float distSq = dot(vLocalPos, vLocalPos);
        if (distSq > 1.0) {
          discard;
        }

        float dist = sqrt(distSq);
        float delta = fwidth(dist);
        float alpha = 1.0 - smoothstep(1.0 - delta * 1.5, 1.0, dist);

        vec3 baseRgb = uColorByVelocity ? texture(uColormap, vec2(clamp(vSpeedNorm, 0.0, 1.0), 0.5)).rgb : uDefaultColor;

        float borderFactor = smoothstep(0.70, 0.95, dist);
        vec3 finalRgb = mix(baseRgb, vec3(1.0), borderFactor * 0.45);

        fragColor = vec4(finalRgb, alpha);
      }
    `;

    const vs = this._compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, fsSource);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('ParticleGL program link error:', gl.getProgramInfoLog(this.program));
      this.isSupported = false;
      return;
    }

    this.uViewportSize = gl.getUniformLocation(this.program, 'uViewportSize');
    this.uPan = gl.getUniformLocation(this.program, 'uPan');
    this.uZoom = gl.getUniformLocation(this.program, 'uZoom');
    this.uColormap = gl.getUniformLocation(this.program, 'uColormap');
    this.uColorByVelocity = gl.getUniformLocation(this.program, 'uColorByVelocity');
    this.uDefaultColor = gl.getUniformLocation(this.program, 'uDefaultColor');
  }

  _compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('ParticleGL shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  _initBuffers() {
    const gl = this.gl;

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // Quad geometry: TRIANGLE_STRIP for unit circle (-1..1)
    const quadVertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Location 0: aQuad
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Instance buffer: posX, posY, radius, speedNorm
    this.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);

    const stride = 4 * 4; // 4 floats * 4 bytes = 16 bytes

    // Location 1: aPos (vec2)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);

    // Location 2: aRadius (float)
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.vertexAttribDivisor(2, 1);

    // Location 3: aSpeedNorm (float)
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 3 * 4);
    gl.vertexAttribDivisor(3, 1);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  _initColormapTexture() {
    const gl = this.gl;
    const lutBytes = new Uint8Array(256 * 4);

    for (let i = 0; i < 256; i++) {
      const c = thermalColormap.lut[i];
      lutBytes[i * 4 + 0] = c.r;
      lutBytes[i * 4 + 1] = c.g;
      lutBytes[i * 4 + 2] = c.b;
      lutBytes[i * 4 + 3] = 255;
    }

    this.colormapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lutBytes);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  resize(width, height) {
    if (!this.isSupported) return;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl.viewport(0, 0, width, height);
  }

  clear() {
    if (!this.isSupported) return;
    const gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  render(particles, panX, panY, zoom, maxSpeedReference = 380, colorByVelocity = true) {
    if (!this.isSupported) return;
    const count = particles ? particles.length : 0;
    if (count === 0) {
      this.clear();
      return;
    }

    // Expand buffer if particle count exceeds capacity
    if (count > this.capacity) {
      this.capacity = Math.max(count + 10000, this.capacity * 2);
      this.instanceData = new Float32Array(this.capacity * 4);
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
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

    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.program);

    gl.uniform2f(this.uViewportSize, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uPan, panX, panY);
    gl.uniform1f(this.uZoom, zoom);
    gl.uniform1i(this.uColorByVelocity, colorByVelocity ? 1 : 0);
    gl.uniform3f(this.uDefaultColor, 56 / 255, 189 / 255, 248 / 255); // #38bdf8

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture);
    gl.uniform1i(this.uColormap, 0);

    // Upload only the used instance data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, count * 4));

    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}
