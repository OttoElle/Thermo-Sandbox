// Element popup (quick inspector next to the canvas item).
import { Wall } from '../physics/Wall.js';
import { Piston } from '../physics/Piston.js';
import { Reservoir } from '../physics/Reservoir.js';
import { SensorZone } from '../physics/SensorZone.js';
import { btnPopupClose, elementPopup, popupBody, popupTitle } from './dom.js';
import { engine, renderer } from './core.js';
import { app } from './state.js';
import { recordUndoState } from './history.js';
import { updateElementsList } from './elementTree.js';
import { deleteSelectedItems } from './selection.js';

// Element Popup Logic
function openPopup(item) {
  app.popupTargetItem = item;
  renderPopupContent(item);
  updatePopupPosition();
  elementPopup.style.display = 'flex';
}

export function closePopup() {
  app.popupTargetItem = null;
  elementPopup.style.display = 'none';
}

btnPopupClose.addEventListener('click', closePopup);

export function updatePopupPosition() {
  if (!app.popupTargetItem || elementPopup.style.display === 'none') return;
  let wx = 0, wy = 0;
  if (app.popupTargetItem instanceof Wall) {
    wx = (app.popupTargetItem.p1.x + app.popupTargetItem.p2.x) * 0.5;
    wy = (app.popupTargetItem.p1.y + app.popupTargetItem.p2.y) * 0.5;
  } else if (app.popupTargetItem instanceof Piston) {
    wx = app.popupTargetItem.x;
    wy = app.popupTargetItem.y - app.popupTargetItem.height * 0.5;
  } else if (app.popupTargetItem.x !== undefined && app.popupTargetItem.y !== undefined) {
    wx = app.popupTargetItem.x + (app.popupTargetItem.width || 0) * 0.5;
    wy = app.popupTargetItem.y;
  }
  const screen = renderer.worldToScreen(wx, wy);
  elementPopup.style.left = `${Math.max(300, Math.min(window.innerWidth - 400, screen.x))}px`;
  elementPopup.style.top = `${Math.max(100, Math.min(window.innerHeight - 100, screen.y))}px`;
}

function renderPopupContent(item) {
  if (item instanceof Piston) {
    popupTitle.textContent = `Piston [${item.label}]`;
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Mass m</span> <span id="popPMassVal" class="field-num">${item.mass}</span></div>
        <input type="range" id="popPMass" min="0" max="150" step="5" value="${item.mass}" class="styled-slider">
      </div>
      <div class="field-row">
        <div class="field-label"><span>Conductivity κ</span> <span id="popPKappaVal" class="field-num">${item.conductivity.toFixed(2)}</span></div>
        <input type="range" id="popPKappa" min="0" max="1" step="0.05" value="${item.conductivity}" class="styled-slider">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Piston</button>
    `;
    document.getElementById('popPMass').addEventListener('input', (e) => {
      item.mass = parseInt(e.target.value, 10);
      document.getElementById('popPMassVal').textContent = item.mass;
    });
    document.getElementById('popPKappa').addEventListener('input', (e) => {
      item.conductivity = parseFloat(e.target.value);
      document.getElementById('popPKappaVal').textContent = item.conductivity.toFixed(2);
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.pistons = engine.pistons.filter(p => p !== item);
      app.selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else if (item instanceof Wall) {
    popupTitle.textContent = item.type === 'manual_valve' ? 'Valve' : 'Wall';
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Conductivity κ</span> <span id="popWKappaVal" class="field-num">${item.conductivity.toFixed(2)}</span></div>
        <input type="range" id="popWKappa" min="0" max="1" step="0.05" value="${item.conductivity}" class="styled-slider">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Wall</button>
    `;
    document.getElementById('popWKappa').addEventListener('input', (e) => {
      item.conductivity = parseFloat(e.target.value);
      document.getElementById('popWKappaVal').textContent = item.conductivity.toFixed(2);
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.walls = engine.walls.filter(w => w !== item);
      app.selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else if (item instanceof Reservoir) {
    popupTitle.textContent = 'Thermal Reservoir';
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Temperature T</span> <span id="popResTVal" class="field-num">${Math.round(item.temperature)} K</span></div>
        <input type="range" id="popResT" min="50" max="800" step="25" value="${item.temperature}" class="styled-slider">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Reservoir</button>
    `;
    document.getElementById('popResT').addEventListener('input', (e) => {
      item.temperature = parseInt(e.target.value, 10);
      item.label = `${item.temperature}K`;
      document.getElementById('popResTVal').textContent = `${item.temperature} K`;
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.reservoirs = engine.reservoirs.filter(r => r !== item);
      app.selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else if (item instanceof SensorZone) {
    popupTitle.textContent = 'Chamber Sensor';
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Chamber Name</span></div>
        <input type="text" id="popSensName" value="${item.label}" class="styled-select" style="width:100%;">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Sensor</button>
    `;
    document.getElementById('popSensName').addEventListener('input', (e) => {
      item.label = e.target.value.trim() || 'Chamber';
      updateElementsList();
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.sensors = engine.sensors.filter(s => s !== item);
      app.selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else {
    popupTitle.textContent = 'Component';
    popupBody.innerHTML = `
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="width:100%; justify-content:center;">Delete Element</button>
    `;
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      deleteSelectedItems();
      closePopup();
      updateElementsList();
    });
  }
}
