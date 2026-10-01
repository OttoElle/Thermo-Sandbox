// ParticleLab Bundled Engine

// --- src/app/dom.js ---
// DOM element lookups shared by the app modules.


// Canvas DOM Elements
const canvas = document.getElementById('simCanvas');
const bgCanvas = document.getElementById('bgCanvas');
const gpuCanvas = document.getElementById('gpuCanvas') || document.getElementById('glCanvas');
const tempChartCanvas = document.getElementById('tempChartCanvas');
const velChartCanvas = document.getElementById('velChartCanvas');

// Header & Navigation Elements
const btnToggleGrid = document.getElementById('btnToggleGrid');
const selectGridSize = document.getElementById('selectGridSize');
const btnToggleSnap = document.getElementById('btnToggleSnap');
const btnToggleVectors = document.getElementById('btnToggleVectors');
const btnToggleColor = document.getElementById('btnToggleColor');
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');
const headerProjectTitle = document.getElementById('headerProjectTitle');
const fileImportInput = document.getElementById('fileImportInput');
const btnToolbarReset = document.getElementById('btnToolbarReset');
const btnToolbarClear = document.getElementById('btnToolbarClear');
const brandBadge = document.getElementById('brandBadge');
const brandTitle = document.getElementById('brandTitle');

// Splash Screen / Welcome Dashboard Elements
const splashOverlay = document.getElementById('splashOverlay');
const splashCard = document.getElementById('splashCard');
const btnSplashNew = document.getElementById('btnSplashNew');
const btnSplashOpen = document.getElementById('btnSplashOpen');
const btnSplashResume = document.getElementById('btnSplashResume');
const btnSplashClose = document.getElementById('btnSplashClose');
const splashRecentContainer = document.getElementById('splashRecentContainer');
const splashPresetsContainer = document.getElementById('splashPresetsContainer');
const btnClearRecent = document.getElementById('btnClearRecent');

// Transform Ribbon Elements
const btnRotate90 = document.getElementById('btnRotate90');
const btnFlipH = document.getElementById('btnFlipH');
const btnFlipV = document.getElementById('btnFlipV');
const btnGroupSelected = document.getElementById('btnGroupSelected');

// Save Modal Elements
const saveModal = document.getElementById('saveModal');
const saveProjectNameInput = document.getElementById('saveProjectNameInput');
const saveFilenamePreview = document.getElementById('saveFilenamePreview');
const btnSaveClose = document.getElementById('btnSaveClose');
const btnSaveCancel = document.getElementById('btnSaveCancel');
const btnSaveDownload = document.getElementById('btnSaveDownload');

// Custom Chart Dashboard Modal & Elements
const btnAddCustomChart = document.getElementById('btnAddCustomChart');
const chartModal = document.getElementById('chartModal');
const btnChartModalClose = document.getElementById('btnChartModalClose');
const btnChartCancel = document.getElementById('btnChartCancel');
const btnChartConfirm = document.getElementById('btnChartConfirm');
const selectChartTarget = document.getElementById('selectChartTarget');
const selectChartMetric = document.getElementById('selectChartMetric');
const customChartsContainer = document.getElementById('customChartsContainer');

// Left Sidebar & Floating Tool Options Dialog (Onshape CAD Style)
const sidebarLeft = document.getElementById('sidebarLeft');
const toolDialogPanel = document.getElementById('toolDialogPanel');
const toolDialogHeader = document.getElementById('toolDialogHeader');
const toolDialogTitle = document.getElementById('toolDialogTitle');
const toolDialogBadge = document.getElementById('toolDialogBadge');
const btnToolDialogClose = document.getElementById('btnToolDialogClose');
const toolDialogTitleGroup = document.getElementById('toolDialogTitleGroup');
const helpArrowIcon = document.getElementById('helpArrowIcon');
const toolDialogHelpPanel = document.getElementById('toolDialogHelpPanel');
const toolPropertiesContainer = document.getElementById('toolPropertiesContainer');
const elementsListContainer = document.getElementById('elementsListContainer');
const elementCountBadge = document.getElementById('elementCountBadge');

// Context Popup & Menu

const contextMenu = document.getElementById('contextMenu');
const ctxDuplicate = document.getElementById('ctxDuplicate');
const ctxGroup = document.getElementById('ctxGroup');
const ctxBringFront = document.getElementById('ctxBringFront');
const ctxBringForward = document.getElementById('ctxBringForward');
const ctxSendBackward = document.getElementById('ctxSendBackward');
const ctxSendBack = document.getElementById('ctxSendBack');
const ctxDelete = document.getElementById('ctxDelete');

// Playback Bar & Model Toggle Controls
const modelToggleGroup = document.getElementById('modelToggleGroup');
const modelToggleBtns = modelToggleGroup ? modelToggleGroup.querySelectorAll('.model-toggle-btn') : [];
const btnToggleGravity = document.getElementById('btnToggleGravity');
const btnPlayPause = document.getElementById('btnPlayPause');
const playIcon = document.getElementById('playIcon');
const btnStep = document.getElementById('btnStep');
const btnStepBack = document.getElementById('btnStepBack');
const btnStopReset = document.getElementById('btnStopReset');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');
const timeVal = document.getElementById('timeVal');

// Zoom Controls
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnResetView = document.getElementById('btnResetView');
const zoomDisplay = document.getElementById('zoomDisplay');

// Stats & Chamber Analytics
const statN = document.getElementById('statN');
const statT = document.getElementById('statT');
const statE = document.getElementById('statE');
const statV = document.getElementById('statV');
const chamberCardsContainer = document.getElementById('chamberCardsContainer');
const tabTemp = document.getElementById('tabTemp');
const tabPV = document.getElementById('tabPV');

const infoModal = document.getElementById('infoModal');
const btnInfoClose = document.getElementById('btnInfoClose');


// --- src/physics/Vector2.js ---
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  divideScalar(s) {
    if (s !== 0) {
      this.x /= s;
      this.y /= s;
    }
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len > 0.00001) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceToSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  negate() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  perpendicular() {
    return new Vector2(-this.y, this.x);
  }
}


// --- src/physics/Particle.js ---

class Particle {
  constructor(x, y, vx = 0, vy = 0, mass = 1, id = 0, groupId = null) {
    this.id = id;
    this.groupId = groupId;
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(vx, vy);
    this.mass = Math.max(0.1, mass);
    
    // Radius scales with sqrt(mass): base radius 3.5px for mass=1
    this.baseRadius = 3.5;
    this.radius = this.baseRadius * Math.sqrt(this.mass);
    
    this.fixed = false;
    this.selected = false;
    this.tag = 'default';

    // Stored initial state for reset snapshot
    this.initialPos = new Vector2(x, y);
    this.initialVel = new Vector2(vx, vy);
    this.initialGroupId = groupId;
  }

  setMass(m) {
    this.mass = Math.max(0.1, m);
    this.radius = this.baseRadius * Math.sqrt(this.mass);
  }

  getSpeed() {
    return this.vel.length();
  }

  getSpeedSq() {
    return this.vel.lengthSq();
  }

  getKineticEnergy() {
    return 0.5 * this.mass * this.vel.lengthSq();
  }

  update(dt) {
    if (this.fixed) return;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  saveSnapshot() {
    this.initialPos = this.pos.clone();
    this.initialVel = this.vel.clone();
  }

  restoreSnapshot() {
    this.pos = this.initialPos.clone();
    this.vel = this.initialVel.clone();
  }
}


// --- src/physics/Constants.js ---
// Simulation units shared by the CPU physics, the WGSL kernels (templated in
// ParticleGPUComputeShader.js) and the analytics.

// Boltzmann constant in simulation units (px, px/s, mass 1): a 2D gas at
// temperature T has mean kinetic energy kB·T per particle.
const KB = 35.0;

// Side length of the square world in px; also the default simulation bounds.
const WORLD_SIZE = 2500;

// Displayed pressure of N particles in area A: P = N/A · kB·T · PRESSURE_SCALE.
const PRESSURE_SCALE = 100;

function idealGasPressure(count, area, temperature) {
  return (count / (area || 1)) * KB * temperature * PRESSURE_SCALE;
}


// --- src/physics/ParticleGroup.js ---

class ParticleGroup {
  constructor(options = {}) {
    this.id = options.id || 'pg_' + Math.random().toString(36).substring(2, 9);
    this.label = options.label || 'Gas Group';
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.mass = options.mass !== undefined ? options.mass : 1.0;
    this.count = options.count !== undefined ? options.count : 0;
    this.x = options.x !== undefined ? options.x : 0;
    this.y = options.y !== undefined ? options.y : 0;
    this.width = options.width !== undefined ? options.width : 0;
    this.height = options.height !== undefined ? options.height : 0;
    this.groupId = this.id;
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      temperature: this.temperature,
      mass: this.mass,
      count: this.count,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  static fromJSON(data) {
    return new ParticleGroup(data);
  }

  getActiveParticles(engine) {
    if (!engine || !engine.particles) return [];
    return engine.particles.filter(p => p.groupId === this.id);
  }

  getActiveCount(engine) {
    return this.getActiveParticles(engine).length;
  }

  getAverageTemperature(engine) {
    const pts = this.getActiveParticles(engine);
    if (pts.length === 0) return this.temperature;
    let sumE = 0;
    for (let i = 0; i < pts.length; i++) {
      sumE += pts[i].getKineticEnergy();
    }
    return Math.max(5, sumE / (pts.length * KB));
  }
}

// --- src/physics/SpatialGrid.js ---
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.grid = new Map();
  }

  resize(width, height, cellSize = this.cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.clear();
  }

  clear() {
    this.grid.clear();
  }

  _getKey(col, row) {
    return (col << 16) ^ row;
  }

  insert(particle) {
    const col = Math.floor(particle.pos.x / this.cellSize);
    const row = Math.floor(particle.pos.y / this.cellSize);
    const key = this._getKey(col, row);

    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(particle);
  }

  populate(particles) {
    this.clear();
    for (let i = 0; i < particles.length; i++) {
      this.insert(particles[i]);
    }
  }

  getNeighbors(particle) {
    const neighbors = [];
    const col = Math.floor(particle.pos.x / this.cellSize);
    const row = Math.floor(particle.pos.y / this.cellSize);

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = col + dc;
        const r = row + dr;
        const key = this._getKey(c, r);
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const other = cell[i];
            if (other.id !== particle.id) {
              neighbors.push(other);
            }
          }
        }
      }
    }
    return neighbors;
  }

  forEachPair(callback) {
    // Iterate through all cells and avoid checking the same pair twice
    for (const [key, cell] of this.grid.entries()) {
      const col = (key >> 16);
      const row = (key & 0xffff);

      // Check within same cell
      const len = cell.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          callback(cell[i], cell[j]);
        }
      }

      // Check neighbor cells in 4 directions to cover all unique pairs
      const neighborOffsets = [
        [1, 0], [0, 1], [1, 1], [-1, 1]
      ];

      for (let k = 0; k < neighborOffsets.length; k++) {
        const nc = col + neighborOffsets[k][0];
        const nr = row + neighborOffsets[k][1];
        const nKey = this._getKey(nc, nr);
        const nCell = this.grid.get(nKey);
        if (nCell) {
          const nLen = nCell.length;
          for (let i = 0; i < len; i++) {
            for (let j = 0; j < nLen; j++) {
              callback(cell[i], nCell[j]);
            }
          }
        }
      }
    }
  }
}


// --- src/physics/Wall.js ---

class Wall {
  constructor(x1, y1, x2, y2, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.p1 = new Vector2(x1, y1);
    this.p2 = new Vector2(x2, y2);
    
    // Type: 'standard', 'manual_valve', 'check_valve', 'relief_valve'
    this.type = options.type || 'standard';

    // Thermal property: Wärmeleitfähigkeit kappa in [0, 1]
    this.conductivity = options.conductivity !== undefined ? options.conductivity : 0.0; // 0 = vollständig isolierend
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    // ~11 particles (kB = 35 J/K each): smaller walls flicker strongly from single hits
    this.heatCapacity = options.heatCapacity !== undefined ? options.heatCapacity : 400;
    this.heatAccumulator = 0;
    this.conductanceAccumulator = 0;

    // Valve properties
    this.isOpen = options.isOpen !== undefined ? options.isOpen : false;
    this.allowedDirection = options.allowedDirection !== undefined ? options.allowedDirection : 1; // 1 = along normal, -1 = opposite
    this.triggerPressure = options.triggerPressure !== undefined ? options.triggerPressure : 250; // Threshold Pa for relief_valve
    this.pressureHysteresis = options.pressureHysteresis !== undefined ? options.pressureHysteresis : 25; // Hysteresis band in Pa
    this.reliefMode = options.reliefMode || 'oneway'; // 'oneway' or 'bidirectional'

    this.thickness = options.thickness || 4;

    // Pressure tracking
    this.accumulatedImpulse = 0;
    this.currentPressure = 0;
    this.smoothedPressure = 0;

    // Initial snapshot state
    this.initialTemperature = this.temperature;
    this.initialIsOpen = this.isOpen;
    if (options.groupId) this.groupId = options.groupId;

    this._updateGeometry();
  }

  _updateGeometry() {
    this.dir = new Vector2(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    this.length = this.dir.length();
    this.lenSq = this.length * this.length;
    this.unitDir = this.length > 0 ? this.dir.clone().normalize() : new Vector2(1, 0);
    this.normal = new Vector2(-this.unitDir.y, this.unitDir.x);
  }

  setPoints(x1, y1, x2, y2) {
    this.p1.set(x1, y1);
    this.p2.set(x2, y2);
    this._updateGeometry();
  }

  getClosestPointCoords(px, py, out) {
    if (this.lenSq <= 0.00001) {
      out.x = this.p1.x;
      out.y = this.p1.y;
      return out;
    }
    const vx = px - this.p1.x;
    const vy = py - this.p1.y;
    const t = Math.max(0, Math.min(1, (vx * this.dir.x + vy * this.dir.y) / this.lenSq));
    out.x = this.p1.x + t * this.dir.x;
    out.y = this.p1.y + t * this.dir.y;
    return out;
  }

  getClosestPoint(p) {
    if (this.length === 0) return this.p1.clone();
    const v = new Vector2(p.x - this.p1.x, p.y - this.p1.y);
    const t = Math.max(0, Math.min(1, v.dot(this.dir) / (this.length * this.length)));
    return new Vector2(
      this.p1.x + t * this.dir.x,
      this.p1.y + t * this.dir.y
    );
  }

  addHeat(joules) {
    this.heatAccumulator += joules;
  }

  // Stiffness guard: accumulated coupling conductance makes the heat update implicit.
  addConductance(g) {
    this.conductanceAccumulator += g;
  }

  recordImpulse(impulseMagnitude) {
    this.accumulatedImpulse += impulseMagnitude;
  }

  toggleValve() {
    if (this.type === 'manual_valve') {
      this.isOpen = !this.isOpen;
    }
  }

  flipDirection() {
    this.allowedDirection = -this.allowedDirection;
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0) {
      this.temperature += this.heatAccumulator / (this.heatCapacity + this.conductanceAccumulator);
      this.heatAccumulator = 0;
      this.conductanceAccumulator = 0;
      // Floor at 5 K: the deficit stays as heat owed, so clamping creates no energy
      if (this.temperature < 5) {
        this.heatAccumulator = (this.temperature - 5) * this.heatCapacity;
        this.temperature = 5;
      }
    }

    if (dt > 0 && this.length > 0) {
      this.currentPressure = this.accumulatedImpulse / (this.length * dt);
      this.smoothedPressure = this.smoothedPressure * 0.85 + this.currentPressure * 0.15;
      this.accumulatedImpulse = 0;

      if (this.type === 'relief_valve') {
        const hyst = this.pressureHysteresis !== undefined ? this.pressureHysteresis : 25;
        if (!this.isOpen && this.smoothedPressure >= this.triggerPressure) {
          this.isOpen = true;
        } else if (this.isOpen && this.smoothedPressure < Math.max(0, this.triggerPressure - hyst)) {
          this.isOpen = false;
        }
      }
    }
  }

  conductTo(otherWall, dt) {
    if (this.conductivity <= 0 || otherWall.conductivity <= 0) return;
    const effConductivity = (this.conductivity + otherWall.conductivity) * 0.5;
    const deltaT = otherWall.temperature - this.temperature;
    const qRate = effConductivity * deltaT * 50;
    this.addHeat(qRate * dt);
    otherWall.addHeat(-qRate * dt);
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsOpen = this.isOpen;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isOpen = this.initialIsOpen;
    this.heatAccumulator = 0;
    this.accumulatedImpulse = 0;
    this.currentPressure = 0;
    this.smoothedPressure = 0;
  }

  toJSON() {
    return {
      id: this.id,
      p1: { x: this.p1.x, y: this.p1.y },
      p2: { x: this.p2.x, y: this.p2.y },
      type: this.type,
      conductivity: this.conductivity,
      temperature: this.temperature,
      heatCapacity: this.heatCapacity,
      isOpen: this.isOpen,
      allowedDirection: this.allowedDirection,
      triggerPressure: this.triggerPressure,
      pressureHysteresis: this.pressureHysteresis,
      reliefMode: this.reliefMode,
      thickness: this.thickness,
      groupId: this.groupId || undefined
    };
  }

  static fromJSON(data) {
    return new Wall(data.p1.x, data.p1.y, data.p2.x, data.p2.y, data);
  }
}


// --- src/physics/Piston.js ---

class Piston {
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
    this.conductanceAccumulator = 0;

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

  // Stiffness guard: accumulated coupling conductance makes the heat update implicit.
  addConductance(g) {
    if (this.isActive) {
      this.conductanceAccumulator += g;
    }
  }

  update(dt, totalTime) {
    if (dt > 0 && this.heatCapacity > 0 && this.isActive) {
      this.temperature += this.heatAccumulator / (this.heatCapacity + this.conductanceAccumulator);
      this.heatAccumulator = 0;
      this.conductanceAccumulator = 0;
      // Floor at 5 K: the deficit stays as heat owed, so clamping creates no energy
      if (this.temperature < 5) {
        this.heatAccumulator = (this.temperature - 5) * this.heatCapacity;
        this.temperature = 5;
      }
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
      // Approach the sinusoid at no more than its peak speed. Without this the
      // piston teleports onto the curve at start/reset/mode switch and shoots
      // particles out at thousands of px/s.
      const maxStep = amplitude * omega * dt * 1.05;
      const delta = targetPos - prevPos;
      this.setPos(Math.abs(delta) > maxStep ? prevPos + Math.sign(delta) * maxStep : targetPos);
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


// --- src/physics/Reservoir.js ---

class Reservoir {
  constructor(x, y, width = 80, height = 60, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.temperature = options.temperature !== undefined ? Math.max(5, options.temperature) : 500; // Constant Kelvin
    this.conductance = options.conductance !== undefined ? Math.max(0.01, Math.min(1.0, options.conductance)) : 0.8; // Coupling factor to walls and particles
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.label = options.label || `Isotherm Block (${Math.round(this.temperature)}K)`;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBounds() {
    if (!this._bounds) this._bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    this._bounds.left = this.x;
    this._bounds.right = this.x + this.width;
    this._bounds.top = this.y;
    this._bounds.bottom = this.y + this.height;
    return this._bounds;
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
  }

  intersectsSegment(p1, p2) {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    return !(maxX < this.x || minX > this.x + this.width || maxY < this.y || minY > this.y + this.height);
  }

  applyThermalCoupling(wall, dt) {
    if (!this.isActive) return;
    if (this.intersectsSegment(wall.p1, wall.p2) && wall.conductivity > 0) {
      const deltaT = this.temperature - wall.temperature;
      const heatRate = this.conductance * wall.conductivity * deltaT * 120;
      wall.addHeat(heatRate * dt);
    }
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      temperature: this.temperature,
      conductance: this.conductance,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Reservoir(data.x, data.y, data.width, data.height, data);
  }
}


// --- src/physics/HistoryBuffer.js ---
// Time series of the global system and of sensor zones. Samples are kept for
// the whole run: the most recent HISTORY_FULL_RES samples at full resolution,
// older ones merged pairwise whenever the buffer exceeds HISTORY_MAX, so memory
// stays bounded while the complete history remains plottable.

const HISTORY_KEYS = [
  'historyTime', 'historyTemp', 'historyPressure', 'historyVolume',
  'historyCount', 'historyKineticEnergy', 'historyDrift', 'historyCycle'
];

const HISTORY_INTERVAL = 0.045; // s of simulation time between samples
const HISTORY_FULL_RES = 900;           // ~40 s at full resolution
const HISTORY_MAX = 4000;

// Shared sample context: the engine sets the current sequencer cycle each
// step so global and sensor samples carry the same cycle index (P-V loops).
const historyClock = { cycle: 0 };

function resetHistory(target) {
  for (const k of HISTORY_KEYS) target[k] = [];
  target._historyBucket = 0;
}

// Appends one sample { t, temp, pressure, volume, count, kinetic, drift }.
function appendHistory(target, s) {
  if (!target.historyCycle) target.historyCycle = [];
  target.historyTime.push(s.t);
  target.historyTemp.push(s.temp);
  target.historyPressure.push(s.pressure);
  target.historyVolume.push(s.volume);
  target.historyCount.push(s.count);
  target.historyKineticEnergy.push(s.kinetic);
  target.historyDrift.push(s.drift);
  target.historyCycle.push(historyClock.cycle);
  if (target.historyTime.length > HISTORY_MAX) compactHistory(target);
}

// Re-samples everything but the most recent samples into uniform time buckets
// (bucket width doubles as the run grows), so the older history keeps an even
// resolution. Values are averaged; a bucket keeps its last cycle index.
function compactHistory(target) {
  const n = target.historyTime.length;
  const old = n - HISTORY_FULL_RES;
  const t = target.historyTime;
  const t0 = t[0], span = t[old - 1] - t0;
  let bucket = target._historyBucket || HISTORY_INTERVAL;
  while (span / bucket > (HISTORY_MAX - HISTORY_FULL_RES) / 2) bucket *= 2;
  target._historyBucket = bucket;

  const out = Object.fromEntries(HISTORY_KEYS.map(k => [k, []]));
  let i = 0;
  while (i < old) {
    const b = Math.floor((t[i] - t0) / bucket);
    let j = i;
    while (j < old && Math.floor((t[j] - t0) / bucket) === b) j++;
    for (const k of HISTORY_KEYS) {
      const a = target[k];
      if (k === 'historyCycle') { out[k].push(a[j - 1]); continue; }
      let sum = 0;
      for (let m = i; m < j; m++) sum += a[m];
      out[k].push(sum / (j - i));
    }
    i = j;
  }
  for (const k of HISTORY_KEYS) target[k] = out[k].concat(target[k].slice(old));
}

function lastHistoryTime(target) {
  const t = target.historyTime;
  return t && t.length > 0 ? t[t.length - 1] : null;
}


// --- src/physics/SensorZone.js ---

class SensorZone {
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

    // Piston Binding for Dynamic Chamber Expansion / Compression
    if (options.pistonBinding) {
      this.pistonBinding = {
        pistonId: options.pistonBinding.pistonId || null,
        edge: options.pistonBinding.edge || 'right',
        lockCrossDimension: options.pistonBinding.lockCrossDimension !== false,
        fixedOpposite: options.pistonBinding.fixedOpposite !== undefined ? options.pistonBinding.fixedOpposite : null
      };
    } else {
      this.pistonBinding = null;
    }
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
    this.volume = area;
    this.density = area > 0 ? (effectiveCount / area) * 1000 : 0;
    this.kineticEnergy = sampleKinetic * scaleFactor;
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
      appendHistory(this, {
        t: currentTime, temp: this.temperature, pressure: this.pressure, volume: this.volume,
        count: this.particleCount, kinetic: this.kineticEnergy, drift: this.displayDriftSpeed
      });
    }
  }

  clearHistory() {
    resetHistory(this);
    this.driftVx = 0;
    this.driftVy = 0;
    this.driftSpeed = 0;
    this.displayDriftSpeed = 0;
  }

  bindToPiston(piston, edge = 'right', lockCrossDimension = true) {
    if (!piston) {
      this.unbindPiston();
      return;
    }
    let fixedOpposite = null;
    if (edge === 'right') {
      fixedOpposite = this.x;
    } else if (edge === 'left') {
      fixedOpposite = this.x + this.width;
    } else if (edge === 'bottom') {
      fixedOpposite = this.y;
    } else if (edge === 'top') {
      fixedOpposite = this.y + this.height;
    }

    this.pistonBinding = {
      pistonId: piston.id,
      edge,
      lockCrossDimension,
      fixedOpposite
    };
    this.updateBoundsFromPiston(piston);
  }

  unbindPiston() {
    this.pistonBinding = null;
  }

  updateBoundsFromPiston(piston) {
    if (!this.pistonBinding || !this.pistonBinding.pistonId || !piston) return;
    const pb = this.pistonBinding;
    const pBounds = piston.getBounds();

    if (piston.orientation === 'horizontal') {
      if (pb.edge === 'right') {
        // Chamber is to the left of piston; its right edge matches the piston's left face
        const targetRight = pBounds.left;
        this.width = Math.max(15, targetRight - this.x);
      } else if (pb.edge === 'left') {
        // Chamber is to the right of piston; its left edge matches the piston's right face
        const fixedRight = (pb.fixedOpposite !== null && pb.fixedOpposite !== undefined) ? pb.fixedOpposite : (this.x + this.width);
        const targetLeft = pBounds.right;
        this.x = targetLeft;
        this.width = Math.max(15, fixedRight - targetLeft);
      }
      if (pb.lockCrossDimension !== false) {
        this.y = pBounds.top;
        this.height = piston.height;
      }
    } else { // vertical orientation
      if (pb.edge === 'bottom') {
        // Chamber is above piston; its bottom edge matches the piston's top face
        const targetBottom = pBounds.top;
        this.height = Math.max(15, targetBottom - this.y);
      } else if (pb.edge === 'top') {
        // Chamber is below piston; its top edge matches the piston's bottom face
        const fixedBottom = (pb.fixedOpposite !== null && pb.fixedOpposite !== undefined) ? pb.fixedOpposite : (this.y + this.height);
        const targetTop = pBounds.bottom;
        this.y = targetTop;
        this.height = Math.max(15, fixedBottom - targetTop);
      }
      if (pb.lockCrossDimension !== false) {
        this.x = pBounds.left;
        this.width = piston.width;
      }
    }

    this.volume = this.width * this.height;
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
      pistonBinding: this.pistonBinding ? { ...this.pistonBinding } : null
    };
  }

  static fromJSON(data) {
    return new SensorZone(data);
  }
}


// --- src/physics/Emitter.js ---

class Emitter {
  constructor(x, y, width = 40, height = 40, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rate = options.rate !== undefined ? options.rate : 8; // particles per second
    this.temperature = options.temperature !== undefined ? options.temperature : 350;
    this.mass = options.mass !== undefined ? options.mass : 1.0;
    this.direction = options.direction || 'right'; // 'right', 'left', 'up', 'down', 'radial', '360'
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.maxParticles = options.maxParticles !== undefined ? options.maxParticles : 0; // 0 = unlimited
    this.emittedCount = 0;
    this.timer = 0;

    this.initialEnabled = this.enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  saveSnapshot() {
    this.initialEnabled = this.enabled;
    this.emittedCount = 0;
  }

  restoreSnapshot() {
    this.enabled = this.initialEnabled;
    this.emittedCount = 0;
    this.timer = 0;
  }

  update(dt, engine) {
    if (!this.enabled || this.rate <= 0 || dt <= 0) return;
    if (this.maxParticles > 0 && this.emittedCount >= this.maxParticles) return;

    this.timer += dt;
    const interval = 1.0 / this.rate;

    const thermalSpeed = Math.sqrt((2 * KB * Math.max(5, this.temperature)) / Math.max(0.01, this.mass));

    while (this.timer >= interval) {
      this.timer -= interval;
      if (this.maxParticles > 0 && this.emittedCount >= this.maxParticles) break;
      
      // Spawn position randomly inside emitter bounds
      const px = this.x + Math.random() * this.width;
      const py = this.y + Math.random() * this.height;

      let vx = 0, vy = 0;
      const spreadAngle = (Math.random() - 0.5) * 0.35; // subtle thermal divergence
      const speedFluct = thermalSpeed * (0.9 + Math.random() * 0.2);

      if (this.direction === 'right') {
        vx = speedFluct * Math.cos(spreadAngle);
        vy = speedFluct * Math.sin(spreadAngle);
      } else if (this.direction === 'left') {
        vx = -speedFluct * Math.cos(spreadAngle);
        vy = speedFluct * Math.sin(spreadAngle);
      } else if (this.direction === 'down') {
        vx = speedFluct * Math.sin(spreadAngle);
        vy = speedFluct * Math.cos(spreadAngle);
      } else if (this.direction === 'up') {
        vx = speedFluct * Math.sin(spreadAngle);
        vy = -speedFluct * Math.cos(spreadAngle);
      } else { // 'radial' or '360'
        const theta = Math.random() * Math.PI * 2;
        vx = speedFluct * Math.cos(theta);
        vy = speedFluct * Math.sin(theta);
      }

      engine.addParticle(px, py, vx, vy, this.mass);
      this.emittedCount++;
    }
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rate: this.rate,
      temperature: this.temperature,
      mass: this.mass,
      direction: this.direction,
      enabled: this.enabled,
      maxParticles: this.maxParticles
    };
  }


  static fromJSON(data) {
    return new Emitter(data.x, data.y, data.width, data.height, data);
  }
}


// --- src/physics/Sink.js ---

class Sink {
  constructor(x, y, width = 40, height = 40, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.absorptionEfficiency = options.absorptionEfficiency !== undefined ? options.absorptionEfficiency : 1.0;
    this.direction = options.direction || '360'; // '360', 'right', 'left', 'down', 'up'
    this.maxParticles = options.maxParticles !== undefined ? options.maxParticles : 0; // 0 = unlimited
    this.tempFilterMode = options.tempFilterMode || 'all'; // 'all', 'above', 'below'
    this.filterTemperature = options.filterTemperature !== undefined ? options.filterTemperature : 300; // Kelvin
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.absorbedCount = 0;

    this.initialIsActive = this.isActive;
    this.initialAbsorbedCount = 0;
  }

  toggle() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  saveSnapshot() {
    this.initialIsActive = this.isActive;
    this.initialAbsorbedCount = this.absorbedCount;
  }

  restoreSnapshot() {
    this.isActive = this.initialIsActive;
    this.absorbedCount = 0;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  tryAbsorb(particle) {
    if (!this.isActive) return false;
    if (this.maxParticles > 0 && this.absorbedCount >= this.maxParticles) return false;

    if (this.contains(particle.pos.x, particle.pos.y)) {
      // Direction Filter
      if (this.direction === 'right' && particle.vel.x <= 0) return false;
      if (this.direction === 'left' && particle.vel.x >= 0) return false;
      if (this.direction === 'down' && particle.vel.y <= 0) return false;
      if (this.direction === 'up' && particle.vel.y >= 0) return false;

      // Temperature Filter
      if (this.tempFilterMode !== 'all') {
        const vSq = particle.vel.x * particle.vel.x + particle.vel.y * particle.vel.y;
        const pTemp = (particle.mass * vSq) / (2 * KB);
        if (this.tempFilterMode === 'above' && pTemp < this.filterTemperature) return false;
        if (this.tempFilterMode === 'below' && pTemp > this.filterTemperature) return false;
      }

      if (Math.random() <= this.absorptionEfficiency) {
        this.absorbedCount++;
        return true; // remove particle
      }
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      absorptionEfficiency: this.absorptionEfficiency,
      direction: this.direction,
      maxParticles: this.maxParticles,
      tempFilterMode: this.tempFilterMode,
      filterTemperature: this.filterTemperature,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Sink(data.x, data.y, data.width, data.height, data);
  }
}



// --- src/physics/ThermalBlock.js ---

class ThermalBlock {
  constructor(x, y, width = 80, height = 60, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'solid'; // Solid thermal obstacle
    this.temperature = options.temperature !== undefined ? Math.max(5, options.temperature) : 300;
    this.heatCapacity = options.heatCapacity !== undefined ? Math.max(10, options.heatCapacity) : 300; // Joules/K
    this.conductivity = options.conductivity !== undefined ? Math.max(0.01, Math.min(1.0, options.conductivity)) : 0.6; // Surface thermal coupling
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.heatAccumulator = 0;
    this.conductanceAccumulator = 0;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
    this.label = options.label || `Thermal Storage (${Math.round(this.temperature)}K)`;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBounds() {
    if (!this._bounds) this._bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    this._bounds.left = this.x;
    this._bounds.right = this.x + this.width;
    this._bounds.top = this.y;
    this._bounds.bottom = this.y + this.height;
    return this._bounds;
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  addHeat(joules) {
    if (this.isActive) {
      this.heatAccumulator += joules;
    }
  }

  // Stiffness guard: accumulated coupling conductance makes the heat update implicit.
  addConductance(g) {
    if (this.isActive) {
      this.conductanceAccumulator += g;
    }
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0 && this.isActive) {
      this.temperature += this.heatAccumulator / (this.heatCapacity + this.conductanceAccumulator);
      this.heatAccumulator = 0;
      this.conductanceAccumulator = 0;
      // Floor at 5 K: the deficit stays as heat owed, so clamping creates no energy
      if (this.temperature < 5) {
        this.heatAccumulator = (this.temperature - 5) * this.heatCapacity;
        this.temperature = 5;
      }
    }
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
    this.heatAccumulator = 0;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      type: this.type,
      temperature: this.temperature,
      heatCapacity: this.heatCapacity,
      conductivity: this.conductivity,
      isActive: this.isActive,
      label: this.label
    };
  }

  static fromJSON(data) {
    return new ThermalBlock(data.x, data.y, data.width, data.height, data);
  }
}


// --- src/physics/HeatExchanger.js ---

class HeatExchanger {
  constructor(x, y, width = 80, height = 60, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.temperature = options.temperature !== undefined ? Math.max(5, options.temperature) : 300; // Constant Kelvin (T_body)
    this.conductivity = options.conductivity !== undefined ? Math.max(0.01, Math.min(1.0, options.conductivity)) : 0.6; // Coupling rate kappa
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.label = options.label || `Heat Exchanger (${Math.round(this.temperature)}K)`;
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  saveSnapshot() {
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      temperature: this.temperature,
      conductivity: this.conductivity,
      isActive: this.isActive,
      label: this.label
    };
  }

  static fromJSON(data) {
    return new HeatExchanger(data.x, data.y, data.width, data.height, data);
  }
}


// --- src/physics/RegeneratorMatrix.js ---

class RegeneratorMatrix {
  constructor(x, y, width = 120, height = 70, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.orientation = options.orientation || (this.width >= this.height ? 'horizontal' : 'vertical');
    this.sliceCount = options.sliceCount || 10;
    this.heatCapacity = options.heatCapacity !== undefined ? Math.max(10, options.heatCapacity) : 400; // Total Joules/K
    this.conductivity = options.conductivity !== undefined ? Math.max(0.01, Math.min(1.0, options.conductivity)) : 0.7; // Gas-matrix exchange rate
    this.axialConductivity = options.axialConductivity !== undefined ? options.axialConductivity : 0.05; // Thermal leak along matrix
    this.isActive = options.isActive !== undefined ? options.isActive : true;
    this.label = options.label || 'Regenerator Matrix';

    const baseT = options.temperature !== undefined ? Math.max(5, options.temperature) : 300;
    if (Array.isArray(options.temperatures) && options.temperatures.length === this.sliceCount) {
      this.temperatures = options.temperatures.map(t => Math.max(5, t));
    } else {
      this.temperatures = new Array(this.sliceCount).fill(baseT);
    }

    this.heatAccumulators = new Array(this.sliceCount).fill(0);
    this.conductanceAccumulators = new Array(this.sliceCount).fill(0);
    this.initialTemperatures = [...this.temperatures];
    this.initialIsActive = this.isActive;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }

  getSliceIndex(px, py) {
    if (!this.contains(px, py)) return -1;
    if (this.orientation === 'horizontal') {
      // Horizontal bands parallel to horizontal flow lines
      const frac = Math.max(0, Math.min(0.9999, (py - this.y) / this.height));
      return Math.floor(frac * this.sliceCount);
    } else {
      // Vertical bands parallel to vertical flow lines
      const frac = Math.max(0, Math.min(0.9999, (px - this.x) / this.width));
      return Math.floor(frac * this.sliceCount);
    }
  }

  getAverageTemperature() {
    if (this.temperatures.length === 0) return 300;
    const sum = this.temperatures.reduce((a, b) => a + b, 0);
    return sum / this.temperatures.length;
  }

  addHeatToSlice(idx, joules) {
    if (idx >= 0 && idx < this.sliceCount) {
      this.heatAccumulators[idx] += joules;
    }
  }

  // Stiffness guard: accumulated coupling conductance makes the slice heat update implicit.
  addConductanceToSlice(idx, g) {
    if (idx >= 0 && idx < this.sliceCount) {
      this.conductanceAccumulators[idx] += g;
    }
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  update(dt) {
    if (dt <= 0 || !this.isActive) return;

    const sliceCapacity = Math.max(1, this.heatCapacity / this.sliceCount);

    // 1. Apply particle heat exchanges
    for (let i = 0; i < this.sliceCount; i++) {
      if (this.heatAccumulators[i] !== 0) {
        this.temperatures[i] += this.heatAccumulators[i] / (sliceCapacity + this.conductanceAccumulators[i]);
        this.heatAccumulators[i] = 0;
        this.conductanceAccumulators[i] = 0;
        // Floor at 5 K: the deficit stays as heat owed, so clamping creates no energy
        if (this.temperatures[i] < 5) {
          this.heatAccumulators[i] = (this.temperatures[i] - 5) * sliceCapacity;
          this.temperatures[i] = 5;
        }
      }
    }

    // 2. Slow axial thermal diffusion between adjacent slices
    if (this.axialConductivity > 0 && this.sliceCount > 1) {
      const diffRate = this.axialConductivity * 8.0 * dt;
      const nextTemps = [...this.temperatures];
      for (let i = 0; i < this.sliceCount - 1; i++) {
        const flux = (this.temperatures[i + 1] - this.temperatures[i]) * diffRate;
        nextTemps[i] += flux;
        nextTemps[i + 1] -= flux;
      }
      for (let i = 0; i < this.sliceCount; i++) {
        this.temperatures[i] = Math.max(5, nextTemps[i]);
      }
    }
  }

  saveSnapshot() {
    this.initialTemperatures = [...this.temperatures];
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.temperatures = [...this.initialTemperatures];
    this.heatAccumulators.fill(0);
    this.conductanceAccumulators.fill(0);
    this.isActive = this.initialIsActive;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      orientation: this.orientation,
      sliceCount: this.sliceCount,
      heatCapacity: this.heatCapacity,
      conductivity: this.conductivity,
      axialConductivity: this.axialConductivity,
      isActive: this.isActive,
      label: this.label,
      temperatures: [...this.temperatures]
    };
  }

  static fromJSON(data) {
    return new RegeneratorMatrix(data.x, data.y, data.width, data.height, data);
  }
}


// --- src/physics/TextLabel.js ---
class TextLabel {
  constructor(x, y, text = 'Notiz', options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.text = text;
    this.fontSize = options.fontSize || 14;
    this.color = options.color || '#94a3b8';
    this.width = options.width || Math.max(60, this.text.length * (this.fontSize * 0.65) + 16);
    this.height = options.height || (this.fontSize + 12);
  }

  getBounds() {
    const w = Math.max(50, this.width || (this.text.length * (this.fontSize * 0.65) + 16));
    const h = Math.max(20, this.height || (this.fontSize + 12));
    return {
      left: this.x,
      top: this.y,
      right: this.x + w,
      bottom: this.y + h,
      width: w,
      height: h
    };
  }

  contains(px, py) {
    const b = this.getBounds();
    return px >= b.left && px <= b.right && py >= b.top && py <= b.bottom;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      text: this.text,
      fontSize: this.fontSize,
      color: this.color,
      width: this.width,
      height: this.height
    };
  }

  static fromJSON(data) {
    return new TextLabel(data.x, data.y, data.text, data);
  }
}


// --- src/physics/Regulator.js ---

class Regulator {
  constructor(x, y, width = 80, height = 80, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.targetCount = options.targetCount !== undefined ? options.targetCount : 50;
    this.hysteresis = options.hysteresis !== undefined ? options.hysteresis : 3;
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.mass = options.mass !== undefined ? options.mass : 1.0;
    this.rate = options.rate !== undefined ? options.rate : 15; // max adjustment particles per second
    this.isActive = options.isActive !== undefined ? options.isActive : true;

    this.currentCount = 0;
    this.regulationState = 'idle'; // 'idle', 'emitting', or 'absorbing'
    this.timer = 0;
    this.initialActive = this.isActive;

    // GPU mode: last zone population measured on the GPU plus the net change
    // this regulator requested since (emitted minus requested removals).
    this.gpuCount = 0;
    this.gpuDelta = 0;
  }

  resetGPUCount(count) {
    this.gpuCount = count;
    this.gpuDelta = 0;
  }

  // `deltaAtSubmit` is gpuDelta at the time the readback was submitted; those
  // changes are already reflected in `count`.
  applyGPUCount(count, deltaAtSubmit = 0) {
    this.gpuCount = count;
    this.gpuDelta -= deltaAtSubmit;
  }

  toggle() {
    this.isActive = !this.isActive;
    if (!this.isActive) {
      this.regulationState = 'idle';
      this.timer = 0;
    }
    return this.isActive;
  }

  saveSnapshot() {
    this.initialActive = this.isActive;
  }

  restoreSnapshot() {
    this.isActive = this.initialActive;
    this.regulationState = 'idle';
    this.timer = 0;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  update(dt, engine) {
    if (dt <= 0) return;

    // 1. Count particles inside zone (GPU mode: last GPU measurement + own pending changes)
    const gpuMode = engine.isGPUSimulating();
    const insideParticles = [];
    if (gpuMode) {
      this.currentCount = Math.max(0, this.gpuCount + this.gpuDelta);
    } else {
      const allParticles = engine.particles;
      for (let i = 0; i < allParticles.length; i++) {
        const p = allParticles[i];
        if (this.contains(p.pos.x, p.pos.y)) {
          insideParticles.push(p);
        }
      }
      this.currentCount = insideParticles.length;
    }

    if (!this.isActive) {
      this.regulationState = 'idle';
      this.timer = 0;
      return;
    }

    const lowerBound = this.targetCount - this.hysteresis;
    const upperBound = this.targetCount + this.hysteresis;

    // 2. State transitions with deadband hysteresis
    if (this.currentCount < lowerBound) {
      this.regulationState = 'emitting';
    } else if (this.currentCount > upperBound) {
      this.regulationState = 'absorbing';
    } else if (
      (this.regulationState === 'emitting' && this.currentCount >= this.targetCount) ||
      (this.regulationState === 'absorbing' && this.currentCount <= this.targetCount)
    ) {
      this.regulationState = 'idle';
      this.timer = 0;
    }

    // 3. Execution of active regulation
    if (this.regulationState === 'emitting') {
      this.timer += dt;
      const interval = 1.0 / Math.max(1, this.rate);
      const thermalSpeed = Math.sqrt((2 * KB * Math.max(5, this.temperature)) / this.mass);

      while (this.timer >= interval && this.currentCount < this.targetCount) {
        this.timer -= interval;
        const px = this.x + 6 + Math.random() * Math.max(1, this.width - 12);
        const py = this.y + 6 + Math.random() * Math.max(1, this.height - 12);
        const theta = Math.random() * Math.PI * 2;
        const vx = thermalSpeed * Math.cos(theta);
        const vy = thermalSpeed * Math.sin(theta);
        engine.addParticle(px, py, vx, vy, this.mass);
        this.currentCount++;
        if (gpuMode) this.gpuDelta++;
      }
      if (this.currentCount >= this.targetCount) {
        this.regulationState = 'idle';
        this.timer = 0;
      }
    } else if (this.regulationState === 'absorbing') {
      this.timer += dt;
      const interval = 1.0 / Math.max(1, this.rate);
      const toRemove = [];
      let gpuRemovals = 0;

      while (this.timer >= interval && this.currentCount > this.targetCount && (gpuMode || insideParticles.length > 0)) {
        this.timer -= interval;
        if (gpuMode) {
          gpuRemovals++;
          this.gpuDelta--;
        } else {
          toRemove.push(insideParticles.pop());
        }
        this.currentCount--;
      }
      if (gpuRemovals > 0) engine.requestGPURegulatorRemoval(this, gpuRemovals);
      if (toRemove.length > 0) engine.deleteParticles(toRemove);
      if (this.currentCount <= this.targetCount) {
        this.regulationState = 'idle';
        this.timer = 0;
      }
    } else {
      this.timer = 0;
    }
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      targetCount: this.targetCount,
      hysteresis: this.hysteresis,
      temperature: this.temperature,
      mass: this.mass,
      rate: this.rate,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Regulator(data.x, data.y, data.width, data.height, {
      id: data.id,
      targetCount: data.targetCount,
      hysteresis: data.hysteresis,
      temperature: data.temperature,
      mass: data.mass,
      rate: data.rate,
      isActive: data.isActive
    });
  }
}


// --- src/physics/ThrottleValve.js ---

class ThrottleValve {
  constructor(x1, y1, x2, y2, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.p1 = new Vector2(x1, y1);
    this.p2 = new Vector2(x2, y2);
    this.thickness = options.thickness !== undefined ? options.thickness : 6;
    this.openRatio = options.openRatio !== undefined ? Math.max(0, Math.min(1, options.openRatio)) : 0.3; // 0.0 to 1.0
    
    // Thermal properties
    this.conductivity = options.conductivity !== undefined ? options.conductivity : 0.0;
    this.temperature = options.temperature !== undefined ? options.temperature : 300;
    this.heatCapacity = options.heatCapacity !== undefined ? options.heatCapacity : 80;
    this.heatAccumulator = 0;
    this.conductanceAccumulator = 0;

    // Pressure tracking
    this.accumulatedImpulseSide1 = 0;
    this.accumulatedImpulseSide2 = 0;
    this.smoothedP1 = 0;
    this.smoothedP2 = 0;
    this.deltaP = 0;

    // Active state
    this.isActive = options.isActive !== undefined ? options.isActive : true;

    // Initial snapshot
    this.initialOpenRatio = this.openRatio;
    this.initialP1 = this.p1.clone();
    this.initialP2 = this.p2.clone();
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;

    this._updateGeometry();
  }

  _updateGeometry() {
    this.dir = new Vector2(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    this.length = this.dir.length();
    this.unitDir = this.length > 0 ? this.dir.clone().normalize() : new Vector2(1, 0);
    this.normal = new Vector2(-this.unitDir.y, this.unitDir.x);
    this.midPoint = new Vector2((this.p1.x + this.p2.x) * 0.5, (this.p1.y + this.p2.y) * 0.5);

    // Calculate wings and gap
    const solidFraction = Math.max(0, 1.0 - this.openRatio);
    this.wingLength = (this.length * solidFraction) * 0.5;
    this.gapWidth = this.length * this.openRatio;

    // Wing 1: p1 to wing1End
    this.wing1End = new Vector2(
      this.p1.x + this.unitDir.x * this.wingLength,
      this.p1.y + this.unitDir.y * this.wingLength
    );

    // Wing 2: wing2Start to p2
    this.wing2Start = new Vector2(
      this.p2.x - this.unitDir.x * this.wingLength,
      this.p2.y - this.unitDir.y * this.wingLength
    );
  }

  setPoints(x1, y1, x2, y2) {
    this.p1.set(x1, y1);
    this.p2.set(x2, y2);
    this._updateGeometry();
  }

  setOpenRatio(ratio) {
    this.openRatio = Math.max(0, Math.min(1.0, ratio));
    this._updateGeometry();
  }

  toggle() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  addHeat(joules) {
    if (this.isActive) {
      this.heatAccumulator += joules;
    }
  }

  // Stiffness guard: accumulated coupling conductance makes the heat update implicit.
  addConductance(g) {
    if (this.isActive) {
      this.conductanceAccumulator += g;
    }
  }

  saveSnapshot() {
    this.initialOpenRatio = this.openRatio;
    this.initialP1 = this.p1.clone();
    this.initialP2 = this.p2.clone();
    this.initialTemperature = this.temperature;
    this.initialIsActive = this.isActive;
  }

  restoreSnapshot() {
    this.openRatio = this.initialOpenRatio;
    this.p1.copy(this.initialP1);
    this.p2.copy(this.initialP2);
    this.temperature = this.initialTemperature;
    this.isActive = this.initialIsActive;
    this.accumulatedImpulseSide1 = 0;
    this.accumulatedImpulseSide2 = 0;
    this.deltaP = 0;
    this._updateGeometry();
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0 && this.isActive) {
      this.temperature += this.heatAccumulator / (this.heatCapacity + this.conductanceAccumulator);
      this.heatAccumulator = 0;
      this.conductanceAccumulator = 0;
      // Floor at 5 K: the deficit stays as heat owed, so clamping creates no energy
      if (this.temperature < 5) {
        this.heatAccumulator = (this.temperature - 5) * this.heatCapacity;
        this.temperature = 5;
      }
    }

    if (dt > 0 && this.length > 0) {
      const p1Inst = this.accumulatedImpulseSide1 / (this.length * dt);
      const p2Inst = this.accumulatedImpulseSide2 / (this.length * dt);
      this.smoothedP1 = this.smoothedP1 * 0.85 + p1Inst * 0.15;
      this.smoothedP2 = this.smoothedP2 * 0.85 + p2Inst * 0.15;
      this.deltaP = Math.abs(this.smoothedP1 - this.smoothedP2);
      this.accumulatedImpulseSide1 = 0;
      this.accumulatedImpulseSide2 = 0;
    }
  }

  _closestPointOnSegment(p, a, b) {
    const ab = new Vector2(b.x - a.x, b.y - a.y);
    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    if (abLenSq === 0) return a.clone();
    const ap = new Vector2(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ap.dot(ab) / abLenSq));
    return new Vector2(a.x + t * ab.x, a.y + t * ab.y);
  }

  resolveParticleCollision(p, dt) {
    if (!this.isActive || this.openRatio >= 0.999) return;

    // Check collision against Wing 1
    if (this.wingLength > 0.5) {
      this._resolveWingCollision(p, this.p1, this.wing1End);
    }
    // Check collision against Wing 2
    if (this.wingLength > 0.5) {
      this._resolveWingCollision(p, this.wing2Start, this.p2);
    }
  }

  _resolveWingCollision(p, a, b) {
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const abLenSq = abX * abX + abY * abY;
    let closestX = a.x;
    let closestY = a.y;
    if (abLenSq > 0.00001) {
      const apX = p.pos.x - a.x;
      const apY = p.pos.y - a.y;
      const t = Math.max(0, Math.min(1, (apX * abX + apY * abY) / abLenSq));
      closestX = a.x + t * abX;
      closestY = a.y + t * abY;
    }
    const dx = p.pos.x - closestX;
    const dy = p.pos.y - closestY;
    const distSq = dx * dx + dy * dy;
    const effRad = p.radius + this.thickness * 0.5;

    if (distSq < effRad * effRad) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const ny = dy / dist;

      // Push particle out
      const pen = effRad - dist;
      p.pos.x += nx * pen;
      p.pos.y += ny * pen;

      const velAlongNormal = p.vel.x * nx + p.vel.y * ny;
      if (velAlongNormal < 0) {
        let newVx = p.vel.x - 2 * velAlongNormal * nx;
        let newVy = p.vel.y - 2 * velAlongNormal * ny;

        if (this.conductivity > 0) {
          const targetSpeedSq = (3 * KB * this.temperature) / p.mass;
          const curSpeedSq = newVx * newVx + newVy * newVy;
          const alpha = Math.min(1, this.conductivity * 0.8);
          const blendSq = (1 - alpha) * curSpeedSq + alpha * targetSpeedSq;
          const factor = curSpeedSq > 0.001 ? Math.sqrt(blendSq / curSpeedSq) : 1;

          const eBefore = 0.5 * p.mass * curSpeedSq;
          newVx *= factor;
          newVy *= factor;
          const eAfter = 0.5 * p.mass * (newVx * newVx + newVy * newVy);
          this.addHeat(-(eAfter - eBefore));
          this.addConductance(alpha * 1.5 * KB);
        }

        p.vel.x = newVx;
        p.vel.y = newVy;

        const imp = 2 * p.mass * Math.abs(velAlongNormal);
        // Distinguish side 1 vs side 2 by dot product with wall normal
        if (nx * this.normal.x + ny * this.normal.y > 0) {
          this.accumulatedImpulseSide1 += imp;
        } else {
          this.accumulatedImpulseSide2 += imp;
        }
      }
    }
  }

  toJSON() {
    return {
      id: this.id,
      p1: { x: this.p1.x, y: this.p1.y },
      p2: { x: this.p2.x, y: this.p2.y },
      thickness: this.thickness,
      openRatio: this.openRatio,
      conductivity: this.conductivity,
      temperature: this.temperature,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new ThrottleValve(data.p1.x, data.p1.y, data.p2.x, data.p2.y, {
      id: data.id,
      thickness: data.thickness,
      openRatio: data.openRatio,
      conductivity: data.conductivity,
      temperature: data.temperature,
      isActive: data.isActive
    });
  }
}


// --- src/model/elementSchema.js ---
// Single source of truth for element properties: labels, units, ranges,
// defaults (TOOL_CATALOG.md) and where each field appears. The tool dialog,
// the properties panel and the sequencer action dialog all render from this,
// and the sequencer executor applies actions through the same setters.
//
// Field: { key, label, kind: 'number' | 'toggle' | 'direction' | 'bool' | 'text' | 'color' | 'select',
//          min, max, step, unit, scale (display = value * scale), int, def, options: [{ value, label }],
//          in: { tool, inspector, sequencer } (default all true), visible(values), get(item), set(item, v, engine) }

// ---------------------------------------------------------------------------
// Shared field builders
// ---------------------------------------------------------------------------
const num = (key, label, min, max, step, def, unit = '', extra = {}) => ({ key, label, kind: 'number', min, max, step, def, unit, ...extra });

const THICKNESS = (def) => num('thickness', 'Thickness', 2, 16, 1, def, 'px', { int: true, in: { sequencer: false } });
const CONDUCTIVITY = (def, label = 'Conductivity κ', min = 0) => num('conductivity', label, min, 1, 0.05, def);
const GAS_TEMPERATURE = (def = 300, label = 'Temperature T') => num('temperature', label, 10, 1000, 10, def, 'K');
const BODY_TEMPERATURE = (def = 300, label = 'Temperature T') => num('temperature', label, 5, 1000, 10, def, 'K');
const PARTICLE_MASS = num('mass', 'Particle Mass m', 0.2, 5, 0.2, 1.0);
const ACTIVE = (label = 'Active') => ({ key: 'isActive', label, kind: 'bool', def: true, in: { tool: false } });
const DIRECTION = (def) => ({ key: 'direction', label: 'Direction', kind: 'direction', def });
const MAX_COUNT = (label) => num('maxParticles', label, 0, 500, 10, 0, '', { int: true });

// Piston mode while running freely (the sequencer's drive commands override it).
const runMode = v => (v.command === undefined || v.command === 'release') ? v.mode : null;

const PISTON_MODES = [
  { value: 'free', label: 'Displacer' },
  { value: 'spring', label: 'Accumulator' },
  { value: 'motorized', label: 'Compressor' },
  { value: 'damper', label: 'Expander' }
];

// ---------------------------------------------------------------------------
// Element types
// ---------------------------------------------------------------------------
const ELEMENT_TYPES = {
  wall: {
    label: 'Wall', tag: 'WALL', tool: 'wall',
    fields: [
      THICKNESS(4),
      CONDUCTIVITY(0),
      { ...BODY_TEMPERATURE(300), visible: v => v.conductivity > 0 },
      num('heatCapacity', 'Heat Capacity C', 50, 2000, 50, 400, 'J/K', { visible: v => v.conductivity > 0, in: { sequencer: false } })
    ]
  },
  manual_valve: {
    label: 'Manual Valve', tag: 'VALVE', tool: 'valve',
    fields: [
      { key: 'isOpen', label: 'State', kind: 'toggle', def: false, options: [{ value: false, label: 'Closed' }, { value: true, label: 'Open' }] },
      THICKNESS(4),
      CONDUCTIVITY(0)
    ]
  },
  check_valve: {
    label: 'Check Valve', tag: 'VALVE', tool: 'valve',
    fields: [
      { key: 'allowedDirection', label: 'Allowed Flow', kind: 'toggle', def: 1, options: [{ value: 1, label: 'Forward →' }, { value: -1, label: 'Reverse ←' }] },
      THICKNESS(4),
      CONDUCTIVITY(0)
    ]
  },
  relief_valve: {
    label: 'Relief Valve', tag: 'PRV', tool: 'valve',
    fields: [
      num('triggerPressure', 'Trigger Pressure P_max', 50, 1000, 25, 250, 'Pa'),
      num('pressureHysteresis', 'Hysteresis ΔP', 0, 100, 5, 25, 'Pa'),
      { key: 'reliefMode', label: 'Relief Mode', kind: 'toggle', def: 'oneway', options: [{ value: 'oneway', label: '1-Way' }, { value: 'bidirectional', label: '2-Way' }] },
      { key: 'allowedDirection', label: 'Relief Direction', kind: 'toggle', def: 1, options: [{ value: 1, label: 'Forward →' }, { value: -1, label: 'Reverse ←' }], visible: v => v.reliefMode === 'oneway' },
      THICKNESS(4),
      CONDUCTIVITY(0)
    ]
  },
  throttle_valve: {
    label: 'Throttle Valve', tag: 'THROTTLE', tool: 'throttle_valve',
    fields: [
      ACTIVE(),
      num('openRatio', 'Opening', 0, 100, 5, 0.3, '%', { scale: 100, set: (it, v) => it.setOpenRatio(v) }),
      { ...THICKNESS(6), set: (it, v) => { it.thickness = v; it._updateGeometry(); } },
      CONDUCTIVITY(0)
    ],
    info: it => `Gap ${Math.round(it.gapWidth || it.length * it.openRatio)} px · ΔP ${(it.deltaP || 0).toFixed(1)} Pa`
  },
  piston: {
    label: 'Piston', tag: 'PISTON', tool: 'piston',
    fields: [
      ACTIVE(),
      { key: 'command', label: 'Command', kind: 'select', def: 'drive_tdc', in: { tool: false, inspector: false },
        options: [
          { value: 'drive_tdc', label: 'Drive to TDC (min volume)' },
          { value: 'drive_bdc', label: 'Drive to BDC (max volume)' },
          { value: 'hold', label: 'Hold position' },
          { value: 'release', label: 'Release (run in mode below)' }
        ] },
      num('targetSpeed', 'Drive Speed', 20, 400, 10, 160, 'px/s', { in: { tool: false, inspector: false }, visible: v => v.command === 'drive_tdc' || v.command === 'drive_bdc' }),
      { key: 'mode', label: 'Mode', kind: 'toggle', def: 'free', options: PISTON_MODES, in: { tool: false }, visible: v => v.command === undefined || v.command === 'release' },
      num('mass', 'Mass m', 0, 150, 5, 30, 'kg'),
      CONDUCTIVITY(0.2),
      num('springK', 'Spring Constant k', 10, 500, 10, 50, 'N/m', { visible: v => runMode(v) === 'spring' }),
      num('frequency', 'Motor Frequency f', 0.1, 5, 0.1, 0.8, 'Hz', { visible: v => runMode(v) === 'motorized' }),
      num('phase', 'Phase Offset φ', -180, 180, 15, 0, '°', { visible: v => runMode(v) === 'motorized' }),
      num('dampingCoeff', 'Damping Load γ', 5, 150, 5, 25, 'Ns/m', { visible: v => runMode(v) === 'damper' })
    ],
    info: it => {
      const stroke = Math.round(Math.abs(it.maxPos - it.minPos));
      if (it.mode === 'damper') return `Work extracted ${(it.workExtracted || 0).toFixed(1)} J · ${(it.instantPower || 0).toFixed(1)} W`;
      return `Stroke ${stroke} px (drag the rail handles)`;
    }
  },
  reservoir: {
    label: 'Heat Bath', tag: 'BATH', tool: 'solid_res',
    fields: [
      ACTIVE(),
      BODY_TEMPERATURE(500, 'Constant Temperature T'),
      num('conductance', 'Thermal Coupling κ', 0.05, 1, 0.05, 0.8)
    ]
  },
  heat_exchanger: {
    label: 'Heat Exchanger', tag: 'HX', tool: 'heat_exchanger',
    fields: [
      ACTIVE(),
      BODY_TEMPERATURE(300, 'Body Temperature T'),
      CONDUCTIVITY(0.6, 'Thermal Coupling κ', 0.05)
    ]
  },
  regenerator: {
    label: 'Regenerator', tag: 'REGEN', tool: 'regenerator',
    fields: [
      ACTIVE(),
      { key: 'orientation', label: 'Flow Axis', kind: 'toggle', def: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
      { ...BODY_TEMPERATURE(300, 'Base Temperature T'),
        get: it => Math.round(it.getAverageTemperature()),
        set: (it, v) => {
          const diff = v - it.getAverageTemperature();
          for (let i = 0; i < it.temperatures.length; i++) it.temperatures[i] = Math.max(5, it.temperatures[i] + diff);
        } },
      num('heatCapacity', 'Heat Capacity C', 50, 1500, 50, 400, 'J/K'),
      CONDUCTIVITY(0.7, 'Thermal Coupling κ', 0.05),
      num('axialConductivity', 'Axial Heat Leakage', 0, 0.5, 0.02, 0.05)
    ],
    info: it => `Gradient ${Math.round(Math.min(...it.temperatures))} – ${Math.round(Math.max(...it.temperatures))} K`
  },
  thermal_block: {
    label: 'Thermal Mass', tag: 'MASS', tool: 'storage_block',
    fields: [
      ACTIVE(),
      BODY_TEMPERATURE(300),
      num('heatCapacity', 'Heat Capacity C', 50, 1500, 50, 300, 'J/K'),
      CONDUCTIVITY(0.6, 'Thermal Coupling κ', 0.05)
    ]
  },
  emitter: {
    label: 'Emitter', tag: 'SOURCE', tool: 'emitter',
    fields: [
      { key: 'enabled', label: 'Firing', kind: 'bool', def: true, in: { tool: false } },
      DIRECTION('right'),
      num('rate', 'Rate', 1, 60, 1, 8, '/s', { int: true }),
      GAS_TEMPERATURE(300),
      PARTICLE_MASS,
      MAX_COUNT('Max Count (0 = ∞)')
    ]
  },
  sink: {
    label: 'Absorber', tag: 'ABSORBER', tool: 'sink',
    fields: [
      ACTIVE(),
      DIRECTION('360'),
      { key: 'tempFilterMode', label: 'Temperature Filter', kind: 'toggle', def: 'all', options: [{ value: 'all', label: 'All' }, { value: 'above', label: '> T' }, { value: 'below', label: '< T' }] },
      { ...GAS_TEMPERATURE(300, 'Threshold Temperature'), key: 'filterTemperature', visible: v => v.tempFilterMode !== 'all' },
      num('absorptionEfficiency', 'Efficiency', 10, 100, 5, 1.0, '%', { scale: 100 }),
      MAX_COUNT('Max Absorbed (0 = ∞)')
    ]
  },
  regulator: {
    label: 'Regulator', tag: 'REGULATOR', tool: 'regulator',
    fields: [
      ACTIVE(),
      num('targetCount', 'Target Count N', 5, 300, 5, 50, '', { int: true }),
      num('hysteresis', 'Hysteresis ΔN', 0, 20, 1, 3, '', { int: true }),
      GAS_TEMPERATURE(300),
      PARTICLE_MASS,
      num('rate', 'Max Rate', 1, 60, 1, 15, '/s', { int: true })
    ],
    info: it => `${it.currentCount || 0} / ${it.targetCount} particles in zone`
  },
  gas: {
    label: 'Spawner', tag: 'SPAWNER', tool: 'gas', sequenceable: false,
    fields: [
      { key: 'velocityMode', label: 'Velocities', kind: 'toggle', def: 'uniform_speed', in: { inspector: false },
        options: [{ value: 'uniform_speed', label: 'Uniform' }, { value: 'maxwell', label: 'Maxwell' }] },
      num('count', 'Particle Count N', 5, 300, 5, 30, '', { int: true, in: { inspector: false } }),
      { ...GAS_TEMPERATURE(300), set: (it, v, engine) => engine.setGroupTemperature(it, v) },
      { ...PARTICLE_MASS, set: (it, v, engine) => engine.setGroupMass(it, v) }
    ],
    info: (it, engine) => `${it.getActiveCount(engine)} particles · avg ${Math.round(it.getAverageTemperature(engine))} K`
  },
  sensor: {
    label: 'Sensor', tag: 'SENSOR', tool: 'sensor', sequenceable: false,
    fields: [
      { key: 'label', label: 'Name', kind: 'text', def: 'Chamber', set: (it, v) => { it.label = v.trim() || 'Chamber'; } },
      { key: 'color', label: 'Color', kind: 'color', def: '#3987e5' }
    ],
    info: it => (it.displayDriftSpeed > 0
      ? `Drift ${it.displayDriftSpeed.toFixed(1)} px/s (${Math.round(it.driftAngle * 180 / Math.PI)}°)`
      : 'No net drift')
  },
  text: {
    label: 'Text', tag: 'NOTE', tool: 'text', sequenceable: false,
    fields: [
      { key: 'text', label: 'Text', kind: 'text', def: 'Note' },
      { ...num('fontSize', 'Font Size', 10, 48, 1, 14, 'px', { int: true }), set: (it, v) => { it.fontSize = v; it.height = v + 12; } },
      { key: 'color', label: 'Color', kind: 'color', def: '#94a3b8' }
    ]
  }
};

// Which schema type an element belongs to.
function elementTypeOf(item) {
  if (item instanceof Wall) return ELEMENT_TYPES[item.type] ? item.type : 'wall';
  if (item instanceof ThrottleValve) return 'throttle_valve';
  if (item instanceof Piston) return 'piston';
  if (item instanceof Reservoir) return 'reservoir';
  if (item instanceof HeatExchanger) return 'heat_exchanger';
  if (item instanceof RegeneratorMatrix) return 'regenerator';
  if (item instanceof ThermalBlock) return 'thermal_block';
  if (item instanceof Emitter) return 'emitter';
  if (item instanceof Sink) return 'sink';
  if (item instanceof Regulator) return 'regulator';
  if (item instanceof ParticleGroup) return 'gas';
  if (item instanceof SensorZone) return 'sensor';
  if (item instanceof TextLabel) return 'text';
  return null;
}

// Schema type for a ribbon tool (valve sub-type from its config).
function elementTypeOfTool(tool, toolConfig) {
  if (tool === 'valve') return toolConfig?.type || 'manual_valve';
  return Object.keys(ELEMENT_TYPES).find(t => ELEMENT_TYPES[t].tool === tool && t !== 'check_valve' && t !== 'relief_valve') || null;
}

function fieldsFor(type, context) {
  const def = ELEMENT_TYPES[type];
  if (!def) return [];
  return def.fields.filter(f => !f.in || f.in[context] !== false);
}

function getFieldValue(field, item) {
  return field.get ? field.get(item) : item[field.key];
}

function setFieldValue(field, item, value, engine) {
  if (field.set) field.set(item, value, engine);
  else item[field.key] = value;
}

// Current values of an element for the given context.
function readValues(type, item, context) {
  const values = {};
  fieldsFor(type, context).forEach(f => {
    const v = getFieldValue(f, item);
    values[f.key] = v === undefined ? f.def : v;
  });
  return values;
}

function defaultValues(type, context) {
  const values = {};
  fieldsFor(type, context).forEach(f => { values[f.key] = f.def; });
  return values;
}


// --- src/control/SequencerActions.js ---
/**
 * SequencerActions.js
 * Step actions on top of the element schema: which elements can be sequenced,
 * the values an action holds, translation of older saved actions, applying
 * an action to the engine and a one-line summary.
 *
 * An action is { id, targetId, type, ...values } where the values use the
 * schema field keys (plus the piston drive `command` and `targetSpeed`).
 */

// Schema type an element is sequenced as, or null if it can't be sequenced.
function actionTypeOf(item) {
  const type = item ? elementTypeOf(item) : null;
  if (!type || ELEMENT_TYPES[type].sequenceable === false) return null;
  return fieldsFor(type, 'sequencer').length > 0 ? type : null;
}

const LEGACY_TYPES = {
  throttle: 'throttle_valve', hx: 'heat_exchanger', regen: 'regenerator', ressavoir: 'thermal_block',
  source: 'emitter', absorber: 'sink', sink_thermal: 'reservoir'
};

const LEGACY_KEYS = {
  piston: { motorFrequency: 'frequency', motorPhase: 'phase', dampingGamma: 'dampingCoeff' },
  check_valve: { direction: 'allowedDirection' },
  relief_valve: { hysteresis: 'pressureHysteresis', direction: 'allowedDirection' },
  reservoir: { conductivity: 'conductance', thermalCoupling: 'conductance' },
  heat_exchanger: { thermalCoupling: 'conductivity' },
  regenerator: { thermalCoupling: 'conductivity', axis: 'orientation' },
  thermal_block: { thermalCoupling: 'conductivity' },
  emitter: { flowDirection: 'direction', particleMass: 'mass', capacityLimit: 'maxParticles', isActive: 'enabled' },
  sink: { thermalFilter: 'tempFilterMode', cutoffTemp: 'filterTemperature', efficiency: 'absorptionEfficiency', maxAbsorbed: 'maxParticles' },
  regulator: { maxFlowRate: 'rate' }
};

const PISTON_COMMANDS = ['drive_tdc', 'drive_bdc', 'hold', 'release'];
const RUN_MODES = ['free', 'spring', 'motorized', 'damper'];

/**
 * Translates an action (possibly saved by an older version, where the
 * sequencer used its own keys) to schema keys. `item` resolves generic types.
 */
function normalizeAction(act, item = null) {
  if (!act) return null;
  let type = LEGACY_TYPES[act.type] || act.type;
  if ((type === 'wall' || type === 'valve' || !ELEMENT_TYPES[type]) && item) type = elementTypeOf(item) || type;

  const out = { ...act, type };
  for (const [from, to] of Object.entries(LEGACY_KEYS[type] || {})) {
    if (act[from] !== undefined && act[to] === undefined) out[to] = act[from];
    if (from !== to) delete out[from];
  }

  if (type === 'piston') {
    const cmd = act.command || act.strokeCommand || (PISTON_COMMANDS.includes(act.mode) || act.mode === 'free' ? act.mode : null);
    if (cmd === 'free') {
      out.command = 'release';
      out.mode = RUN_MODES.includes(act.motionType) ? act.motionType : 'free';
    } else {
      out.command = PISTON_COMMANDS.includes(cmd) ? cmd : 'drive_tdc';
      const mode = RUN_MODES.includes(act.mode) ? act.mode : act.motionType;
      if (RUN_MODES.includes(mode)) out.mode = mode;
      else delete out.mode;
    }
    delete out.strokeCommand;
    delete out.motionType;
  } else if (type === 'manual_valve' && act.valveState !== undefined && act.isOpen === undefined) {
    out.isOpen = act.valveState === 'open';
  } else if (type === 'check_valve' && act.flowDirection !== undefined && act.allowedDirection === undefined) {
    out.allowedDirection = act.flowDirection === 'reverse' ? -1 : 1;
  } else if (type === 'relief_valve') {
    if (out.reliefMode === '1-way' || out.reliefMode === 'oneway') out.reliefMode = 'oneway';
    else if (out.reliefMode === '2-way' || out.reliefMode === 'twoway') out.reliefMode = 'bidirectional';
  } else if (type === 'throttle_valve' && act.state !== undefined) {
    out.isActive = true;
    if (act.state === 'bypassed') out.openRatio = 1;
  } else if (type === 'emitter' && act.state !== undefined && act.enabled === undefined) {
    out.enabled = act.state !== 'paused';
  } else if (type === 'sink') {
    if (out.tempFilterMode === 'hot') out.tempFilterMode = 'above';
    if (out.tempFilterMode === 'cold') out.tempFilterMode = 'below';
  }
  for (const k of ['valveState', 'flowDirection', 'state', 'thermalCoupling', 'conductance'].filter(k => k in out)) {
    const known = fieldsFor(type, 'sequencer').some(f => f.key === k);
    if (!known) delete out[k];
  }
  return out;
}

// Form values for an action dialog: the element's current values, overridden by the action.
function actionValues(item, act = null) {
  const type = actionTypeOf(item);
  if (!type) return {};
  const values = readValues(type, item, 'sequencer');
  if (type === 'piston') values.command = 'drive_tdc';
  if (!act) return values;
  const norm = normalizeAction(act, item);
  fieldsFor(type, 'sequencer').forEach(f => {
    if (norm[f.key] !== undefined) values[f.key] = norm[f.key];
  });
  return values;
}

function makeAction(item, values, existing = {}) {
  return {
    id: existing.id || 'act_' + Math.random().toString(36).substring(2, 9),
    targetId: item.id,
    type: actionTypeOf(item),
    ...values
  };
}

function findElement(engine, id) {
  return (engine.elements || []).find(el => el.id === id) || null;
}

// Applies an action's values to its element; pistons then execute the drive command.
function applyAction(act, engine) {
  const item = findElement(engine, act?.targetId);
  if (!item) return;
  const type = actionTypeOf(item);
  if (!type) return;
  const norm = normalizeAction(act, item);

  fieldsFor(type, 'sequencer').forEach(f => {
    if (f.key === 'command' || f.key === 'targetSpeed' || norm[f.key] === undefined) return;
    setFieldValue(f, item, norm[f.key], engine);
  });

  if (type === 'piston') {
    if (norm.command === 'drive_tdc' || norm.command === 'drive_bdc') {
      item.mode = 'controlled';
      item.targetPos = SequencerConditions.resolvePistonTarget(item, norm.command, !!norm.invertTdcBdc);
      item.targetSpeed = norm.targetSpeed !== undefined ? norm.targetSpeed : 160;
    } else if (norm.command === 'hold') {
      item.mode = 'hold';
      item.velocity = 0;
    } else {
      item.mode = norm.mode || 'free';
    }
  }
}

// One-line description for the timeline.
function summarizeAction(act, item = null) {
  const a = normalizeAction(act, item);
  if (!a) return 'No action';
  const T = v => `${Math.round(v)} K`;
  switch (a.type) {
    case 'piston':
      if (a.command === 'drive_tdc') return 'Drive to TDC';
      if (a.command === 'drive_bdc') return 'Drive to BDC';
      if (a.command === 'hold') return 'Hold position';
      return `Release (${a.mode || 'free'})`;
    case 'throttle_valve': return a.isActive === false ? 'Disabled' : `Opening ${Math.round((a.openRatio ?? 0.3) * 100)}%`;
    case 'manual_valve': return a.isOpen ? 'Open' : 'Closed';
    case 'check_valve': return a.allowedDirection === -1 ? 'Reverse (←)' : 'Forward (→)';
    case 'relief_valve': return `P_max ${a.triggerPressure ?? 250} Pa`;
    case 'wall': return `κ = ${(a.conductivity ?? 0).toFixed(2)}`;
    case 'reservoir':
    case 'heat_exchanger':
    case 'regenerator':
    case 'thermal_block': return a.isActive === false ? 'Inactive' : (a.temperature !== undefined ? T(a.temperature) : 'Active');
    case 'emitter': return a.enabled === false ? 'Paused' : `${a.rate ?? 8}/s @ ${T(a.temperature ?? 300)}`;
    case 'sink': return a.isActive === false ? 'Inactive' : `${Math.round((a.absorptionEfficiency ?? 1) * 100)}% efficiency`;
    case 'regulator': return a.isActive === false ? 'Inactive' : `Target N = ${a.targetCount ?? 50}`;
    default: return 'Snapshot';
  }
}


// --- src/control/SequencerConditions.js ---
/**
 * SequencerConditions.js
 * Compound Transition Condition Evaluator for Thermodynamic Cycle Sequencer
 * Evaluates Time, Piston Position, and Sensor Metrics with AND/OR Logic.
 */

class SequencerConditions {
  /**
   * Helper to resolve target position for a piston given a command:
   * 'tdc': Top Dead Center (minimum chamber volume / min travel)
   * 'bdc': Bottom Dead Center (maximum chamber volume / max travel)
   */
  static resolvePistonTarget(piston, command, invert = false) {
    if (!piston || typeof piston.getTravelLimits !== 'function') {
      return piston ? piston.getPos() : 0;
    }
    const limits = piston.getTravelLimits();
    const isTdc = command === 'tdc' || command === 'drive_tdc';
    if (!invert) {
      return isTdc ? limits.minTravel : limits.maxTravel;
    } else {
      return isTdc ? limits.maxTravel : limits.minTravel;
    }
  }

  /**
   * Evaluates an individual condition against the current simulation state.
   */
  static evaluateSingle(cond, elapsedStepTime, engine, step) {
    if (!cond) return { met: true, progress: 1.0 };
    const type = cond.type || 'duration';

    if (type === 'duration') {
      const dur = Math.max(0.05, cond.duration !== undefined ? cond.duration : 1.5);
      const met = elapsedStepTime >= dur;
      const progress = Math.min(1.0, elapsedStepTime / dur);
      return { met, progress };
    }

    if (type === 'piston' || type === 'piston_target') {
      let targetPistons = [];
      if (cond.pistonId) {
        const p = (engine.pistons || []).find(item => item.id === cond.pistonId);
        if (p) {
          targetPistons.push({
            piston: p,
            target: cond.pistonTarget || 'tdc',
            targetPos: cond.targetPos,
            invert: !!cond.invert
          });
        }
      } else if (step && Array.isArray(step.actions)) {
        // Collect all pistons commanded in this step if no specific piston is set
        const driving = step.actions.filter(a => a.type === 'piston' && a.targetId);
        for (const act of driving) {
          const p = (engine.pistons || []).find(item => item.id === act.targetId);
          if (p) {
            const cmd = normalizeAction(act, p).command;
            const tgt = (cmd === 'drive_tdc' || cmd === 'drive_bdc') ? cmd.replace('drive_', '') : 'tdc';
            targetPistons.push({
              piston: p,
              target: tgt,
              targetPos: act.targetPos,
              invert: !!act.invertTdcBdc
            });
          }
        }
      }

      if (targetPistons.length === 0) {
        const fallback = cond.fallbackTimeout || 1.5;
        const met = elapsedStepTime >= fallback;
        return { met, progress: Math.min(1.0, elapsedStepTime / fallback) };
      }

      let allReached = true;
      let totalFraction = 0;

      for (let i = 0; i < targetPistons.length; i++) {
        const item = targetPistons[i];
        const p = item.piston;
        let goal = 0;

        if (item.target === 'tdc' || item.target === 'bdc') {
          goal = this.resolvePistonTarget(p, item.target, !!item.invert);
        } else if (item.targetPos !== undefined) {
          goal = item.targetPos;
        } else {
          goal = p.getPos();
        }

        const dist = Math.abs(goal - p.getPos());
        if (dist > 3.5) {
          allReached = false;
        }

        const limits = p.getTravelLimits ? p.getTravelLimits() : { stroke: 100 };
        const stroke = Math.max(10, limits.stroke || 100);
        totalFraction += Math.max(0, Math.min(1.0, 1.0 - (dist / stroke)));
      }

      const progress = totalFraction / targetPistons.length;
      return { met: allReached, progress };
    }

    if (type === 'sensor') {
      const sensor = (engine.sensors || []).find(s => s.id === cond.sensorId);
      if (!sensor) {
        return { met: false, progress: 0.0 };
      }

      const metric = cond.sensorMetric || 'pressure';
      // Sensor pressure is stored in Pa, metric can be Pa or kPa
      let val = metric === 'temperature' ? sensor.temperature : sensor.pressure;
      if (metric === 'pressure_kpa') {
        val = sensor.pressure / 1000.0;
      }

      const thresh = cond.sensorThreshold !== undefined ? cond.sensorThreshold : 200;
      const op = cond.sensorOperator || '>=';
      let met = false;

      if (op === '>=' && val >= thresh) met = true;
      else if (op === '<=' && val <= thresh) met = true;
      else if (op === '>' && val > thresh) met = true;
      else if (op === '<' && val < thresh) met = true;

      // Approximate progress based on threshold comparison
      let progress = 0;
      if (thresh !== 0) {
        progress = Math.max(0, Math.min(1.0, val / thresh));
        if (met) progress = 1.0;
      } else {
        progress = met ? 1.0 : 0.0;
      }

      return { met, progress };
    }

    return { met: true, progress: 1.0 };
  }

  /**
   * Normalizes any transition object (legacy single condition, flat array, or 2D grid)
   * into a canonical 2D compound grid structure.
   */
  static normalizeTransition(trans) {
    if (!trans) {
      return {
        type: 'compound_grid',
        fallbackTimeout: 10.0,
        rows: [{ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] }],
        rowOperators: []
      };
    }

    const timeout = trans.fallbackTimeout !== undefined ? trans.fallbackTimeout : 10.0;

    if (Array.isArray(trans.rows) && trans.rows.length > 0) {
      const rows = trans.rows.map(r => {
        const conds = Array.isArray(r.conditions) && r.conditions.length > 0
          ? r.conditions.map(c => ({ ...c }))
          : [{ type: 'duration', duration: 1.5 }];
        const ops = Array.isArray(r.operators) ? [...r.operators] : [];
        while (ops.length < conds.length - 1) {
          ops.push('AND');
        }
        return { conditions: conds, operators: ops };
      });
      const rowOps = Array.isArray(trans.rowOperators) ? [...trans.rowOperators] : [];
      while (rowOps.length < rows.length - 1) {
        rowOps.push('OR');
      }
      return {
        type: 'compound_grid',
        fallbackTimeout: timeout,
        rows,
        rowOperators: rowOps
      };
    }

    if (Array.isArray(trans.conditions) && trans.conditions.length > 0) {
      const op = (trans.operator || 'AND').toUpperCase();
      const ops = Array(Math.max(0, trans.conditions.length - 1)).fill(op);
      return {
        type: 'compound_grid',
        fallbackTimeout: timeout,
        rows: [{
          conditions: trans.conditions.map(c => ({ ...c })),
          operators: ops
        }],
        rowOperators: []
      };
    }

    const singleCond = { ...trans };
    delete singleCond.fallbackTimeout;
    return {
      type: 'compound_grid',
      fallbackTimeout: timeout,
      rows: [{
        conditions: [singleCond.type ? singleCond : { type: 'duration', duration: 1.5 }],
        operators: []
      }],
      rowOperators: []
    };
  }

  /**
   * Evaluates a list of results and binary operators using standard Boolean precedence (AND before OR).
   */
  static evaluateSequence(evalResults, operators = []) {
    if (!evalResults || evalResults.length === 0) return { met: true, progress: 1.0 };
    if (evalResults.length === 1) return evalResults[0];

    const orGroups = [];
    let currentAndGroup = [evalResults[0]];

    for (let i = 0; i < operators.length; i++) {
      const op = (operators[i] || 'AND').toUpperCase();
      const nextItem = evalResults[i + 1] || { met: true, progress: 1.0 };
      if (op === 'AND' || op === '&') {
        currentAndGroup.push(nextItem);
      } else {
        orGroups.push(currentAndGroup);
        currentAndGroup = [nextItem];
      }
    }
    orGroups.push(currentAndGroup);

    const groupResults = orGroups.map(group => {
      const allMet = group.every(item => item.met);
      const sumProg = group.reduce((sum, item) => sum + item.progress, 0);
      const avgProg = sumProg / group.length;
      return { met: allMet, progress: allMet ? 1.0 : avgProg };
    });

    const anyMet = groupResults.some(g => g.met);
    const maxProg = Math.max(...groupResults.map(g => g.progress));
    return { met: anyMet, progress: anyMet ? 1.0 : maxProg };
  }

  /**
   * Evaluates 2D compound transition grid with bracketed rows and Boolean precedence.
   */
  static evaluate(transition, elapsedStepTime, engine, step) {
    if (!transition) {
      return { met: true, progress: 1.0 };
    }

    const norm = this.normalizeTransition(transition);

    const timeout = norm.fallbackTimeout;
    if (timeout > 0 && elapsedStepTime >= timeout) {
      return { met: true, progress: 1.0 };
    }

    const rowResults = norm.rows.map(row => {
      const condResults = row.conditions.map(c =>
        this.evaluateSingle(c, elapsedStepTime, engine, step)
      );
      return this.evaluateSequence(condResults, row.operators);
    });

    return this.evaluateSequence(rowResults, norm.rowOperators);
  }
}


// --- src/control/SequencerExecutor.js ---
/**
 * SequencerExecutor.js
 * Applies the actions of a sequencer step to the engine (see SequencerActions).
 */

class SequencerExecutor {
  static applyStepActions(step, engine) {
    if (!step || !engine || !Array.isArray(step.actions)) return;
    for (const act of step.actions) {
      if (act && act.targetId) applyAction(act, engine);
    }
  }

  static applySingleAction(act, engine) {
    applyAction(act, engine);
  }
}


// --- src/control/CycleSequencer.js ---
/**
 * CycleSequencer.js
 * Precision GRAFCET State-Machine Coordinator for Thermodynamic Cycle Sequencer
 * Coordinates Steps, Action Snapshots, Transitions, and Continuous Simulation Execution.
 */


class CycleSequencer {
  constructor() {
    this.steps = [];
    this.phases = this.steps; // Compatibility alias
    this.isEnabled = false;
    this.isLooping = true;
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0; // Compatibility alias
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0; // Compatibility alias
    this.currentCycleCount = 1;
    this.stepProgress = 0; // 0.0 to 1.0 for UI progress bar
    this.phaseProgress = 0; // Compatibility alias
    this.onStepChangeCallback = null;
    this.onPhaseChangeCallback = null; // Compatibility alias
    this.addStep({ name: 'Step 1' });
  }

  reset() {
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0;
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.currentCycleCount = 1;
    this.stepProgress = 0;
    this.phaseProgress = 0;
    if (this.steps.length === 0) {
      this.addStep({ name: 'Step 1' });
    }
  }

  addStep(options = {}) {
    const stepNum = this.steps.length + 1;
    const step = {
      id: options.id || 'step_' + Math.random().toString(36).substring(2, 9),
      name: options.name || `Step ${stepNum}`,
      actions: options.actions || [],
      transition: options.transition || options.trigger || {
        type: 'duration',
        duration: 1.5,
        operator: 'AND',
        conditions: [
          { type: 'duration', duration: 1.5 }
        ],
        fallbackTimeout: 10.0
      }
    };
    step.trigger = step.transition;
    this.steps.push(step);
    return step;
  }

  addPhase(options = {}) {
    return this.addStep(options);
  }

  removeStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.steps.splice(index, 1);
      if (this.activeStepIndex >= this.steps.length) {
        this.activeStepIndex = Math.max(0, this.steps.length - 1);
        this.activePhaseIndex = this.activeStepIndex;
        this.elapsedStepTime = 0;
        this.elapsedPhaseTime = 0;
        this.stepProgress = 0;
        this.phaseProgress = 0;
      }
    }
  }

  removePhase(index) {
    return this.removeStep(index);
  }

  moveStep(fromIdx, toIdx) {
    if (fromIdx >= 0 && fromIdx < this.steps.length && toIdx >= 0 && toIdx < this.steps.length) {
      const [item] = this.steps.splice(fromIdx, 1);
      this.steps.splice(toIdx, 0, item);
      if (this.activeStepIndex === fromIdx) {
        this.activeStepIndex = toIdx;
        this.activePhaseIndex = toIdx;
      }
    }
  }

  movePhase(fromIdx, toIdx) {
    return this.moveStep(fromIdx, toIdx);
  }

  duplicateStep(index) {
    if (index >= 0 && index < this.steps.length) {
      const orig = this.steps[index];
      const copy = {
        id: 'step_' + Math.random().toString(36).substring(2, 9),
        name: `${orig.name} (Copy)`,
        actions: JSON.parse(JSON.stringify(orig.actions || [])),
        transition: JSON.parse(JSON.stringify(orig.transition || orig.trigger || { type: 'duration', duration: 1.5 }))
      };
      copy.trigger = copy.transition;
      this.steps.splice(index + 1, 0, copy);
      return copy;
    }
    return null;
  }

  duplicatePhase(index) {
    return this.duplicateStep(index);
  }

  addAction(stepIndex, actionData) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      const action = {
        id: 'act_' + Math.random().toString(36).substring(2, 9),
        targetId: actionData.targetId || null,
        type: actionData.type || 'piston',
        ...actionData
      };
      this.steps[stepIndex].actions.push(action);
      return action;
    }
    return null;
  }

  removeAction(stepIndex, actionIndex) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      const actions = this.steps[stepIndex].actions;
      if (actionIndex >= 0 && actionIndex < actions.length) {
        actions.splice(actionIndex, 1);
      }
    }
  }

  reset() {
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0;
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.currentCycleCount = 1;
    this.stepProgress = 0;
    this.phaseProgress = 0;
  }

  getCurrentStep() {
    if (this.steps.length === 0) return null;
    if (this.activeStepIndex >= this.steps.length) {
      this.activeStepIndex = 0;
      this.activePhaseIndex = 0;
    }
    return this.steps[this.activeStepIndex];
  }

  getCurrentPhase() {
    return this.getCurrentStep();
  }

  applyStepActions(step, engine) {
    SequencerExecutor.applyStepActions(step, engine);
  }

  applyPhaseActions(phase, engine) {
    return this.applyStepActions(phase, engine);
  }

  advanceToNextStep(engine) {
    if (this.steps.length === 0) return;

    const nextIndex = this.activeStepIndex + 1;
    if (nextIndex >= this.steps.length) {
      if (this.isLooping) {
        this.currentCycleCount++;
        this.activeStepIndex = 0;
        this.activePhaseIndex = 0;
      } else {
        this.isEnabled = false;
        this.stepProgress = 1.0;
        this.phaseProgress = 1.0;
        return;
      }
    } else {
      this.activeStepIndex = nextIndex;
      this.activePhaseIndex = nextIndex;
    }

    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.stepProgress = 0;
    this.phaseProgress = 0;

    const newStep = this.getCurrentStep();
    if (newStep) {
      this.applyStepActions(newStep, engine);
    }

    if (typeof this.onStepChangeCallback === 'function') {
      this.onStepChangeCallback(this.activeStepIndex, this.currentCycleCount);
    }
    if (typeof this.onPhaseChangeCallback === 'function') {
      this.onPhaseChangeCallback(this.activePhaseIndex, this.currentCycleCount);
    }
  }

  advanceToNextPhase(engine) {
    return this.advanceToNextStep(engine);
  }

  step(dt, engine) {
    if (!this.isEnabled || this.steps.length === 0 || !engine) {
      return;
    }

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    // Apply continuous controlled properties
    this.applyStepActions(currentStep, engine);

    this.elapsedStepTime += dt;
    this.elapsedPhaseTime = this.elapsedStepTime;

    const transition = currentStep.transition || currentStep.trigger;
    const { met, progress } = SequencerConditions.evaluate(transition, this.elapsedStepTime, engine, currentStep);

    this.stepProgress = Math.max(0, Math.min(1.0, progress));
    this.phaseProgress = this.stepProgress;

    if (met) {
      this.advanceToNextStep(engine);
    }
  }

  exportState() {
    if (this.steps.length === 0) {
      this.addStep({ name: 'Step 1' });
    }
    return {
      isEnabled: this.isEnabled,
      isLooping: this.isLooping,
      activeStepIndex: this.activeStepIndex,
      activePhaseIndex: this.activeStepIndex,
      currentCycleCount: this.currentCycleCount,
      steps: JSON.parse(JSON.stringify(this.steps)),
      phases: JSON.parse(JSON.stringify(this.steps))
    };
  }

  importState(data) {
    if (!data) return;
    this.isEnabled = !!data.isEnabled;
    this.isLooping = data.isLooping !== undefined ? !!data.isLooping : true;
    this.activeStepIndex = typeof data.activeStepIndex === 'number' ? data.activeStepIndex : (typeof data.activePhaseIndex === 'number' ? data.activePhaseIndex : 0);
    this.activePhaseIndex = this.activeStepIndex;
    this.currentCycleCount = typeof data.currentCycleCount === 'number' ? data.currentCycleCount : 1;
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.stepProgress = 0;
    this.phaseProgress = 0;

    const loaded = data.steps || data.phases;
    this.steps = Array.isArray(loaded) && loaded.length > 0 ? JSON.parse(JSON.stringify(loaded)) : [];
    if (this.steps.length === 0) {
      this.addStep({ name: 'Step 1' });
    }
    this.phases = this.steps;

    for (const step of this.steps) {
      if (!step.transition && step.trigger) {
        step.transition = step.trigger;
      }
    }
  }
}


// --- src/physics/ParticleGPUComputeShader.js ---

// Shared memory layout between the WGSL kernels and the JS coordinator.
// Every buffer offset below is expressed in 32-bit words.
const GPU_LAYOUT = (() => {
  const L = {
    WG: 64,
    PARTICLE_FLOATS: 8,
    CAPACITY: 1000000,     // particle slots per ping-pong buffer
    MAX_WALLS: 512,
    MAX_SINKS: 64,
    MAX_REGULATORS: 16,
    MAX_SENSORS: 16,
    MAX_THERMAL_ZONES: 16, // heat exchangers + regenerator matrices
    MAX_SLICES: 512,       // thermal zone temperature slots (regenerator slices)
    ZONE_WORDS: 12,
    WALL_EV_STRIDE: 8,     // impulseFront, impulseBack, heatIn, heatOut (each lo,hi)
    SLICE_EV_STRIDE: 4,    // heatIn, heatOut (each lo,hi)
    TELEM_SCALARS: 12,     // N, KE, vx+, vx-, vy+, vy-, mvx+, mvx-, mvy+, mvy-, m, |v|
    HIST_BINS: 64,
    HIST_BIN_WIDTH: 10,    // px/s per histogram bin
    KE_SCALE: 4,           // fixed-point scales for atomic accumulation
    V_SCALE: 16,
    MV_SCALE: 4,
    M_SCALE: 64,
    EV_SCALE: 16
  };
  // Thermal bodies: finite-capacity elements whose temperature the GPU reads
  // (walls/piston/throttle/block owners, then regenerator slices). See BODY_HEAT_BASE.
  L.SLICE_BODY_BASE = L.MAX_WALLS;
  L.MAX_BODIES = L.MAX_WALLS + L.MAX_SLICES;
  // Counters: [wall events][slice heat] are cleared on every readback; the rest persists.
  L.SLICE_HEAT_BASE = L.MAX_WALLS * L.WALL_EV_STRIDE;
  L.SINK_ABS_BASE = L.SLICE_HEAT_BASE + L.MAX_SLICES * L.SLICE_EV_STRIDE;
  L.REG_QUOTA_BASE = L.SINK_ABS_BASE + L.MAX_SINKS;
  L.COMPACT_IDX = L.REG_QUOTA_BASE + L.MAX_REGULATORS;
  L.SUBSTEP_IDX = L.COMPACT_IDX + 1; // index of the running substep within a frame
  L.DEAD_IDX = L.SUBSTEP_IDX + 1;    // dead particles scattered to the tail this substep
  // Heat per thermal body recorded on the GPU but not yet folded into the
  // temperature the CPU uploads (i32, EV_SCALE fixed point). The CPU acknowledges
  // what it applied (aux ack words, subtracted by cs_ack_bodies at frame start),
  // so T_body + unacknowledged / C is the body's current temperature despite the
  // readback latency. Without it, small-capacity walls oscillate and gain energy.
  L.BODY_HEAT_BASE = L.DEAD_IDX + 1;
  L.COUNTER_WORDS = L.BODY_HEAT_BASE + L.MAX_BODIES;

  // Cell-sorted grid: hash table of 2 words per bucket [start, count], sized
  // per frame to the next power of two >= 2 * particles (multiple of SCAN_BLOCK).
  L.SCAN_BLOCK = 1024;
  L.MIN_GRID_TABLE = 65536;
  L.MAX_GRID_TABLE = 2097152;
  L.MAX_SCAN_BLOCKS = L.MAX_GRID_TABLE / L.SCAN_BLOCK;

  // Aux buffer: [thermal slice temperatures (f32 bits)][wall grid ranges][wall index list]
  //   [per thermal body: 1 / heat capacity (f32 bits, 0 = fixed temperature), heat ack (i32)]
  L.MAX_WALL_GRID_DIM = 128;
  L.MAX_WALL_CELLS = L.MAX_WALL_GRID_DIM * L.MAX_WALL_GRID_DIM;
  L.MAX_WALL_REFS = 65536;
  L.WALL_GRID_MARGIN = 24;   // px: max particle radius + move per substep served by the grid
  L.AUX_RANGE_BASE = L.MAX_SLICES;
  L.AUX_LIST_BASE = L.AUX_RANGE_BASE + 2 * L.MAX_WALL_CELLS;
  L.AUX_BODY_BASE = L.AUX_LIST_BASE + L.MAX_WALL_REFS;
  L.AUX_WORDS = L.AUX_BODY_BASE + 2 * L.MAX_BODIES;

  L.ZONE_SINK_BASE = 0;
  L.ZONE_REG_BASE = L.MAX_SINKS;
  L.ZONE_SENSOR_BASE = L.MAX_SINKS + L.MAX_REGULATORS;
  L.ZONE_THERMAL_BASE = L.ZONE_SENSOR_BASE + L.MAX_SENSORS;
  L.MAX_ZONES = L.ZONE_THERMAL_BASE + L.MAX_THERMAL_ZONES;

  L.TELEM_TARGETS = 1 + L.MAX_SENSORS; // target 0 = global system
  L.WG_TARGET_STRIDE = L.TELEM_SCALARS + L.HIST_BINS;
  L.WG_REG_BASE = L.TELEM_TARGETS * L.WG_TARGET_STRIDE;
  L.WG_ACC_SIZE = L.WG_REG_BASE + L.MAX_REGULATORS;
  L.STAT_TARGET_STRIDE = 2 * L.TELEM_SCALARS + L.HIST_BINS;
  L.STAT_REG_BASE = L.TELEM_TARGETS * L.STAT_TARGET_STRIDE;
  L.STAT_WORDS = L.STAT_REG_BASE + L.MAX_REGULATORS;
  return Object.freeze(L);
})();

// Wrapped so the layout alias does not leak into the bundled global scope.
const particleComputeWGSL = ((L) => `
struct SimParams {
  dt: f32, gravity: f32, gravityEnabled: u32, damping: f32,
  particleCount: u32, maxSpeedReference: f32, wallCount: u32, subSteps: u32,
  boundsEnabled: u32, cellSize: f32, gridTableSize: u32, sinkCount: u32,
  boundMin: vec2f, boundMax: vec2f,
  simModel: u32, regulatorCount: u32, sensorCount: u32, thermalZoneCount: u32,
  gridWidth: u32, wallGridW: u32, wallGridH: u32, wallGridCell: f32,
  wallGridOrigin: vec2f, wallGridMargin: f32, globalWallCount: u32,
};

struct Particle {
  pos: vec2f, vel: vec2f, radius: f32, mass: f32, speedNorm: f32, pad: f32,
};

struct WallData {
  p1: vec2f, p2: vec2f, normal: vec2f, thickness: f32,
  isOpen: u32, wallType: u32, allowedDir: f32,
  temperature: f32, conductivity: f32, vel: vec2f, body: u32, pad: f32,
};

// Axis-aligned zone shared by sinks, regulators, sensor chambers and thermal
// zones. Thermal zones reuse fields: direction = slice axis (0: y, 1: x),
// tempFilterMode = slice count, filterTemperature = conductivity,
// maxCount = first temperature slot in aux, pad0 = 1 if slice heat is recorded.
struct ZoneData {
  minPos: vec2f, maxPos: vec2f,
  isActive: u32, direction: u32, tempFilterMode: u32, filterTemperature: f32,
  maxCount: u32, pad0: u32, pad1: u32, pad2: u32,
};

const KB: f32 = ${KB.toFixed(4)};
const WG_SIZE: u32 = ${L.WG}u;
const WALL_EV_STRIDE: u32 = ${L.WALL_EV_STRIDE}u;
const SLICE_EV_STRIDE: u32 = ${L.SLICE_EV_STRIDE}u;
const SLICE_HEAT_BASE: u32 = ${L.SLICE_HEAT_BASE}u;
const RANK_BASE: u32 = ${L.CAPACITY}u;
const NO_INDEX: u32 = 0xFFFFFFFFu;
const DEAD_IDX: u32 = ${L.DEAD_IDX}u;
const AUX_RANGE_BASE: u32 = ${L.AUX_RANGE_BASE}u;
const AUX_LIST_BASE: u32 = ${L.AUX_LIST_BASE}u;
const AUX_BODY_BASE: u32 = ${L.AUX_BODY_BASE}u;
const BODY_HEAT_BASE: u32 = ${L.BODY_HEAT_BASE}u;
const SLICE_BODY_BASE: u32 = ${L.SLICE_BODY_BASE}u;
const MAX_BODIES: u32 = ${L.MAX_BODIES}u;
const MAX_PER_CELL: u32 = 64u;
const ZONE_THERMAL_BASE: u32 = ${L.ZONE_THERMAL_BASE}u;
const SINK_ABS_BASE: u32 = ${L.SINK_ABS_BASE}u;
const REG_QUOTA_BASE: u32 = ${L.REG_QUOTA_BASE}u;
const COMPACT_IDX: u32 = ${L.COMPACT_IDX}u;
const SUBSTEP_IDX: u32 = ${L.SUBSTEP_IDX}u;
const ZONE_SINK_BASE: u32 = ${L.ZONE_SINK_BASE}u;
const ZONE_REG_BASE: u32 = ${L.ZONE_REG_BASE}u;
const ZONE_SENSOR_BASE: u32 = ${L.ZONE_SENSOR_BASE}u;
const TELEM_SCALARS: u32 = ${L.TELEM_SCALARS}u;
const HIST_BINS: u32 = ${L.HIST_BINS}u;
const HIST_BIN_WIDTH: f32 = ${L.HIST_BIN_WIDTH}.0;
const WG_TARGET_STRIDE: u32 = ${L.WG_TARGET_STRIDE}u;
const WG_REG_BASE: u32 = ${L.WG_REG_BASE}u;
const WG_ACC_SIZE: u32 = ${L.WG_ACC_SIZE}u;
const STAT_TARGET_STRIDE: u32 = ${L.STAT_TARGET_STRIDE}u;
const STAT_REG_BASE: u32 = ${L.STAT_REG_BASE}u;
const KE_SCALE: f32 = ${L.KE_SCALE}.0;
const V_SCALE: f32 = ${L.V_SCALE}.0;
const MV_SCALE: f32 = ${L.MV_SCALE}.0;
const M_SCALE: f32 = ${L.M_SCALE}.0;
const EV_SCALE: f32 = ${L.EV_SCALE}.0;
// Per-particle fixed-point cap: WG_SIZE * FX_MAX must stay below 2^32 so a
// workgroup-local u32 accumulator can never overflow.
const FX_MAX: f32 = 6.0e7;

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> particlesIn: array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(3) var<storage, read> walls: array<WallData>;
// cellData[2b] = first sorted index of bucket b, cellData[2b + 1] = particle count.
// Binding 10 is an atomic view of the same buffer, used while counting.
@group(0) @binding(4) var<storage, read_write> cellData: array<u32>;
// gridLinks[i]: bucket of particle i (count/scatter), later its best collision
// partner in sorted order (pairs/integrate); gridLinks[RANK_BASE + i]: rank in bucket.
@group(0) @binding(5) var<storage, read_write> gridLinks: array<u32>;
// [0, MAX_SLICES): thermal slice temperatures as f32 bits; then wall grid
// ranges [start, count] per cell; then the wall index list (dynamic walls first).
@group(0) @binding(6) var<storage, read> aux: array<u32>;
@group(0) @binding(7) var<storage, read> zones: array<ZoneData>;
@group(0) @binding(8) var<storage, read_write> counters: array<atomic<u32>>;
@group(0) @binding(9) var<storage, read_write> stats: array<atomic<u32>>;
@group(0) @binding(10) var<storage, read_write> cellCounter: array<atomic<u32>>;
@group(0) @binding(11) var<storage, read_write> blockSums: array<u32>;

var<workgroup> wgAcc: array<atomic<u32>, ${L.WG_ACC_SIZE}>;
var<workgroup> wgLiveCount: atomic<u32>;
var<workgroup> wgBase: u32;
var<workgroup> scanTmp: array<u32, 256>;

// Bucket of a grid cell in a wrapping row-major table (gridWidth x gridTableSize /
// gridWidth, both powers of two). Unlike a scattering hash this keeps
// neighbouring cells adjacent in the cell-sorted particle buffer; cells further
// apart than the table extent alias, which only merges buckets.
fn cellKey(cx: i32, cy: i32) -> u32 {
  let w = params.gridWidth;
  let h = params.gridTableSize / w;
  return (bitcast<u32>(cx) & (w - 1u)) + (bitcast<u32>(cy) & (h - 1u)) * w;
}

fn isDead(p: Particle) -> bool {
  return p.radius <= 0.0 || p.pos.x < -50000.0;
}

fn deadParticle(mass: f32) -> Particle {
  return Particle(vec2f(-99999.0, -99999.0), vec2f(0.0, 0.0), 0.0, mass, 0.0, 0.0);
}

fn inZone(pos: vec2f, z: ZoneData) -> bool {
  return pos.x >= z.minPos.x && pos.x <= z.maxPos.x && pos.y >= z.minPos.y && pos.y <= z.maxPos.y;
}

fn fx(x: f32, scale: f32) -> u32 {
  return u32(clamp(x * scale + 0.5, 0.0, FX_MAX));
}

// 64-bit accumulation emulated with a (lo, hi) pair of u32 atomics.
fn addCounter64(idx: u32, v: u32) {
  let old = atomicAdd(&counters[idx], v);
  if (old > 0xFFFFFFFFu - v) { atomicAdd(&counters[idx + 1u], 1u); }
}

fn addStat64(idx: u32, v: u32) {
  let old = atomicAdd(&stats[idx], v);
  if (old > 0xFFFFFFFFu - v) { atomicAdd(&stats[idx + 1u], 1u); }
}

// Current temperature of a thermal body: the CPU-uploaded temperature plus the
// heat recorded since, which the CPU has not folded in yet (readback latency).
fn bodyInvCapacity(body: u32) -> f32 {
  if (body >= MAX_BODIES) { return 0.0; }
  return bitcast<f32>(aux[AUX_BODY_BASE + 2u * body]);
}

fn bodyTemperature(uploaded: f32, body: u32) -> f32 {
  let invC = bodyInvCapacity(body);
  if (invC == 0.0) { return uploaded; }
  let pending = f32(bitcast<i32>(atomicLoad(&counters[BODY_HEAT_BASE + body]))) / EV_SCALE;
  return max(0.0, uploaded + pending * invC);
}

// Heat (signed, split into in/out channels) at \`base\`; the same fixed-point
// amount goes into the body's unacknowledged heat so both stay consistent.
fn recordHeat(base: u32, heatIntoElement: f32, body: u32) {
  if (heatIntoElement > 0.0) {
    let q = fx(heatIntoElement, EV_SCALE);
    addCounter64(base, q);
    if (body < MAX_BODIES) { atomicAdd(&counters[BODY_HEAT_BASE + body], q); }
  } else if (heatIntoElement < 0.0) {
    let q = fx(-heatIntoElement, EV_SCALE);
    addCounter64(base + 2u, q);
    if (body < MAX_BODIES) { atomicSub(&counters[BODY_HEAT_BASE + body], q); }
  }
}

// \`front\`: the particle is on the side the wall normal points to.
fn recordWallEvent(wallIdx: u32, impulse: f32, heatIntoWall: f32, body: u32, front: bool) {
  let base = wallIdx * WALL_EV_STRIDE;
  let imp = fx(impulse, EV_SCALE);
  if (imp > 0u) { addCounter64(base + select(2u, 0u, front), imp); }
  recordHeat(base + 4u, heatIntoWall, body);
}

// Reflects a particle off a (possibly moving, possibly conductive) wall and
// records the momentum and heat exchanged so the CPU can drive pistons,
// relief valves and wall temperatures from it.
fn wallBounce(vel: vec2f, mass: f32, n: vec2f, wallIdx: u32) -> vec2f {
  let w = walls[wallIdx];
  let vn = dot(vel - w.vel, n);
  if (vn >= 0.0) { return vel; }
  var v = vel - 2.0 * vn * n;
  var heatIntoWall = 0.0;
  if (w.conductivity > 0.0) {
    let curSpeedSq = dot(v, v);
    if (curSpeedSq > 0.001) {
      // Wall hits sample the flux-weighted distribution, whose mean energy in 2D is
      // 1.5 kB T (not kB T), so the target is 1.5 kB T_wall; otherwise gas in contact
      // with a wall would settle at T_wall / 1.5.
      let targetSpeedSq = (3.0 * KB * bodyTemperature(w.temperature, w.body)) / mass;
      // Implicit in the wall temperature (it already responds to this exchange),
      // so a wall with a capacity of a few particles cannot overshoot.
      let alpha0 = min(1.0, w.conductivity * 0.8);
      let alpha = alpha0 / (1.0 + alpha0 * 1.5 * KB * bodyInvCapacity(w.body));
      let blendSq = (1.0 - alpha) * curSpeedSq + alpha * targetSpeedSq;
      v *= sqrt(blendSq / curSpeedSq);
      heatIntoWall = 0.5 * mass * (curSpeedSq - blendSq);
    }
  }
  recordWallEvent(wallIdx, 2.0 * mass * (-vn), heatIntoWall, w.body, dot(n, w.normal) > 0.0);
  return v;
}

// Wall candidates for one particle: the global (dynamic) list plus the grid
// cell of its start position, or every wall when the grid cannot guarantee
// coverage (no grid, or reach beyond the binning margin).
struct WallCandidates { cellStart: u32, total: u32, brute: bool, };

fn wallCandidates(pos: vec2f, reach: f32) -> WallCandidates {
  var c: WallCandidates;
  if (params.wallGridW == 0u || reach > params.wallGridMargin) {
    c.brute = true;
    c.total = params.wallCount;
    return c;
  }
  c.brute = false;
  c.cellStart = 0u;
  var cellCount = 0u;
  let g = floor((pos - params.wallGridOrigin) / params.wallGridCell);
  if (g.x >= 0.0 && g.y >= 0.0 && g.x < f32(params.wallGridW) && g.y < f32(params.wallGridH)) {
    let cell = u32(g.x) + u32(g.y) * params.wallGridW;
    c.cellStart = aux[AUX_RANGE_BASE + 2u * cell];
    cellCount = aux[AUX_RANGE_BASE + 2u * cell + 1u];
  }
  c.total = params.globalWallCount + cellCount;
  return c;
}

fn wallAt(c: WallCandidates, k: u32) -> u32 {
  if (c.brute) { return k; }
  if (k < params.globalWallCount) { return aux[AUX_LIST_BASE + k]; }
  return aux[AUX_LIST_BASE + c.cellStart + (k - params.globalWallCount)];
}

fn isOneWayWall(w: WallData) -> bool {
  return (w.wallType == 2u) || (w.wallType == 3u && w.isOpen != 0u);
}

fn cellOf(pos: vec2f) -> u32 {
  let cx = i32(floor(pos.x / params.cellSize));
  let cy = i32(floor(pos.y / params.cellSize));
  return cellKey(cx, cy);
}

@compute @workgroup_size(64)
fn cs_clear_cells(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx < params.gridTableSize) {
    atomicStore(&cellCounter[2u * idx + 1u], 0u);
  }
  if (idx == 0u) { atomicStore(&counters[DEAD_IDX], 0u); }
}

@compute @workgroup_size(64)
fn cs_count_cells(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  let p = particlesIn[idx];
  if (isDead(p)) {
    gridLinks[idx] = NO_INDEX;
    return;
  }
  let cell = cellOf(p.pos);
  gridLinks[idx] = cell;
  gridLinks[RANK_BASE + idx] = atomicAdd(&cellCounter[2u * cell + 1u], 1u);
}

// Exclusive scan of bucket counts, SCAN_BLOCK buckets per workgroup (4 per thread).
@compute @workgroup_size(256)
fn cs_scan_blocks(@builtin(workgroup_id) wid: vec3u, @builtin(local_invocation_index) lid: u32) {
  let base = wid.x * 1024u + lid * 4u;
  var prefix: array<u32, 4>;
  var sum = 0u;
  for (var k = 0u; k < 4u; k++) {
    prefix[k] = sum;
    sum += cellData[2u * (base + k) + 1u];
  }
  scanTmp[lid] = sum;
  workgroupBarrier();
  for (var off = 1u; off < 256u; off = off * 2u) {
    var add = 0u;
    if (lid >= off) { add = scanTmp[lid - off]; }
    workgroupBarrier();
    scanTmp[lid] += add;
    workgroupBarrier();
  }
  let exclusive = scanTmp[lid] - sum;
  for (var k = 0u; k < 4u; k++) {
    cellData[2u * (base + k)] = exclusive + prefix[k];
  }
  if (lid == 255u) { blockSums[wid.x] = scanTmp[255]; }
}

// Exclusive scan of the per-block totals (up to 2048 blocks, 8 per thread).
@compute @workgroup_size(256)
fn cs_scan_totals(@builtin(local_invocation_index) lid: u32) {
  let blocks = params.gridTableSize / 1024u;
  var prefix: array<u32, 8>;
  var sum = 0u;
  for (var k = 0u; k < 8u; k++) {
    let b = lid * 8u + k;
    prefix[k] = sum;
    if (b < blocks) { sum += blockSums[b]; }
  }
  scanTmp[lid] = sum;
  workgroupBarrier();
  for (var off = 1u; off < 256u; off = off * 2u) {
    var add = 0u;
    if (lid >= off) { add = scanTmp[lid - off]; }
    workgroupBarrier();
    scanTmp[lid] += add;
    workgroupBarrier();
  }
  let exclusive = scanTmp[lid] - sum;
  for (var k = 0u; k < 8u; k++) {
    let b = lid * 8u + k;
    if (b < blocks) { blockSums[b] = exclusive + prefix[k]; }
  }
}

@compute @workgroup_size(256)
fn cs_scan_add(@builtin(workgroup_id) wid: vec3u, @builtin(local_invocation_index) lid: u32) {
  let blockOffset = blockSums[wid.x];
  let base = wid.x * 1024u + lid * 4u;
  for (var k = 0u; k < 4u; k++) {
    cellData[2u * (base + k)] += blockOffset;
  }
}

// Writes particles into the other buffer in bucket order; dead ones fill the tail.
@compute @workgroup_size(64)
fn cs_scatter(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  let p = particlesIn[idx];
  let cell = gridLinks[idx];
  if (cell == NO_INDEX) {
    let d = atomicAdd(&counters[DEAD_IDX], 1u);
    particlesOut[params.particleCount - 1u - d] = p;
    return;
  }
  particlesOut[cellData[2u * cell] + gridLinks[RANK_BASE + idx]] = p;
}

@compute @workgroup_size(64)
fn cs_find_pairs(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  let p = particlesIn[idx];
  if (isDead(p)) {
    gridLinks[idx] = NO_INDEX;
    return;
  }
  let cx = i32(floor(p.pos.x / params.cellSize));
  let cy = i32(floor(p.pos.y / params.cellSize));

  var bestPartner = NO_INDEX;
  var maxApproach = 0.0;
  var visitedBuckets: array<u32, 9>;
  var visitedCount = 0u;

  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let nCellIdx = cellKey(cx + dx, cy + dy);
      var alreadyVisited = false;
      for (var v = 0u; v < visitedCount; v++) {
        if (visitedBuckets[v] == nCellIdx) {
          alreadyVisited = true;
          break;
        }
      }
      if (alreadyVisited) { continue; }
      visitedBuckets[visitedCount] = nCellIdx;
      visitedCount++;

      let rangeStart = cellData[2u * nCellIdx];
      let rangeEnd = rangeStart + min(cellData[2u * nCellIdx + 1u], MAX_PER_CELL);
      for (var otherIdx = rangeStart; otherIdx < rangeEnd; otherIdx++) {
        if (otherIdx != idx) {
          let pOther = particlesIn[otherIdx];
          let diff = p.pos - pOther.pos;
          let distSq = dot(diff, diff);
          let minDist = p.radius + pOther.radius;
          if (distSq < minDist * minDist && distSq > 1e-4) {
            let dist = sqrt(distSq);
            let n = diff / dist;
            let relVel = p.vel - pOther.vel;
            let vRelN = dot(relVel, n);
            if (vRelN < 0.0) {
              let approach = -vRelN;
              if (approach > maxApproach) {
                maxApproach = approach;
                bestPartner = otherIdx;
              }
            }
          }
        }
      }
    }
  }
  gridLinks[idx] = bestPartner;
}

@compute @workgroup_size(64)
fn cs_integrate(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  var p = particlesIn[idx];
  if (isDead(p)) {
    particlesOut[idx] = p;
    return;
  }
  let startPos = p.pos;

  // 1. Gravity acceleration
  if (params.gravityEnabled != 0u) {
    p.vel.y += params.gravity * params.dt;
  }

  // 2. Particle-Particle Mutual Elastic Collision (Newton III Strict Conservation)
  if (params.simModel == 1u) {
    // Real Gas: Lennard-Jones 6-12 potential
    let cx = i32(floor(p.pos.x / params.cellSize));
    let cy = i32(floor(p.pos.y / params.cellSize));
    var ljForce = vec2f(0.0, 0.0);
    var visitedBuckets: array<u32, 9>;
    var visitedCount = 0u;

    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        let nCellIdx = cellKey(cx + dx, cy + dy);
        var alreadyVisited = false;
        for (var v = 0u; v < visitedCount; v++) {
          if (visitedBuckets[v] == nCellIdx) {
            alreadyVisited = true;
            break;
          }
        }
        if (alreadyVisited) { continue; }
        visitedBuckets[visitedCount] = nCellIdx;
        visitedCount++;

        let rangeStart = cellData[2u * nCellIdx];
        let rangeEnd = rangeStart + min(cellData[2u * nCellIdx + 1u], MAX_PER_CELL);
        for (var otherIdx = rangeStart; otherIdx < rangeEnd; otherIdx++) {
          if (otherIdx != idx) {
            let pOther = particlesIn[otherIdx];
            let diff = p.pos - pOther.pos;
            let distSq = dot(diff, diff);
            let sigma = (p.radius + pOther.radius) * 0.9;
            let sigmaSq = sigma * sigma;
            let rCutSq = sigmaSq * 6.25;
            if (distSq < rCutSq && distSq > 1e-4) {
              let invDistSq = 1.0 / distSq;
              let s_r2 = sigmaSq * invDistSq;
              let s_r6 = s_r2 * s_r2 * s_r2;
              let s_r12 = s_r6 * s_r6;
              let epsilon = 30.0;
              var forceOverDist = 24.0 * epsilon * (2.0 * s_r12 - s_r6) * invDistSq;
              let fSq = forceOverDist * forceOverDist * distSq;
              if (fSq > 1000000.0) {
                let dist = sqrt(distSq);
                forceOverDist = select(-1000.0, 1000.0, forceOverDist > 0.0) / dist;
              }
              ljForce += diff * (forceOverDist / p.mass);
            }
          }
        }
      }
    }
    p.vel += ljForce * params.dt;
  } else {
    // Ideal Gas: Mutual Pairwise Elastic Impulse
    let partnerIdx = gridLinks[idx];
    if (partnerIdx != NO_INDEX) {
      if (gridLinks[partnerIdx] == idx) {
        let pOther = particlesIn[partnerIdx];
        let diff = p.pos - pOther.pos;
        let distSq = dot(diff, diff);
        let minDist = p.radius + pOther.radius;
        if (distSq < minDist * minDist && distSq > 1e-4) {
          let dist = sqrt(distSq);
          let n = diff / dist;
          let relVel = p.vel - pOther.vel;
          let vRelN = dot(relVel, n);
          if (vRelN < 0.0) {
            let mTotal = p.mass + pOther.mass;
            let impulse = 2.0 * vRelN / mTotal;
            p.vel -= impulse * pOther.mass * n;
            let overlap = (minDist - dist) * 0.5;
            p.pos += n * overlap;
          }
        }
      }
    }
  }

  // 3. Wall Continuous Collision Detection (CCD) Ray-vs-Segment
  // Walls are uploaded at their frame-start position; moving walls (piston
  // faces) advance by vel * dt per substep so they sweep rather than jump.
  let wallTime = f32(atomicLoad(&counters[SUBSTEP_IDX])) * params.dt;
  let moveVec = (p.pos - startPos) + p.vel * params.dt;
  let cands = wallCandidates(startPos, p.radius + length(moveVec) + 0.1);

  // Up to 3 bounces per substep: after each hit the remaining motion is tested
  // again, otherwise a particle deflected at a corner passes through the
  // adjacent wall unchecked.
  var segStart = startPos;
  var segMove = moveVec;
  var remaining = 1.0;          // fraction of this substep still to travel
  var hitWallIdx = -1;          // last wall hit (skipped in the next test and the proximity pass)
  for (var bounce = 0u; bounce < 3u; bounce++) {
    let elapsed = (1.0 - remaining) * params.dt;
    var earliestT = 2.0;
    var hitIdx = -1;
    var hitNormal = vec2f(0.0, 0.0);
    var hitEffRad = 0.0;

    for (var k = 0u; k < cands.total; k++) {
      let i = wallAt(cands, k);
      if (i32(i) == hitWallIdx) { continue; }
      let w = walls[i];
      if (w.wallType == 1u && w.isOpen != 0u) { continue; }
      let vRel = p.vel - w.vel;
      let vDotN = dot(vRel, w.normal);
      if (isOneWayWall(w) && (vDotN * w.allowedDir > 0.0)) { continue; }

      let effRad = p.radius + w.thickness * 0.5;
      let wp1 = w.p1 + w.vel * (wallTime + elapsed);
      let seg = w.p2 - w.p1;
      let segLenSq = dot(seg, seg);
      if (segLenSq < 1e-6) { continue; }

      let vx = segMove.x - w.vel.x * params.dt * remaining;
      let vy = segMove.y - w.vel.y * params.dt * remaining;
      let wx = seg.x;
      let wy = seg.y;
      let denom = vx * wy - vy * wx;

      if (abs(denom) > 1e-6) {
        let dx13 = wp1.x - segStart.x;
        let dy13 = wp1.y - segStart.y;
        let t = (dx13 * wy - dy13 * wx) / denom;
        let u = (dx13 * vy - dy13 * vx) / denom;
        let wallLen = sqrt(segLenSq);
        let eps = effRad / wallLen;

        if (t >= 0.0 && t <= 1.0 && u >= -eps && u <= 1.0 + eps && t < earliestT) {
          let hStart = dot(segStart - wp1, w.normal);
          var norm = select(-w.normal, w.normal, hStart >= 0.0);
          if (abs(hStart) < 1e-4) { norm = select(-w.normal, w.normal, vDotN < 0.0); }
          earliestT = t;
          hitIdx = i32(i);
          hitNormal = norm;
          hitEffRad = effRad;
        }
      }
    }

    if (hitIdx < 0) { break; }
    p.vel = wallBounce(p.vel, p.mass, hitNormal, u32(hitIdx));
    segStart = segStart + segMove * earliestT + hitNormal * (hitEffRad + 0.05);
    remaining = remaining * (1.0 - earliestT);
    segMove = p.vel * params.dt * remaining;
    hitWallIdx = hitIdx;
  }
  p.pos = segStart + segMove;

  // 4. Proximity nudge (resting contact or corner entry); the end position is
  // within reach of the start, so the same candidates cover it
  for (var k = 0u; k < cands.total; k++) {
    let i = wallAt(cands, k);
    if (i32(i) == hitWallIdx) { continue; }
    let w = walls[i];
    if (w.wallType == 1u && w.isOpen != 0u) { continue; }
    if (isOneWayWall(w) && (dot(p.vel - w.vel, w.normal) * w.allowedDir > 0.0)) { continue; }
    let effRad = p.radius + w.thickness * 0.5;
    let wp1 = w.p1 + w.vel * (wallTime + params.dt);
    let seg = w.p2 - w.p1;
    let segLenSq = dot(seg, seg);
    var u_proj = 0.0;
    if (segLenSq > 1e-6) {
      u_proj = clamp(dot(p.pos - wp1, seg) / segLenSq, 0.0, 1.0);
    }
    let closest = wp1 + seg * u_proj;
    let diff = p.pos - closest;
    let distSq = dot(diff, diff);
    if (distSq < effRad * effRad && distSq > 1e-6) {
      let dist = sqrt(distSq);
      let norm = diff / dist;
      p.pos = closest + norm * (effRad + 0.05);
      p.vel = wallBounce(p.vel, p.mass, norm, i);
    }
  }

  // 4a. Permeable thermal zones: heat exchangers (isothermal) and regenerator
  // slices (finite capacity, heat recorded per slice)
  for (var t = 0u; t < params.thermalZoneCount; t++) {
    let z = zones[ZONE_THERMAL_BASE + t];
    if (z.isActive == 0u || !inZone(p.pos, z)) { continue; }
    let curSpeedSq = dot(p.vel, p.vel);
    if (curSpeedSq < 0.0001) { continue; }
    let sliceCount = max(z.tempFilterMode, 1u);
    var frac = (p.pos.y - z.minPos.y) / max(z.maxPos.y - z.minPos.y, 1e-3);
    if (z.direction == 1u) { frac = (p.pos.x - z.minPos.x) / max(z.maxPos.x - z.minPos.x, 1e-3); }
    let slice = min(u32(clamp(frac, 0.0, 0.9999) * f32(sliceCount)), sliceCount - 1u);
    let slot = z.maxCount + slice;
    let body = select(MAX_BODIES, SLICE_BODY_BASE + slot, z.pad0 != 0u);
    let targetSpeedSq = (2.0 * KB * max(5.0, bodyTemperature(bitcast<f32>(aux[slot]), body))) / max(0.01, p.mass);
    let alpha0 = min(1.0, z.filterTemperature * 6.0 * params.dt);
    let alpha = alpha0 / (1.0 + alpha0 * KB * bodyInvCapacity(body));
    let blendSq = (1.0 - alpha) * curSpeedSq + alpha * targetSpeedSq;
    if (blendSq > 0.0) {
      p.vel *= sqrt(blendSq / curSpeedSq);
      if (z.pad0 != 0u) {
        recordHeat(SLICE_HEAT_BASE + slot * SLICE_EV_STRIDE, 0.5 * p.mass * (curSpeedSq - blendSq), body);
      }
    }
  }

  // 4b. Sink (Absorber) Absorption with atomic per-sink capacity accounting
  for (var s = 0u; s < params.sinkCount; s++) {
    let z = zones[ZONE_SINK_BASE + s];
    if (z.isActive == 0u || !inZone(p.pos, z)) { continue; }
    if (z.direction == 1u && p.vel.x <= 0.0) { continue; }
    if (z.direction == 2u && p.vel.x >= 0.0) { continue; }
    if (z.direction == 3u && p.vel.y <= 0.0) { continue; }
    if (z.direction == 4u && p.vel.y >= 0.0) { continue; }
    if (z.tempFilterMode != 0u) {
      let pTemp = (p.mass * dot(p.vel, p.vel)) / (2.0 * KB);
      if (z.tempFilterMode == 1u && pTemp < z.filterTemperature) { continue; }
      if (z.tempFilterMode == 2u && pTemp > z.filterTemperature) { continue; }
    }
    let slot = SINK_ABS_BASE + s;
    let old = atomicAdd(&counters[slot], 1u);
    if (z.maxCount != 0u && old >= z.maxCount) {
      atomicSub(&counters[slot], 1u);
      continue;
    }
    particlesOut[idx] = deadParticle(p.mass);
    return;
  }

  // 4c. Regulator extraction: consume the per-frame removal quota set by the CPU
  for (var r = 0u; r < params.regulatorCount; r++) {
    let z = zones[ZONE_REG_BASE + r];
    if (!inZone(p.pos, z)) { continue; }
    let q = REG_QUOTA_BASE + r;
    let cur = atomicLoad(&counters[q]);
    if (cur == 0u || cur >= 0x80000000u) { continue; }
    let old = atomicSub(&counters[q], 1u);
    if (old >= 1u && old < 0x80000000u) {
      particlesOut[idx] = deadParticle(p.mass);
      return;
    }
    atomicAdd(&counters[q], 1u);
  }

  // 5. Bounds (Splash Mode)
  if (params.boundsEnabled != 0u) {
    let r = p.radius;
    if (p.pos.x - r < params.boundMin.x) {
      p.pos.x = params.boundMin.x + r;
      p.vel.x = abs(p.vel.x) * params.damping;
    } else if (p.pos.x + r > params.boundMax.x) {
      p.pos.x = params.boundMax.x - r;
      p.vel.x = -abs(p.vel.x) * params.damping;
    }
    if (p.pos.y - r < params.boundMin.y) {
      p.pos.y = params.boundMin.y + r;
      p.vel.y = abs(p.vel.y) * params.damping;
    } else if (p.pos.y + r > params.boundMax.y) {
      p.pos.y = params.boundMax.y - r;
      p.vel.y = -abs(p.vel.y) * params.damping;
    }
  }

  // 6. Colormap Normalized Speed
  let speed = length(p.vel);
  let maxRef = max(1.0, params.maxSpeedReference);
  p.speedNorm = clamp(speed / maxRef, 0.0, 1.0);

  particlesOut[idx] = p;
}

fn accumulateTarget(t: u32, p: Particle, speed: f32, ke: f32) {
  let b = t * WG_TARGET_STRIDE;
  atomicAdd(&wgAcc[b], 1u);
  atomicAdd(&wgAcc[b + 1u], fx(ke, KE_SCALE));
  if (p.vel.x >= 0.0) { atomicAdd(&wgAcc[b + 2u], fx(p.vel.x, V_SCALE)); }
  else { atomicAdd(&wgAcc[b + 3u], fx(-p.vel.x, V_SCALE)); }
  if (p.vel.y >= 0.0) { atomicAdd(&wgAcc[b + 4u], fx(p.vel.y, V_SCALE)); }
  else { atomicAdd(&wgAcc[b + 5u], fx(-p.vel.y, V_SCALE)); }
  let mv = p.mass * p.vel;
  if (mv.x >= 0.0) { atomicAdd(&wgAcc[b + 6u], fx(mv.x, MV_SCALE)); }
  else { atomicAdd(&wgAcc[b + 7u], fx(-mv.x, MV_SCALE)); }
  if (mv.y >= 0.0) { atomicAdd(&wgAcc[b + 8u], fx(mv.y, MV_SCALE)); }
  else { atomicAdd(&wgAcc[b + 9u], fx(-mv.y, MV_SCALE)); }
  atomicAdd(&wgAcc[b + 10u], fx(p.mass, M_SCALE));
  atomicAdd(&wgAcc[b + 11u], fx(speed, V_SCALE));
  let bin = min(u32(speed / HIST_BIN_WIDTH), HIST_BINS - 1u);
  atomicAdd(&wgAcc[b + TELEM_SCALARS + bin], 1u);
}

// Telemetry reduction: global + per-sensor sums, speed histograms and
// regulator zone counts. Workgroup-local atomics first, then one global
// atomic per non-zero channel per workgroup.
@compute @workgroup_size(64)
fn cs_telemetry(@builtin(global_invocation_id) global_id: vec3u,
                @builtin(local_invocation_index) lid: u32) {
  for (var i = lid; i < WG_ACC_SIZE; i += WG_SIZE) {
    atomicStore(&wgAcc[i], 0u);
  }
  workgroupBarrier();

  let idx = global_id.x;
  if (idx < params.particleCount) {
    let p = particlesIn[idx];
    if (!isDead(p)) {
      let speedSq = dot(p.vel, p.vel);
      let speed = sqrt(speedSq);
      let ke = 0.5 * p.mass * speedSq;
      accumulateTarget(0u, p, speed, ke);
      for (var s = 0u; s < params.sensorCount; s++) {
        if (inZone(p.pos, zones[ZONE_SENSOR_BASE + s])) {
          accumulateTarget(1u + s, p, speed, ke);
        }
      }
      for (var r = 0u; r < params.regulatorCount; r++) {
        if (inZone(p.pos, zones[ZONE_REG_BASE + r])) {
          atomicAdd(&wgAcc[WG_REG_BASE + r], 1u);
        }
      }
    }
  }
  workgroupBarrier();

  for (var i = lid; i < WG_ACC_SIZE; i += WG_SIZE) {
    let v = atomicLoad(&wgAcc[i]);
    if (v == 0u) { continue; }
    if (i >= WG_REG_BASE) {
      atomicAdd(&stats[STAT_REG_BASE + (i - WG_REG_BASE)], v);
      continue;
    }
    let t = i / WG_TARGET_STRIDE;
    let c = i % WG_TARGET_STRIDE;
    if (c < TELEM_SCALARS) {
      addStat64(t * STAT_TARGET_STRIDE + c * 2u, v);
    } else {
      atomicAdd(&stats[t * STAT_TARGET_STRIDE + 2u * TELEM_SCALARS + (c - TELEM_SCALARS)], v);
    }
  }
}

// Frame start: removes the heat the CPU has folded into the uploaded body
// temperatures from the unacknowledged per-body heat (see BODY_HEAT_BASE).
@compute @workgroup_size(64)
fn cs_ack_bodies(@builtin(global_invocation_id) id: vec3u) {
  let b = id.x;
  if (b >= MAX_BODIES) { return; }
  let ack = aux[AUX_BODY_BASE + 2u * b + 1u];
  if (ack != 0u) { atomicSub(&counters[BODY_HEAT_BASE + b], ack); }
}

// Runs once after each substep so moving walls know how far they have advanced.
@compute @workgroup_size(1)
fn cs_advance_substep() {
  atomicAdd(&counters[SUBSTEP_IDX], 1u);
}

// Stream compaction: live particles are packed to the front of particlesOut.
@compute @workgroup_size(64)
fn cs_compact(@builtin(global_invocation_id) global_id: vec3u,
              @builtin(local_invocation_index) lid: u32) {
  if (lid == 0u) { atomicStore(&wgLiveCount, 0u); }
  workgroupBarrier();

  let idx = global_id.x;
  var alive = false;
  var p: Particle;
  if (idx < params.particleCount) {
    p = particlesIn[idx];
    alive = !isDead(p);
  }
  var localSlot = 0u;
  if (alive) { localSlot = atomicAdd(&wgLiveCount, 1u); }
  workgroupBarrier();

  if (lid == 0u) {
    wgBase = atomicAdd(&counters[COMPACT_IDX], atomicLoad(&wgLiveCount));
  }
  workgroupBarrier();

  if (alive) { particlesOut[wgBase + localSlot] = p; }
}

// Marks every slot behind the compacted range as dead.
@compute @workgroup_size(64)
fn cs_compact_tail(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  if (idx >= atomicLoad(&counters[COMPACT_IDX])) {
    particlesOut[idx] = deadParticle(1.0);
  }
}
`)(GPU_LAYOUT);


// --- src/physics/ParticleGPUCompute.js ---

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
  ackBodies: [6, 8],
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
class ParticleGPUCompute {
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
    // Thermal bodies: [1 / heat capacity, heat ack] per body (see GPU_LAYOUT.BODY_HEAT_BASE)
    this._bodyData = new ArrayBuffer(GPU_LAYOUT.MAX_BODIES * 8);
    this._bodyF32 = new Float32Array(this._bodyData);
    this._bodyI32 = new Int32Array(this._bodyData);
    this._bodyAck = new Int32Array(GPU_LAYOUT.MAX_BODIES); // heat applied on the CPU, not yet acknowledged
    this._bodyAckUploaded = false;
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
      ackBodies: makePipe('cs_ack_bodies'),
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
    this.resetBodies();
  }

  // New body assignment: the event counters and the unacknowledged heat refer
  // to the old one, so both start over.
  resetThermalBodies() {
    if (this.isSupported) {
      this.device.queue.writeBuffer(this.countersBuffer, 0, new Uint8Array(this._eventBytes));
    }
    this.resetBodies();
  }

  // Drops all unacknowledged body heat (epoch change or new body assignment).
  resetBodies() {
    this._bodyAck.fill(0);
    this._bodyAckUploaded = false;
    if (this.isSupported) {
      this.device.queue.writeBuffer(this.countersBuffer, GPU_LAYOUT.BODY_HEAT_BASE * 4,
        new Uint8Array(GPU_LAYOUT.MAX_BODIES * 4));
    }
  }

  // Heat (EV_SCALE fixed-point units, as read from the event counters) that the
  // CPU has folded into a body's temperature; subtracted on the GPU next step.
  ackBodyHeat(body, units) {
    if (body >= 0 && body < GPU_LAYOUT.MAX_BODIES) this._bodyAck[body] = (this._bodyAck[body] + units) | 0;
  }

  // Per-frame upload of 1 / heat capacity per thermal body (0: fixed temperature)
  // together with the pending heat acknowledgements.
  uploadBodies(invCapacity) {
    if (!this.isSupported) return;
    const n = GPU_LAYOUT.MAX_BODIES;
    for (let b = 0; b < n; b++) {
      this._bodyF32[2 * b] = invCapacity[b] || 0;
      this._bodyI32[2 * b + 1] = this._bodyAck[b];
    }
    this.device.queue.writeBuffer(this.auxBuffer, GPU_LAYOUT.AUX_BODY_BASE * 4, this._bodyData);
    this._bodyAckUploaded = true;
  }

  reset() {
    this.count = 0;
    this._bumpEpoch();
  }

  // `bodies[i]`: thermal body of segment i, or -1 (fixed temperature / none);
  // `temperatures[i]` overrides the segment temperature (true body temperature).
  uploadWalls(walls, bodies = null, temperatures = null) {
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
      f32[ptr + 10] = temperatures ? temperatures[i] : (w.temperature !== undefined ? w.temperature : 300.0);
      f32[ptr + 11] = w.conductivity !== undefined ? w.conductivity : 0.0;
      f32[ptr + 12] = w.vel ? w.vel.x : (w.velX || 0);
      f32[ptr + 13] = w.vel ? w.vel.y : (w.velY || 0);
      u32[ptr + 14] = bodies && bodies[i] >= 0 ? bodies[i] : 0xFFFFFFFF;
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
      // True slice temperature: heat left in the accumulator is a deficit below the 5 K floor
      const sliceCapacity = Math.max(1, reg.heatCapacity / slices);
      for (let k = 0; k < slices; k++) {
        temps[slot + k] = reg.temperatures[k] + ((reg.heatAccumulators && reg.heatAccumulators[k]) || 0) / sliceCapacity;
      }
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
    this.uniformFloats[14] = hasBounds ? bounds.maxX : WORLD_SIZE;
    this.uniformFloats[15] = hasBounds ? bounds.maxY : WORLD_SIZE;
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
    if (this._bodyAckUploaded) {
      dispatch('ackBodies', Math.ceil(GPU_LAYOUT.MAX_BODIES / GPU_LAYOUT.WG));
      this._bodyAck.fill(0);
      this._bodyAckUploaded = false;
    }
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


// --- src/physics/Engine.js ---

// Element class -> Engine list holding its instances (serialization key too).
const ELEMENT_LISTS = [
  [Wall, 'walls'], [ThrottleValve, 'throttleValves'], [Piston, 'pistons'], [Reservoir, 'reservoirs'],
  [SensorZone, 'sensors'], [Emitter, 'emitters'], [Sink, 'sinks'], [Regulator, 'regulators'],
  [ThermalBlock, 'thermalBlocks'], [HeatExchanger, 'heatExchangers'], [RegeneratorMatrix, 'regenerators'],
  [TextLabel, 'textLabels'], [ParticleGroup, 'particleGroups']
];

class Engine {
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
    resetHistory(this);
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
    resetHistory(this);
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
    historyClock.cycle = (this.sequencer && this.sequencer.isEnabled) ? this.sequencer.currentCycleCount : 0;

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
    // Nothing to record before the first step (after a reset the GPU stats are still empty).
    if (!this.historyTime || this.totalTime <= 0) return;
    const last = lastHistoryTime(this);
    if (last !== null && this.totalTime - last < HISTORY_INTERVAL) return;
    appendHistory(this, {
      t: this.totalTime, temp: temperature, pressure: this.stats.pressure, volume: this.stats.volume,
      count, kinetic: kineticEnergy, drift
    });
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
      elementNames: Object.fromEntries(this.elements.filter(el => el.name).map(el => [el.id, el.name])),
      groupNames: { ...(this.groupNames || {}) },
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
    const names = state.elementNames || {};
    this.elements.forEach(el => { if (names[el.id]) el.name = names[el.id]; });
    this.groupNames = { ...(state.groupNames || {}) };
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


// --- src/render/Colormap.js ---
class Colormap {
  constructor() {
    // Exact Blue -> Violet -> Magenta -> Red gradient matching user screenshot
    this.stops = [
      { t: 0.00, r: 59,  g: 130, b: 246 }, // Vibrant Blue (#3b82f6)
      { t: 0.35, r: 124, g: 58,  b: 237 }, // Deep Violet (#7c3aed)
      { t: 0.65, r: 192, g: 38,  b: 211 }, // Magenta/Purple (#c026d3)
      { t: 1.00, r: 239, g: 68,  b: 68 }  // Warm Red (#ef4444)
    ];

    this.lutSize = 256;
    this.lut = new Array(this.lutSize);
    this._generateLUT();
  }

  _generateLUT() {
    for (let i = 0; i < this.lutSize; i++) {
      const t = i / (this.lutSize - 1);
      this.lut[i] = this._sampleGradient(t);
    }
  }

  _sampleGradient(t) {
    t = Math.max(0, Math.min(1, t));
    let s0 = this.stops[0];
    let s1 = this.stops[this.stops.length - 1];

    for (let i = 0; i < this.stops.length - 1; i++) {
      if (t >= this.stops[i].t && t <= this.stops[i + 1].t) {
        s0 = this.stops[i];
        s1 = this.stops[i + 1];
        break;
      }
    }

    const range = s1.t - s0.t || 1;
    const factor = (t - s0.t) / range;

    const r = Math.round(s0.r + factor * (s1.r - s0.r));
    const g = Math.round(s0.g + factor * (s1.g - s0.g));
    const b = Math.round(s0.b + factor * (s1.b - s0.b));

    return {
      r, g, b,
      rgb: `rgb(${r}, ${g}, ${b})`
    };
  }

  getColor(normalizedValue) {
    const idx = Math.max(0, Math.min(this.lutSize - 1, Math.floor(normalizedValue * (this.lutSize - 1))));
    return this.lut[idx];
  }
}

const thermalColormap = new Colormap();


// --- src/render/ParticleGPURenderer.js ---

class ParticleGPURenderer {
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

    this._initVectorPipeline(pipelineLayout);
  }

  // Velocity arrows drawn straight from the compute particle buffer
  // (pos, vel, radius), 9 vertices per particle: shaft quad + arrow head.
  _initVectorPipeline(pipelineLayout) {
    const device = this.device;
    const shaderModule = device.createShaderModule({
      label: 'ParticleVectorShader',
      code: `
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

        const VECTOR_SCALE = 0.09;   // world length per (px/s), same as the 2D overlay
        const MIN_SPEED = 2.0;
        const HALF_WIDTH = 0.7;      // screen px

        @vertex
        fn vs_vector(
          @builtin(vertex_index) vi: u32,
          @location(1) aPos: vec2f,
          @location(4) aVel: vec2f,
          @location(2) aRadius: f32
        ) -> @builtin(position) vec4f {
          let speed = length(aVel);
          if (aRadius <= 0.0 || aPos.x < -50000.0 || speed <= MIN_SPEED) {
            return vec4f(2.0, 2.0, 2.0, 1.0);
          }
          let s0 = aPos * uniforms.uZoom + uniforms.uPan;
          let d = aVel * (VECTOR_SCALE * uniforms.uZoom);
          let len = max(length(d), 0.001);
          let dir = d / len;
          let n = vec2f(-dir.y, dir.x);
          let headLen = min(len * 0.45, 6.0);
          let headW = headLen * 0.55;
          let e = s0 + dir * (len - headLen);
          var pts = array<vec2f, 9>(
            s0 + n * HALF_WIDTH, s0 - n * HALF_WIDTH, e + n * HALF_WIDTH,
            e + n * HALF_WIDTH, s0 - n * HALF_WIDTH, e - n * HALF_WIDTH,
            s0 + d, e + n * headW, e - n * headW
          );
          let p = pts[vi];
          return vec4f(
            (p.x / uniforms.uViewportSize.x) * 2.0 - 1.0,
            1.0 - (p.y / uniforms.uViewportSize.y) * 2.0,
            0.0, 1.0
          );
        }

        @fragment
        fn fs_vector() -> @location(0) vec4f {
          return vec4f(1.0, 1.0, 1.0, 0.7);
        }
      `
    });

    this.vectorPipeline = device.createRenderPipeline({
      label: 'ParticleVectorPipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_vector',
        buffers: [{
          arrayStride: 8 * 4,
          stepMode: 'instance',
          attributes: [
            { shaderLocation: 1, offset: 0, format: 'float32x2' },     // pos
            { shaderLocation: 4, offset: 2 * 4, format: 'float32x2' }, // vel
            { shaderLocation: 2, offset: 4 * 4, format: 'float32' }    // radius
          ]
        }]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_vector',
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
          }
        }]
      },
      primitive: { topology: 'triangle-list' }
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

  renderGPUBuffer(buffer, count, panX, panY, zoom, maxSpeedReference = 380, colorByVelocity = true, showVectors = false) {
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
    if (showVectors && this.vectorPipeline) {
      renderPass.setPipeline(this.vectorPipeline);
      renderPass.setVertexBuffer(0, buffer);
      renderPass.draw(9, count, 0, 0);
    }
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


// --- src/render/Renderer.js ---

class Renderer {
  constructor(canvas, gpuCanvas = null, bgCanvas = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bgCanvas = bgCanvas;
    this.bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
    this.gpuCanvas = null;
    this.gpuRenderer = null;
    this.useWebGPU = false;

    if (gpuCanvas) {
      this.initGPU(gpuCanvas);
    }
    
    // Viewport Camera (Pan & Zoom)
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.minZoom = 0.20; // Maximum zoom-out clamped to 20%
    this.maxZoom = 3.5;

    // Grid & View settings
    this.showGrid = true;
    this.gridSize = 20;
    this.snapToGrid = true;
    this.showVectors = false;
    // Selection overlay state, set by the app every frame
    this.transformFrame = null;
    this.showItemHandles = true;
    this.hudLabel = null;
    this.hoverItem = null;
    this.hoverItems = null;
    this.colorByVelocity = true;
    this.snapCursor = null; // { x, y } in world coordinates

    this.maxSpeedReference = 380;
    this.highlightedSequencerItem = null;
  }

  async initGPU(gpuCanvas) {
    this.gpuCanvas = gpuCanvas;
    if (!gpuCanvas) {
      this.gpuRenderer = null;
      this.useWebGPU = false;
      return false;
    }
    this.gpuRenderer = new ParticleGPURenderer(gpuCanvas);
    const ok = await this.gpuRenderer.init();
    this.useWebGPU = ok;
    return ok;
  }

  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.panX) / this.zoom,
      y: (screenY - this.panY) / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.panX,
      y: worldY * this.zoom + this.panY
    };
  }

  setViewport(panX, panY, zoom) {
    this.panX = panX;
    this.panY = panY;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }

  zoomAt(screenX, screenY, factor) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    const world = this.screenToWorld(screenX, screenY);
    this.panX = screenX - world.x * newZoom;
    this.panY = screenY - world.y * newZoom;
    this.zoom = newZoom;
  }

  clear() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear 2D overlay canvas to transparent
    ctx.clearRect(0, 0, w, h);

    if (this.bgCtx) {
      this.bgCtx.clearRect(0, 0, w, h);
      if (this.showGrid) {
        this.drawDotGrid(this.bgCtx);
      }
    } else if (this.showGrid) {
      this.drawDotGrid(ctx);
    }
  }

  drawDotGrid(targetCtx = this.ctx) {
    const ctx = targetCtx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const step = this.gridSize;

    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(w, h);

    const startX = Math.floor(topLeft.x / step) * step;
    const endX = Math.ceil(bottomRight.x / step) * step;
    const startY = Math.floor(topLeft.y / step) * step;
    const endY = Math.ceil(bottomRight.y / step) * step;

    ctx.save();
    const dotSize = Math.max(1.2, Math.min(2.5, 1.4 * this.zoom));
    const majorInterval = step * 5;

    // 1. Minor Grid Dots (Smooth alpha with zoom)
    const minorAlpha = Math.min(0.20, Math.max(0.05, 0.12 * Math.sqrt(this.zoom)));
    ctx.fillStyle = `rgba(255, 255, 255, ${minorAlpha})`;
    ctx.beginPath();
    for (let wx = startX; wx <= endX; wx += step) {
      for (let wy = startY; wy <= endY; wy += step) {
        const isMajorX = ((Math.round(wx) % majorInterval + majorInterval) % majorInterval) === 0;
        const isMajorY = ((Math.round(wy) % majorInterval + majorInterval) % majorInterval) === 0;
        if (!isMajorX || !isMajorY) {
          const sx = wx * this.zoom + this.panX;
          const sy = wy * this.zoom + this.panY;
          ctx.rect(sx - dotSize * 0.5, sy - dotSize * 0.5, dotSize, dotSize);
        }
      }
    }
    ctx.fill();

    // 2. Major Grid Dots
    const majorAlpha = Math.min(0.50, Math.max(0.18, 0.32 * Math.sqrt(this.zoom)));
    ctx.fillStyle = `rgba(255, 255, 255, ${majorAlpha})`;
    ctx.beginPath();
    const majorDotSize = dotSize * 1.5;
    for (let wx = startX; wx <= endX; wx += step) {
      for (let wy = startY; wy <= endY; wy += step) {
        const isMajorX = ((Math.round(wx) % majorInterval + majorInterval) % majorInterval) === 0;
        const isMajorY = ((Math.round(wy) % majorInterval + majorInterval) % majorInterval) === 0;
        if (isMajorX && isMajorY) {
          const sx = wx * this.zoom + this.panX;
          const sy = wy * this.zoom + this.panY;
          ctx.rect(sx - majorDotSize * 0.5, sy - majorDotSize * 0.5, majorDotSize, majorDotSize);
        }
      }
    }
    ctx.fill();

    ctx.restore();
  }

  render(engine, selectedItems = [], isEditing = true) {
    const isItemSelected = (item) => Array.isArray(selectedItems) ? selectedItems.includes(item) : selectedItems === item;

    this.clear();

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // 1. Canvas Physical Elements in Unified Layer Order (Z-Index)
    const elements = engine.elements || [];
    for (let i = 0; i < elements.length; i++) {
      const item = elements[i];
      const selected = isItemSelected(item);
      if (item instanceof SensorZone) {
        this.drawSensor(item, selected);
      } else if (item instanceof Reservoir) {
        this.drawReservoir(item, selected);
      } else if (item instanceof HeatExchanger) {
        this.drawHeatExchanger(item, selected);
      } else if (item instanceof RegeneratorMatrix) {
        this.drawRegeneratorMatrix(item, selected);
      } else if (item instanceof ThermalBlock) {
        this.drawThermalBlock(item, selected);
      } else if (item instanceof Emitter) {
        this.drawEmitter(item, selected);
      } else if (item instanceof Sink) {
        this.drawSink(item, selected);
      } else if (item instanceof Regulator) {
        this.drawRegulator(item, selected);
      } else if (item instanceof TextLabel) {
        this.drawTextLabel(item, selected);
      } else if (item instanceof Wall) {
        this.drawWall(item, selected);
      } else if (item instanceof ThrottleValve) {
        this.drawThrottleValve(item, selected);
      } else if (item instanceof Piston) {
        this.drawPiston(item, selected);
      }
    }

    // 2. Particles (Rendered on GPU with 2D overlay for selection/vectors)
    if (this.useWebGPU && this.gpuRenderer) {
      if (engine.isGPUSimulating()) {
        const outputBuffer = engine.gpuCompute.getOutputBuffer();
        this.gpuRenderer.renderGPUBuffer(outputBuffer, engine.gpuCompute.count, this.panX, this.panY, this.zoom, this.maxSpeedReference, this.colorByVelocity, this.showVectors);
        // Particle selection only exists in edit mode, where engine.particles
        // still matches the GPU buffer.
        if (isEditing) {
          const pCount = engine.particles ? engine.particles.length : 0;
          for (let i = 0; i < pCount; i++) {
            if (engine.particles[i].selected) this.drawParticleOverlay(engine.particles[i], false);
          }
        }
      } else {
        this.gpuRenderer.render(engine.particles, this.panX, this.panY, this.zoom, this.maxSpeedReference, this.colorByVelocity);
        const pCount = engine.particles ? engine.particles.length : 0;
        for (let i = 0; i < pCount; i++) {
          const p = engine.particles[i];
          if (p.selected || this.showVectors) {
            this.drawParticleOverlay(p);
          }
        }
      }
    }

    // 9. Selection: transform frame (select tool) or group frames + item handles
    const frame = this.transformFrame;
    if (Array.isArray(selectedItems) && selectedItems.length > 0) {
      if (!frame) {
        const groupsMap = new Map();
        for (let i = 0; i < selectedItems.length; i++) {
          const item = selectedItems[i];
          if (item.groupId) {
            if (!groupsMap.has(item.groupId)) groupsMap.set(item.groupId, []);
            groupsMap.get(item.groupId).push(item);
          }
        }
        groupsMap.forEach((gItems, gid) => {
          if (gItems.length > 1) this.drawGroupBoundingBox(gItems, gid);
        });
      }

      for (let i = 0; i < selectedItems.length; i++) {
        const sel = selectedItems[i];
        if (sel instanceof ParticleGroup) {
          this.drawParticleGroupHighlight(engine, sel);
        } else if (!frame && this.showItemHandles) {
          this.drawResizeHandles(sel);
        }
      }
    }
    if (frame) this.drawTransformFrame(frame);
    if (this.hudLabel) this.drawHudLabel(this.hudLabel.x, this.hudLabel.y, this.hudLabel.text);

    // 9.5 Sequencer Action Selection Glow (Subtle Cyan Outline, No Handles)
    if (this.highlightedSequencerItem) {
      this.drawSequencerHighlight(this.highlightedSequencerItem);
    } else {
      // Hover from the canvas (one element) or the element tree (a whole group)
      const hovered = this.hoverItems || (this.hoverItem ? [this.hoverItem] : []);
      for (const item of hovered) {
        if (!(Array.isArray(selectedItems) && selectedItems.includes(item))) this.drawSequencerHighlight(item, 0.45);
      }
    }

    // 10. Draft Previews (Valves, Walls, Rectangles, Marquee Selection)
    if (this.draftInfo && this.draftInfo.isDrafting) {
      this.drawDraft(this.draftInfo);
    }

    // 11. Snap Cursor Indicator
    if (this.snapCursor) {
      this.drawSnapIndicator(this.snapCursor.x, this.snapCursor.y, this.snapCursor.isVertex);
    }

    ctx.restore();
  }

  drawSequencerHighlight(item, alpha = 1) {
    if (!item) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    if (item.p1 && item.p2) {
      ctx.lineWidth = Math.max(4, (item.thickness || 4) + 4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(item.p1.x, item.p1.y);
      ctx.lineTo(item.p2.x, item.p2.y);
      ctx.stroke();
    } else {
      let b = null;
      if (typeof item.getBounds === 'function') {
        b = item.getBounds();
      } else if (item.x !== undefined && item.y !== undefined) {
        b = { left: item.x, top: item.y, width: item.width || 40, height: item.height || 40 };
      }
      if (b) {
        const left = b.left !== undefined ? b.left : (b.x !== undefined ? b.x : 0);
        const top = b.top !== undefined ? b.top : (b.y !== undefined ? b.y : 0);
        const width = b.width !== undefined ? b.width : ((b.right !== undefined ? b.right : left + 40) - left);
        const height = b.height !== undefined ? b.height : ((b.bottom !== undefined ? b.bottom : top + 40) - top);
        const pad = 4;
        ctx.strokeRect(left - pad, top - pad, width + pad * 2, height + pad * 2);
      }
    }
    ctx.restore();
  }

  drawDraft(draft) {
    const ctx = this.ctx;
    ctx.save();
    const { tool, start, current, shape, vtype } = draft;

    if (!start || !current) {
      ctx.restore();
      return;
    }

    const minX = Math.min(start.x, current.x), minY = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x), h = Math.abs(current.y - start.y);

    if (tool === 'wall') {
      if (shape === 'rect') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(minX, minY, w, h);
      } else if (shape === 'circle') {
        const radius = Math.hypot(current.x - start.x, current.y - start.y);
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Center point & radius line guide
        ctx.beginPath();
        ctx.arc(start.x, start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(current.x, current.y);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Circle Wall (R: ${Math.round(radius)}px)`, (start.x + current.x) * 0.5, (start.y + current.y) * 0.5 - 8);
      } else {
        // Line draft
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
    } else if (tool === 'valve') {
      ctx.strokeStyle = vtype === 'relief_valve' ? '#f97316' : (vtype === 'check_valve' ? '#a855f7' : '#06b6d4');
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();

      const midX = (start.x + current.x) * 0.5;
      const midY = (start.y + current.y) * 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(midX, midY, 6, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else if (tool === 'throttle_valve') {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const midX = (start.x + current.x) * 0.5;
      const midY = (start.y + current.y) * 0.5;
      const len = Math.round(Math.hypot(current.x - start.x, current.y - start.y));
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Throttle Valve (${len}px)`, midX, midY - 12);
    } else if (tool === 'heat_exchanger') {
      ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, w, h);

      // Preview cross-hatch (X)
      ctx.save();
      ctx.beginPath();
      ctx.rect(minX, minY, w, h);
      ctx.clip();
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
      ctx.lineWidth = 1;
      const step = 14;
      for (let x = minX - h; x < minX + w + h; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, minY); ctx.lineTo(x + h, minY + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + h, minY); ctx.lineTo(x, minY + h);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Heat Exchanger (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

    } else if (tool === 'regenerator' || tool === 'matrix') {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, w, h);

      // Preview parallel lines
      ctx.save();
      ctx.beginPath();
      ctx.rect(minX, minY, w, h);
      ctx.clip();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1;
      const isHoriz = w >= h;
      const lineGap = 10;
      if (isHoriz) {
        for (let y = minY + lineGap; y < minY + h; y += lineGap) {
          ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(minX + w, y); ctx.stroke();
        }
      } else {
        for (let x = minX + lineGap; x < minX + w; x += lineGap) {
          ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, minY + h); ctx.stroke();
        }
      }
      ctx.restore();

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Regenerator (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

    } else if (tool === 'solid_res' || tool === 'reservoir') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, w, h);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 10.5px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Heat Bath (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

    } else if (tool === 'storage_block' || tool === 'solidblock') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(minX, minY, w, h);

      // Dotted matrix preview
      ctx.save();
      ctx.beginPath();
      ctx.rect(minX, minY, w, h);
      ctx.clip();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      const dotSpacing = 14;
      for (let x = minX + dotSpacing * 0.5; x < minX + w; x += dotSpacing) {
        for (let y = minY + dotSpacing * 0.5; y < minY + h; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, w, h);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10.5px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Thermal Mass (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

    } else if (tool === 'regulator') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, w, h);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10.5px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Regulator (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

    } else if (tool === 'select' || tool === 'gas' || tool === 'emitter' || tool === 'sink' || tool === 'sensor' || tool === 'piston') {
      let color = '#38bdf8';
      let fill = 'rgba(56, 189, 248, 0.08)';
      if (tool === 'piston') { color = '#eab308'; fill = 'rgba(234, 179, 8, 0.1)'; }
      else if (tool === 'gas') { color = '#22c55e'; fill = 'rgba(34, 197, 94, 0.15)'; }
      else if (tool === 'emitter') { color = '#22c55e'; fill = 'rgba(34, 197, 94, 0.1)'; }
      else if (tool === 'sink') { color = '#a855f7'; fill = 'rgba(168, 85, 247, 0.1)'; }
      else if (tool === 'sensor') { color = '#38bdf8'; fill = 'rgba(56, 189, 248, 0.12)'; }

      ctx.fillStyle = fill;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeRect(minX, minY, w, h);

      if (tool === 'piston') {
        const isVertical = h >= w;
        const centerX = (start.x + current.x) * 0.5, centerY = (start.y + current.y) * 0.5;
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (isVertical) {
          ctx.moveTo(centerX - 140, centerY); ctx.lineTo(centerX + 140, centerY);
        } else {
          ctx.moveTo(centerX, centerY - 140); ctx.lineTo(centerX, centerY + 140);
        }
        ctx.stroke();
      } else if (w >= 30 && h >= 20) {
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        let label = '';
        if (tool === 'gas') label = `Spawner (${Math.round(w)}×${Math.round(h)})`;
        else if (tool === 'emitter') label = `Emitter (${Math.round(w)}×${Math.round(h)})`;
        else if (tool === 'sink') label = `Absorber (${Math.round(w)}×${Math.round(h)})`;
        else if (tool === 'sensor') label = `Sensor (${Math.round(w)}×${Math.round(h)})`;
        if (label) {
          ctx.fillText(label, minX + w * 0.5, minY + h * 0.5 + 4);
        }
      }
    }
    ctx.restore();
  }

  drawSnapIndicator(wx, wy, isVertex = false) {
    const ctx = this.ctx;
    ctx.save();
    
    if (isVertex) {
      // Magnetic Vertex Snap Indicator (Highlight wall endpoint)
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wx, wy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(wx, wy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      // Standard Grid Snap Crosshair
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      
      const s = 6;
      ctx.beginPath();
      ctx.moveTo(wx - s, wy); ctx.lineTo(wx + s, wy);
      ctx.moveTo(wx, wy - s); ctx.lineTo(wx, wy + s);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(wx, wy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
    }

    ctx.restore();
  }

  drawSensor(sensor, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    // Dedicated chamber color for border and charts (never overwritten)
    const dedicatedColor = sensor.color || '#38bdf8';
    const hasParticles = sensor.particleCount > 0;

    // Interior fill represents live temperature via thermal colormap
    if (hasParticles && sensor.temperature !== undefined) {
      const minT = 50;
      const maxT = 600;
      const norm = Math.max(0, Math.min(1.0, (sensor.temperature - minT) / (maxT - minT)));
      const tColor = thermalColormap.getColor(norm);
      ctx.fillStyle = `rgba(${tColor.r}, ${tColor.g}, ${tColor.b}, 0.22)`;
    } else {
      ctx.fillStyle = 'rgba(71, 85, 105, 0.08)';
    }
    ctx.fillRect(sensor.x, sensor.y, sensor.width, sensor.height);

    // Dedicated persistent border for clear identification across canvas and charts
    ctx.strokeStyle = isSelected ? '#ffffff' : dedicatedColor;
    ctx.lineWidth = isSelected ? 3 : 2.0;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(sensor.x, sensor.y, sensor.width, sensor.height);
    ctx.setLineDash([]);

    // Bound Piston Edge Glow Indicator
    if (sensor.pistonBinding && sensor.pistonBinding.pistonId) {
      const edge = sensor.pistonBinding.edge;
      ctx.save();
      ctx.strokeStyle = dedicatedColor;
      ctx.shadowColor = dedicatedColor;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      if (edge === 'right') {
        ctx.moveTo(sensor.x + sensor.width, sensor.y);
        ctx.lineTo(sensor.x + sensor.width, sensor.y + sensor.height);
      } else if (edge === 'left') {
        ctx.moveTo(sensor.x, sensor.y);
        ctx.lineTo(sensor.x, sensor.y + sensor.height);
      } else if (edge === 'bottom') {
        ctx.moveTo(sensor.x, sensor.y + sensor.height);
        ctx.lineTo(sensor.x + sensor.width, sensor.y + sensor.height);
      } else if (edge === 'top') {
        ctx.moveTo(sensor.x, sensor.y);
        ctx.lineTo(sensor.x + sensor.width, sensor.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Header label with chamber name in dedicated color and live temperature
    ctx.fillStyle = isSelected ? '#ffffff' : dedicatedColor;
    ctx.font = 'bold 11.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    const bindTag = (sensor.pistonBinding && sensor.pistonBinding.pistonId) ? ' 🔗' : '';
    const tempText = hasParticles ? ` [${Math.round(sensor.temperature)} K]` : ' (Empty)';
    ctx.fillText(`${sensor.label}${bindTag}${tempText}`, sensor.x + sensor.width * 0.5, sensor.y + 18);

    // Drift Flow Indicator Arrow (only when macroscopic drift exceeds thermal fluctuation)
    if (sensor.displayDriftSpeed > 0) {
      const cx = sensor.x + sensor.width * 0.5;
      const cy = sensor.y + sensor.height * 0.5;
      const angle = sensor.driftAngle || 0;
      const maxDim = Math.min(sensor.width, sensor.height);
      const arrowLen = Math.min(maxDim * 0.38, Math.max(18, sensor.displayDriftSpeed * 0.45));

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = '#22c55e';
      ctx.lineWidth = 2.5;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(-arrowLen * 0.5, 0);
      ctx.lineTo(arrowLen * 0.5, 0);
      ctx.stroke();

      // Arrow Head
      ctx.beginPath();
      ctx.moveTo(arrowLen * 0.5, 0);
      ctx.lineTo(arrowLen * 0.5 - 7, -4.5);
      ctx.lineTo(arrowLen * 0.5 - 7, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  getTemperatureColor(T, alpha = 1.0) {
    const minT = 50;
    const maxT = 800;
    const norm = Math.max(0, Math.min(1.0, (T - minT) / (maxT - minT)));
    const c = thermalColormap.getColor(norm);
    if (alpha >= 1.0) return c.rgb;
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
  }

  drawReservoir(res, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = res.isActive !== false;
    const baseColor = isActive ? this.getTemperatureColor(res.temperature, 1.0) : '#64748b';
    const fill = isActive ? this.getTemperatureColor(res.temperature, 0.22) : 'rgba(71, 85, 105, 0.12)';

    ctx.fillStyle = fill;
    ctx.fillRect(res.x, res.y, res.width, res.height);

    ctx.strokeStyle = isSelected ? '#ffffff' : baseColor;
    ctx.lineWidth = isSelected ? 3.5 : (isActive ? 2.5 : 1.5);
    if (!isActive) ctx.setLineDash([4, 4]);
    ctx.strokeRect(res.x, res.y, res.width, res.height);
    ctx.setLineDash([]);

    // Solid Isotherm Fill (No inner hatching, distinct glowing label)
    const textStr = `Heat Bath ${Math.round(res.temperature)}K${isActive ? '' : ' [OFF]'}`;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(textStr).width;
    const midX = res.x + res.width * 0.5;
    const midY = res.y + res.height * 0.5;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(midX - textWidth * 0.5 - 4, midY - 8, textWidth + 8, 16);

    ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
    ctx.fillText(textStr, midX, midY + 4);

    ctx.restore();
  }

  drawHeatExchanger(hx, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = hx.isActive !== false;
    const themeColor = isActive ? this.getTemperatureColor(hx.temperature, 1.0) : '#64748b';
    const fill = isActive ? this.getTemperatureColor(hx.temperature, 0.16) : 'rgba(71, 85, 105, 0.1)';

    // Permeable background
    ctx.fillStyle = fill;
    ctx.fillRect(hx.x, hx.y, hx.width, hx.height);

    // Permeable dashed boundary
    ctx.strokeStyle = isSelected ? '#ffffff' : themeColor;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(hx.x, hx.y, hx.width, hx.height);
    ctx.setLineDash([]);

    // Cross-Hatch Pattern (X-Mesh)
    ctx.save();
    ctx.beginPath();
    ctx.rect(hx.x, hx.y, hx.width, hx.height);
    ctx.clip();

    ctx.strokeStyle = isActive ? this.getTemperatureColor(hx.temperature, 0.45) : 'rgba(100, 116, 139, 0.18)';
    ctx.lineWidth = 1.2;

    const step = 14;
    for (let x = hx.x - hx.height; x < hx.x + hx.width + hx.height; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, hx.y);
      ctx.lineTo(x + hx.height, hx.y + hx.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + hx.height, hx.y);
      ctx.lineTo(x, hx.y + hx.height);
      ctx.stroke();
    }
    ctx.restore();

    // Label with solid background badge
    const textStr = `Heat Exchanger ${Math.round(hx.temperature)}K${isActive ? '' : ' [OFF]'}`;
    ctx.font = 'bold 10.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(textStr).width;
    const midX = hx.x + hx.width * 0.5;
    const midY = hx.y + hx.height * 0.5;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(midX - textWidth * 0.5 - 4, midY - 8, textWidth + 8, 16);

    ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
    ctx.fillText(textStr, midX, midY + 4);

    ctx.restore();
  }

  drawRegeneratorMatrix(reg, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = reg.isActive !== false;
    const n = reg.sliceCount || 10;
    const isHoriz = reg.orientation === 'horizontal';
    const avgT = Math.round(reg.getAverageTemperature ? reg.getAverageTemperature() : 300);

    // Render spatial multi-slice gradient parallel to flow lines
    for (let i = 0; i < n; i++) {
      const t = reg.temperatures[i] || 300;
      const sliceColor = isActive ? this.getTemperatureColor(t, 0.22) : 'rgba(71, 85, 105, 0.1)';

      ctx.fillStyle = sliceColor;
      if (isHoriz) {
        const sh = reg.height / n;
        ctx.fillRect(reg.x, reg.y + i * sh, reg.width, sh);
      } else {
        const sw = reg.width / n;
        ctx.fillRect(reg.x + i * sw, reg.y, sw, reg.height);
      }
    }

    // Permeable dashed outline
    const borderColor = isActive ? this.getTemperatureColor(avgT, 1.0) : '#64748b';
    ctx.strokeStyle = isSelected ? '#ffffff' : borderColor;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(reg.x, reg.y, reg.width, reg.height);
    ctx.setLineDash([]);

    // Directional Parallel Flow Lines (Parallel to temperature bands)
    ctx.save();
    ctx.beginPath();
    ctx.rect(reg.x, reg.y, reg.width, reg.height);
    ctx.clip();

    ctx.strokeStyle = isActive ? this.getTemperatureColor(avgT, 0.45) : 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1.2;

    if (isHoriz) {
      const lineGap = 10;
      for (let y = reg.y + lineGap; y < reg.y + reg.height; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(reg.x, y);
        ctx.lineTo(reg.x + reg.width, y);
        ctx.stroke();
      }
    } else {
      const lineGap = 10;
      for (let x = reg.x + lineGap; x < reg.x + reg.width; x += lineGap) {
        ctx.beginPath();
        ctx.moveTo(x, reg.y);
        ctx.lineTo(x, reg.y + reg.height);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Gradient Span Label
    const minT = Math.round(Math.min(...reg.temperatures));
    const maxT = Math.round(Math.max(...reg.temperatures));
    const textStr = `Regenerator [${minT}-${maxT}K]${isActive ? '' : ' [OFF]'}`;
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(textStr).width;
    const midX = reg.x + reg.width * 0.5;
    const midY = reg.y + reg.height * 0.5;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(midX - textWidth * 0.5 - 4, midY - 8, textWidth + 8, 16);

    ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
    ctx.fillText(textStr, midX, midY + 4);

    ctx.restore();
  }

  drawThermalBlock(block, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = block.isActive !== false;
    const baseColor = isActive ? this.getTemperatureColor(block.temperature, 1.0) : '#64748b';
    const fill = isActive ? this.getTemperatureColor(block.temperature, 0.20) : 'rgba(71, 85, 105, 0.12)';

    ctx.fillStyle = fill;
    ctx.fillRect(block.x, block.y, block.width, block.height);

    // Dotted Stipple Matrix Pattern / Hatching
    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x, block.y, block.width, block.height);
    ctx.clip();

    ctx.fillStyle = isActive ? this.getTemperatureColor(block.temperature, 0.55) : 'rgba(100, 116, 139, 0.35)';
    const dotSpacing = 14;
    const dotR = 1.4;
    for (let x = block.x + dotSpacing * 0.5; x < block.x + block.width; x += dotSpacing) {
      for (let y = block.y + dotSpacing * 0.5; y < block.y + block.height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.strokeStyle = isSelected ? '#ffffff' : baseColor;
    ctx.lineWidth = isSelected ? 3.5 : (isActive ? 2 : 1.5);
    if (!isActive) ctx.setLineDash([4, 4]);
    ctx.strokeRect(block.x, block.y, block.width, block.height);
    ctx.setLineDash([]);

    // Label with solid background badge for clear readability
    const textStr = `Thermal Mass ${Math.round(block.temperature)}K${isActive ? '' : ' [OFF]'}`;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(textStr).width;
    const midX = block.x + block.width * 0.5;
    const midY = block.y + block.height * 0.5;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(midX - textWidth * 0.5 - 4, midY - 8, textWidth + 8, 16);

    ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
    ctx.fillText(textStr, midX, midY + 4);

    ctx.restore();
  }

  drawEmitter(emitter, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isEnabled = emitter.enabled !== false;
    ctx.fillStyle = isEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)';
    ctx.fillRect(emitter.x, emitter.y, emitter.width, emitter.height);

    ctx.strokeStyle = isSelected ? '#38bdf8' : (isEnabled ? '#22c55e' : '#64748b');
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(emitter.x, emitter.y, emitter.width, emitter.height);
    ctx.setLineDash([]);

    const cx = emitter.x + emitter.width * 0.5;
    const cy = emitter.y + emitter.height * 0.5;
    ctx.strokeStyle = isEnabled ? '#22c55e' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (emitter.direction === 'right') {
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx + 4, cy - 4); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 4, cy + 4);
    } else if (emitter.direction === 'left') {
      ctx.moveTo(cx + 8, cy); ctx.lineTo(cx - 8, cy);
      ctx.lineTo(cx - 4, cy - 4); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx - 4, cy + 4);
    } else if (emitter.direction === 'down') {
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 4, cy + 4); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx + 4, cy + 4);
    } else if (emitter.direction === 'up') {
      ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx - 4, cy - 4); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 4, cy - 4);
    } else { // 360 / radial
      ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7);
      ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5);
      ctx.moveTo(cx - 5, cy + 5); ctx.lineTo(cx + 5, cy - 5);
    }
    ctx.stroke();

    // Emitter label & count progress
    ctx.fillStyle = isEnabled ? '#86efac' : '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const limitText = emitter.maxParticles > 0 ? ` (${emitter.emittedCount}/${emitter.maxParticles})` : '';
    ctx.fillText(`${emitter.rate}/s [${isEnabled ? 'ON' : 'OFF'}]${limitText}`, cx, emitter.y + emitter.height + 14);

    ctx.restore();
  }

  drawSink(sink, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = sink.isActive !== false;
    ctx.fillStyle = isActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(100, 116, 139, 0.12)';
    ctx.fillRect(sink.x, sink.y, sink.width, sink.height);

    ctx.strokeStyle = isSelected ? '#38bdf8' : (isActive ? '#a855f7' : '#64748b');
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(sink.x, sink.y, sink.width, sink.height);
    ctx.setLineDash([]);

    const cx = sink.x + sink.width * 0.5;
    const cy = sink.y + sink.height * 0.5;

    // Direction indicator
    ctx.strokeStyle = isActive ? '#c084fc' : '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (sink.direction === 'right') {
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx + 4, cy - 4); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 4, cy + 4);
    } else if (sink.direction === 'left') {
      ctx.moveTo(cx + 8, cy); ctx.lineTo(cx - 8, cy);
      ctx.lineTo(cx - 4, cy - 4); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx - 4, cy + 4);
    } else if (sink.direction === 'down') {
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 4, cy + 4); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx + 4, cy + 4);
    } else if (sink.direction === 'up') {
      ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx - 4, cy - 4); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 4, cy - 4);
    } else { // 360: Minus symbol inside circle (Absorber / Sink removes particles)
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
    }
    ctx.stroke();

    ctx.fillStyle = isActive ? '#d8b4fe' : '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    let filterTag = '';
    if (sink.tempFilterMode === 'above') filterTag = ` [>${Math.round(sink.filterTemperature || 300)}K]`;
    else if (sink.tempFilterMode === 'below') filterTag = ` [<${Math.round(sink.filterTemperature || 300)}K]`;

    const limitTag = sink.maxParticles > 0 ? ` (${sink.absorbedCount}/${sink.maxParticles})` : '';
    const statusText = isActive ? `Absorber${limitTag}${filterTag}` : 'Absorber [OFF]';
    ctx.fillText(statusText, cx, sink.y + sink.height + 14);

    ctx.restore();
  }

  drawRegulator(reg, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = reg.isActive !== false;
    const count = reg.currentCount !== undefined ? reg.currentCount : 0;
    const target = reg.targetCount || 50;

    // Permeable soft emerald/teal background
    ctx.fillStyle = isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(71, 85, 105, 0.1)';
    ctx.fillRect(reg.x, reg.y, reg.width, reg.height);

    // Permeable dashed border
    let borderColor = isActive ? '#10b981' : '#64748b';
    if (isSelected) borderColor = '#ffffff';
    else if (reg.regulationState === 'emitting') borderColor = '#34d399';
    else if (reg.regulationState === 'absorbing') borderColor = '#f43f5e';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isSelected ? 3 : 1.8;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(reg.x, reg.y, reg.width, reg.height);
    ctx.setLineDash([]);

    const cx = reg.x + reg.width * 0.5;
    const cy = reg.y + reg.height * 0.5;

    // Header label with live particle counter
    let stateTag = '';
    if (isActive) {
      if (reg.regulationState === 'emitting') stateTag = ' [Emitting]';
      else if (reg.regulationState === 'absorbing') stateTag = ' [Absorbing]';
    }
    ctx.fillStyle = isActive ? (isSelected ? '#ffffff' : '#a7f3d0') : '#94a3b8';
    ctx.font = 'bold 10.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    const statusText = isActive ? `Regulator [${count} / ${target} pts]${stateTag}` : `Regulator [OFF]`;
    ctx.fillText(statusText, cx, reg.y + 16);

    // Center regulation target symbol
    ctx.strokeStyle = isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 8, 0, Math.PI * 2);
    ctx.moveTo(cx - 5, cy + 4); ctx.lineTo(cx + 5, cy + 4);
    ctx.moveTo(cx, cy - 1); ctx.lineTo(cx, cy + 9);
    ctx.stroke();

    ctx.restore();
  }

  drawTextLabel(label, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();
    const b = label.getBounds ? label.getBounds() : { left: label.x, top: label.y, right: label.x + 80, bottom: label.y + 24, width: 80, height: 24 };

    // Background fill when selected
    if (isSelected) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(b.left, b.top, b.width, b.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(b.left, b.top, b.width, b.height);
      ctx.setLineDash([]);
    }

    ctx.font = `600 ${label.fontSize}px Inter, sans-serif`;
    ctx.fillStyle = isSelected ? '#38bdf8' : label.color;
    ctx.textBaseline = 'middle';
    ctx.fillText(label.text, label.x + 6, label.y + b.height * 0.5);

    ctx.restore();
  }

  drawWall(wall, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    let strokeColor = '#ffffff';
    if (wall.type === 'manual_valve') {
      strokeColor = wall.isOpen ? '#22c55e' : '#06b6d4';
    } else if (wall.type === 'check_valve') {
      strokeColor = '#a855f7';
    } else if (wall.type === 'relief_valve') {
      strokeColor = wall.isOpen ? '#22c55e' : '#f97316';
    } else if (wall.conductivity > 0) {
      strokeColor = '#eab308';
    }

    if (isSelected) {
      strokeColor = '#38bdf8';
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected ? wall.thickness + 2 : wall.thickness;
    ctx.lineCap = 'round';

    if (wall.isOpen) {
      ctx.setLineDash([6, 6]);
    }

    ctx.beginPath();
    ctx.moveTo(wall.p1.x, wall.p1.y);
    ctx.lineTo(wall.p2.x, wall.p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const midX = (wall.p1.x + wall.p2.x) * 0.5;
    const midY = (wall.p1.y + wall.p2.y) * 0.5;

    if (wall.type === 'check_valve') {
      const nx = wall.normal.x * wall.allowedDirection;
      const ny = wall.normal.y * wall.allowedDirection;

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(midX - nx * 8, midY - ny * 8);
      ctx.lineTo(midX + nx * 10, midY + ny * 10);
      ctx.lineTo(midX + nx * 5 - ny * 4, midY + ny * 5 + nx * 4);
      ctx.moveTo(midX + nx * 10, midY + ny * 10);
      ctx.lineTo(midX + nx * 5 + ny * 4, midY + ny * 5 - nx * 4);
      ctx.stroke();
    }

    if (wall.type === 'manual_valve') {
      ctx.fillStyle = wall.isOpen ? '#22c55e' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(midX, midY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (wall.type === 'relief_valve') {
      ctx.fillStyle = wall.isOpen ? '#22c55e' : '#f97316';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(midX, midY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (wall.reliefMode === 'oneway') {
        const nx = wall.normal.x * (wall.allowedDirection || 1);
        const ny = wall.normal.y * (wall.allowedDirection || 1);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(midX - nx * 7, midY - ny * 7);
        ctx.lineTo(midX + nx * 9, midY + ny * 9);
        ctx.lineTo(midX + nx * 4 - ny * 3, midY + ny * 4 + nx * 3);
        ctx.moveTo(midX + nx * 9, midY + ny * 9);
        ctx.lineTo(midX + nx * 4 + ny * 3, midY + ny * 4 - nx * 3);
        ctx.stroke();
      }

      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = wall.isOpen ? '#86efac' : '#fdba74';
      ctx.textAlign = 'center';
      const hystStr = wall.pressureHysteresis ? ` (±${wall.pressureHysteresis})` : '';
      ctx.fillText(`P:${Math.round(wall.smoothedPressure || 0)}/${wall.triggerPressure}${hystStr}`, midX, midY - 10);
    }

    ctx.restore();
  }

  drawThrottleValve(tv, isSelected = false) {
    const ctx = this.ctx;
    ctx.save();

    const isActive = tv.isActive !== false;
    let baseColor = isActive ? '#10b981' : '#64748b'; // Emerald Green
    if (isSelected) baseColor = '#ffffff';

    const th = tv.thickness || 6;
    const nx = tv.normal.x;
    const ny = tv.normal.y;
    const ux = tv.unitDir.x;
    const uy = tv.unitDir.y;

    // Wing 1 (Solid segment with wedge tip at wing1End)
    if (tv.wingLength > 0.5) {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = th;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(tv.p1.x, tv.p1.y);
      ctx.lineTo(tv.wing1End.x, tv.wing1End.y);
      ctx.stroke();

      // Wedge jaw tip tapering toward gap
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(tv.wing1End.x + nx * (th * 0.9), tv.wing1End.y + ny * (th * 0.9));
      ctx.lineTo(tv.wing1End.x - nx * (th * 0.9), tv.wing1End.y - ny * (th * 0.9));
      ctx.lineTo(tv.wing1End.x + ux * Math.min(6, Math.max(2, tv.gapWidth * 0.25)), tv.wing1End.y + uy * Math.min(6, Math.max(2, tv.gapWidth * 0.25)));
      ctx.closePath();
      ctx.fill();
    }

    // Wing 2 (Solid segment with wedge tip at wing2Start)
    if (tv.wingLength > 0.5) {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = th;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(tv.wing2Start.x, tv.wing2Start.y);
      ctx.lineTo(tv.p2.x, tv.p2.y);
      ctx.stroke();

      // Wedge jaw tip tapering toward gap
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(tv.wing2Start.x + nx * (th * 0.9), tv.wing2Start.y + ny * (th * 0.9));
      ctx.lineTo(tv.wing2Start.x - nx * (th * 0.9), tv.wing2Start.y - ny * (th * 0.9));
      ctx.lineTo(tv.wing2Start.x - ux * Math.min(6, Math.max(2, tv.gapWidth * 0.25)), tv.wing2Start.y - uy * Math.min(6, Math.max(2, tv.gapWidth * 0.25)));
      ctx.closePath();
      ctx.fill();
    }

    // Central Orifice Gap visualization
    if (tv.gapWidth > 1) {
      ctx.strokeStyle = isActive ? 'rgba(245, 158, 11, 0.45)' : 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(tv.wing1End.x, tv.wing1End.y);
      ctx.lineTo(tv.wing2Start.x, tv.wing2Start.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Midpoint Label with Opening Ratio & Pressure Drop
    const midX = tv.midPoint.x;
    const midY = tv.midPoint.y;
    const offsetDist = Math.max(14, th + 8);
    const labelX = midX + nx * offsetDist;
    const labelY = midY + ny * offsetDist;

    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillStyle = isSelected ? '#ffffff' : (isActive ? '#fbbf24' : '#94a3b8');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pct = Math.round(tv.openRatio * 100);
    const dPText = (tv.deltaP && tv.deltaP > 1) ? ` ΔP:${Math.round(tv.deltaP)}Pa` : '';
    ctx.fillText(`Throttle ${pct}%${dPText}`, labelX, labelY);

    ctx.restore();
  }

  drawPiston(piston, isSelected = false) {
    const ctx = this.ctx;
    const bounds = piston.getBounds();
    const w = bounds.right - bounds.left;
    const h = bounds.bottom - bounds.top;

    ctx.save();

    // Guide Rails
    ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(234, 179, 8, 0.5)';
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.setLineDash([4, 4]);

    if (piston.orientation === 'horizontal') {
      ctx.beginPath();
      ctx.moveTo(piston.minPos, piston.y);
      ctx.lineTo(piston.maxPos, piston.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(piston.minPos, piston.y - 12);
      ctx.lineTo(piston.minPos, piston.y + 12);
      ctx.moveTo(piston.maxPos, piston.y - 12);
      ctx.lineTo(piston.maxPos, piston.y + 12);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(piston.x, piston.minPos);
      ctx.lineTo(piston.x, piston.maxPos);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(piston.x - 12, piston.minPos);
      ctx.lineTo(piston.x + 12, piston.minPos);
      ctx.moveTo(piston.x - 12, piston.maxPos);
      ctx.lineTo(piston.x + 12, piston.maxPos);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Spring
    if (piston.mode === 'spring') {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const startPos = piston.maxPos;
      const endPos = piston.orientation === 'horizontal' ? piston.x + w / 2 : piston.y + h / 2;
      const numCoils = 6;
      const step = (endPos - startPos) / (numCoils * 2 || 1);
      
      if (piston.orientation === 'vertical') {
        ctx.moveTo(piston.x, startPos);
        for (let i = 1; i <= numCoils * 2; i++) {
          const cy = startPos + i * step;
          const cx = piston.x + (i % 2 === 0 ? 6 : -6);
          ctx.lineTo(cx, cy);
        }
        ctx.lineTo(piston.x, endPos);
      } else {
        ctx.moveTo(startPos, piston.y);
        for (let i = 1; i <= numCoils * 2; i++) {
          const cx = startPos + i * step;
          const cy = piston.y + (i % 2 === 0 ? 6 : -6);
          ctx.lineTo(cx, cy);
        }
        ctx.lineTo(endPos, piston.y);
      }
      ctx.stroke();
    }

    // Damper Symbol / Indicator
    if (piston.mode === 'damper') {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      const startPos = piston.minPos;
      const endPos = piston.orientation === 'horizontal' ? piston.x - w / 2 : piston.y - h / 2;
      ctx.beginPath();
      if (piston.orientation === 'vertical') {
        ctx.moveTo(piston.x, startPos);
        ctx.lineTo(piston.x, endPos);
      } else {
        ctx.moveTo(startPos, piston.y);
        ctx.lineTo(endPos, piston.y);
      }
      ctx.stroke();
    }

    // Piston Body
    const isPActive = piston.isActive !== false;
    let pColor = '#38bdf8';
    if (!isPActive) pColor = '#64748b';
    else if (piston.mode === 'motorized') pColor = '#a855f7';
    else if (piston.mode === 'damper') pColor = '#f59e0b';
    else if (piston.mode === 'spring') pColor = '#22c55e';

    ctx.fillStyle = isSelected ? '#0284c7' : (isPActive ? pColor : 'rgba(71, 85, 105, 0.25)');
    ctx.strokeStyle = isSelected ? '#ffffff' : (isPActive ? '#0f172a' : '#64748b');
    ctx.lineWidth = 2;
    if (!isPActive) ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.roundRect(bounds.left, bounds.top, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isPActive ? '#0f172a' : '#94a3b8';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const modeSymbol = piston.mode === 'motorized' ? 'C' : (piston.mode === 'damper' ? 'E' : (piston.mode === 'spring' ? 'A' : 'D'));
    ctx.fillText(modeSymbol, piston.x, piston.y + 4);

    ctx.restore();
  }

  drawParticleOverlay(p, withVector = true) {
    const ctx = this.ctx;
    const speed = p.getSpeed();

    // Highlight selected particle
    if (p.selected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius + 3.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius + 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Optional Velocity Vector Arrow
    if (withVector && this.showVectors && speed > 2) {
      const scale = 0.09;
      const vx = p.vel.x * scale;
      const vy = p.vel.y * scale;
      const endX = p.pos.x + vx;
      const endY = p.pos.y + vy;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.pos.x, p.pos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw Resize / Node Handles for Selected Items
  drawResizeHandles(item) {
    const handles = this.getResizeHandles(item);
    if (!handles || handles.length === 0) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    for (let i = 0; i < handles.length; i++) {
      const h = handles[i];
      ctx.beginPath();
      if (h.type === 'square') {
        ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
        ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
      } else {
        ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Get interactive handle positions for selected objects
  getResizeHandles(item) {
    if (!item) return [];

    if (item instanceof Wall) {
      return [
        { id: 'p1', x: item.p1.x, y: item.p1.y, type: 'circle' },
        { id: 'p2', x: item.p2.x, y: item.p2.y, type: 'circle' }
      ];
    } else if (item instanceof ThrottleValve) {
      return [
        { id: 'p1', x: item.p1.x, y: item.p1.y, type: 'circle' },
        { id: 'p2', x: item.p2.x, y: item.p2.y, type: 'circle' },
        { id: 'gap1', x: item.wing1End.x, y: item.wing1End.y, type: 'square' },
        { id: 'gap2', x: item.wing2Start.x, y: item.wing2Start.y, type: 'square' }
      ];
    } else if (item instanceof Piston) {
      const handles = item.getHandlePositions();
      return [
        { id: 'minPos', x: handles.minHandle.x, y: handles.minHandle.y, type: 'circle' },
        { id: 'maxPos', x: handles.maxHandle.x, y: handles.maxHandle.y, type: 'circle' }
      ];
    } else if (item.getBounds && typeof item.getBounds === 'function') {
      const b = item.getBounds();
      return [
        { id: 'tl', x: b.left, y: b.top, type: 'square' },
        { id: 'tr', x: b.right, y: b.top, type: 'square' },
        { id: 'br', x: b.right, y: b.bottom, type: 'square' },
        { id: 'bl', x: b.left, y: b.bottom, type: 'square' }
      ];
    } else if (!(item instanceof ParticleGroup) && item.x !== undefined && item.y !== undefined && item.width !== undefined && item.height !== undefined) {
      // Box items: Reservoir, SensorZone, Emitter, Sink, ThermalBlock
      return [
        { id: 'tl', x: item.x, y: item.y, type: 'square' },
        { id: 'tr', x: item.x + item.width, y: item.y, type: 'square' },
        { id: 'br', x: item.x + item.width, y: item.y + item.height, type: 'square' },
        { id: 'bl', x: item.x, y: item.y + item.height, type: 'square' }
      ];
    }
    return [];
  }

  drawParticleGroupHighlight(engine, group) {
    const pts = group.getActiveParticles(engine);
    if (!pts || pts.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, (p.radius || 3.5) + 3.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw a bounding box with badge for elements grouped together
  drawGroupBoundingBox(items, gid) {
    if (!items || items.length < 2) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item instanceof Wall) {
        minX = Math.min(minX, item.p1.x, item.p2.x);
        minY = Math.min(minY, item.p1.y, item.p2.y);
        maxX = Math.max(maxX, item.p1.x, item.p2.x);
        maxY = Math.max(maxY, item.p1.y, item.p2.y);
      } else if (item instanceof Piston) {
        const b = item.getBounds();
        minX = Math.min(minX, b.left);
        minY = Math.min(minY, b.top);
        maxX = Math.max(maxX, b.right);
        maxY = Math.max(maxY, b.bottom);
      } else if (item.x !== undefined && item.y !== undefined && item.width !== undefined && item.height !== undefined) {
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + item.width);
        maxY = Math.max(maxY, item.y + item.height);
      } else if (item.x !== undefined && item.y !== undefined) {
        minX = Math.min(minX, item.x - 20);
        minY = Math.min(minY, item.y - 10);
        maxX = Math.max(maxX, item.x + 80);
        maxY = Math.max(maxY, item.y + 20);
      }
    }

    if (minX === Infinity) return;

    const pad = 10;
    const gx = minX - pad;
    const gy = minY - pad;
    const gw = (maxX - minX) + 2 * pad;
    const gh = (maxY - minY) + 2 * pad;

    const ctx = this.ctx;
    ctx.save();

    // Group bounding fill & outline
    ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.fillRect(gx, gy, gw, gh);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.setLineDash([]);

    // Corner brackets
    const cLen = 8;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(gx, gy + cLen); ctx.lineTo(gx, gy); ctx.lineTo(gx + cLen, gy);
    // Top-Right
    ctx.moveTo(gx + gw - cLen, gy); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx + gw, gy + cLen);
    // Bottom-Right
    ctx.moveTo(gx + gw, gy + gh - cLen); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(gx + gw - cLen, gy + gh);
    // Bottom-Left
    ctx.moveTo(gx + cLen, gy + gh); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx, gy + gh - cLen);
    ctx.stroke();

    // Group Badge
    const badgeText = `⧉ Group (${items.length})`;
    ctx.font = 'bold 10px Inter, sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeW = textWidth + 12;
    const badgeH = 18;
    const badgeX = gx;
    const badgeY = gy - badgeH - 4;

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + 6, badgeY + badgeH * 0.5);

    ctx.restore();
  }

  // Selection transform frame: outline, 8 resize handles, rotate handle,
  // shape vertices, size badge. Sizes are constant in screen pixels.
  drawTransformFrame(frame) {
    const ctx = this.ctx;
    const z = this.zoom;
    ctx.save();
    ctx.lineWidth = 1 / z;
    ctx.strokeStyle = '#38bdf8';
    ctx.setLineDash([4 / z, 3 / z]);
    ctx.strokeRect(frame.x0, frame.y0, frame.x1 - frame.x0, frame.y1 - frame.y0);
    ctx.setLineDash([]);

    // Rotate handle on a short stem
    const midX = (frame.x0 + frame.x1) * 0.5;
    ctx.beginPath();
    ctx.moveTo(midX, frame.y0);
    ctx.lineTo(frame.rot.x, frame.rot.y);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 1.5 / z;
    ctx.beginPath();
    ctx.arc(frame.rot.x, frame.rot.y, 5 / z, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const hs = 7 / z;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0ea5e9';
    for (const h of frame.handles) {
      ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
      ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
    }

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5 / z;
    for (const v of frame.vertices) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 4 / z, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (frame.label) this.drawHudLabel(midX, frame.y1 + 16 / z, frame.label);
    if (frame.badge) {
      ctx.font = `600 ${10 / z}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(frame.badge, frame.x0, frame.y0 - 4 / z);
    }
    ctx.restore();
  }

  // Small dark pill with text, centered on (x, y), constant screen size.
  drawHudLabel(x, y, text) {
    const ctx = this.ctx;
    const z = this.zoom;
    ctx.save();
    ctx.font = `600 ${10.5 / z}px 'JetBrains Mono', monospace`;
    const w = ctx.measureText(text).width + 12 / z;
    const h = 17 / z;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1 / z;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4 / z);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5 / z);
    ctx.restore();
  }
}


// --- src/analytics/chartData.js ---
// Series for the charts: which history array a metric reads, its label/unit,
// and the series of a target ('global', a sensor zone, or 'sensors' = every
// sensor zone, falling back to the global system when there is none).

// Categorical series colors for the dark chart surface, in fixed order
// (validated: lightness band, CVD separation >= 8.4, contrast >= 3:1 on #12141a).
const CHART_PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

// Default color of the n-th sensor zone (color follows the entity).
function sensorColor(index) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

const TIME_METRICS = {
  temp: { label: 'Temperature', symbol: 'T', unit: 'K', key: 'historyTemp', color: CHART_PALETTE[0] },
  pressure: { label: 'Pressure', symbol: 'P', unit: 'Pa', key: 'historyPressure', color: CHART_PALETTE[1] },
  volume: { label: 'Volume', symbol: 'V', unit: 'px²', key: 'historyVolume', color: CHART_PALETTE[2] },
  count: { label: 'Particles', symbol: 'N', unit: '', key: 'historyCount', color: CHART_PALETTE[6] },
  kinetic: { label: 'Kinetic Energy', symbol: 'E_kin', unit: 'J', key: 'historyKineticEnergy', color: CHART_PALETTE[4] },
  drift: { label: 'Drift Speed', symbol: '|v_drift|', unit: 'px/s', key: 'historyDrift', color: CHART_PALETTE[3] }
};

// State diagrams: x / y metric; 'entropy' is s = ln T + ln(V/N) per particle (2D ideal gas, in k_B).
const XY_METRICS = {
  pv: { label: 'P-V Diagram', x: 'volume', y: 'pressure' },
  pt: { label: 'P-T Diagram', x: 'temp', y: 'pressure' },
  ts: { label: 'T-s Diagram', x: 'entropy', y: 'temp' }
};

const AXIS = {
  ...TIME_METRICS,
  entropy: { label: 'Entropy', symbol: 's', unit: 'k_B' },
  time: { label: 'Time', symbol: 't', unit: 's' },
  speed: { label: 'Speed', symbol: 'v', unit: 'px/s' }
};

function metricKind(metric) {
  if (metric === 'hist') return 'hist';
  return XY_METRICS[metric] ? 'xy' : 'time';
}

function metricTitle(metric) {
  if (metric === 'hist') return 'Velocity Distribution';
  if (XY_METRICS[metric]) return XY_METRICS[metric].label;
  const m = TIME_METRICS[metric];
  return m ? `${m.label} ${m.symbol}(t)` : metric;
}

function targetsOf(engine, target) {
  if (target === 'sensors') return engine.sensors.length > 0 ? engine.sensors : ['global'];
  if (target === 'global' || !target) return ['global'];
  return engine.sensors.includes(target) ? [target] : [];
}

function sourceName(src) {
  return src === 'global' ? 'System' : (src.label || 'Sensor');
}

function sourceColor(src, metric) {
  return src === 'global' ? (TIME_METRICS[metric]?.color || CHART_PALETTE[0]) : (src.color || CHART_PALETTE[0]);
}

function seriesArray(src, engine, metric) {
  const h = src === 'global' ? engine : src;
  if (metric === 'entropy') {
    const T = h.historyTemp || [], V = h.historyVolume || [], N = h.historyCount || [];
    return T.map((t, i) => Math.log(Math.max(1e-6, t)) + Math.log(Math.max(1e-6, (V[i] || 1) / Math.max(1, N[i] || 1))));
  }
  return h[TIME_METRICS[metric].key] || [];
}

// Time series: [{ name, color, t, y, cycle }]
function timeSeries(engine, target, metric) {
  return targetsOf(engine, target).map(src => {
    const h = src === 'global' ? engine : src;
    return { name: sourceName(src), color: sourceColor(src, metric), t: h.historyTime || [], y: seriesArray(src, engine, metric), cycle: h.historyCycle || [] };
  });
}

// State diagram series: [{ name, color, t, x, y, cycle }]
function xySeries(engine, target, metric) {
  const def = XY_METRICS[metric];
  // The whole world has constant volume: a global P-V or T-s diagram is degenerate.
  const usable = targetsOf(engine, target).filter(src => src !== 'global' || def.x !== 'volume');
  return usable.map(src => {
    const h = src === 'global' ? engine : src;
    return {
      name: sourceName(src), color: sourceColor(src, def.y),
      t: h.historyTime || [], x: seriesArray(src, engine, def.x), y: seriesArray(src, engine, def.y), cycle: h.historyCycle || []
    };
  });
}

// Speed samples for the velocity histogram.
function speedSamples(engine, target) {
  const src = targetsOf(engine, target)[0];
  if (src === 'global' || !src) {
    if (engine.latestSpeedSamples?.length) return engine.latestSpeedSamples;
    return (engine.particles || []).slice(0, 1000).map(p => p.getSpeed());
  }
  return src.speedSamples || [];
}

// Work done by the gas, W = ∮P dV / PRESSURE_SCALE (same energy units as E_kin),
// per sequencer cycle. Returns [{ cycle, work, complete }].
function cycleWork(series) {
  const out = [];
  let cur = null;
  for (let i = 1; i < series.x.length; i++) {
    const c = series.cycle[i] || 0;
    if (!cur || cur.cycle !== c) {
      if (cur) cur.complete = true;
      cur = { cycle: c, work: 0, complete: false };
      out.push(cur);
    }
    cur.work += 0.5 * (series.y[i] + series.y[i - 1]) * (series.x[i] - series.x[i - 1]) / PRESSURE_SCALE;
  }
  return out;
}

function formatValue(v, unit = '') {
  if (!Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  let s;
  if (a >= 1e6) s = `${(v / 1e6).toFixed(2)}M`;
  else if (a >= 1e4) s = `${(v / 1e3).toFixed(1)}k`;
  else if (a >= 100) s = `${Math.round(v)}`;
  else if (a >= 10) s = v.toFixed(1);
  else s = v.toFixed(2);
  return unit ? `${s} ${unit}` : s;
}

// Long-format CSV of every recorded series (one row per sample and source).
function historyCSV(engine) {
  const rows = ['source,time_s,temperature_K,pressure_Pa,volume_px2,particles,kinetic_energy_J,drift_px_s,cycle'];
  const add = (name, h) => {
    const n = (h.historyTime || []).length;
    for (let i = 0; i < n; i++) {
      rows.push([
        `"${name.replace(/"/g, '""')}"`, h.historyTime[i].toFixed(4), h.historyTemp[i], h.historyPressure[i],
        h.historyVolume[i], h.historyCount[i], h.historyKineticEnergy[i], h.historyDrift[i], (h.historyCycle || [])[i] ?? 0
      ].join(','));
    }
  };
  add('System', engine);
  engine.sensors.forEach(s => add(s.label || 'Sensor', s));
  return rows.join('\n');
}


// --- src/analytics/ChartView.js ---
// One chart: time series, state diagram (P-V, P-T, T-s) or velocity histogram
// of a target ('global', a sensor zone, or 'sensors'). Draws crisp on HiDPI,
// with nice-number axes and units, a legend from two series on, a crosshair +
// tooltip on hover, and P-V loops coloured per sequencer cycle (current cycle
// bright, earlier ones faded) with the work per cycle.

const THEME = {
  surface: '#12141a', grid: '#1f232c', axis: '#2d3342',
  text: '#9ca3af', textDim: '#64748b', textMain: '#e5e7eb', tooltip: 'rgba(12, 14, 19, 0.96)'
};
const FONT = "'JetBrains Mono', monospace";

function niceStep(range, count) {
  const raw = range / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function niceTicks(min, max, count) {
  const step = niceStep(max - min, count);
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

// First index with arr[i] >= v (arr ascending).
function lowerBound(arr, v) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function paddedRange(min, max) {
  if (!Number.isFinite(min)) return [0, 1];
  if (max - min < 1e-9) {
    const d = Math.abs(min) * 0.05 || 1;
    return [min - d, max + d];
  }
  const pad = (max - min) * 0.06;
  return [min - pad, max + pad];
}

const axisTitle = (key) => {
  const a = AXIS[key];
  return a ? `${a.symbol}${a.unit ? ` [${a.unit}]` : ''}` : key;
};

class ChartView {
  constructor(canvas, spec = {}, { large = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spec = { target: 'global', metric: 'temp', ...spec };
    this.large = large;
    this.view = { mode: 'all' }; // 'all' | { mode: 'last', span } | { mode: 'range', t0, t1 }
    this.hover = null;
    this.engine = null;
    this.cssH = parseFloat(canvas.getAttribute('height')) || 100;
    if (!large) {
      canvas.style.width = '100%';
      canvas.style.height = `${this.cssH}px`;
    }
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.render(this.engine);
    });
    canvas.addEventListener('mouseleave', () => {
      this.hover = null;
      this.render(this.engine);
    });
  }

  setSpec(spec) {
    this.spec = { ...this.spec, ...spec };
    this.render(this.engine);
  }

  title() {
    const t = this.spec.target;
    const who = t === 'global' ? 'System' : t === 'sensors' ? 'Sensors' : (t?.label || 'Sensor');
    return `${metricTitle(this.spec.metric)} · ${who}`;
  }

  _size() {
    const c = this.canvas;
    const w = c.clientWidth || parseFloat(c.getAttribute('width')) || 300;
    const h = this.large ? (c.clientHeight || 400) : this.cssH;
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (c.width !== pw || c.height !== ph) {
      c.width = pw;
      c.height = ph;
    }
    return { w, h, dpr };
  }

  render(engine) {
    if (!engine) return;
    this.engine = engine;
    if (this.canvas.isConnected && this.canvas.clientWidth === 0) return; // collapsed / hidden
    const { w, h, dpr } = this._size();
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = THEME.surface;
    ctx.fillRect(0, 0, w, h);
    const kind = metricKind(this.spec.metric);
    if (kind === 'time') this._renderTime(ctx, w, h, engine);
    else if (kind === 'xy') this._renderXY(ctx, w, h, engine);
    else this._renderHist(ctx, w, h, engine);
  }

  // -------------------------------------------------------------------------
  // Shared drawing helpers
  // -------------------------------------------------------------------------
  _layout(w, h, legend) {
    const L = this.large ? 64 : 42;
    const top = (legend ? (this.large ? 26 : 16) : 0) + (this.large ? 12 : 7);
    const bottom = this.large ? 40 : 17;
    return { x0: L, x1: w - (this.large ? 20 : 8), y0: top, y1: h - bottom };
  }

  _message(ctx, w, h, text) {
    ctx.fillStyle = THEME.textDim;
    ctx.font = `${this.large ? 13 : 10}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  }

  _axes(ctx, plot, xr, yr, xKey, yKey, xFmt) {
    const fs = this.large ? 11 : 9;
    ctx.font = `${fs}px ${FONT}`;
    ctx.lineWidth = 1;
    const yTicks = niceTicks(yr[0], yr[1], this.large ? 6 : 3);
    const sy = (v) => plot.y1 - (v - yr[0]) / (yr[1] - yr[0]) * (plot.y1 - plot.y0);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yTicks.forEach((v, i) => {
      const y = Math.round(sy(v)) + 0.5;
      ctx.strokeStyle = THEME.grid;
      ctx.beginPath(); ctx.moveTo(plot.x0, y); ctx.lineTo(plot.x1, y); ctx.stroke();
      ctx.fillStyle = THEME.text;
      const unit = !this.large && i === yTicks.length - 1 ? AXIS[yKey]?.unit : '';
      ctx.fillText(formatValue(v, unit), plot.x0 - 5, y);
    });
    const xTicks = niceTicks(xr[0], xr[1], this.large ? 8 : 4);
    const sx = (v) => plot.x0 + (v - xr[0]) / (xr[1] - xr[0]) * (plot.x1 - plot.x0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    xTicks.forEach(v => {
      const x = sx(v);
      if (x < plot.x0 - 1 || x > plot.x1 + 1) return;
      if (this.large) {
        ctx.strokeStyle = THEME.grid;
        ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, plot.y0); ctx.lineTo(Math.round(x) + 0.5, plot.y1); ctx.stroke();
      }
      ctx.fillStyle = THEME.text;
      ctx.fillText(xFmt(v), x, plot.y1 + 4);
    });
    ctx.strokeStyle = THEME.axis;
    ctx.beginPath(); ctx.moveTo(plot.x0, plot.y1 + 0.5); ctx.lineTo(plot.x1, plot.y1 + 0.5); ctx.stroke();
    if (this.large) {
      ctx.fillStyle = THEME.textDim;
      ctx.font = `11px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(axisTitle(xKey), (plot.x0 + plot.x1) / 2, plot.y1 + 22);
      ctx.save();
      ctx.translate(14, (plot.y0 + plot.y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText(axisTitle(yKey), 0, 0);
      ctx.restore();
    }
    return { sx, sy };
  }

  _legend(ctx, series, plot) {
    if (series.length < 2) return;
    ctx.font = `${this.large ? 12 : 9.5}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let x = plot.x0;
    const y = this.large ? 12 : 7;
    for (const s of series) {
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y - 1.5, 12, 3);
      ctx.fillStyle = THEME.text;
      ctx.fillText(s.name, x + 16, y);
      x += 16 + ctx.measureText(s.name).width + 14;
    }
  }

  _dot(ctx, x, y, color, r) {
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = THEME.surface;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  _tooltip(ctx, w, h, x, y, lines) {
    const fs = this.large ? 12 : 10;
    ctx.font = `${fs}px ${FONT}`;
    const lh = fs + 5;
    const width = Math.max(...lines.map(l => ctx.measureText(l.text).width + (l.color ? 14 : 0))) + 16;
    const height = lines.length * lh + 10;
    let bx = x + 12, by = Math.max(4, Math.min(h - height - 4, y - height / 2));
    if (bx + width > w - 4) bx = x - width - 12;
    ctx.fillStyle = THEME.tooltip;
    ctx.strokeStyle = THEME.axis;
    ctx.beginPath();
    ctx.roundRect(bx, by, width, height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    lines.forEach((l, i) => {
      const ly = by + 5 + lh * (i + 0.5);
      let tx = bx + 8;
      if (l.color) {
        ctx.fillStyle = l.color;
        ctx.fillRect(tx, ly - 4, 8, 8);
        tx += 14;
      }
      ctx.fillStyle = i === 0 ? THEME.textDim : THEME.textMain;
      ctx.fillText(l.text, tx, ly);
    });
  }

  // Visible time window [t0, t1] for the current view.
  _timeWindow(tMin, tMax) {
    let t0 = tMin, t1 = tMax;
    if (this.view.mode === 'last') t0 = Math.max(tMin, tMax - this.view.span);
    else if (this.view.mode === 'range') { t0 = this.view.t0; t1 = this.view.t1; }
    if (t1 - t0 < 1) t1 = t0 + 1;
    return [t0, t1];
  }

  _dataExtent(series) {
    let tMin = Infinity, tMax = -Infinity;
    for (const s of series) {
      if (s.t.length === 0) continue;
      tMin = Math.min(tMin, s.t[0]);
      tMax = Math.max(tMax, s.t[s.t.length - 1]);
    }
    return Number.isFinite(tMin) ? [tMin, tMax] : null;
  }

  // -------------------------------------------------------------------------
  // Time series
  // -------------------------------------------------------------------------
  _renderTime(ctx, w, h, engine) {
    const metric = TIME_METRICS[this.spec.metric];
    const series = timeSeries(engine, this.spec.target, this.spec.metric).filter(s => s.t.length > 0);
    const extent = this._dataExtent(series);
    if (!extent || series.every(s => s.t.length < 2)) return this._message(ctx, w, h, 'Start the simulation to record data');
    const [t0, t1] = this._timeWindow(extent[0], extent[1]);

    let yMin = Infinity, yMax = -Infinity;
    const ranges = series.map(s => {
      const a = Math.max(0, lowerBound(s.t, t0) - 1), b = Math.min(s.t.length, lowerBound(s.t, t1) + 1);
      for (let i = a; i < b; i++) { if (s.y[i] < yMin) yMin = s.y[i]; if (s.y[i] > yMax) yMax = s.y[i]; }
      return [a, b];
    });
    const plot = this._layout(w, h, series.length > 1);
    this.lastWindow = [t0, t1];
    this.lastPlot = plot;
    const yr = paddedRange(yMin, yMax);
    const { sx, sy } = this._axes(ctx, plot, [t0, t1], yr, 'time', this.spec.metric, v => `${formatValue(v)} s`);
    this._legend(ctx, series, plot);

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x0, plot.y0 - 2, plot.x1 - plot.x0, plot.y1 - plot.y0 + 4);
    ctx.clip();
    ctx.lineWidth = this.large ? 2 : 1.6;
    ctx.lineJoin = 'round';
    series.forEach((s, k) => {
      const [a, b] = ranges[k];
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      // Min/max per pixel column keeps peaks when there are more points than pixels.
      let col = null, cMin = 0, cMax = 0, started = false;
      const flush = () => {
        if (col === null) return;
        if (!started) { ctx.moveTo(col, sy(cMin)); started = true; }
        ctx.lineTo(col, sy(cMin));
        if (cMax !== cMin) ctx.lineTo(col, sy(cMax));
      };
      for (let i = a; i < b; i++) {
        const x = Math.round(sx(s.t[i]));
        if (x !== col) { flush(); col = x; cMin = cMax = s.y[i]; }
        else { cMin = Math.min(cMin, s.y[i]); cMax = Math.max(cMax, s.y[i]); }
      }
      flush();
      ctx.stroke();
    });
    ctx.restore();

    // Current value marker at the end of each series (when it's in view)
    series.forEach(s => {
      const i = s.t.length - 1;
      if (s.t[i] >= t0 && s.t[i] <= t1) this._dot(ctx, sx(s.t[i]), sy(s.y[i]), s.color, this.large ? 3.5 : 2.5);
    });

    if (this.hover && this.hover.x >= plot.x0 && this.hover.x <= plot.x1) {
      const t = t0 + (this.hover.x - plot.x0) / (plot.x1 - plot.x0) * (t1 - t0);
      ctx.strokeStyle = THEME.textDim;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(this.hover.x) + 0.5, plot.y0); ctx.lineTo(Math.round(this.hover.x) + 0.5, plot.y1); ctx.stroke();
      const lines = [{ text: `t = ${t.toFixed(2)} s` }];
      series.forEach(s => {
        let i = Math.min(s.t.length - 1, lowerBound(s.t, t));
        if (i > 0 && Math.abs(s.t[i - 1] - t) < Math.abs(s.t[i] - t)) i--;
        this._dot(ctx, sx(s.t[i]), sy(s.y[i]), s.color, this.large ? 3.5 : 2.5);
        lines.push({ color: s.color, text: `${series.length > 1 ? s.name + ': ' : ''}${formatValue(s.y[i], metric.unit)}` });
      });
      this._tooltip(ctx, w, h, this.hover.x, this.hover.y, lines);
    }
  }

  // -------------------------------------------------------------------------
  // State diagrams
  // -------------------------------------------------------------------------
  _renderXY(ctx, w, h, engine) {
    const def = XY_METRICS[this.spec.metric];
    const series = xySeries(engine, this.spec.target, this.spec.metric).filter(s => s.x.length > 1);
    if (series.length === 0) {
      return this._message(ctx, w, h, def.x === 'volume' && engine.sensors.length === 0
        ? 'Place a sensor zone to plot its P-V loop' : 'Start the simulation to record data');
    }
    const extent = this._dataExtent(series);
    const [t0, t1] = this._timeWindow(extent[0], extent[1]);
    const vis = series.map(s => [Math.max(0, lowerBound(s.t, t0)), Math.min(s.t.length, lowerBound(s.t, t1) + 1)]);
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    series.forEach((s, k) => {
      for (let i = vis[k][0]; i < vis[k][1]; i++) {
        xMin = Math.min(xMin, s.x[i]); xMax = Math.max(xMax, s.x[i]);
        yMin = Math.min(yMin, s.y[i]); yMax = Math.max(yMax, s.y[i]);
      }
    });
    const plot = this._layout(w, h, series.length > 1);
    this.lastWindow = [t0, t1];
    this.lastPlot = plot;
    const xr = paddedRange(xMin, xMax), yr = paddedRange(yMin, yMax);
    const { sx, sy } = this._axes(ctx, plot, xr, yr, def.x, def.y, v => formatValue(v));
    this._legend(ctx, series, plot);

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x0, plot.y0, plot.x1 - plot.x0, plot.y1 - plot.y0);
    ctx.clip();
    ctx.lineJoin = 'round';
    series.forEach((s, k) => {
      const [a, b] = vis[k];
      const current = s.cycle[b - 1] || 0;
      // Earlier cycles faded, the running cycle bright
      for (const pass of ['old', 'current']) {
        ctx.globalAlpha = pass === 'old' ? 0.28 : 1;
        ctx.lineWidth = pass === 'old' ? 1.2 : (this.large ? 2 : 1.6);
        ctx.strokeStyle = s.color;
        ctx.beginPath();
        let pen = false;
        for (let i = a; i < b; i++) {
          const isCurrent = (s.cycle[i] || 0) === current;
          if ((pass === 'current') !== isCurrent) { pen = false; continue; }
          const x = sx(s.x[i]), y = sy(s.y[i]);
          if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    ctx.restore();
    series.forEach((s, k) => {
      const i = vis[k][1] - 1;
      this._dot(ctx, sx(s.x[i]), sy(s.y[i]), s.color, this.large ? 4 : 3);
    });

    if (this.spec.metric === 'pv') this._workLabel(ctx, plot, series, vis);

    if (this.hover && this.hover.x >= plot.x0 && this.hover.x <= plot.x1 && this.hover.y >= plot.y0 && this.hover.y <= plot.y1) {
      let best = null;
      series.forEach((s, k) => {
        for (let i = vis[k][0]; i < vis[k][1]; i++) {
          const d = Math.hypot(sx(s.x[i]) - this.hover.x, sy(s.y[i]) - this.hover.y);
          if (!best || d < best.d) best = { d, s, i };
        }
      });
      if (best && best.d < 40) {
        const { s, i } = best;
        this._dot(ctx, sx(s.x[i]), sy(s.y[i]), s.color, this.large ? 4 : 3);
        this._tooltip(ctx, w, h, sx(s.x[i]), sy(s.y[i]), [
          { text: `t = ${s.t[i].toFixed(2)} s${s.cycle[i] ? ` · cycle ${s.cycle[i]}` : ''}` },
          { color: s.color, text: `${AXIS[def.x].symbol} = ${formatValue(s.x[i], AXIS[def.x].unit)}` },
          { color: s.color, text: `${AXIS[def.y].symbol} = ${formatValue(s.y[i], AXIS[def.y].unit)}` }
        ]);
      }
    }
  }

  // Work done by the gas per sequencer cycle (W = ∮P dV); without cycles the path integral.
  _workLabel(ctx, plot, series, vis) {
    const lines = [];
    series.forEach((s, k) => {
      const part = { t: s.t.slice(vis[k][0], vis[k][1]), x: s.x.slice(vis[k][0], vis[k][1]), y: s.y.slice(vis[k][0], vis[k][1]), cycle: s.cycle.slice(vis[k][0], vis[k][1]) };
      const cycles = cycleWork(part);
      const prefix = series.length > 1 ? `${s.name}: ` : '';
      const hasCycles = cycles.some(c => c.cycle > 0);
      if (!hasCycles) {
        const total = cycles.reduce((sum, c) => sum + c.work, 0);
        lines.push(`${prefix}W = ${formatValue(total, 'J')}`);
        return;
      }
      const done = cycles.filter(c => c.complete);
      const shown = this.large ? done.slice(-5) : done.slice(-1);
      shown.forEach(c => lines.push(`${prefix}W(cycle ${c.cycle}) = ${formatValue(c.work, 'J')}`));
      if (shown.length === 0) lines.push(`${prefix}cycle ${cycles[cycles.length - 1].cycle} running`);
    });
    if (this.large) lines.push('W > 0: work done by the gas');
    const fs = this.large ? 11.5 : 9;
    ctx.font = `${fs}px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => {
      ctx.fillStyle = i === lines.length - 1 && this.large ? THEME.textDim : THEME.textMain;
      ctx.fillText(l, plot.x1 - 4, plot.y0 + 3 + i * (fs + 4));
    });
  }

  // -------------------------------------------------------------------------
  // Velocity histogram
  // -------------------------------------------------------------------------
  _histBins(engine) {
    const speeds = speedSamples(engine, this.spec.target);
    if (!speeds.length) return null;
    const vMax = Math.max(400, ...speeds);
    const width = niceStep(vMax, this.large ? 24 : 12);
    const counts = new Array(Math.ceil(vMax / width) + 1).fill(0);
    speeds.forEach(v => { counts[Math.min(counts.length - 1, Math.floor(v / width))]++; });
    return { width, counts, total: speeds.length };
  }

  _renderHist(ctx, w, h, engine) {
    const bins = this._histBins(engine);
    if (!bins) return this._message(ctx, w, h, 'No particles');
    const plot = this._layout(w, h, false);
    const xMax = bins.counts.length * bins.width;
    const yMax = Math.max(...bins.counts);
    const { sx, sy } = this._axes(ctx, plot, [0, xMax], [0, yMax * 1.08 || 1], 'speed', 'count', v => formatValue(v));
    const barW = sx(bins.width) - sx(0);
    let hovered = -1;
    if (this.hover && this.hover.x >= plot.x0 && this.hover.x <= plot.x1) hovered = Math.floor((this.hover.x - plot.x0) / barW);
    bins.counts.forEach((c, i) => {
      if (c === 0) return;
      const x = sx(i * bins.width) + 1, y = sy(c);
      ctx.fillStyle = CHART_PALETTE[0];
      ctx.globalAlpha = hovered === -1 || hovered === i ? 1 : 0.55;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1, barW - 2), plot.y1 - y, [Math.min(4, barW / 3), Math.min(4, barW / 3), 0, 0]);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (hovered >= 0 && hovered < bins.counts.length) {
      const lo = hovered * bins.width;
      this._tooltip(ctx, w, h, this.hover.x, this.hover.y, [
        { text: `${formatValue(lo)}–${formatValue(lo + bins.width)} px/s` },
        { color: CHART_PALETTE[0], text: `${bins.counts[hovered]} of ${bins.total} particles` }
      ]);
    }
  }

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------
  toCSV(engine = this.engine) {
    const kind = metricKind(this.spec.metric);
    if (kind === 'hist') {
      const bins = this._histBins(engine);
      return ['speed_from_px_s,speed_to_px_s,count', ...(bins ? bins.counts.map((c, i) => `${i * bins.width},${(i + 1) * bins.width},${c}`) : [])].join('\n');
    }
    if (kind === 'xy') {
      const def = XY_METRICS[this.spec.metric];
      const rows = [`series,time_s,${def.x},${def.y},cycle`];
      xySeries(engine, this.spec.target, this.spec.metric).forEach(s => {
        for (let i = 0; i < s.x.length; i++) rows.push(`"${s.name}",${s.t[i]},${s.x[i]},${s.y[i]},${s.cycle[i] || 0}`);
      });
      return rows.join('\n');
    }
    const rows = [`series,time_s,${this.spec.metric},cycle`];
    timeSeries(engine, this.spec.target, this.spec.metric).forEach(s => {
      for (let i = 0; i < s.t.length; i++) rows.push(`"${s.name}",${s.t[i]},${s.y[i]},${s.cycle[i] || 0}`);
    });
    return rows.join('\n');
  }
}


// --- src/analytics/DashboardChart.js ---
// Custom dashboard chart (right sidebar): a ChartView for a target + metric.
// Kept as a class with (id, target, metric, canvas) / render(engine) because
// tests construct it via window.DashboardChart.

class DashboardChart {
  constructor(id, target, metric, canvas = null) {
    this.id = id;
    this.target = target;
    this.metric = metric;
    this.view = canvas ? new ChartView(canvas, { target, metric }) : null;
  }

  attach(canvas) {
    this.view = new ChartView(canvas, { target: this.target, metric: this.metric });
  }

  getTitle() {
    return this.view ? this.view.title() : new ChartView(document.createElement('canvas'), { target: this.target, metric: this.metric }).title();
  }

  render(engine) {
    this.view?.render(engine);
  }
}


// --- src/presets/index.js ---
const Presets = {
  // 1. Split-Stirling Cryocooler / Heat Engine
  splitStirling: {
    id: 'splitStirling',
    name: 'Split-Stirling Cryocooler',
    category: 'Thermodynamic Cycles',
    icon: 'stirling',
    description: 'Dual-piston compressor, split pipe, regenerator matrix, cold finger, and displacer piston.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer boundaries / Compressor housing (Left side)
      engine.addWall(60, 160, 280, 160, { thickness: 6 });
      engine.addWall(60, 480, 280, 480, { thickness: 6 });
      engine.addWall(60, 160, 60, 480, { thickness: 6 });

      // Split Pipe connecting compressor to regenerator
      engine.addWall(280, 160, 280, 290, { thickness: 6 });
      engine.addWall(280, 290, 560, 290, { thickness: 6 });
      engine.addWall(280, 350, 560, 350, { thickness: 6 });
      engine.addWall(280, 350, 280, 480, { thickness: 6 });

      // Ambient Heat Exchanger along split pipe (rejection at 300K)
      engine.addHeatExchanger(330, 275, 120, 90, {
        temperature: 300,
        conductivity: 0.8,
        label: 'Ambient Cooler (300K)'
      });

      // Cold Finger / Expander Cylinder (Right side)
      engine.addWall(560, 80, 700, 80, { thickness: 6 });
      engine.addWall(560, 80, 560, 290, { thickness: 6 });
      engine.addWall(700, 80, 700, 540, { thickness: 6 });
      engine.addWall(560, 350, 560, 540, { thickness: 6 });
      engine.addWall(560, 540, 700, 540, { thickness: 6 });

      // Regenerator Matrix in Cold Finger
      engine.addRegeneratorMatrix(570, 160, 120, 110, {
        orientation: 'vertical',
        temperature: 200,
        heatCapacity: 450,
        conductivity: 0.75,
        label: 'Regenerator Matrix'
      });

      // Compressor Piston (Motorized harmonic drive)
      engine.addPiston({
        label: 'Compressor Piston',
        orientation: 'horizontal',
        x: 160,
        y: 320,
        width: 24,
        height: 310,
        minPos: 80,
        maxPos: 250,
        mode: 'motorized',
        frequency: 0.8,
        amplitude: 50,
        phase: 0
      });

      // Displacer Piston in Bouncing Volume (Phase-shifted)
      engine.addPiston({
        label: 'Displacer Piston',
        orientation: 'vertical',
        x: 630,
        y: 420,
        width: 20,
        height: 130,
        minPos: 310,
        maxPos: 490,
        mode: 'motorized',
        frequency: 0.8,
        amplitude: 45,
        phase: 80 // ~80 degrees phase lead for Stirling expansion
      });

      // Sensor Chambers
      engine.addSensor({
        label: 'Compression Space',
        x: 180,
        y: 180,
        width: 90,
        height: 280,
        color: '#f97316'
      });
      engine.addSensor({
        label: 'Expansion Cold Head',
        x: 570,
        y: 90,
        width: 120,
        height: 65,
        color: '#38bdf8'
      });

      // Working Gas
      engine.spawnGasRaster(180, 200, 90, 240, 90, 1.0, 300, 'maxwell_boltzmann', 'Compressor Gas');
      engine.spawnGasRaster(570, 95, 120, 60, 45, 1.0, 220, 'maxwell_boltzmann', 'Cold Space Gas');
    }
  },

  // 2. Venturi Nozzle & Bernoulli Effect
  venturiTube: {
    id: 'venturiTube',
    name: 'Venturi Nozzle & Bernoulli Flow',
    category: 'Fluid & Aerodynamics',
    icon: 'venturi',
    description: 'Converging-diverging contraction channel demonstrating velocity increase and pressure drop.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Top contoured wall
      engine.addWall(40, 160, 260, 160, { thickness: 5 });
      engine.addWall(260, 160, 440, 260, { thickness: 5 });
      engine.addWall(440, 260, 560, 260, { thickness: 5 }); // Throat
      engine.addWall(560, 260, 740, 160, { thickness: 5 });
      engine.addWall(740, 160, 960, 160, { thickness: 5 });

      // Bottom contoured wall
      engine.addWall(40, 480, 260, 480, { thickness: 5 });
      engine.addWall(260, 480, 440, 380, { thickness: 5 });
      engine.addWall(440, 380, 560, 380, { thickness: 5 }); // Throat
      engine.addWall(560, 380, 740, 480, { thickness: 5 });
      engine.addWall(740, 480, 960, 480, { thickness: 5 });

      // Inlet continuous emitter (left)
      engine.addEmitter(50, 200, 40, 240, {
        direction: 'right',
        rate: 28,
        temperature: 300,
        mass: 1.0
      });

      // Outlet absorber (right)
      engine.addSink(910, 180, 40, 280, {
        direction: 'right',
        absorptionEfficiency: 1.0
      });

      // Sensors: Inlet, Throat, Diffuser
      engine.addSensor({
        label: 'Inlet (Wide, Low v)',
        x: 120,
        y: 180,
        width: 120,
        height: 280,
        color: '#38bdf8'
      });
      engine.addSensor({
        label: 'Throat (Constriction, High v, Low P)',
        x: 450,
        y: 270,
        width: 100,
        height: 100,
        color: '#f59e0b'
      });
      engine.addSensor({
        label: 'Diffuser (Recovery)',
        x: 760,
        y: 180,
        width: 140,
        height: 280,
        color: '#10b981'
      });

      // Pre-fill steady flow gas
      engine.spawnGasRaster(120, 200, 120, 240, 60, 1.0, 300, 'uniform_speed', 'Inlet Gas');
      engine.spawnGasRaster(450, 280, 100, 80, 35, 1.0, 270, 'uniform_speed', 'Throat Gas');
      engine.spawnGasRaster(760, 200, 130, 240, 60, 1.0, 300, 'uniform_speed', 'Exit Gas');
    }
  },

  // 3. Dual-Chamber Thermal Equalization
  dualChamber: {
    id: 'dualChamber',
    name: 'Dual-Chamber Thermal Equalization',
    category: 'Heat Transfer & 2nd Law',
    icon: 'chambers',
    description: 'High-temperature gas and cryogenic gas separated by a thermally conductive partition wall.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer insulated container (800x440)
      engine.addWall(80, 120, 880, 120, { thickness: 8, conductivity: 0 });
      engine.addWall(80, 560, 880, 560, { thickness: 8, conductivity: 0 });
      engine.addWall(80, 120, 80, 560, { thickness: 8, conductivity: 0 });
      engine.addWall(880, 120, 880, 560, { thickness: 8, conductivity: 0 });

      // Central conductive dividing wall (kappa = 0.85)
      engine.addWall(480, 120, 480, 560, {
        thickness: 8,
        conductivity: 0.85,
        label: 'Conductive Partition (κ = 0.85)'
      });

      // Sensors: Left (Hot), Right (Cold)
      engine.addSensor({
        label: 'Chamber Left (Hot)',
        x: 100,
        y: 140,
        width: 360,
        height: 400,
        color: '#ef4444'
      });
      engine.addSensor({
        label: 'Chamber Right (Cold)',
        x: 500,
        y: 140,
        width: 360,
        height: 400,
        color: '#3b82f6'
      });

      // Hot gas left (750K), Cold gas right (125K)
      engine.spawnGasRaster(120, 160, 320, 360, 120, 1.0, 750, 'maxwell_boltzmann', 'Hot Gas (750K)');
      engine.spawnGasRaster(520, 160, 320, 360, 120, 1.0, 125, 'maxwell_boltzmann', 'Cold Gas (125K)');
    }
  },

  // 4. Joule-Thomson Expansion & Throttle Valve
  jouleThomson: {
    id: 'jouleThomson',
    name: 'Joule-Thomson Throttle Expansion',
    category: 'Thermodynamic Expansion',
    icon: 'throttle',
    description: 'High-pressure gas forced through a narrow throttle valve aperture into an expansion chamber.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer enclosure
      engine.addWall(60, 150, 900, 150, { thickness: 6 });
      engine.addWall(60, 510, 900, 510, { thickness: 6 });
      engine.addWall(60, 150, 60, 510, { thickness: 6 });
      engine.addWall(900, 150, 900, 510, { thickness: 6 });

      // Partition Wall with central Throttle Valve
      engine.addWall(460, 150, 460, 260, { thickness: 6 });
      engine.addThrottleValve(460, 260, 460, 400, {
        openRatio: 0.25,
        thickness: 8,
        conductivity: 0.2
      });
      engine.addWall(460, 400, 460, 510, { thickness: 6 });

      // Continuous high-pressure supply on left
      engine.addEmitter(80, 230, 40, 200, {
        direction: 'right',
        rate: 22,
        temperature: 450,
        mass: 1.0
      });

      // Exhaust / Low-pressure sink on far right
      engine.addSink(840, 230, 40, 200, {
        direction: 'right',
        absorptionEfficiency: 0.95
      });

      // Upstream & Downstream Sensor Zones
      engine.addSensor({
        label: 'High-Pressure Upstream (P1, T1)',
        x: 140,
        y: 170,
        width: 300,
        height: 320,
        color: '#f97316'
      });
      engine.addSensor({
        label: 'Low-Pressure Downstream (P2, T2)',
        x: 480,
        y: 170,
        width: 340,
        height: 320,
        color: '#10b981'
      });

      // Pre-fill upstream chamber
      engine.spawnGasRaster(160, 190, 260, 280, 110, 1.0, 450, 'maxwell_boltzmann', 'Upstream Gas');
      engine.spawnGasRaster(500, 230, 300, 200, 40, 1.0, 250, 'maxwell_boltzmann', 'Downstream Gas');
    }
  },

  // 5. Adiabatic & Isothermal Compression
  compressionCylinder: {
    id: 'compressionCylinder',
    name: 'Adiabatic Cylinder Compression',
    category: 'Work & Compression',
    icon: 'piston',
    description: 'Cylinder enclosed with a moving heavy piston demonstrating work extraction and PV compression heating.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Rigid Cylinder Chamber
      engine.addWall(80, 140, 840, 140, { thickness: 6, conductivity: 0 });
      engine.addWall(80, 500, 840, 500, { thickness: 6, conductivity: 0 });
      engine.addWall(80, 140, 80, 500, { thickness: 6, conductivity: 0 });

      // Compressor Piston (Motorized sweep)
      engine.addPiston({
        label: 'Compression Piston',
        orientation: 'horizontal',
        x: 600,
        y: 320,
        width: 28,
        height: 350,
        minPos: 200,
        maxPos: 760,
        mode: 'motorized',
        frequency: 0.5,
        amplitude: 220,
        phase: 0,
        mass: 50,
        conductivity: 0
      });

      // Cylinder Sensor
      engine.addSensor({
        label: 'Cylinder Chamber',
        x: 100,
        y: 160,
        width: 480,
        height: 320,
        color: '#f59e0b'
      });

      // Enclosed Gas
      engine.spawnGasRaster(120, 180, 440, 280, 160, 1.0, 280, 'maxwell_boltzmann', 'Cylinder Gas');
    }
  },

  // 6. Brownian Motion & Colloidal Diffusion
  brownianMotion: {
    id: 'brownianMotion',
    name: 'Brownian Motion & Colloidal Diffusion',
    category: 'Statistical Mechanics',
    icon: 'brownian',
    description: 'Massive colloidal particles suspended in an ideal thermal bath undergoing random walk collisions.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Closed Container Box
      engine.addWall(80, 80, 880, 80, { thickness: 6 });
      engine.addWall(80, 580, 880, 580, { thickness: 6 });
      engine.addWall(80, 80, 80, 580, { thickness: 6 });
      engine.addWall(880, 80, 880, 580, { thickness: 6 });

      // Measurement Zone
      engine.addSensor({
        label: 'Diffusion Bath',
        x: 90,
        y: 90,
        width: 780,
        height: 480,
        color: '#a855f7'
      });

      // Background Light Gas (m = 0.5, fast)
      engine.spawnGasRaster(100, 100, 760, 460, 240, 0.5, 350, 'maxwell_boltzmann', 'Thermal Gas Bath');

      // Add 4 Heavy Colloidal Particles (m = 15.0 to 25.0)
      const c1 = engine.addParticle(260, 300, 0, 0, 18.0);
      c1.tag = 'colloid';
      const c2 = engine.addParticle(480, 240, 0, 0, 22.0);
      c2.tag = 'colloid';
      const c3 = engine.addParticle(520, 420, 0, 0, 20.0);
      c3.tag = 'colloid';
      const c4 = engine.addParticle(700, 340, 0, 0, 25.0);
      c4.tag = 'colloid';
    }
  }
};

if (typeof window !== 'undefined') {
  window.Presets = Presets;
}


// --- src/control/SequencerDock.js ---
/**
 * SequencerDock.js
 * Unified Bottom Dock Controller & Expansion Shell for Cycle Sequencer.
 */

class SequencerDock {
  constructor(engine, callbacks = {}) {
    this.engine = engine;
    this.callbacks = callbacks; // { onToggle, onAddStep, onReset, onRenderRequest }
    this.isOpen = false;

    // DOM Elements
    this.drawerEl = document.getElementById('cycleSequencerDrawer');
    this.btnToggleSequencer = document.getElementById('btnToggleSequencer');
    this.chevronBtn = document.getElementById('seqDrawerChevron');
    this.headerEl = document.getElementById('seqDrawerHeader');
    this.btnActive = document.getElementById('seqBtnActive');
    this.btnLoop = document.getElementById('seqBtnLoop');
    this.cycleBadge = document.getElementById('seqCycleBadge');
    this.btnAddStep = document.getElementById('seqBtnAddStep');
    this.btnReset = document.getElementById('seqBtnReset');

    this._bindEvents();
    this.updateBadges();
  }

  _bindEvents() {
    // 1. Bottom Dock Toggle Button [⏱ Sequencer]
    this.btnToggleSequencer?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer();
    });

    // 2. Chevron Button in Drawer Header
    this.chevronBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer();
    });

    // 3. Header strip click (unless clicking a control)
    this.headerEl?.addEventListener('click', (e) => {
      if (e.target.closest('input, select, button, label, .seq-cycle-badge')) return;
      this.toggleDrawer();
    });

    // 4. Active Button Toggle
    this.btnActive?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sequencer = this.engine.sequencer;
      if (sequencer) {
        sequencer.isEnabled = !sequencer.isEnabled;
      }
      this.updateBadges();
      if (typeof this.callbacks.onRenderRequest === 'function') {
        this.callbacks.onRenderRequest();
      }
    });

    // 5. Loop Button Toggle
    this.btnLoop?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sequencer = this.engine.sequencer;
      if (sequencer) {
        sequencer.isLooping = !sequencer.isLooping;
      }
      this.updateBadges();
      if (typeof this.callbacks.onRenderRequest === 'function') {
        this.callbacks.onRenderRequest();
      }
    });

    // 6. Reset Button
    this.btnReset?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sequencer = this.engine.sequencer;
      if (sequencer) {
        sequencer.reset();
      }
      this.updateBadges();
      if (typeof this.callbacks.onReset === 'function') {
        this.callbacks.onReset();
      }
    });

    // 7. Add Step Button
    this.btnAddStep?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof this.callbacks.onAddStep === 'function') {
        this.callbacks.onAddStep();
      }
      if (!this.isOpen) this.openDrawer();
    });
  }

  toggleDrawer() {
    if (this.isOpen) this.closeDrawer();
    else this.openDrawer();
  }

  openDrawer() {
    this.isOpen = true;
    if (this.drawerEl) {
      this.drawerEl.classList.remove('is-collapsed');
    }
    document.body.classList.add('sequencer-expanded');
    if (this.btnToggleSequencer) {
      this.btnToggleSequencer.classList.add('active');
    }
    if (this.chevronBtn) {
      this.chevronBtn.classList.add('is-expanded');
    }
    if (typeof this.callbacks.onToggle === 'function') {
      this.callbacks.onToggle(true);
    }
  }

  closeDrawer() {
    this.isOpen = false;
    if (this.drawerEl) {
      this.drawerEl.classList.add('is-collapsed');
    }
    document.body.classList.remove('sequencer-expanded');
    if (this.btnToggleSequencer) {
      this.btnToggleSequencer.classList.remove('active');
    }
    if (this.chevronBtn) {
      this.chevronBtn.classList.remove('is-expanded');
    }
    if (typeof this.callbacks.onToggle === 'function') {
      this.callbacks.onToggle(false);
    }
  }

  updateBadges() {
    const sequencer = this.engine.sequencer;
    if (!sequencer) return;

    const steps = sequencer.steps || [];
    const total = steps.length;

    // Update active toggle in bottom bar
    const dot = this.btnToggleSequencer?.querySelector('.seq-status-dot');
    if (dot) {
      dot.classList.toggle('active', sequencer.isEnabled);
    }

    if (this.btnActive) this.btnActive.classList.toggle('active', !!sequencer.isEnabled);
    if (this.btnLoop) this.btnLoop.classList.toggle('active', !!sequencer.isLooping);

    if (!this.cycleBadge) return;

    if (!sequencer.isEnabled) {
      this.cycleBadge.innerHTML = total === 0
        ? `<span class="seq-badge-status seq-status-idle">Idle (No Steps)</span>`
        : `<span class="seq-badge-status seq-status-paused">Paused (${total} Steps)</span>`;
    } else {
      const cur = sequencer.activeStepIndex + 1;
      this.cycleBadge.innerHTML = `
        <span class="seq-badge-status seq-status-active">RUNNING</span>
        <span class="seq-badge-meta">Cycle #${sequencer.currentCycleCount} • Step ${cur}/${total}</span>
      `;
    }
  }
}


// --- src/app/propertyForm.js ---
// Renders the property fields of an element type from the schema. Used by the
// tool dialog, the properties panel and the sequencer action dialog, so all
// three show the same labels, ranges, units and default markers.

const DIRECTIONS = [
  { value: 'right', label: '→', title: 'Right' },
  { value: 'left', label: '←', title: 'Left' },
  { value: 'down', label: '↓', title: 'Down' },
  { value: 'up', label: '↑', title: 'Up' },
  { value: '360', label: '360°', title: 'All directions' }
];

let formCounter = 0;

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const sameValue = (a, b) => (typeof a === 'number' && typeof b === 'number') ? Math.abs(a - b) < 1e-6 : String(a) === String(b);
const display = (f, v) => {
  const d = (Number(v) || 0) * (f.scale || 1);
  return Math.round(d * 1000) / 1000;
};

function isVisible(f, values) {
  return !f.visible || f.visible(values);
}

function rowHtml(f, value, id) {
  const modified = f.def !== undefined && !sameValue(value, f.def) && f.kind !== 'text';
  const reset = f.def !== undefined && f.kind !== 'text'
    ? `<button type="button" class="prop-reset" data-reset="${f.key}" title="Reset to default (${escapeHtml(f.kind === 'number' ? display(f, f.def) + (f.unit ? ' ' + f.unit : '') : f.def)})">↺</button>`
    : '';
  const head = `<div class="prop-label"><span>${f.label}</span>${reset}</div>`;
  let control = '';

  if (f.kind === 'number') {
    const dv = display(f, value);
    const notch = f.def !== undefined ? Math.max(0, Math.min(100, ((display(f, f.def) - f.min) / (f.max - f.min)) * 100)) : null;
    control = `
      <div class="prop-dual">
        <div class="prop-slider-wrap">
          <input type="range" class="prop-slider" id="${id}_s" min="${f.min}" max="${f.max}" step="${f.step}" value="${dv}">
          ${notch !== null ? `<span class="prop-notch" style="left:${notch}%"></span>` : ''}
        </div>
        <input type="number" class="prop-num" id="${id}_n" min="${f.min}" max="${f.max}" step="${f.step}" value="${dv}">
        <span class="prop-unit">${f.unit || ''}</span>
      </div>`;
  } else if (f.kind === 'toggle' || f.kind === 'direction') {
    const opts = f.kind === 'direction' ? DIRECTIONS : f.options;
    control = `<div class="prop-segmented">${opts.map((o, i) => `
      <button type="button" class="prop-seg ${sameValue(o.value, value) ? 'active' : ''}" data-opt="${i}" ${o.title ? `title="${o.title}"` : ''}>${o.label}</button>`).join('')}</div>`;
  } else if (f.kind === 'bool') {
    control = `<button type="button" class="prop-switch ${value ? 'on' : ''}" id="${id}_b"><span class="prop-switch-knob"></span><span class="prop-switch-text">${value ? 'On' : 'Off'}</span></button>`;
  } else if (f.kind === 'select') {
    control = `<select class="prop-select" id="${id}_sel">${f.options.map((o, i) => `<option value="${i}" ${sameValue(o.value, value) ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
  } else if (f.kind === 'text') {
    control = `<input type="text" class="prop-text" id="${id}_t" value="${escapeHtml(value ?? '')}">`;
  } else if (f.kind === 'color') {
    control = `<input type="color" class="prop-color" id="${id}_c" value="${value || f.def}">`;
  }

  const inline = f.kind === 'bool' || f.kind === 'color';
  return `<div class="prop-row ${inline ? 'prop-row-inline' : ''} ${modified ? 'is-modified' : ''}" data-key="${f.key}">${head}${control}</div>`;
}

/**
 * Renders the fields of `type` for `context` ('tool' | 'inspector' | 'sequencer')
 * into `container`. `values` is updated in place; `onChange(key, value)` fires on
 * every edit, `onBeginEdit()` once before each user interaction (for undo).
 */
function renderPropertyForm(container, type, values, { context, onChange, onBeginEdit } = {}) {
  if (!container) return;
  const fields = fieldsFor(type, context);
  const prefix = `pf${++formCounter}`;
  const visibleKeys = () => fields.filter(f => isVisible(f, values)).map(f => f.key).join();
  const rerender = () => renderPropertyForm(container, type, values, { context, onChange, onBeginEdit });

  container.innerHTML = fields.filter(f => isVisible(f, values))
    .map((f, i) => rowHtml(f, values[f.key], `${prefix}_${i}`)).join('') ||
    '<p class="prop-empty">No adjustable properties.</p>';

  const begin = () => { if (onBeginEdit) onBeginEdit(); };
  const commit = (f, v, row) => {
    values[f.key] = v;
    if (row) row.classList.toggle('is-modified', f.def !== undefined && f.kind !== 'text' && !sameValue(v, f.def));
    if (onChange) onChange(f.key, v);
  };

  container.querySelectorAll('.prop-row').forEach(row => {
    const f = fields.find(x => x.key === row.dataset.key);
    if (!f) return;

    row.querySelector('.prop-reset')?.addEventListener('click', () => {
      begin();
      commit(f, f.def, row);
      rerender();
    });

    if (f.kind === 'number') {
      const slider = row.querySelector('.prop-slider');
      const numIn = row.querySelector('.prop-num');
      const before = { keys: '' };
      const apply = (raw) => {
        let v = parseFloat(raw);
        if (!Number.isFinite(v)) return;
        v /= (f.scale || 1);
        if (f.int) v = Math.round(v);
        commit(f, v, row);
      };
      const startEdit = () => { before.keys = visibleKeys(); begin(); };
      slider.addEventListener('pointerdown', startEdit);
      numIn.addEventListener('focus', startEdit);
      slider.addEventListener('input', () => { numIn.value = slider.value; apply(slider.value); });
      numIn.addEventListener('input', () => { slider.value = numIn.value; apply(numIn.value); });
      // Fields shown/hidden by this value (e.g. wall temperature when κ > 0) update after the edit.
      const settle = () => { if (visibleKeys() !== before.keys) rerender(); };
      slider.addEventListener('change', settle);
      numIn.addEventListener('change', settle);
    } else if (f.kind === 'toggle' || f.kind === 'direction') {
      const opts = f.kind === 'direction' ? DIRECTIONS : f.options;
      row.querySelectorAll('.prop-seg').forEach(btn => btn.addEventListener('click', () => {
        begin();
        commit(f, opts[parseInt(btn.dataset.opt, 10)].value, row);
        rerender();
      }));
    } else if (f.kind === 'bool') {
      row.querySelector('.prop-switch').addEventListener('click', () => {
        begin();
        commit(f, !values[f.key], row);
        rerender();
      });
    } else if (f.kind === 'select') {
      const sel = row.querySelector('.prop-select');
      sel.addEventListener('focus', begin);
      sel.addEventListener('change', () => {
        commit(f, f.options[parseInt(sel.value, 10)].value, row);
        rerender();
      });
    } else if (f.kind === 'text') {
      const input = row.querySelector('.prop-text');
      input.addEventListener('focus', begin);
      input.addEventListener('input', () => commit(f, input.value, row));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    } else if (f.kind === 'color') {
      const input = row.querySelector('.prop-color');
      input.addEventListener('click', begin);
      input.addEventListener('input', () => commit(f, input.value, row));
    }
  });
}

function typeLabel(type) {
  return ELEMENT_TYPES[type]?.label || 'Element';
}


// --- src/control/SequencerActionFields.js ---
/**
 * SequencerActionFields.js
 * Action form for the sequencer: renders the element's sequencer fields from
 * the element schema (same controls as the tool dialog and properties panel)
 * and builds the action snapshot from the edited values.
 */

class SequencerActionFields {
  static getElementType(item) {
    return actionTypeOf(item) || 'unknown';
  }

  // `existingAction` may be an action or a plain set of values (e.g. defaults).
  static renderFields(container, item, existingAction = {}, onChange = null) {
    const type = actionTypeOf(item);
    if (!container || !type) return;
    const values = actionValues(item, existingAction && Object.keys(existingAction).length ? { type, ...existingAction } : null);
    container._seqValues = values;
    renderPropertyForm(container, type, values, {
      context: 'sequencer',
      onChange: () => { if (onChange) onChange(makeAction(item, values, existingAction)); }
    });
  }

  static extractSnapshot(container, item, existingAction = {}) {
    return makeAction(item, { ...(container._seqValues || actionValues(item)) }, existingAction);
  }
}


// --- src/control/SequencerSummary.js ---

class SequencerSummary {
  static getActionSummary(act, item = null) {
    return summarizeAction(act, item);
  }

  static formatConditionSummary(cond) {
    if (!cond) return 'Immediate';
    const type = cond.type || 'duration';
    if (type === 'duration') {
      return `⏱ ${(cond.duration !== undefined ? cond.duration : 1.5).toFixed(1)}s`;
    }
    if (type === 'piston' || type === 'piston_target') {
      const tgt = (cond.pistonTarget || 'tdc').toUpperCase();
      return `🎯 ${tgt}`;
    }
    if (type === 'sensor') {
      const metric = cond.sensorMetric === 'temperature' ? 'T' : 'P';
      const unit = cond.sensorMetric === 'temperature' ? 'K' : 'Pa';
      return `📡 ${metric}${cond.sensorOperator || '>='}${cond.sensorThreshold || 200}${unit}`;
    }
    return 'Immediate';
  }

  static getTransitionSummary(trans) {
    if (!trans) return 'Immediate';
    const norm = SequencerConditions.normalizeTransition(trans);
    if (!norm.rows || norm.rows.length === 0) return 'Immediate';

    const rowSummaries = norm.rows.map(row => {
      if (!row.conditions || row.conditions.length === 0) return 'Immediate';
      const parts = [];
      row.conditions.forEach((c, idx) => {
        parts.push(this.formatConditionSummary(c));
        if (idx < row.conditions.length - 1) {
          const op = (row.operators[idx] || 'AND').toUpperCase();
          parts.push(op === 'OR' || op === '||' ? '||' : '&');
        }
      });
      const rowStr = parts.join(' ');
      return norm.rows.length > 1 || row.conditions.length > 1 ? `(${rowStr})` : rowStr;
    });

    const finalParts = [];
    rowSummaries.forEach((rStr, idx) => {
      finalParts.push(rStr);
      if (idx < rowSummaries.length - 1) {
        const rOp = (norm.rowOperators[idx] || 'OR').toUpperCase();
        finalParts.push(rOp === 'AND' || rOp === '&' ? '&' : '||');
      }
    });

    return finalParts.join(' ');
  }

  static formatActionPropsHTML(act, item) {
    if (!act) return '';
    const type = act.type || (item ? item.constructor.name.toLowerCase() : 'unknown');
    const rows = [];

    const addRow = (label, val) => {
      rows.push(`<div class="seq-action-prop-row"><span class="seq-prop-key">${label}</span><span class="seq-prop-val">${val}</span></div>`);
    };

    if (type === 'piston') {
      const strokeMap = { drive_tdc: 'Drive to TDC (Min Vol)', drive_bdc: 'Drive to BDC (Max Vol)', hold: 'Hold Position', free: 'Free Float' };
      addRow('Stroke', strokeMap[act.strokeCommand || 'drive_tdc'] || act.strokeCommand);
      addRow('Motion Mode', (act.motionType || item?.mode || 'free').toUpperCase());
      addRow('Target Speed', `${act.targetSpeed !== undefined ? act.targetSpeed : 160} px/s`);
      addRow('Mass', `${act.mass !== undefined ? act.mass : (item?.mass || 30)} kg`);
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : (item?.conductivity || 0.2)).toFixed(2)}`);
      if (act.motionType === 'spring') addRow('Spring k', `${act.springK || 50} N/m`);
      if (act.motionType === 'motorized') addRow('Frequency', `${act.frequency || 0.8} Hz`);
      if (act.motionType === 'damper') addRow('Damping γ', `${act.dampingCoeff || 25} Ns/m`);
    } else if (type === 'manual_valve') {
      addRow('State', act.valveState === 'open' || act.valveState === undefined ? 'OPEN' : 'CLOSED');
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (type === 'check_valve') {
      addRow('Allowed Flow', (act.direction === -1 ? 'Reverse (←)' : 'Forward (→)'));
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (type === 'relief_valve') {
      addRow('Relief Mode', (act.reliefMode || '1-way').toUpperCase());
      addRow('Trigger P_max', `${act.triggerPressure || 250} Pa`);
      addRow('Hysteresis ΔP', `${act.pressureHysteresis || 25} Pa`);
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (type === 'throttle_valve') {
      addRow('State', act.state === 'bypassed' ? 'BYPASSED (100%)' : 'THROTTLED');
      addRow('Opening Ratio', `${Math.round((act.openRatio !== undefined ? act.openRatio : 0.3) * 100)}%`);
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (['reservoir', 'heat_exchanger', 'regenerator', 'thermal_block'].includes(type)) {
      addRow('Thermal State', act.isActive !== false ? 'ACTIVE' : 'INSULATED');
      addRow('Temperature T', `${Math.round(act.temperature !== undefined ? act.temperature : 300)} K`);
      addRow('Coupling κ', `${(act.conductivity !== undefined ? act.conductivity : (act.conductance || 0.6)).toFixed(2)}`);
      if (act.heatCapacity !== undefined || (item && item.heatCapacity)) {
        addRow('Heat Capacity C', `${act.heatCapacity !== undefined ? act.heatCapacity : item.heatCapacity} J/K`);
      }
      if (type === 'regenerator') addRow('Orientation', (act.orientation || 'horizontal').toUpperCase());
    } else if (type === 'emitter') {
      addRow('State', act.state === 'paused' ? 'PAUSED' : 'FIRING');
      addRow('Direction', (act.direction || 'right').toUpperCase());
      addRow('Rate', `${act.rate !== undefined ? act.rate : 8} /s`);
      addRow('Temperature T', `${Math.round(act.temperature !== undefined ? act.temperature : 300)} K`);
      addRow('Particle Mass', `${act.mass !== undefined ? act.mass : 1.0}`);
      addRow('Max Limit', act.maxParticles > 0 ? `${act.maxParticles}` : 'Unlimited');
    } else if (type === 'sink') {
      addRow('State', act.isActive !== false ? 'ACTIVE' : 'INACTIVE');
      addRow('Direction', (act.direction || '360').toUpperCase());
      addRow('Efficiency', `${Math.round((act.absorptionEfficiency !== undefined ? act.absorptionEfficiency : 1.0) * 100)}%`);
      addRow('Temp Filter', (act.tempFilterMode || 'all').toUpperCase());
      addRow('Max Limit', act.maxParticles > 0 ? `${act.maxParticles}` : 'Unlimited');
    } else if (type === 'regulator') {
      addRow('State', act.isActive !== false ? 'ACTIVE' : 'INACTIVE');
      addRow('Target Count N', `${act.targetCount !== undefined ? act.targetCount : 50}`);
      addRow('Hysteresis ΔN', `±${act.hysteresis !== undefined ? act.hysteresis : 3}`);
      addRow('Gas Temp T', `${Math.round(act.temperature !== undefined ? act.temperature : 300)} K`);
      addRow('Max Rate', `${act.rate !== undefined ? act.rate : 15} /s`);
    } else {
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    }

    return `
      <div class="seq-action-body">
        <div class="seq-action-props-grid">
          ${rows.join('')}
        </div>
      </div>
    `;
  }
}


// --- src/model/elementNames.js ---
// Display names of elements and groups ("Piston 2", "Rectangle 1"). Names are
// assigned on first use and stored on the element (`name`) or in
// engine.groupNames; Engine export/import keeps both.

const GROUP_LABELS = { rect: 'Rectangle', circle: 'Circle', arc: 'Arc', poly: 'Polygon', group: 'Group' };

function nextFree(label, used) {
  let n = 1;
  while (used.has(`${label} ${n}`)) n++;
  return `${label} ${n}`;
}

function elementName(item, engine) {
  if (item instanceof SensorZone) return item.label;
  if (item instanceof TextLabel) return `“${item.text}”`;
  if (item.name) return item.name;
  const type = elementTypeOf(item);
  const label = type ? ELEMENT_TYPES[type].label : 'Element';
  const used = new Set((engine?.elements || []).map(e => e.name).filter(Boolean));
  item.name = nextFree(label, used);
  return item.name;
}

function renameElement(item, name) {
  const clean = name.trim();
  if (!clean) return;
  if (item instanceof SensorZone) item.label = clean;
  else if (item instanceof TextLabel) item.text = clean.replace(/^“|”$/g, '');
  else item.name = clean;
}

function groupKindOf(groupId) {
  const m = /^g_(rect|circle|arc|poly)_/.exec(groupId || '');
  return m ? m[1] : 'group';
}

function groupName(groupId, engine) {
  engine.groupNames = engine.groupNames || {};
  if (!engine.groupNames[groupId]) {
    engine.groupNames[groupId] = nextFree(GROUP_LABELS[groupKindOf(groupId)], new Set(Object.values(engine.groupNames)));
  }
  return engine.groupNames[groupId];
}

function renameGroup(groupId, name, engine) {
  const clean = name.trim();
  if (!clean) return;
  engine.groupNames = engine.groupNames || {};
  engine.groupNames[groupId] = clean;
}


// --- src/control/SequencerTimeline.js ---
/**
 * SequencerTimeline.js
 * Horizontal Step Cards & Transition Nodes Timeline Track.
 * Features expandable Element Accordions with settings inspection and smooth Camera Focus.
 */


class SequencerTimeline {
  constructor(engine, callbacks = {}, renderer = null) {
    this.engine = engine;
    this.callbacks = callbacks;
    this.renderer = renderer;
    this.trackEl = document.getElementById('seqTimelineTrack');
    this.expandedActions = new Set(); // Stores expanded action keys: `${sIdx}_${aIdx}`
  }

  init() {
    this.render();
  }

  render() {
    const sequencer = this.engine.sequencer;
    if (!this.trackEl || !sequencer) return;

    this.trackEl.innerHTML = '';
    const steps = sequencer.steps || [];
    const totalSteps = steps.length;

    steps.forEach((step, sIdx) => {
      // 1. Step Card
      const stepCard = this._createStepCard(step, sIdx, totalSteps, sequencer);
      this.trackEl.appendChild(stepCard);

      // 2. Transition Gate (between steps)
      if (sIdx < totalSteps - 1 || sequencer.isLooping) {
        const transNode = this._createTransitionNode(step, sIdx, totalSteps, sequencer);
        this.trackEl.appendChild(transNode);
      }
    });

    // 3. Add Step Placeholder at end
    const addPlaceholder = document.createElement('div');
    addPlaceholder.className = 'seq-add-card-placeholder';
    addPlaceholder.title = 'Append New Step';
    addPlaceholder.innerHTML = `
      <div class="seq-add-card-inner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Step</span>
      </div>
    `;
    addPlaceholder.addEventListener('click', () => {
      sequencer.addStep();
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    this.trackEl.appendChild(addPlaceholder);
  }

  _createStepCard(step, sIdx, totalSteps, sequencer) {
    const card = document.createElement('div');
    const isActive = sequencer.isEnabled && sequencer.activeStepIndex === sIdx;
    card.className = `seq-step-card ${isActive ? 'is-active' : ''}`;
    card.setAttribute('data-step-index', sIdx);

    const actions = step.actions || [];
    let actionsHtml = '';

    if (actions.length === 0) {
      actionsHtml = `
        <div class="seq-no-actions" style="font-size:11px; color:var(--text-dim); font-style:italic; padding:8px 0; text-align:center;">
          No element actions assigned
        </div>
      `;
    } else {
      actions.forEach((act, aIdx) => {
        const item = this._findTargetItem(act.targetId);
        const type = item ? actionTypeOf(item) : null;
        const tag = type ? ELEMENT_TYPES[type].tag : 'MISSING';
        const label = item ? `${elementName(item, this.engine)} · ${SequencerSummary.getActionSummary(act, item)}` : 'Element was deleted';
        const key = `${sIdx}_${aIdx}`;
        const isExpanded = this.expandedActions.has(key);

        actionsHtml += `
          <div class="seq-action-card ${isExpanded ? 'is-expanded' : ''}" data-step="${sIdx}" data-action="${aIdx}">
            <div class="seq-action-header" data-step="${sIdx}" data-action="${aIdx}" title="Click to edit properties & zoom canvas">
              <div class="seq-action-header-left">
                <span class="seq-action-arrow">${isExpanded ? '▼' : '▶'}</span>
                <span class="seq-tag-mini">${tag}</span>
                <span class="seq-action-title">${label}</span>
              </div>
              <div class="seq-action-tools">
                <button class="seq-act-btn btn-del-action" title="Remove Action" data-step="${sIdx}" data-action="${aIdx}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            ${isExpanded ? `<div class="seq-action-body" id="seqAccBody_${sIdx}_${aIdx}"></div>` : ''}
          </div>
        `;
      });
    }

    card.innerHTML = `
      <div class="seq-step-header">
        <div class="seq-step-title-group">
          <span class="seq-step-pill">STEP ${sIdx + 1}</span>
          <input type="text" class="seq-step-name-input" value="${step.name}" title="Click to rename step">
        </div>
        <div class="seq-step-actions-nav">
          <button class="seq-nav-btn btn-move-left" ${sIdx === 0 ? 'disabled' : ''} title="Move Left">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="seq-nav-btn btn-move-right" ${sIdx === totalSteps - 1 ? 'disabled' : ''} title="Move Right">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="seq-nav-btn btn-duplicate-step" title="Duplicate Step">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="seq-nav-btn btn-delete-step" title="Delete Step">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div class="seq-step-body">
        <div class="seq-actions-list">${actionsHtml}</div>
        <button class="seq-btn-add-element" data-step="${sIdx}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Element</span>
        </button>
      </div>
    `;

    // Step event bindings
    card.querySelector('.seq-step-name-input')?.addEventListener('change', (e) => {
      step.name = e.target.value.trim() || `Step ${sIdx + 1}`;
    });
    card.querySelector('.btn-move-left')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.moveStep(sIdx, sIdx - 1);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.btn-move-right')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.moveStep(sIdx, sIdx + 1);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.btn-duplicate-step')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.duplicateStep(sIdx);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.btn-delete-step')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.removeStep(sIdx);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.seq-btn-add-element')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof this.callbacks.onAddElement === 'function') this.callbacks.onAddElement(sIdx);
    });

    // Accordion Header Click: Toggle expand & zoom to canvas element WITHOUT opening modal
    card.querySelectorAll('.seq-action-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        if (e.target.closest('.seq-action-tools')) return;
        const aIdx = parseInt(hdr.getAttribute('data-action'), 10);
        const key = `${sIdx}_${aIdx}`;
        const act = step.actions[aIdx];
        const item = this._findTargetItem(act?.targetId);

        if (this.expandedActions.has(key)) {
          this.expandedActions.delete(key);
          const rend = this.renderer || this.engine?.renderer || window.renderer;
          if (rend) rend.highlightedSequencerItem = null;
        } else {
          this.expandedActions.clear();
          this.expandedActions.add(key);
          if (item) this._focusCameraOnItem(item);
        }
        this.render();
      });
    });

    // Delete action button
    card.querySelectorAll('.btn-del-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const aIdx = parseInt(btn.getAttribute('data-action'), 10);
        this.expandedActions.delete(`${sIdx}_${aIdx}`);
        sequencer.removeAction(sIdx, aIdx);
        this.render();
        if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
      });
    });

    // Populate interactive controls for expanded actions
    actions.forEach((act, aIdx) => {
      const key = `${sIdx}_${aIdx}`;
      if (this.expandedActions.has(key)) {
        const body = card.querySelector(`#seqAccBody_${sIdx}_${aIdx}`);
        const item = this._findTargetItem(act.targetId);
        if (body && item) {
          const pfx = `seqAcc_${sIdx}_${aIdx}_`;
          SequencerActionFields.renderFields(body, item, act, (updated) => {
            Object.assign(act, updated);
            if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
          }, pfx);
        }
      }
    });

    return card;
  }

  _focusCameraOnItem(item) {
    const rend = this.renderer || this.engine?.renderer || window.renderer;
    if (!rend || !item) return;

    let cx = 400, cy = 300;
    if (typeof item.getBounds === 'function') {
      const b = item.getBounds();
      cx = (b.left + b.right) / 2;
      cy = (b.top + b.bottom) / 2;
    } else if (item.p1 && item.p2) {
      cx = (item.p1.x + item.p2.x) / 2;
      cy = (item.p1.y + item.p2.y) / 2;
    } else if (item.x !== undefined && item.y !== undefined) {
      cx = item.x + (item.width || item.w || 40) / 2;
      cy = item.y + (item.height || item.h || 40) / 2;
    }

    const leftBarW = document.getElementById('leftSidebar')?.offsetWidth || 340;
    const rightBar = document.getElementById('sidebarRight');
    const rightBarW = (rightBar && rightBar.style.display !== 'none' && !rightBar.classList.contains('collapsed')) ? rightBar.offsetWidth : 0;
    const ribbonH = document.querySelector('.ribbon-container')?.offsetHeight || 115;
    const dockH = document.getElementById('unifiedBottomDock')?.offsetHeight || 420;

    const screenCenterX = (leftBarW + (window.innerWidth - rightBarW)) / 2;
    const screenCenterY = (ribbonH + (window.innerHeight - dockH)) / 2;

    const startPanX = rend.panX;
    const startPanY = rend.panY;
    const startZoom = rend.zoom;
    const endZoom = Math.min(2.2, Math.max(startZoom, 1.25));
    const endPanX = screenCenterX - cx * endZoom;
    const endPanY = screenCenterY - cy * endZoom;

    rend.highlightedSequencerItem = item;

    const startTime = performance.now();
    const duration = 280;
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      rend.panX = startPanX + (endPanX - startPanX) * ease;
      rend.panY = startPanY + (endPanY - startPanY) * ease;
      rend.zoom = startZoom + (endZoom - startZoom) * ease;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _createTransitionNode(step, sIdx, totalSteps, sequencer) {
    const wrap = document.createElement('div');
    wrap.className = 'seq-transition-wrapper';

    const isActive = sequencer.isEnabled && sequencer.activeStepIndex === sIdx;
    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };
    const summary = SequencerSummary.getTransitionSummary(transition);
    const progressPct = isActive ? Math.round(sequencer.stepProgress * 100) : 0;

    wrap.innerHTML = `
      <div class="seq-flow-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="seq-transition-node ${isActive ? 'is-active' : ''}" data-step-trans="${sIdx}" title="Click to configure transition conditions">
        <div class="seq-trans-header">
          <span class="seq-trans-tag">TRANSITION</span>
          <svg class="seq-trans-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="seq-trans-desc">${summary}</div>
        <div class="seq-transition-progress-track">
          <div class="seq-transition-progress-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>
      <div class="seq-flow-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;

    wrap.querySelector('.seq-transition-node')?.addEventListener('click', () => {
      if (typeof this.callbacks.onEditTransition === 'function') {
        this.callbacks.onEditTransition(sIdx);
      }
    });

    return wrap;
  }

  _findTargetItem(id) {
    if (!id) return null;
    const eng = this.engine;
    return (eng.pistons || []).find(p => p.id === id) ||
           (eng.walls || []).find(w => w.id === id) ||
           (eng.throttleValves || []).find(v => v.id === id) ||
           (eng.reservoirs || []).find(r => r.id === id) ||
           (eng.heatExchangers || []).find(h => h.id === id) ||
           (eng.regenerators || []).find(rg => rg.id === id) ||
           (eng.thermalBlocks || []).find(b => b.id === id) ||
           (eng.emitters || []).find(e => e.id === id) ||
           (eng.sinks || []).find(s => s.id === id) ||
           (eng.regulators || []).find(r => r.id === id);
  }

  updateActiveStep() {
    const sequencer = this.engine.sequencer;
    if (!sequencer || !this.trackEl) return;

    const curIdx = sequencer.activeStepIndex;
    const isRunning = sequencer.isEnabled;

    this.trackEl.querySelectorAll('.seq-step-card').forEach((card, idx) => {
      card.classList.toggle('is-active', isRunning && idx === curIdx);
    });

    this.trackEl.querySelectorAll('.seq-transition-node').forEach((gate, idx) => {
      const isActive = isRunning && idx === curIdx;
      gate.classList.toggle('is-active', isActive);
      const fill = gate.querySelector('.seq-transition-progress-fill');
      if (fill) fill.style.width = isActive ? `${Math.round(sequencer.stepProgress * 100)}%` : '0%';
    });
  }
}


// --- src/control/SequencerActionDialog.js ---
/**
 * SequencerActionDialog.js
 * Floating CAD-Styled Inspector Modal Anchored Next to Canvas Elements.
 * Conforms to TOOL_CATALOG.md and Onshape CAD Tool Dialog visual specifications.
 */


class SequencerActionDialog {
  constructor(engine, onActionSaved, renderer = null) {
    this.engine = engine;
    this.renderer = renderer;
    this.onActionSaved = onActionSaved;
    this.isPicking = false;
    this.targetStepIndex = null;
    this.editingActionIndex = null;
    this.selectedItem = null;

    this.dialogEl = null;
    this.toastEl = null;
    this._initDOM();
    this._initDraggable();
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  _initDOM() {
    // 1. Toast Notification for Picking Mode
    let toast = document.getElementById('seqPickToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'seqPickToast';
      toast.className = 'seq-pick-toast';
      toast.style.display = 'none';
      toast.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Click an element on canvas or in the Elements Outline (ESC to cancel)</span>
      `;
      document.body.appendChild(toast);
    }
    this.toastEl = toast;

    // 2. Floating CAD Action Dialog (Anchored next to element)
    let dialog = document.getElementById('seqActionDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'seqActionDialog';
      dialog.className = 'tool-dialog-panel seq-floating-action-dialog';
      dialog.style.display = 'none';
      dialog.innerHTML = `
        <div class="tool-dialog-header" id="seqActHeader" title="Drag to move panel">
          <button class="tool-dialog-btn btn-dialog-reset" id="seqActBtnReset" title="Reset to Catalog Defaults">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0 0V3m0 5h5"/></svg>
          </button>
          <div class="tool-dialog-title-group">
            <span class="tool-dialog-badge" id="seqActBadge">ACTION</span>
            <span class="tool-dialog-title" id="seqActTitle">Configure Element</span>
          </div>
          <div class="tool-dialog-actions">
            <button class="tool-dialog-btn btn-dialog-close" id="seqActBtnClose" title="Close (Esc)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="tool-dialog-body" id="seqActFormContainer" style="max-height:360px; overflow-y:auto; padding:12px 14px;"></div>
        <div class="modal-actions-row" style="padding:8px 12px; border-top:1px solid var(--border-subtle); display:flex; gap:8px; justify-content:flex-end; align-items:center;">
          <button id="seqActBtnCancel" class="btn-pill btn-secondary-action" style="padding:4px 10px; font-size:11px;">Cancel</button>
          <button id="seqActBtnSave" class="btn-pill btn-primary-action" style="padding:4px 10px; font-size:11px;">Save Action</button>
        </div>
      `;
      document.body.appendChild(dialog);
    }
    this.dialogEl = dialog;

    // Bind buttons
    document.getElementById('seqActBtnClose')?.addEventListener('click', () => this.close());
    document.getElementById('seqActBtnReset')?.addEventListener('click', () => this.resetToDefaults());
    document.getElementById('seqActBtnCancel')?.addEventListener('click', () => this.close());
    document.getElementById('seqActBtnSave')?.addEventListener('click', () => this._saveAction());

    // ESC handling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isPicking) this.stopPicking();
        else if (this.dialogEl && this.dialogEl.style.display !== 'none') this.close();
      }
    });
  }

  _initDraggable() {
    const header = document.getElementById('seqActHeader');
    if (!header || !this.dialogEl) return;

    let isDragging = false;
    let startX = 0, startY = 0, initLeft = 0, initTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tool-dialog-actions') || e.target.closest('.btn-dialog-reset')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.dialogEl.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.dialogEl.style.left = `${initLeft + dx}px`;
      this.dialogEl.style.top = `${initTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });
  }

  startPicking(stepIndex) {
    this.targetStepIndex = stepIndex;
    this.editingActionIndex = null;
    this.selectedItem = null;
    this.isPicking = true;

    this._setGlowHighlight(null);
    if (this.toastEl) this.toastEl.style.display = 'flex';
    document.body.classList.add('seq-picking-active');
  }

  stopPicking() {
    this.isPicking = false;
    this._setGlowHighlight(null);
    if (this.toastEl) this.toastEl.style.display = 'none';
    document.body.classList.remove('seq-picking-active');
  }

  isPickable(item) {
    return SequencerActionFields.getElementType(item) !== 'unknown';
  }

  handleItemPicked(item) {
    if (!this.isPicking || !this.isPickable(item)) return false;
    this.stopPicking();
    this.openForElement(item, this.targetStepIndex);
    return true;
  }

  openForElement(item, stepIndex, existingAction = null, actionIndex = null) {
    if (!item) return;
    this.selectedItem = item;
    this.targetStepIndex = stepIndex;
    this.editingActionIndex = actionIndex;

    // 1. Trigger subtle glowing cyan outline on the canvas item
    this._setGlowHighlight(item);

    // 2. Camera focus if element is out of view
    this._centerCameraIfNeeded(item);

    // 3. Populate Title and Form Controls
    const titleEl = document.getElementById('seqActTitle');
    const badgeEl = document.getElementById('seqActBadge');
    const formContainer = document.getElementById('seqActFormContainer');

    const type = SequencerActionFields.getElementType(item);
    if (badgeEl) badgeEl.textContent = ELEMENT_TYPES[type]?.tag || type.toUpperCase();
    if (titleEl) titleEl.textContent = `Action: ${ELEMENT_TYPES[type]?.label || type}`;

    SequencerActionFields.renderFields(formContainer, item, existingAction || {});

    // 4. Position dialog beside element and clamp to viewport
    if (this.dialogEl) {
      this.dialogEl.style.display = 'flex';
      this._positionNearElement(item);
    }
  }

  _setGlowHighlight(item) {
    const rend = this.renderer || this.engine?.renderer;
    if (rend) {
      rend.highlightedSequencerItem = item;
    }
  }

  _getElementBounds(item) {
    if (!item) return { left: 0, right: 0, top: 0, bottom: 0, cx: 0, cy: 0 };
    if (typeof item.getBounds === 'function') {
      const b = item.getBounds();
      return {
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
        cx: (b.left + b.right) / 2,
        cy: (b.top + b.bottom) / 2
      };
    }
    if (item.p1 && item.p2) {
      const left = Math.min(item.p1.x, item.p2.x);
      const right = Math.max(item.p1.x, item.p2.x);
      const top = Math.min(item.p1.y, item.p2.y);
      const bottom = Math.max(item.p1.y, item.p2.y);
      return { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
    }
    if (item.x !== undefined && item.y !== undefined) {
      const w = item.width || 40, h = item.height || 40;
      return { left: item.x, right: item.x + w, top: item.y, bottom: item.y + h, cx: item.x + w / 2, cy: item.y + h / 2 };
    }
    return { left: 0, right: 0, top: 0, bottom: 0, cx: 0, cy: 0 };
  }

  _centerCameraIfNeeded(item) {
    const rend = this.renderer || this.engine?.renderer;
    if (!rend) return;

    const b = this._getElementBounds(item);
    const screenCenter = rend.worldToScreen(b.cx, b.cy);

    const leftBarW = document.getElementById('leftSidebar')?.offsetWidth || 340;
    const rightBar = document.getElementById('sidebarRight');
    const rightBarW = (rightBar && rightBar.style.display !== 'none' && !rightBar.classList.contains('collapsed')) ? rightBar.offsetWidth : 0;
    const ribbonH = document.querySelector('.ribbon-container')?.offsetHeight || 115;
    const dockH = document.getElementById('unifiedBottomDock')?.offsetHeight || 420;

    const minX = leftBarW + 60;
    const maxX = window.innerWidth - rightBarW - 60;
    const minY = ribbonH + 50;
    const maxY = window.innerHeight - dockH - 50;

    if (screenCenter.x < minX || screenCenter.x > maxX || screenCenter.y < minY || screenCenter.y > maxY) {
      const targetScreenX = (minX + maxX) / 2;
      const targetScreenY = (minY + maxY) / 2;
      rend.panX = targetScreenX - b.cx * rend.zoom;
      rend.panY = targetScreenY - b.cy * rend.zoom;
    }
  }

  _positionNearElement(item) {
    if (!this.dialogEl) return;
    const rend = this.renderer || this.engine?.renderer;
    if (!rend) return;

    const b = this._getElementBounds(item);
    const screenBoxRight = rend.worldToScreen(b.right, b.top);
    const screenBoxLeft = rend.worldToScreen(b.left, b.top);

    const dialogW = this.dialogEl.offsetWidth || 300;
    const dialogH = this.dialogEl.offsetHeight || 360;

    const leftBarW = document.getElementById('leftSidebar')?.offsetWidth || 340;
    const rightBar = document.getElementById('sidebarRight');
    const rightBarW = (rightBar && rightBar.style.display !== 'none' && !rightBar.classList.contains('collapsed')) ? rightBar.offsetWidth : 0;
    const ribbonH = document.querySelector('.ribbon-container')?.offsetHeight || 115;
    const dockH = document.getElementById('unifiedBottomDock')?.offsetHeight || 420;

    let targetX = screenBoxRight.x + 16;
    let targetY = screenBoxRight.y - 10;

    // If overflowing right, flip to left of element
    if (targetX + dialogW > window.innerWidth - rightBarW - 10) {
      targetX = screenBoxLeft.x - dialogW - 16;
    }

    // Viewport clamping
    const clampedX = Math.max(leftBarW + 10, Math.min(window.innerWidth - rightBarW - dialogW - 10, targetX));
    const clampedY = Math.max(ribbonH + 10, Math.min(window.innerHeight - dockH - dialogH - 10, targetY));

    this.dialogEl.style.left = `${Math.round(clampedX)}px`;
    this.dialogEl.style.top = `${Math.round(clampedY)}px`;
  }

  _saveAction() {
    if (!this.selectedItem) return;
    const formContainer = document.getElementById('seqActFormContainer');
    const existing = (this.editingActionIndex !== null && this.engine.sequencer?.steps[this.targetStepIndex]?.actions[this.editingActionIndex]) || {};

    const snapshot = SequencerActionFields.extractSnapshot(formContainer, this.selectedItem, existing);

    if (this.editingActionIndex !== null) {
      const step = this.engine.sequencer.steps[this.targetStepIndex];
      if (step && step.actions[this.editingActionIndex]) {
        step.actions[this.editingActionIndex] = snapshot;
      }
    } else {
      this.engine.sequencer.addAction(this.targetStepIndex, snapshot);
    }

    this.close();
    if (typeof this.onActionSaved === 'function') {
      this.onActionSaved(this.targetStepIndex);
    }
  }

  resetToDefaults() {
    if (!this.selectedItem) return;
    const formContainer = document.getElementById('seqActFormContainer');
    if (!formContainer) return;
    const type = SequencerActionFields.getElementType(this.selectedItem);
    SequencerActionFields.renderFields(formContainer, this.selectedItem, defaultValues(type, 'sequencer'));
  }

  close() {
    this._setGlowHighlight(null);
    if (this.dialogEl) this.dialogEl.style.display = 'none';
    this.selectedItem = null;
    this.editingActionIndex = null;
  }
}


// --- src/control/SequencerTransitionBuilder.js ---
/**
 * SequencerTransitionBuilder.js
 * Interactive 2D Visual Builder for Compound Transition Conditions.
 * Renders bracketed rows, compact square monochrome SVG chips, and horizontal/vertical AND/OR operator pills.
 */


class SequencerTransitionBuilder {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onChange: (data) => void }
    this.data = SequencerConditions.normalizeTransition(null);
    this.expandedKey = '0_0';
    this.engine = null;
    this.containerEl = null;
  }

  setData(transitionData, engine = null) {
    this.data = SequencerConditions.normalizeTransition(transitionData);
    this.expandedKey = '0_0';
    if (engine) this.engine = engine;
  }

  getData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  _btn(cls, html, title, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.innerHTML = html;
    b.title = title;
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }

  render(containerEl, engine = null) {
    if (containerEl) this.containerEl = containerEl;
    if (engine) this.engine = engine;
    if (!this.containerEl) return;

    this.containerEl.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'seq-trans-grid';

    const rows = this.data.rows;

    rows.forEach((row, rIdx) => {
      const rowCard = document.createElement('div');
      rowCard.className = 'seq-trans-row-card';

      const leftBracket = document.createElement('span');
      leftBracket.className = 'seq-trans-bracket';
      leftBracket.textContent = '(';
      rowCard.appendChild(leftBracket);

      const chipsTrack = document.createElement('div');
      chipsTrack.className = 'seq-trans-chips-track';

      row.conditions.forEach((cond, cIdx) => {
        const key = `${rIdx}_${cIdx}`;
        chipsTrack.appendChild(this.expandedKey === key
          ? this._renderExpandedChip(cond, rIdx, cIdx)
          : this._renderCollapsedChip(cond, rIdx, cIdx));

        if (cIdx < row.conditions.length - 1) {
          const op = (row.operators[cIdx] || 'AND').toUpperCase();
          const isOr = op === 'OR' || op === '||';
          const pill = this._btn(`seq-trans-op-pill ${isOr ? 'is-or' : 'is-and'}`, isOr ? '||' : '&',
            `Toggle operator: currently ${isOr ? 'OR' : 'AND'}`, () => {
              row.operators[cIdx] = isOr ? 'AND' : 'OR';
              this._notifyChange();
              this.render();
            });
          chipsTrack.appendChild(pill);
        }
      });
      rowCard.appendChild(chipsTrack);

      const rightBracket = document.createElement('span');
      rightBracket.className = 'seq-trans-bracket';
      rightBracket.textContent = ')';
      rowCard.appendChild(rightBracket);

      const rowActions = document.createElement('div');
      rowActions.className = 'seq-trans-row-actions';
      rowActions.appendChild(this._btn('seq-trans-btn-mini btn-add-and', '+ &', 'Add condition to row with AND', () => {
        row.conditions.push({ type: 'duration', duration: 1.5 });
        row.operators.push('AND');
        this.expandedKey = `${rIdx}_${row.conditions.length - 1}`;
        this._notifyChange();
        this.render();
      }));
      rowActions.appendChild(this._btn('seq-trans-btn-mini btn-add-or', '+ ||', 'Add condition to row with OR', () => {
        row.conditions.push({ type: 'duration', duration: 1.5 });
        row.operators.push('OR');
        this.expandedKey = `${rIdx}_${row.conditions.length - 1}`;
        this._notifyChange();
        this.render();
      }));

      if (rows.length > 1) {
        rowActions.appendChild(this._btn('seq-trans-btn-mini btn-del-row', '&times;', 'Delete row', () => {
          rows.splice(rIdx, 1);
          if (rIdx < this.data.rowOperators.length) this.data.rowOperators.splice(rIdx, 1);
          else if (this.data.rowOperators.length > 0) this.data.rowOperators.pop();
          this.expandedKey = '0_0';
          this._notifyChange();
          this.render();
        }));
      }

      rowCard.appendChild(rowActions);
      gridEl.appendChild(rowCard);

      if (rIdx < rows.length - 1) {
        const rowOp = (this.data.rowOperators[rIdx] || 'OR').toUpperCase();
        const isOr = rowOp === 'OR' || rowOp === '||';
        const vDivider = document.createElement('div');
        vDivider.className = 'seq-trans-v-divider';
        vDivider.appendChild(document.createElement('div')).className = 'seq-trans-v-line';
        vDivider.appendChild(this._btn(`seq-trans-op-pill v-pill ${isOr ? 'is-or' : 'is-and'}`, isOr ? '||' : '&',
          `Toggle row operator: currently ${isOr ? 'OR' : 'AND'}`, () => {
            this.data.rowOperators[rIdx] = isOr ? 'AND' : 'OR';
            this._notifyChange();
            this.render();
          }));
        vDivider.appendChild(document.createElement('div')).className = 'seq-trans-v-line';
        gridEl.appendChild(vDivider);
      }
    });

    const addRowBar = document.createElement('div');
    addRowBar.className = 'seq-trans-add-row-bar';
    addRowBar.appendChild(this._btn('seq-trans-btn-add-row',
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>& Zeile</span>',
      'Add row with AND', () => {
        this.data.rowOperators.push('AND');
        this.data.rows.push({ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] });
        this.expandedKey = `${this.data.rows.length - 1}_0`;
        this._notifyChange();
        this.render();
      }));
    addRowBar.appendChild(this._btn('seq-trans-btn-add-row',
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>|| Zeile</span>',
      'Add row with OR', () => {
        this.data.rowOperators.push('OR');
        this.data.rows.push({ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] });
        this.expandedKey = `${this.data.rows.length - 1}_0`;
        this._notifyChange();
        this.render();
      }));

    gridEl.appendChild(addRowBar);
    this.containerEl.appendChild(gridEl);
  }

  _renderCollapsedChip(cond, rIdx, cIdx) {
    const chip = document.createElement('div');
    chip.className = 'seq-trans-chip is-collapsed';
    chip.title = `Click to edit: ${this._getTooltip(cond)}`;

    let svg = '', badge = '';
    const type = cond.type || 'duration';

    if (type === 'duration') {
      svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      badge = `${(cond.duration !== undefined ? cond.duration : 1.5).toFixed(1)}s`;
    } else if (type === 'piston' || type === 'piston_target') {
      svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>';
      badge = (cond.pistonTarget || 'tdc').toUpperCase();
    } else if (type === 'sensor') {
      svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 12l3-3"/><path d="M7 12a5 5 0 0 1 10 0"/></svg>';
      const metric = cond.sensorMetric === 'temperature' ? 'T' : 'P';
      const unit = cond.sensorMetric === 'temperature' ? 'K' : 'Pa';
      badge = `${metric}${cond.sensorOperator || '>='}${cond.sensorThreshold || 200}${unit}`;
    }

    chip.innerHTML = `<div class="seq-trans-chip-icon">${svg}</div><div class="seq-trans-chip-badge">${badge}</div>`;
    chip.addEventListener('click', () => { this.expandedKey = `${rIdx}_${cIdx}`; this.render(); });
    return chip;
  }

  _renderExpandedChip(cond, rIdx, cIdx) {
    const chip = document.createElement('div');
    chip.className = 'seq-trans-chip is-expanded';
    const type = cond.type || 'duration';
    const totalConds = this.data.rows.reduce((sum, r) => sum + r.conditions.length, 0);

    chip.innerHTML = `
      <div class="seq-trans-chip-header">
        <select class="styled-select seq-chip-type-select">
          <option value="duration" ${type === 'duration' ? 'selected' : ''}>Time Duration</option>
          <option value="piston" ${type === 'piston' || type === 'piston_target' ? 'selected' : ''}>Piston Target</option>
          <option value="sensor" ${type === 'sensor' ? 'selected' : ''}>Sensor Chamber</option>
        </select>
        <button type="button" class="btn-icon-sm btn-del-chip" title="Remove Condition" ${totalConds <= 1 ? 'disabled' : ''}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="seq-trans-chip-body"></div>
    `;

    const typeSelect = chip.querySelector('.seq-chip-type-select');
    const bodyEl = chip.querySelector('.seq-trans-chip-body');

    const updateBody = (curType, curData) => {
      bodyEl.innerHTML = '';
      if (curType === 'duration') {
        const dur = curData.duration !== undefined ? curData.duration : 1.5;
        bodyEl.innerHTML = `
          <div class="field-row" style="margin-bottom:0;">
            <div class="field-label"><span style="font-size:10px;">Elapsed >=</span><span class="field-num lbl-dur" style="font-size:10px;">${dur.toFixed(1)} s</span></div>
            <input type="range" class="styled-slider input-dur" min="0.1" max="10.0" step="0.1" value="${dur}">
          </div>
        `;
        const slider = bodyEl.querySelector('.input-dur');
        const lbl = bodyEl.querySelector('.lbl-dur');
        slider?.addEventListener('input', () => {
          curData.duration = parseFloat(slider.value);
          if (lbl) lbl.textContent = `${curData.duration.toFixed(1)} s`;
          this._notifyChange();
        });
      } else if (curType === 'piston') {
        if (!curData.pistonTarget) curData.pistonTarget = 'tdc';
        const pistons = this.engine?.pistons || [];
        let pOptions = `<option value="">All Pistons</option>`;
        pistons.forEach((p, idx) => { pOptions += `<option value="${p.id}" ${curData.pistonId === p.id ? 'selected' : ''}>Piston ${idx + 1}</option>`; });
        const tgt = curData.pistonTarget;
        bodyEl.innerHTML = `
          <select class="styled-select input-piston-id" style="width:100%; margin-bottom:2px;">${pOptions}</select>
          <select class="styled-select input-piston-tgt" style="width:100%;">
            <option value="tdc" ${tgt === 'tdc' ? 'selected' : ''}>Top Dead Center (TDC)</option>
            <option value="bdc" ${tgt === 'bdc' ? 'selected' : ''}>Bottom Dead Center (BDC)</option>
          </select>
        `;
        bodyEl.querySelector('.input-piston-id')?.addEventListener('change', (e) => { curData.pistonId = e.target.value || null; this._notifyChange(); });
        bodyEl.querySelector('.input-piston-tgt')?.addEventListener('change', (e) => { curData.pistonTarget = e.target.value; this._notifyChange(); });
      } else if (curType === 'sensor') {
        if (!curData.sensorMetric) curData.sensorMetric = 'pressure';
        if (!curData.sensorOperator) curData.sensorOperator = '>=';
        if (curData.sensorThreshold === undefined) curData.sensorThreshold = 200;
        const sensors = this.engine?.sensors || [];
        let sOptions = sensors.length === 0 ? `<option value="">(No Chambers)</option>` : '';
        sensors.forEach(s => { sOptions += `<option value="${s.id}" ${curData.sensorId === s.id ? 'selected' : ''}>${s.label || 'Chamber'}</option>`; });
        const metric = curData.sensorMetric;
        const op = curData.sensorOperator;
        const thresh = curData.sensorThreshold;
        bodyEl.innerHTML = `
          <select class="styled-select input-sensor-id" style="width:100%; margin-bottom:2px;">${sOptions}</select>
          <div style="display:flex; gap:4px; align-items:center; width:100%;">
            <select class="styled-select input-sensor-metric" style="flex:1; min-width:0;">
              <option value="pressure" ${metric === 'pressure' ? 'selected' : ''}>P (Pa)</option>
              <option value="temperature" ${metric === 'temperature' ? 'selected' : ''}>T (K)</option>
            </select>
            <select class="styled-select input-sensor-op" style="width:46px; min-width:46px; text-align:center;">
              <option value=">=" ${op === '>=' ? 'selected' : ''}>&gt;=</option>
              <option value="<=" ${op === '<=' ? 'selected' : ''}>&lt;=</option>
            </select>
            <input type="number" class="styled-select input-sensor-thresh" value="${thresh}" style="width:56px; min-width:56px;">
          </div>
        `;
        bodyEl.querySelector('.input-sensor-id')?.addEventListener('change', (e) => { curData.sensorId = e.target.value || null; this._notifyChange(); });
        bodyEl.querySelector('.input-sensor-metric')?.addEventListener('change', (e) => { curData.sensorMetric = e.target.value; this._notifyChange(); });
        bodyEl.querySelector('.input-sensor-op')?.addEventListener('change', (e) => { curData.sensorOperator = e.target.value; this._notifyChange(); });
        bodyEl.querySelector('.input-sensor-thresh')?.addEventListener('input', (e) => { curData.sensorThreshold = parseFloat(e.target.value) || 0; this._notifyChange(); });
      }
    };

    updateBody(type, cond);
    typeSelect.addEventListener('change', () => { cond.type = typeSelect.value; updateBody(cond.type, cond); this._notifyChange(); });

    chip.querySelector('.btn-del-chip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = this.data.rows[rIdx];
      row.conditions.splice(cIdx, 1);
      if (cIdx < row.operators.length) row.operators.splice(cIdx, 1);
      else if (row.operators.length > 0) row.operators.pop();
      if (row.conditions.length === 0) {
        this.data.rows.splice(rIdx, 1);
        if (rIdx < this.data.rowOperators.length) this.data.rowOperators.splice(rIdx, 1);
        else if (this.data.rowOperators.length > 0) this.data.rowOperators.pop();
      }
      if (this.data.rows.length === 0) {
        this.data.rows.push({ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] });
      }
      this.expandedKey = '0_0';
      this._notifyChange();
      this.render();
    });

    return chip;
  }

  _getTooltip(cond) {
    const type = cond.type || 'duration';
    if (type === 'duration') return `Time >= ${(cond.duration || 1.5).toFixed(1)}s`;
    if (type === 'piston' || type === 'piston_target') return `Piston reaches ${(cond.pistonTarget || 'tdc').toUpperCase()}`;
    if (type === 'sensor') {
      const metric = cond.sensorMetric === 'temperature' ? 'T' : 'P';
      const unit = cond.sensorMetric === 'temperature' ? 'K' : 'Pa';
      return `Sensor ${metric} ${cond.sensorOperator || '>='} ${cond.sensorThreshold || 200}${unit}`;
    }
    return 'Condition';
  }

  _notifyChange() {
    if (typeof this.callbacks.onChange === 'function') {
      this.callbacks.onChange(this.getData());
    }
  }
}



// --- src/control/SequencerTransitionDialog.js ---
/**
 * SequencerTransitionDialog.js
 * Modal Configuration Dialog for Arbitrary 2D Compound Transition Conditions.
 * Integrates SequencerTransitionBuilder for bracketed row blocks and Boolean precedence.
 */


class SequencerTransitionDialog {
  constructor(engine, onTransitionSaved) {
    this.engine = engine;
    this.onTransitionSaved = onTransitionSaved;
    this.targetStepIndex = null;
    this.modalEl = null;
    this.builder = new SequencerTransitionBuilder();

    this._initDOM();
  }

  _initDOM() {
    let modal = document.getElementById('seqTransitionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'seqTransitionModal';
      modal.className = 'modal-overlay';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-card" style="width: 580px; max-width: 95vw;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="tool-dialog-badge" style="background:rgba(56,189,248,0.18); color:#38bdf8;">GATE</span>
              <h3 id="seqTransTitle" style="font-size:13px;">Configure Transition Conditions</h3>
            </div>
            <button id="seqTransBtnClose" class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" style="padding:16px; gap:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
              <span style="font-size:10px; font-weight:700; letter-spacing:0.5px; color:var(--text-muted); text-transform:uppercase;">
                Compound Conditions (Brackets &amp; Logic)
              </span>
              <span style="font-size:10px; color:var(--text-dim); font-style:italic;">
                Row: ( &amp; / || ) • Vertical: &amp; / ||
              </span>
            </div>

            <!-- 2D Grid Container -->
            <div id="seqTransGridContainer" class="seq-trans-grid-container" style="max-height:340px; overflow-y:auto; padding-right:4px;"></div>

            <!-- Fallback Safety Timeout -->
            <div class="field-row" style="margin-top:6px; padding-top:10px; border-top:1px solid var(--border-subtle);">
              <div class="field-label"><span>Fallback Safety Timeout</span><span class="field-num" id="lbl_seqTrans_timeout">10.0 s</span></div>
              <input type="range" id="seqTrans_timeout" min="1" max="60" step="0.5" value="10" class="styled-slider">
            </div>

            <div class="modal-actions-row" style="margin-top:8px;">
              <button id="seqTransBtnCancel" class="btn-pill btn-secondary-action">Cancel</button>
              <button id="seqTransBtnSave" class="btn-pill btn-primary-action">Apply Transition</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    this.modalEl = modal;

    // Timeout slider readout
    const timeoutSlider = modal.querySelector('#seqTrans_timeout');
    const timeoutLbl = modal.querySelector('#lbl_seqTrans_timeout');
    timeoutSlider?.addEventListener('input', () => {
      if (timeoutLbl) timeoutLbl.textContent = `${parseFloat(timeoutSlider.value).toFixed(1)} s`;
    });

    // Modal action buttons
    modal.querySelector('#seqTransBtnClose')?.addEventListener('click', () => this.close());
    modal.querySelector('#seqTransBtnCancel')?.addEventListener('click', () => this.close());
    modal.querySelector('#seqTransBtnSave')?.addEventListener('click', () => this._saveTransition());
  }

  open(stepIndex) {
    this.targetStepIndex = stepIndex;
    const step = this.engine.sequencer?.steps[stepIndex];
    if (!step) return;

    const title = document.getElementById('seqTransTitle');
    if (title) {
      const nextStepNum = stepIndex + 2 <= this.engine.sequencer.steps.length ? stepIndex + 2 : (this.engine.sequencer.isLooping ? '1' : 'End');
      title.textContent = `Transition Gate: ${step.name} ➔ Step ${nextStepNum}`;
    }

    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };
    this.builder.setData(transition, this.engine);

    // Set fallback timeout
    const timeoutSlider = this.modalEl.querySelector('#seqTrans_timeout');
    const timeoutLbl = this.modalEl.querySelector('#lbl_seqTrans_timeout');
    const timeoutVal = this.builder.data.fallbackTimeout !== undefined ? this.builder.data.fallbackTimeout : 10.0;
    if (timeoutSlider) timeoutSlider.value = timeoutVal;
    if (timeoutLbl) timeoutLbl.textContent = `${timeoutVal.toFixed(1)} s`;

    // Render 2D Grid
    const gridContainer = this.modalEl.querySelector('#seqTransGridContainer');
    if (gridContainer) {
      this.builder.render(gridContainer, this.engine);
    }

    if (this.modalEl) this.modalEl.style.display = 'flex';
  }

  _saveTransition() {
    const step = this.engine.sequencer?.steps[this.targetStepIndex];
    if (!step) return;

    const transitionData = this.builder.getData();
    const timeout = parseFloat(this.modalEl.querySelector('#seqTrans_timeout')?.value || '10');
    transitionData.fallbackTimeout = timeout;

    step.transition = transitionData;
    step.trigger = transitionData;

    this.close();
    if (typeof this.onTransitionSaved === 'function') {
      this.onTransitionSaved(this.targetStepIndex);
    }
  }

  close() {
    if (this.modalEl) this.modalEl.style.display = 'none';
  }
}



// --- src/control/SequencerUI.js ---
/**
 * SequencerUI.js
 * Master UI Coordinator Facade for Thermodynamic Cycle Sequencer.
 * Integrates SequencerDock, SequencerTimeline, SequencerActionDialog, and SequencerTransitionDialog.
 */


class SequencerUI {
  constructor(engine, renderer = null) {
    this.engine = engine;
    this.renderer = renderer;
    this.sequencer = engine.sequencer;

    // 1. Action snapshot configuration modal & picker
    this.actionDialog = new SequencerActionDialog(engine, () => {
      this.render();
      this.dock.updateBadges();
    }, renderer);

    // 2. Transition gate configuration modal
    this.transitionDialog = new SequencerTransitionDialog(engine, () => {
      this.render();
    });

    // 3. Timeline track renderer
    this.timeline = new SequencerTimeline(engine, {
      onAddElement: (sIdx) => this.actionDialog.startPicking(sIdx),
      onEditAction: (item, sIdx, act, aIdx) => this.actionDialog.openForElement(item, sIdx, act, aIdx),
      onEditTransition: (sIdx) => this.transitionDialog.open(sIdx),
      onStepModified: () => {
        this.dock.updateBadges();
        this.timeline.updateActiveStep();
      }
    }, renderer);

    // 4. Bottom dock controller
    this.dock = new SequencerDock(engine, {
      onToggle: (isOpen) => {
        if (isOpen) this.render();
      },
      onAddStep: () => {
        this.sequencer.addStep();
        this.render();
        this.dock.updateBadges();
      },
      onReset: () => {
        this.timeline.updateActiveStep();
      },
      onRenderRequest: () => {
        this.render();
      }
    });

    // Wire sequencer state callbacks
    if (this.sequencer) {
      this.sequencer.onStepChangeCallback = () => {
        this.dock.updateBadges();
        this.timeline.updateActiveStep();
      };
      this.sequencer.onPhaseChangeCallback = this.sequencer.onStepChangeCallback;
    }

    this.render();
  }

  get isOpen() {
    return this.dock ? this.dock.isOpen : false;
  }

  toggleDrawer() {
    this.dock?.toggleDrawer();
  }

  openDrawer() {
    this.dock?.openDrawer();
  }

  closeDrawer() {
    this.dock?.closeDrawer();
  }

  render() {
    this.timeline?.render();
    this.dock?.updateBadges();
  }

  updateBadges() {
    this.dock?.updateBadges();
  }

  updateActiveStep() {
    this.timeline?.updateActiveStep();
  }

  updateLive() {
    if (!this.sequencer || !this.sequencer.isEnabled) return;
    this.timeline?.updateActiveStep();
  }

  handleItemPicked(item) {
    if (this.actionDialog && this.actionDialog.isPicking) {
      return this.actionDialog.handleItemPicked(item);
    }
    return false;
  }
}


// --- src/app/core.js ---
// Engine, renderer, charts and sequencer instances; canvas sizing and WebGPU start-up.

// Canvas Resizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (bgCanvas) {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  if (gpuCanvas) {
    gpuCanvas.width = window.innerWidth;
    gpuCanvas.height = window.innerHeight;
    if (window.renderer && window.renderer.gpuRenderer) {
      window.renderer.gpuRenderer.resize(window.innerWidth, window.innerHeight);
    }
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Master Physics Engine, Renderer & Analytics
const engine = new Engine(WORLD_SIZE, WORLD_SIZE);
const renderer = new Renderer(canvas, null, bgCanvas);
window.engine = engine;
window.renderer = renderer;
window.Presets = Presets;
window.DashboardChart = DashboardChart;

// Asynchronously initialize WebGPU & GPU Compute
if (gpuCanvas) {
  renderer.initGPU(gpuCanvas).then(isSupported => {
    if (!isSupported) {
      const errOverlay = document.getElementById('webgpuErrorOverlay');
      if (errOverlay) errOverlay.style.display = 'flex';
    } else if (renderer.gpuRenderer && renderer.gpuRenderer.device) {
      const gpuCompute = new ParticleGPUCompute(renderer.gpuRenderer.device);
      window.gpuCompute = gpuCompute;
      engine.enableGPUCompute(gpuCompute);
    }
  }).catch(err => {
    console.error('WebGPU Init Error:', err);
    const errOverlay = document.getElementById('webgpuErrorOverlay');
    if (errOverlay) errOverlay.style.display = 'flex';
  });
}

// Sidebar charts: system history (all sensors, or the system without sensors) and velocity distribution
const tempChart = new ChartView(tempChartCanvas, { target: 'sensors', metric: 'temp' });
const velChart = new ChartView(velChartCanvas, { target: 'global', metric: 'hist' });
const sequencerUI = new SequencerUI(engine, renderer);
window.sequencerUI = sequencerUI;

renderer.setViewport(canvas.width * 0.5 - 450, canvas.height * 0.5 - 300, 1.0);


// --- src/app/state.js ---
// Mutable app-wide state shared by the src/app modules. ES module bindings
// are read-only for importers, so shared variables live on these objects.

// Workflow state
const app = {
  currentProjectName: 'Untitled Simulation',
  isSimulating: false,
  isSplashActive: true,
  isAmbientSim: true,
  hasActiveSession: false,
  activeTool: 'select',
  selectedItems: [],
};
window.app = app; // for tests and console debugging

// Mouse, drag and drawing-draft state
const pointer = {
  isMouseDown: false,
  isPanning: false,
  panStartScreen: { x: 0, y: 0 },
  panStartCamera: { x: 0, y: 0 },
  dragStartWorld: null,
  currentCursorWorld: null,
  polygonPoints: [],
  polygonGroupId: null,
  polygonWalls: [],
  arcSteps: [],
  draggingHandle: null,
  isMovingSelection: false,
  moveStartWorld: null,
  pendingStart: null, // first corner of a click-move-click drawing
};

function resetPolygonDraft() {
  pointer.polygonPoints = [];
  pointer.polygonGroupId = null;
  pointer.polygonWalls = [];
  pointer.pendingStart = null;
}


// --- src/app/fields.js ---
// Grid snapping and the dual slider/number input helpers.

// Grid Snapping
function snapToGrid(v) {
  if (!renderer.snapToGrid) return v;
  return Math.round(v / renderer.gridSize) * renderer.gridSize;
}

// Synchronized Dual Slider + Number Input Helpers
function makeDualInput(label, id, min, max, step, value, unit = '') {
  return `
    <div class="field-row">
      <div class="field-label"><span>${label}</span></div>
      <div class="dual-input-row">
        <input type="range" id="${id}_slider" min="${min}" max="${max}" step="${step}" value="${value}" class="styled-slider">
        <input type="number" id="${id}_num" min="${min}" max="${max}" step="${step}" value="${value}" class="dual-num-input">
        ${unit ? `<span style="font-size:10px; color:var(--text-dim);">${unit}</span>` : ''}
      </div>
    </div>
  `;
}

function attachDualInput(id, onChange) {
  const slider = document.getElementById(`${id}_slider`);
  const num = document.getElementById(`${id}_num`);
  if (!slider || !num) return;

  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    num.value = val;
    onChange(val);
  });

  num.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      slider.value = val;
      onChange(val);
    }
  });
}


// --- src/app/selection.js ---
// Selection transforms, item hit-testing, wall generators, move and delete.

// ============================================================================
// Canvas Selection & Multi-Item Transforms
// ============================================================================
function getSelectionBounds() {
  if (app.selectedItems.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const item of app.selectedItems) {
    if (item.p1 && item.p2) {
      minX = Math.min(minX, item.p1.x, item.p2.x);
      maxX = Math.max(maxX, item.p1.x, item.p2.x);
      minY = Math.min(minY, item.p1.y, item.p2.y);
      maxY = Math.max(maxY, item.p1.y, item.p2.y);
    } else if (item.x !== undefined && item.y !== undefined) {
      const w = item.width || 30;
      const h = item.height || 30;
      minX = Math.min(minX, item.x);
      maxX = Math.max(maxX, item.x + w);
      minY = Math.min(minY, item.y);
      maxY = Math.max(maxY, item.y + h);
    }
  }
  return { minX, maxX, minY, maxY, cx: (minX + maxX) * 0.5, cy: (minY + maxY) * 0.5 };
}

function rotateSelection90() {
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cx, cy } = bounds;

  for (const item of app.selectedItems) {
    if (item.p1 && item.p2) {
      const x1 = cx - (item.p1.y - cy);
      const y1 = cy + (item.p1.x - cx);
      const x2 = cx - (item.p2.y - cy);
      const y2 = cy + (item.p2.x - cx);
      item.setPoints(x1, y1, x2, y2);
    } else if (item.x !== undefined && item.y !== undefined) {
      const w = item.width || 40;
      const h = item.height || 40;
      const itemCenterX = item.x + w * 0.5;
      const itemCenterY = item.y + h * 0.5;
      const newCenterX = cx - (itemCenterY - cy);
      const newCenterY = cy + (itemCenterX - cx);
      
      item.width = h;
      item.height = w;
      item.x = newCenterX - item.width * 0.5;
      item.y = newCenterY - item.height * 0.5;

      if (item.direction) {
        const dirs = ['right', 'down', 'left', 'up'];
        const idx = dirs.indexOf(item.direction);
        if (idx !== -1) item.direction = dirs[(idx + 1) % 4];
      }
      if (item.orientation) {
        item.orientation = item.orientation === 'horizontal' ? 'vertical' : 'horizontal';
      }
    }
  }
  updateElementsList();
}

function flipSelectionH() {
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cx } = bounds;

  for (const item of app.selectedItems) {
    if (item.p1 && item.p2) {
      const x1 = 2 * cx - item.p1.x;
      const x2 = 2 * cx - item.p2.x;
      item.setPoints(x1, item.p1.y, x2, item.p2.y);
      if (item.flipDirection) item.flipDirection();
      else if (item.allowedDirection) item.allowedDirection = -item.allowedDirection;
    } else if (item.x !== undefined) {
      const w = item.width || 40;
      const itemCenterX = item.x + w * 0.5;
      const newCenterX = 2 * cx - itemCenterX;
      item.x = newCenterX - w * 0.5;
      if (item.direction === 'right') item.direction = 'left';
      else if (item.direction === 'left') item.direction = 'right';
    }
  }
  updateElementsList();
}

function flipSelectionV() {
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cy } = bounds;

  for (const item of app.selectedItems) {
    if (item.p1 && item.p2) {
      const y1 = 2 * cy - item.p1.y;
      const y2 = 2 * cy - item.p2.y;
      item.setPoints(item.p1.x, y1, item.p2.x, y2);
      if (item.flipDirection) item.flipDirection();
      else if (item.allowedDirection) item.allowedDirection = -item.allowedDirection;
    } else if (item.y !== undefined) {
      const h = item.height || 40;
      const itemCenterY = item.y + h * 0.5;
      const newCenterY = 2 * cy - itemCenterY;
      item.y = newCenterY - h * 0.5;
      if (item.direction === 'up') item.direction = 'down';
      else if (item.direction === 'down') item.direction = 'up';
    }
  }
  updateElementsList();
}

function getAllGroupItems(item) {
  if (!item || !item.groupId) return [item];
  const all = [
    ...engine.walls,
    ...(engine.throttleValves || []),
    ...engine.pistons,
    ...engine.reservoirs,
    ...engine.thermalBlocks,
    ...engine.heatExchangers,
    ...engine.regenerators,
    ...engine.emitters,
    ...engine.sinks,
    ...engine.regulators,
    ...engine.sensors,
    ...engine.textLabels
  ];
  const group = all.filter(i => i.groupId && i.groupId === item.groupId);
  return group.length > 0 ? group : [item];
}

function toggleGroupSelection() {
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const allSameGroup = app.selectedItems.length > 1 && app.selectedItems.every(i => i.groupId && i.groupId === app.selectedItems[0].groupId);
  if (allSameGroup) {
    app.selectedItems.forEach(i => { delete i.groupId; });
  } else {
    const gid = 'g_' + Math.random().toString(36).substring(2, 8);
    app.selectedItems.forEach(i => { i.groupId = gid; });
  }
  updateElementsList();
}

function canGroupSelection() {
  const sel = app.selectedItems;
  return sel.length > 1 && !sel.every(i => i.groupId && i.groupId === sel[0].groupId);
}

function canUngroupSelection() {
  return app.selectedItems.some(i => i.groupId);
}

function groupSelection() {
  if (app.isSimulating || !canGroupSelection()) return;
  recordUndoState();
  const gid = 'g_' + Math.random().toString(36).substring(2, 8);
  app.selectedItems.forEach(i => { i.groupId = gid; });
  updateElementsList();
}

function ungroupSelection() {
  if (app.isSimulating || !canUngroupSelection()) return;
  recordUndoState();
  app.selectedItems.forEach(i => { delete i.groupId; });
  updateElementsList();
}

btnRotate90?.addEventListener('click', rotateSelection90);
btnFlipH?.addEventListener('click', flipSelectionH);
btnFlipV?.addEventListener('click', flipSelectionV);
btnGroupSelected?.addEventListener('click', toggleGroupSelection);

// Piston Snap Detector for Sensor Chambers
function findPistonSnap(x, y, width, height, threshold = 22) {
  if (!engine.pistons || engine.pistons.length === 0) return null;
  const cLeft = x, cRight = x + width, cTop = y, cBottom = y + height;
  let best = null;
  let minDiff = threshold + 1;

  for (let i = 0; i < engine.pistons.length; i++) {
    const p = engine.pistons[i];
    const pb = p.getBounds();

    if (p.orientation === 'horizontal') {
      const yOverlap = (cTop <= pb.bottom + threshold && cBottom >= pb.top - threshold);
      const dRight = Math.abs(cRight - pb.left);
      if (yOverlap && dRight < minDiff) {
        minDiff = dRight;
        best = { piston: p, edge: 'right', snappedCoord: pb.left };
      }
      const dLeft = Math.abs(cLeft - pb.right);
      if (yOverlap && dLeft < minDiff) {
        minDiff = dLeft;
        best = { piston: p, edge: 'left', snappedCoord: pb.right };
      }
    } else { // vertical
      const xOverlap = (cLeft <= pb.right + threshold && cRight >= pb.left - threshold);
      const dBottom = Math.abs(cBottom - pb.top);
      if (xOverlap && dBottom < minDiff) {
        minDiff = dBottom;
        best = { piston: p, edge: 'bottom', snappedCoord: pb.top };
      }
      const dTop = Math.abs(cTop - pb.bottom);
      if (xOverlap && dTop < minDiff) {
        minDiff = dTop;
        best = { piston: p, edge: 'top', snappedCoord: pb.bottom };
      }
    }
  }
  return best;
}

// Circle Wall Generator
function createCircleWall(center, radius) {
  if (radius < 10) return [];
  const numSegments = Math.max(20, Math.min(64, Math.round(radius * 0.45)));
  const angleStep = (Math.PI * 2) / numSegments;
  const createdWalls = [];
  const gid = 'g_circle_' + Math.random().toString(36).substring(2, 9);

  for (let i = 0; i < numSegments; i++) {
    const a1 = i * angleStep;
    const a2 = (i + 1) * angleStep;
    const x1 = center.x + radius * Math.cos(a1);
    const y1 = center.y + radius * Math.sin(a1);
    const x2 = center.x + radius * Math.cos(a2);
    const y2 = center.y + radius * Math.sin(a2);
    createdWalls.push(engine.addWall(x1, y1, x2, y2, wallOptions({ groupId: gid })));
  }
  app.selectedItems = createdWalls;
  return createdWalls;
}

// Arc Generator
function createArcWall(center, pStart, pEnd) {
  const radius = Math.hypot(pStart.x - center.x, pStart.y - center.y);
  if (radius < 10) return [];

  const startAngle = Math.atan2(pStart.y - center.y, pStart.x - center.x);
  let endAngle = Math.atan2(pEnd.y - center.y, pEnd.x - center.x);
  if (endAngle <= startAngle) endAngle += Math.PI * 2;

  const numSegments = 16;
  const angleStep = (endAngle - startAngle) / numSegments;
  const gid = 'g_arc_' + Math.random().toString(36).substring(2, 9);
  const createdWalls = [];

  for (let i = 0; i < numSegments; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = startAngle + (i + 1) * angleStep;
    const x1 = center.x + radius * Math.cos(a1);
    const y1 = center.y + radius * Math.sin(a1);
    const x2 = center.x + radius * Math.cos(a2);
    const y2 = center.y + radius * Math.sin(a2);
    createdWalls.push(engine.addWall(x1, y1, x2, y2, wallOptions({ groupId: gid })));
  }
  app.selectedItems = createdWalls;
  return createdWalls;
}

// Item Search & Box Selection
function findItemAt(wx, wy) {
  for (let i = 0; i < engine.pistons.length; i++) {
    const p = engine.pistons[i], b = p.getBounds();
    if (wx >= b.left - 8 && wx <= b.right + 8 && wy >= b.top - 8 && wy <= b.bottom + 8) return p;
  }
  for (let i = 0; i < engine.reservoirs.length; i++) {
    if (engine.reservoirs[i].contains(wx, wy)) return engine.reservoirs[i];
  }
  for (let i = 0; i < engine.heatExchangers.length; i++) {
    if (engine.heatExchangers[i].contains(wx, wy)) return engine.heatExchangers[i];
  }
  for (let i = 0; i < engine.regenerators.length; i++) {
    if (engine.regenerators[i].contains(wx, wy)) return engine.regenerators[i];
  }
  for (let i = 0; i < engine.thermalBlocks.length; i++) {
    if (engine.thermalBlocks[i].contains(wx, wy)) return engine.thermalBlocks[i];
  }
  for (let i = 0; i < engine.emitters.length; i++) {
    if (engine.emitters[i].contains(wx, wy)) return engine.emitters[i];
  }
  for (let i = 0; i < engine.sinks.length; i++) {
    if (engine.sinks[i].contains(wx, wy)) return engine.sinks[i];
  }
  for (let i = 0; i < engine.regulators.length; i++) {
    if (engine.regulators[i].contains(wx, wy)) return engine.regulators[i];
  }
  for (let i = 0; i < engine.textLabels.length; i++) {
    if (engine.textLabels[i].contains(wx, wy)) return engine.textLabels[i];
  }
  for (let i = 0; i < engine.walls.length; i++) {
    const w = engine.walls[i], c = w.getClosestPoint(new Vector2(wx, wy));
    if (Math.hypot(c.x - wx, c.y - wy) < 14 / renderer.zoom) return w;
  }
  for (let i = 0; i < (engine.throttleValves || []).length; i++) {
    const tv = engine.throttleValves[i];
    const c = tv._closestPointOnSegment(new Vector2(wx, wy), tv.p1, tv.p2);
    if (Math.hypot(c.x - wx, c.y - wy) < 14 / renderer.zoom) return tv;
  }
  for (let i = 0; i < engine.sensors.length; i++) {
    if (engine.sensors[i].contains(new Vector2(wx, wy))) return engine.sensors[i];
  }
  return null;
}

function findItemsInBox(x1, y1, x2, y2) {
  const items = [];
  engine.walls.forEach(w => {
    if (w.p1.x >= x1 && w.p1.x <= x2 && w.p1.y >= y1 && w.p1.y <= y2) items.push(w);
  });
  (engine.throttleValves || []).forEach(tv => {
    if (tv.p1.x >= x1 && tv.p1.x <= x2 && tv.p1.y >= y1 && tv.p1.y <= y2) items.push(tv);
  });
  engine.pistons.forEach(p => {
    if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) items.push(p);
  });
  engine.reservoirs.forEach(r => {
    if (r.x >= x1 && r.x <= x2 && r.y >= y1 && r.y <= y2) items.push(r);
  });
  engine.heatExchangers.forEach(h => {
    if (h.x >= x1 && h.x <= x2 && h.y >= y1 && h.y <= y2) items.push(h);
  });
  engine.regenerators.forEach(reg => {
    if (reg.x >= x1 && reg.x <= x2 && reg.y >= y1 && reg.y <= y2) items.push(reg);
  });
  engine.thermalBlocks.forEach(b => {
    if (b.x >= x1 && b.x <= x2 && b.y >= y1 && b.y <= y2) items.push(b);
  });
  engine.emitters.forEach(e => {
    if (e.x >= x1 && e.x <= x2 && e.y >= y1 && e.y <= y2) items.push(e);
  });
  engine.sinks.forEach(s => {
    if (s.x >= x1 && s.x <= x2 && s.y >= y1 && s.y <= y2) items.push(s);
  });
  engine.regulators.forEach(r => {
    if (r.x >= x1 && r.x <= x2 && r.y >= y1 && r.y <= y2) items.push(r);
  });
  engine.textLabels.forEach(l => {
    if (l.x >= x1 && l.x <= x2 && l.y >= y1 && l.y <= y2) items.push(l);
  });
  engine.sensors.forEach(s => {
    if (s.x >= x1 && s.x <= x2 && s.y >= y1 && s.y <= y2) items.push(s);
  });
  return items;
}

// Copies the selection (offset by one grid step): groups stay groups,
// spawner groups bring their particles, sensors keep bindings to copied pistons.
function duplicateSelection() {
  if (app.isSimulating) return;
  const sources = app.selectedItems.filter(i => !(i instanceof Particle));
  if (sources.length === 0) return;
  recordUndoState();
  const offset = renderer.gridSize || 20;
  const groupMap = new Map();
  const pistonMap = new Map();
  const copies = [];
  for (const src of sources) {
    const copy = engine.cloneElement(src);
    if (!copy) continue;
    if (src.groupId) {
      if (!groupMap.has(src.groupId)) groupMap.set(src.groupId, src.groupId.replace(/[^_]+$/, '') + Math.random().toString(36).substring(2, 9));
      copy.groupId = groupMap.get(src.groupId);
    }
    if (src instanceof Piston) pistonMap.set(src.id, copy);
    if (src instanceof SensorZone) copy.label = `${src.label} (Copy)`;
    if (src instanceof ParticleGroup) {
      copy.x += offset;
      copy.y += offset;
      engine.particles.filter(p => p.groupId === src.id).forEach(p => {
        engine.addParticle(p.pos.x + offset, p.pos.y + offset, p.vel.x, p.vel.y, p.mass, copy.id);
      });
    }
    engine.addElement(copy);
    copies.push(copy);
  }
  moveItems(copies, offset, offset);
  copies.forEach(c => {
    if (c instanceof SensorZone && c.pistonBinding) {
      const piston = pistonMap.get(c.pistonBinding.pistonId);
      if (piston) c.bindToPiston(piston, c.pistonBinding.edge, true);
      else c.unbindPiston();
    }
  });
  engine.particles.forEach(p => { p.selected = false; });
  app.selectedItems = copies;
  engine.syncParticlesToGPU();
  updateElementsList();
}

function moveSelectedItems(dx, dy) {
  moveItems(app.selectedItems, dx, dy);
}

function moveItems(items, dx, dy) {
  items.forEach(item => {
    if (item instanceof Wall) {
      item.p1.x += dx; item.p1.y += dy; item.p2.x += dx; item.p2.y += dy;
      item._updateGeometry();
    } else if (item instanceof ThrottleValve) {
      item.p1.x += dx; item.p1.y += dy; item.p2.x += dx; item.p2.y += dy;
      item._updateGeometry();
    } else if (item instanceof Piston) {
      item.x += dx; item.y += dy;
      item.minPos += (item.orientation === 'horizontal' ? dx : dy);
      item.maxPos += (item.orientation === 'horizontal' ? dx : dy);
      item.centerPos = (item.minPos + item.maxPos) * 0.5;
    } else if (item instanceof Reservoir || item instanceof HeatExchanger || item instanceof RegeneratorMatrix || item instanceof ThermalBlock || item instanceof Emitter || item instanceof Sink || item instanceof Regulator || item instanceof SensorZone || item instanceof TextLabel) {
      item.x += dx; item.y += dy;
    }
  });
}

function deleteSelectedItems() {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  const deleteSet = new Set(app.selectedItems);
  engine.walls = engine.walls.filter(w => !deleteSet.has(w));
  engine.throttleValves = (engine.throttleValves || []).filter(tv => !deleteSet.has(tv));
  engine.pistons = engine.pistons.filter(p => !deleteSet.has(p));
  engine.reservoirs = engine.reservoirs.filter(r => !deleteSet.has(r));
  engine.heatExchangers = engine.heatExchangers.filter(h => !deleteSet.has(h));
  engine.regenerators = engine.regenerators.filter(reg => !deleteSet.has(reg));
  engine.sensors = engine.sensors.filter(s => !deleteSet.has(s));
  engine.emitters = engine.emitters.filter(e => !deleteSet.has(e));
  engine.sinks = engine.sinks.filter(s => !deleteSet.has(s));
  engine.regulators = (engine.regulators || []).filter(r => !deleteSet.has(r));
  engine.thermalBlocks = engine.thermalBlocks.filter(b => !deleteSet.has(b));
  engine.textLabels = engine.textLabels.filter(l => !deleteSet.has(l));
  engine.particleGroups = (engine.particleGroups || []).filter(g => !deleteSet.has(g));
  engine.elements = (engine.elements || []).filter(el => !deleteSet.has(el));

  // Unbind any sensors bound to pistons being deleted
  const deletedPistons = app.selectedItems.filter(item => item instanceof Piston);
  if (deletedPistons.length > 0) {
    const deletedPistonIds = new Set(deletedPistons.map(p => p.id));
    engine.sensors.forEach(s => {
      if (s.pistonBinding && deletedPistonIds.has(s.pistonBinding.pistonId)) {
        s.unbindPiston();
      }
    });
  }

  // Delete particles belonging to deleted groups
  const groupsToDelete = Array.from(deleteSet).filter(item => item instanceof ParticleGroup);
  for (const g of groupsToDelete) {
    const pts = engine.particles.filter(p => p.groupId === g.id);
    engine.deleteParticles(pts);
  }

  // Delete selected particles
  const particlesToDelete = engine.particles.filter(p => p.selected || deleteSet.has(p));
  if (particlesToDelete.length > 0) {
    engine.deleteParticles(particlesToDelete);
  }

  app.selectedItems = [];
  closeContextMenu();
  updateElementsList();
  engine.syncWallsToGPU();
  engine.syncSinksToGPU();
}


// --- src/app/dimensions.js ---
// Dimensions while drawing: live length/size readouts next to the draft and
// typed input (start typing a number while drawing, Enter applies it).

const LINE_TOOLS = new Set(['valve', 'throttle_valve']);

// Screen angle convention: 0° points right, counter-clockwise positive.
function formatLengthAngle(dx, dy) {
  const deg = Math.round(-Math.atan2(dy, dx) * 1800 / Math.PI) / 10;
  return `${Math.round(Math.hypot(dx, dy))} px  ${deg}°`;
}

function draftKind() {
  if (app.activeTool === 'wall') return toolConfigs.wall.shape;
  if (LINE_TOOLS.has(app.activeTool)) return 'line';
  return 'box';
}

// { x, y, text } for the HUD label of the current draft, or null.
function getDraftMeasurement() {
  if (app.isSimulating || !pointer.currentCursorWorld) return null;
  const cur = pointer.currentCursorWorld;
  const z = renderer.zoom;
  const kind = draftKind();

  if (kind === 'polygon' && pointer.polygonPoints.length > 0) {
    const last = pointer.polygonPoints[pointer.polygonPoints.length - 1];
    return { x: cur.x, y: cur.y + 24 / z, text: formatLengthAngle(cur.x - last.x, cur.y - last.y) };
  }
  if (kind === 'arc' && pointer.arcSteps.length > 0) {
    const c = pointer.arcSteps[0];
    if (pointer.arcSteps.length === 1) return { x: cur.x, y: cur.y + 24 / z, text: `R ${Math.round(Math.hypot(cur.x - c.x, cur.y - c.y))} px` };
    const p1 = pointer.arcSteps[1];
    let sweep = Math.atan2(cur.y - c.y, cur.x - c.x) - Math.atan2(p1.y - c.y, p1.x - c.x);
    if (sweep <= 0) sweep += Math.PI * 2;
    return { x: cur.x, y: cur.y + 24 / z, text: `${Math.round(sweep * 180 / Math.PI)}°` };
  }

  const d = renderer.draftInfo;
  if (!d || !d.start || !d.current || d.tool === 'select') return null;
  const s = d.start, c = d.current;
  if (kind === 'circle') return { x: c.x, y: c.y + 24 / z, text: `R ${Math.round(Math.hypot(c.x - s.x, c.y - s.y))} px` };
  if (kind === 'line') return { x: c.x, y: c.y + 24 / z, text: formatLengthAngle(c.x - s.x, c.y - s.y) };
  return {
    x: (s.x + c.x) * 0.5,
    y: Math.max(s.y, c.y) + 18 / z,
    text: `${Math.round(Math.abs(c.x - s.x))} × ${Math.round(Math.abs(c.y - s.y))}`
  };
}

// ---------------------------------------------------------------------------
// Typed input
// ---------------------------------------------------------------------------
function hasActiveDraft() {
  if (app.isSimulating) return false;
  if (pointer.pendingStart) return true;
  if (pointer.isMouseDown && pointer.dragStartWorld && isDragTool()) return true;
  return app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length > 0;
}

function inputHint() {
  const kind = draftKind();
  if (kind === 'polygon' || kind === 'line') return 'length, angle°';
  if (kind === 'circle') return 'radius';
  return 'width, height';
}

let dimInput = null;
let inputMode = 'draft'; // 'draft' | 'selection'

function ensureInput() {
  if (dimInput) return dimInput;
  dimInput = document.createElement('input');
  dimInput.type = 'text';
  dimInput.className = 'dim-input';
  dimInput.spellcheck = false;
  dimInput.autocomplete = 'off';
  document.body.appendChild(dimInput);
  dimInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      if (inputMode === 'selection') applySelectionSize(dimInput.value);
      else applyDimensionInput(dimInput.value);
      closeDimensionInput();
    } else if (e.key === 'Escape') {
      closeDimensionInput();
    }
  });
  dimInput.addEventListener('blur', closeDimensionInput);
  return dimInput;
}

function openDimensionInput(firstChar) {
  // A drag in progress becomes a click-move-click draft, so releasing the
  // mouse while typing doesn't create the element.
  if (pointer.isMouseDown && pointer.dragStartWorld) {
    pointer.pendingStart = pointer.dragStartWorld;
    pointer.isMouseDown = false;
    pointer.dragStartWorld = null;
  }
  inputMode = 'draft';
  showInput(inputHint(), firstChar);
}

// Click on the size label of the selection: edit "W, H" or "length, angle".
function openSelectionSizeInput() {
  inputMode = 'selection';
  showInput(getSingleSegment() ? 'length, angle°' : 'width, height', getSelectionSizeText());
  dimInput.select();
}

function showInput(placeholder, value) {
  const input = ensureInput();
  const cur = pointer.currentCursorWorld || { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  input.style.left = `${rect.left + cur.x * renderer.zoom + renderer.panX + 14}px`;
  input.style.top = `${rect.top + cur.y * renderer.zoom + renderer.panY + 14}px`;
  input.placeholder = placeholder;
  input.value = value;
  input.style.display = 'block';
  input.focus();
}

function parseNumbers(text) {
  return text.split(/[,;\s×x*]+/).filter(Boolean).map(Number);
}

function applySelectionSize(text) {
  const v = parseNumbers(text);
  if (v.length === 0 || !Number.isFinite(v[0]) || v[0] <= 0) return;
  recordUndoState();
  const seg = getSingleSegment();
  if (seg) {
    const cur = parseNumbers(getSelectionSizeText());
    setSegmentGeometry(seg, v[0], Number.isFinite(v[1]) ? v[1] : cur[1]);
  } else {
    setSelectionSize(v[0], Number.isFinite(v[1]) && v[1] > 0 ? v[1] : 0);
  }
  updateElementsList();
}

function closeDimensionInput() {
  if (dimInput) dimInput.style.display = 'none';
}

// Direction of the cursor relative to p (unit vector; +x if on top of it).
function cursorDirection(p) {
  const cur = pointer.currentCursorWorld || p;
  const len = Math.hypot(cur.x - p.x, cur.y - p.y);
  return len > 0.5 ? { x: (cur.x - p.x) / len, y: (cur.y - p.y) / len } : { x: 1, y: 0 };
}

function pointAt(p, length, angleDeg) {
  if (Number.isFinite(angleDeg)) {
    const a = angleDeg * Math.PI / 180;
    return { x: p.x + Math.cos(a) * length, y: p.y - Math.sin(a) * length };
  }
  const d = cursorDirection(p);
  return { x: p.x + d.x * length, y: p.y + d.y * length };
}

function applyDimensionInput(text) {
  const v = parseNumbers(text);
  if (v.length === 0 || !Number.isFinite(v[0]) || v[0] <= 0) return;
  const kind = draftKind();

  if (kind === 'polygon') {
    const last = pointer.polygonPoints[pointer.polygonPoints.length - 1];
    if (last) placePolylinePoint(pointAt(last, v[0], v[1]));
    return;
  }
  const s = pointer.pendingStart;
  if (!s) return;
  let end;
  if (kind === 'line') end = pointAt(s, v[0], v[1]);
  else if (kind === 'circle') end = { x: s.x + v[0], y: s.y };
  else {
    const cur = pointer.currentCursorWorld || s;
    const sx = cur.x < s.x ? -1 : 1, sy = cur.y < s.y ? -1 : 1;
    const h = Number.isFinite(v[1]) && v[1] > 0 ? v[1] : v[0];
    end = { x: s.x + sx * v[0], y: s.y + sy * h };
  }
  createFromDrag(s, end);
  pointer.pendingStart = null;
  renderer.draftInfo = null;
}


// --- src/app/transform.js ---
// Transform frame for the selection: resize (8 handles / frame edges),
// rotate (handle above the frame or just outside a corner) and the
// linked-vertex editing of wall shapes. Geometry is always recomputed from
// the snapshot taken at drag start, so repeated moves don't accumulate error.

const FRAME_PAD_PX = 8;       // frame drawn this far outside the content
const HANDLE_HIT_PX = 7;
const EDGE_HIT_PX = 5;
const ROT_ZONE_PX = 22;       // band outside a corner that rotates
const ROT_HANDLE_PX = 26;     // rotate handle distance above the frame
const ROT_SNAP = Math.PI / 12; // 15°
const MIN_SIZE = 10;
const VERTEX_EPS = 0.01;

const DIRS = ['right', 'down', 'left', 'up'];

// ---------------------------------------------------------------------------
// Item classification & bounds
// ---------------------------------------------------------------------------
function itemKind(item) {
  if (item instanceof Wall || item instanceof ThrottleValve) return 'segment';
  if (item instanceof Piston) return 'piston';
  if (item instanceof TextLabel) return 'label';
  if (item instanceof ParticleGroup || item instanceof Particle) return null;
  if (item.x !== undefined && item.width !== undefined) return 'box';
  return null;
}

// Wall shape kind from the group id prefix set by the drawing tools.
function shapeKind(groupId) {
  if (!groupId) return null;
  const m = /^g_(rect|circle|arc|poly)_/.exec(groupId);
  return m ? m[1] : 'group';
}

function transformTargets() {
  return app.selectedItems.filter(i => itemKind(i) !== null);
}

function addItemBounds(item, b) {
  const kind = itemKind(item);
  if (kind === 'segment') {
    b.minX = Math.min(b.minX, item.p1.x, item.p2.x);
    b.maxX = Math.max(b.maxX, item.p1.x, item.p2.x);
    b.minY = Math.min(b.minY, item.p1.y, item.p2.y);
    b.maxY = Math.max(b.maxY, item.p1.y, item.p2.y);
  } else if (kind === 'piston' || kind === 'label') {
    const r = item.getBounds();
    b.minX = Math.min(b.minX, r.left);
    b.maxX = Math.max(b.maxX, r.right);
    b.minY = Math.min(b.minY, r.top);
    b.maxY = Math.max(b.maxY, r.bottom);
  } else if (kind === 'box') {
    b.minX = Math.min(b.minX, item.x);
    b.maxX = Math.max(b.maxX, item.x + item.width);
    b.minY = Math.min(b.minY, item.y);
    b.maxY = Math.max(b.maxY, item.y + item.height);
  }
}

function getContentBounds(items = transformTargets()) {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  items.forEach(i => addItemBounds(i, b));
  if (b.minX > b.maxX) return null;
  return { ...b, width: b.maxX - b.minX, height: b.maxY - b.minY, cx: (b.minX + b.maxX) * 0.5, cy: (b.minY + b.maxY) * 0.5 };
}

// A single wall, throttle valve or piston keeps its own handles instead.
function usesFrame(targets) {
  if (targets.length === 0) return false;
  if (targets.length === 1 && (itemKind(targets[0]) === 'segment' || itemKind(targets[0]) === 'piston')) return false;
  return true;
}

// Only segments rotate freely; axis-aligned elements turn in 90° steps.
function canRotateFreely(targets) {
  return targets.every(i => itemKind(i) === 'segment');
}

// ---------------------------------------------------------------------------
// Frame geometry (world coordinates, pad/handle sizes constant on screen)
// ---------------------------------------------------------------------------
function frameGeometry(bounds) {
  const pad = FRAME_PAD_PX / renderer.zoom;
  const x0 = bounds.minX - pad, x1 = bounds.maxX + pad;
  const y0 = bounds.minY - pad, y1 = bounds.maxY + pad;
  const mx = (x0 + x1) * 0.5, my = (y0 + y1) * 0.5;
  return {
    x0, y0, x1, y1,
    handles: [
      { id: 'nw', x: x0, y: y0 }, { id: 'n', x: mx, y: y0 }, { id: 'ne', x: x1, y: y0 },
      { id: 'e', x: x1, y: my }, { id: 'se', x: x1, y: y1 }, { id: 's', x: mx, y: y1 },
      { id: 'sw', x: x0, y: y1 }, { id: 'w', x: x0, y: my }
    ],
    rot: { x: mx, y: y0 - ROT_HANDLE_PX / renderer.zoom }
  };
}

// Vertex handles of wall shapes that may be edited point by point.
function vertexHandles(targets) {
  const walls = targets.filter(i => i instanceof Wall);
  if (walls.length === 0 || walls.length > 32) return [];
  const kinds = new Set(walls.map(w => shapeKind(w.groupId)));
  if (kinds.has('circle') || kinds.has('arc')) return [];
  const pts = [];
  walls.forEach(w => {
    for (const id of ['p1', 'p2']) {
      if (!pts.some(p => Math.abs(p.x - w[id].x) < VERTEX_EPS && Math.abs(p.y - w[id].y) < VERTEX_EPS)) {
        pts.push({ item: w, handleId: id, x: w[id].x, y: w[id].y });
      }
    }
  });
  return pts;
}

// What the renderer draws for the current selection (null: no frame).
function getTransformFrame() {
  if (app.isSimulating || app.activeTool !== 'select') return null;
  const targets = transformTargets();
  if (!usesFrame(targets)) return null;
  const bounds = getContentBounds(targets);
  if (!bounds) return null;
  const geo = frameGeometry(bounds);
  const groupIds = new Set(targets.map(i => i.groupId || null));
  const gid = groupIds.size === 1 ? [...groupIds][0] : null;
  let label = `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`;
  if (active?.mode === 'rotate') label = `${formatAngle(active.appliedAngle)}`;
  return {
    ...geo,
    vertices: vertexHandles(targets),
    label,
    badge: gid ? shapeBadge(gid, targets.length) : (targets.length > 1 ? `${targets.length} items` : null)
  };
}

function frameLabelPos(frame) {
  return { x: (frame.x0 + frame.x1) * 0.5, y: frame.y1 + 16 / renderer.zoom, text: frame.label };
}

// Approximate hit box of a HUD label (renderer draws 10.5 px monospace).
function hitsLabel(label, wx, wy) {
  const z = renderer.zoom;
  const halfW = (label.text.length * 6.4 + 12) / z / 2;
  return Math.abs(wx - label.x) < halfW && Math.abs(wy - label.y) < 9 / z;
}

// Length/angle label of a single selected segment, or of the endpoint being dragged.
function getSelectionHud() {
  if (app.isSimulating || app.activeTool !== 'select') return null;
  const drag = pointer.draggingHandle;
  if (drag?.links) {
    const p = drag.item[drag.handleId];
    return { x: p.x, y: p.y - 22 / renderer.zoom, text: segmentLabel(drag.item) };
  }
  const targets = transformTargets();
  if (targets.length !== 1 || itemKind(targets[0]) !== 'segment') return null;
  const it = targets[0];
  return { x: (it.p1.x + it.p2.x) * 0.5, y: (it.p1.y + it.p2.y) * 0.5 + 18 / renderer.zoom, text: segmentLabel(it) };
}

function shapeBadge(gid, n) {
  return `${groupName(gid, engine)} (${n})`;
}

function formatAngle(rad) {
  let deg = rad * 180 / Math.PI;
  deg = Math.round(deg * 10) / 10;
  return `${deg > 0 ? '+' : ''}${deg}°`;
}

// ---------------------------------------------------------------------------
// Hit testing & cursors
// ---------------------------------------------------------------------------
// Returns { kind: 'resize', handle } | { kind: 'rotate' } | { kind: 'vertex', item, handleId } | null
function hitTestTransform(wx, wy) {
  const z = renderer.zoom;
  const hud = getSelectionHud();
  if (hud && hitsLabel(hud, wx, wy)) return { kind: 'label' };
  const frame = getTransformFrame();
  if (!frame) return null;
  if (frame.label && hitsLabel(frameLabelPos(frame), wx, wy)) return { kind: 'label' };
  const hit = HANDLE_HIT_PX / z;
  const candidates = [];
  const d = (x, y) => Math.hypot(wx - x, wy - y);

  frame.vertices.forEach(v => candidates.push({ dist: d(v.x, v.y) * 0.9, res: { kind: 'vertex', item: v.item, handleId: v.handleId } }));
  frame.handles.forEach(h => candidates.push({ dist: d(h.x, h.y), res: { kind: 'resize', handle: h.id } }));
  candidates.push({ dist: d(frame.rot.x, frame.rot.y), res: { kind: 'rotate' } });
  const best = candidates.filter(c => c.dist < hit).sort((a, b) => a.dist - b.dist)[0];
  if (best) return best.res;

  // Frame edges resize
  const edge = EDGE_HIT_PX / z;
  const inX = wx > frame.x0 && wx < frame.x1, inY = wy > frame.y0 && wy < frame.y1;
  if (inX && Math.abs(wy - frame.y0) < edge) return { kind: 'resize', handle: 'n' };
  if (inX && Math.abs(wy - frame.y1) < edge) return { kind: 'resize', handle: 's' };
  if (inY && Math.abs(wx - frame.x0) < edge) return { kind: 'resize', handle: 'w' };
  if (inY && Math.abs(wx - frame.x1) < edge) return { kind: 'resize', handle: 'e' };

  // Band just outside a corner rotates
  const band = ROT_ZONE_PX / z;
  for (const c of [[frame.x0, frame.y0, -1, -1], [frame.x1, frame.y0, 1, -1], [frame.x1, frame.y1, 1, 1], [frame.x0, frame.y1, -1, 1]]) {
    const ox = (wx - c[0]) * c[2], oy = (wy - c[1]) * c[3];
    if (ox >= -hit && oy >= -hit && (ox > 0 || oy > 0) && ox < band && oy < band) return { kind: 'rotate' };
  }
  return null;
}

const ROTATE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="#000" stroke-width="4"/><path d="M20 4v5h-5" stroke="#000" stroke-width="4"/>' +
  '<path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="#fff" stroke-width="2"/><path d="M20 4v5h-5" stroke="#fff" stroke-width="2"/></g></svg>'
)}") 12 12, grab`;

function cursorForHit(hit) {
  if (!hit) return null;
  if (hit.kind === 'label') return 'text';
  if (hit.kind === 'rotate') return ROTATE_CURSOR;
  if (hit.kind === 'vertex') return 'move';
  return { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' }[hit.handle];
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------
function snapshotItem(item) {
  const kind = itemKind(item);
  if (kind === 'segment') return { item, kind, p1: { x: item.p1.x, y: item.p1.y }, p2: { x: item.p2.x, y: item.p2.y } };
  if (kind === 'piston') {
    return { item, kind, x: item.x, y: item.y, width: item.width, height: item.height, orientation: item.orientation, minPos: item.minPos, maxPos: item.maxPos };
  }
  return {
    item, kind, x: item.x, y: item.y, width: item.width, height: item.height,
    direction: item.direction, orientation: item.orientation
  };
}

let active = null;

function isTransforming() {
  return !!active;
}

function beginTransform(hit, wx, wy) {
  const targets = transformTargets();
  const bounds = getContentBounds(targets);
  if (!bounds) return false;
  active = {
    mode: hit.kind,
    handle: hit.handle,
    bounds,
    snaps: targets.map(snapshotItem),
    startAngle: Math.atan2(wy - bounds.cy, wx - bounds.cx),
    appliedAngle: 0,
    freeRotation: canRotateFreely(targets)
  };
  return true;
}

function endTransform() {
  if (!active) return;
  // Sensor zones follow their piston binding; re-anchor it to the new box.
  active.snaps.forEach(s => {
    if (s.item instanceof SensorZone) {
      s.item.volume = s.item.width * s.item.height;
      if (active.mode === 'rotate' && s.item.pistonBinding) s.item.unbindPiston();
      else if (s.item.pistonBinding) updateSensorBinding(s.item);
    }
  });
  active = null;
}

function updateSensorBinding(zone) {
  const pb = zone.pistonBinding;
  if (pb.edge === 'right') pb.fixedOpposite = zone.x;
  else if (pb.edge === 'left') pb.fixedOpposite = zone.x + zone.width;
  else if (pb.edge === 'bottom') pb.fixedOpposite = zone.y;
  else if (pb.edge === 'top') pb.fixedOpposite = zone.y + zone.height;
}

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
function updateTransform(wx, wy, mods) {
  if (!active) return;
  if (active.mode === 'resize') applyResize(wx, wy, mods);
  else if (active.mode === 'rotate') applyRotate(wx, wy, mods);
}

function applyResize(wx, wy, mods) {
  const { bounds: b, handle } = active;
  const pad = FRAME_PAD_PX / renderer.zoom;
  const hx = handle.includes('e') ? 1 : (handle.includes('w') ? -1 : 0);
  const hy = handle.includes('s') ? 1 : (handle.includes('n') ? -1 : 0);
  const fromCenter = mods.alt;
  const ax = fromCenter ? b.cx : (hx > 0 ? b.minX : b.maxX);
  const ay = fromCenter ? b.cy : (hy > 0 ? b.minY : b.maxY);

  let sx = 1, sy = 1;
  if (hx !== 0 && b.width > 0.5) {
    const edgeX = snapToGrid(wx - hx * pad);
    const orig = hx > 0 ? b.maxX : b.minX;
    sx = (edgeX - ax) / (orig - ax);
  }
  if (hy !== 0 && b.height > 0.5) {
    const edgeY = snapToGrid(wy - hy * pad);
    const orig = hy > 0 ? b.maxY : b.minY;
    sy = (edgeY - ay) / (orig - ay);
  }
  // No flipping through the anchor; keep a minimum size.
  if (b.width > 0.5) sx = Math.max(sx, MIN_SIZE / b.width);
  if (b.height > 0.5) sy = Math.max(sy, MIN_SIZE / b.height);
  if (mods.shift && hx !== 0 && hy !== 0) sx = sy = Math.max(sx, sy);
  else if (mods.shift && hx !== 0) sy = sx;
  else if (mods.shift && hy !== 0) sx = sy;

  const map = (x, y) => ({ x: ax + (x - ax) * sx, y: ay + (y - ay) * sy });
  active.snaps.forEach(s => scaleItem(s, map, sx, sy));
}

function scaleItem(s, map, sx, sy) {
  const it = s.item;
  if (s.kind === 'segment') {
    const a = map(s.p1.x, s.p1.y), c = map(s.p2.x, s.p2.y);
    it.setPoints(a.x, a.y, c.x, c.y);
  } else if (s.kind === 'piston') {
    const c = map(s.x, s.y);
    it.x = c.x;
    it.y = c.y;
    it.width = Math.max(4, s.width * sx);
    it.height = Math.max(4, s.height * sy);
    if (s.orientation === 'horizontal') {
      it.minPos = map(s.minPos, s.y).x;
      it.maxPos = map(s.maxPos, s.y).x;
    } else {
      it.minPos = map(s.x, s.minPos).y;
      it.maxPos = map(s.x, s.maxPos).y;
    }
    it.centerPos = (it.minPos + it.maxPos) * 0.5;
  } else if (s.kind === 'label') {
    const c = map(s.x, s.y);
    it.x = c.x;
    it.y = c.y;
  } else {
    const a = map(s.x, s.y), c = map(s.x + s.width, s.y + s.height);
    it.x = Math.min(a.x, c.x);
    it.y = Math.min(a.y, c.y);
    it.width = Math.max(MIN_SIZE, Math.abs(c.x - a.x));
    it.height = Math.max(MIN_SIZE, Math.abs(c.y - a.y));
  }
}

// ---------------------------------------------------------------------------
// Rotate
// ---------------------------------------------------------------------------
function applyRotate(wx, wy, mods) {
  const { bounds: b } = active;
  let angle = Math.atan2(wy - b.cy, wx - b.cx) - active.startAngle;
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (!active.freeRotation) angle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
  else if (!mods.shift) angle = Math.round(angle / ROT_SNAP) * ROT_SNAP;
  active.appliedAngle = angle;
  rotateSnapshots(active.snaps, b.cx, b.cy, angle);
}

function rotateSnapshots(snaps, cx, cy, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rot = (x, y) => ({ x: cx + (x - cx) * cos - (y - cy) * sin, y: cy + (x - cx) * sin + (y - cy) * cos });
  const quarter = ((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4;
  snaps.forEach(s => {
    const it = s.item;
    if (s.kind === 'segment') {
      const a = rot(s.p1.x, s.p1.y), c = rot(s.p2.x, s.p2.y);
      it.setPoints(a.x, a.y, c.x, c.y);
    } else if (s.kind === 'piston') {
      const c = rot(s.x, s.y);
      const odd = quarter % 2 === 1;
      it.x = c.x;
      it.y = c.y;
      it.width = odd ? s.height : s.width;
      it.height = odd ? s.width : s.height;
      it.orientation = odd ? (s.orientation === 'horizontal' ? 'vertical' : 'horizontal') : s.orientation;
      const ends = s.orientation === 'horizontal'
        ? [rot(s.minPos, s.y), rot(s.maxPos, s.y)]
        : [rot(s.x, s.minPos), rot(s.x, s.maxPos)];
      const along = ends.map(p => (it.orientation === 'horizontal' ? p.x : p.y));
      it.minPos = Math.min(...along);
      it.maxPos = Math.max(...along);
      it.centerPos = (it.minPos + it.maxPos) * 0.5;
    } else {
      const odd = quarter % 2 === 1;
      const w = (s.kind === 'box' && odd) ? s.height : s.width;
      const h = (s.kind === 'box' && odd) ? s.width : s.height;
      const c = rot(s.x + s.width * 0.5, s.y + s.height * 0.5);
      it.x = c.x - w * 0.5;
      it.y = c.y - h * 0.5;
      if (s.kind === 'box') {
        it.width = w;
        it.height = h;
        if (s.direction && DIRS.includes(s.direction)) it.direction = DIRS[(DIRS.indexOf(s.direction) + quarter) % 4];
        if (s.orientation) it.orientation = odd ? (s.orientation === 'horizontal' ? 'vertical' : 'horizontal') : s.orientation;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Exact dimensions (typed on the size label)
// ---------------------------------------------------------------------------
// Current values for the size input: "W, H" of the frame or "L, angle" of a segment.
function getSelectionSizeText() {
  const seg = getSingleSegment();
  if (seg) {
    const dx = seg.p2.x - seg.p1.x, dy = seg.p2.y - seg.p1.y;
    return `${Math.round(Math.hypot(dx, dy))}, ${Math.round(-Math.atan2(dy, dx) * 1800 / Math.PI) / 10}`;
  }
  const b = getContentBounds();
  return b ? `${Math.round(b.width)}, ${Math.round(b.height)}` : '';
}

// Resizes the selection to w x h, anchored at its top-left corner.
function setSelectionSize(w, h) {
  const targets = transformTargets();
  const b = getContentBounds(targets);
  if (!b) return;
  const sx = b.width > 0.5 && w > 0 ? w / b.width : 1;
  const sy = b.height > 0.5 && h > 0 ? h / b.height : 1;
  const map = (x, y) => ({ x: b.minX + (x - b.minX) * sx, y: b.minY + (y - b.minY) * sy });
  active = { mode: 'resize', snaps: targets.map(snapshotItem) };
  active.snaps.forEach(s => scaleItem(s, map, sx, sy));
  endTransform();
}

// Sets a single segment to length / angle (degrees), keeping p1 in place.
function setSegmentGeometry(item, length, angleDeg) {
  const a = angleDeg * Math.PI / 180;
  moveEndpoints(getLinkedEndpoints(item, 'p2'), item.p1.x + Math.cos(a) * length, item.p1.y - Math.sin(a) * length);
}

function getSingleSegment() {
  const targets = transformTargets();
  return (targets.length === 1 && itemKind(targets[0]) === 'segment') ? targets[0] : null;
}

// ---------------------------------------------------------------------------
// Linked vertices of wall shapes
// ---------------------------------------------------------------------------
// All segment endpoints of the same group sitting on the dragged vertex.
function getLinkedEndpoints(item, handleId) {
  const p = item[handleId];
  const links = [{ item, handleId }];
  if (!item.groupId) return links;
  const segments = [...engine.walls, ...(engine.throttleValves || [])];
  for (const s of segments) {
    if (s.groupId !== item.groupId) continue;
    for (const id of ['p1', 'p2']) {
      if (s === item && id === handleId) continue;
      if (Math.abs(s[id].x - p.x) < VERTEX_EPS && Math.abs(s[id].y - p.y) < VERTEX_EPS) links.push({ item: s, handleId: id });
    }
  }
  return links;
}

function moveEndpoints(links, x, y) {
  links.forEach(({ item, handleId }) => {
    item[handleId].x = x;
    item[handleId].y = y;
    item._updateGeometry();
  });
}

// Shift while dragging a segment endpoint: angle in 15° steps around the other end.
function constrainEndpoint(item, handleId, x, y) {
  const other = handleId === 'p1' ? item.p2 : item.p1;
  const len = Math.hypot(x - other.x, y - other.y);
  const a = Math.round(Math.atan2(y - other.y, x - other.x) / ROT_SNAP) * ROT_SNAP;
  return { x: other.x + Math.cos(a) * len, y: other.y + Math.sin(a) * len };
}

// Length / angle readout for a segment.
function segmentLabel(item) {
  return formatLengthAngle(item.p2.x - item.p1.x, item.p2.y - item.p1.y);
}


// --- src/app/inspector.js ---
// Properties panel for the current selection (left sidebar, below the tree).
// Fields come from the element schema; a selection of several elements of one
// type is edited together. Geometry (position/size or length/angle) on top.

const panel = document.getElementById('propertiesPanel');
const tagEl = document.getElementById('propertiesTag');
const titleEl = document.getElementById('propertiesTitle');
const infoEl = document.getElementById('propertiesInfo');
const bodyEl = document.getElementById('propertiesBody');

const SHAPE_NAMES = { rect: 'Rectangle', circle: 'Circle', arc: 'Arc', poly: 'Polygon', group: 'Group' };

let renderedKey = '';
let treeRefreshPending = false;

// Tree labels show live values (temperature, rate, ...); refresh at most once per frame.
function scheduleTreeRefresh() {
  if (treeRefreshPending) return;
  treeRefreshPending = true;
  requestAnimationFrame(() => {
    treeRefreshPending = false;
    renderElementTree();
  });
}

function selectionKey() {
  return app.selectedItems.map(i => i.id ?? '').join('|') + `#${app.selectedItems.length}#${app.isSimulating}`;
}

// Common schema type of the selection, or null when mixed / not editable.
function commonType(items) {
  const types = new Set(items.map(elementTypeOf));
  return types.size === 1 ? [...types][0] : null;
}

function headerFor(items, type) {
  const gids = new Set(items.map(i => i.groupId || null));
  const gid = gids.size === 1 ? [...gids][0] : null;
  if (gid && items.length > 1 && engine.elements.filter(e => e.groupId === gid).length === items.length) {
    const kind = shapeKind(gid);
    const what = type === 'wall' ? 'segments' : 'elements';
    return { tag: kind === 'group' ? 'GROUP' : SHAPE_NAMES[kind].toUpperCase(), title: `${groupName(gid, engine)} · ${items.length} ${what}` };
  }
  if (type) {
    const def = ELEMENT_TYPES[type];
    return { tag: def.tag, title: items.length > 1 ? `${items.length} × ${def.label}` : elementName(items[0], engine) };
  }
  return { tag: 'MIXED', title: `${items.length} elements` };
}

// ---------------------------------------------------------------------------
// Geometry: X/Y/W/H of the selection or length/angle of a single segment
// ---------------------------------------------------------------------------
function geometryValues() {
  const seg = getSingleSegment();
  if (seg) {
    const dx = seg.p2.x - seg.p1.x, dy = seg.p2.y - seg.p1.y;
    return { mode: 'segment', L: Math.round(Math.hypot(dx, dy)), A: Math.round(-Math.atan2(dy, dx) * 1800 / Math.PI) / 10 };
  }
  const b = getContentBounds();
  if (!b) return null;
  return { mode: 'box', X: Math.round(b.minX), Y: Math.round(b.minY), W: Math.round(b.width), H: Math.round(b.height) };
}

function renderGeometry(container) {
  const g = geometryValues();
  if (!g) return;
  const fields = g.mode === 'segment' ? [['L', 'Length', 'px'], ['A', 'Angle', '°']] : [['X', 'X'], ['Y', 'Y'], ['W', 'W'], ['H', 'H']];
  container.insertAdjacentHTML('beforeend', `
    <div class="properties-section">Geometry</div>
    <div class="prop-geometry" id="propGeometry">
      ${fields.map(([k, label]) => `<label class="prop-geo-field" title="${label}">${label.length > 1 ? label.slice(0, 1) : label}
        <input type="number" class="prop-num" data-geo="${k}" value="${g[k]}" step="1"></label>`).join('')}
    </div>`);
  container.querySelectorAll('[data-geo]').forEach(input => {
    input.addEventListener('focus', () => recordUndoState(false));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    input.addEventListener('change', () => applyGeometry(input.dataset.geo, parseFloat(input.value)));
  });
}

function applyGeometry(key, v) {
  if (!Number.isFinite(v)) return;
  const g = geometryValues();
  if (!g) return;
  if (g.mode === 'segment') {
    setSegmentGeometry(getSingleSegment(), key === 'L' ? Math.max(1, v) : g.L, key === 'A' ? v : g.A);
  } else if (key === 'X' || key === 'Y') {
    moveSelectedItems(key === 'X' ? v - g.X : 0, key === 'Y' ? v - g.Y : 0);
  } else {
    setSelectionSize(key === 'W' ? Math.max(1, v) : g.W, key === 'H' ? Math.max(1, v) : g.H);
  }
  scheduleTreeRefresh();
}

// ---------------------------------------------------------------------------
// Extras for single elements
// ---------------------------------------------------------------------------
function renderSensorBinding(container, item) {
  const bound = item.pistonBinding?.pistonId || '';
  const edge = item.pistonBinding?.edge || 'right';
  const pistons = engine.pistons.map((p, i) => `<option value="${p.id}" ${bound === p.id ? 'selected' : ''}>Piston ${i + 1}</option>`).join('');
  container.insertAdjacentHTML('beforeend', `
    <div class="properties-section">Piston Binding</div>
    <div class="prop-row"><div class="prop-label"><span>Follows Piston</span></div>
      <select class="prop-select" id="propBindPiston"><option value="">None (static zone)</option>${pistons}</select></div>
    <div class="prop-row" ${bound ? '' : 'hidden'} id="propBindEdgeRow"><div class="prop-label"><span>Moving Edge</span></div>
      <select class="prop-select" id="propBindEdge">
        <option value="right" ${edge === 'right' ? 'selected' : ''}>Right edge (zone left of piston)</option>
        <option value="left" ${edge === 'left' ? 'selected' : ''}>Left edge (zone right of piston)</option>
        <option value="bottom" ${edge === 'bottom' ? 'selected' : ''}>Bottom edge (zone above piston)</option>
        <option value="top" ${edge === 'top' ? 'selected' : ''}>Top edge (zone below piston)</option>
      </select></div>`);
  const pistonSel = container.querySelector('#propBindPiston');
  const edgeSel = container.querySelector('#propBindEdge');
  const apply = () => {
    recordUndoState(false);
    const p = engine.getPistonById(pistonSel.value);
    if (!p) item.unbindPiston();
    else item.bindToPiston(p, edgeSel.value, true);
    renderInspector(true);
  };
  pistonSel.addEventListener('change', () => {
    const p = engine.getPistonById(pistonSel.value);
    if (p) {
      // Pick the edge facing the piston
      const cx = item.x + item.width * 0.5, cy = item.y + item.height * 0.5;
      edgeSel.value = p.orientation === 'horizontal' ? (cx < p.x ? 'right' : 'left') : (cy < p.y ? 'bottom' : 'top');
    }
    apply();
  });
  edgeSel.addEventListener('change', apply);
}

function renderActions(container, items, type) {
  const buttons = [];
  if (canGroupSelection()) buttons.push(['group', 'Group']);
  if (canUngroupSelection()) buttons.push(['ungroup', items.every(i => i.groupId && shapeKind(i.groupId) !== 'group') ? 'Break Shape' : 'Ungroup']);
  if (type === 'gas' && items.length === 1) buttons.push(['particles', 'Select Particles']);
  if (!items.every(i => i instanceof Particle)) buttons.push(['duplicate', 'Duplicate']);
  buttons.push(['delete', 'Delete', 'danger']);
  container.insertAdjacentHTML('beforeend', `<div class="properties-actions">${buttons.map(([a, label, cls]) =>
    `<button type="button" class="prop-action ${cls || ''}" data-action="${a}">${label}</button>`).join('')}</div>`);
  container.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
    const a = btn.dataset.action;
    if (a === 'group') groupSelection();
    else if (a === 'ungroup') ungroupSelection();
    else if (a === 'duplicate') duplicateSelection();
    else if (a === 'delete') deleteSelectedItems();
    else if (a === 'particles') {
      const pts = items[0].getActiveParticles(engine);
      pts.forEach(p => { p.selected = true; });
      app.selectedItems = [...pts];
      updateElementsList();
    }
  }));
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------
// Rebuilds the panel when the selection changed (or when forced).
function renderInspector(force = false) {
  if (!panel) return;
  const key = selectionKey();
  if (!force && key === renderedKey && panel.contains(document.activeElement)) return;
  renderedKey = key;

  const items = app.selectedItems;
  if (items.length === 0 || app.isSimulating) {
    panel.hidden = true;
    bodyEl.innerHTML = '';
    return;
  }
  panel.hidden = false;

  if (items.every(i => i instanceof Particle)) {
    tagEl.textContent = 'PARTICLES';
    titleEl.textContent = `${items.length} particle${items.length > 1 ? 's' : ''}`;
    infoEl.hidden = true;
    bodyEl.innerHTML = '';
    renderActions(bodyEl, items, null);
    return;
  }

  const type = commonType(items);
  const head = headerFor(items, type);
  tagEl.textContent = head.tag;
  titleEl.textContent = head.title;
  bodyEl.innerHTML = '';
  updateInfo();

  if (!items.some(i => i instanceof ParticleGroup)) renderGeometry(bodyEl);

  if (type && fieldsFor(type, 'inspector').length > 0) {
    bodyEl.insertAdjacentHTML('beforeend', '<div class="properties-section">Properties</div><div id="propFields"></div>');
    const values = readValues(type, items[0], 'inspector');
    renderPropertyForm(bodyEl.querySelector('#propFields'), type, values, {
      context: 'inspector',
      onBeginEdit: () => recordUndoState(false),
      onChange: (k, v) => {
        const field = fieldsFor(type, 'inspector').find(f => f.key === k);
        items.forEach(it => setFieldValue(field, it, v, engine));
        updateInfo();
        scheduleTreeRefresh();
      }
    });
  }

  if (items.length === 1 && items[0] instanceof SensorZone) renderSensorBinding(bodyEl, items[0]);
  renderActions(bodyEl, items, type);
}

function updateInfo() {
  const items = app.selectedItems;
  const type = items.length === 1 ? elementTypeOf(items[0]) : null;
  const info = type && ELEMENT_TYPES[type].info;
  infoEl.hidden = !info;
  if (info) infoEl.textContent = info(items[0], engine);
}

// Live values (info line, geometry fields that aren't being edited), ~4 Hz.
function refreshInspectorLive() {
  if (!panel || panel.hidden) return;
  updateInfo();
  const geo = bodyEl.querySelector('#propGeometry');
  const g = geo && geometryValues();
  if (!g) return;
  geo.querySelectorAll('[data-geo]').forEach(input => {
    if (document.activeElement !== input && g[input.dataset.geo] !== undefined) input.value = g[input.dataset.geo];
  });
}


// --- src/app/elementTree.js ---
// Element tree in the left sidebar: shapes/groups with their segments,
// type icons, names (double-click to rename), live values, search filter,
// hover highlight on the canvas, multi-selection and layer drag & drop.

// Re-renders the element tree and the properties panel.
function updateElementsList() {
  renderElementTree();
  renderInspector();
}

const expandedGroups = new Set();
let filterText = '';

// ---------------------------------------------------------------------------
// Icons (taken from the ribbon buttons) and live values
// ---------------------------------------------------------------------------
const TYPE_ICON_SOURCES = {
  wall: '#toolWallPoly', manual_valve: '#toolValveManual', check_valve: '#toolValveCheck', relief_valve: '#toolValvePRV',
  throttle_valve: '#toolValveThrottle', reservoir: '#toolSolidRes', heat_exchanger: '#toolHeatEx', regenerator: '#toolRegen',
  thermal_block: '#toolStorage', emitter: '#toolEmitter', sink: '#toolSink', regulator: '#toolRegulator', gas: '#toolGas',
  sensor: '#toolSensor', text: '#toolText'
};
const PISTON_ICON_SOURCES = { free: '#toolPistonFree', spring: '#toolPistonSpring', motorized: '#toolPistonMotor', damper: '#toolPistonDamper' };
const GROUP_ICON_SOURCES = { rect: '#toolWallRect', circle: '#toolWallCircle', arc: '#toolWallArc', poly: '#toolWallPoly', group: '#btnGroupSelected' };
const iconCache = new Map();

function iconFrom(selector) {
  if (!iconCache.has(selector)) {
    const svg = document.querySelector(`${selector} svg`);
    iconCache.set(selector, svg ? svg.outerHTML.replace(/width="\d+" height="\d+"/, 'width="13" height="13"') : '');
  }
  return iconCache.get(selector);
}

function itemIcon(item) {
  const type = elementTypeOf(item);
  if (type === 'piston') return iconFrom(PISTON_ICON_SOURCES[item.mode] || '#toolPistonFree');
  return iconFrom(TYPE_ICON_SOURCES[type] || '#toolSelect');
}

const K = (t) => `${Math.round(t)} K`;

// Short live value next to the name.
function itemMeta(item) {
  switch (elementTypeOf(item)) {
    case 'wall': return item.conductivity > 0 ? `κ ${item.conductivity.toFixed(2)} · ${K(item.temperature)}` : 'insulated';
    case 'manual_valve': return item.isOpen ? 'open' : 'closed';
    case 'check_valve': return item.allowedDirection > 0 ? 'forward' : 'reverse';
    case 'relief_valve': return `${item.triggerPressure} Pa`;
    case 'throttle_valve': return `${Math.round(item.openRatio * 100)}%`;
    case 'piston': return { free: 'displacer', spring: 'accumulator', motorized: 'compressor', damper: 'expander' }[item.mode] || item.mode;
    case 'reservoir':
    case 'heat_exchanger':
    case 'thermal_block': return K(item.temperature);
    case 'regenerator': return `${K(Math.min(...item.temperatures))}–${K(Math.max(...item.temperatures))}`;
    case 'emitter': return `${item.rate}/s`;
    case 'sink': return item.tempFilterMode === 'all' ? 'all' : `${item.tempFilterMode === 'above' ? '>' : '<'} ${K(item.filterTemperature)}`;
    case 'regulator': return `${item.currentCount || 0}/${item.targetCount}`;
    case 'gas': return `${item.getActiveCount(engine)} pts`;
    case 'sensor': return item.temperature ? K(item.temperature) : '';
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Tree model: z-ordered entries, grouped elements collected at their first member
// ---------------------------------------------------------------------------
function buildEntries() {
  const entries = [];
  const groups = new Map();
  engine.elements.forEach((item, index) => {
    if (item.groupId) {
      if (!groups.has(item.groupId)) {
        const g = { kind: 'group', groupId: item.groupId, members: [] };
        groups.set(item.groupId, g);
        entries.push(g);
      }
      groups.get(item.groupId).members.push({ item, index });
    } else {
      entries.push({ kind: 'item', item, index });
    }
  });
  // A "group" of one element is shown as that element
  return entries.map(e => (e.kind === 'group' && e.members.length === 1 ? { kind: 'item', ...e.members[0] } : e));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function treeRowHtml({ index, icon, name, meta, selected, depth = 0, groupId = null, expanded = null, deletable = true, ungroup = false }) {
  const attrs = groupId ? `data-group="${esc(groupId)}"` : `data-index="${index}"`;
  const caret = expanded === null ? '<span class="tree-caret-spacer"></span>'
    : `<button type="button" class="tree-caret" title="${expanded ? 'Collapse' : 'Expand'}">${expanded ? '▾' : '▸'}</button>`;
  return `
    <div class="tree-row ${selected ? 'selected' : ''} ${depth ? 'tree-child' : ''}" ${attrs} ${groupId || depth ? '' : 'draggable="true"'}>
      ${caret}
      <span class="tree-icon">${icon}</span>
      <span class="tree-name" title="Double-click to rename">${esc(name)}</span>
      <span class="tree-meta">${esc(meta)}</span>
      <span class="tree-actions">
        ${ungroup ? '<button type="button" class="tree-btn" data-ungroup title="Ungroup / break shape">⧉</button>' : ''}
        ${deletable ? `<button type="button" class="tree-btn tree-del" title="Delete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>` : ''}
      </span>
    </div>`;
}

function renderElementTree() {
  if (!elementsListContainer) return;
  const elements = engine.elements || [];
  elementCountBadge.textContent = elements.length;
  ensureFilterInput();

  if (elements.length === 0) {
    elementsListContainer.innerHTML = '<p class="tree-empty">No elements yet. Pick a tool in the ribbon and draw on the canvas.</p>';
    return;
  }

  const sel = new Set(app.selectedItems);
  const filter = filterText.trim().toLowerCase();
  const matches = (name) => !filter || name.toLowerCase().includes(filter);
  let html = '';

  for (const entry of buildEntries()) {
    if (entry.kind === 'item') {
      const name = elementName(entry.item, engine);
      if (!matches(name)) continue;
      html += treeRowHtml({ index: entry.index, icon: itemIcon(entry.item), name, meta: itemMeta(entry.item), selected: sel.has(entry.item) });
      continue;
    }
    const gname = groupName(entry.groupId, engine);
    const childNames = entry.members.map(m => elementName(m.item, engine));
    if (!matches(gname) && !childNames.some(matches)) continue;
    const allWalls = entry.members.every(m => m.item instanceof Wall);
    const kind = groupKindOf(entry.groupId);
    const expanded = expandedGroups.has(entry.groupId) || (!!filter && !matches(gname));
    html += treeRowHtml({
      groupId: entry.groupId, icon: iconFrom(GROUP_ICON_SOURCES[kind]), name: gname,
      meta: `${entry.members.length} ${allWalls ? 'segments' : 'elements'}`,
      selected: entry.members.every(m => sel.has(m.item)), expanded, ungroup: true
    });
    if (expanded) {
      entry.members.forEach((m, i) => {
        html += treeRowHtml({ index: m.index, depth: 1, icon: itemIcon(m.item), name: childNames[i], meta: itemMeta(m.item), selected: sel.has(m.item), deletable: false });
      });
    }
  }
  elementsListContainer.innerHTML = html || '<p class="tree-empty">No element matches the filter.</p>';
  bindTreeEvents();
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
function rowItems(row) {
  if (row.dataset.group !== undefined) return engine.elements.filter(e => e.groupId === row.dataset.group);
  const item = engine.elements[parseInt(row.dataset.index, 10)];
  return item ? [item] : [];
}

function selectFromRow(row, e) {
  const items = rowItems(row);
  if (items.length === 0) return;
  if (items.length === 1 && window.sequencerUI?.handleItemPicked(items[0])) return;
  const isChild = row.classList.contains('tree-child');
  const target = isChild ? items : (items[0].groupId ? getAllGroupItems(items[0]) : items);
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    const allIn = target.every(i => app.selectedItems.includes(i));
    app.selectedItems = allIn ? app.selectedItems.filter(i => !target.includes(i)) : [...app.selectedItems, ...target.filter(i => !app.selectedItems.includes(i))];
  } else {
    app.selectedItems = target;
  }
  updateElementsList();
}

function startRename(row) {
  const nameEl = row.querySelector('.tree-name');
  const items = rowItems(row);
  if (!nameEl || items.length === 0) return;
  const input = document.createElement('input');
  input.className = 'tree-rename';
  input.value = nameEl.textContent;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (commit) => {
    if (done) return;
    done = true;
    if (commit && input.value.trim() && input.value !== nameEl.textContent) {
      recordUndoState(false);
      if (row.dataset.group !== undefined) renameGroup(row.dataset.group, input.value, engine);
      else renameElement(items[0], input.value);
    }
    updateElementsList();
    window.sequencerUI?.render();
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

let dragFromIndex = null;

function bindTreeEvents() {
  elementsListContainer.querySelectorAll('.tree-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.tree-actions') || e.target.closest('.tree-caret') || e.target.closest('.tree-rename')) return;
      selectFromRow(row, e);
    });
    row.querySelector('.tree-name')?.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startRename(row);
    });
    row.addEventListener('mouseenter', () => { renderer.hoverItems = rowItems(row); });
    row.addEventListener('mouseleave', () => { renderer.hoverItems = null; });

    row.querySelector('.tree-caret')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = row.dataset.group;
      if (expandedGroups.has(gid)) expandedGroups.delete(gid);
      else expandedGroups.add(gid);
      renderElementTree();
    });
    row.querySelector('[data-ungroup]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      recordUndoState(false);
      rowItems(row).forEach(i => { delete i.groupId; });
      updateElementsList();
    });
    row.querySelector('.tree-del')?.addEventListener('click', (e) => {
      e.stopPropagation();
      app.selectedItems = rowItems(row);
      deleteSelectedItems();
      renderer.hoverItems = null;
    });

    // Layer order: drag single rows onto another row
    if (row.getAttribute('draggable') === 'true') {
      row.addEventListener('dragstart', (e) => {
        dragFromIndex = parseInt(row.dataset.index, 10);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragFromIndex));
      });
      row.addEventListener('dragend', () => {
        dragFromIndex = null;
        elementsListContainer.querySelectorAll('.tree-row').forEach(r => r.classList.remove('dragging', 'drag-over'));
      });
    }
    if (row.dataset.index !== undefined && !row.classList.contains('tree-child')) {
      row.addEventListener('dragover', (e) => {
        if (dragFromIndex === null) return;
        e.preventDefault();
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const to = parseInt(row.dataset.index, 10);
        if (dragFromIndex !== null && dragFromIndex !== to) {
          recordUndoState(false);
          engine.reorderElements(dragFromIndex, to);
          updateElementsList();
        }
      });
    }
  });

  elementsListContainer.querySelector('.tree-row.selected')?.scrollIntoView({ block: 'nearest' });
}

// Filter box above the tree (created once)
function ensureFilterInput() {
  if (document.getElementById('treeFilter')) return;
  const input = document.createElement('input');
  input.id = 'treeFilter';
  input.type = 'search';
  input.className = 'tree-filter';
  input.placeholder = 'Filter elements…';
  input.addEventListener('input', () => {
    filterText = input.value;
    renderElementTree();
  });
  input.addEventListener('keydown', (e) => e.stopPropagation());
  elementsListContainer.parentElement.insertBefore(input, elementsListContainer);
}

// Live values in the tree (~4 Hz), without rebuilding the rows.
function refreshTreeLive() {
  if (!elementsListContainer) return;
  elementsListContainer.querySelectorAll('.tree-row[data-index]').forEach(row => {
    const item = engine.elements[parseInt(row.dataset.index, 10)];
    const meta = row.querySelector('.tree-meta');
    if (item && meta) {
      const text = itemMeta(item);
      if (meta.textContent !== text) meta.textContent = text;
    }
  });
}


// --- src/app/playback.js ---
// Playback controls, physics model/gravity toggles and zoom.

// ============================================================================
// Playback Controls & Physics Model Toggle
// ============================================================================
modelToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modelToggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    engine.simModel = btn.dataset.model;
  });
});

function updateModelToggleUI() {
  modelToggleBtns.forEach(btn => {
    if (btn.dataset.model === (engine.simModel || 'hard_sphere')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateGravityUI() {
  if (!btnToggleGravity) return;
  if (engine.gravityEnabled) {
    btnToggleGravity.classList.add('active');
  } else {
    btnToggleGravity.classList.remove('active');
  }
}

btnToggleGravity?.addEventListener('click', () => {
  engine.gravityEnabled = !engine.gravityEnabled;
  updateGravityUI();
});

btnPlayPause.addEventListener('click', () => {
  if (!app.isSimulating) {
    engine.saveSimStartSnapshot();
    app.isSimulating = true;
    engine.syncParticlesToGPU();
    engine.syncWallsToGPU();
    document.querySelector('.ribbon-row-construction')?.classList.add('simulating-locked');
    document.getElementById('btnToolbarClear')?.setAttribute('disabled', 'true');
    app.activeTool = 'select';
    ribbonToolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toolSelect')?.classList.add('active');
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    app.selectedItems = [];
    resetPolygonDraft();
    pointer.arcSteps = [];
    closeContextMenu();
  }

  engine.isPaused = !engine.isPaused;
  if (engine.isPaused) {
    playIcon.classList.add('is-play');
    playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  } else {
    playIcon.classList.remove('is-play');
    playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>';
  }
});

btnStep.addEventListener('click', () => {
  if (!app.isSimulating) {
    engine.saveSimStartSnapshot();
    app.isSimulating = true;
    engine.syncParticlesToGPU();
    engine.syncWallsToGPU();
    document.querySelector('.ribbon-row-construction')?.classList.add('simulating-locked');
    document.getElementById('btnToolbarClear')?.setAttribute('disabled', 'true');
    app.activeTool = 'select';
    ribbonToolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toolSelect')?.classList.add('active');
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    closeContextMenu();
  }
  pushHistoryFrame();
  engine.isPaused = false;
  engine.step(0.016);
  engine.isPaused = true;
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
});

btnStepBack.addEventListener('click', () => {
  popHistoryFrame();
});

btnStopReset.addEventListener('click', () => {
  app.isSimulating = false;
  engine.isPaused = true;
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  engine.restoreSimStartSnapshot();
  
  app.selectedItems = [];
  clearHistoryBuffer();
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
  timeVal.textContent = '0.00 s';
});

document.getElementById('btnUnlockSim')?.addEventListener('click', (e) => {
  e.stopPropagation();
  btnStopReset.click();
});

speedSlider.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  engine.timeScale = v;
  speedVal.textContent = `${v.toFixed(2)}×`;
});

// Zoom Controls
function updateZoomText() {
  zoomDisplay.textContent = `${Math.round(renderer.zoom * 100)}%`;
}
btnZoomIn.addEventListener('click', () => {
  renderer.zoomAt(canvas.width * 0.5, canvas.height * 0.5, 1.2);
  updateZoomText();
});
btnZoomOut.addEventListener('click', () => {
  renderer.zoomAt(canvas.width * 0.5, canvas.height * 0.5, 0.83);
  updateZoomText();
});
btnResetView.addEventListener('click', fitViewToScene);

// World-space bounding box of all scene elements and edit-time particles.
function getSceneBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  for (const item of engine.elements) {
    if (item.p1 && item.p2) {
      add(item.p1.x, item.p1.y);
      add(item.p2.x, item.p2.y);
    } else if (typeof item.getBounds === 'function') {
      const b = item.getBounds();
      add(b.left, b.top);
      add(b.right, b.bottom);
    } else if (item.x !== undefined && item.width !== undefined) {
      add(item.x, item.y);
      add(item.x + item.width, item.y + item.height);
    }
    if (typeof item.getHandlePositions === 'function') {
      const h = item.getHandlePositions();
      add(h.minHandle.x, h.minHandle.y);
      add(h.maxHandle.x, h.maxHandle.y);
    }
  }
  for (const p of engine.particles) add(p.pos.x, p.pos.y);
  return minX <= maxX ? { minX, minY, maxX, maxY } : null;
}

// Screen rectangle not covered by the floating header, sidebars and dock.
// Uses offset* (layout) values so running CSS transitions don't skew it.
function getVisibleCanvasRect() {
  let left = 0, top = 0, right = canvas.width, bottom = canvas.height;
  const header = document.querySelector('.floating-header');
  const sideL = document.getElementById('sidebarLeft');
  const sideR = document.querySelector('.floating-sidebar.floating-right');
  const dock = document.getElementById('unifiedBottomDock');
  if (header?.offsetWidth) top = header.offsetTop + header.offsetHeight;
  if (sideL?.offsetWidth) left = sideL.offsetLeft + sideL.offsetWidth;
  if (sideR?.offsetWidth) right = sideR.offsetLeft;
  if (dock?.offsetWidth) bottom = dock.offsetTop;
  if (right - left < 200 || bottom - top < 150) return { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
  return { left, top, right, bottom };
}

// Zoom and pan so the whole scene fits into the visible canvas area.
function fitViewToScene() {
  const view = getVisibleCanvasRect();
  const bounds = getSceneBounds();
  const margin = 40;
  const viewW = view.right - view.left - margin * 2;
  const viewH = view.bottom - view.top - margin * 2;
  const cx = (view.left + view.right) * 0.5;
  const cy = (view.top + view.bottom) * 0.5;
  if (viewW < 50 || viewH < 50) return; // canvas not laid out yet (hidden window)
  if (!bounds) {
    renderer.setViewport(cx, cy, 1.0);
  } else {
    const w = Math.max(bounds.maxX - bounds.minX, 50);
    const h = Math.max(bounds.maxY - bounds.minY, 50);
    renderer.setViewport(0, 0, Math.min(viewW / w, viewH / h, 1.5));
    const z = renderer.zoom;
    renderer.setViewport(cx - (bounds.minX + bounds.maxX) * 0.5 * z, cy - (bounds.minY + bounds.maxY) * 0.5 * z, z);
  }
  updateZoomText();
}


// --- src/app/splash.js ---
// Splash screen, presets, recent profiles and the ambient background scene.

// ============================================================================
// Splash Screen / Welcome Dashboard Controller
// ============================================================================
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'recently';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getRecentProfiles() {
  try {
    const raw = localStorage.getItem('thermo_recent_profiles');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function addRecentProfile(name, stateData) {
  try {
    let list = getRecentProfiles();
    const particleCount = stateData.particles ? stateData.particles.length : (stateData.gasRasters ? stateData.gasRasters.reduce((s, r) => s + (r.count || 0), 0) : 0);
    const elementCount = (stateData.walls?.length || 0) +
      (stateData.pistons?.length || 0) +
      (stateData.reservoirs?.length || 0) +
      (stateData.emitters?.length || 0) +
      (stateData.sinks?.length || 0) +
      (stateData.thermalBlocks?.length || 0) +
      (stateData.heatExchangers?.length || 0) +
      (stateData.regenerators?.length || 0) +
      (stateData.sensors?.length || 0) +
      (stateData.throttleValves?.length || 0);

    const cleanName = (name || 'Untitled Simulation').trim();
    list = list.filter(item => item.name !== cleanName);
    list.unshift({
      id: 'rec_' + Date.now(),
      name: cleanName,
      timestamp: Date.now(),
      particleCount,
      elementCount,
      data: stateData
    });
    if (list.length > 8) list = list.slice(0, 8);
    localStorage.setItem('thermo_recent_profiles', JSON.stringify(list));
    renderRecentProfiles();
  } catch (err) {
    console.warn('Failed to save recent profile:', err);
  }
}

function clearRecentProfiles() {
  localStorage.removeItem('thermo_recent_profiles');
  renderRecentProfiles();
}

function renderRecentProfiles() {
  if (!splashRecentContainer) return;
  const list = getRecentProfiles();
  if (list.length === 0) {
    splashRecentContainer.innerHTML = `
      <div class="splash-empty-state">
        <p>No recent profiles yet</p>
        <span>Profiles you save or open will appear here</span>
      </div>
    `;
    return;
  }

  splashRecentContainer.innerHTML = '';
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'splash-recent-item';
    el.innerHTML = `
      <div class="splash-recent-left">
        <span class="splash-recent-name">${item.name}</span>
        <div class="splash-recent-meta">
          <span class="splash-recent-badge">${item.particleCount || 0} particles</span>
          <span class="splash-recent-badge">${item.elementCount || 0} elements</span>
          <span>${formatTimeAgo(item.timestamp)}</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    `;
    el.addEventListener('click', () => {
      openScene(item.name, item.data);
    });
    splashRecentContainer.appendChild(el);
  });
}

function renderSplashPresets() {
  if (!splashPresetsContainer) return;
  const presetsObj = window.Presets || Presets || {};
  const keys = Object.keys(presetsObj);
  if (keys.length === 0) {
    splashPresetsContainer.innerHTML = '<div class="splash-empty-state"><p>No presets available</p></div>';
    return;
  }

  splashPresetsContainer.innerHTML = '';
  keys.forEach(key => {
    const p = presetsObj[key];
    const card = document.createElement('div');
    card.className = 'splash-preset-card';
    card.innerHTML = `
      <div class="splash-preset-info">
        <div class="splash-preset-top">
          <span class="splash-preset-name">${p.name}</span>
          <span class="splash-preset-badge">${p.category || 'Thermodynamics'}</span>
        </div>
        <p class="splash-preset-desc">${p.description}</p>
      </div>
      <div class="splash-preset-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
    card.addEventListener('click', () => {
      stopAndResetSimulationForNewScene();
      p.load(engine);
      openScene(p.name, engine.exportState(p.name));
    });
    splashPresetsContainer.appendChild(card);
  });
}

function setupAmbientScene() {
  engine.clear();
  engine.timeScale = 1.0;
  engine.isPaused = false;
  app.isAmbientSim = true;
  
  // Calculate world area corresponding to current viewport
  const tl = renderer.screenToWorld ? renderer.screenToWorld(0, 0) : { x: -400, y: -250 };
  const br = renderer.screenToWorld ? renderer.screenToWorld(canvas.width || window.innerWidth || 1400, canvas.height || window.innerHeight || 900) : { x: 1400, y: 850 };
  
  const spanX = Math.max(800, br.x - tl.x);
  const spanY = Math.max(500, br.y - tl.y);
  
  // Vibrant ambient particle cloud drifting freely across the whole screen - NO walls/box borders!
  engine.spawnGasRaster(tl.x + 20, tl.y + 20, spanX - 40, spanY - 40, 220, 1.2, 440, 'maxwell_boltzmann');
  
  // Clear element & group tracking so ambient background has 0 elements
  engine.particleGroups = [];
  engine.elements = [];
  
  // Soft Brownian colloidal particles drifting around
  for (let i = 0; i < 6; i++) {
    const px = tl.x + spanX * (0.12 + 0.15 * i);
    const py = tl.y + spanY * (0.18 + 0.14 * (i % 5));
    const vx = (Math.random() - 0.5) * 55;
    const vy = (Math.random() - 0.5) * 55;
    const col = engine.addParticle(px, py, vx, vy, 8.0 + (i % 3) * 3.5);
    col.tag = 'colloid';
  }
}

function showSplashScreen(options = {}) {
  app.isSplashActive = true;
  document.body.classList.add('splash-mode');
  if (splashOverlay) {
    splashOverlay.classList.remove('hidden');
    splashOverlay.style.display = 'flex';
  }
  
  const isReturning = options.isReturning || app.hasActiveSession;
  if (btnSplashResume) {
    btnSplashResume.style.display = isReturning ? 'flex' : 'none';
  }
  if (btnSplashClose) {
    btnSplashClose.style.display = isReturning ? 'flex' : 'none';
  }
  
  renderRecentProfiles();
  renderSplashPresets();
}

function hideSplashScreen() {
  app.isSplashActive = false;
  app.isAmbientSim = false;
  app.hasActiveSession = true;
  document.body.classList.remove('splash-mode');
  if (splashOverlay) {
    splashOverlay.classList.add('hidden');
    splashOverlay.style.display = 'none';
  }
}

// Splash Screen Action Event Listeners
btnSplashNew?.addEventListener('click', () => {
  stopAndResetSimulationForNewScene();
  engine.clear();
  engine.gravityEnabled = false;
  openScene('Untitled Simulation', engine.exportState('Untitled Simulation'), { addToRecent: false });
});

btnSplashOpen?.addEventListener('click', () => {
  fileImportInput.click();
});

btnSplashResume?.addEventListener('click', () => {
  hideSplashScreen();
});

btnSplashClose?.addEventListener('click', () => {
  hideSplashScreen();
});

brandBadge?.addEventListener('click', () => {
  showSplashScreen({ isReturning: app.hasActiveSession });
});

brandTitle?.addEventListener('click', () => {
  showSplashScreen({ isReturning: app.hasActiveSession });
});

btnClearRecent?.addEventListener('click', (e) => {
  e.stopPropagation();
  clearRecentProfiles();
});

splashOverlay?.addEventListener('click', (e) => {
  if (e.target === splashOverlay && app.hasActiveSession) {
    hideSplashScreen();
  }
});


// --- src/app/menus.js ---
// Menu bar (File/Edit/View/Simulation/Help), scene loading/saving and the Save As dialog.

// ============================================================================
// Desktop Menu Bar Logic
// ============================================================================
const menuItems = document.querySelectorAll('.menu-item');
let isAnyMenuOpen = false;

function closeAllMenus() {
  menuItems.forEach(item => item.classList.remove('open'));
  isAnyMenuOpen = false;
}

function openMenu(item) {
  closeAllMenus();
  refreshMenuState();
  item.classList.add('open');
  isAnyMenuOpen = true;
}

menuItems.forEach(item => {
  const btn = item.querySelector('.menu-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (item.classList.contains('open')) closeAllMenus();
    else openMenu(item);
  });

  item.addEventListener('mouseenter', () => {
    if (isAnyMenuOpen && !item.classList.contains('open')) openMenu(item);
  });
});

window.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-item')) {
    closeAllMenus();
  }
});

// Registers a menu entry: closes the menu and runs the action unless disabled.
function onMenu(id, action) {
  const el = document.getElementById(id);
  el?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (el.classList.contains('disabled')) return;
    closeAllMenus();
    action();
  });
}

function setEntry(id, { enabled = true, checked } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('disabled', !enabled);
  if (checked !== undefined) el.classList.toggle('checked', !!checked);
}

// Enabled/checked state of all entries, evaluated whenever a menu opens.
function refreshMenuState() {
  const editing = !app.isSimulating;
  const hasSel = editing && app.selectedItems.length > 0;

  setEntry('menuEntryClear', { enabled: editing });
  setEntry('menuEntryUndo', { enabled: editing && undoStack.length > 0 });
  setEntry('menuEntryRedo', { enabled: editing && redoStack.length > 0 });
  setEntry('menuEntrySelectAll', { enabled: editing && engine.elements.length > 0 });
  setEntry('menuEntryDuplicate', { enabled: hasSel });
  setEntry('menuEntryGroup', { enabled: editing && canGroupSelection() });
  setEntry('menuEntryUngroup', { enabled: editing && canUngroupSelection() });
  setEntry('menuEntryRotate', { enabled: hasSel });
  setEntry('menuEntryFlipH', { enabled: hasSel });
  setEntry('menuEntryFlipV', { enabled: hasSel });
  setEntry('menuEntryDelete', { enabled: hasSel });

  setEntry('menuEntryToggleGrid', { checked: renderer.showGrid });
  setEntry('menuEntryGrid10', { checked: renderer.gridSize === 10 });
  setEntry('menuEntryGrid20', { checked: renderer.gridSize === 20 });
  setEntry('menuEntryGrid40', { checked: renderer.gridSize === 40 });
  setEntry('menuEntryToggleSnap', { checked: renderer.snapToGrid });
  setEntry('menuEntryToggleVectors', { checked: renderer.showVectors });
  setEntry('menuEntryToggleColor', { checked: renderer.colorByVelocity });

  const labelPlay = document.getElementById('labelMenuPlay');
  if (labelPlay) labelPlay.textContent = (app.isSimulating && !engine.isPaused) ? 'Pause' : 'Play';
  setEntry('menuEntryStepBack', { enabled: app.isSimulating });
  setEntry('menuEntryStop', { enabled: app.isSimulating });
  const model = engine.simModel || 'hard_sphere';
  setEntry('menuEntryModelIdeal', { checked: model === 'hard_sphere' });
  setEntry('menuEntryModelReal', { checked: model === 'lennard_jones' });
  setEntry('menuEntryGravity', { checked: engine.gravityEnabled });
  setEntry('menuEntrySequencer', { checked: document.body.classList.contains('sequencer-expanded') });
}

// ============================================================================
// Scene Lifecycle: open, new, revert, save
// ============================================================================
const PLAY_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';

function setProjectName(name) {
  app.currentProjectName = name;
  headerProjectTitle.textContent = `${name}.json`;
}

function refreshSceneUI() {
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
  updateModelToggleUI();
  updateGravityUI();
  sequencerUI?.render();
}

function stopAndResetSimulationForNewScene() {
  app.isSimulating = false;
  engine.isPaused = true;
  app.isAmbientSim = false;

  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  btnToolbarClear?.removeAttribute('disabled');

  playIcon.classList.add('is-play');
  playIcon.innerHTML = PLAY_ICON;

  engine.totalTime = 0;
  timeVal.textContent = '0.00 s';
  clearHistoryBuffer();
  undoStack.length = 0;
  redoStack.length = 0;
  app.selectedItems = [];
  resetPolygonDraft();
  pointer.arcSteps = [];
  closeContextMenu();
}

// Loads a scene state as the new document (presets, recent profiles, files).
function openScene(name, data, { addToRecent = true } = {}) {
  stopAndResetSimulationForNewScene();
  data.profileName = name;
  setProjectName(name);
  engine.setLoadedProfile(data);
  refreshSceneUI();
  if (addToRecent) addRecentProfile(name, data);
  app.hasActiveSession = true;
  hideSplashScreen();
  fitViewToScene();
}

function stopSimulationIfRunning() {
  if (app.isSimulating) btnStopReset.click();
}

// Back to the last opened/saved state. Undoable.
function revertToSaved() {
  stopSimulationIfRunning();
  recordUndoState();
  engine.resetToLoadedProfile();
  if (engine.currentProfileName) setProjectName(engine.currentProfileName);
  app.selectedItems = [];
  resetPolygonDraft();
  pointer.arcSteps = [];
  clearHistoryBuffer();
  timeVal.textContent = '0.00 s';
  refreshSceneUI();
}

// Empty canvas as a new untitled document. Undoable (restores the elements).
function newCanvas() {
  if (app.isSimulating) return;
  recordUndoState();
  engine.clear();
  resetPolygonDraft();
  pointer.arcSteps = [];
  app.selectedItems = [];
  clearHistoryBuffer();
  setProjectName('Untitled Simulation');
  engine.currentProfileName = app.currentProjectName;
  engine.loadedProfileJSON = JSON.stringify(engine.exportState(app.currentProjectName));
  refreshSceneUI();
}

// The design as built: while simulating that is the state at play time.
function getSaveState(name) {
  const state = (app.isSimulating && engine.simStartSnapshot)
    ? JSON.parse(engine.simStartSnapshot)
    : engine.exportState(name);
  state.profileName = name;
  return state;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const safeFileName = (name) => name.replace(/[^a-zA-Z0-9_-]/g, '_');

function saveProject(name = app.currentProjectName) {
  setProjectName(name);
  const state = getSaveState(name);
  engine.currentProfileName = name;
  engine.loadedProfileJSON = JSON.stringify(state);
  addRecentProfile(name, state);
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `${safeFileName(name)}.json`);
}

// PNG of the visible canvas area (background, particles and geometry layers).
function exportCanvasPNG() {
  const rect = getVisibleCanvasRect();
  const w = Math.round(rect.right - rect.left);
  const h = Math.round(rect.bottom - rect.top);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-app').trim() || '#101216';
  ctx.fillRect(0, 0, w, h);
  // Re-render first so the WebGPU canvas still holds this frame's image.
  renderer.render(engine, app.selectedItems, !app.isSimulating);
  for (const layer of [bgCanvas, gpuCanvas, canvas]) {
    if (layer) ctx.drawImage(layer, rect.left, rect.top, w, h, 0, 0, w, h);
  }
  out.toBlob(blob => { if (blob) downloadBlob(blob, `${safeFileName(app.currentProjectName)}.png`); }, 'image/png');
}

// File Menu
onMenu('menuEntryClear', newCanvas);
onMenu('menuEntryImport', () => fileImportInput.click());
onMenu('menuEntryWelcome', () => showSplashScreen({ isReturning: true }));
onMenu('menuEntrySave', () => saveProject());
onMenu('menuEntrySaveAs', openSaveModal);
onMenu('menuEntryExportPNG', exportCanvasPNG);
onMenu('menuEntryExportCSV', () => {
  downloadBlob(new Blob([historyCSV(engine)], { type: 'text/csv' }), `${safeFileName(app.currentProjectName)}_data.csv`);
});
onMenu('menuEntryExportJSON', () => {
  const pick = (h) => Object.fromEntries(HISTORY_KEYS.map(k => [k.replace('history', '').toLowerCase(), h[k] || []]));
  const data = {
    project: app.currentProjectName,
    units: { time: 's', temp: 'K', pressure: 'Pa', volume: 'px²', count: 'particles', kineticenergy: 'J', drift: 'px/s' },
    system: pick(engine),
    sensors: engine.sensors.map(s => ({ name: s.label, id: s.id, ...pick(s) }))
  };
  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${safeFileName(app.currentProjectName)}_data.json`);
});
onMenu('menuEntryReset', revertToSaved);

btnToolbarReset.addEventListener('click', revertToSaved);
btnToolbarClear.addEventListener('click', newCanvas);

// Edit Menu
function selectAllElements() {
  if (app.isSimulating) return;
  app.selectedItems = [...engine.elements];
  updateElementsList();
}

onMenu('menuEntryUndo', performUndo);
onMenu('menuEntryRedo', performRedo);
onMenu('menuEntrySelectAll', selectAllElements);
onMenu('menuEntryDuplicate', () => ctxDuplicate.click());
onMenu('menuEntryGroup', groupSelection);
onMenu('menuEntryUngroup', ungroupSelection);
onMenu('menuEntryRotate', () => document.getElementById('btnRotate90')?.click());
onMenu('menuEntryFlipH', () => document.getElementById('btnFlipH')?.click());
onMenu('menuEntryFlipV', () => document.getElementById('btnFlipV')?.click());
onMenu('menuEntryDelete', deleteSelectedItems);

// View Menu + ribbon toggles (both sync through updateViewMenuLabels)
function updateViewMenuLabels() {
  btnToggleGrid.classList.toggle('active', renderer.showGrid);
  btnToggleSnap.classList.toggle('active', renderer.snapToGrid);
  btnToggleVectors.classList.toggle('active', renderer.showVectors);
  btnToggleColor?.classList.toggle('active', renderer.colorByVelocity);
  selectGridSize.value = String(renderer.gridSize);

  const floatingVelLegend = document.getElementById('floatingVelLegend');
  if (floatingVelLegend) {
    floatingVelLegend.style.display = renderer.colorByVelocity ? 'flex' : 'none';
  }
}

function toggleVectors() {
  renderer.showVectors = !renderer.showVectors;
  updateViewMenuLabels();
}

function toggleGrid() { renderer.showGrid = !renderer.showGrid; updateViewMenuLabels(); }
function toggleSnap() { renderer.snapToGrid = !renderer.snapToGrid; updateViewMenuLabels(); }
function toggleColor() { renderer.colorByVelocity = !renderer.colorByVelocity; updateViewMenuLabels(); }
function setGridSize(size) { renderer.gridSize = size; updateViewMenuLabels(); }

onMenu('menuEntryToggleGrid', toggleGrid);
onMenu('menuEntryGrid10', () => setGridSize(10));
onMenu('menuEntryGrid20', () => setGridSize(20));
onMenu('menuEntryGrid40', () => setGridSize(40));
onMenu('menuEntryToggleSnap', toggleSnap);
onMenu('menuEntryToggleVectors', toggleVectors);
onMenu('menuEntryToggleColor', toggleColor);
onMenu('menuEntryZoomIn', () => btnZoomIn.click());
onMenu('menuEntryZoomOut', () => btnZoomOut.click());
onMenu('menuEntryResetView', fitViewToScene);

btnToggleGrid.addEventListener('click', toggleGrid);
btnToggleSnap.addEventListener('click', toggleSnap);
btnToggleVectors.addEventListener('click', toggleVectors);
btnToggleColor?.addEventListener('click', toggleColor);
selectGridSize.addEventListener('change', (e) => setGridSize(parseInt(e.target.value, 10)));

// Simulation Menu (delegates to the playback dock controls)
function selectModel(model) {
  [...modelToggleBtns].find(b => b.dataset.model === model)?.click();
}

onMenu('menuEntryPlay', () => btnPlayPause.click());
onMenu('menuEntryStep', () => btnStep.click());
onMenu('menuEntryStepBack', () => btnStepBack.click());
onMenu('menuEntryStop', () => btnStopReset.click());
onMenu('menuEntryModelIdeal', () => selectModel('hard_sphere'));
onMenu('menuEntryModelReal', () => selectModel('lennard_jones'));
onMenu('menuEntryGravity', () => btnToggleGravity?.click());
onMenu('menuEntrySequencer', () => document.getElementById('btnToggleSequencer')?.click());

// Help Menu
function openShortcutsModal() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) modal.style.display = 'flex';
}

onMenu('menuEntryGuide', () => { infoModal.style.display = 'flex'; });
onMenu('menuEntryShortcuts', openShortcutsModal);

// ============================================================================
// Save Project As Dialog Workflow
// ============================================================================
function updateSaveFilePreview() {
  const name = saveProjectNameInput.value.trim() || 'Project';
  saveFilenamePreview.textContent = `${safeFileName(name)}.json`;
}

function openSaveModal() {
  saveProjectNameInput.value = app.currentProjectName;
  updateSaveFilePreview();
  saveModal.style.display = 'flex';
  setTimeout(() => saveProjectNameInput.select(), 50);
}

function closeSaveModal() {
  saveModal.style.display = 'none';
}

saveProjectNameInput.addEventListener('input', updateSaveFilePreview);
saveProjectNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnSaveDownload.click();
});
btnSaveClose.addEventListener('click', closeSaveModal);
btnSaveCancel.addEventListener('click', closeSaveModal);
window.addEventListener('click', (e) => { if (e.target === saveModal) closeSaveModal(); });

btnSaveDownload.addEventListener('click', () => {
  saveProject(saveProjectNameInput.value.trim() || 'Project');
  closeSaveModal();
});

fileImportInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      openScene(data.profileName || file.name.replace(/\.json$/i, ''), data);
    } catch (err) {
      console.warn('Import failed:', err);
      alert('Invalid JSON configuration file.');
    }
  };
  reader.readAsText(file);
  fileImportInput.value = '';
});


// --- src/app/canvasInput.js ---
// Canvas mouse interaction: coordinates, snapping, context menu, drawing and dragging.

// Snapping to Existing Wall Endpoints (Magnetic Snap)
function findSnapVertex(posWorld, maxDist = 14) {
  let closest = null;
  let minDistSq = maxDist * maxDist;

  for (const wall of engine.walls) {
    const d1Sq = (posWorld.x - wall.p1.x) ** 2 + (posWorld.y - wall.p1.y) ** 2;
    if (d1Sq < minDistSq) {
      minDistSq = d1Sq;
      closest = { x: wall.p1.x, y: wall.p1.y, isVertex: true };
    }
    const d2Sq = (posWorld.x - wall.p2.x) ** 2 + (posWorld.y - wall.p2.y) ** 2;
    if (d2Sq < minDistSq) {
      minDistSq = d2Sq;
      closest = { x: wall.p2.x, y: wall.p2.y, isVertex: true };
    }
  }
  return closest;
}

// Tools that create their element from a drag (or click-move-click).
const DRAG_TOOLS = new Set(['piston', 'solid_res', 'reservoir', 'heat_exchanger', 'regenerator', 'matrix', 'storage_block',
  'solidblock', 'valve', 'throttle_valve', 'gas', 'regulator', 'emitter', 'sink', 'sensor']);

function isDragTool() {
  if (app.activeTool === 'wall') return toolConfigs.wall.shape === 'rect' || toolConfigs.wall.shape === 'circle';
  return DRAG_TOOLS.has(app.activeTool);
}

// Adds the next polyline vertex; landing on the start vertex closes the shape.
function placePolylinePoint(pt) {
  if (pointer.polygonPoints.length === 0) {
    pointer.polygonGroupId = 'g_poly_' + Math.random().toString(36).substring(2, 9);
    pointer.polygonWalls = [];
    pointer.polygonPoints.push(pt);
    return;
  }
  const p0 = pointer.polygonPoints[0];
  const prev = pointer.polygonPoints[pointer.polygonPoints.length - 1];
  if (prev.x === pt.x && prev.y === pt.y) return;
  recordUndoState();
  const w = engine.addWall(prev.x, prev.y, pt.x, pt.y, wallOptions({ groupId: pointer.polygonGroupId }));
  pointer.polygonWalls.push(w);
  if (pointer.polygonPoints.length >= 2 && pt.x === p0.x && pt.y === p0.y) {
    app.selectedItems = [...pointer.polygonWalls];
    resetPolygonDraft();
  } else {
    pointer.polygonPoints.push(pt);
  }
  updateElementsList();
}

// Starts dragging a segment endpoint; shape vertices move together unless detached (Ctrl).
function startEndpointDrag(item, handleId, detach) {
  const links = detach ? [{ item, handleId }] : getLinkedEndpoints(item, handleId);
  pointer.draggingHandle = { item, handleId, links };
}

// Coordinate Converter
function getCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  const screenX = evt.clientX - rect.left;
  const screenY = evt.clientY - rect.top;
  const world = renderer.screenToWorld(screenX, screenY);
  
  // Magnetic Snapping for drawing tools
  const isDrawingTool = app.activeTool === 'wall' || app.activeTool === 'valve' || app.activeTool === 'throttle_valve';
  const snapVertex = isDrawingTool ? findSnapVertex(world, 14 / renderer.zoom) : null;
  if (snapVertex) {
    return {
      screenX, screenY,
      worldX: snapVertex.x,
      worldY: snapVertex.y,
      snapX: snapVertex.x,
      snapY: snapVertex.y,
      isVertex: true
    };
  }

  return {
    screenX, screenY,
    worldX: world.x,
    worldY: world.y,
    snapX: snapToGrid(world.x),
    snapY: snapToGrid(world.y),
    isVertex: false
  };
}

// Mouse Handlers
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const coords = getCoords(e);
  renderer.zoomAt(coords.screenX, coords.screenY, factor);
  updateZoomText();
}, { passive: false });

// Right-Click Context Menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const coords = getCoords(e);
  resetPolygonDraft();
  pointer.arcSteps = [];

  if (app.isSimulating) return;

  const item = findItemAt(coords.worldX, coords.worldY);
  if (item) {
    if (!app.selectedItems.includes(item)) app.selectedItems = [item];
    updateElementsList();
    openContextMenu(e.clientX, e.clientY);
  } else {
    closeContextMenu();
  }
});

function openContextMenu(screenX, screenY) {
  contextMenu.style.left = `${Math.min(window.innerWidth - 180, screenX)}px`;
  contextMenu.style.top = `${Math.min(window.innerHeight - 150, screenY)}px`;
  contextMenu.style.display = 'flex';
}

function closeContextMenu() {
  contextMenu.style.display = 'none';
}

window.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) closeContextMenu();
});

ctxDelete?.addEventListener('click', () => {
  deleteSelectedItems();
  closeContextMenu();
});

ctxDuplicate?.addEventListener('click', () => {
  duplicateSelection();
  closeContextMenu();
});

ctxGroup?.addEventListener('click', () => {
  toggleGroupSelection();
  closeContextMenu();
});

ctxBringFront?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.bringToFront(item));
  updateElementsList();
  closeContextMenu();
});

ctxBringForward?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.bringForward(item));
  updateElementsList();
  closeContextMenu();
});

ctxSendBackward?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.sendBackward(item));
  updateElementsList();
  closeContextMenu();
});

ctxSendBack?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.sendToBack(item));
  updateElementsList();
  closeContextMenu();
});

// ============================================================================
// Canvas Mouse Interactions
// ============================================================================
canvas.addEventListener('mousedown', (e) => {
  closeContextMenu();
  closeAllMenus();
  const coords = getCoords(e);
  pointer.currentCursorWorld = { x: coords.snapX, y: coords.snapY };

  // Direct Click during Simulation: Toggle manual valves & emitters
  if (app.isSimulating) {
    for (let i = 0; i < engine.walls.length; i++) {
      const w = engine.walls[i];
      if (w.type === 'manual_valve') {
        const closest = w.getClosestPoint(new Vector2(coords.worldX, coords.worldY));
        if (Math.hypot(closest.x - coords.worldX, closest.y - coords.worldY) < 18 / renderer.zoom) {
          w.isOpen = !w.isOpen;
          return;
        }
      }
    }
    for (let i = 0; i < (engine.throttleValves || []).length; i++) {
      const tv = engine.throttleValves[i];
      const closest = tv._closestPointOnSegment(new Vector2(coords.worldX, coords.worldY), tv.p1, tv.p2);
      if (Math.hypot(closest.x - coords.worldX, closest.y - coords.worldY) < 18 / renderer.zoom) {
        tv.toggle();
        return;
      }
    }
    const clickedEm = engine.emitters.find(em => em.contains(coords.worldX, coords.worldY));
    if (clickedEm) {
      clickedEm.toggle();
      return;
    }
  }

  // Panning with Middle Mouse or Alt-Click
  if (e.button === 1 || e.altKey) {
    pointer.isPanning = true;
    pointer.panStartScreen = { x: coords.screenX, y: coords.screenY };
    pointer.panStartCamera = { x: renderer.panX, y: renderer.panY };
    canvas.style.cursor = 'grabbing';
    return;
  }

  if (e.button !== 0) return;

  // Second click of a click-move-click drawing
  if (pointer.pendingStart && !app.isSimulating) {
    if (isDragTool()) createFromDrag(pointer.pendingStart, { x: coords.snapX, y: coords.snapY });
    pointer.pendingStart = null;
    renderer.draftInfo = null;
    return;
  }

  pointer.isMouseDown = true;
  pointer.dragStartWorld = { x: coords.snapX, y: coords.snapY };

  const clickedItem = findItemAt(coords.worldX, coords.worldY);

  // Sequencer Element Picking Interceptor
  if (clickedItem && window.sequencerUI && window.sequencerUI.handleItemPicked(clickedItem)) {
    pointer.isMouseDown = false;
    return;
  }

  // In Simulation Mode or Direct Click: Toggle interactive thermal/mechanical elements
  if (clickedItem && (app.isSimulating || (app.activeTool === 'select' && !e.shiftKey))) {
    if (
      clickedItem instanceof HeatExchanger ||
      clickedItem instanceof RegeneratorMatrix ||
      clickedItem instanceof ThermalBlock ||
      clickedItem instanceof Reservoir ||
      clickedItem instanceof Emitter ||
      clickedItem instanceof Sink ||
      clickedItem instanceof Regulator ||
      (clickedItem instanceof Piston && (clickedItem.mode === 'motorized' || clickedItem.mode === 'damper'))
    ) {
      if (app.isSimulating) {
        clickedItem.toggle();
        updateElementsList();
        return;
      }
    }
  }

  // Polyline Wall Placement & Closing (must precede handle dragging & selection to allow closing loop on start vertex)
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon') {
    const p0 = pointer.polygonPoints[0];
    const isCloseToStart = pointer.polygonPoints.length >= 2 && (
      Math.hypot(coords.worldX - p0.x, coords.worldY - p0.y) < 18 / renderer.zoom ||
      (coords.snapX === p0.x && coords.snapY === p0.y)
    );
    placePolylinePoint(isCloseToStart ? { x: p0.x, y: p0.y } : { x: coords.snapX, y: coords.snapY });
    return;
  }

  // Transform frame, shape vertices and item handles: select tool only, so
  // drawing tools never grab nodes of existing elements.
  if (!app.isSimulating && app.activeTool === 'select') {
    const hit = hitTestTransform(coords.worldX, coords.worldY);
    if (hit?.kind === 'label') {
      pointer.isMouseDown = false;
      openSelectionSizeInput();
      return;
    }
    if (hit) {
      recordUndoState();
      if (hit.kind === 'vertex') startEndpointDrag(hit.item, hit.handleId, e.ctrlKey);
      else beginTransform(hit, coords.worldX, coords.worldY);
      return;
    }

    const handleHitRadius = 12 / renderer.zoom;
    const hasOwnHandles = (it) => it instanceof Wall || it instanceof ThrottleValve || it instanceof Piston;
    const candidates = [...app.selectedItems.filter(hasOwnHandles)];
    if (clickedItem && hasOwnHandles(clickedItem) && !app.selectedItems.includes(clickedItem)) candidates.push(clickedItem);
    for (const item of candidates) {
      const h = renderer.getResizeHandles(item).find(h => Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius);
      if (!h) continue;
      if (!app.selectedItems.includes(item)) {
        app.selectedItems = getAllGroupItems(item);
        updateElementsList();
      }
      recordUndoState();
      if (h.id === 'p1' || h.id === 'p2') startEndpointDrag(item, h.id, e.ctrlKey);
      else pointer.draggingHandle = { item, handleId: h.id };
      return;
    }
  }

  // Select & Move (supports Shift + Click multi-selection, Group auto-selection & Particle selection)
  if (!app.isSimulating && (app.activeTool === 'select' || e.shiftKey)) {
    if (clickedItem) {
      const itemsToToggle = clickedItem.groupId ? getAllGroupItems(clickedItem) : [clickedItem];
      if (e.shiftKey) {
        const isAnySelected = itemsToToggle.some(i => app.selectedItems.includes(i));
        if (isAnySelected) {
          app.selectedItems = app.selectedItems.filter(i => !itemsToToggle.includes(i));
        } else {
          app.selectedItems = [...app.selectedItems, ...itemsToToggle];
        }
      } else {
        app.selectedItems = itemsToToggle;
      }
      recordUndoState();
      pointer.isMovingSelection = true;
      pointer.moveStartWorld = { x: coords.snapX, y: coords.snapY };
      updateElementsList();
      return;
    } else {
      // Check if clicking a single particle
      const clickedP = engine.findParticleAt(coords.worldX, coords.worldY, 14 / renderer.zoom);
      if (clickedP) {
        if (!e.shiftKey) {
          engine.particles.forEach(p => { p.selected = false; });
          app.selectedItems = [];
        }
        clickedP.selected = !clickedP.selected;
        if (clickedP.selected) app.selectedItems.push(clickedP);
        else app.selectedItems = app.selectedItems.filter(i => i !== clickedP);
        updateElementsList();
        return;
      } else if (!e.shiftKey) {
        engine.particles.forEach(p => { p.selected = false; });
        app.selectedItems = [];
        updateElementsList();
      }
    }
  }

  // Text Tool
  if (!app.isSimulating && app.activeTool === 'text') {
    const txt = prompt('Enter text note:', toolConfigs.text.text || 'Annotation');
    if (txt) {
      recordUndoState();
      const l = engine.addTextLabel(coords.snapX, coords.snapY, txt, { fontSize: toolConfigs.text.fontSize });
      app.selectedItems = [l];
      updateElementsList();
    }
    return;
  }

  // Arc Wall: 3 Clicks
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'arc') {
    pointer.arcSteps.push({ x: coords.snapX, y: coords.snapY });
    if (pointer.arcSteps.length === 3) {
      recordUndoState();
      createArcWall(pointer.arcSteps[0], pointer.arcSteps[1], pointer.arcSteps[2]);
      pointer.arcSteps = [];
      updateElementsList();
    }
    return;
  }
});

window.addEventListener('mousemove', (e) => {
  const coords = getCoords(e);
  pointer.currentCursorWorld = { x: coords.snapX, y: coords.snapY };
  renderer.snapCursor = { x: coords.snapX, y: coords.snapY, isVertex: coords.isVertex };

  if (pointer.isPanning) {
    renderer.panX = pointer.panStartCamera.x + (coords.screenX - pointer.panStartScreen.x);
    renderer.panY = pointer.panStartCamera.y + (coords.screenY - pointer.panStartScreen.y);
    return;
  }

  // Sequencer Element Picking Hover Highlight
  if (window.sequencerUI?.actionDialog?.isPicking) {
    const hoveredItem = findItemAt(coords.worldX, coords.worldY);
    const isValid = hoveredItem && window.sequencerUI.actionDialog.isPickable(hoveredItem);
    renderer.highlightedSequencerItem = isValid ? hoveredItem : null;
    canvas.style.cursor = isValid ? 'pointer' : 'crosshair';
    return;
  }

  // Update live draft preview info in renderer
  const isDragging = pointer.isMouseDown && !pointer.draggingHandle && !pointer.isMovingSelection && !isTransforming();
  const draftStart = pointer.pendingStart || (isDragging ? pointer.dragStartWorld : null);
  if (draftStart && !app.isSimulating) {
    renderer.draftInfo = {
      isDrafting: true,
      tool: app.activeTool,
      shape: (app.activeTool === 'wall' && toolConfigs.wall) ? toolConfigs.wall.shape : 'line',
      vtype: (app.activeTool === 'valve' && toolConfigs.valve) ? toolConfigs.valve.type : '',
      start: draftStart,
      current: pointer.currentCursorWorld
    };
  } else {
    renderer.draftInfo = null;
  }

  // Transform frame drag (resize / rotate)
  if (isTransforming()) {
    updateTransform(coords.worldX, coords.worldY, { shift: e.shiftKey, alt: e.altKey });
    return;
  }

  // Dragging Handles
  if (!app.isSimulating && pointer.draggingHandle) {
    const { item, handleId, links } = pointer.draggingHandle;
    if (links) {
      let pt = { x: coords.snapX, y: coords.snapY };
      if (e.shiftKey) pt = constrainEndpoint(item, handleId, coords.worldX, coords.worldY);
      moveEndpoints(links, pt.x, pt.y);
    } else if (item instanceof ThrottleValve && (handleId === 'gap1' || handleId === 'gap2')) {
      const mid = item.midPoint;
      const dx = coords.snapX - mid.x;
      const dy = coords.snapY - mid.y;
      const proj = Math.abs(dx * item.unitDir.x + dy * item.unitDir.y);
      if (item.length > 0) {
        item.setOpenRatio(Math.max(0.02, Math.min(0.98, (proj * 2.0) / item.length)));
      }
    } else if (item instanceof Piston) {
      const halfThick = (item.orientation === 'horizontal' ? item.width : item.height) * 0.5;
      if (item.orientation === 'horizontal') {
        if (handleId === 'minPos') {
          item.minPos = Math.min(item.maxPos - halfThick * 2 - 10, coords.snapX);
        } else {
          item.maxPos = Math.max(item.minPos + halfThick * 2 + 10, coords.snapX);
        }
        item.setPos(item.x);
      } else {
        if (handleId === 'minPos') {
          item.minPos = Math.min(item.maxPos - halfThick * 2 - 10, coords.snapY);
        } else {
          item.maxPos = Math.max(item.minPos + halfThick * 2 + 10, coords.snapY);
        }
        item.setPos(item.y);
      }
      item.amplitude = Math.max(0, (item.maxPos - item.minPos - halfThick * 2) * 0.5);
      item.centerPos = (item.minPos + item.maxPos) * 0.5;
    }
    return;
  }

  // Move selected items
  if (!app.isSimulating && pointer.isMovingSelection && pointer.moveStartWorld) {
    const dx = coords.snapX - pointer.moveStartWorld.x;
    const dy = coords.snapY - pointer.moveStartWorld.y;
    if (dx !== 0 || dy !== 0) {
      moveSelectedItems(dx, dy);
      pointer.moveStartWorld = { x: coords.snapX, y: coords.snapY };
    }
    return;
  }

  // Cursor in Select Mode
  if (!app.isSimulating && app.activeTool === 'select' && !pointer.isMouseDown) {
    const hitCursor = cursorForHit(hitTestTransform(coords.worldX, coords.worldY));
    if (hitCursor) {
      canvas.style.cursor = hitCursor;
      renderer.hoverItem = null;
      return;
    }
    const handleHitRadius = 12 / renderer.zoom;
    const overHandle = app.selectedItems.some(it => (it instanceof Wall || it instanceof ThrottleValve || it instanceof Piston) &&
      renderer.getResizeHandles(it).some(h => Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius));
    const itemUnderCursor = findItemAt(coords.worldX, coords.worldY);
    renderer.hoverItem = itemUnderCursor;
    if (overHandle) {
      canvas.style.cursor = 'move';
    } else if (itemUnderCursor && app.selectedItems.includes(itemUnderCursor)) {
      canvas.style.cursor = 'move';
    } else if (itemUnderCursor) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  } else if (!pointer.isMouseDown && !pointer.isPanning) {
    canvas.style.cursor = 'crosshair';
    renderer.hoverItem = null;
  }
});

window.addEventListener('mouseup', (e) => {
  if (pointer.isPanning) {
    pointer.isPanning = false;
    canvas.style.cursor = 'crosshair';
  }

  if (isTransforming()) {
    endTransform();
    pointer.isMouseDown = false;
    pointer.dragStartWorld = null;
    renderer.draftInfo = null;
    updateElementsList();
    return;
  }
  const wasDraggingHandle = !!pointer.draggingHandle;
  const wasMovingSelection = pointer.isMovingSelection;
  const draggedHandleItem = pointer.draggingHandle?.item;

  if (pointer.draggingHandle) pointer.draggingHandle = null;
  if (pointer.isMovingSelection) pointer.isMovingSelection = false;

  if (!pointer.isMouseDown) return;
  pointer.isMouseDown = false;
  renderer.draftInfo = null;

  if (wasDraggingHandle || wasMovingSelection) {
    if (draggedHandleItem instanceof SensorZone && !draggedHandleItem.pistonBinding) {
      const snap = findPistonSnap(draggedHandleItem.x, draggedHandleItem.y, draggedHandleItem.width, draggedHandleItem.height);
      if (snap) {
        draggedHandleItem.bindToPiston(snap.piston, snap.edge, true);
        updateElementsList();
      }
    } else if (wasMovingSelection) {
      app.selectedItems.forEach(it => {
        if (it instanceof SensorZone && !it.pistonBinding) {
          const snap = findPistonSnap(it.x, it.y, it.width, it.height);
          if (snap) {
            it.bindToPiston(snap.piston, snap.edge, true);
          }
        }
      });
      updateElementsList();
    }
    return;
  }

  const coords = getCoords(e);

  if (!app.isSimulating && pointer.dragStartWorld) {
    const s = pointer.dragStartWorld;
    const c = { x: coords.snapX, y: coords.snapY };
    const minX = Math.min(s.x, c.x), minY = Math.min(s.y, c.y);
    const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);

    // Marquee Selection (Objects + Particles)
    if (app.activeTool === 'select') {
      if (w >= 10 || h >= 10) {
        const boxItems = findItemsInBox(minX, minY, minX + w, minY + h);
        const boxParticles = engine.findParticlesInRect(minX, minY, minX + w, minY + h);
        boxParticles.forEach(p => { p.selected = true; });
        app.selectedItems = [...boxItems, ...boxParticles];
        updateElementsList();
      }
    } else if (isDragTool() && Math.hypot(c.x - s.x, c.y - s.y) * renderer.zoom < 4) {
      // Click without dragging: the next click sets the opposite corner
      pointer.pendingStart = s;
    } else {
      createFromDrag(s, c);
    }
  }

  pointer.dragStartWorld = null;
});

// Creates the element of the active drawing tool from a drag (start s, end c),
// with all current tool settings (toolConfigs) as its properties.
function createFromDrag(s, c) {
  const minX = Math.min(s.x, c.x), minY = Math.min(s.y, c.y);
  const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);
  const tool = app.activeTool;
  const isBox = w >= 20 && h >= 20;
  const cfg = { ...toolConfigs[tool] };
  let created = null;

  if (tool === 'wall' && toolConfigs.wall.shape === 'rect' && isBox) {
    recordUndoState();
    const gid = 'g_rect_' + Math.random().toString(36).substring(2, 9);
    const corners = [[minX, minY], [minX + w, minY], [minX + w, minY + h], [minX, minY + h]];
    created = corners.map((p, i) => {
      const q = corners[(i + 1) % 4];
      return engine.addWall(p[0], p[1], q[0], q[1], wallOptions({ groupId: gid }));
    });
  } else if (tool === 'wall' && toolConfigs.wall.shape === 'circle') {
    const radius = Math.hypot(c.x - s.x, c.y - s.y);
    if (radius < 12) return;
    recordUndoState();
    created = createCircleWall(s, radius);
  } else if (tool === 'piston' && (w >= 20 || h >= 20)) {
    recordUndoState();
    // A tall drag makes a piston that moves horizontally and vice versa.
    const movesHorizontally = h >= w;
    const cx = (s.x + c.x) * 0.5, cy = (s.y + c.y) * 0.5;
    const along = movesHorizontally ? cx : cy;
    created = engine.addPiston({
      ...cfg, label: 'P', orientation: movesHorizontally ? 'horizontal' : 'vertical',
      x: cx, y: cy, width: Math.max(16, w), height: Math.max(16, h),
      minPos: along - 140, maxPos: along + 140
    });
  } else if (tool === 'solid_res' && isBox) {
    recordUndoState();
    created = engine.addReservoir(minX, minY, w, h, cfg);
  } else if (tool === 'heat_exchanger' && isBox) {
    recordUndoState();
    created = engine.addHeatExchanger(minX, minY, w, h, cfg);
  } else if (tool === 'regenerator' && isBox) {
    recordUndoState();
    created = engine.addRegeneratorMatrix(minX, minY, w, h, cfg);
  } else if (tool === 'storage_block' && isBox) {
    recordUndoState();
    created = engine.addThermalBlock(minX, minY, w, h, cfg);
  } else if (tool === 'valve' && (s.x !== c.x || s.y !== c.y)) {
    recordUndoState();
    created = engine.addWall(s.x, s.y, c.x, c.y, cfg);
  } else if (tool === 'throttle_valve' && (s.x !== c.x || s.y !== c.y)) {
    recordUndoState();
    created = engine.addThrottleValve(s.x, s.y, c.x, c.y, cfg);
  } else if (tool === 'gas' && isBox) {
    recordUndoState();
    created = engine.spawnGasRaster(minX, minY, w, h, cfg.count, cfg.mass, cfg.temperature, cfg.velocityMode);
  } else if (tool === 'regulator' && isBox) {
    recordUndoState();
    created = engine.addRegulator(minX, minY, w, h, cfg);
  } else if (tool === 'emitter' && isBox) {
    recordUndoState();
    created = engine.addEmitter(minX, minY, w, h, cfg);
  } else if (tool === 'sink' && isBox) {
    recordUndoState();
    created = engine.addSink(minX, minY, w, h, cfg);
  } else if (tool === 'sensor' && isBox) {
    recordUndoState();
    const letter = String.fromCharCode(65 + engine.sensors.length);
    // Untouched default color: next color of the chart palette, so every sensor gets its own.
    const color = cfg.color === defaultValues('sensor', 'tool').color ? sensorColor(engine.sensors.length) : cfg.color;
    created = engine.addSensor({ x: minX, y: minY, width: w, height: h, color, label: `${cfg.label} ${letter}` });
    const snap = findPistonSnap(minX, minY, w, h);
    if (snap) created.bindToPiston(snap.piston, snap.edge, true);
  }

  if (created) {
    app.selectedItems = Array.isArray(created) ? created : [created];
    updateElementsList();
  }
}

// Finish Wall Polygon / Arc
canvas.addEventListener('dblclick', () => { resetPolygonDraft(); pointer.arcSteps = []; });
canvas.addEventListener('mouseleave', () => { renderer.hoverItem = null; });


// --- src/app/toolPanel.js ---
// Ribbon tools, tool configurations and the floating tool properties dialog.

// Tool defaults for new elements: the schema defaults plus the sub-mode chosen in the ribbon.
const toolConfigs = {
  wall: { shape: 'polygon', ...defaultValues('wall', 'tool') },
  piston: { mode: 'free', amplitude: 50, ...defaultValues('piston', 'tool') },
  solid_res: defaultValues('reservoir', 'tool'),
  heat_exchanger: defaultValues('heat_exchanger', 'tool'),
  regenerator: { sliceCount: 10, ...defaultValues('regenerator', 'tool') },
  storage_block: defaultValues('thermal_block', 'tool'),
  valve: { ...defaultValues('relief_valve', 'tool'), ...defaultValues('check_valve', 'tool'), ...defaultValues('manual_valve', 'tool'), type: 'manual_valve' },
  throttle_valve: defaultValues('throttle_valve', 'tool'),
  gas: defaultValues('gas', 'tool'),
  regulator: defaultValues('regulator', 'tool'),
  emitter: defaultValues('emitter', 'tool'),
  sink: defaultValues('sink', 'tool'),
  sensor: defaultValues('sensor', 'tool'),
  text: defaultValues('text', 'tool')
};

// Options for new wall segments drawn with the wall tools.
function wallOptions(extra = {}) {
  const c = toolConfigs.wall;
  return { thickness: c.thickness, conductivity: c.conductivity, temperature: c.temperature, heatCapacity: c.heatCapacity, ...extra };
}

// ============================================================================
// IPE Toolbar Ribbon & Dedicated Mode Tool Binding
// ============================================================================
const ribbonToolBtns = document.querySelectorAll('.ribbon-tool-btn');

function selectToolButton(btn) {
  ribbonToolBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const tool = btn.dataset.tool;
  app.activeTool = tool;

  if (tool === 'wall' && btn.dataset.wshape) {
    toolConfigs.wall.shape = btn.dataset.wshape;
  } else if (tool === 'piston' && btn.dataset.pmode) {
    toolConfigs.piston.mode = btn.dataset.pmode;
  } else if (tool === 'valve' && btn.dataset.vtype) {
    toolConfigs.valve.type = btn.dataset.vtype;
  }

  resetPolygonDraft();
  pointer.arcSteps = [];
  renderer.draftInfo = null;
  closeContextMenu();
  renderToolProperties(tool);
}

ribbonToolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (app.isSimulating) return;
    selectToolButton(btn);
  });
});

// ============================================================================
// Tool Explanations & Dedicated Active Tool Properties Inspector (CAD Style)
// ============================================================================
const toolHelpDescriptions = {
  wall: 'Defines rigid, thermally insulating or conductive walls to contain particles and direct flow.',
  piston: 'Movable piston with mass, damping, or motor drive for expansion, compression, and work extraction.',
  valve: 'Flow control valve (Manual, One-Way Check, or Pressure Relief) to regulate fluid flow between chambers.',
  throttle_valve: 'Continuous adjustable constriction (orifice) inducing localized pressure drops and expansion.',
  gas: 'Places a thermalized particle lattice with defined initial temperature, particle mass, and count.',
  regulator: 'Maintains target particle count in the zone automatically by injecting or extracting particles.',
  emitter: 'Continuous particle source generating directed flow at defined rate, temperature, and speed.',
  sink: 'Absorbs colliding particles to simulate a vacuum, exhaust port, or open atmosphere.',
  sensor: 'Measurement zone monitoring pressure, temperature, particle count, and net drift velocity.',
  solid_res: 'Constant-temperature thermal reservoir with infinite heat capacity acting as heat source or sink.',
  heat_exchanger: 'Permeable thermal body that exchanges heat directly with particles flowing through it.',
  regenerator: 'Thermal matrix developing a temperature gradient to reversibly store and release thermal energy.',
  storage_block: 'Solid thermal block with finite heat capacity exchanging heat via boundary conduction.',
  text: 'Creates text annotations to document experimental setups and label chambers on the canvas.'
};

const TOOL_TITLES = {
  select: 'Select', text: 'Text', solid_res: 'Heat Bath', heat_exchanger: 'Heat Exchanger', regenerator: 'Regenerator',
  storage_block: 'Thermal Mass', throttle_valve: 'Throttle', gas: 'Spawner', regulator: 'Regulator', emitter: 'Emitter',
  sink: 'Absorber', sensor: 'Sensor'
};
const WALL_TITLES = { polygon: 'Polyline', rect: 'Rectangle', circle: 'Circle', arc: 'Arc' };
const PISTON_TITLES = { free: 'Displacer', spring: 'Accumulator', motorized: 'Compressor', damper: 'Expander' };
const VALVE_TITLES = { manual_valve: 'Manual Valve', check_valve: 'Check Valve', relief_valve: 'Relief Valve' };
const TOOL_BADGES = {
  select: 'TOOLS', text: 'TOOLS', wall: 'WALLS', gas: 'PARTICLES', emitter: 'PARTICLES', sink: 'PARTICLES', regulator: 'PARTICLES',
  solid_res: 'THERMAL', heat_exchanger: 'THERMAL', regenerator: 'THERMAL', storage_block: 'THERMAL',
  piston: 'PISTONS', valve: 'VALVES', throttle_valve: 'VALVES', sensor: 'SENSORS'
};

function toolTitle(tool) {
  if (tool === 'wall') return WALL_TITLES[toolConfigs.wall.shape];
  if (tool === 'piston') return PISTON_TITLES[toolConfigs.piston.mode];
  if (tool === 'valve') return VALVE_TITLES[toolConfigs.valve.type];
  return TOOL_TITLES[tool] || 'Tool';
}

// Tool dialog: defaults for the next element drawn with the active tool.
// (Selected elements are edited in the properties panel, not here.)
function renderToolProperties(tool) {
  if (!toolPropertiesContainer) return;
  if (toolDialogTitle) toolDialogTitle.textContent = toolTitle(tool);
  if (toolDialogBadge) toolDialogBadge.textContent = TOOL_BADGES[tool] || 'TOOL';
  if (toolDialogHelpPanel) toolDialogHelpPanel.textContent = toolHelpDescriptions[tool] || '';

  // Always reset description to collapsed when switching tools
  isToolHelpOpen = false;
  if (toolDialogHelpPanel) toolDialogHelpPanel.style.display = 'none';
  if (helpArrowIcon) helpArrowIcon.textContent = '▾';

  const type = elementTypeOfTool(tool, toolConfigs[tool]);
  if (app.isSimulating || tool === 'select' || !type) {
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    toolPropertiesContainer.innerHTML = '';
    return;
  }

  if (toolDialogPanel) {
    toolDialogPanel.style.display = 'flex';
    toolDialogPanel.style.left = '350px';
    toolDialogPanel.style.top = '176px';
  }
  renderPropertyForm(toolPropertiesContainer, type, toolConfigs[tool], { context: 'tool' });
}

// ============================================================================
// Floating Tool Dialog (Onshape CAD Style) Controls
// ============================================================================
let isToolHelpOpen = false;
function toggleToolHelp(forceState) {
  if (!toolDialogHelpPanel || !helpArrowIcon) return;
  isToolHelpOpen = (typeof forceState === 'boolean') ? forceState : !isToolHelpOpen;
  toolDialogHelpPanel.style.display = isToolHelpOpen ? 'block' : 'none';
  helpArrowIcon.textContent = isToolHelpOpen ? '▴' : '▾';
}

btnToolDialogClose?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('toolSelect')?.click();
});

if (toolDialogHeader) {
  toolDialogHeader.style.cursor = 'pointer';
  toolDialogHeader.addEventListener('click', (e) => {
    if (e.target.closest?.('.tool-dialog-actions')) return;
    toggleToolHelp();
  });
}


// --- src/app/history.js ---
// Edit-mode undo/redo and the playback history used by Step Back.

// Undo & Redo Stacks for Edit Mode
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 40;

// refreshList = false records without re-rendering the sidebar (used while a
// property field is being edited, so the field keeps focus).
function recordUndoState(refreshList = true) {
  if (app.isSimulating) return;
  const snapshot = engine.exportState(app.currentProjectName);
  undoStack.push(JSON.stringify(snapshot));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
  if (refreshList) updateElementsList();
}

function performUndo() {
  if (app.isSimulating || undoStack.length === 0) return;
  const current = engine.exportState(app.currentProjectName);
  redoStack.push(JSON.stringify(current));
  const prevJSON = undoStack.pop();
  engine.importState(JSON.parse(prevJSON), false);
  app.selectedItems = [];
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
}

function performRedo() {
  if (app.isSimulating || redoStack.length === 0) return;
  const current = engine.exportState(app.currentProjectName);
  undoStack.push(JSON.stringify(current));
  const nextJSON = redoStack.pop();
  engine.importState(JSON.parse(nextJSON), false);
  app.selectedItems = [];
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
}

btnUndo.addEventListener('click', performUndo);
btnRedo.addEventListener('click', performRedo);

// Playback History buffer for Step Back (⏮)
// In GPU mode particle state lives in VRAM, so frames hold GPU-side buffer
// snapshots (gpuSlot) instead of CPU particle copies.
const historyBuffer = [];
const MAX_HISTORY = 120;

function releaseHistoryFrame(frame) {
  if (frame && frame.gpuSlot && engine.gpuCompute) engine.gpuCompute.releaseHistory(frame.gpuSlot);
}

function clearHistoryBuffer() {
  for (let i = 0; i < historyBuffer.length; i++) releaseHistoryFrame(historyBuffer[i]);
  historyBuffer.length = 0;
}

function pushHistoryFrame() {
  if (historyBuffer.length >= MAX_HISTORY) releaseHistoryFrame(historyBuffer.shift());
  const gpuMode = engine.isGPUSimulating();
  const gpuSlot = gpuMode ? engine.gpuCompute.captureHistory() : null;
  const shouldSaveParticles = !gpuMode && engine.particles.length <= 2000;
  historyBuffer.push({
    time: engine.totalTime,
    gpuSlot,
    particles: shouldSaveParticles ? engine.particles.map(p => ({ x: p.pos.x, y: p.pos.y, vx: p.vel.x, vy: p.vel.y })) : [],
    pistons: engine.pistons.map(p => ({ x: p.x, y: p.y, v: p.velocity, temp: p.temperature })),
    walls: engine.walls.map(w => ({ temp: w.temperature, isOpen: w.isOpen })),
    thermalBlocks: engine.thermalBlocks.map(b => ({ temp: b.temperature }))
  });
}

function popHistoryFrame() {
  if (historyBuffer.length === 0) {
    engine.restoreInitialSnapshot();
    return;
  }
  const frame = historyBuffer.pop();
  engine.totalTime = frame.time;
  for (let i = 0; i < Math.min(engine.pistons.length, frame.pistons.length); i++) {
    engine.pistons[i].x = frame.pistons[i].x;
    engine.pistons[i].y = frame.pistons[i].y;
    engine.pistons[i].velocity = frame.pistons[i].v;
    engine.pistons[i].temperature = frame.pistons[i].temp;
  }
  for (let i = 0; i < Math.min(engine.walls.length, frame.walls.length); i++) {
    engine.walls[i].temperature = frame.walls[i].temp;
    engine.walls[i].isOpen = frame.walls[i].isOpen;
  }
  for (let i = 0; i < Math.min(engine.thermalBlocks.length, frame.thermalBlocks.length); i++) {
    engine.thermalBlocks[i].temperature = frame.thermalBlocks[i].temp;
  }
  if (frame.gpuSlot) {
    engine.restoreGPUHistory(frame.gpuSlot);
  } else if (frame.particles.length > 0) {
    for (let i = 0; i < Math.min(engine.particles.length, frame.particles.length); i++) {
      engine.particles[i].pos.set(frame.particles[i].x, frame.particles[i].y);
      engine.particles[i].vel.set(frame.particles[i].vx, frame.particles[i].vy);
    }
    engine.syncParticlesToGPU();
  }
  engine.syncWallsToGPU();
}


// --- src/app/chartViewer.js ---
// Large chart dialog: any metric of any target, time range (all / last N s /
// zoomed), wheel zoom and drag pan on the time axis, PNG and CSV export.

const overlay = document.getElementById('chartViewer');
const viewerCanvas = document.getElementById('chartViewerCanvas');
const viewerTitleEl = document.getElementById('chartViewerTitle');
const metricSel = document.getElementById('chartViewerMetric');
const targetSel = document.getElementById('chartViewerTarget');
const rangeGroup = document.getElementById('chartViewerRange');

const METRICS = ['temp', 'pressure', 'volume', 'count', 'kinetic', 'drift', 'pv', 'pt', 'ts', 'hist'];
const viewerChart = viewerCanvas ? new ChartView(viewerCanvas, {}, { large: true }) : null;
let drag = null; // { x, window } while panning

function isChartViewerOpen() {
  return overlay && overlay.style.display !== 'none';
}

function targetValue(target) {
  return typeof target === 'string' ? target : target.id;
}

function resolveTarget(value) {
  if (value === 'global' || value === 'sensors') return value;
  return engine.sensors.find(s => s.id === value) || 'global';
}

function fillSelectors() {
  metricSel.innerHTML = METRICS.map(m => `<option value="${m}">${metricTitle(m)}</option>`).join('');
  targetSel.innerHTML = [
    '<option value="global">System</option>',
    engine.sensors.length > 1 ? '<option value="sensors">All sensors</option>' : '',
    ...engine.sensors.map(s => `<option value="${s.id}">${s.label}</option>`)
  ].join('');
}

function syncControls() {
  metricSel.value = viewerChart.spec.metric;
  targetSel.value = targetValue(viewerChart.spec.target);
  if (![...targetSel.options].some(o => o.value === targetSel.value)) targetSel.value = 'global';
  const mode = viewerChart.view.mode === 'last' ? String(viewerChart.view.span) : viewerChart.view.mode;
  rangeGroup.querySelectorAll('[data-range]').forEach(b => b.classList.toggle('active', b.dataset.range === mode));
  rangeGroup.style.visibility = metricKind(viewerChart.spec.metric) === 'hist' ? 'hidden' : 'visible';
  viewerTitleEl.textContent = viewerChart.title();
}

function openChartViewer(spec) {
  if (!viewerChart) return;
  fillSelectors();
  viewerChart.spec = { target: 'global', metric: 'temp', ...spec };
  viewerChart.view = { mode: 'all' };
  overlay.style.display = 'flex';
  syncControls();
  viewerChart.render(engine);
}

function closeChartViewer() {
  if (overlay) overlay.style.display = 'none';
}

function renderChartViewer() {
  if (isChartViewerOpen() && !drag) viewerChart.render(engine);
}

if (viewerChart) {
  metricSel.addEventListener('change', () => { viewerChart.spec.metric = metricSel.value; syncControls(); viewerChart.render(engine); });
  targetSel.addEventListener('change', () => { viewerChart.spec.target = resolveTarget(targetSel.value); syncControls(); viewerChart.render(engine); });
  rangeGroup.querySelectorAll('[data-range]').forEach(btn => btn.addEventListener('click', () => {
    viewerChart.view = btn.dataset.range === 'all' ? { mode: 'all' } : { mode: 'last', span: parseFloat(btn.dataset.range) };
    syncControls();
    viewerChart.render(engine);
  }));
  document.getElementById('chartViewerClose').addEventListener('click', closeChartViewer);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeChartViewer(); });

  document.getElementById('chartViewerCSV').addEventListener('click', () => {
    downloadBlob(new Blob([viewerChart.toCSV(engine)], { type: 'text/csv' }), `${safeFileName(app.currentProjectName)}_${viewerChart.spec.metric}.csv`);
  });
  document.getElementById('chartViewerPNG').addEventListener('click', () => {
    // Chart plus its title strip
    const dpr = window.devicePixelRatio || 1;
    const head = Math.round(32 * dpr);
    const out = document.createElement('viewerCanvas');
    out.width = viewerCanvas.width;
    out.height = viewerCanvas.height + head;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = `600 ${14 * dpr}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${viewerChart.title()} — ${app.currentProjectName}`, 16 * dpr, head / 2 + 2 * dpr);
    ctx.drawImage(viewerCanvas, 0, head);
    out.toBlob(b => { if (b) downloadBlob(b, `${safeFileName(app.currentProjectName)}_${viewerChart.spec.metric}.png`); });
  });

  // Zoom (wheel) and pan (drag) on the time window; double-click shows everything.
  viewerCanvas.addEventListener('wheel', (e) => {
    if (!viewerChart.lastWindow || metricKind(viewerChart.spec.metric) === 'hist') return;
    e.preventDefault();
    const [t0, t1] = viewerChart.lastWindow;
    const p = viewerChart.lastPlot;
    const r = viewerCanvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left - p.x0) / (p.x1 - p.x0)));
    const anchor = t0 + frac * (t1 - t0);
    const span = Math.max(0.5, (t1 - t0) * (e.deltaY < 0 ? 0.8 : 1.25));
    viewerChart.view = { mode: 'range', t0: anchor - frac * span, t1: anchor + (1 - frac) * span };
    syncControls();
    viewerChart.render(engine);
  }, { passive: false });
  viewerCanvas.addEventListener('mousedown', (e) => {
    if (!viewerChart.lastWindow || metricKind(viewerChart.spec.metric) === 'hist') return;
    drag = { x: e.clientX, window: [...viewerChart.lastWindow] };
  });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const p = viewerChart.lastPlot;
    const [t0, t1] = drag.window;
    const dt = (e.clientX - drag.x) / (p.x1 - p.x0) * (t1 - t0);
    viewerChart.view = { mode: 'range', t0: t0 - dt, t1: t1 - dt };
    syncControls();
    viewerChart.render(engine);
  });
  window.addEventListener('mouseup', () => { drag = null; });
  viewerCanvas.addEventListener('dblclick', () => { viewerChart.view = { mode: 'all' }; syncControls(); viewerChart.render(engine); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isChartViewerOpen()) closeChartViewer(); });
}



// --- src/app/dashboard.js ---
// Right sidebar: system stats, chamber cards and custom charts.

const customCharts = [];
// Open chamber cards in right sidebar
const openChamberCardIds = new Set();
const chamberCharts = new Map(); // sensor id -> ChartView

const EXPAND_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

// Expand buttons of the fixed sidebar charts
document.getElementById('btnExpandVelChart')?.addEventListener('click', () => openChartViewer(velChart.spec));
document.getElementById('btnExpandHistoryChart')?.addEventListener('click', () => openChartViewer(tempChart.spec));

// System Stats
const gpuStatusBadge = document.getElementById('gpuStatusBadge');
function updateSystemStats() {
  const stats = engine.stats;
  if (statN) statN.textContent = stats.particleCount;
  if (statT) statT.textContent = `${Math.round(stats.systemTemperature)} K`;
  if (statE) statE.textContent = `${(stats.totalKineticEnergy / 1000).toFixed(1)} kJ`;
  if (statV) statV.textContent = `${Math.round(stats.meanSpeed)} px/s`;

  if (gpuStatusBadge) {
    if (engine.isGPUSimulating() && engine.gpuCompute.count > 0) {
      gpuStatusBadge.textContent = `WebGPU Active (${engine.stats.particleCount.toLocaleString()})`;
      gpuStatusBadge.style.background = 'rgba(34,197,94,0.15)';
      gpuStatusBadge.style.color = '#22c55e';
      gpuStatusBadge.style.borderColor = 'rgba(34,197,94,0.3)';
    } else {
      gpuStatusBadge.textContent = 'CPU Simulation';
      gpuStatusBadge.style.background = 'rgba(245,158,11,0.15)';
      gpuStatusBadge.style.color = '#f59e0b';
      gpuStatusBadge.style.borderColor = 'rgba(245,158,11,0.3)';
    }
  }
}

// Chamber Cards (DOM Reuse / Zero-Thrashing)
let lastSensorSignature = '';

function updateChamberCards() {
  if (!chamberCardsContainer) return;
  const sensors = engine.sensors;
  if (sensors.length === 0) {
    if (lastSensorSignature !== 'empty') {
      chamberCardsContainer.innerHTML = '<p class="empty-cell" style="padding:10px 0;">No measurement zones placed</p>';
      lastSensorSignature = 'empty';
    }
    return;
  }

  const currentSignature = sensors.map(s => `${s.id}_${s.label}`).join('|');
  const dotClasses = ['blue', 'red', 'green', 'amber'];

  if (lastSensorSignature !== currentSignature) {
    let html = '';
    for (let i = 0; i < sensors.length; i++) {
      const s = sensors[i];
      const dot = dotClasses[i % dotClasses.length];
      const isOpen = openChamberCardIds.has(s.id);
      html += `
        <div class="chamber-card-item ${isOpen ? 'open' : ''}" data-sensorid="${s.id}" id="card_${s.id}">
          <div class="chamber-card-header" data-toggle="${s.id}">
            <div class="chamber-card-title">
              <span class="dot-indicator ${dot}"></span>
              <span>${s.label}</span>
            </div>
            <div class="chamber-header-actions">
              <button class="btn-chamber-add-chart" data-addchart="${s.id}" title="Add Custom Graph for this Chamber">+ Chart</button>
              <button class="chart-expand-btn" data-expand="${s.id}" title="Open large chart">${EXPAND_ICON}</button>
              <span class="chamber-badge" id="badge_${s.id}">-</span>
            </div>
          </div>
          <div class="chamber-card-body">
            <div class="chamber-inline-metrics" id="metrics_${s.id}">
              <span>T: <b class="val-t">-</b></span>
              <span>p: <b class="val-p">-</b></span>
              <span>N: <b class="val-n">-</b></span>
            </div>
            <div class="chamber-drift-row" id="drift_row_${s.id}">
              <div class="drift-compass-wrap" title="Drift direction and speed">
                <svg class="drift-compass-svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#14171d" stroke="#2a303c" stroke-width="1.2"/>
                  <line x1="16" y1="3" x2="16" y2="5" stroke="#475569" stroke-width="1"/>
                  <line x1="16" y1="27" x2="16" y2="29" stroke="#475569" stroke-width="1"/>
                  <line x1="3" y1="16" x2="5" y2="16" stroke="#475569" stroke-width="1"/>
                  <line x1="27" y1="16" x2="29" y2="16" stroke="#475569" stroke-width="1"/>
                  <circle class="drift-eq-dot" cx="16" cy="16" r="3" fill="#64748b"/>
                  <g class="drift-arrow-group" style="transform-origin: 16px 16px; display: none;">
                    <polygon points="16,5 12,20 16,16 20,20" fill="#22c55e"/>
                  </g>
                </svg>
              </div>
              <div class="drift-info-wrap">
                <span class="drift-caption">Drift:</span>
                <span class="drift-speed-text val-drift">0.0 px/s (equilibrium)</span>
              </div>
            </div>
            <canvas class="chamber-chart-canvas" id="chart_${s.id}" width="320" height="70"></canvas>
          </div>
        </div>
      `;
    }
    chamberCardsContainer.innerHTML = html;

    chamberCardsContainer.querySelectorAll('[data-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        const id = header.dataset.toggle;
        if (openChamberCardIds.has(id)) openChamberCardIds.delete(id);
        else openChamberCardIds.add(id);
        const card = document.getElementById(`card_${id}`);
        if (card) card.classList.toggle('open', openChamberCardIds.has(id));
      });
    });

    chamberCardsContainer.querySelectorAll('[data-expand]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sensor = engine.sensors.find(x => x.id === btn.dataset.expand);
        if (sensor) openChartViewer({ target: sensor, metric: 'temp' });
      });
    });

    chamberCharts.clear();
    sensors.forEach(sensor => {
      const c = document.getElementById(`chart_${sensor.id}`);
      if (c) chamberCharts.set(sensor.id, new ChartView(c, { target: sensor, metric: 'temp' }));
    });

    chamberCardsContainer.querySelectorAll('[data-addchart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.addchart;
        openCustomChartModal(id);
      });
    });

    lastSensorSignature = currentSignature;
  }

  // Update in-place metrics
  for (let i = 0; i < sensors.length; i++) {
    const s = sensors[i];
    const pFormatted = s.pressure >= 1000 ? `${(s.pressure / 1000).toFixed(1)} kPa` : `${s.pressure.toFixed(0)} Pa`;
    const hasDrift = s.displayDriftSpeed && s.displayDriftSpeed > 0;
    const driftAngleDeg = hasDrift ? Math.round((s.driftAngle * 180) / Math.PI) + 90 : 0;
    const rawCompassDeg = (driftAngleDeg - 90 + 360) % 360;
    const driftText = hasDrift ? `${s.displayDriftSpeed.toFixed(1)} px/s (${rawCompassDeg}°)` : '0.0 px/s (equilibrium)';

    const badge = document.getElementById(`badge_${s.id}`);
    if (badge) badge.textContent = `${Math.round(s.temperature)} K | ${s.particleCount} N`;

    const metrics = document.getElementById(`metrics_${s.id}`);
    if (metrics) {
      const elT = metrics.querySelector('.val-t');
      if (elT) elT.textContent = `${Math.round(s.temperature)} K`;
      const elP = metrics.querySelector('.val-p');
      if (elP) elP.textContent = pFormatted;
      const elN = metrics.querySelector('.val-n');
      if (elN) elN.textContent = s.particleCount;
    }

    const driftRow = document.getElementById(`drift_row_${s.id}`);
    if (driftRow) {
      const eqDot = driftRow.querySelector('.drift-eq-dot');
      const arrowGroup = driftRow.querySelector('.drift-arrow-group');
      const speedText = driftRow.querySelector('.val-drift');

      if (hasDrift) {
        if (eqDot) eqDot.style.display = 'none';
        if (arrowGroup) {
          arrowGroup.style.display = 'block';
          arrowGroup.style.transform = `rotate(${driftAngleDeg}deg)`;
        }
        if (speedText) {
          speedText.textContent = driftText;
          speedText.style.color = '#22c55e';
        }
      } else {
        if (eqDot) eqDot.style.display = 'block';
        if (arrowGroup) arrowGroup.style.display = 'none';
        if (speedText) {
          speedText.textContent = '0.0 px/s (equilibrium)';
          speedText.style.color = 'var(--text-dim)';
        }
      }
    }

    if (openChamberCardIds.has(s.id)) chamberCharts.get(s.id)?.render(engine);
  }
}

// ============================================================================
// Custom Multi-Chart Dashboard Management
// ============================================================================
let customChartCounter = 1;

function openCustomChartModal(targetId = null) {
  if (!selectChartTarget) return;
  selectChartTarget.innerHTML = `
    <option value="global">Global System</option>
    ${engine.sensors.map(s => `<option value="${s.id}">${s.label || 'Chamber'}</option>`).join('')}
  `;
  if (targetId && typeof targetId === 'string') {
    selectChartTarget.value = targetId;
  }
  chartModal.style.display = 'flex';
}

function closeCustomChartModal() {
  if (chartModal) chartModal.style.display = 'none';
}

function addCustomChart(targetVal, metricVal) {
  if (!customChartsContainer) return;
  const chartId = `custom_chart_${customChartCounter++}`;
  const targetObj = targetVal === 'global' ? 'global' : (engine.sensors.find(s => s.id === targetVal) || 'global');

  const card = document.createElement('div');
  card.className = 'custom-chart-card';
  card.id = `card_${chartId}`;

  const chartObj = new DashboardChart(chartId, targetObj, metricVal, null);

  card.innerHTML = `
    <div class="custom-chart-header">
      <div class="custom-chart-title"><span>${chartObj.getTitle()}</span></div>
      <div class="custom-chart-actions">
        <button class="chart-expand-btn" data-expand="${chartId}" title="Open large chart">${EXPAND_ICON}</button>
        <button class="custom-chart-close-btn" data-remove="${chartId}" title="Remove Chart">✕</button>
      </div>
    </div>
    <canvas class="custom-chart-canvas" id="canvas_${chartId}" width="310" height="110"></canvas>
  `;

  customChartsContainer.appendChild(card);
  chartObj.attach(document.getElementById(`canvas_${chartId}`));
  customCharts.push(chartObj);

  card.querySelector(`[data-expand="${chartId}"]`)?.addEventListener('click', () => openChartViewer(chartObj.view.spec));
  card.querySelector(`[data-remove="${chartId}"]`)?.addEventListener('click', () => {
    const idx = customCharts.findIndex(c => c.id === chartId);
    if (idx !== -1) customCharts.splice(idx, 1);
    card.remove();
  });

  chartObj.render(engine);
}

btnAddCustomChart?.addEventListener('click', openCustomChartModal);
btnChartModalClose?.addEventListener('click', closeCustomChartModal);
btnChartCancel?.addEventListener('click', closeCustomChartModal);
btnChartConfirm?.addEventListener('click', () => {
  const targetVal = selectChartTarget ? selectChartTarget.value : 'global';
  const metricVal = selectChartMetric ? selectChartMetric.value : 'temp';
  addCustomChart(targetVal, metricVal);
  closeCustomChartModal();
});
window.addEventListener('click', (e) => {
  if (e.target === chartModal) closeCustomChartModal();
});


// --- src/app/toolPreview.js ---
// Live previews of the active drawing tool on the canvas.

// Live Previews
function renderLiveToolPreviews() {
  const ctx = renderer.ctx;
  ctx.save();
  ctx.translate(renderer.panX, renderer.panY);
  ctx.scale(renderer.zoom, renderer.zoom);

  // Polygon Line Preview
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length > 0 && pointer.currentCursorWorld) {
    const last = pointer.polygonPoints[pointer.polygonPoints.length - 1];
    const p0 = pointer.polygonPoints[0];
    const closeDist = 18 / renderer.zoom;
    const isNearStart = pointer.polygonPoints.length >= 2 && (
      Math.hypot(pointer.currentCursorWorld.x - p0.x, pointer.currentCursorWorld.y - p0.y) < closeDist ||
      (renderer.snapCursor && renderer.snapCursor.x === p0.x && renderer.snapCursor.y === p0.y)
    );

    const targetX = isNearStart ? p0.x : pointer.currentCursorWorld.x;
    const targetY = isNearStart ? p0.y : pointer.currentCursorWorld.y;

    // Draw dashed connecting line
    ctx.save();
    ctx.strokeStyle = isNearStart ? '#38bdf8' : '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Draw vertex markers for placed points
    for (let i = 0; i < pointer.polygonPoints.length; i++) {
      const pt = pointer.polygonPoints[i];
      const isStart = (i === 0);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isStart ? 6 / renderer.zoom : 4 / renderer.zoom, 0, Math.PI * 2);
      ctx.fillStyle = isStart ? (isNearStart ? '#38bdf8' : '#eab308') : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / renderer.zoom;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Highlight start node when hovering to close
    if (isNearStart) {
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 11 / renderer.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5 / renderer.zoom;
      ctx.setLineDash([]);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(11, 13 / renderer.zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Click to close', p0.x, p0.y - (14 / renderer.zoom));
    }

    ctx.restore();
  }

  // Arc Preview
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'arc' && pointer.arcSteps.length > 0 && pointer.currentCursorWorld) {
    const c = pointer.arcSteps[0];
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    if (pointer.arcSteps.length === 1) {
      const r = Math.hypot(pointer.currentCursorWorld.x - c.x, pointer.currentCursorWorld.y - c.y);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    } else if (pointer.arcSteps.length === 2) {
      const p1 = pointer.arcSteps[1];
      const r = Math.hypot(p1.x - c.x, p1.y - c.y);
      const a1 = Math.atan2(p1.y - c.y, p1.x - c.x);
      const a2 = Math.atan2(pointer.currentCursorWorld.y - c.y, pointer.currentCursorWorld.x - c.x);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, a1, a2); ctx.stroke();
    }
  }

  // Live dimensions of the current draft
  const m = getDraftMeasurement();
  if (m) renderer.drawHudLabel(m.x, m.y, m.text);

  ctx.restore();
}


// --- src/app/keyboard.js ---
// Keyboard shortcuts, info modal and chart tabs.

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
  if (app.isSplashActive && e.code !== 'Escape') return;

  if (e.ctrlKey || e.metaKey) {
    const handled = {
      KeyZ: () => (e.shiftKey ? performRedo() : performUndo()),
      KeyY: performRedo,
      KeyD: () => ctxDuplicate.click(),
      KeyO: () => fileImportInput.click(),
      KeyS: () => (e.shiftKey ? openSaveModal() : saveProject()),
      KeyA: selectAllElements,
      KeyG: () => (e.shiftKey ? ungroupSelection() : groupSelection()),
      KeyN: () => { if (e.altKey) btnToolbarClear.click(); }
    }[e.code];
    if (handled) {
      e.preventDefault();
      handled();
    }
    return;
  }
  if (e.altKey) return;

  // Typing a number while drawing enters exact dimensions
  if (/^[0-9.]$/.test(e.key) && hasActiveDraft()) {
    e.preventDefault();
    openDimensionInput(e.key);
    return;
  }

  if (e.key === '?') {
    openShortcutsModal();
  } else if (e.key === '+' || e.key === '=') {
    btnZoomIn.click();
  } else if (e.key === '-') {
    btnZoomOut.click();
  } else if (e.code === 'KeyF') {
    fitViewToScene();
  } else if (e.code === 'KeyV') {
    toggleVectors();
  } else if (e.code === 'KeyR' && app.selectedItems.length > 0) {
    btnRotate90.click();
  } else if (e.code === 'Delete' || e.code === 'Backspace') {
    deleteSelectedItems();
  } else if (e.code === 'Space') {
    e.preventDefault();
    btnPlayPause.click();
  } else if (e.code === 'KeyS') {
    btnStep.click();
  } else if (e.code === 'Enter') {
    if (app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length >= 2) {
      const p0 = pointer.polygonPoints[0];
      const prev = pointer.polygonPoints[pointer.polygonPoints.length - 1];
      if (prev.x !== p0.x || prev.y !== p0.y) {
        recordUndoState();
        const w = engine.addWall(prev.x, prev.y, p0.x, p0.y, wallOptions({ groupId: pointer.polygonGroupId }));
        pointer.polygonWalls.push(w);
        app.selectedItems = [...pointer.polygonWalls];
        resetPolygonDraft();
        updateElementsList();
      }
    }
    if (app.activeTool !== 'select') {
      document.getElementById('toolSelect')?.click();
    }
  } else if (e.code === 'Escape') {
    if (app.isSplashActive) {
      if (app.hasActiveSession) {
        hideSplashScreen();
      }
      return;
    }
    if (app.activeTool !== 'select') {
      document.getElementById('toolSelect')?.click();
    }
    resetPolygonDraft();
    pointer.arcSteps = [];
    closeContextMenu();
    closeAllMenus();
    closeSaveModal();
    infoModal.style.display = 'none';
    shortcutsModal.style.display = 'none';
  }
});

// Info & Shortcuts Modals
const shortcutsModal = document.getElementById('shortcutsModal');
btnInfoClose.addEventListener('click', () => { infoModal.style.display = 'none'; });
document.getElementById('btnShortcutsClose')?.addEventListener('click', () => { shortcutsModal.style.display = 'none'; });
window.addEventListener('click', (e) => {
  if (e.target === infoModal) infoModal.style.display = 'none';
  if (e.target === shortcutsModal) shortcutsModal.style.display = 'none';
});

// Chart Tabs
tabTemp.addEventListener('click', () => {
  tabTemp.classList.add('active');
  tabPV.classList.remove('active');
  tempChart.setSpec({ metric: 'temp' });
});
tabPV.addEventListener('click', () => {
  tabPV.classList.add('active');
  tabTemp.classList.remove('active');
  tempChart.setSpec({ metric: 'pv' });
});


// --- src/app/ribbonLayout.js ---
// Responsive ribbon: a row that would overflow switches to icon-only tool
// buttons; if it still overflows, the mouse wheel scrolls it horizontally.
const ribbonRows = document.querySelectorAll('.header-row-ribbon');

function fitRibbonRow(row) {
  row.classList.remove('ribbon-compact');
  if (row.scrollWidth > row.clientWidth + 1) row.classList.add('ribbon-compact');
}

function fitRibbon() {
  ribbonRows.forEach(fitRibbonRow);
}

const ribbonObserver = new ResizeObserver(fitRibbon);
ribbonRows.forEach(row => {
  ribbonObserver.observe(row);
  row.addEventListener('wheel', (e) => {
    if (row.scrollWidth <= row.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });
});


// --- src/main.js ---
// App entry point: wires the src/app modules together, starts the
// ambient splash scene and runs the requestAnimationFrame loop.

// App Startup: Launch in Ambient Splash Mode
setupAmbientScene();
showSplashScreen({ isReturning: false });
updateViewMenuLabels();
const defaultToolBtn = document.getElementById('toolSelect');
if (defaultToolBtn) selectToolButton(defaultToolBtn);
else renderToolProperties(app.activeTool);
updateElementsList();

// Master Animation Loop
let lastTime = performance.now();
let historyTimer = 0;
let telemetryTimer = 0;
let chartTimer = 0;

function animate(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if ((!engine.isPaused && app.isSimulating) || (app.isSplashActive && app.isAmbientSim)) {
    if (app.isSimulating) {
      engine.ambientBounds = null;
      historyTimer += dt;
      if (historyTimer >= 0.05) {
        pushHistoryFrame();
        historyTimer = 0;
      }
    } else if (app.isSplashActive && app.isAmbientSim) {
      // Keep ambient particles floating seamlessly across whole visible window
      const tl = renderer.screenToWorld(0, 0);
      const br = renderer.screenToWorld(canvas.width, canvas.height);
      const pad = 20;
      engine.ambientBounds = {
        minX: tl.x - pad,
        minY: tl.y - pad,
        maxX: br.x + pad,
        maxY: br.y + pad
      };
    }
    engine.step(dt);
  }

  renderer.transformFrame = getTransformFrame();
  renderer.hudLabel = getSelectionHud();
  renderer.showItemHandles = app.activeTool === 'select' && !app.isSimulating;
  renderer.render(engine, app.selectedItems, !app.isSimulating && !app.isAmbientSim);
  renderLiveToolPreviews();
  sequencerUI?.updateLive();

  // Throttled Chart Updates (~15 Hz) to keep UI and Render loop at max FPS
  chartTimer += dt;
  if (chartTimer >= 0.066) {
    tempChart.render(engine);
    velChart.render(engine);

    for (let i = 0; i < customCharts.length; i++) {
      customCharts[i].render(engine);
    }
    renderChartViewer();
    chartTimer = 0;
  }

  timeVal.textContent = `${engine.totalTime.toFixed(2)} s`;
  updateSystemStats();

  telemetryTimer += dt;
  if (telemetryTimer >= 0.15) {
    updateChamberCards();
    refreshInspectorLive();
    refreshTreeLive();
    telemetryTimer = 0;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

