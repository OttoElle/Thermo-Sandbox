// Start screen: examples, recent scenes, continue (autosave) and the ambient background scene.
import { Examples, loadExample } from '../presets/index.js';
import { Engine } from '../physics/Engine.js';
import { drawSceneThumbnail } from './sceneThumbnail.js';
import { getAutosave } from './autosave.js';
import { brandBadge, brandTitle, btnClearRecent, btnSplashClose, btnSplashNew, btnSplashOpen, btnSplashResume, canvas, fileImportInput, splashOverlay, splashPresetsContainer, splashRecentContainer } from './dom.js';
import { engine, renderer } from './core.js';
import { app } from './state.js';
import { openScene, stopAndResetSimulationForNewScene } from './menus.js';

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

export function addRecentProfile(name, stateData) {
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
        <p>No recent scenes yet</p>
        <span>Scenes you open or save appear here</span>
      </div>
    `;
    return;
  }

  splashRecentContainer.innerHTML = '';
  list.forEach(item => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'splash-recent-item';
    el.innerHTML = `
      <canvas class="splash-recent-thumb"></canvas>
      <div class="splash-recent-left">
        <span class="splash-recent-name"></span>
        <div class="splash-recent-meta">
          <span>${item.particleCount || 0} particles</span>
          <span>·</span>
          <span>${formatTimeAgo(item.timestamp)}</span>
        </div>
      </div>
    `;
    el.querySelector('.splash-recent-name').textContent = item.name;
    el.title = item.name;
    el.addEventListener('click', () => openScene(item.name, item.data));
    splashRecentContainer.appendChild(el);
    drawSceneThumbnail(el.querySelector('canvas'), item.data);
  });
}

// Scene states of the examples, built once in a scratch engine for the thumbnails.
let exampleStates = null;

function renderSplashPresets() {
  if (!splashPresetsContainer) return;
  if (!exampleStates) {
    const scratch = new Engine();
    exampleStates = Object.fromEntries(Object.entries(Examples).map(([key, ex]) => [key, loadExample(scratch, ex)]));
  }
  splashPresetsContainer.innerHTML = '';
  Object.entries(Examples).forEach(([key, ex]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'splash-example-card';
    card.dataset.example = key;
    card.innerHTML = `
      <canvas class="splash-example-thumb"></canvas>
      <div class="splash-example-body">
        <div class="splash-example-top">
          <span class="splash-example-name">${ex.name}</span>
          <span class="splash-example-tag">${ex.category}</span>
        </div>
        <p class="splash-example-desc">${ex.description}</p>
        <p class="splash-example-observe"><b>Watch:</b> ${ex.observe}</p>
      </div>
    `;
    card.title = ex.description;
    card.addEventListener('click', () => {
      stopAndResetSimulationForNewScene();
      openScene(ex.name, loadExample(engine, ex), { addToRecent: false });
    });
    splashPresetsContainer.appendChild(card);
    drawSceneThumbnail(card.querySelector('canvas'), exampleStates[key]);
  });
}

// "Continue" offers the autosaved scene when no scene is open yet.
function renderContinue() {
  const btn = document.getElementById('btnSplashContinue');
  if (!btn) return;
  const rec = app.hasActiveSession ? null : getAutosave();
  btn.style.display = rec ? 'flex' : 'none';
  if (!rec) return;
  const desc = document.getElementById('splashContinueDesc');
  if (desc) desc.textContent = `${rec.name} · ${formatTimeAgo(rec.timestamp)}`;
  btn.onclick = () => {
    stopAndResetSimulationForNewScene();
    openScene(rec.name, rec.data, { addToRecent: false });
  };
}

export function setupAmbientScene() {
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

export function showSplashScreen(options = {}) {
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
  
  renderContinue();
  renderRecentProfiles();
  renderSplashPresets();
}

export function hideSplashScreen() {
  app.isSplashActive = false;
  app.isAmbientSim = false;
  engine.ambientBounds = null; // the ambient splash gas wraps around the view; the scene must not
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
  engine.resetScene();
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
