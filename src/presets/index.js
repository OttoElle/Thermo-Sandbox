// Example scenes for the start screen. Each one shows a single idea, is built
// from the same elements a user would draw, and is checked by
// tests/test_examples_cdp.py (particles stay contained, the effect appears).
import { sensorColor } from '../analytics/chartData.js';

const BORE = 120; // cylinder bore of the piston examples

function exBox(engine, x, y, w, h, options = {}) {
  return [
    engine.addWall(x, y, x + w, y, options), engine.addWall(x + w, y, x + w, y + h, options),
    engine.addWall(x + w, y + h, x, y + h, options), engine.addWall(x, y + h, x, y, options)
  ];
}

function exSensor(engine, label, x, y, w, h) {
  return engine.addSensor({ label, x, y, width: w, height: h, color: sensorColor(engine.sensors.length) });
}

function exNamed(el, name) {
  el.name = name;
  return el;
}

// Sequencer: steps = [{ name, actions, conditions }], conditions joined by OR.
function exSequence(engine, steps, isLooping = true) {
  engine.sequencer.importState({
    isEnabled: true, isLooping, activeStepIndex: 0, currentCycleCount: 1,
    steps: steps.map(s => ({
      name: s.name, actions: s.actions,
      transition: { type: 'compound_grid', fallbackTimeout: 0, rows: [{ conditions: s.conditions, operators: s.conditions.slice(1).map(() => 'OR') }], rowOperators: [] }
    }))
  });
}

const exPiston = (p, command, speed, extra = {}) => ({ targetId: p.id, type: 'piston', command, targetSpeed: speed, ...extra });
const exHx = (hx, isActive, temperature) => ({ targetId: hx.id, type: 'heat_exchanger', isActive, temperature });
const exAtTarget = { type: 'piston', pistonId: '', pistonTarget: 'step' };
const exAfter = (duration) => ({ type: 'duration', duration });
const exTemp = (zone, sensorOperator, sensorThreshold) => ({ type: 'sensor', sensorId: zone.id, sensorMetric: 'temperature', sensorOperator, sensorThreshold });

// Insulated horizontal cylinder [x0, x0 + len] with a piston; gas left of the piston, chamber bound to it.
function exCylinder(engine, { x0 = 1000, y0 = 1000, len = 600, pistonX, n = 150, T = 300 }) {
  exBox(engine, x0, y0, len, BORE, { thickness: 4 });
  const piston = exNamed(engine.addPiston({ x: pistonX, y: y0 + BORE / 2, width: 20, height: BORE, minPos: x0 + 80, maxPos: x0 + len, mode: 'hold', conductivity: 0 }), 'Piston');
  const gas = exSensor(engine, 'Gas', x0, y0, pistonX - 10 - x0, BORE);
  gas.bindToPiston(piston, 'right');
  engine.spawnGasRaster(x0, y0, pistonX - 10 - x0, BORE, n, 1, T, 'maxwell_boltzmann', 'Gas');
  return { piston, gas };
}

export const Examples = {
  idealGas: {
    id: 'idealGas',
    name: 'Gas in a Box',
    category: 'Kinetic theory',
    description: 'All 400 particles start with the same speed. Collisions spread the speeds into the Maxwell-Boltzmann distribution within seconds.',
    observe: 'Velocity histogram, temperature stays constant',
    load: (engine) => {
      exBox(engine, 1000, 1000, 700, 450, { thickness: 4 });
      exSensor(engine, 'Gas', 1000, 1000, 700, 450);
      engine.spawnGasRaster(1000, 1000, 700, 450, 400, 1, 300, 'uniform_speed', 'Gas');
    }
  },

  thermalEquilibrium: {
    id: 'thermalEquilibrium',
    name: 'Thermal Equilibrium',
    category: 'Heat',
    description: 'Hot and cold gas separated by a heat-conducting wall. Heat flows until both sides reach the same temperature; the particles never mix.',
    observe: 'Temperature of both chambers converging',
    load: (engine) => {
      exBox(engine, 1000, 1000, 800, 400, { thickness: 4 });
      exNamed(engine.addWall(1400, 1000, 1400, 1400, { thickness: 6, conductivity: 0.8, temperature: 375, heatCapacity: 100 }), 'Conducting wall');
      exSensor(engine, 'Hot side', 1000, 1000, 400, 400);
      exSensor(engine, 'Cold side', 1400, 1000, 400, 400);
      engine.spawnGasRaster(1000, 1000, 400, 400, 200, 1, 600, 'maxwell_boltzmann', 'Hot gas');
      engine.spawnGasRaster(1400, 1000, 400, 400, 200, 1, 150, 'maxwell_boltzmann', 'Cold gas');
    }
  },

  freeExpansion: {
    id: 'freeExpansion',
    name: 'Free Expansion',
    category: 'Kinetic theory',
    description: 'After 3 s a valve opens and the gas rushes into the empty half. It does no work and exchanges no heat: once the flow has settled, the temperature is the same as before and the pressure has halved.',
    observe: 'Pressure and particle count of both chambers; the temperatures swing while the gas sloshes, then settle',
    load: (engine) => {
      exBox(engine, 1000, 1000, 900, 400, { thickness: 4 });
      const valve = exNamed(engine.addWall(1450, 1000, 1450, 1400, { type: 'manual_valve', isOpen: false, thickness: 6 }), 'Valve');
      exSensor(engine, 'Left chamber', 1000, 1000, 450, 400);
      exSensor(engine, 'Right chamber', 1450, 1000, 450, 400);
      engine.spawnGasRaster(1000, 1000, 450, 400, 300, 1, 300, 'maxwell_boltzmann', 'Gas');
      exSequence(engine, [
        { name: 'Valve closed', actions: [{ targetId: valve.id, type: 'manual_valve', isOpen: false }], conditions: [exAfter(3)] },
        { name: 'Valve open', actions: [{ targetId: valve.id, type: 'manual_valve', isOpen: true }], conditions: [exAfter(30)] }
      ], false);
    }
  },

  barometric: {
    id: 'barometric',
    name: 'Atmosphere in Gravity',
    category: 'Kinetic theory',
    description: 'Gas in a tall column under gravity settles into the barometric profile: the density falls off exponentially with height (scale height k_B·T / m·g). Falling to the bottom releases potential energy, so the gas warms up while it settles.',
    observe: 'Particle count of the three layers; the temperature ends up equal in all of them',
    load: (engine) => {
      engine.gravityEnabled = true;
      engine.gravity = 100;
      exBox(engine, 1000, 900, 320, 600, { thickness: 4 });
      exSensor(engine, 'Top', 1000, 900, 320, 200);
      exSensor(engine, 'Middle', 1000, 1100, 320, 200);
      exSensor(engine, 'Bottom', 1000, 1300, 320, 200);
      engine.spawnGasRaster(1000, 900, 320, 600, 400, 1, 300, 'maxwell_boltzmann', 'Air');
    }
  },

  adiabaticCompression: {
    id: 'adiabaticCompression',
    name: 'Adiabatic Compression',
    category: 'Work',
    description: 'An insulated piston compresses the gas to 30 % of the stroke and lets it expand again. All work goes into the gas: it heats up on compression and cools on expansion.',
    observe: 'P-V (piston) diagram and temperature; the piston pressure runs ahead of the chamber pressure while the piston moves',
    load: (engine) => {
      const { piston } = exCylinder(engine, { pistonX: 1580, n: 150 });
      exSequence(engine, [
        { name: 'Compression', actions: [exPiston(piston, 'drive_to', 30, { strokeTarget: 25 })], conditions: [exAtTarget] },
        { name: 'Hold', actions: [exPiston(piston, 'hold', 30)], conditions: [exAfter(2)] },
        { name: 'Expansion', actions: [exPiston(piston, 'drive_bdc', 30)], conditions: [exAtTarget] },
        { name: 'Rest', actions: [exPiston(piston, 'hold', 30)], conditions: [exAfter(2)] }
      ]);
    }
  },

  carnot: {
    id: 'carnot',
    name: 'Carnot Cycle',
    category: 'Cycles',
    description: 'Isothermal expansion at 600 K, adiabatic expansion down to 300 K, isothermal compression at 300 K, adiabatic compression back up to 600 K. A heat exchanger filling the cylinder switches between hot, cold and off.',
    observe: 'P-V (piston) diagram with step markers and the work per cycle; T-s diagram',
    load: (engine) => {
      // Gas length 80 px at TDC, 580 px at BDC; 40 % stroke = 280 px, 17 % = 166 px (V1·V3 = V2·V4)
      const { piston, gas } = exCylinder(engine, { pistonX: 1090, n: 150 });
      const hx = exNamed(engine.addHeatExchanger(1002, 1002, 596, BORE - 4, { temperature: 600, conductivity: 0.9, isActive: false }), 'Heat exchanger');
      const v = 15;
      exSequence(engine, [
        { name: 'Isothermal expansion', actions: [exHx(hx, true, 600), exPiston(piston, 'drive_to', v, { strokeTarget: 40 })], conditions: [exAtTarget] },
        { name: 'Adiabatic expansion', actions: [exHx(hx, false, 600), exPiston(piston, 'drive_bdc', v)], conditions: [exAtTarget, exTemp(gas, '<=', 300)] },
        { name: 'Isothermal compression', actions: [exHx(hx, true, 300), exPiston(piston, 'drive_to', v, { strokeTarget: 17 })], conditions: [exAtTarget] },
        { name: 'Adiabatic compression', actions: [exHx(hx, false, 300), exPiston(piston, 'drive_tdc', v)], conditions: [exAtTarget, exTemp(gas, '>=', 600)] }
      ]);
    }
  },

  otto: {
    id: 'otto',
    name: 'Otto Cycle',
    category: 'Cycles',
    description: 'Compression, heat added at constant volume with the piston held at TDC, power stroke, heat rejected at constant volume at BDC: the cycle of a petrol engine, with a 2000 K heat exchanger as the flame.',
    observe: 'P-V (piston) diagram: two adiabats joined by two isochores',
    load: (engine) => {
      const { piston, gas } = exCylinder(engine, { pistonX: 1580, n: 150 });
      const hx = exNamed(engine.addHeatExchanger(1002, 1002, 596, BORE - 4, { temperature: 2000, conductivity: 0.9, isActive: false }), 'Flame / cooler');
      const v = 20;
      exSequence(engine, [
        { name: 'Compression', actions: [exHx(hx, false, 2000), exPiston(piston, 'drive_to', v, { strokeTarget: 25 })], conditions: [exAtTarget] },
        { name: 'Combustion', actions: [exHx(hx, true, 2000), exPiston(piston, 'hold', v)], conditions: [exTemp(gas, '>=', 1500), exAfter(5)] },
        { name: 'Power stroke', actions: [exHx(hx, false, 2000), exPiston(piston, 'drive_bdc', v)], conditions: [exAtTarget] },
        { name: 'Exhaust (cooling)', actions: [exHx(hx, true, 300), exPiston(piston, 'hold', v)], conditions: [exTemp(gas, '<=', 330), exAfter(5)] }
      ]);
    }
  },

  stirling: {
    id: 'stirling',
    name: 'Stirling Engine',
    category: 'Cycles',
    description: 'Alpha Stirling engine: hot and cold piston share one gas volume through a heater, a regenerator and a cooler. The pistons move the gas between the hot and the cold side.',
    observe: 'P-V diagram of the working gas (isochores are vertical), regenerator temperature profile',
    load: (engine) => {
      const y0 = 1000;
      exBox(engine, 900, y0, 800, BORE, { thickness: 4 });
      const hot = exNamed(engine.addPiston({ x: 1150, y: y0 + BORE / 2, width: 20, height: BORE, minPos: 900, maxPos: 1160, mode: 'hold', conductivity: 0 }), 'Hot piston');
      const cold = exNamed(engine.addPiston({ x: 1690, y: y0 + BORE / 2, width: 20, height: BORE, minPos: 1440, maxPos: 1700, mode: 'hold', conductivity: 0 }), 'Cold piston');
      exNamed(engine.addHeatExchanger(1165, y0 + 2, 70, BORE - 4, { temperature: 900, conductivity: 0.9 }), 'Heater');
      exNamed(engine.addRegeneratorMatrix(1260, y0 + 2, 80, BORE - 4, { temperature: 600, conductivity: 0.7, heatCapacity: 400 }), 'Regenerator');
      exNamed(engine.addHeatExchanger(1360, y0 + 2, 70, BORE - 4, { temperature: 300, conductivity: 0.9 }), 'Cooler');
      const gas = exSensor(engine, 'Working gas', 1160, y0, 520, BORE);
      gas.bindToPiston(hot, 'left', true, 1);
      gas.bindToPiston(cold, 'right', true, 2);
      engine.spawnGasRaster(1170, y0, 500, BORE, 150, 1, 400, 'maxwell_boltzmann', 'Working gas');
      const v = 20;
      exSequence(engine, [
        { name: 'Compression (cold)', actions: [exPiston(hot, 'hold', v), exPiston(cold, 'drive_to', v, { strokeTarget: 50 })], conditions: [exAtTarget] },
        { name: 'Transfer to hot side', actions: [exPiston(hot, 'drive_to', v, { strokeTarget: 50 }), exPiston(cold, 'drive_tdc', v)], conditions: [exAtTarget] },
        { name: 'Expansion (hot)', actions: [exPiston(hot, 'drive_bdc', v), exPiston(cold, 'hold', v)], conditions: [exAtTarget] },
        { name: 'Transfer to cold side', actions: [exPiston(hot, 'drive_tdc', v), exPiston(cold, 'drive_bdc', v)], conditions: [exAtTarget] }
      ]);
    }
  }
};

// Replaces the engine's scene with an example and returns its state.
export function loadExample(engine, example) {
  engine.resetScene();
  example.load(engine);
  return engine.exportState(example.name);
}
