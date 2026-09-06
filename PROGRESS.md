# Thermo Sandbox (Particle Simulation) – Project Progress

## 1. Project Overview & Architecture
**Thermo Sandbox** is an interactive, GPU/Canvas-accelerated 2D Thermodynamics Particle Simulation & Virtual Laboratory built with modern vanilla JavaScript. It simulates classical particle mechanics, thermal heat exchange, gas laws (PV = N k_B T), phase transformations, pressure relief valves, check valves, pistons, porous matrices, thermal reservoirs, and live telemetry dashboards.

---

## 2. Completed Milestones & Recent Work

### A. Ribbon & UI Architecture (Phase 3)
- [x] **2-Row Header Ribbon Layout**:
  - **Row 1 (General)**: View & Grid, History (Undo/Redo), Tools (Select, Text), Transforms (Rotate 90°, Flip H, Flip V, Group), Actions (Reset, Clear).
  - **Row 2 (Construction Elements)**: Walls (Polyline, Rect, Arc), Pistons (Free, Spring, Motor), Thermal (Reservoir, Porous Matrix, Solid Block), Particles (Gas Infill, Emitter, Sink Vacuum), Valves (Manual, Check, Pressure Relief PRV), Sensor (Chamber).
- [x] **Simulation State Lock**: Construction toolbar (.ribbon-row-construction) is strictly dimmed (opacity: 0.3 !important; filter: grayscale(1) brightness(0.65) !important; pointer-events: none !important;) during playback, preventing accidental canvas edits while simulation is actively running.

### B. Grouping & Visual Feedback
- [x] **Auto-Aggregation Selection**: Clicking any grouped item on canvas or in the Elements Outline list selects all items sharing that groupId.
- [x] **Canvas Bounding Frame & Tag**: Selected groups render a dashed cyan boundary box with corner brackets and an indicator badge ⧉ Group (N).
- [x] **Outline Badges**: Grouped items display a bright ⧉ Group badge and cyan left-border indicator.
- [x] **Inspector Integration**: Multi-selection and Group inspector allows toggling between ⧉ Group Selected Items and ⧉ Ungroup Selection.

### C. Thermal Triad & Valve Mechanics
- [x] **Thermal Reservoirs (🌡️)**: Infinite heat capacity C = infinity, constant temperature glow.
- [x] **Porous Permeable Matrix (▦)**: Particles pass through while volumetrically exchanging heat and slowing down when transferring kinetic energy to the matrix.
- [x] **Solid Thermal Block (■)**: Impermeable bouncing obstacle with finite heat capacity C = m * c_p.
- [x] **Valves**:
  - **Manual Valve**: Clickable toggle switch during simulation.
  - **Check Valve**: One-way flow with styled ⇄ Flip Flow Direction button and directional chevron.
  - **Pressure Relief Valve (PRV)**: Automatic opening above trigger pressure P_trigger with smoothed pressure history and 1-Way / 2-Way mode selection.
- [x] **Particle Emitter**: Styled ON/OFF switch (.btn-emitter-toggle) with glowing LED, 5-direction segmented control [→] [←] [↓] [↑] [360°], and max particle limit.

### D. Analytics, Telemetry & Custom Dashboard
- [x] **Macroscopic Drift Persistence Filter**: Drift velocity is filtered against thermal Brownian fluctuations (v_th / sqrt(N)), ensuring only sustained bulk trends are measured.
- [x] **Chamber Cards**: Chamber cards in right sidebar show real-time drift speed and direction (|v_drift| [px/s] & angle).
- [x] **Custom Multi-Chart Dashboard**: + Add Chart allows users to dynamically add and remove real-time telemetry graphs (T(t), P(t), V(t), N(t), E_kin(t), |v_drift|(t), P-V) for the Global System or any individual Chamber.

### E. Nomenclature Standardization (Cryocooler & Physics Terminology)
- [x] **Pistons**: Updated to Compressor (`C`), Expander (`E`), Displacer (`D`), and Accumulator (`A`) with updated body letters on canvas.
- [x] **Thermal**: Updated to Sink (Isotherm), Heat Exchanger, Regenerator, and Ressavoir (Storage Block).
- [x] **Particles**: Renamed Cloud to Spawner, Sink to Absorber.
- [x] **Physics Engine**: Model toggle button renamed from Lennard-Jones to "Real Gas" (vs Ideal Gas).

### F. Particle Population Regulator Zone
- [x] **Regulator Module (`Regulator.js`)**: Dynamic population control zone maintaining setpoint particle count $N$ with hysteresis deadband $\pm \delta N$ to prevent oscillation.
- [x] **Automatic Influx & Vacuum Extraction**: Automatically injects thermalized particles during deficits and absorbs excess particles above deadband threshold.
- [x] **Interactive Controls**: Toolbar button in PARTICLES ribbon, dedicated inspector sliders, and on-canvas enable/disable toggle.

### G. Sensor Zone Visual Telemetry
- [x] **Decoupled Boundary & Temperature Fill**: Sensor zone border lines retain their persistent hue for clear chart matching, while the inner fill area dynamically shifts with real-time temperature using the thermal colormap.

### H. Variable Orifice Throttle Valve (`ThrottleValve.js`)
- [x] **Kinetic Restriction & Choking**: Divides wall into two wedge-shaped jaw wings with variable central aperture gap ($0\%$ to $100\%$). Zero leakage when closed ($0\%$).
- [x] **Dual-Control Justification**: Interactive on-canvas gap handles (`gap1`, `gap2`) at orifice edges + exact sidebar inspector percentage and pixel sliders.
- [x] **Live Pressure Drop Readout**: Continuous momentum impulse integration across sides with live readout badge (`Throttle X% ΔP: Y Pa`).

### I. Ribbon Reorganization & Circle Wall Tool
- [x] **Single Unified Ribbon Order**: Standardized 6 construction groups: `WALLS`, `PARTICLES`, `THERMAL`, `PISTONS`, `VALVES`, `SENSORS` (eliminated duplicate valves).
- [x] **Top Header Cleanup**: Removed redundant project icon before profile title.
- [x] **Circle Wall Tool**: New `#toolWallCircle` tool with center-to-radius drag interaction, smooth adaptive polygon segments (20-64 segments), automatic group binding (`groupId`), and 100% particle containment.

### J. Zero-Allocation Hotpath & WebGL 2 Instanced Particle Renderer
- [x] **Zero-Allocation Hotpath**:
  - `Wall.js`: Added zero-allocation scalar projection `getClosestPointCoords` (eliminated millions of `Vector2` allocations).
  - `ThrottleValve.js`: Added scalar wing collision tests without `Vector2` instantiation.
  - `Piston.js`, `ThermalBlock.js`, `Reservoir.js`: Cached `_bounds` objects, preventing 2.4+ million allocations/sec.
  - `Engine.js`: In-place particle compaction in `_subStep` (removed `survivingParticles = []` GC churn).
  - `Engine.js`: Analytical Lennard-Jones formulation removing all `Math.sqrt` and `Math.pow` calls.
  - `SensorZone.js`: Single-pass variance calculation via mathematical shift theorem (halved particle tests).
- [x] **Hardware-Accelerated Dual-Canvas Architecture**:
  - `ParticleGLRenderer.js`: WebGL 2 instanced particle renderer rendering 20,000+ anti-aliased discs in a single GPU draw call with a $256 \times 1$ LUT texture.
  - Transparent dual-layer canvas stack (`#glCanvas` at `z-index: 1`, `#simCanvas` at `z-index: 2` with full event handling and 2D fallback).
  - Throttled chart rendering to 15 Hz in animation loop.
  - In-place DOM patching in `updateChamberCards` (zero DOM thrashing and zero canvas context destruction).
### K. UI Modernization, Onshape Feature Dialog & Single Unified Runtime
- [x] **Smooth Slider Dragging**: In-place DOM patching in `updateElementCardLabel` prevents destruction of slider elements during dragging.
- [x] **CAD Feature Tree**: Segmented shapes (circles, arcs, rects, polylines) aggregated into collapsible CAD feature tree cards with delete and multi-parameter editing.
- [x] **Polyline Snap-to-Close**: Mousedown priority handles polygon closing before node selection; snap indicator with `Click to close` badge.
- [x] **Ribbon & Nomenclature**: Regulator moved to end of PARTICLES group; updated to "Ideal Fluid" & "Real Fluid".
- [x] **Subtle Transparent Simulation Banner**: Clean monochrome SVG lock icon, transparent glassmorphism veil, and immediate stop action.
- [x] **Floating Onshape-Style Tool Dialog**:
  - Contextual floating panel opening adjacent to sidebar with exact toolbar names (`Absorber`, `Polyline`, `Displacer`, etc.) and category badges.
  - Header click toggles concise English physical descriptions; draggable when moved > 4px.
  - Live parameter synchronization with active canvas selections.
- [x] **Single Unified Runtime Architecture**:
  - Eliminated superfluous local Python HTTP server and port/cache collisions.
  - `Start_ParticleLab.bat` auto-builds via `build_all.py` and directly opens `ParticleLab_Standalone.html`.
  - Guarantees 100% identical state whether opened via `.bat` or direct HTML double-click.

---

## 3. Next Session Starting Tasks
- [ ] Implement preset thermodynamic cycles (Stirling engine cycle, Pulse tube cryocooler, Gifford-McMahon cycle, Carnot cycle) under a Presets menu.
- [ ] Add CSV export for chamber and dashboard time-series data.
- [ ] Add interactive particle inspector (click single particle to track trajectory and velocity history).
- [ ] Phase 3 Performance: Migrate core SoA physics to dedicated Web Worker for 35,000+ particles.

