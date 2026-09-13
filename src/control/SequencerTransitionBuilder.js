/**
 * SequencerTransitionBuilder.js
 * Interactive 2D Visual Builder for Compound Transition Conditions.
 * Renders bracketed rows, compact square monochrome SVG chips, and horizontal/vertical AND/OR operator pills.
 */

import { SequencerConditions } from './SequencerConditions.js';

export class SequencerTransitionBuilder {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onChange: (data) => void }
    this.data = SequencerConditions.normalizeTransition(null);
    this.expandedKey = '0_0';
    this.engine = null;
    this.containerEl = null;
  }

  setData(transitionData, engine = null) {
    this.data = SequencerConditions.normalizeTransition(transitionData);
    this.expandedKey = '0_0';
    if (engine) this.engine = engine;
  }

  getData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  _btn(cls, html, title, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.innerHTML = html;
    b.title = title;
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }

  render(containerEl, engine = null) {
    if (containerEl) this.containerEl = containerEl;
    if (engine) this.engine = engine;
    if (!this.containerEl) return;

    this.containerEl.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'seq-trans-grid';

    const rows = this.data.rows;

    rows.forEach((row, rIdx) => {
      const rowCard = document.createElement('div');
      rowCard.className = 'seq-trans-row-card';

      const leftBracket = document.createElement('span');
      leftBracket.className = 'seq-trans-bracket';
      leftBracket.textContent = '(';
      rowCard.appendChild(leftBracket);

      const chipsTrack = document.createElement('div');
      chipsTrack.className = 'seq-trans-chips-track';

      row.conditions.forEach((cond, cIdx) => {
        const key = `${rIdx}_${cIdx}`;
        chipsTrack.appendChild(this.expandedKey === key
          ? this._renderExpandedChip(cond, rIdx, cIdx)
          : this._renderCollapsedChip(cond, rIdx, cIdx));

        if (cIdx < row.conditions.length - 1) {
          const op = (row.operators[cIdx] || 'AND').toUpperCase();
          const isOr = op === 'OR' || op === '||';
          const pill = this._btn(`seq-trans-op-pill ${isOr ? 'is-or' : 'is-and'}`, isOr ? '||' : '&',
            `Toggle operator: currently ${isOr ? 'OR' : 'AND'}`, () => {
              row.operators[cIdx] = isOr ? 'AND' : 'OR';
              this._notifyChange();
              this.render();
            });
          chipsTrack.appendChild(pill);
        }
      });
      rowCard.appendChild(chipsTrack);

      const rightBracket = document.createElement('span');
      rightBracket.className = 'seq-trans-bracket';
      rightBracket.textContent = ')';
      rowCard.appendChild(rightBracket);

      const rowActions = document.createElement('div');
      rowActions.className = 'seq-trans-row-actions';
      rowActions.appendChild(this._btn('seq-trans-btn-mini btn-add-and', '+ &', 'Add condition to row with AND', () => {
        row.conditions.push({ type: 'duration', duration: 1.5 });
        row.operators.push('AND');
        this.expandedKey = `${rIdx}_${row.conditions.length - 1}`;
        this._notifyChange();
        this.render();
      }));
      rowActions.appendChild(this._btn('seq-trans-btn-mini btn-add-or', '+ ||', 'Add condition to row with OR', () => {
        row.conditions.push({ type: 'duration', duration: 1.5 });
        row.operators.push('OR');
        this.expandedKey = `${rIdx}_${row.conditions.length - 1}`;
        this._notifyChange();
        this.render();
      }));

      if (rows.length > 1) {
        rowActions.appendChild(this._btn('seq-trans-btn-mini btn-del-row', '&times;', 'Delete row', () => {
          rows.splice(rIdx, 1);
          if (rIdx < this.data.rowOperators.length) this.data.rowOperators.splice(rIdx, 1);
          else if (this.data.rowOperators.length > 0) this.data.rowOperators.pop();
          this.expandedKey = '0_0';
          this._notifyChange();
          this.render();
        }));
      }

      rowCard.appendChild(rowActions);
      gridEl.appendChild(rowCard);

      if (rIdx < rows.length - 1) {
        const rowOp = (this.data.rowOperators[rIdx] || 'OR').toUpperCase();
        const isOr = rowOp === 'OR' || rowOp === '||';
        const vDivider = document.createElement('div');
        vDivider.className = 'seq-trans-v-divider';
        vDivider.appendChild(document.createElement('div')).className = 'seq-trans-v-line';
        vDivider.appendChild(this._btn(`seq-trans-op-pill v-pill ${isOr ? 'is-or' : 'is-and'}`, isOr ? '||' : '&',
          `Toggle row operator: currently ${isOr ? 'OR' : 'AND'}`, () => {
            this.data.rowOperators[rIdx] = isOr ? 'AND' : 'OR';
            this._notifyChange();
            this.render();
          }));
        vDivider.appendChild(document.createElement('div')).className = 'seq-trans-v-line';
        gridEl.appendChild(vDivider);
      }
    });

    const addRowBar = document.createElement('div');
    addRowBar.className = 'seq-trans-add-row-bar';
    addRowBar.appendChild(this._btn('seq-trans-btn-add-row',
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>& Zeile</span>',
      'Add row with AND', () => {
        this.data.rowOperators.push('AND');
        this.data.rows.push({ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] });
        this.expandedKey = `${this.data.rows.length - 1}_0`;
        this._notifyChange();
        this.render();
      }));
    addRowBar.appendChild(this._btn('seq-trans-btn-add-row',
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>|| Zeile</span>',
      'Add row with OR', () => {
        this.data.rowOperators.push('OR');
        this.data.rows.push({ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] });
        this.expandedKey = `${this.data.rows.length - 1}_0`;
        this._notifyChange();
        this.render();
      }));

    gridEl.appendChild(addRowBar);
    this.containerEl.appendChild(gridEl);
  }

  _renderCollapsedChip(cond, rIdx, cIdx) {
    const chip = document.createElement('div');
    chip.className = 'seq-trans-chip is-collapsed';
    chip.title = `Click to edit: ${this._getTooltip(cond)}`;

    let svg = '', badge = '';
    const type = cond.type || 'duration';

    if (type === 'duration') {
      svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      badge = `${(cond.duration !== undefined ? cond.duration : 1.5).toFixed(1)}s`;
    } else if (type === 'piston' || type === 'piston_target') {
      svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>';
      badge = (cond.pistonTarget || 'tdc').toUpperCase();
    } else if (type === 'sensor') {
      svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 12l3-3"/><path d="M7 12a5 5 0 0 1 10 0"/></svg>';
      const metric = cond.sensorMetric === 'temperature' ? 'T' : 'P';
      const unit = cond.sensorMetric === 'temperature' ? 'K' : 'Pa';
      badge = `${metric}${cond.sensorOperator || '>='}${cond.sensorThreshold || 200}${unit}`;
    }

    chip.innerHTML = `<div class="seq-trans-chip-icon">${svg}</div><div class="seq-trans-chip-badge">${badge}</div>`;
    chip.addEventListener('click', () => { this.expandedKey = `${rIdx}_${cIdx}`; this.render(); });
    return chip;
  }

  _renderExpandedChip(cond, rIdx, cIdx) {
    const chip = document.createElement('div');
    chip.className = 'seq-trans-chip is-expanded';
    const type = cond.type || 'duration';
    const totalConds = this.data.rows.reduce((sum, r) => sum + r.conditions.length, 0);

    chip.innerHTML = `
      <div class="seq-trans-chip-header">
        <select class="styled-select seq-chip-type-select">
          <option value="duration" ${type === 'duration' ? 'selected' : ''}>Time Duration</option>
          <option value="piston" ${type === 'piston' || type === 'piston_target' ? 'selected' : ''}>Piston Target</option>
          <option value="sensor" ${type === 'sensor' ? 'selected' : ''}>Sensor Chamber</option>
        </select>
        <button type="button" class="btn-icon-sm btn-del-chip" title="Remove Condition" ${totalConds <= 1 ? 'disabled' : ''}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="seq-trans-chip-body"></div>
    `;

    const typeSelect = chip.querySelector('.seq-chip-type-select');
    const bodyEl = chip.querySelector('.seq-trans-chip-body');

    const updateBody = (curType, curData) => {
      bodyEl.innerHTML = '';
      if (curType === 'duration') {
        const dur = curData.duration !== undefined ? curData.duration : 1.5;
        bodyEl.innerHTML = `
          <div class="field-row" style="margin-bottom:0;">
            <div class="field-label"><span style="font-size:10px;">Elapsed >=</span><span class="field-num lbl-dur" style="font-size:10px;">${dur.toFixed(1)} s</span></div>
            <input type="range" class="styled-slider input-dur" min="0.1" max="10.0" step="0.1" value="${dur}">
          </div>
        `;
        const slider = bodyEl.querySelector('.input-dur');
        const lbl = bodyEl.querySelector('.lbl-dur');
        slider?.addEventListener('input', () => {
          curData.duration = parseFloat(slider.value);
          if (lbl) lbl.textContent = `${curData.duration.toFixed(1)} s`;
          this._notifyChange();
        });
      } else if (curType === 'piston') {
        if (!curData.pistonTarget) curData.pistonTarget = 'tdc';
        const pistons = this.engine?.pistons || [];
        let pOptions = `<option value="">All Pistons</option>`;
        pistons.forEach((p, idx) => { pOptions += `<option value="${p.id}" ${curData.pistonId === p.id ? 'selected' : ''}>Piston ${idx + 1}</option>`; });
        const tgt = curData.pistonTarget;
        bodyEl.innerHTML = `
          <select class="styled-select input-piston-id" style="width:100%; margin-bottom:2px;">${pOptions}</select>
          <select class="styled-select input-piston-tgt" style="width:100%;">
            <option value="tdc" ${tgt === 'tdc' ? 'selected' : ''}>Top Dead Center (TDC)</option>
            <option value="bdc" ${tgt === 'bdc' ? 'selected' : ''}>Bottom Dead Center (BDC)</option>
          </select>
        `;
        bodyEl.querySelector('.input-piston-id')?.addEventListener('change', (e) => { curData.pistonId = e.target.value || null; this._notifyChange(); });
        bodyEl.querySelector('.input-piston-tgt')?.addEventListener('change', (e) => { curData.pistonTarget = e.target.value; this._notifyChange(); });
      } else if (curType === 'sensor') {
        if (!curData.sensorMetric) curData.sensorMetric = 'pressure';
        if (!curData.sensorOperator) curData.sensorOperator = '>=';
        if (curData.sensorThreshold === undefined) curData.sensorThreshold = 200;
        const sensors = this.engine?.sensors || [];
        let sOptions = sensors.length === 0 ? `<option value="">(No Chambers)</option>` : '';
        sensors.forEach(s => { sOptions += `<option value="${s.id}" ${curData.sensorId === s.id ? 'selected' : ''}>${s.label || 'Chamber'}</option>`; });
        const metric = curData.sensorMetric;
        const op = curData.sensorOperator;
        const thresh = curData.sensorThreshold;
        bodyEl.innerHTML = `
          <select class="styled-select input-sensor-id" style="width:100%; margin-bottom:2px;">${sOptions}</select>
          <div style="display:flex; gap:4px; align-items:center; width:100%;">
            <select class="styled-select input-sensor-metric" style="flex:1; min-width:0;">
              <option value="pressure" ${metric === 'pressure' ? 'selected' : ''}>P (Pa)</option>
              <option value="temperature" ${metric === 'temperature' ? 'selected' : ''}>T (K)</option>
            </select>
            <select class="styled-select input-sensor-op" style="width:46px; min-width:46px; text-align:center;">
              <option value=">=" ${op === '>=' ? 'selected' : ''}>&gt;=</option>
              <option value="<=" ${op === '<=' ? 'selected' : ''}>&lt;=</option>
            </select>
            <input type="number" class="styled-select input-sensor-thresh" value="${thresh}" style="width:56px; min-width:56px;">
          </div>
        `;
        bodyEl.querySelector('.input-sensor-id')?.addEventListener('change', (e) => { curData.sensorId = e.target.value || null; this._notifyChange(); });
        bodyEl.querySelector('.input-sensor-metric')?.addEventListener('change', (e) => { curData.sensorMetric = e.target.value; this._notifyChange(); });
        bodyEl.querySelector('.input-sensor-op')?.addEventListener('change', (e) => { curData.sensorOperator = e.target.value; this._notifyChange(); });
        bodyEl.querySelector('.input-sensor-thresh')?.addEventListener('input', (e) => { curData.sensorThreshold = parseFloat(e.target.value) || 0; this._notifyChange(); });
      }
    };

    updateBody(type, cond);
    typeSelect.addEventListener('change', () => { cond.type = typeSelect.value; updateBody(cond.type, cond); this._notifyChange(); });

    chip.querySelector('.btn-del-chip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = this.data.rows[rIdx];
      row.conditions.splice(cIdx, 1);
      if (cIdx < row.operators.length) row.operators.splice(cIdx, 1);
      else if (row.operators.length > 0) row.operators.pop();
      if (row.conditions.length === 0) {
        this.data.rows.splice(rIdx, 1);
        if (rIdx < this.data.rowOperators.length) this.data.rowOperators.splice(rIdx, 1);
        else if (this.data.rowOperators.length > 0) this.data.rowOperators.pop();
      }
      if (this.data.rows.length === 0) {
        this.data.rows.push({ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] });
      }
      this.expandedKey = '0_0';
      this._notifyChange();
      this.render();
    });

    return chip;
  }

  _getTooltip(cond) {
    const type = cond.type || 'duration';
    if (type === 'duration') return `Time >= ${(cond.duration || 1.5).toFixed(1)}s`;
    if (type === 'piston' || type === 'piston_target') return `Piston reaches ${(cond.pistonTarget || 'tdc').toUpperCase()}`;
    if (type === 'sensor') {
      const metric = cond.sensorMetric === 'temperature' ? 'T' : 'P';
      const unit = cond.sensorMetric === 'temperature' ? 'K' : 'Pa';
      return `Sensor ${metric} ${cond.sensorOperator || '>='} ${cond.sensorThreshold || 200}${unit}`;
    }
    return 'Condition';
  }

  _notifyChange() {
    if (typeof this.callbacks.onChange === 'function') {
      this.callbacks.onChange(this.getData());
    }
  }
}

