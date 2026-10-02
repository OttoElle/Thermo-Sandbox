/**
 * SequencerTransitionBuilder.js
 * Editor for compound transition conditions: rows of condition chips joined by
 * AND/OR inside a row (bracketed), rows joined by AND/OR. One chip at a time is
 * expanded and edited with the shared property form.
 */
import { renderPropertyForm } from '../app/propertyForm.js';
import { SequencerConditions } from './SequencerConditions.js';
import { CONDITION_TYPES, STRUCTURAL_KEYS, conditionFields, defaultCondition, prepareCondition, summarizeCondition } from './SequencerConditionFields.js';

const ICONS = {
  duration: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  piston: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="12" height="10" rx="1"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="9" y1="7" x2="9" y2="17"/></svg>',
  sensor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 12l3-3"/><path d="M7 12a5 5 0 0 1 10 0"/></svg>'
};
const PLUS = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const CROSS = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

const isOr = op => { const o = (op || '').toUpperCase(); return o === 'OR' || o === '||'; };

export class SequencerTransitionBuilder {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onChange: (data) => void }
    this.data = SequencerConditions.normalizeTransition(null);
    this.expandedKey = '0_0';
    this.engine = null;
    this.containerEl = null;
  }

  setData(transitionData, engine = null) {
    if (engine) this.engine = engine;
    this.data = SequencerConditions.normalizeTransition(transitionData);
    this.data.rows.forEach(r => r.conditions.forEach(c => prepareCondition(c, this.engine)));
    this.expandedKey = '0_0';
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

  _changed(rerender = true) {
    if (typeof this.callbacks.onChange === 'function') this.callbacks.onChange(this.getData());
    if (rerender) this.render();
  }

  _addCondition(row, op, rIdx) {
    row.conditions.push(defaultCondition('duration'));
    row.operators.push(op);
    this.expandedKey = `${rIdx}_${row.conditions.length - 1}`;
    this._changed();
  }

  _addRow(op) {
    this.data.rowOperators.push(op);
    this.data.rows.push({ conditions: [defaultCondition('duration')], operators: [] });
    this.expandedKey = `${this.data.rows.length - 1}_0`;
    this._changed();
  }

  _opPill(op, vertical, onToggle) {
    const or = isOr(op);
    return this._btn(`seq-trans-op-pill ${vertical ? 'v-pill' : ''} ${or ? 'is-or' : 'is-and'}`, or ? '||' : '&',
      `${or ? 'OR' : 'AND'}, click to switch to ${or ? 'AND' : 'OR'}`, onToggle);
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
      rowCard.appendChild(Object.assign(document.createElement('span'), { className: 'seq-trans-bracket', textContent: '(' }));

      const chipsTrack = document.createElement('div');
      chipsTrack.className = 'seq-trans-chips-track';
      row.conditions.forEach((cond, cIdx) => {
        const key = `${rIdx}_${cIdx}`;
        chipsTrack.appendChild(this.expandedKey === key ? this._expandedChip(cond, rIdx, cIdx) : this._collapsedChip(cond, rIdx, cIdx));
        if (cIdx < row.conditions.length - 1) {
          chipsTrack.appendChild(this._opPill(row.operators[cIdx], false, () => {
            row.operators[cIdx] = isOr(row.operators[cIdx]) ? 'AND' : 'OR';
            this._changed();
          }));
        }
      });
      rowCard.appendChild(chipsTrack);
      rowCard.appendChild(Object.assign(document.createElement('span'), { className: 'seq-trans-bracket', textContent: ')' }));

      const rowActions = document.createElement('div');
      rowActions.className = 'seq-trans-row-actions';
      rowActions.appendChild(this._btn('seq-trans-btn-mini btn-add-and', '+ &', 'Add a condition to this row (AND)', () => this._addCondition(row, 'AND', rIdx)));
      rowActions.appendChild(this._btn('seq-trans-btn-mini btn-add-or', '+ ||', 'Add a condition to this row (OR)', () => this._addCondition(row, 'OR', rIdx)));
      if (rows.length > 1) {
        rowActions.appendChild(this._btn('seq-trans-btn-mini btn-del-row', '&times;', 'Delete row', () => {
          rows.splice(rIdx, 1);
          this.data.rowOperators.splice(Math.min(rIdx, this.data.rowOperators.length - 1), 1);
          this.expandedKey = '0_0';
          this._changed();
        }));
      }
      rowCard.appendChild(rowActions);
      gridEl.appendChild(rowCard);

      if (rIdx < rows.length - 1) {
        const vDivider = document.createElement('div');
        vDivider.className = 'seq-trans-v-divider';
        vDivider.appendChild(document.createElement('div')).className = 'seq-trans-v-line';
        vDivider.appendChild(this._opPill(this.data.rowOperators[rIdx] || 'OR', true, () => {
          this.data.rowOperators[rIdx] = isOr(this.data.rowOperators[rIdx] || 'OR') ? 'AND' : 'OR';
          this._changed();
        }));
        vDivider.appendChild(document.createElement('div')).className = 'seq-trans-v-line';
        gridEl.appendChild(vDivider);
      }
    });

    const addRowBar = document.createElement('div');
    addRowBar.className = 'seq-trans-add-row-bar';
    addRowBar.appendChild(this._btn('seq-trans-btn-add-row', `${PLUS}<span>&amp; Row</span>`, 'Add a row that must also hold (AND)', () => this._addRow('AND')));
    addRowBar.appendChild(this._btn('seq-trans-btn-add-row', `${PLUS}<span>|| Row</span>`, 'Add an alternative row (OR)', () => this._addRow('OR')));
    gridEl.appendChild(addRowBar);
    this.containerEl.appendChild(gridEl);
  }

  _collapsedChip(cond, rIdx, cIdx) {
    const chip = document.createElement('div');
    chip.className = 'seq-trans-chip is-collapsed';
    const summary = summarizeCondition(cond, this.engine);
    chip.title = `${summary} (click to edit)`;
    const type = cond.type === 'piston_target' ? 'piston' : (cond.type || 'duration');
    chip.innerHTML = `<div class="seq-trans-chip-icon">${ICONS[type] || ICONS.duration}</div><div class="seq-trans-chip-badge"></div>`;
    chip.querySelector('.seq-trans-chip-badge').textContent = summary;
    chip.addEventListener('click', () => { this.expandedKey = `${rIdx}_${cIdx}`; this.render(); });
    return chip;
  }

  _expandedChip(cond, rIdx, cIdx) {
    const chip = document.createElement('div');
    chip.className = 'seq-trans-chip is-expanded';
    const totalConds = this.data.rows.reduce((sum, r) => sum + r.conditions.length, 0);
    const type = cond.type === 'piston_target' ? 'piston' : (cond.type || 'duration');

    const header = document.createElement('div');
    header.className = 'seq-trans-chip-header';
    const typeSelect = document.createElement('select');
    typeSelect.className = 'prop-select seq-chip-type-select';
    typeSelect.innerHTML = CONDITION_TYPES.map(t => `<option value="${t.value}" ${t.value === type ? 'selected' : ''}>${t.label}</option>`).join('');
    typeSelect.addEventListener('change', () => {
      const row = this.data.rows[rIdx];
      row.conditions[cIdx] = defaultCondition(typeSelect.value, this.engine);
      this._changed();
    });
    header.appendChild(typeSelect);
    const del = this._btn('btn-icon-sm btn-del-chip', CROSS, 'Remove condition', () => this._removeCondition(rIdx, cIdx));
    del.disabled = totalConds <= 1;
    header.appendChild(del);
    chip.appendChild(header);

    const body = document.createElement('div');
    body.className = 'seq-trans-chip-body';
    chip.appendChild(body);
    renderPropertyForm(body, conditionFields(cond, this.engine), cond, {
      onChange: (key) => this._changed(STRUCTURAL_KEYS.includes(key))
    });
    return chip;
  }

  _removeCondition(rIdx, cIdx) {
    const rows = this.data.rows;
    const row = rows[rIdx];
    row.conditions.splice(cIdx, 1);
    if (row.operators.length > 0) row.operators.splice(Math.min(cIdx, row.operators.length - 1), 1);
    if (row.conditions.length === 0) {
      rows.splice(rIdx, 1);
      if (this.data.rowOperators.length > 0) this.data.rowOperators.splice(Math.min(rIdx, this.data.rowOperators.length - 1), 1);
    }
    if (rows.length === 0) rows.push({ conditions: [defaultCondition('duration')], operators: [] });
    this.expandedKey = '0_0';
    this._changed();
  }
}
