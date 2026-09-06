export class SpatialGrid {
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
