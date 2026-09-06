export const Presets = {
  // 1. Split-Stirling Cryocooler / Heat Engine (From user reference diagram)
  splitStirling: {
    name: 'Split-Stirling Kältemaschine',
    description: 'Dual-Piston Kompressor, Split-Pipe mit Wärmetauscher, Regenerator und federgelagerter Verdränger/Bouncing-Volume.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer boundaries / Compressor housing (Left side)
      // Compressor Chamber: X in [40, 260], Y in [150, 500]
      engine.addWall(40, 150, 260, 150, { label: 'Kompressor Gehäuse' });
      engine.addWall(40, 500, 260, 500);
      engine.addWall(40, 150, 40, 500);

      // Split Pipe connecting compressor to regenerator
      // Upper pipe wall
      engine.addWall(260, 150, 260, 305);
      engine.addWall(260, 305, 540, 305, { label: 'Split Pipe' });
      // Lower pipe wall
      engine.addWall(260, 345, 540, 345);
      engine.addWall(260, 345, 260, 500);

      // Heat exchangers along the split pipe (Ambient heat rejection at 300K)
      engine.addWall(290, 300, 380, 300, { type: 'isothermal', temperature: 300, label: 'Wärmetauscher (300K)', thickness: 6 });
      engine.addWall(290, 350, 380, 350, { type: 'isothermal', temperature: 300, thickness: 6 });
      
      engine.addWall(440, 300, 520, 300, { type: 'isothermal', temperature: 300, label: 'Wärmetauscher (300K)', thickness: 6 });
      engine.addWall(440, 350, 520, 350, { type: 'isothermal', temperature: 300, thickness: 6 });

      // Cold Finger / Expander Cylinder (Right side: X in [540, 680], Y in [60, 580])
      // Top Cold Finger
      engine.addWall(540, 60, 680, 60, { type: 'isothermal', temperature: 100, label: 'Cold Finger (100K)', thickness: 8 });
      engine.addWall(540, 60, 540, 305);
      engine.addWall(680, 60, 680, 420);

      // Bottom Bouncing Volume / Spring Housing
      engine.addWall(540, 345, 540, 420);
      engine.addWall(500, 420, 540, 420);
      engine.addWall(500, 420, 500, 580);
      engine.addWall(500, 580, 720, 580, { label: 'Bouncing Volume' });
      engine.addWall(720, 580, 720, 420);
      engine.addWall(680, 420, 720, 420);

      // Regenerator Matrix inside Cold Finger (Porous thermal gradient)
      engine.addWall(542, 170, 678, 170, { type: 'regenerator', temperature: 160, porosity: 0.85, label: 'Regenerator (Kalt)' });
      engine.addWall(542, 230, 678, 230, { type: 'regenerator', temperature: 230, porosity: 0.85, label: 'Regenerator (Mittel)' });
      engine.addWall(542, 290, 678, 290, { type: 'regenerator', temperature: 295, porosity: 0.85, label: 'Regenerator (Warm)' });

      // Pistons:
      // 1. Dual Compressor Piston (Left) - Motorized oscillation
      engine.addPiston({
        label: 'Kompressor Kolben',
        orientation: 'horizontal',
        x: 140,
        y: 325,
        width: 24,
        height: 330,
        minPos: 60,
        maxPos: 240,
        mode: 'motorized',
        frequency: 0.8,
        amplitude: 55,
        phase: 0,
        centerPos: 140
      });

      // 2. Displacer / Expander Piston with Spring in Bouncing Volume (Right)
      // Moving with ~90 degree phase shift for Stirling cycle cooling!
      engine.addPiston({
        label: 'Verdränger / Displacer',
        orientation: 'vertical',
        x: 610,
        y: 370,
        width: 20,
        height: 120,
        minPos: 320,
        maxPos: 460,
        mode: 'motorized',
        frequency: 0.8,
        amplitude: 40,
        phase: Math.PI * 0.45, // ~81 deg phase advance for maximum cooling COP
        centerPos: 380,
        mass: 30,
        springK: 120,
        friction: 0.02
      });

      // Sensor Zones:
      // Compression Zone
      engine.addSensor({
        label: 'Kompressions-Zone',
        x: 175,
        y: 200,
        width: 80,
        height: 250,
        color: '#f97316'
      });

      // Cold Expansion Zone (Top of Cold Finger)
      engine.addSensor({
        label: 'Kälte-Zone (Cold Finger)',
        x: 545,
        y: 65,
        width: 130,
        height: 95,
        color: '#06b6d4'
      });

      // Spawn Gas Particles in the working volume
      engine.spawnGasRegion(170, 200, 80, 250, 180, 300);
      engine.spawnGasRegion(270, 310, 260, 30, 80, 290);
      engine.spawnGasRegion(550, 80, 120, 200, 140, 200);
    }
  },

  // 2. Venturi-Düse & Bernoulli-Effekt
  venturiNozzle: {
    name: 'Venturi-Düse & Bernoulli-Effekt',
    description: 'Strömungskanal mit Verengung. Zeigt Druckabfall und Geschwindigkeitszunahme im Engpass.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Channel contours: Wide inlet (W=240), throat (W=70), diffuser (W=240)
      // Top Wall
      engine.addWall(20, 160, 250, 160, { label: 'Einlass (Breit)' });
      engine.addWall(250, 160, 420, 255, { label: 'Düse' });
      engine.addWall(420, 255, 520, 255, { label: 'Engpass / Throat' });
      engine.addWall(520, 255, 700, 160, { label: 'Diffusor' });
      engine.addWall(700, 160, 880, 160, { label: 'Auslass' });

      // Bottom Wall
      engine.addWall(20, 480, 250, 480);
      engine.addWall(250, 480, 420, 385);
      engine.addWall(420, 385, 520, 385);
      engine.addWall(520, 385, 700, 480);
      engine.addWall(700, 480, 880, 480);

      // Inlet / Outlet open bounds / particle recycling
      engine.addWall(20, 160, 20, 480, { type: 'valve_right', label: 'Inflow' });
      engine.addWall(880, 160, 880, 480, { type: 'valve_right', label: 'Outflow' });

      // Sensors:
      // 1. Inlet Zone
      engine.addSensor({
        label: 'Zone 1: Einlass',
        x: 80,
        y: 200,
        width: 140,
        height: 240,
        color: '#3b82f6'
      });

      // 2. Throat Zone
      engine.addSensor({
        label: 'Zone 2: Engpass (P ↓, v ↑)',
        x: 420,
        y: 260,
        width: 100,
        height: 120,
        color: '#f59e0b'
      });

      // 3. Diffuser / Outlet Zone
      engine.addSensor({
        label: 'Zone 3: Auslass',
        x: 720,
        y: 200,
        width: 140,
        height: 240,
        color: '#10b981'
      });

      // Continuous Emitter at Inlet
      engine.addEmitter({
        x: 35,
        y: 320,
        vx: 240,
        vy: 0,
        spreadY: 280,
        rate: 55,
        temperature: 250,
        radius: 4.5
      });

      // Pre-fill with flowing particles
      for (let x = 60; x < 840; x += 35) {
        for (let y = 200; y < 450; y += 35) {
          // Check if within channel
          let topY = 160, botY = 480;
          if (x >= 250 && x <= 420) {
            const frac = (x - 250) / 170;
            topY = 160 + frac * 95;
            botY = 480 - frac * 95;
          } else if (x > 420 && x < 520) {
            topY = 255;
            botY = 385;
          } else if (x >= 520 && x <= 700) {
            const frac = (x - 520) / 180;
            topY = 255 - frac * 95;
            botY = 385 + frac * 95;
          }

          if (y > topY + 10 && y < botY - 10) {
            // Speed higher in throat
            const speedFactor = (x > 380 && x < 560) ? 1.8 : 1.0;
            const p = engine.addParticle(x, y, 160 * speedFactor + (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 4.5);
            p.tag = 'flow';
          }
        }
      }
    }
  },

  // 3. 2-Kammer Wärme- & Druckausgleich
  twoChambers: {
    name: '2-Kammer Wärme- & Druckausgleich',
    description: 'Heißes vs. kaltes Gas mit wärmeleitender oder entfernbarer Trennwand. Demonstration des 2. Hauptsatzes.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Outer Box (X in [60, 840], Y in [100, 520])
      engine.addWall(60, 100, 840, 100);
      engine.addWall(60, 520, 840, 520);
      engine.addWall(60, 100, 60, 520, { type: 'isothermal', temperature: 550, label: 'Heizwand (550K)' });
      engine.addWall(840, 100, 840, 520, { type: 'isothermal', temperature: 100, label: 'Kühlwand (100K)' });

      // Central movable / heat-conducting partition piston
      engine.addPiston({
        label: 'Trennschieber / Kolben',
        orientation: 'horizontal',
        x: 450,
        y: 310,
        width: 18,
        height: 410,
        minPos: 120,
        maxPos: 780,
        mode: 'free',
        mass: 30,
        friction: 0.04
      });

      // Sensor Left (Hot)
      engine.addSensor({
        label: 'Kammer Links (Heiß)',
        x: 80,
        y: 120,
        width: 320,
        height: 380,
        color: '#ef4444'
      });

      // Sensor Right (Cold)
      engine.addSensor({
        label: 'Kammer Rechts (Kalt)',
        x: 490,
        y: 120,
        width: 330,
        height: 380,
        color: '#3b82f6'
      });

      // Spawn Hot gas left (High T), Cold gas right (Low T)
      engine.spawnGasRegion(90, 130, 320, 360, 160, 500, { tag: 'hot' });
      engine.spawnGasRegion(480, 130, 330, 360, 160, 120, { tag: 'cold' });
    }
  },

  // 4. Adiabatische vs. Isotherme Kompression
  compressionCylinder: {
    name: 'Adiabatische & Isotherme Kompression',
    description: 'Zylinder mit beweglichem Kolben. Schiebe den Kolben per Maus oder Motor für Kompressionswärme!',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Cylinder Box (X in [80, 780], Y in [140, 480])
      engine.addWall(80, 140, 780, 140, { label: 'Zylinderwand' });
      engine.addWall(80, 480, 780, 480);
      engine.addWall(80, 140, 80, 480, { label: 'Zylinderboden' });

      // Cylinder Piston
      engine.addPiston({
        label: 'Kompressionskolben',
        orientation: 'horizontal',
        x: 550,
        y: 310,
        width: 24,
        height: 330,
        minPos: 160,
        maxPos: 760,
        mode: 'manual',
        mass: 40,
        friction: 0.05
      });

      // Sensor inside cylinder volume
      engine.addSensor({
        label: 'Zylindervolumen',
        x: 100,
        y: 160,
        width: 400,
        height: 300,
        color: '#f59e0b'
      });

      // Gas particles
      engine.spawnGasRegion(110, 170, 400, 280, 220, 260);
    }
  },

  // 5. Brownsche Bewegung & Diffusion
  brownianMotion: {
    name: 'Brownsche Bewegung & Schwere Teilchen',
    description: 'Große kolloidale Partikel umgeben von mikroskopischen Gasatomen demonstrieren thermische Fluktuationen.',
    load: (engine) => {
      engine.clear();
      engine.timeScale = 1.0;

      // Closed Box
      engine.addWall(80, 80, 820, 80);
      engine.addWall(80, 560, 820, 560);
      engine.addWall(80, 80, 80, 560);
      engine.addWall(820, 80, 820, 560);

      // Light Gas Particles
      engine.spawnGasRegion(100, 100, 700, 440, 320, 320, { radius: 4, mass: 1 });

      // 3 Heavy Brownian Particles
      const bp1 = engine.addParticle(300, 320, 0, 0, 18, 45);
      bp1.tag = 'colloid';
      const bp2 = engine.addParticle(600, 320, 0, 0, 22, 60);
      bp2.tag = 'colloid';

      // Sensor Zone
      engine.addSensor({
        label: 'Gesamtsystem',
        x: 90,
        y: 90,
        width: 720,
        height: 460,
        color: '#a855f7'
      });
    }
  }
};
