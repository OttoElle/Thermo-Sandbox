// Renders the property fields of an element type from the schema. Used by the
// tool dialog, the properties panel and the sequencer action dialog, so all
// three show the same labels, ranges, units and default markers.
import { ELEMENT_TYPES, fieldsFor } from '../model/elementSchema.js';

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
export function renderPropertyForm(container, type, values, { context, onChange, onBeginEdit } = {}) {
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

export function typeLabel(type) {
  return ELEMENT_TYPES[type]?.label || 'Element';
}
