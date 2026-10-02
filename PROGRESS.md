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

### J. Modular CSS Architecture (Vibe-Coding Ready)
- [x] **Decomposition of 3,473-Line CSS Monolith**:
  - Extracted monolithic `style.css` into 10 domain-specific, concise modules in `css/`:
    `variables.css`, `base.css`, `canvas.css`, `ribbon.css`, `sidebar-left.css`, `sidebar-right.css`, `playback.css`, `modals.css`, `splash.css`, and `sequencer.css`.
  - 0 missing rules, 0 dropped properties, 100% bracket balance verified across all modules.
- [x] **Fast Vibe-Coding Iteration Workflow**:
  - `index.html` connects modular stylesheets directly, allowing instant hot reload on save without rebuilds.
  - Browser DevTools directly map inspecting elements to component CSS files (e.g. `sequencer.css:42` instead of `style.css:3290`).
- [x] **Build System Integration**:
  - `build_all.py` updated with `css_files_order` to bundle all CSS modules into single standalone inlined `<style>` block for `ParticleLab_Standalone.html`.
  - `style.css` converted into a clean master `@import` aggregator hub.

### K. Clean Re-Implementation of Thermodynamic Cycle Sequencer
- [x] **Stage 1: Floating Dock & Timeline Layout Shell**:
  - Unified `#unifiedBottomDock` containing `#unifiedDockBar` with playback controls, time counter, speed slider, fluid model toggle, gravity toggle, divider, and clean `[⏱ Sequencer]` button (`#btnToggleSequencer`) with active LED dot and expand chevron.
  - Smooth drawer expansion to `width: min(1240px, calc(100vw - 760px)); min-width: 540px; height: 310px;` with comfortable clearance to sidebars (336px left, 396px right).
  - Dark glassmorphism, monochrome stroke SVGs, strictly 0 emojis.
- [x] **Stage 2: Element Selection & Action Configuration Modal**:
  - Interactive canvas & outline picking mode (`+ Add Element` in Step card with toast banner and ESC cancel).
  - Action modal displaying exact inspector properties for Pistons, Valves (Manual, Check, Relief, Throttle), Thermals (Reservoir, Block, Heat Exchanger, Regenerator), Emitters, Sinks, and Regulators.
  - Excludes Spawner (Gas) and Chamber (SensorZone); excludes thickness for walls and valves.
  - Full parameter snapshot saving and compact action badges with Edit/Delete buttons.
- [x] **Stage 3: Transition Gates & State Machine Execution Loop**:
  - Compound transition configuration dialog with Duration, Piston target (TDC, BDC, px), and Sensor chamber (Pressure/Temp, >=, <=) conditions.
  - Logical `AND` / `OR` combining gates with safety fallback timeout.
  - Modularized `src/control/` into clean files strictly `< 350` lines each:
    `CycleSequencer.js`, `SequencerConditions.js`, `SequencerExecutor.js`, `SequencerActionFields.js`, `SequencerFieldControls.js`, `SequencerActionDialog.js`, `SequencerTransitionDialog.js`, `SequencerTimeline.js`, `SequencerDock.js`, and `SequencerUI.js`.
  - Zero regressions on existing features; verified with `tests/verify_all.py` and CDP headless Chrome test suite.

### L. Object-Anchored Sequencer Action Dialog & TOOL_CATALOG Parameter Alignment
- [x] **Object-Anchored Floating CAD Modal**:
  - Replaced fixed center `.modal-overlay` with a floating CAD panel (`.seq-floating-action-dialog`) anchored directly next to the selected canvas object.
  - Automatic viewport clamping against left sidebar (340px), right sidebar, top ribbon (115px), and bottom sequencer drawer (280px).
  - Smooth flip to left side if object is near right screen boundary.
  - Free header dragging (`#seqActHeader`) for manual repositioning by the user.
- [x] **Dezenter Cyan-Glow Canvas Highlight**:
  - Highlights the selected element on the 2D canvas with a subtle glowing cyan outline (`#38bdf8`, 15px shadow blur, 2.5px stroke) without resize handles.
  - Automatically activates when configuring an action and clears to `null` on save, cancel, or close.
- [x] **Smooth Camera Focusing**:
  - Clicking an action card in the sequencer timeline automatically checks if the targeted element is in view; if obscured or offscreen, pans camera smoothly to center the element.
- [x] **Full Parameter Alignment with `TOOL_CATALOG.md`**:
  - **DualInput Synchronizers**: Gekoppelte Slider- und Zahlenfelder mit Live-Einheitenanzeige (`makeDualInput` / `attachDualInput`).
  - **Pistons**: Stroke commands (`drive_tdc`, `drive_bdc`, `hold`, `free`), motion physical mode (`free`, `spring`, `motorized`, `damper`), drive speed, piston mass (0–150 kg), conductivity κ, dynamic mode-dependent inputs (`springK`, `frequency`/`phase`, `dampingCoeff`).
  - **Valves**: Manual Valve (Open/Closed toggle, κ), Check Valve (5-button Forward → / Reverse ← toggle, κ), Relief Valve (1-Way/2-Way segmented toggle, Trigger Pressure 50–1000 Pa, Hysteresis Band 0–100 Pa, κ), Throttle Valve (Active/Bypassed, Opening Ratio 0–100%, κ).
  - **Thermals**: Reservoir (Active/Insulated, Temp 0–1000 K, Conductance), Heat Exchanger (Active/Inactive, Temp, κ), Regenerator (Active/Inactive, Horizontal/Vertical toggle, Temp, Heat Capacity 50–1500 J/K, κ), Storage Block (Active/Inactive, Temp, Heat Capacity, κ).
  - **Particles**: Emitter (Firing/Paused, 5-button direction toggle `[→] [←] [↓] [↑] [360°]`, Rate 1–50 /s, Temp 20–800 K, Mass 0.2–5.0, Capacity Limit), Sink (Active/Inactive, 5-direction toggle, 3-button thermal filter `[All] [Hot Only] [Cold Only]`, Threshold Temp, Absorption Efficiency 10%–100%, Capacity Limit), Regulator (Active/Inactive, Target Count 5–200, Hysteresis Band 1–15, Temp, Mass, Rate).
  - **Walls**: Conductivity κ.
  - Excluded thickness for walls and valves; excluded Spawner (Gas) and Chamber (SensorZone).
### M. Sequencer UI Enhancements (Wider Drawer, Active/Loop Redesign, Accordions & Defaults)
- [x] **1. Wider Sequencer Drawer Expansion**:
  - Expanded `.unified-bottom-dock` on `body.sequencer-expanded` to span the entire gap between left and right sidebars (`left: 352px; right: 412px; width: auto; transform: none;`).
  - Preserves exact 16px margins to both sidebars, providing maximum horizontal canvas visibility while maintaining dock ergonomics.
- [x] **2. Centered Controls & Lifted Floating Panels**:
  - Center-aligned playback and sequencer header controls in `.unified-dock-bar` (`justify-content: center;`).
  - Lifted `.floating-zoom-panel` (`bottom: 350px;`) and `#floatingVelLegend` (`bottom: 494px;`) with smooth 0.28s cubic-bezier transitions when the sequencer drawer opens.
- [x] **3. Active & Loop Mode Buttons Redesign**:
  - Replaced checkbox switch toggles with consistent green status buttons (`#seqBtnActive`, `#seqBtnLoop`) featuring glowing indicator dots (`.seq-mode-dot`) matching `.model-toggle-btn.active`.
  - Live two-way synchronization with `engine.sequencer.isEnabled` and `engine.sequencer.isLooping`.
- [x] **4. Step Element Accordions & Smooth Camera Zoom**:
  - Formatted step action cards as expandable accordions (`.seq-action-card`, `.seq-action-header`, `.seq-action-body`) modeled after the Canvas Elements Outline list.
  - Clicking the accordion header expands the card to display configured parameter key-values (`SequencerSummary.formatActionPropsHTML`) and smoothly pans/zooms the camera onto the canvas object (`_focusCameraOnItem`) with a glowing cyan outline.
  - **Does not trigger the action configuration modal popup** on accordion click; the modal only opens when explicitly clicking the Edit pen button (`.btn-edit-action`).
- [x] **5. Canonical Default Indicators & Reset to Default Button**:
  - Integrated `SequencerCatalogDefaults.js` referencing single-source-of-truth baseline defaults from `TOOL_CATALOG.md`.
  - Added subtle default value tags (`.seq-def-indicator`) to each parameter row in the action configuration dialog.
  - Live highlighting (`.field-row.is-modified`) triggers whenever a user changes a parameter away from its catalog default (highlighted label + amber indicator).
  - Added `Reset to Default` button (`#seqActBtnReset`) in the action dialog footer to instantly restore standard catalog settings for the element.
- [x] **Modular Architecture & Test Verification**:
  - Created `SequencerCatalogDefaults.js` (101 lines) and `SequencerSummary.js` (141 lines).
  - All 12 files in `src/control/*.js` strictly maintained under the 350-line limit (verified by `tests/verify_all.py`).
  - Full end-to-end Chrome CDP automated test suite (`scratch/test_sequencer_modal_cdp.py`) passes 100% with 0 errors.

### N. Sequencer UI Polish: Slider Default Notches, Header Reset Arrow, In-Line Accordion Sliders & Canvas Hover Highlighting
- [x] **1. Slider Default Notch Markers**:
  - Direct visual tick notches (`.slider-notch`) placed on the track of every dual-input slider indicating the canonical default value from `TOOL_CATALOG.md`.
  - Positioned via dynamic percentage calculation `((defVal - min) / (max - min)) * 100%` within `.slider-track-wrap`.
- [x] **2. Top-Left Modal Reset Arrow**:
  - Replaced the bottom-left text button in `#seqActionDialog` with a compact circular reset button (`.btn-dialog-reset`) in the top-left of the modal header (`#seqActHeader`).
  - Styled with a monochrome SVG reset arrow and amber hover glow; removed `#seqActBtnReset` from the modal footer.
- [x] **3. In-Line Interactive Sliders in Step Accordions**:
  - Rendered interactive dual sliders, numbers, and direction/state toggles directly inside the expanded step accordion body (`.seq-action-body`).
  - Removed the edit button (`.btn-edit-action`) from the action card header.
  - Live two-way synchronization: adjustments instantly update `step.actions[aIdx]` and notify the sequencer state without re-rendering the DOM or losing slider drag focus.
- [x] **4. Canvas Hover Highlighting during Picking Mode**:
  - When clicking `+ Add Element` (`isPicking === true`), hovering over any pickable canvas element immediately activates the glowing cyan outline (`renderer.highlightedSequencerItem`) and switches the canvas cursor to `pointer`.
  - Automatically filters out unpickable objects (Spawners and Chambers); safely clears highlight when mouse moves away or picking mode terminates.
- [x] **5. Step Accordion Vertical Fit & Drawer Elevation (420px)**:
  - Increased bottom dock drawer height from 320px to 420px on `body.sequencer-expanded`, providing ample vertical space.
  - Made `.seq-actions-list` smoothly scrollable (`flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin;`) while keeping `+ Add Element` permanently pinned at the bottom (`flex-shrink: 0; margin-top: 6px;`).
  - Applied compact CAD typography and margins to `.seq-action-body` (tighter margins, 10px fonts, 20-24px input heights) allowing 5+ parameter rows to be visible simultaneously at a glance.
  - Lifted `.floating-zoom-panel` (`bottom: 450px;`) and `.floating-vel-legend` (`bottom: 594px;`) and updated camera centering offsets (`dockH = 420`) in `SequencerTimeline.js` and `SequencerActionDialog.js`.
- [x] **Modular Architecture & Test Verification**:
  - All 12 files in `src/control/*.js` strictly maintained under the 350-line limit (verified by `tests/verify_all.py`).
  - Full end-to-end Chrome CDP automated test suite (`scratch/test_sequencer_modal_cdp.py`) passes 100% with 0 errors.

### O. Sequencer UI Bugfixes: Splash Screen Dock, Guaranteed Default Step, Single Accordion & Step Overflow Scrolling
- [x] **1. Splash Screen Dock Bar Visibility Fix**:
  - Resolved leakage of the unified bottom dock (`#unifiedBottomDock`) on the welcome splash screen by adding `.unified-bottom-dock` and `#unifiedBottomDock` to `css/splash.css` under `body.splash-mode` with `display: none !important;`.
- [x] **2. Guaranteed Default Step 1**:
  - Ensured the sequencer always starts with at least one default step (`Step 1`) across all scenarios: initial load, `btnSplashNew` click, `engine.clear()`, `engine.sequencer.reset()`, and profile state export/import (`CycleSequencer.js`, `Engine.js`, `main.js`).
- [x] **3. Single Open Accordion per Step Card**:
  - Modified accordion expansion handling in `SequencerTimeline.js` (`this.expandedActions.clear()` before setting active key) so opening any element configuration accordion automatically collapses all other open accordions.
- [x] **4. Step Card Vertical Overflow Scrolling**:
  - Resolved card squishing and clipping bug by setting `flex-shrink: 0;` on `.seq-action-card` and `.seq-action-header` in `css/sequencer.css`.
  - Step action cards maintain their natural height; when multiple elements are added or an item is expanded, `.seq-actions-list` enables clean vertical scrolling (`overflow-y: auto; scrollbar-width: thin;`) while keeping `+ Add Element` permanently pinned at the bottom inside `.seq-step-body`.
  - Added `flex-shrink: 0;` to all child elements in `.unified-dock-bar` to guarantee that playback, fluid model, gravity, and sequencer buttons never wrap or distort when the drawer expands.

### P. Arbitrary 2D Compound Transition Conditions Builder (Brackets & Logic Precedence)
- [x] **1. Canonical 2D Data Model & Backwards Compatibility**:
  - Transformed the sequencer step transition structure from a flat AND/OR list into an arbitrary 2D block grid `{ rows: [ { conditions: [...], operators: [...] } ], rowOperators: [...], fallbackTimeout: 10.0 }`.
  - Added `SequencerConditions.normalizeTransition(trans)` to automatically migrate legacy single-condition and flat compound transition models into the 2D structure without data loss.
- [x] **2. Mathematical Boolean Precedence Evaluation**:
  - Implemented `SequencerConditions.evaluateSequence(evalResults, operators)` applying standard mathematical Boolean precedence (AND binds before OR: `a & b || c & d` $\rightarrow$ `(a & b) || (c & d)`).
  - Evaluates each bracketed row and combines the rows via `rowOperators`.
  - Progress bar calculation: OR branches evaluate to $\max(\text{progress})$, while AND branches evaluate to $\text{average}(\text{progress})$.
- [x] **3. Interactive 2D Visual Builder (`SequencerTransitionBuilder.js`)**:
  - Built modular 2D transition editor rendering bracketed rows `(` ... `)` with row action buttons (`[+ &]`, `[+ ||]`, and delete row).
  - Compact Square Monochrome SVG Chips: When adding conditions or opening the editor, inactive conditions collapse into 42×42px square chips displaying clean CAD SVG icons (`⏱` Stopwatch, `🎯` Target/Piston, `📡` Dial Gauge – strictly no colorful emojis) with subtle value tags (`1.5s`, `TDC`, `200Pa`).
  - Single Expanded Active Chip: Clicking any collapsed chip expands it into an interactive property card (Duration slider, Piston target selector, Sensor chamber metric selector) while automatically collapsing all other chips in the matrix.
  - Interactive Operator Pills: Horizontal pills between chips and vertical pills between rows display `&` and `||` and toggle on click.
  - Grid Row Creation: Added `[+ & Zeile]` and `[+ || Zeile]` buttons beneath the grid to easily spawn new bracketed logic rows.
- [x] **4. Transition Dialog Modal Integration (`SequencerTransitionDialog.js`)**:
  - Cleaned up the modal dialog, delegating 2D grid rendering to `SequencerTransitionBuilder` and reducing file length to 130 lines.
  - Retained the safety fallback timeout slider (1.0–60.0s, default 10.0s).
- [x] **5. Timeline Track Formula Preview (`SequencerSummary.js` & `SequencerTimeline.js`)**:
  - Rendered a compact mathematical expression with clean monochrome symbols and bracketed groups on the timeline transition node (e.g. `(⏱ 1.5s & 🎯 TDC) || (📡 P>=200Pa)`).
  - Updated node width (`min-width: 150px; max-width: 200px;`) and added full details in tooltip.
- [x] **6. Modular Architecture & Test Verification**:
  - Added `SequencerTransitionBuilder.js` (314 lines) and updated `build_all.py`.
  - All 13 control files strictly verified under the 350-line limit by `tests/verify_all.py`.
  - Automated CDP test suite (`tests/test_transition_cdp.py`) passes 100% with verified modal and timeline screenshots.
- [x] **7. Expanded Condition Chip Layout & Control Sizing Fix**:
  - Resolved horizontal overflow where sensor controls (Metric select, Operator select, and Threshold input) protruded past the right border of `.seq-trans-chip.is-expanded`.
  - Expanded chip dimensions increased from `min-width: 175px; max-width: 220px;` to `min-width: 220px; max-width: 260px;`.
  - Added dedicated compact styling in `css/sequencer.css` for `.seq-trans-chip .styled-select` (`height: 24px; font-size: 10px; padding: 2px 5px;`) and removed native webkit spinner buttons from numeric threshold inputs.
  - Styled `.btn-del-chip` with clean CAD button styling and hover feedback, eliminating unstyled native white button bevels.
  - Initialized default fields (`pressure`, `>=`, `200`, `tdc`, `1.5s`) automatically upon switching type in `SequencerTransitionBuilder.js`.

### Q. Repository Cleanup, GitHub Deployment & Comprehensive Documentation Overhaul
- [x] **1. Repository Tree Cleanup**:
  - Removed duplicate `assets/logo.png` binary, consolidating to single source of truth at root `logo.png`.
  - Migrated automated headless CDP test suites from `scratch/` into dedicated `tests/` (`test_sequencer_modal_cdp.py`, `test_transition_cdp.py`).
  - Added `scratch/` to `.gitignore` to keep public repository free of temporary scratch outputs.
- [x] **2. Comprehensive README.md Overhaul**:
  - Rewrote `README.md` with high-level conceptual overview (emergent thermodynamics from microscopic kinetics, CAD design philosophy, GRAFCET state machine automation, live analytics, built-in experiment presets, and zero-dependency standalone distribution).
- [x] **3. GitHub Remote Sync**:
  - Initialized git tracking and pushed all modular CSS, 2D sequencer architecture, tests, and documentation to `https://github.com/OttoElle/Thermo-Sandbox` on branch `main`.

### R. Next-Gen WebGPU Instanced Renderer Migration (Phase 1 - Modern Browser Only)
- [x] **1. Pure WebGPU & WGSL Architecture (`ParticleGPURenderer.js`)**:
  - Implemented modern WebGPU instanced billboard renderer with WGSL shaders (`vs_main`, `fs_main`).
  - Strict modern browser focus: completely eliminated legacy WebGL 2 and 2D-canvas particle fallback loops.
  - Smoothstep antialiasing, discard outside unit disc, and edge highlight glow for CAD realism.
  - 256×1 `rgba8unorm` colormap lookup texture with linear sampler for dynamic speed coloring.
  - Dynamic `GPUBuffer` allocation (`GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST`) scaling beyond 50,000 particles.
- [x] **2. Dual-Layer Canvas & Asynchronous Engine Initialization**:
  - Pinned `#gpuCanvas` at `z-index: 1` and `#simCanvas` at `z-index: 2`.
  - Added async `Renderer.initGPU(gpuCanvas)` with graceful detection.
  - Added modern CAD modal overlay (`#webgpuErrorOverlay`) guiding users if WebGPU is disabled or unsupported.
- [x] **3. Build System & Test Automation**:
  - Updated `build_all.py` and regenerated `bundle.js` and `ParticleLab_Standalone.html`.
  - Added `tests/test_webgpu_runtime.py` verifying device acquisition, WGSL shader compilation, buffer uploads, and particle render calls via Chrome CDP.
  - 100% test pass in `tests/verify_all.py`.


### T. Continuous Collision Detection (CCD) & GPU Wall Compute Buffer (Phase 2 - Step 2)
- [x] **1. Continuous Collision Detection (CCD) Ray-vs-Segment Swept Algorithm**:
  - Solved fast-particle tunneling across both CPU and GPU simulations using 2D Swept Ray-vs-Segment intersection detection ($t \in [0, 1]$, $u \in [-eps, 1+eps]$).
  - Fixed sign inconsistency in $t = (dx \cdot W_y - dy \cdot W_x) / \text{denom}$ ensuring time-of-impact calculation is mathematically exact.
  - Implemented outward normal reflection $V' = V - 2(V \cdot N)N$, damping, thermal conduction exchange, and residual time integration $P' = P_\text{hit} + N(r_\text{eff} + 0.05) + V' (1 - t) \Delta t$.
  - Added proximity / resting contact fallback preventing particles from penetrating wall corners or drifting at resting contact.
- [x] **2. GPU Wall Storage Buffer & WGSL Modularization (`ParticleGPUComputeShader.js`)**:
  - Implemented 48-byte `WallData` struct (`p1: vec2f, p2: vec2f, normal: vec2f, thickness: f32, isOpen: u32, wallType: u32, allowedDir: f32, temperature: f32, conductivity: f32`) supporting up to 512 CAD walls in `GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST`.
  - Decoupled WGSL compute shader source into dedicated module `ParticleGPUComputeShader.js` (322 lines) and kept `ParticleGPUCompute.js` (282 lines), strictly under the 350-line modularity limit.
  - Added multi-substep execution per frame (`subSteps = 4`), submitting 4 synchronized ping-pong compute passes per frame in a single command buffer submission.
  - Added `readbackParticles` async method using a `MAP_READ` staging buffer for verification and telemetry inspection.
- [x] **3. Automated Chrome CDP Anti-Tunneling Verification (`test_gpu_compute_cdp.py`)**:
  - Tested 100 particles at extreme speed ($3000\text{ px/s}$, $\Delta t = 0.016\text{ s}$, displacement $48\text{ px}$) flying directly into a $4\text{ px}$ thin wall.
  - Verified 100% bounced particles ($vx < 0$, $x \le 500$) and strictly 0 tunneled particles ($x > 500$) on both GPU and CPU.
  - Verified 50,000 particle Zero-Copy simulation at stable 60 FPS.
  - All 6 stages in `tests/verify_all.py` pass 100%.

### U. Complete WebGPU Zero-Copy GPGPU Physics Architecture (Phase 2 - Full Realization)
- [x] **1. GPU Spatial Hash Grid for Particle-Particle Collisions**:
  - Implemented 2D uniform grid ($256 \times 256$ cells, $14.0\text{ px}$ cell size) spanning from $-500\text{ px}$ to $+3084\text{ px}$.
  - Atomic cell heads and linked list pointers (`atomic<i32>`, `particleNext`).
  - Compute passes: `cs_clear_grid`, `cs_build_grid`, and `cs_integrate` executed ping-pong across sub-steps in a single command buffer submission.
  - Multi-model simulation switch: Ideal Gas (100% elastic hard-sphere collisions) vs. Real Gas (Lennard-Jones 6-12 inter-atomic potential).
- [x] **2. Dominant Pairwise Elastic Impulse Solver (`bestApproach`)**:
  - Replaced multi-body impulse accumulation with dominant approaching partner momentum exchange (`approach = -vRelN`, `bestApproach`), completely eliminating multi-neighbor impulse cancellation that previously caused hexagonal close-packed (HCP) crystallization/freezing.
  - Normalized Jacobi Position Relaxation (`totalPosShift / collisionCount`, clamped to 1.5 px) cleanly separating overlapping particles without overshooting.
- [x] **3. Incremental VRAM Streaming (`appendParticles`)**:
  - Added `appendParticles(newParticles)` in `ParticleGPUCompute.js` streaming newly spawned particles directly to `byteOffset = oldCount * 32`.
  - In `Engine.js`, replaced destructive full buffer uploads on emission with incremental append, allowing Emitters and Spawners to continuously inject particles without disturbing existing GPU particle state or freezing emissions.
- [x] **4. `startPos`-Anchored Wall Continuous Collision Detection (CCD) & Fallback**:
  - Formulated analytic ray-vs-capsule boundary intersection detecting glancing/shallow-angle impacts ($80^\circ$–$89^\circ$) with 0 tunneling.
  - Anchored wall normal and proximity fallback to the timestep's starting position (`startPos`), ensuring that even under extreme multi-particle compression, particles are always repelled back into the container interior rather than expelled outside.
  - Eliminated double-reflection glitches by skipping `hitWallIdx` in the fallback pass.
- [x] **5. Verification & Scalability**:
  - Zero-Copy GPU rendering passing output buffer directly to instanced vertex pipeline at 50,000 particles.
  - 180-frame (3 seconds @ 60 FPS) confined gas stress test with 1,000 particles in a tight box: 0 tunneled, stable Maxwell-Boltzmann distribution, 0 frozen clusters.
  - All modified files strictly under 350 lines (`ParticleGPUCompute.js`: 282 lines, `ParticleGPUComputeShader.js`: 322 lines).

### V. WebGPU Physics Engine Overhaul (Mutual Best Pair Solver & 99.9998% Energy Conservation)
- [x] **1. Root Cause Resolution for Kinetic Energy Dissipation**:
  - Eliminated the asymmetric `bestApproach` solver that was violating Newton's 3rd Law ($F_{ij} \ne -F_{ji}$) on multi-particle encounters.
  - Implemented 2-stage **Mutual Best Pair Elastic Solver** (`cs_find_pairs` -> `cs_integrate`): collision impulses are applied if and only if both particles mutually choose each other as their primary approaching partner.
  - Hardware-tested on WebGPU over 300 frames (1,200 sub-steps) with 1,000 particles in a box:
    - Kinetic energy conservation: **99.9998%** ($10{,}500{,}000\text{ J} \rightarrow 10{,}499{,}978\text{ J}$).
    - Root-mean-square speed $v_\text{rms}$: rock-solid at $144.91\text{ px/s}$.
    - Mean speed $\langle v \rangle$: precisely converges to the theoretical 2D Maxwell-Boltzmann equilibrium ($\frac{\sqrt{\pi}}{2} \cdot v_\text{rms} \approx 128.42\text{ px/s}$).
    - Freezing / clustering: strictly 0 artificial freezing (residual $0.8\%$ low-velocity particles corresponds exactly to the Maxwell-Boltzmann tail).
- [x] **2. Single-Pass CCD & Piston PV Integration**:
  - Consolidated wall collisions into a clean single-pass continuous swept-ray algorithm with residual time integration.
  - Added velocity vectors to `WallData` (64 bytes aligned).
  - Integrated dynamic moving piston heads (`getGPUWalls()`) directly into the WebGPU storage buffer, allowing native $PV$ compression heating and expansion cooling on the GPU.
- [x] **3. Codebase Streamlining & Verification**:
  - Kept all files strictly under 350 lines (`ParticleGPUCompute.js`: 345 lines, `ParticleGPUComputeShader.js`: 334 lines).
  - Updated `build_all.py` standalone and bundles.
  - All 6 stages in `tests/verify_all.py` pass 100%.

### W. Unbounded GPU Spatial Hash Grid (Universal Domain Collision Architecture)
- [x] **1. Eliminated Bounded Grid Clipping Bug**:
  - Identified and solved the issue where particles with $x < -500.0\text{ px}$ ceased colliding with each other because the former spatial grid was constrained to a fixed window with hardcoded `gridOrigin = (-500, -500)`.
- [x] **2. Teschner GPU Spatial Hashing Implementation**:
  - Replaced bounded $256 \times 256$ grid with an unbounded spatial hash grid ($\text{tableSize} = 131{,}072$ buckets, $512\text{ KB}$ buffer).
  - Integer cell mapping via $c_x = \lfloor x / \text{cellSize} \rfloor, c_y = \lfloor y / \text{cellSize} \rfloor$ over the entire $(-\infty, +\infty)$ domain.
  - Teschner prime hash function in WGSL: `((bitcast<u32>(cx) * 73856093u) ^ (bitcast<u32>(cy) * 19349663u)) % tableSize`.
  - Added duplicate neighbor bucket filtering (`visitedBuckets: array<u32, 9>`) to prevent duplicate partner tests or double Lennard-Jones force accumulation.
- [x] **3. Automated Negative Space Verification**:
  - Added test in `tests/test_gpu_compute_cdp.py` verifying head-on collisions and elastic scatter at negative coordinates ($x = -1200\text{ px}$).
  - All 6 stages in `tests/verify_all.py` pass 100%. All source files strictly under 350 lines (`ParticleGPUCompute.js`: 345 lines, `ParticleGPUComputeShader.js`: 334 lines).

### X. WebGPU Telemetry & Chamber Analytics (Sensor Zones, Drift Compass & Custom Multi-Chart Dashboard)
- [x] **1. WebGPU Asynchronous Telemetry Staging (`ParticleGPUCompute.js`)**:
  - Implemented reusable persistent `telemetryStagingBuffer` and non-blocking `fetchTelemetry(sampleCap = 50000)`.
  - Maps GPU compute output to CPU memory space via `mapAsync(GPUMapMode.READ)` without stalling the WebGPU pipeline or creating GC thrashing.
  - Throttled at ~15 Hz in `main.js` animation loop, consuming $< 25\text{ MB/s}$ PCIe transfer while maintaining 60 FPS locked rendering.
- [x] **2. Global System Telemetry & Continuous History Distribution (`Engine.js`)**:
  - Implemented `updateTelemetryFromGPU(data)` computing system particle count $N$, kinetic energy $E_\text{kin}$, mean speed $\langle v \rangle$, and temperature $T = \frac{E_\text{kin}}{N \cdot k_B}$.
  - Maintained `latestSpeedSamples` buffer for live velocity histogram analysis in both CPU and GPU modes.
  - Automatically records continuous time series in `historyTime`, `historyTemp`, `historyPressure`, `historyVolume`, `historyCount`, and `historyKineticEnergy`.
  - Dispatches telemetry data to all active `SensorZone` instances.
- [x] **3. Chamber Sensor Analytics & Fluctuation Filtering (`SensorZone.js`)**:
  - Implemented `updateMeasurementsFromGPU(floats, count, scaleFactor, currentTime)` with spatial bounding filter and single-pass metrics extraction.
  - Macroscopic drift velocity exponential moving average filter ($\tau \approx 1.5\text{ s}$) compared against thermal Brownian fluctuations ($v_\text{th} / \sqrt{N}$). Clamps to 0.0 during thermodynamic equilibrium to eliminate arrow jitter.
  - Stores chamber `speedSamples` for chamber-specific Maxwell-Boltzmann velocity distributions.
- [x] **4. Drift Compass Dial Widget & Canvas Vector Overlay**:
  - **Sidebar Chamber Card**: Dynamic 32x32 SVG compass dial with cardinal ticks. In equilibrium, displays calm center equilibrium ring with "0.0 px/s (Gleichgewicht)". When macroscopic drift occurs, renders rotating directional needle ($\theta + 90^\circ$) with live speed and heading in vibrant `#22c55e`.
  - **Canvas Overlay (`Renderer.js`)**: `drawSensor` renders centered flow vector arrow scaled to drift magnitude and aligned with $\theta$.
- [x] **5. Custom Multi-Chart Dashboard & Quick Chamber Integration**:
  - Added "+ Chart" quick-add button on each chamber card header, opening `chartModal` with target pre-selected.
  - Expanded `DashboardChart` (`ChamberChart.js`) and `VelHistChart` (`VelHistChart.js`) with support for:
    - Time-series: $T(t)$, $P(t)$, $V(t)$, $N(t)$, $E_\text{kin}(t)$, $|v_\text{drift}|(t)$.
    - State & Indicator Diagrams: $P$-$V$ indicator loops, $P$-$T$ state diagrams, $T$-$s$ entropy diagrams.
    - Maxwell-Boltzmann velocity histograms $f(v)$ for the Global System or any individual Chamber.
- [x] **6. Automated Verification & Code Quality**:
  - Added Section 8 to `tests/test_gpu_compute_cdp.py` validating telemetry readback, sensor counts, temperature, pressure, macroscopic drift, and speed sample arrays.
  - 100% pass across all 6 verification stages in `tests/verify_all.py`.
  - All source files strictly comply with line limits (`ParticleGPUCompute.js`: 312 lines, `SensorZone.js`: 182 lines, `ChamberChart.js`: 260 lines, `VelHistChart.js`: 105 lines).

### Y. GPU Particle Absorber (Sink) & Real-Time Drift Telemetry Charts
- [x] **1. WebGPU Particle Absorber (Sink) in Compute Shader (`ParticleGPUComputeShader.js` & `ParticleGPUCompute.js`)**:
  - Implemented `struct SinkData { minPos, maxPos, isActive, direction, tempFilterMode, filterTemperature, pad1, pad2 }` in WGSL with 48-byte 8-byte alignment.
  - Added storage buffer binding `@group(0) @binding(7) var<storage, read> sinks: array<SinkData>;` and uniform `sinkCount: u32`.
  - In compute shader `cs_integrate`: added sink collision and absorption checking directional filters (right/left/down/up/360) and thermal filters (above/below setpoint).
  - Absorbed particles are immediately retired (`pos = (-99999, -99999)`, `vel = (0, 0)`, `radius = 0.0`), immediately bypassing the spatial hash grid and collision pairs (`cs_build_grid`, `cs_find_pairs`).
  - Added vertex shader culling in `ParticleGPURenderer.js` (`radius <= 0.0 || pos.x < -50000.0 -> vec4f(2.0, 2.0, 2.0, 1.0)`).
- [x] **2. GPU Buffer Compaction & Particle Count Synchronization (`Engine.js`)**:
  - `updateTelemetryFromGPU`: Filters dead particles, attributes absorbed count to active sinks, and executes in-place compaction.
  - Calls `gpuCompute.uploadRawParticleBuffer(compactedFloats, liveCount)` and synchronizes `engine.particles.length = liveCount` and `engine.stats.particleCount = liveCount`.
- [x] **3. Global Drift Velocity & Time-Series History (`Engine.js` & `ChamberChart.js`)**:
  - Added continuous macroscopic drift calculation across live particles: $|v_\text{drift}| = \sqrt{(\sum v_x / N)^2 + (\sum v_y / N)^2}$ and recorded into `engine.historyDrift`.
  - Fixed "Collecting data..." freeze in `DashboardChart`:
    - Linked `metric === 'drift'` for global target directly to `engine.historyDrift`.
    - Implemented immediate 1-point and 0-point baseline extrapolation across `[t, t + 1.0]` for all time-series and state diagrams, guaranteeing graphs render live data immediately even when paused or at $t = 0$.
    - Added particle speed sample fallback in velocity histograms on frame 0.
- [x] **4. Absorber Deletion GPU Synchronization & Minus Symbol (`ParticleGPUCompute.js`, `Engine.js`, `Renderer.js`, `index.html`)**:
  - **Deletion Synchronization**: Fixed ghost absorption by removing `sinks.length > 0` condition in `Engine.step()` and making `syncSinksToGPU()` unconditional. `uploadSinks` now explicitly zeroes out the first sink slot in GPU buffer when `count === 0` and sets `this.sinkCount = 0`. Also added immediate GPU sync on `deleteSelectedItems()`, `Engine.clear()`, `_applyState()`, `Engine.addSink()`, and `deleteParticles()`.
  - **Minus Symbol (`Renderer.js` & `index.html`)**: Replaced vertical cross-hair stroke in 360 mode (`(+)`) with a clean minus sign inside the circle (`(-)`) so the absorber clearly denotes removal/subtraction of particles rather than addition. Updated ribbon toolbar icon SVG to match.
- [x] **5. Comprehensive Automated Verification**:
  - Added automated tests in `tests/test_gpu_compute_cdp.py` validating GPU sink absorption (25 inside particles absorbed, 15 outside particles preserved), GPU buffer compaction, immediate non-absorption upon sink deletion (10/10 particles survive in the same area), global drift history recording, and drift chart rendering.
  - 100% pass across all 6 verification stages in `tests/verify_all.py`.

### Z. Dynamische Sensor-Chamber Kolbenbindung & P-V-Arbeitsberechnung (Thermodynamische Kreisprozess-Auswertung)
- [x] **1. Sensor-Chamber Piston Binding Geometrie & Datenstruktur (`SensorZone.js`)**:
  - `pistonBinding` Datenstruktur implementiert (`pistonId`, `edge: 'right' | 'left' | 'top' | 'bottom'`, `lockCrossDimension`, `fixedOpposite`).
  - Methoden `bindToPiston(piston, edge, lockCrossDimension)`, `unbindPiston()` und `updateBoundsFromPiston(piston)`.
  - Dynamische Anpassung von Kammerbreite/-höhe und Live-Volumen $V(t) = \text{width} \cdot \text{height}$ an die Kolbenfläche mit Minimum-Clearance-Clamping ($15\,\text{px}$).
  - Vollständige Serialisierung in `toJSON()` und Deserialisierung in `fromJSON()`.
- [x] **2. Simulation-Loop & GPU-Synchronisation (`Engine.js`)**:
  - `getPistonById(id)` Lookup-Helper hinzugefügt.
  - `updateBoundSensors()` synchronisiert die Geometrie aller gebundenen Kammern unmittelbar nach Kolbenbewegungen im CPU-Substep-Zweig, im WebGPU-Compute-Zweig und vor der Weiterleitung der GPU-Telemetrie (`readGPUBufferTelemetry`).
- [x] **3. Thermodynamische Kreisprozess-Arbeit ($W = -\int P \, dV$) & Indikatordiagramm (`ChamberChart.js`)**:
  - Trapezförmige numerische Integration der mechanischen Volumenarbeit $W = -\sum_{i=1}^{N-1} \frac{P_i + P_{i-1}}{2} (V_i - V_{i-1})$ im $P$-$V$-Diagramm.
  - Dynamischer Arbeits-Badge oben rechts im Chart ($W = \pm\text{X.X J}$ / $\text{mJ}$ / $\text{kJ}$) mit Farbcodierung (Grün für abgegebene Netto-Arbeit, Blau für Kompression).
  - Live-Zustandspunkt $(V(t), P(t))$ mit pulsierender Markierung auf der $P$-$V$-Kurve sowie Volumen-Achsenbeschriftung ($V_\text{min}$, $V_\text{max}$).
- [x] **4. Visuelle Indikatoren auf dem Canvas (`Renderer.js`)**:
  - Leuchtende Akzentlinie entlang der gekoppelten Kante bündig an der Kolbenfläche (`shadowBlur = 10`, `lineWidth = 3.5`).
  - Koppel-Symbol (`🔗`) im Kammer-Header-Label (`Kammer A 🔗 [300 K]`).
- [x] **5. Interaktives Einrasten & UI-Inspektor (`main.js`)**:
  - Chamber-Popup mit „Piston Binding“-Dropdown, Kanten-/Flächen-Auswahl, Checkbox „Lock Span to Piston“ und „Snap Now“-Aktion.
  - Interaktives Einrasten (`findPistonSnap`) beim Zeichnen neuer Kammern oder beim Ziehen von Griffen/Verschieben auf dem Canvas ($\sim 20\,\text{px}$ Fangradius).
  - Dynamische Aktualisierung der Gegenkante (`fixedOpposite`) beim Resizen der festen Seite.
  - Sauberes Entkoppeln beim Löschen von Kolben in `deleteSelectedItems()`.
- [x] **6. Automatische Verifikation (`tests/test_gpu_compute_cdp.py`)**:
  - Abschnitt 11 verifiziert motorisierte Kolbenoszillation, synchrone Kantenverfolgung (`widthFollowedPiston: true`), dynamische Volumenänderung (`volumeChanged: true`), Entkopplung (`isUnbound: true`) und $P$-$V$-Chart-Rendering.
  - 100% Erfolgsquote über alle 6 Verifikationsstufen in `tests/verify_all.py`.

### AA. GPU als Quelle der Wahrheit & GPU-Telemetrie-Reduktion (Claude Code, Schritt 1 des Optimierungsplans)
- [x] **Architektur**: Während einer GPU-Simulation ist der Ping-Pong-Partikelpuffer die einzige Quelle der Wahrheit. `engine.particles` hält nur noch den Edit-/Startzustand. Emitter- und Regler-Partikel gehen über `Engine.addParticle()` → `gpuCompute.queueParticle()` direkt in eine Append-Queue (Flag `_deferToGPU` während `step()`). Der CPU-Fallback bei `gpuCompute.count === 0` entfällt.
- [x] **Telemetrie-Reduktion auf der GPU** (`cs_telemetry`): Workgroup-Atomics → 64-bit-Festkomma-Akkumulatoren (lo/hi-u32) für global + bis zu 16 Kammern (N, E_kin, Σv, Σm·v, Σm, Σ|v|, 64-Bin-Geschwindigkeitshistogramm) und bis zu 16 Regler-Zonenzählungen. Readback ≈ 18 KB statt 1,6 MB; exakt für alle Partikel statt Stichprobe der ersten 50.000. Layout-Konstanten zentral in `GPU_LAYOUT` (`ParticleGPUComputeShader.js`).
- [x] **Wand-/Kolben-Ereigniszähler** im Integrate-Kernel (`wallBounce()` → Impuls + Wärme pro GPU-Wand). `Engine._applyGPUEventRates()` speist die gemessenen Raten in `Wall.accumulatedImpulse`/`addHeat()` und `Piston.accumulatedImpulseLeft/Right` ein → **freie/Feder-/Dämpferkolben, Überdruckventile und leitende Wände funktionieren jetzt im GPU-Modus** (vorher wirkungslos). Wand-Wand- und Reservoir-Wand-Kopplung laufen jetzt in beiden Modi (`_updateComponents()`).
- [x] **Absorber & Regler atomar auf der GPU**: kumulative Absorptionszähler pro Sink inkl. `maxParticles`-Limit; Regler-Entnahme über per-Frame-Quoten. Regler zählen im GPU-Modus über `gpuCount + gpuDelta` statt über veraltete CPU-Positionen (vorher: Vollupload alter Positionen → Gas sprang zurück).
- [x] **GPU-Kompaktierung** (`cs_compact` + `cs_compact_tail`), ausgelöst ab ≥ max(32, 5 %) toten Slots; Appends werden während einer laufenden Kompaktierung zurückgehalten. Ersetzt das fehlerhafte Zurückschreiben veralteter Readbacks (Zeitsprung, verlorene Emitter-Partikel, Doppelzählung bei > 50k).
- [x] **Epoch-Mechanismus**: Readbacks aus einem früheren Partikelsatz (Upload, Reset, History-Restore, Wand-Topologie) werden verworfen.
- [x] **Step-Back im GPU-Modus** über GPU-seitige Puffer-Snapshots (`captureHistory`/`restoreHistory`, ≤ 16.384 Partikel) statt veralteter CPU-Positionen.
- [x] **Kleinere Fixes**: Offenes bidirektionales PRV auf der GPU wie offenes Ventil; Einwegventile respektieren Flussrichtung auch im Proximity-Pass; alle Substeps in einem Compute-Pass; Wanddaten-Puffer wiederverwendet; Shader-Kompilierfehler werden geloggt; Renderer zeichnet im GPU-Modus nie mehr veraltete CPU-Partikel.
- [x] **Tests**: `tests/test_gpu_compute_cdp.py` auf `engine.awaitGPUTelemetry()` umgestellt, neuer Abschnitt 12 (freier Kolben, PRV, Regler füllen/leeren, Kompaktierung, Step-Back). Alle Assertions grün; Smoke-Test aller 6 Presets ohne Konsolenfehler.
- **Bekannt, vorbestehend**: Motorisierte Kolben pumpen massiv Energie ins Gas (Adiabatic-Cylinder-Preset erreicht > 10⁵ K nach 3 s; auf dem Stand vor diesem Umbau sogar > 10⁶ K).

---

### AB. Alle Elemente auf der GPU, Kolben-Fixes & stabiler Wärmeaustausch (Claude Code, Schritt 2)
- [x] **Drosselventil, Reservoir, Thermoblock auf der GPU**: `getGPUWalls()` erzeugt Segmente (Drossel-Flügel; 4 Kanten je Rechteck, Dicke 0) mit Owner-Tabelle `_gpuWallOwners` statt Index-Arithmetik. Wandereignisse zählen den Impuls pro Seite (Vorder-/Rückseite) → ΔP der Drossel funktioniert. Inaktive/degenerierte Flügel werden als offenes Ventil markiert (`disabled`).
- [x] **Wärmetauscher & Regenerator auf der GPU** als permeable „thermische Zonen“ (volumetrische Relaxation pro Substep, Regenerator mit Wärmezählern pro Schicht). Dafür `particleNext` + `bestPartners` zu `gridLinks` zusammengelegt (Limit 8 Storage-Buffer pro Pipeline).
- [x] **Motorisierter Kolben teleportierte** beim Start/Reset/Moduswechsel auf seine Sinusbahn (z. B. 120 px in einem Frame ≈ 7.500 px/s) und schoss Teilchen auf > 12.000 px/s. Jetzt Annäherung mit max. Spitzengeschwindigkeit (`Piston.update`, CPU + GPU).
- [x] **Teilchen rutschten durch schnelle Kolbenflächen** (GPU): Flächen wurden an der End-Position hochgeladen und sprangen im 1. Substep. Jetzt Upload an der Frame-Start-Position + Mitführen per `vel · subDt` (`cs_advance_substep`, `SUBSTEP_IDX`). Leckage Adiabatic-Preset: 57 → 0–2 Teilchen.
- [x] **Physikfehler Wandthermalisierung** (vorbestehend, CPU + GPU): Wandtreffer setzten die Energie auf kB·T, der auftreffende Fluss hat in 2D aber 1,5·kB·T → Gas in Kontakt mit einer Wand stellte sich auf T_Wand / 1,5 ein (300-K-Wand kühlte auf 200 K). Jetzt Ziel 1,5·kB·T für alle Oberflächenkontakte.
- [x] **Instabiler expliziter Wärmeaustausch** (vorbestehend): kleine Wärmekapazitäten schwangen über und erzeugten an der 5-K-Untergrenze Energie aus dem Nichts (Divergenz bis 10⁶ K). Jetzt implizites Update `T += Q/(C+G)` mit Kopplungsleitwert G (Wall, ThrottleValve, ThermalBlock, Piston, Regenerator-Schichten); auf der GPU werden gemessene Impulse und Wärme über Pending-Puffer exakt einmal gutgeschrieben (Energie- und Impulserhaltung trotz Readback-Latenz; GPU ≈ CPU: Block E/E₀ 0,99, freier Kolben 343 vs. 338 px). Kolbenflächen-Wärme wird jetzt dem Kolben gutgeschrieben.
- [x] **Tests**: Abschnitt 13 (Drossel dicht/offen + ΔP, Reservoir heizt + undurchdringlich, Block nimmt Wärme auf + undurchdringlich, Wärmetauscher, Regenerator, Kolben ohne Teleport/Leckage). `test_webgpu_runtime.py`: Wartezeit 6 → 15 s (Flake nach schwerem GPU-Test).
- **Bekannt**: Das Adiabatic-Cylinder-Preset fährt den Kolben mit ~Mach 6 (877 vs. 145 px/s) → starke, physikalisch reale Stoßerwärmung (CPU ≈ GPU). Regenerator-Mittel schwingt in beiden Pfaden leicht über die Gastemperatur (≈ 1.000 K bei 800 K Gas) — Ursache noch offen.

---

### AC. WebGPU-Performance (Claude Code, Schritt 3)
- [x] **Benchmark** `tests/bench_gpu.py` (headless Chrome, Durchsatz ms/Frame bei 4 Substeps; nicht Teil von verify_all).
- [x] **Zellsortiertes Gitter** statt verketteter Hash-Listen: Zählen → Präfixsumme (Blöcke à 1024 + Blocksummen) → Scatter in Bucket-Reihenfolge (tote Teilchen ans Ende). Tabellengröße dynamisch (nächste Zweierpotenz ≥ 2·N).
- [x] **Räumlich kohärenter Zellschlüssel** (umklappende Zeilen-Tabelle) statt streuendem Hash → Nachbarzellen liegen im Speicher nebeneinander (Pair-Suche war vorher 12,8 ms/Dispatch bei 1 Mio.).
- [x] **Wand-Broadphase**: statische Wände im CPU-Gitter (nur bei Geometrieänderung neu gebaut), dynamische Segmente global, Rückfall auf alle Wände bei großer Reichweite. Wandlisten + Regenerator-Temperaturen in gemeinsamem `aux`-Puffer (Limit 8 Storage-Buffer).
- [x] **Mehrfach-Abprall-CCD** (bis 3 Treffer pro Substep): schnelle Teilchen tunnelten vorher an Ecken kleiner geschlossener Hindernisse (66 → 0).
- [x] **Substeps pro 1/60 s Simulationszeit** (`_subStepsFor`): konstante Substep-Länge unabhängig von Bildrate und Zeitraffer.
- **Ergebnis (AMD RDNA 3, ms/Frame):** 50k: 2,4 → 1,9 · 200k: 28,5 → 6,2 · **1 Mio.: 821 → 27 (30×)** · 200k + 484 Wandsegmente: 46 → 6,1.
- [x] **Tests**: Abschnitt 14 (100 geschlossene Pfeiler, Gas + schneller Strom: 0 Durchdringungen, Gitter aktiv).

### AD. Aufräumen: Module, Konstanten, main.js aufgeteilt (Claude Code, Schritt 4)
- [x] **Dev-Modus `index.html?dev`**: lädt `src/main.js` direkt als ES-Modul (strict mode, kein Build nötig). Standard bleibt `bundle.js`; der Build ersetzt den Loader-Block im Standalone-HTML durch das inlined Bundle.
- [x] **`tools/js_modules.py`**: statische Import/Export-Analyse. `build_all.py` leitet die Dateireihenfolge daraus ab (keine `files_order`-Liste mehr) und bricht ab bei fehlenden Imports, impliziten Globals, Zuweisungen an importierte Bindings, doppelten Top-Level-Namen und nicht erreichbaren Dateien. Gefunden: `SequencerExecutor` nutzte `SequencerConditions` ohne Import. Strip-Regexe sind jetzt zeilenverankert.
- [x] **`src/physics/Constants.js`**: `KB` (vorher 19× `const kB = 35.0`, auch im WGSL per Template), `WORLD_SIZE`, `idealGasPressure()`. Globaler Druck nutzt jetzt dieselbe Formel wie Sensorzonen (`engine.stats.pressure/volume`); vorher war er mit einer abweichenden Skalierung (Faktor 250) gerechnet.
- [x] **`main.js` (4,6k Zeilen) → `src/app/*` (17 Module)** + schlanker Einstieg (~85 Zeilen). Geteilter veränderlicher Zustand liegt auf `app`/`pointer` (`src/app/state.js`, `window.app` für Tests).
- [x] **Tote Dateien entfernt**: `MaxwellBoltzmann.js`, `StateDiagrams.js`, `Regenerator.js`, `ThermalNode.js` (nie gebündelt/importiert). Veraltete `src/ui/...`-Verweise in `TOOL_CATALOG.md` korrigiert.
- [x] **Tests**: `tests/test_ui_smoke_cdp.py` (in verify_all) läuft gegen Bundle, Dev-Modus und Standalone-HTML: alle Werkzeuge, Zeichnen aller Elementtypen mit echten Maus-Events, Auswahl/Popup/Kontextmenü, Entf + Undo/Redo, Ansicht-Menü, Wiedergabe; schlägt bei jeder Exception/Konsolenfehler fehl.

### AE. Fix: Gas heizt sich in Box aus leitfähigen Wänden auf (GPU)
- [x] **Ursache**: Readback-Latenz (2–3 Frames) × kleine Wärmekapazität (Wand C = 80 J/K ≈ 2 Teilchen): Die GPU stieß gegen veraltete Wandtemperaturen, die Wände schossen jedes Frame über (5 K ↔ 10⁵ K), und der 5-K-Boden erzeugte bei jedem Ausschlag Energie. Gemessen: Gas 300 K → ≈ 200.000 K in 20 s; CPU-Pfad stabil.
- [x] **Thermische Körper auf der GPU**: pro Element mit endlicher Kapazität ein Zähler für noch nicht quittierte Wärme; die GPU rechnet mit `T + Q_offen / C`, die CPU verbucht die Wärme einmal exakt und quittiert dieselben Festkomma-Einheiten (`cs_ack_bodies`). Leitwert-Zähler und Wärme-Verteilpuffer entfallen.
- [x] **Implizit pro Stoß** (`α / (1 + α·1,5·kB/C)`) gegen Überschwingen innerhalb eines Substeps; **5-K-Boden ohne Energieerzeugung** (Defizit bleibt als Wärmeschuld stehen, wird mit hochgeladen).
- [x] **Ergebnis**: Box mit C = 80: 300 K stabil, Energiedrift 0,003 %; Extremfall C = 10, Leitfähigkeit 1: 305 K stabil. Kein messbarer Performance-Unterschied.
- [x] **Tests**: Abschnitt 15 in `test_gpu_compute_cdp.py` (GPU + CPU, Readbacks nur alle 4 Frames wie in der App; auf dem alten Code: 218.000 K → rot). UI-Smoke-Test nutzt einen Server mit Threads (sporadische Fetch-Fehler im Dev-Modus).

### AF. UI-Polish Phase 1: Ribbon, Menüs, View (Claude Code, siehe `UI_POLISH_PLAN.md`)
- [x] **Ribbon Zeile 1 neu gruppiert**: HISTORY (Undo, Redo | Revert, Clear) · TOOLS · TRANSFORM · GRID · VIEW. Grid und View sind getrennt; die ACTIONS-Gruppe entfällt.
- [x] **Geschwindigkeitsvektoren im WebGPU-Modus**: Vorher wurden sie nie gezeichnet, weil das 2D-Overlay nur im Nicht-GPU-Zweig lief und `isGPUSimulating()` auch im Edit-Modus true ist. Jetzt gibt es einen eigenen Instanced-Pass (`vs_vector`, 9 Vertices/Partikel: Schaft + Spitze) direkt aus dem Compute-Puffer, zero-copy. Die Auswahl-Hervorhebung einzelner Partikel wird im Edit-Modus wieder gezeichnet.
- [x] **Zoom to Fit** (`fitViewToScene`, Taste `F`, Zoom-Panel-Button, View-Menü) passt die Szene in den Bereich, den Header, Sidebars und Dock frei lassen. Das passiert automatisch beim Öffnen von Presets, Recent-Einträgen und Dateien.
- [x] **Einheitliches Laden** über `openScene()`: Presets, Recent und Datei-Import teilen sich einen Pfad. Beim Datei-Import wurde der Sequencer vorher nicht neu gerendert.
- [x] **Menüs**:
  - *File*: New Canvas, Open, Examples & Recent (Splash), Save (direkt), Save As, Export Image (PNG des sichtbaren Bereichs inkl. GPU-Partikel), Revert to Saved.
  - *Edit*: Undo/Redo, Select All, Duplicate, Group/Ungroup, Rotate/Flip, Delete.
  - *View*: Grid/Snap, Vectors, Color, Zoom In/Out/Fit.
  - *Simulation* (neu): Play/Pause, Step, Step Back, Stop, Modell, Gravity, Sequencer.
  - *Help*: Guide, Keyboard Shortcuts (neuer Dialog; der Eintrag hatte vorher keinen Handler).
  - Häkchen-Spalte und deaktivierte Einträge je nach Zustand.
- [x] **Shortcuts**: Ctrl+S speichert direkt, Ctrl+Shift+S = Save As, Ctrl+A, Ctrl+G / Ctrl+Shift+G (war im Tooltip angekündigt, fehlte), Ctrl+Alt+N, R, V, F, +/−, ?. Außerdem sind Shortcuts im Splash und in Textareas jetzt inaktiv.
- [x] **Responsive Ribbon** (`ribbonLayout.js`): Läuft eine Zeile über, werden die Tool-Buttons icon-only (Tooltip bleibt); sonst scrollt das Mausrad horizontal.
- [x] **Bugfixes**:
  - Undo/Redo überschrieb den „geladenen“ Stand (`importState` ohne `updateProfile=false`), dadurch setzte Reset auf einen Undo-Zwischenstand zurück.
  - Revert und Clear sind jetzt per Undo rückgängig machbar; Revert hatte vorher den Undo-Stack gelöscht.
  - Enter zum Schließen einer Polylinie warf einen `ReferenceError` (`polygonWalls`).
  - Löschen per Kontextmenü legte zwei Undo-Einträge an.
  - Speichern während einer Simulation speichert den Aufbau (Start-Snapshot) statt eines Mischzustands.
- [x] **Tests**: Der UI-Smoke-Test prüft zusätzlich Ctrl+A/G/Shift+G, alle View-/Simulation-Menüeinträge, den Shortcut-Dialog, `F` sowie die Undo-Fähigkeit von New Canvas und Revert.

### AG. UI-Polish Phase 2: Canvas-Interaktion, Formen, Bemaßung (Claude Code)
- [x] **Transformationsrahmen** (`src/app/transform.js`):
  - Skalieren über 8 Griffe oder die Rahmenkanten (Shift proportional, Alt vom Zentrum, Grid-Snap).
  - Drehen über den Griff oder die Ecken (15°-Raster, Shift frei). Achsparallele Elemente drehen in 90°-Schritten; Kolbenhub, Orientierung und Richtungen werden mitgedreht.
  - Die Geometrie wird immer aus dem Snapshot beim Drag-Start berechnet, damit sich keine Rundungsfehler aufaddieren.
- [x] **Zusammenhängende Wandformen**: Ecken-Drag bewegt alle Segment-Enden derselben Gruppe am Punkt (`getLinkedEndpoints`); `Ctrl` löst ein Ende; Shift rastet den Winkel eines Endpunkts in 15°-Schritten.
- [x] **Werkzeug-Modi**: Griffe und Vertices nur mit dem Select-Tool. Vorher griff z. B. der Spawner die Ecke eines Rechtecks und zerstörte die Form.
- [x] **Bemaßung** (`src/app/dimensions.js`):
  - Live-Maße für jedes Werkzeug.
  - Klick-Klick-Zeichnen; die Erzeugung liegt jetzt in `createFromDrag()`.
  - Zahleneingabe beim Zeichnen.
  - Klickbare Maß-Labels an Auswahlrahmen und einzelnen Wänden zum exakten Setzen.
- [x] **Hover-Hervorhebung** und Cursor je Aktion.
- [x] **Duplizieren** generisch (`Engine.cloneElement`/`addElement`): Gruppen, Kolben, Texte, Spawner inkl. Partikel, Sensor-Bindungen an kopierte Kolben.
- [x] **Bugfixes**:
  - `ReferenceError` beim Schließen einer Polylinie per Klick auf den Startpunkt und bei Shift+Klick zum Erweitern der Auswahl.
  - Z-Reihenfolge ging bei Undo/Laden verloren (neu: `elementOrder`).
  - `rotateSelection90` behandelte Kolben-Mittelpunkte wie linke obere Ecken; ersetzt durch die Rahmen-Rotation.
  - Zoom to Fit bei noch nicht ausgelegtem Canvas.
- [x] **Tests**: Der UI-Smoke-Test prüft Ecken-Drag (Form bleibt geschlossen), Rahmen-Resize, Rotation, den Spawner auf einer Ecke und Klick-Klick mit getippter Größe.

### AH. UI-Polish Phase 3: Eigenschafts-Schema, Eigenschaften-Panel, Element-Baum (Claude Code)
- [x] **`src/model/elementSchema.js`**: eine Definition pro Elementtyp (Label, Einheit, Bereich, Default, bedingte Sichtbarkeit, Setter, Kontext Tool / Panel / Sequencer). Bereiche vereinheitlicht: Temperaturen in 10-K-Schritten, Raten bis 60/s.
- [x] **`src/app/propertyForm.js`** rendert das Schema überall gleich: Slider + Zahl, Segment-Buttons, Richtungen, Schalter, Default-Markierung, Markierung für geänderte Felder, ↺-Reset.
- [x] **Eigenschaften-Panel** unter dem Baum (ersetzt die Akkordeons):
  - Mehrfachauswahl gleichen Typs wird gemeinsam bearbeitet (z. B. alle Segmente einer Form).
  - Geometriefelder (X/Y/B/H bzw. Länge/Winkel), Live-Info, Kolben-Bindung von Sensoren, Aktionen.
  - Änderungen sind per Undo rückgängig machbar (`recordUndoState(false)` beim Bearbeitungsbeginn, ohne das Panel neu zu bauen).
- [x] **Tool-Dialog** aus demselben Schema. `toolConfigs` wird aus den Schema-Defaults abgeleitet. Der Dialog ändert nur die Vorgaben, nicht mehr die Auswahl. `createFromDrag` übergibt alle Tool-Werte.
- [x] **Sequencer** (`SequencerActions.js`): Formular, Defaults und Ausführung kommen aus dem Schema; `normalizeAction` übersetzt alte gespeicherte Aktionen. Kolben: Befehl (TDC/BDC/Halten/Freigeben) plus Modus. Behobene Fehler, die schon vorher bestanden:
  - Ventil-Aktionen wurden nie ausgeführt.
  - Rückschlag-Richtung, PRV-Hysterese und 1-/2-Wege-Modus gingen auf falsche Schlüssel.
  - Der Absorber-Filter `hot`/`cold` wurde ignoriert.
  - Die Regenerator-Achse landete in `axis`.
  - `SequencerFieldControls.js` und `SequencerCatalogDefaults.js` entfernt.
- [x] **Element-Baum**:
  - Formen und Gruppen aufklappbar, Icons aus dem Ribbon, Namen (Doppelklick zum Umbenennen, gespeichert als `elementNames`/`groupNames`), Live-Werte.
  - Filter, Hover hebt das Element im Canvas hervor, Shift/Ctrl-Mehrfachauswahl, Ebenen per Drag & Drop.
  - Namen erscheinen auch im Panel, am Auswahlrahmen und im Sequencer.
- [x] **Begriffe**: „Heat Bath“ (konstantes T, vorher „Sink“), „Thermal Mass“ (endliches C, vorher „Ressavoir“).
- [x] **Toter Code entfernt**: Element-Popup (`popup.js`, HTML, CSS).
- [x] **Tests**: Der Sequencer-Test prüft das neue Formular und die Ausführung alter Aktionen. Der UI-Smoke-Test prüft Umbenennen im Baum sowie Bearbeiten und Undo im Panel.

### AI. UI-Polish Phase 4: Charts (Claude Code)
- [x] **`HistoryBuffer.js`**: kompletter Verlauf statt rollendem 600-Sample-Fenster (~27 s). Die letzten 900 Samples bleiben in voller Auflösung; ältere werden in gleichmäßige, sich verdoppelnde Zeit-Buckets zusammengefasst. Jedes Sample trägt `historyCycle`. Keine Aufzeichnung vor dem ersten Schritt: Vorher landete nach einem Reset ein Nullsample (T = 0, N = 0) im Verlauf und staucht die Achse.
- [x] **`ChartView.js`**: eine Komponente für alle Charts:
  - Zeitreihen, P-V/P-T/T-s und Histogramm.
  - Achsen mit Einheiten, Legende, Hover-Tooltip, Min/Max-Dezimierung, HiDPI.
  - P-V-Zyklen farblich abgestuft, mit Arbeit pro Zyklus (W = ∮P dV / PRESSURE_SCALE).
  - Ersetzt `TempTimeChart.js`, `VelHistChart.js` und `ChamberChart.js`. `DashboardChart.js` bleibt als dünne Hülle für `window.DashboardChart`.
- [x] **`chartViewer.js`**: großer Chart-Dialog mit Metrik/Quelle, Bereichen, Zoom/Pan, PNG/CSV. Vergrößern-Knöpfe an allen Sidebar-Charts.
- [x] **Datenexport**: File → Export Data (CSV, Long-Format; JSON).
- [x] **Farben**: Palette mit dem Dataviz-Validator geprüft (dunkle Fläche #12141a: Helligkeitsband, CVD ΔE ≥ 8,4, Kontrast ≥ 3:1). Neue Sensoren bekommen der Reihe nach eigene Farben statt alle Hellblau.
- [x] **Tests**: Der UI-Smoke-Test öffnet den Dialog mit allen 10 Metriken, zoomt, wechselt den Bereich und fügt einen Custom Chart hinzu.

### AJ. UI-Polish Phase 5: Sequencer an echten Kreisprozessen (Claude Code)
- [x] **Erprobung**: Carnot-artig, Otto und Alpha-Stirling selbst gebaut und durchgemessen. Die Lücken stehen in `UI_POLISH_PLAN.md`, Phase 5.
- [x] **Kolben-Hubpositionen**: Befehl `drive_to` mit `strokeTarget` (0 % = TDC, 100 % = BDC). Bedingung `piston` mit `pistonTarget` `step` (Fahrziel des Schritts) / `tdc` / `bdc` / `above` / `below` (+ `strokePos`). „Erreicht“ heißt angekommen (0,5 px statt 3,5 px), damit sich Zyklen exakt schließen.
- [x] **TDC/BDC nach Gasseite** (`strokeEnds` in `SequencerConditions.js`): Ist eine Messkammer mit der Kante `left`/`top` an den Kolben gebunden, liegt das Gas auf der großen Koordinate, und TDC/BDC tauschen.
- [x] **Kammer zwischen zwei Kolben**: `SensorZone.pistonBinding2` (gegenüberliegende Kante); `updateBoundsFromPistons()` statt `fixedOpposite`. Im Properties Panel als „Piston on Opposite Edge“.
- [x] **Kolbendruck** `facePressure`: Die Kolben summieren den Impuls pro Fläche mit Sim-Zeitstempel (GPU: direkt aus der Readback, nicht aus den verzögert verteilten Pending-Puffern). Die Kammer mittelt über 0,3 s und schreibt den Wert in den Messpunkt der Fenstermitte, sonst hinkt er dem Volumen nach und verfälscht die Arbeit jedes Hubs. Neue History-Spalten `historyFacePressure` und `historyStep`; Metriken `facePressure` und `pv_piston`.
  - Adiabatischer Test (GPU): Kompression mit 40 px/s, ΔE = +3,21 M, ∫P_Kolben dV = −3,17 M (1 %), ∫P_Kammer dV = −2,16 M.
  - Auch in Ruhe liegt der Kolbendruck ~16 % über dem Kammerdruck: Die Kammer rechnet mit der vollen Fläche, Teilchenmittelpunkte erreichen aber nur die um Radius und halbe Wandstärke kleinere Fläche (~12 %), dazu ~4 % Nicht-Idealität harter Scheiben. Der Kolbendruck ist der mechanische Druck.
- [x] **CPU-Bugfix**: Horizontale Kolben reflektierten mit endlicher Kolbenmasse (m = 30). Das kostete pro Treffer ~12 % der Relativenergie, das Gas kühlte beim Zyklieren ab. Jetzt elastisch im Kolbensystem wie auf der GPU und bei vertikalen Kolben; Energiebilanz exakt (W_Kraft = −903,3 k bei ΔE = +903,4 k).
- [x] **Übergangsdialog** (`SequencerTransitionBuilder.js`, neu `SequencerConditionFields.js`): Bedingungen über die gemeinsame Property-Form (`renderPropertyForm` nimmt jetzt auch Feldlisten), Elementnamen, Zusammenfassungen wie „Cold piston at target“ oder „Working gas: T ≥ 600 K“. Sicherheitszeitlimit standardmäßig aus (0). Toter Code `formatActionPropsHTML` entfernt, doppeltes `reset()` in `CycleSequencer` entfernt.
- [x] **Charts**: nummerierte Schritt-Marken in Zustandsdiagrammen, Schrittname im Tooltip, CSV mit `piston_pressure_Pa` und `step`.
- [x] **Splash**: `hideSplashScreen` setzt `engine.ambientBounds` zurück (sonst wickelte ein manuell gesteppter Engine die Teilchen um das alte Sichtfeld).
- [x] **Test** `tests/test_sequencer_cycles_cdp.py`:
  - Alpha-Stirling über 3 Zyklen: Zyklus geschlossen, TDC nach Gasseite, Volumen in den isochoren Schritten konstant, Kammer folgt beiden Kolben, Schritt in jedem Messpunkt.
  - Adiabatische Energiebilanz des Kolbendrucks.

### AK. UI-Polish Phase 6: Start, Beispiele, Autosave, Feinschliff (Claude Code)
- [x] **Beispiele** (`src/presets/index.js`, `Examples` + `loadExample`, auch `window.Examples`/`window.loadExample`): Die Gemini-Presets sind ersetzt durch acht selbst gebaute Szenen. Jede zeigt eine Idee, und `tests/test_examples_cdp.py` prüft sie:
  - Maxwell-Boltzmann-Relaxation: relative Streuung der Geschwindigkeiten 0 → 0,54 (Theorie 0,52).
  - Temperaturausgleich ohne Durchmischung: 600 K / 150 K → 377 / 384 K.
  - Freie Expansion: Energie auf 10⁻⁵ erhalten, nach dem Schwappen wieder die Starttemperatur.
  - Barometrische Schichtung: 225 / 121 / 54 Teilchen von unten nach oben.
  - Adiabatische Erwärmung.
  - Carnot, Otto, Stirling mit positiver Arbeit pro Zyklus über 7 Zyklen stabil: Carnot ≈ 1,8 M, Otto 0,26–0,67 M, Stirling 0,14–0,24 M.
- [x] **Erste Fassungen von Carnot und Otto leisteten negative Arbeit**: Der Wärmetauscher am Zylinderende (76 px) konnte die Kompressionswärme nicht abführen, das Gas stieg Zyklus für Zyklus auf ~3700 K. Jetzt füllt der Wärmetauscher den Zylinder. Die Carnot-Hubpunkte folgen aus V1·V3 = V2·V4, die Adiabaten enden zusätzlich bei der Gegentemperatur. Die Otto-Flamme hat 2000 K.
- [x] **Startbildschirm**: Beispiel-Kacheln und Recent-Liste mit Vorschaubildern (`sceneThumbnail.js` zeichnet sie aus dem Szenenzustand), „Continue“ aus dem Autosave, Footer-Hinweis korrigiert (Esc öffnet den Startbildschirm nicht).
- [x] **Autosave** (`autosave.js`): alle 4 s bei Änderung, bei `pagehide` und beim Verbergen der Seite; beim Simulieren der Szenenstand vom Start. Ein leerer Canvas überschreibt die gesicherte Szene nicht.
- [x] **`engine.resetScene()`**: „New Simulation“ und „New Canvas“ übernahmen bisher Sequencer und Schwerkraft der vorherigen Szene.
- [x] **Leerer Canvas** (`canvasHint.js`): Hinweis und Knopf „Start from an example“.
- [x] **Hilfe**:
  - Shortcut-Übersicht ergänzt (Maßeingabe, Shift/Alt beim Transformieren, Pan, `?`) und verbreitert.
  - Kurzanleitung neu (die alte beschrieb „Thermal Triad“ und „Porous Matrix“).
  - Tooltips vereinheitlicht: Name (Zweck) (Shortcut), ohne Werbetext.
- [x] **Konsistenz**:
  - Zoom-Leiste und Geschwindigkeitslegende lagen bei 1366–1600 px Breite unter der Dock-Leiste.
  - Esc schließt jeden offenen Dialog.
  - Ein Fokusring (`:focus-visible`) für alle Buttons.
  - Startbildschirm bei 1366×768 und 2560×1440 geprüft.
- [x] **Tests**: `test_examples_cdp.py` (neu, ~4 min). Der UI-Smoke-Test prüft Beispielkarten, Laden des Stirling-Beispiels, Autosave und den Canvas-Hinweis. `test_gpu_compute_cdp.py` baut die frühere Preset-Szene selbst.

---

## 3. Nächste Schritte (Next Session Starting Tasks)
- [ ] **Kammerdruck auf zugängliche Fläche umstellen?** Der ideale Kammerdruck unterschätzt den mechanischen Druck um ~12 % (Randschicht Radius + halbe Wandstärke). Entscheidung offen.
- [ ] **Regenerator-Überschwinger** (CPU + GPU) analysieren.
- [ ] **Weitere Performance**: Pair-Suche dominiert weiterhin (Kernel-Profil siehe Abschnitt AC); Telemetrie-/Upload-Overhead pro Frame (`getGPUWalls()` allokiert jedes Frame).
- [ ] **`canvasInput.js` zerlegen**: ein großer mousedown/mouseup-Handler pro Werkzeug (toolPanel/inspector sind seit Phase 3 schemagetrieben).
- [ ] **Interaktiver Partikel-Inspektor**: Klick auf ein einzelnes Partikel zur Verfolgung von Trajektorie, Kollisionshistorie und Geschwindigkeitsvektor.

