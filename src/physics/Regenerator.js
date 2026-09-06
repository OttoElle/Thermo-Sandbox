import { Vector2 } from './Vector2.js';

export class Regenerator {
  constructor(x, y, width, height, options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.label = options.label || 'Regenerator';
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.flowAxis = options.flowAxis || 'vertical'; // 'vertical' (Stirling displacer) or 'horizontal'
    this.initialTempCold = options.initialTempCold !== undefined ? options.initialTempCold : 120;
    this.initialTempHot = options.initialTempHot !== undefined ? options.initialTempHot : 300;
    
    this.flowDrag = options.flowDrag !== undefined ? options.flowDrag : 0.03; // Darcy flow resistance
    this.heatCapacity = options.heatCapacity !== undefined ? options.heatCapacity : 250; // J/K per cell
    this.axialConductivity = options.axialConductivity !== undefined ? options.axialConductivity : 0.02; // Minimal to hold gradient
    this.transverseConductivity = options.transverseConductivity !== undefined ? options.transverseConductivity : 0.2;
    this.heatTransferRate = options.heatTransferRate !== undefined ? options.heatTransferRate : 0.6; // Coupling to gas

    // Grid resolution
    this.cols = Math.max(1, Math.round(width / 20));
    this.rows = Math.max(1, Math.round(height / 20));
    this.cellW = width / this.cols;
    this.cellH = height / this.rows;

    // Initialize 2D thermal cells
    this.cells = [];
    this._initCells();
  }

  _initCells() {
    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        // Gradient from cold to hot along flowAxis
        const frac = this.flowAxis === 'vertical' ? (r / (this.rows - 1 || 1)) : (c / (this.cols - 1 || 1));
        const temp = this.initialTempCold + frac * (this.initialTempHot - this.initialTempCold);
        row.push({
          temp: temp,
          heatAccum: 0
        });
      }
      this.cells.push(row);
    }
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getCellAt(px, py) {
    if (!this.contains(px, py)) return null;
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor((px - this.x) / this.cellW)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor((py - this.y) / this.cellH)));
    return { cell: this.cells[row][col], col, row };
  }

  update(dt) {
    if (dt <= 0) return;

    // 1. Internal 2D conduction between cells
    const newTemps = [];
    for (let r = 0; r < this.rows; r++) {
      newTemps[r] = [];
      for (let c = 0; c < this.cols; c++) {
        newTemps[r][c] = this.cells[r][c].temp + (this.cells[r][c].heatAccum / this.heatCapacity);
        this.cells[r][c].heatAccum = 0;
      }
    }

    const isVert = this.flowAxis === 'vertical';
    const lambdaX = isVert ? this.transverseConductivity : this.axialConductivity;
    const lambdaY = isVert ? this.axialConductivity : this.transverseConductivity;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const curT = newTemps[r][c];

        // Horizontal neighbor
        if (c + 1 < this.cols) {
          const deltaTx = newTemps[r][c + 1] - curT;
          const qx = lambdaX * deltaTx * 10 * dt;
          this.cells[r][c].temp += qx / this.heatCapacity;
          this.cells[r][c + 1].temp -= qx / this.heatCapacity;
        }

        // Vertical neighbor
        if (r + 1 < this.rows) {
          const deltaTy = newTemps[r + 1][c] - curT;
          const qy = lambdaY * deltaTy * 10 * dt;
          this.cells[r][c].temp += qy / this.heatCapacity;
          this.cells[r + 1][c].temp -= qy / this.heatCapacity;
        }
      }
    }
  }

  interactWithParticle(p, dt) {
    const info = this.getCellAt(p.pos.x, p.pos.y);
    if (!info) return;

    const cell = info.cell;

    // 1. Apply Darcy flow drag resistance
    const dragFactor = Math.max(0, 1 - this.flowDrag * 60 * dt);
    p.vel.multiplyScalar(dragFactor);

    // 2. Microscopic heat exchange (Energy conservation: ΔE_particle = -ΔE_cell)
    const kB = 35.0;
    const currentSpeedSq = p.vel.lengthSq();
    const targetSpeedSq = (2 * kB * cell.temp) / p.mass;

    // Thermalize speed towards cell temp
    const alpha = Math.min(1.0, this.heatTransferRate * 30 * dt);
    const newSpeedSq = (1 - alpha) * currentSpeedSq + alpha * targetSpeedSq;
    const speedRatio = currentSpeedSq > 0.001 ? Math.sqrt(newSpeedSq / currentSpeedSq) : 1;

    const energyBefore = 0.5 * p.mass * currentSpeedSq;
    p.vel.multiplyScalar(speedRatio);
    const energyAfter = 0.5 * p.mass * p.vel.lengthSq();

    const deltaE = energyAfter - energyBefore; // Energy gained by particle
    cell.heatAccum -= deltaE; // Energy lost by cell matrix
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      flowAxis: this.flowAxis,
      initialTempCold: this.initialTempCold,
      initialTempHot: this.initialTempHot,
      flowDrag: this.flowDrag,
      heatCapacity: this.heatCapacity,
      axialConductivity: this.axialConductivity,
      transverseConductivity: this.transverseConductivity,
      heatTransferRate: this.heatTransferRate
    };
  }

  static fromJSON(data) {
    return new Regenerator(data.x, data.y, data.width, data.height, data);
  }
}
