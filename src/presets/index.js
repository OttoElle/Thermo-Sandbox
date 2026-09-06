export const Presets = {
  // 1. Split-Stirling Cryocooler / Heat Engine
  splitStirling: {
    id: 'splitStirling',
    name: 'Split-Stirling Cryocooler',
    category: 'Thermodynamic Cycles',
    icon: 'stirling',
    description: 'Dual-piston compressor, split pipe, regenerator matrix, cold finger, and displacer piston.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer boundaries / Compressor housing (Left side)
      engine.addWall(60, 160, 280, 160, { thickness: 6 });
      engine.addWall(60, 480, 280, 480, { thickness: 6 });
      engine.addWall(60, 160, 60, 480, { thickness: 6 });

      // Split Pipe connecting compressor to regenerator
      engine.addWall(280, 160, 280, 290, { thickness: 6 });
      engine.addWall(280, 290, 560, 290, { thickness: 6 });
      engine.addWall(280, 350, 560, 350, { thickness: 6 });
      engine.addWall(280, 350, 280, 480, { thickness: 6 });

      // Ambient Heat Exchanger along split pipe (rejection at 300K)
      engine.addHeatExchanger(330, 275, 120, 90, {
        temperature: 300,
        conductivity: 0.8,
        label: 'Ambient Cooler (300K)'
      });

      // Cold Finger / Expander Cylinder (Right side)
      engine.addWall(560, 80, 700, 80, { thickness: 6 });
      engine.addWall(560, 80, 560, 290, { thickness: 6 });
      engine.addWall(700, 80, 700, 540, { thickness: 6 });
      engine.addWall(560, 350, 560, 540, { thickness: 6 });
      engine.addWall(560, 540, 700, 540, { thickness: 6 });

      // Regenerator Matrix in Cold Finger
      engine.addRegeneratorMatrix(570, 160, 120, 110, {
        orientation: 'vertical',
        temperature: 200,
        heatCapacity: 450,
        conductivity: 0.75,
        label: 'Regenerator Matrix'
      });

      // Compressor Piston (Motorized harmonic drive)
      engine.addPiston({
        label: 'Compressor Piston',
        orientation: 'horizontal',
        x: 160,
        y: 320,
        width: 24,
        height: 310,
        minPos: 80,
        maxPos: 250,
        mode: 'motorized',
        frequency: 0.8,
        amplitude: 50,
        phase: 0
      });

      // Displacer Piston in Bouncing Volume (Phase-shifted)
      engine.addPiston({
        label: 'Displacer Piston',
        orientation: 'vertical',
        x: 630,
        y: 420,
        width: 20,
        height: 130,
        minPos: 310,
        maxPos: 490,
        mode: 'motorized',
        frequency: 0.8,
        amplitude: 45,
        phase: 80 // ~80 degrees phase lead for Stirling expansion
      });

      // Sensor Chambers
      engine.addSensor({
        label: 'Compression Space',
        x: 180,
        y: 180,
        width: 90,
        height: 280,
        color: '#f97316'
      });
      engine.addSensor({
        label: 'Expansion Cold Head',
        x: 570,
        y: 90,
        width: 120,
        height: 65,
        color: '#38bdf8'
      });

      // Working Gas
      engine.spawnGasRaster(180, 200, 90, 240, 90, 1.0, 300, 'maxwell_boltzmann', 'Compressor Gas');
      engine.spawnGasRaster(570, 95, 120, 60, 45, 1.0, 220, 'maxwell_boltzmann', 'Cold Space Gas');
    }
  },

  // 2. Venturi Nozzle & Bernoulli Effect
  venturiTube: {
    id: 'venturiTube',
    name: 'Venturi Nozzle & Bernoulli Flow',
    category: 'Fluid & Aerodynamics',
    icon: 'venturi',
    description: 'Converging-diverging contraction channel demonstrating velocity increase and pressure drop.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Top contoured wall
      engine.addWall(40, 160, 260, 160, { thickness: 5 });
      engine.addWall(260, 160, 440, 260, { thickness: 5 });
      engine.addWall(440, 260, 560, 260, { thickness: 5 }); // Throat
      engine.addWall(560, 260, 740, 160, { thickness: 5 });
      engine.addWall(740, 160, 960, 160, { thickness: 5 });

      // Bottom contoured wall
      engine.addWall(40, 480, 260, 480, { thickness: 5 });
      engine.addWall(260, 480, 440, 380, { thickness: 5 });
      engine.addWall(440, 380, 560, 380, { thickness: 5 }); // Throat
      engine.addWall(560, 380, 740, 480, { thickness: 5 });
      engine.addWall(740, 480, 960, 480, { thickness: 5 });

      // Inlet continuous emitter (left)
      engine.addEmitter(50, 200, 40, 240, {
        direction: 'right',
        rate: 28,
        temperature: 300,
        mass: 1.0
      });

      // Outlet absorber (right)
      engine.addSink(910, 180, 40, 280, {
        direction: 'right',
        absorptionEfficiency: 1.0
      });

      // Sensors: Inlet, Throat, Diffuser
      engine.addSensor({
        label: 'Inlet (Wide, Low v)',
        x: 120,
        y: 180,
        width: 120,
        height: 280,
        color: '#38bdf8'
      });
      engine.addSensor({
        label: 'Throat (Constriction, High v, Low P)',
        x: 450,
        y: 270,
        width: 100,
        height: 100,
        color: '#f59e0b'
      });
      engine.addSensor({
        label: 'Diffuser (Recovery)',
        x: 760,
        y: 180,
        width: 140,
        height: 280,
        color: '#10b981'
      });

      // Pre-fill steady flow gas
      engine.spawnGasRaster(120, 200, 120, 240, 60, 1.0, 300, 'uniform_speed', 'Inlet Gas');
      engine.spawnGasRaster(450, 280, 100, 80, 35, 1.0, 270, 'uniform_speed', 'Throat Gas');
      engine.spawnGasRaster(760, 200, 130, 240, 60, 1.0, 300, 'uniform_speed', 'Exit Gas');
    }
  },

  // 3. Dual-Chamber Thermal Equalization
  dualChamber: {
    id: 'dualChamber',
    name: 'Dual-Chamber Thermal Equalization',
    category: 'Heat Transfer & 2nd Law',
    icon: 'chambers',
    description: 'High-temperature gas and cryogenic gas separated by a thermally conductive partition wall.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer insulated container (800x440)
      engine.addWall(80, 120, 880, 120, { thickness: 8, conductivity: 0 });
      engine.addWall(80, 560, 880, 560, { thickness: 8, conductivity: 0 });
      engine.addWall(80, 120, 80, 560, { thickness: 8, conductivity: 0 });
      engine.addWall(880, 120, 880, 560, { thickness: 8, conductivity: 0 });

      // Central conductive dividing wall (kappa = 0.85)
      engine.addWall(480, 120, 480, 560, {
        thickness: 8,
        conductivity: 0.85,
        label: 'Conductive Partition (κ = 0.85)'
      });

      // Sensors: Left (Hot), Right (Cold)
      engine.addSensor({
        label: 'Chamber Left (Hot)',
        x: 100,
        y: 140,
        width: 360,
        height: 400,
        color: '#ef4444'
      });
      engine.addSensor({
        label: 'Chamber Right (Cold)',
        x: 500,
        y: 140,
        width: 360,
        height: 400,
        color: '#3b82f6'
      });

      // Hot gas left (750K), Cold gas right (125K)
      engine.spawnGasRaster(120, 160, 320, 360, 120, 1.0, 750, 'maxwell_boltzmann', 'Hot Gas (750K)');
      engine.spawnGasRaster(520, 160, 320, 360, 120, 1.0, 125, 'maxwell_boltzmann', 'Cold Gas (125K)');
    }
  },

  // 4. Joule-Thomson Expansion & Throttle Valve
  jouleThomson: {
    id: 'jouleThomson',
    name: 'Joule-Thomson Throttle Expansion',
    category: 'Thermodynamic Expansion',
    icon: 'throttle',
    description: 'High-pressure gas forced through a narrow throttle valve aperture into an expansion chamber.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer enclosure
      engine.addWall(60, 150, 900, 150, { thickness: 6 });
      engine.addWall(60, 510, 900, 510, { thickness: 6 });
      engine.addWall(60, 150, 60, 510, { thickness: 6 });
      engine.addWall(900, 150, 900, 510, { thickness: 6 });

      // Partition Wall with central Throttle Valve
      engine.addWall(460, 150, 460, 260, { thickness: 6 });
      engine.addThrottleValve(460, 260, 460, 400, {
        openRatio: 0.25,
        thickness: 8,
        conductivity: 0.2
      });
      engine.addWall(460, 400, 460, 510, { thickness: 6 });

      // Continuous high-pressure supply on left
      engine.addEmitter(80, 230, 40, 200, {
        direction: 'right',
        rate: 22,
        temperature: 450,
        mass: 1.0
      });

      // Exhaust / Low-pressure sink on far right
      engine.addSink(840, 230, 40, 200, {
        direction: 'right',
        absorptionEfficiency: 0.95
      });

      // Upstream & Downstream Sensor Zones
      engine.addSensor({
        label: 'High-Pressure Upstream (P1, T1)',
        x: 140,
        y: 170,
        width: 300,
        height: 320,
        color: '#f97316'
      });
      engine.addSensor({
        label: 'Low-Pressure Downstream (P2, T2)',
        x: 480,
        y: 170,
        width: 340,
        height: 320,
        color: '#10b981'
      });

      // Pre-fill upstream chamber
      engine.spawnGasRaster(160, 190, 260, 280, 110, 1.0, 450, 'maxwell_boltzmann', 'Upstream Gas');
      engine.spawnGasRaster(500, 230, 300, 200, 40, 1.0, 250, 'maxwell_boltzmann', 'Downstream Gas');
    }
  },

  // 5. Adiabatic & Isothermal Compression
  compressionCylinder: {
    id: 'compressionCylinder',
    name: 'Adiabatic Cylinder Compression',
    category: 'Work & Compression',
    icon: 'piston',
    description: 'Cylinder enclosed with a moving heavy piston demonstrating work extraction and PV compression heating.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Rigid Cylinder Chamber
      engine.addWall(80, 140, 840, 140, { thickness: 6, conductivity: 0 });
      engine.addWall(80, 500, 840, 500, { thickness: 6, conductivity: 0 });
      engine.addWall(80, 140, 80, 500, { thickness: 6, conductivity: 0 });

      // Compressor Piston (Motorized sweep)
      engine.addPiston({
        label: 'Compression Piston',
        orientation: 'horizontal',
        x: 600,
        y: 320,
        width: 28,
        height: 350,
        minPos: 200,
        maxPos: 760,
        mode: 'motorized',
        frequency: 0.5,
        amplitude: 220,
        phase: 0,
        mass: 50,
        conductivity: 0
      });

      // Cylinder Sensor
      engine.addSensor({
        label: 'Cylinder Chamber',
        x: 100,
        y: 160,
        width: 480,
        height: 320,
        color: '#f59e0b'
      });

      // Enclosed Gas
      engine.spawnGasRaster(120, 180, 440, 280, 160, 1.0, 280, 'maxwell_boltzmann', 'Cylinder Gas');
    }
  },

  // 6. Brownian Motion & Colloidal Diffusion
  brownianMotion: {
    id: 'brownianMotion',
    name: 'Brownian Motion & Colloidal Diffusion',
    category: 'Statistical Mechanics',
    icon: 'brownian',
    description: 'Massive colloidal particles suspended in an ideal thermal bath undergoing random walk collisions.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Closed Container Box
      engine.addWall(80, 80, 880, 80, { thickness: 6 });
      engine.addWall(80, 580, 880, 580, { thickness: 6 });
      engine.addWall(80, 80, 80, 580, { thickness: 6 });
      engine.addWall(880, 80, 880, 580, { thickness: 6 });

      // Measurement Zone
      engine.addSensor({
        label: 'Diffusion Bath',
        x: 90,
        y: 90,
        width: 780,
        height: 480,
        color: '#a855f7'
      });

      // Background Light Gas (m = 0.5, fast)
      engine.spawnGasRaster(100, 100, 760, 460, 240, 0.5, 350, 'maxwell_boltzmann', 'Thermal Gas Bath');

      // Add 4 Heavy Colloidal Particles (m = 15.0 to 25.0)
      const c1 = engine.addParticle(260, 300, 0, 0, 18.0);
      c1.tag = 'colloid';
      const c2 = engine.addParticle(480, 240, 0, 0, 22.0);
      c2.tag = 'colloid';
      const c3 = engine.addParticle(520, 420, 0, 0, 20.0);
      c3.tag = 'colloid';
      const c4 = engine.addParticle(700, 340, 0, 0, 25.0);
      c4.tag = 'colloid';
    }
  }
};

if (typeof window !== 'undefined') {
  window.Presets = Presets;
}
