/**
 * SequencerCatalogDefaults.js
 * Canonical default parameter values and lookup helpers according to TOOL_CATALOG.md.
 * Used for default indicators and 'Reset to Default' functionality.
 */

export const TOOL_DEFAULTS = {
  wall: {
    thickness: 4,
    conductivity: 0.0
  },
  piston: {
    strokeCommand: 'drive_tdc',
    motionType: 'free',
    targetSpeed: 160,
    mass: 30,
    conductivity: 0.20,
    springK: 50,
    frequency: 0.8,
    phase: 0,
    dampingCoeff: 25
  },
  manual_valve: {
    valveState: 'open',
    conductivity: 0.0
  },
  check_valve: {
    direction: 1,
    conductivity: 0.0
  },
  relief_valve: {
    triggerPressure: 250,
    pressureHysteresis: 25,
    reliefMode: '1-way',
    conductivity: 0.0
  },
  throttle_valve: {
    state: 'active',
    openRatio: 0.30,
    conductivity: 0.0
  },
  reservoir: {
    isActive: true,
    temperature: 500,
    conductivity: 0.80
  },
  heat_exchanger: {
    isActive: true,
    temperature: 300,
    conductivity: 0.60
  },
  regenerator: {
    isActive: true,
    orientation: 'horizontal',
    temperature: 300,
    heatCapacity: 400,
    conductivity: 0.70
  },
  thermal_block: {
    isActive: true,
    temperature: 300,
    heatCapacity: 300,
    conductivity: 0.60
  },
  emitter: {
    state: 'firing',
    direction: 'right',
    rate: 8,
    temperature: 300,
    mass: 1.0,
    maxParticles: 0
  },
  sink: {
    isActive: true,
    direction: '360',
    tempFilterMode: 'all',
    filterTemperature: 300,
    absorptionEfficiency: 1.0,
    maxParticles: 0
  },
  regulator: {
    isActive: true,
    targetCount: 50,
    hysteresis: 3,
    temperature: 300,
    mass: 1.0,
    rate: 15
  }
};

export class SequencerCatalogDefaults {
  static getDefaultsForType(type) {
    const d = TOOL_DEFAULTS[type] || {};
    return JSON.parse(JSON.stringify(d));
  }

  static getDefault(type, prop) {
    const d = TOOL_DEFAULTS[type];
    return d && d[prop] !== undefined ? d[prop] : null;
  }
}
