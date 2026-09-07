# Thermo Sandbox (Particle Simulation) – Project Progress

## 1. Project Overview & Architecture
**Thermo Sandbox** is an interactive, GPU/Canvas-accelerated 2D Thermodynamics Particle Simulation & Virtual Laboratory built with modern vanilla JavaScript. It simulates classical particle mechanics, thermal heat exchange, gas laws ($PV = N k_B T$), phase transformations, pressure relief valves, check valves, motorized and free pistons, porous matrices, thermal reservoirs, and live telemetry dashboards.

---

## 2. Completed Milestones & Recent Work

### A. Ribbon & UI Architecture (Phase 3)
- [x] **2-Row Header Ribbon Layout**:
  - **Row 1 (General)**: View & Grid, History (Undo/Redo), Tools (Select, Text), Transforms (Rotate 90°, Flip H, Flip V, Group), Actions (Reset, Clear).
  - **Row 2 (Construction Elements)**: Walls (Polyline, Rect, Arc, Circle), Particles (Spawner, Emitter, Absorber, Regulator), Thermal (Sink, Heat Exchanger, Regenerator, Ressavoir), Pistons (Displacer, Accumulator, Compressor, Expander), Valves (Manual, Check, Throttle, PRV), Sensors (Chamber Zone).
- [x] **Simulation State Lock**: Construction toolbar (`.ribbon-row-construction`) is strictly dimmed and locked during playback, preventing accidental canvas edits while simulation is actively running.

### B. Grouping & Visual Feedback
- [x] **Auto-Aggregation Selection**: Clicking any grouped item on canvas or in the Elements Outline list selects all items sharing that `groupId`.
- [x] **Canvas Bounding Frame & Tag**: Selected groups render a dashed cyan boundary box with corner brackets and an indicator badge `⧉ Group (N)`.
- [x] **Outline Badges**: Grouped items display a bright `⧉ Group` badge and cyan left-border indicator.
- [x] **Inspector Integration**: Multi-selection and Group inspector allows toggling between `⧉ Group Selected Items` and `⧉ Ungroup Selection`.

### C. Thermal Triad & Valve Mechanics
- [x] **Thermal Reservoirs (🌡️)**: Infinite heat capacity $C = \infty$, constant temperature glow.
- [x] **Porous Permeable Matrix (▦)**: Particles pass through while volumetrically exchanging heat.
- [x] **Solid Thermal Block (■)**: Impermeable bouncing obstacle with finite heat capacity $C = m \cdot c_p$.
- [x] **Valves**:
  - **Manual Valve**: Clickable toggle switch during simulation.
  - **Check Valve**: One-way flow with styled `⇄ Flip Flow Direction` button and directional chevron.
  - **Pressure Relief Valve (PRV)**: Automatic opening above trigger pressure $P_\text{trigger}$ with smoothed pressure history and 1-Way / 2-Way mode selection.
  - **Variable Orifice Throttle Valve (`ThrottleValve.js`)**: Wedge-shaped jaw wings with variable central aperture gap ($0\%$ to $100\%$) and continuous momentum impulse integration ($\Delta P$).
- [x] **Particle Emitter**: Styled ON/OFF switch with glowing LED, 5-direction segmented control (`[→] [←] [↓] [↑] [360°]`), and max particle limit.

### D. Analytics, Telemetry & Custom Dashboard
- [x] **Macroscopic Drift Persistence Filter**: Drift velocity is filtered against thermal Brownian fluctuations ($v_\text{th} / \sqrt{N}$), ensuring only sustained bulk trends are measured.
- [x] **Chamber Cards**: Chamber cards in right sidebar show real-time drift speed and direction ($|v_\text{drift}|$ [px/s] & angle).
- [x] **Custom Multi-Chart Dashboard**: `+ Add Chart` allows users to dynamically add and remove real-time telemetry graphs ($T(t)$, $P(t)$, $V(t)$, $N(t)$, $E_\text{kin}(t)$, $|v_\text{drift}|(t)$, $P$-$V$) for the Global System or any individual Chamber.

### E. Particle Population Regulator Zone
- [x] **Regulator Module (`Regulator.js`)**: Dynamic population control zone maintaining setpoint particle count $N$ with hysteresis deadband $\pm \delta N$ to prevent oscillation.
- [x] **Automatic Influx & Vacuum Extraction**: Automatically injects thermalized particles during deficits and absorbs excess particles above deadband threshold.

### F. Hardware-Accelerated Dual-Canvas & Zero-Allocation Hotpath
- [x] **Zero-Allocation Hotpath**:
  - `Wall.js`: Added zero-allocation scalar projection `getClosestPointCoords`.
  - `ThrottleValve.js`: Added scalar wing collision tests without `Vector2` instantiation.
  - `Piston.js`, `ThermalBlock.js`, `Reservoir.js`: Cached `_bounds` objects, preventing GC thrashing.
  - `Engine.js`: In-place particle compaction in `_subStep` (removed `survivingParticles = []`).
  - `Engine.js`: Analytical Lennard-Jones formulation removing all `Math.sqrt` and `Math.pow` calls.
  - `SensorZone.js`: Single-pass variance calculation via mathematical shift theorem.
- [x] **Hardware-Accelerated Dual-Canvas Architecture**:
  - `ParticleGLRenderer.js`: WebGL 2 instanced particle renderer rendering 20,000+ anti-aliased discs in a single GPU draw call with a $256 \times 1$ LUT texture.
  - Transparent dual-layer canvas stack (`#glCanvas` at `z-index: 1`, `#simCanvas` at `z-index: 2`).

### G. Splash Screen & Welcome Dashboard
- [x] **Welcome Dashboard (`#splashOverlay` & `#splashCard`)**:
  - Opens automatically on cold start with live ambient particle simulation in the background.
  - Quick action cards: "New Simulation" (fresh canvas with perimeter walls), "Open Profile...", and "Return to Canvas".
  - Recent Profiles history tracking last 8 simulations in `localStorage` with metadata badges and instant restoration.
  - Physical Presets Library: Split-Stirling Cryocooler, Venturi Nozzle & Bernoulli Flow, Dual-Chamber Thermal Equalization, Joule-Thomson Throttle Expansion, Adiabatic Cylinder Compression, Brownian Motion & Colloidal Particle.
  - Automatic simulation halting and scene sanitization (`stopAndResetSimulationForNewScene()`) when switching profiles.
  - Logo click (`#brandBadge`) and `Esc` key navigation.

### H. Particle Gravity Physics
- [x] **Gravity Toggle (`#btnToggleGravity`)**:
  - 1-click toggle button in bottom playback dock with downward acceleration physics for particles.

### I. Thermodynamic Cycle Sequencer & GRAFCET Bottom Drawer
- [x] **Bottom Drawer Mechanics**:
  - Permanent 32px bottom header bar (`#seqDrawerHeader`) pinned across screen bottom (`bottom: 0`).
  - Clicking bar or chevron smoothly expands drawer to 265px and shifts the floating playback bar upward (`bottom: 275px`).
  - Removed sequencer button from the floating dock.
- [x] **GRAFCET Step-Transition Architecture**:
  - Alternating sequence track: `[Step Card (Actions)] ➔ [Transition Gate (Condition)] ➔ ... ➔ [Loop Indicator]`.
  - **Step Cards**: Simultaneous active outputs for Pistons (`Drive to TDC`, `Drive to BDC`, `Hold`, `Free Float`, with `⇄ Invert` polarity toggle), Throttle Valves (`Open`, `Closed`, `Aperture %`), and Thermal Reservoirs (`Active`, `Insulated`).
  - **Discrete Transition Gates**: Configurable conditions for `⏱ Time Duration`, `🎯 Piston reaches TDC/BDC` (with fallback timeout), and `📡 Sensor Threshold`, with real-time animated progress bars.
  - Continuous cycle loop counter, reset, duplicate, and step re-ordering.
- [x] **Theme Harmonization & English Localization**:
  - Neutral dark slate palette (`#0c0e14`, `#11141c`, `#131620`, `#141720`) with 0 occurrences of bluish `#181d28` and `#121622`.
  - 100% English labels, badges, tooltips, dialogs, and states.

---

## 3. Next Session Starting Tasks
- [ ] Add CSV export for chamber and dashboard time-series telemetry data.
- [ ] Add interactive particle inspector (click single particle to track trajectory and velocity history).
- [ ] Extend Sequencer with additional output targets (Regulators, Emitters, Sinks) and compound conditions (AND/OR).
- [ ] Phase 3 Performance: Migrate core SoA physics to dedicated Web Worker for 35,000+ particles.
