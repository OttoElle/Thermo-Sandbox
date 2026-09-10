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

---

## 3. Next Session Starting Tasks
- [ ] Add CSV export for chamber and dashboard time-series telemetry data.
- [ ] Add interactive particle inspector (click single particle to track trajectory and velocity history).
- [ ] Phase 3 Performance: Migrate core SoA physics to dedicated Web Worker for 35,000+ particles.



