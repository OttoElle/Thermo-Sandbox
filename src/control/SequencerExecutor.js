/**
 * SequencerExecutor.js
 * Generic Action Snapshot Executor for Thermodynamic Cycle Sequencer
 * Applies element properties and snapshots to physical simulation objects.
 */

export class SequencerExecutor {
  /**
   * Applies all action snapshots defined in a step to the active simulation engine.
   */
  static applyStepActions(step, engine) {
    if (!step || !engine || !Array.isArray(step.actions)) return;

    for (let i = 0; i < step.actions.length; i++) {
      const act = step.actions[i];
      if (!act || !act.targetId) continue;
      this.applySingleAction(act, engine);
    }
  }

  /**
   * Applies a single action snapshot to its targeted element in engine.
   */
  static applySingleAction(act, engine) {
    const targetId = act.targetId;
    const type = act.type;

    // 1. Pistons
    if (type === 'piston') {
      const piston = (engine.pistons || []).find(p => p.id === targetId);
      if (!piston) return;

      if (act.motionType) piston.mode = act.motionType;
      if (act.mode) piston.mode = act.mode;
      if (act.mass !== undefined) piston.mass = act.mass;
      if (act.conductivity !== undefined) piston.conductivity = act.conductivity;
      if (act.springK !== undefined) piston.springK = act.springK;
      if (act.dampingCoeff !== undefined) piston.dampingCoeff = act.dampingCoeff;
      if (act.dampingGamma !== undefined) piston.dampingCoeff = act.dampingGamma;
      if (act.frequency !== undefined) piston.frequency = act.frequency;
      if (act.motorFrequency !== undefined) piston.frequency = act.motorFrequency;
      if (act.phase !== undefined) piston.phase = act.phase;
      if (act.motorPhase !== undefined) piston.phase = act.motorPhase;

      // Stroke commands (TDC / BDC / Controlled / Hold / Free)
      if (act.strokeCommand === 'drive_tdc' || act.mode === 'drive_tdc') {
        piston.mode = 'controlled';
        piston.targetPos = SequencerConditions.resolvePistonTarget(piston, 'tdc', !!act.invertTdcBdc);
        piston.targetSpeed = act.targetSpeed !== undefined ? act.targetSpeed : 160;
      } else if (act.strokeCommand === 'drive_bdc' || act.mode === 'drive_bdc') {
        piston.mode = 'controlled';
        piston.targetPos = SequencerConditions.resolvePistonTarget(piston, 'bdc', !!act.invertTdcBdc);
        piston.targetSpeed = act.targetSpeed !== undefined ? act.targetSpeed : 160;
      } else if (act.mode === 'hold') {
        piston.mode = 'hold';
        piston.velocity = 0;
      } else if (act.mode === 'free') {
        piston.mode = 'free';
      } else if (act.targetPos !== undefined) {
        piston.targetPos = act.targetPos;
      }
      return;
    }

    // 2. Throttle Valves
    if (type === 'throttle_valve' || type === 'throttle') {
      const tv = (engine.throttleValves || []).find(v => v.id === targetId);
      if (!tv) return;
      if (act.state === 'bypassed') {
        tv.openRatio = 1.0;
      } else if (act.openRatio !== undefined) {
        tv.openRatio = Math.max(0, Math.min(1.0, act.openRatio));
      }
      if (act.conductivity !== undefined) tv.conductivity = act.conductivity;
      if (typeof tv._updateGeometry === 'function') tv._updateGeometry();
      return;
    }

    // 3. Walls & Built-in Segment Valves
    if (type === 'wall' || type === 'valve') {
      const wall = (engine.walls || []).find(w => w.id === targetId);
      if (!wall) return;

      if (act.conductivity !== undefined) wall.conductivity = act.conductivity;

      if (wall.isValve || wall.type === 'manual_valve') {
        if (act.valveState === 'open' || act.state === 'open') wall.isOpen = true;
        else if (act.valveState === 'closed' || act.state === 'closed') wall.isOpen = false;
        else if (act.isOpen !== undefined) wall.isOpen = !!act.isOpen;
      } else if (wall.isCheckValve || wall.type === 'check_valve') {
        if (act.direction !== undefined) wall.direction = act.direction;
        if (act.flowDirection !== undefined) wall.direction = act.flowDirection === 'reverse' ? -1 : 1;
      } else if (wall.isReliefValve || wall.type === 'relief_valve') {
        if (act.triggerPressure !== undefined) wall.triggerPressure = act.triggerPressure;
        if (act.hysteresis !== undefined) wall.hysteresis = act.hysteresis;
        if (act.pressureHysteresis !== undefined) wall.hysteresis = act.pressureHysteresis;
        if (act.reliefMode !== undefined) wall.reliefMode = act.reliefMode;
        if (act.direction !== undefined) wall.direction = act.direction;
      }
      return;
    }

    // 4. Reservoirs & Thermal Sinks
    if (type === 'reservoir' || type === 'sink_thermal') {
      const res = (engine.reservoirs || []).find(r => r.id === targetId);
      if (!res) return;
      if (act.isActive !== undefined) res.isActive = !!act.isActive;
      if (act.temperature !== undefined) res.temperature = act.temperature;
      if (act.conductance !== undefined) res.conductance = act.conductance;
      if (act.conductivity !== undefined) res.conductance = act.conductivity;
      if (act.thermalCoupling !== undefined) res.conductance = act.thermalCoupling;
      return;
    }

    // 5. Heat Exchangers
    if (type === 'heat_exchanger' || type === 'hx') {
      const hx = (engine.heatExchangers || []).find(h => h.id === targetId);
      if (!hx) return;
      if (act.isActive !== undefined) hx.isActive = !!act.isActive;
      if (act.temperature !== undefined) hx.temperature = act.temperature;
      if (act.conductivity !== undefined) hx.conductivity = act.conductivity;
      if (act.thermalCoupling !== undefined) hx.conductivity = act.thermalCoupling;
      return;
    }

    // 6. Regenerator Matrices
    if (type === 'regenerator' || type === 'regen') {
      const regen = (engine.regenerators || []).find(rg => rg.id === targetId);
      if (!regen) return;
      if (act.isActive !== undefined) regen.isActive = !!act.isActive;
      if (act.orientation !== undefined) regen.axis = act.orientation;
      if (act.axis !== undefined) regen.axis = act.axis;
      if (act.heatCapacity !== undefined) regen.heatCapacity = act.heatCapacity;
      if (act.conductivity !== undefined) regen.conductivity = act.conductivity;
      if (act.thermalCoupling !== undefined) regen.conductivity = act.thermalCoupling;
      return;
    }

    // 7. Solid Thermal Blocks (Ressavoirs)
    if (type === 'thermal_block' || type === 'ressavoir') {
      const tb = (engine.thermalBlocks || []).find(b => b.id === targetId);
      if (!tb) return;
      if (act.isActive !== undefined) tb.isActive = !!act.isActive;
      if (act.temperature !== undefined) tb.temperature = act.temperature;
      if (act.heatCapacity !== undefined) tb.heatCapacity = act.heatCapacity;
      if (act.conductivity !== undefined) tb.conductivity = act.conductivity;
      return;
    }

    // 8. Particle Emitters
    if (type === 'emitter' || type === 'source') {
      const em = (engine.emitters || []).find(e => e.id === targetId);
      if (!em) return;
      if (act.state === 'firing' || act.isActive === true) em.enabled = true;
      else if (act.state === 'paused' || act.isActive === false) em.enabled = false;
      if (act.direction !== undefined) em.direction = act.direction;
      if (act.flowDirection !== undefined) em.direction = act.flowDirection;
      if (act.rate !== undefined) em.rate = act.rate;
      if (act.temperature !== undefined) em.temperature = act.temperature;
      if (act.mass !== undefined) em.mass = act.mass;
      if (act.particleMass !== undefined) em.mass = act.particleMass;
      if (act.maxParticles !== undefined) em.maxParticles = act.maxParticles;
      if (act.capacityLimit !== undefined) em.maxParticles = act.capacityLimit;
      return;
    }

    // 9. Particle Absorber Sinks
    if (type === 'sink' || type === 'absorber') {
      const snk = (engine.sinks || []).find(s => s.id === targetId);
      if (!snk) return;
      if (act.isActive !== undefined) snk.isActive = !!act.isActive;
      if (act.direction !== undefined) snk.direction = act.direction;
      if (act.tempFilterMode !== undefined) snk.tempFilterMode = act.tempFilterMode;
      if (act.thermalFilter !== undefined) snk.tempFilterMode = act.thermalFilter;
      if (act.filterTemperature !== undefined) snk.filterTemperature = act.filterTemperature;
      if (act.cutoffTemp !== undefined) snk.filterTemperature = act.cutoffTemp;
      if (act.absorptionEfficiency !== undefined) snk.absorptionEfficiency = act.absorptionEfficiency;
      if (act.efficiency !== undefined) snk.absorptionEfficiency = act.efficiency;
      if (act.maxParticles !== undefined) snk.maxParticles = act.maxParticles;
      if (act.maxAbsorbed !== undefined) snk.maxParticles = act.maxAbsorbed;
      return;
    }

    // 10. Population Regulators
    if (type === 'regulator') {
      const reg = (engine.regulators || []).find(r => r.id === targetId);
      if (!reg) return;
      if (act.isActive !== undefined) reg.isActive = !!act.isActive;
      if (act.targetCount !== undefined) reg.targetCount = act.targetCount;
      if (act.hysteresis !== undefined) reg.hysteresis = act.hysteresis;
      if (act.temperature !== undefined) reg.temperature = act.temperature;
      if (act.mass !== undefined) reg.mass = act.mass;
      if (act.rate !== undefined) reg.rate = act.rate;
      if (act.maxFlowRate !== undefined) reg.rate = act.maxFlowRate;
      return;
    }
  }
}
