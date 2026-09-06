import { Vector2 } from './Vector2.js';

export class Piston {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.label = options.label || 'K';
    
    // Geometry: x, y is center of piston block
    this.x = options.x !== undefined ? options.x : 480;
    this.y = options.y !== undefined ? options.y : 320;
    this.width = options.width !== undefined ? options.width : 28;
    this.height = options.height !== undefined ? options.height : 120;
    
    // Movement Axis: Perpendicular to longer side!
    // If height >= width (tall vertical block) -> moves horizontally along X
    // If width > height (wide horizontal block) -> moves vertically along Y
    if (options.orientation) {
      this.orientation = options.orientation;
    } else {
      this.orientation = this.height >= this.width ? 'horizontal' : 'vertical';
    }

    // Guide Rails (Schenkel) along the movement axis
    const pos = this.getPos();
    this.minPos = options.minPos !== undefined ? options.minPos : pos - 150;
    this.maxPos = options.maxPos !== undefined ? options.maxPos : pos + 150;

    // Movement Mode: 'free', 'spring', 'motorized', 'damper'
    this.mode = options.mode || 'free';
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    
    // Physics properties
    this.mass = options.mass !== undefined ? options.mass : 30;
    this.velocity = 0;
    this.acceleration = 0;
    this.friction = 0.005;
    
    // Spring properties
    this.springK = options.springK !== undefined ? options.springK : 50.0;
    this.equilibriumPos = options.equilibriumPos !== undefined ? options.equilibriumPos : pos;
    
    // Motorized properties (Work Input / Compressor)
    this.frequency = options.frequency !== undefined ? options.frequency : 0.8;
    this.amplitude = options.amplitude !== undefined ? options.amplitude : (this.maxPos - this.minPos) * 0.4;
    this.phase = options.phase !== undefined ? options.phase : 0; // In radians or degrees
    this.centerPos = options.centerPos !== undefined ? options.centerPos : pos;

    // Damper properties (Work Extraction / Mechanical Load)
    this.dampingCoeff = options.dampingCoeff !== undefined ? options.dampingCoeff : 25.0; // Ns/m
    this.workExtracted = 0; // Total Joules recovered
    this.instantPower = 0; // Current Watts

    // Controlled / Sequencer properties
    this.targetPos = options.targetPos !== undefined ? options.targetPos : pos;
    this.targetSpeed = options.targetSpeed !== undefined ? options.targetSpeed : 150;

    // Thermal properties
    this.conductivity = options.conductivity !== undefined ? options.conductivity : 0.2;
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.heatCapacity = options.heatCapacity !== undefined ? options.heatCapacity : 120;
    this.heatAccumulator = 0;

    // Impulse tracking
    this.forceLeft = 0;
    this.forceRight = 0;
    this.accumulatedImpulseLeft = 0;
    this.accumulatedImpulseRight = 0;

    this.isDragging = false;

    // Initial snapshot state
    this.initialX = this.x;
    this.initialY = this.y;
    this.initialVelocity = 0;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  getTravelLimits() {
    const halfThick = (this.orientation === 'horizontal' ? this.width : this.height) * 0.5;
    const minTravel = this.minPos + halfThick;
    const maxTravel = this.maxPos - halfThick;
    if (minTravel <= maxTravel) {
      return {
        halfThick,
        minTravel,
        maxTravel,
        stroke: maxTravel - minTravel,
        midPos: (minTravel + maxTravel) * 0.5
      };
    } else {
      const mid = (this.minPos + this.maxPos) * 0.5;
      return {
        halfThick,
        minTravel: mid,
        maxTravel: mid,
        stroke: 0,
        midPos: mid
      };
    }
  }

  getPos() {
    return this.orientation === 'horizontal' ? this.x : this.y;
  }

  setPos(val) {
    const { minTravel, maxTravel } = this.getTravelLimits();
    val = Math.max(minTravel, Math.min(maxTravel, val));
    if (this.orientation === 'horizontal') {
      this.x = val;
    } else {
      this.y = val;
    }
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  getBounds() {
    if (!this._bounds) this._bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    this._bounds.left = this.x - this.width / 2;
    this._bounds.right = this.x + this.width / 2;
    this._bounds.top = this.y - this.height / 2;
    this._bounds.bottom = this.y + this.height / 2;
    return this._bounds;
  }

  // Schenkel Handles for interactive dragging on canvas
  getHandlePositions() {
    if (this.orientation === 'horizontal') {
      return {
        minHandle: { x: this.minPos, y: this.y },
        maxHandle: { x: this.maxPos, y: this.y }
      };
    } else {
      return {
        minHandle: { x: this.x, y: this.minPos },
        maxHandle: { x: this.x, y: this.maxPos }
      };
    }
  }

  addHeat(joules) {
    if (this.isActive) {
      this.heatAccumulator += joules;
    }
  }

  update(dt, totalTime) {
    if (dt > 0 && this.heatCapacity > 0 && this.isActive) {
      this.temperature += this.heatAccumulator / this.heatCapacity;
      this.heatAccumulator = 0;
      if (this.temperature < 5) this.temperature = 5;
    }

    if (!this.isActive) {
      this.velocity = 0;
      this.instantPower = 0;
      return;
    }

    if (this.mode === 'motorized') {
      const { minTravel, maxTravel, stroke, midPos } = this.getTravelLimits();
      const amplitude = stroke * 0.5;

      const omega = 2 * Math.PI * this.frequency;
      const radPhase = typeof this.phase === 'number' ? (this.phase * Math.PI / 180) : 0;
      // Oscillates across the entire handle span, reaching minTravel and maxTravel precisely
      const targetPos = midPos + amplitude * Math.sin(omega * totalTime + radPhase);
      const prevPos = this.getPos();
      this.setPos(targetPos);
      this.velocity = dt > 0 ? (this.getPos() - prevPos) / dt : 0;
      this.instantPower = 0;
    } else if (this.mode === 'free' || this.mode === 'spring' || this.mode === 'damper') {
      if (!this.isDragging) {
        const dtEff = Math.max(0.001, dt);
        const fPressure = (this.accumulatedImpulseLeft - this.accumulatedImpulseRight) / dtEff;
        
        const { minTravel, maxTravel, midPos } = this.getTravelLimits();

        let fSpring = 0;
        if (this.mode === 'spring') {
          const eqPos = this.equilibriumPos !== undefined ? this.equilibriumPos : midPos;
          fSpring = -this.springK * (this.getPos() - eqPos);
        }

        let fDamper = 0;
        if (this.mode === 'damper') {
          fDamper = -this.dampingCoeff * this.velocity;
          this.instantPower = this.dampingCoeff * this.velocity * this.velocity;
          this.workExtracted += this.instantPower * dt;
        } else {
          this.instantPower = 0;
        }

        const totalForce = fPressure + fSpring + fDamper - this.friction * this.velocity * 10;
        const effMass = Math.max(1, this.mass);

        this.acceleration = totalForce / effMass;
        this.velocity += this.acceleration * dt;

        let newPos = this.getPos() + this.velocity * dt;
        if (newPos <= minTravel) {
          newPos = minTravel;
          this.velocity = -this.velocity * 0.2;
        } else if (newPos >= maxTravel) {
          newPos = maxTravel;
          this.velocity = -this.velocity * 0.2;
        }
        this.setPos(newPos);
      }
    } else if (this.mode === 'controlled') {
      const { minTravel, maxTravel } = this.getTravelLimits();
      const target = Math.max(minTravel, Math.min(maxTravel, this.targetPos !== undefined ? this.targetPos : this.getPos()));
      const curPos = this.getPos();
      const diff = target - curPos;
      const dist = Math.abs(diff);
      const speed = Math.max(10, this.targetSpeed || 150);
      const maxStep = speed * dt;
      const prevPos = curPos;

      if (dist <= maxStep || dist < 0.5) {
        this.setPos(target);
        this.velocity = 0;
      } else {
        const step = Math.sign(diff) * maxStep;
        this.setPos(curPos + step);
        this.velocity = dt > 0 ? (this.getPos() - prevPos) / dt : 0;
      }
      this.instantPower = 0;
    } else if (this.mode === 'hold') {
      this.velocity = 0;
      this.instantPower = 0;
    }

    if (dt > 0) {
      this.forceLeft = this.accumulatedImpulseLeft / dt;
      this.forceRight = this.accumulatedImpulseRight / dt;
    }

    this.accumulatedImpulseLeft = 0;
    this.accumulatedImpulseRight = 0;
  }

  saveSnapshot() {
    this.initialX = this.x;
    this.initialY = this.y;
    this.initialMinPos = this.minPos;
    this.initialMaxPos = this.maxPos;
    this.initialVelocity = 0;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.x = this.initialX;
    this.y = this.initialY;
    if (this.initialMinPos !== undefined) this.minPos = this.initialMinPos;
    if (this.initialMaxPos !== undefined) this.maxPos = this.initialMaxPos;
    this.velocity = this.initialVelocity;
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
    this.forceLeft = 0;
    this.forceRight = 0;
    this.workExtracted = 0;
    this.instantPower = 0;
    this.accumulatedImpulseLeft = 0;
    this.accumulatedImpulseRight = 0;
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      orientation: this.orientation,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      minPos: this.minPos,
      maxPos: this.maxPos,
      mode: this.mode,
      mass: this.mass,
      springK: this.springK,
      frequency: this.frequency,
      amplitude: this.amplitude,
      phase: this.phase,
      dampingCoeff: this.dampingCoeff,
      targetPos: this.targetPos,
      targetSpeed: this.targetSpeed,
      conductivity: this.conductivity,
      temperature: this.temperature,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Piston(data);
  }
}
