// App entry point: wires the src/app modules together, starts the
// ambient splash scene and runs the requestAnimationFrame loop.
import { canvas, timeVal } from './app/dom.js';
import { engine, renderer, sequencerUI, tempChart, velChart } from './app/core.js';
import { app } from './app/state.js';
import { pushHistoryFrame } from './app/history.js';
import { renderToolProperties, selectToolButton } from './app/toolPanel.js';
import { updateElementsList } from './app/elementTree.js';
import { updateViewMenuLabels } from './app/menus.js';
import { customCharts, updateChamberCards, updateSystemStats } from './app/dashboard.js';
import { renderLiveToolPreviews } from './app/toolPreview.js';
import { setupAmbientScene, showSplashScreen } from './app/splash.js';
import './app/keyboard.js';
import './app/ribbonLayout.js';

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
    chartTimer = 0;
  }

  timeVal.textContent = `${engine.totalTime.toFixed(2)} s`;
  updateSystemStats();

  telemetryTimer += dt;
  if (telemetryTimer >= 0.15) {
    updateChamberCards();
    telemetryTimer = 0;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
