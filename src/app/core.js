// Engine, renderer, charts and sequencer instances; canvas sizing and WebGPU start-up.
import { Engine } from '../physics/Engine.js';
import { Renderer } from '../render/Renderer.js';
import { TempTimeChart } from '../analytics/TempTimeChart.js';
import { VelHistChart } from '../analytics/VelHistChart.js';
import { ChamberChart, DashboardChart } from '../analytics/ChamberChart.js';
import { Presets } from '../presets/index.js';
import { SequencerUI } from '../control/SequencerUI.js';
import { ParticleGPUCompute } from '../physics/ParticleGPUCompute.js';
import { WORLD_SIZE } from '../physics/Constants.js';
import { bgCanvas, canvas, gpuCanvas, tempChartCanvas, velChartCanvas } from './dom.js';

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
export const engine = new Engine(WORLD_SIZE, WORLD_SIZE);
export const renderer = new Renderer(canvas, null, bgCanvas);
window.engine = engine;
window.renderer = renderer;
window.Presets = Presets;
window.ChamberChart = ChamberChart;
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

export const tempChart = new TempTimeChart(tempChartCanvas);
export const velChart = new VelHistChart(velChartCanvas);
export const sequencerUI = new SequencerUI(engine, renderer);
window.sequencerUI = sequencerUI;

renderer.setViewport(canvas.width * 0.5 - 450, canvas.height * 0.5 - 300, 1.0);
