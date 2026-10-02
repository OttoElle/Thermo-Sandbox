// Autosave: the open scene is kept in localStorage so a reload or crash does
// not lose it; the start screen offers it as "Continue". While simulating, the
// scene as it was when the simulation started is saved (not the moving state).
import { engine } from './core.js';
import { app } from './state.js';

const AUTOSAVE_KEY = 'thermo_autosave';
const AUTOSAVE_INTERVAL = 4000; // ms
let lastSaved = null;
let warned = false;

function currentSceneJSON() {
  if (app.isSimulating) return engine.simStartSnapshot || null;
  return JSON.stringify(engine.exportState(app.currentProjectName));
}

// Saves the scene if it changed since the last save. Returns true when written.
export function autosaveNow() {
  // An empty canvas never replaces the saved scene (e.g. after New Simulation)
  if (!app.hasActiveSession || (engine.elements.length === 0 && engine.particles.length === 0)) return false;
  const json = currentSceneJSON();
  if (!json || json === lastSaved) return false;
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ name: app.currentProjectName, timestamp: Date.now(), data: JSON.parse(json) }));
    lastSaved = json;
    return true;
  } catch (err) {
    if (!warned) console.warn('Autosave failed (storage full or unavailable):', err);
    warned = true;
    return false;
  }
}

// { name, timestamp, data } or null.
export function getAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    const rec = raw ? JSON.parse(raw) : null;
    return rec && rec.data ? rec : null;
  } catch (err) {
    return null;
  }
}

setInterval(autosaveNow, AUTOSAVE_INTERVAL);
window.addEventListener('pagehide', autosaveNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosaveNow(); });
