import { SequencerConditions } from './SequencerConditions.js';

export class SequencerSummary {
  static getActionSummary(act) {
    if (!act) return 'No action';
    const type = act.type || '';
    if (type === 'piston') {
      const mode = act.strokeCommand || act.mode || 'drive_tdc';
      if (mode === 'drive_tdc') return 'Drive to TDC';
      if (mode === 'drive_bdc') return 'Drive to BDC';
      if (mode === 'hold') return 'Hold Position';
      if (mode === 'free') return 'Free Float';
      return `Target ${act.targetPos || 0}px`;
    }
    if (type === 'throttle_valve') {
      return act.state === 'bypassed' ? 'Bypassed (100%)' : `Aperture ${Math.round((act.openRatio !== undefined ? act.openRatio : 0.3) * 100)}%`;
    }
    if (type === 'manual_valve') {
      return act.valveState === 'closed' ? 'Closed' : 'Open';
    }
    if (type === 'check_valve') {
      return act.direction === -1 ? 'Reverse (←)' : 'Forward (→)';
    }
    if (type === 'relief_valve') {
      return `P_max: ${act.triggerPressure || 250} Pa`;
    }
    if (type === 'reservoir' || type === 'thermal_block' || type === 'heat_exchanger' || type === 'regenerator') {
      return act.isActive === false ? 'Insulated' : `${Math.round(act.temperature || 300)} K`;
    }
    if (type === 'emitter') {
      return act.state === 'paused' ? 'Paused' : `${act.rate || 8} pts/s @ ${Math.round(act.temperature || 300)}K`;
    }
    if (type === 'sink') {
      return act.isActive === false ? 'Inactive' : `${Math.round((act.absorptionEfficiency !== undefined ? act.absorptionEfficiency : 1.0) * 100)}% Eff`;
    }
    if (type === 'regulator') {
      return act.isActive === false ? 'Inactive' : `Target N = ${act.targetCount || 50}`;
    }
    return 'Snapshot set';
  }

  static formatConditionSummary(cond) {
    if (!cond) return 'Immediate';
    const type = cond.type || 'duration';
    if (type === 'duration') {
      return `⏱ ${(cond.duration !== undefined ? cond.duration : 1.5).toFixed(1)}s`;
    }
    if (type === 'piston' || type === 'piston_target') {
      const tgt = (cond.pistonTarget || 'tdc').toUpperCase();
      return `🎯 ${tgt}`;
    }
    if (type === 'sensor') {
      const metric = cond.sensorMetric === 'temperature' ? 'T' : 'P';
      const unit = cond.sensorMetric === 'temperature' ? 'K' : 'Pa';
      return `📡 ${metric}${cond.sensorOperator || '>='}${cond.sensorThreshold || 200}${unit}`;
    }
    return 'Immediate';
  }

  static getTransitionSummary(trans) {
    if (!trans) return 'Immediate';
    const norm = SequencerConditions.normalizeTransition(trans);
    if (!norm.rows || norm.rows.length === 0) return 'Immediate';

    const rowSummaries = norm.rows.map(row => {
      if (!row.conditions || row.conditions.length === 0) return 'Immediate';
      const parts = [];
      row.conditions.forEach((c, idx) => {
        parts.push(this.formatConditionSummary(c));
        if (idx < row.conditions.length - 1) {
          const op = (row.operators[idx] || 'AND').toUpperCase();
          parts.push(op === 'OR' || op === '||' ? '||' : '&');
        }
      });
      const rowStr = parts.join(' ');
      return norm.rows.length > 1 || row.conditions.length > 1 ? `(${rowStr})` : rowStr;
    });

    const finalParts = [];
    rowSummaries.forEach((rStr, idx) => {
      finalParts.push(rStr);
      if (idx < rowSummaries.length - 1) {
        const rOp = (norm.rowOperators[idx] || 'OR').toUpperCase();
        finalParts.push(rOp === 'AND' || rOp === '&' ? '&' : '||');
      }
    });

    return finalParts.join(' ');
  }

  static formatActionPropsHTML(act, item) {
    if (!act) return '';
    const type = act.type || (item ? item.constructor.name.toLowerCase() : 'unknown');
    const rows = [];

    const addRow = (label, val) => {
      rows.push(`<div class="seq-action-prop-row"><span class="seq-prop-key">${label}</span><span class="seq-prop-val">${val}</span></div>`);
    };

    if (type === 'piston') {
      const strokeMap = { drive_tdc: 'Drive to TDC (Min Vol)', drive_bdc: 'Drive to BDC (Max Vol)', hold: 'Hold Position', free: 'Free Float' };
      addRow('Stroke', strokeMap[act.strokeCommand || 'drive_tdc'] || act.strokeCommand);
      addRow('Motion Mode', (act.motionType || item?.mode || 'free').toUpperCase());
      addRow('Target Speed', `${act.targetSpeed !== undefined ? act.targetSpeed : 160} px/s`);
      addRow('Mass', `${act.mass !== undefined ? act.mass : (item?.mass || 30)} kg`);
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : (item?.conductivity || 0.2)).toFixed(2)}`);
      if (act.motionType === 'spring') addRow('Spring k', `${act.springK || 50} N/m`);
      if (act.motionType === 'motorized') addRow('Frequency', `${act.frequency || 0.8} Hz`);
      if (act.motionType === 'damper') addRow('Damping γ', `${act.dampingCoeff || 25} Ns/m`);
    } else if (type === 'manual_valve') {
      addRow('State', act.valveState === 'open' || act.valveState === undefined ? 'OPEN' : 'CLOSED');
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (type === 'check_valve') {
      addRow('Allowed Flow', (act.direction === -1 ? 'Reverse (←)' : 'Forward (→)'));
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (type === 'relief_valve') {
      addRow('Relief Mode', (act.reliefMode || '1-way').toUpperCase());
      addRow('Trigger P_max', `${act.triggerPressure || 250} Pa`);
      addRow('Hysteresis ΔP', `${act.pressureHysteresis || 25} Pa`);
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (type === 'throttle_valve') {
      addRow('State', act.state === 'bypassed' ? 'BYPASSED (100%)' : 'THROTTLED');
      addRow('Opening Ratio', `${Math.round((act.openRatio !== undefined ? act.openRatio : 0.3) * 100)}%`);
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    } else if (['reservoir', 'heat_exchanger', 'regenerator', 'thermal_block'].includes(type)) {
      addRow('Thermal State', act.isActive !== false ? 'ACTIVE' : 'INSULATED');
      addRow('Temperature T', `${Math.round(act.temperature !== undefined ? act.temperature : 300)} K`);
      addRow('Coupling κ', `${(act.conductivity !== undefined ? act.conductivity : (act.conductance || 0.6)).toFixed(2)}`);
      if (act.heatCapacity !== undefined || (item && item.heatCapacity)) {
        addRow('Heat Capacity C', `${act.heatCapacity !== undefined ? act.heatCapacity : item.heatCapacity} J/K`);
      }
      if (type === 'regenerator') addRow('Orientation', (act.orientation || 'horizontal').toUpperCase());
    } else if (type === 'emitter') {
      addRow('State', act.state === 'paused' ? 'PAUSED' : 'FIRING');
      addRow('Direction', (act.direction || 'right').toUpperCase());
      addRow('Rate', `${act.rate !== undefined ? act.rate : 8} /s`);
      addRow('Temperature T', `${Math.round(act.temperature !== undefined ? act.temperature : 300)} K`);
      addRow('Particle Mass', `${act.mass !== undefined ? act.mass : 1.0}`);
      addRow('Max Limit', act.maxParticles > 0 ? `${act.maxParticles}` : 'Unlimited');
    } else if (type === 'sink') {
      addRow('State', act.isActive !== false ? 'ACTIVE' : 'INACTIVE');
      addRow('Direction', (act.direction || '360').toUpperCase());
      addRow('Efficiency', `${Math.round((act.absorptionEfficiency !== undefined ? act.absorptionEfficiency : 1.0) * 100)}%`);
      addRow('Temp Filter', (act.tempFilterMode || 'all').toUpperCase());
      addRow('Max Limit', act.maxParticles > 0 ? `${act.maxParticles}` : 'Unlimited');
    } else if (type === 'regulator') {
      addRow('State', act.isActive !== false ? 'ACTIVE' : 'INACTIVE');
      addRow('Target Count N', `${act.targetCount !== undefined ? act.targetCount : 50}`);
      addRow('Hysteresis ΔN', `±${act.hysteresis !== undefined ? act.hysteresis : 3}`);
      addRow('Gas Temp T', `${Math.round(act.temperature !== undefined ? act.temperature : 300)} K`);
      addRow('Max Rate', `${act.rate !== undefined ? act.rate : 15} /s`);
    } else {
      addRow('Conductivity κ', `${(act.conductivity !== undefined ? act.conductivity : 0).toFixed(2)}`);
    }

    return `
      <div class="seq-action-body">
        <div class="seq-action-props-grid">
          ${rows.join('')}
        </div>
      </div>
    `;
  }
}
