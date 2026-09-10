import { thermalColormap } from './Colormap.js';
import { Wall } from '../physics/Wall.js';
import { Piston } from '../physics/Piston.js';
import { Reservoir } from '../physics/Reservoir.js';
import { SensorZone } from '../physics/SensorZone.js';
import { Emitter } from '../physics/Emitter.js';
import { Sink } from '../physics/Sink.js';
import { ThermalBlock } from '../physics/ThermalBlock.js';
import { HeatExchanger } from '../physics/HeatExchanger.js';
import { RegeneratorMatrix } from '../physics/RegeneratorMatrix.js';
import { TextLabel } from '../physics/TextLabel.js';
import { ParticleGroup } from '../physics/ParticleGroup.js';
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { ParticleGLRenderer } from './ParticleGLRenderer.js';

export class Renderer {
  constructor(canvas, glCanvas = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.glCanvas = null;
    this.glRenderer = null;
    this.useWebGL = false;

    if (glCanvas) {
      this.setGLCanvas(glCanvas);
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
    this.colorByVelocity = true;
    this.snapCursor = null; // { x, y } in world coordinates

    this.maxSpeedReference = 380;
    this.highlightedSequencerItem = null;
  }

  setGLCanvas(glCanvas) {
    this.glCanvas = glCanvas;
    try {
      this.glRenderer = glCanvas ? new ParticleGLRenderer(glCanvas) : null;
      this.useWebGL = !!(this.glRenderer && this.glRenderer.isSupported);
    } catch (e) {
      console.warn('Failed to initialize ParticleGLRenderer, using 2D Canvas fallback:', e);
      this.glRenderer = null;
      this.useWebGL = false;
    }
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

    if (this.useWebGL) {
      // Clear 2D overlay canvas to transparent
      ctx.clearRect(0, 0, w, h);
    } else {
      // 2D fallback: dark background
      ctx.fillStyle = '#101216';
      ctx.fillRect(0, 0, w, h);
    }

    if (this.showGrid) {
      this.drawDotGrid();
    }
  }

  drawDotGrid() {
    const ctx = this.ctx;
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

  render(engine, selectedItems = []) {
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

    // 2. Particles (Rendered on top of physical structures)
    if (this.useWebGL) {
      this.glRenderer.render(engine.particles, this.panX, this.panY, this.zoom, this.maxSpeedReference, this.colorByVelocity);
      const pCount = engine.particles.length;
      for (let i = 0; i < pCount; i++) {
        const p = engine.particles[i];
        if (p.selected || this.showVectors) {
          this.drawParticleOverlay(p);
        }
      }
    } else {
      if (this.glRenderer) this.glRenderer.clear();
      for (let i = 0; i < engine.particles.length; i++) {
        this.drawParticle(engine.particles[i]);
      }
    }

    // 9. Selected Group Bounding Frames & Resize Handles
    if (Array.isArray(selectedItems) && selectedItems.length > 0) {
      const groupsMap = new Map();
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        if (item.groupId) {
          if (!groupsMap.has(item.groupId)) groupsMap.set(item.groupId, []);
          groupsMap.get(item.groupId).push(item);
        }
      }

      groupsMap.forEach((gItems, gid) => {
        if (gItems.length > 1) {
          this.drawGroupBoundingBox(gItems, gid);
        }
      });

      for (let i = 0; i < selectedItems.length; i++) {
        const sel = selectedItems[i];
        if (sel instanceof ParticleGroup) {
          this.drawParticleGroupHighlight(engine, sel);
        } else {
          this.drawResizeHandles(sel);
        }
      }
    }

    // 9.5 Sequencer Action Selection Glow (Subtle Cyan Outline, No Handles)
    if (this.highlightedSequencerItem) {
      this.drawSequencerHighlight(this.highlightedSequencerItem);
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

  drawSequencerHighlight(item) {
    if (!item) return;
    const ctx = this.ctx;
    ctx.save();
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
      ctx.fillText(`Sink (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

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
      ctx.fillText(`Ressavoir (${Math.round(w)}×${Math.round(h)})`, minX + w * 0.5, minY + h * 0.5 + 4);

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
        else if (tool === 'sink') label = `Sink (${Math.round(w)}×${Math.round(h)})`;
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

    // Header label with chamber name in dedicated color and live temperature
    ctx.fillStyle = isSelected ? '#ffffff' : dedicatedColor;
    ctx.font = 'bold 11.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    const tempText = hasParticles ? ` [${Math.round(sensor.temperature)} K]` : ' (Empty)';
    ctx.fillText(`${sensor.label}${tempText}`, sensor.x + sensor.width * 0.5, sensor.y + 18);

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
    const textStr = `Sink ${Math.round(res.temperature)}K${isActive ? '' : ' [OFF]'}`;
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
    const textStr = `Ressavoir ${Math.round(block.temperature)}K${isActive ? '' : ' [OFF]'}`;
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
    } else { // 360
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
      ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
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

  drawParticle(p) {
    const ctx = this.ctx;
    const speed = p.getSpeed();
    let fillStyle = '#38bdf8';

    if (this.colorByVelocity) {
      const norm = Math.min(1.0, speed / this.maxSpeedReference);
      const colorObj = thermalColormap.getColor(norm);
      fillStyle = colorObj.rgb;
    }

    // Particle circle
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

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
    if (this.showVectors && speed > 2) {
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

  drawParticleOverlay(p) {
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
    if (this.showVectors && speed > 2) {
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
}
