// Grid snapping and the dual slider/number input helpers.
import { renderer } from './core.js';

// Grid Snapping
export function snapToGrid(v) {
  if (!renderer.snapToGrid) return v;
  return Math.round(v / renderer.gridSize) * renderer.gridSize;
}

// Synchronized Dual Slider + Number Input Helpers
export function makeDualInput(label, id, min, max, step, value, unit = '') {
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

export function attachDualInput(id, onChange) {
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
