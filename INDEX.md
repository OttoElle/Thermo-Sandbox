# Thermo Sandbox Codebase Index

## Root Directory
- **index.html**: Main web interface markup (Ribbon toolbar, dual sidebars, modals, canvases, playback dock, persistent bottom sequencer drawer, splash dashboard, modular CSS links). Loads `bundle.js`, or with `?dev` the ES modules in `src/` directly (no build step).
- **style.css**: Master modular CSS aggregator (@import hub for variables, base, canvas, ribbon, sidebars, playback, modals, splash, and sequencer).
- **bundle.js**: Monolithic bundled script compiled for offline execution and fast single-file deployment.
- **ParticleLab_Standalone.html**: Zero-dependency standalone HTML bundle containing inlined CSS and JS.
- **build_all.py**: Python compiler script assembling bundle.js (file order derived from the import graph of `src/main.js`, fails on import/export errors), bundling all modular CSS, and generating ParticleLab_Standalone.html.
- **tools/js_modules.py**: Static import/export analysis of `src/` (dependency order, missing imports, implicit globals, assignments to imported bindings, unreachable files). `uv run tools/js_modules.py` prints the report.
- **Start_ParticleLab.bat**: Windows batch launcher for instant local preview.
- **PROGRESS.md**: Context recovery and task completion log across sessions.
- **INDEX.md**: Architectural directory and file purpose mapping.
- **logo.png**: Application brand icon.

## css/ (Modular CSS Architecture for Vibe-Coding)
- **variables.css**: Design tokens (`:root`), color palette, accents, borders, and shadows.
- **base.css**: Universal reset, custom scrollbars, body, and app viewport layout.
- **canvas.css**: Hardware-accelerated canvases (`#glCanvas`, `#simCanvas`), context menu, context popup, and history badge.
- **ribbon.css**: Top header, menu bar, and 2-row CAD construction ribbon toolbar with simulation lock states.
- **sidebar-left.css**: Left sidebar (`#sidebarLeft`), CAD feature tree, group hierarchy badges, and Onshape tool options dialog.
- **sidebar-right.css**: Right sidebar (`#sidebarRight`), system statistics grid, chamber cards accordion, and telemetry charts.
- **playback.css**: Bottom floating playback dock, play/pause/step controls, speed slider, model & gravity toggles, and zoom controls.
- **modals.css**: Modal dialog system, save/export dialog, file import preview, and simulation overlay lock card.
- **splash.css**: Start screen overlay (`#splashOverlay`): quick actions, recent scenes, example cards, splash-mode styling.
- **sequencer.css**: Persistent bottom drawer (`#seqDrawerHeader`, `#seqDrawerBody`), GRAFCET timeline, step cards, and transition gates.

## src/control/ (Cycle Automation & Sequencer Architecture)
- **CycleSequencer.js**: Precision GRAFCET state machine coordinator managing steps, loop cycles, and state import/export.
- **SequencerConditions.js**: Transition condition evaluator (time, piston at TDC/BDC/drive target/stroke threshold, sensor T/P/piston pressure/V/N) with AND/OR grid; piston stroke geometry (`strokeEnds` with TDC on the gas side of a bound sensor, `pistonGoal`, `strokeFraction`).
- **SequencerConditionFields.js**: Condition form fields for the shared property form, defaults, migration of older conditions and one-line summaries.
- **SequencerActions.js**: Step actions on the element schema: sequenceable types, action values, translation of actions saved by older versions (`normalizeAction`), applying actions (incl. piston drive commands) and summaries.
- **SequencerExecutor.js**: Applies the actions of a step (delegates to SequencerActions).
- **SequencerActionFields.js**: Action form (shared property form in the `sequencer` context) and snapshot extraction.
- **SequencerActionDialog.js**: Object-anchored floating CAD modal dialog with live cyan glow highlight, smooth camera centering, free header dragging, modified indicators, and Reset to Default button.
- **SequencerTransitionDialog.js**: Transition modal: condition grid plus optional safety timeout (0 = off).
- **SequencerTransitionBuilder.js**: Condition grid editor: bracketed rows, summary chips, one expanded chip edited with the property form, AND/OR pills.
- **SequencerSummary.js**: One-line summaries of step actions and transitions for the timeline.
- **SequencerTimeline.js**: Visual timeline renderer for alternating Step Cards and Transition Nodes with expandable Element Accordions and smooth camera zoom.
- **SequencerDock.js**: Bottom unified dock bar controller, animated drawer expansion, loop/active toggle buttons with green active styling, and status badges.
- **SequencerUI.js**: Master coordinator facade integrating dock, timeline, action dialog, transition dialog, and engine hooks.

## src/presets/ (Simulation Templates)
- **index.js**: Start-screen examples (`Examples`, `loadExample`): Gas in a Box, Thermal Equilibrium, Free Expansion, Atmosphere in Gravity, Adiabatic Compression, Carnot, Otto, Stirling. Each one is checked by `tests/test_examples_cdp.py`.

## src/physics/ (Physics Engine & Geometry)
- **HistoryBuffer.js**: Time series of the system and sensor zones: full run kept (recent samples at full resolution, older ones in uniform time buckets), sequencer cycle per sample.
- **Constants.js**: Shared simulation units: `KB` (Boltzmann constant, also templated into the WGSL), `WORLD_SIZE`, `idealGasPressure()` used by sensors and global stats.
- **Vector2.js**: 2D vector mathematics utility (dot, cross, norm, rot, dist).
- **Particle.js**: Hard-sphere and Lennard-Jones particle model with position, velocity, mass, radius, and thermal coloring.
- **ParticleGPUComputeShader.js**: `GPU_LAYOUT` (shared buffer layout constants) and the WGSL kernels: cell-sorted grid (cs_clear_cells, cs_count_cells, cs_scan_blocks/totals/add, cs_scatter), cs_find_pairs, wall broadphase candidates, cs_integrate (mutual pairwise elastic impulse / Lennard-Jones, CCD Ray-vs-Segment collisions against swept wall segments with per-side impulse, heat & conductance event counters, permeable thermal zones for heat exchangers / regenerator slices, atomic sink/regulator removal), cs_advance_substep (moving-wall substep index), cs_telemetry (workgroup-atomic reduction of global/per-sensor sums, speed histograms, regulator counts) and cs_compact / cs_compact_tail (GPU stream compaction).
- **ParticleGPUCompute.js**: WebGPU compute coordinator: ping-pong particle buffers (authoritative while simulating), queued particle appends, zone/wall/sink-counter uploads, single-pass multi-substep dispatch, `submitReadback()` (telemetry + event counters + optional compaction, epoch-tagged), telemetry decoding helpers, GPU step-back history snapshots, and debug `readbackParticles()`.
- **ParticleGroup.js**: Represents grouped clusters of particles for collective tracking in canvas elements outline.
- **SpatialGrid.js**: Spatial partitioning hash grid for optimized O(N) particle-particle collision detection.
- **Wall.js**: Static and conductive line segments, manual valves, check valves, and pressure relief valves with zero-allocation scalar projection.
- **ThrottleValve.js**: Variable opening orifice / aperture valve with wedge jaws, on-canvas drag handles, and live ΔP monitoring.
- **Piston.js**: 1D dynamic boundaries (Displacer, Accumulator, Compressor, Expander) with cached bounds, rail limits, and TDC/BDC travel limits.
- **Reservoir.js**: Infinite heat capacity constant-temperature boundary with cached bounds (Thermal Sink).
- **HeatExchanger.js**: Permeable constant-T boundary with cross-hatch pattern for volumetric thermal equilibration.
- **RegeneratorMatrix.js**: Multi-slice thermal gradient matrix with directional parallel lines.
- **ThermalBlock.js**: Solid thermal storage obstacles (Ressavoir) with finite heat capacity and cached bounds.
- **Regulator.js**: Particle population regulator maintaining setpoint N with configurable hysteresis deadband (GPU mode: counts via GPU telemetry + pending delta, removals via GPU quotas).
- **Emitter.js**: Directional & radial particle generator with velocity and temperature distribution control.
- **Sink.js**: Vacuum particle removal absorber with absorption efficiency.
- **SensorZone.js**: Spatial measurement chamber computing real-time T, P, V, N, dynamic piston face binding, and filtered drift velocity with single-pass variance.
- **TextLabel.js**: Canvas text annotations and formula labels.
- **Engine.js**: Core simulation coordinator: CPU sub-step physics (spatial grid, hard-sphere / Lennard-Jones, CCD, in-place compaction), GPU branch (`_stepGPU`, particle append queue, readback application to stats/sensors/sinks/regulators, wall & piston momentum/heat rates), shared element updates (`_updateComponents`), cycle sequencer execution, and state save/restore.

## src/render/ (Canvas & WebGPU Rendering)
- **Colormap.js**: Thermal temperature-to-RGB gradient interpolator (Cold Blue -> Cyan -> Orange -> Hot Magenta).
- **ParticleGPURenderer.js**: Next-generation WebGPU instanced particle renderer utilizing WGSL shaders, dynamic vertex/instance buffers, bilinear 256x1 colormap LUT, and anti-aliased subpixel discs.
- **Renderer.js**: Dual-layer canvas coordinator orchestrating WebGPU hardware-accelerated particle passes on `#gpuCanvas` and interactive CAD geometry/UI overlay on 2D `#simCanvas`.

## src/analytics/ (Telemetry & Charts)
- **ChartView.js**: Chart component for time series, state diagrams (P-V/P-T/T-s with per-cycle work) and the velocity histogram: axes with units, legend, hover tooltip, HiDPI, CSV export.
- **chartData.js**: Metric definitions, validated chart palette, series extraction for global/sensor targets, cycle work, long-format CSV.
- **DashboardChart.js**: Custom dashboard chart (thin ChartView wrapper, also `window.DashboardChart`).

## src/
- **main.js**: App entry point: imports the `src/app` modules, starts the ambient splash scene and runs the `requestAnimationFrame` loop.

## src/model/ (Element Schema)
- **elementSchema.js**: Single source of truth for element properties (labels, units, ranges, defaults, conditional fields, setters, contexts tool / inspector / sequencer); `elementTypeOf()`.
- **elementNames.js**: Element and group display names, stored with the scene.

## src/app/ (UI Orchestration, split from the former 4.6k-line main.js)
- **state.js**: Shared mutable state: `app` (project name, simulating/splash flags, active tool, selection, popup target; exposed as `window.app`) and `pointer` (mouse, drag and drawing-draft state), `resetPolygonDraft()`.
- **dom.js**: DOM element lookups shared by the modules.
- **core.js**: Engine, Renderer, charts and SequencerUI instances (`window.engine`/`renderer`/`sequencerUI`), canvas sizing, WebGPU + GPU compute start-up.
- **history.js**: Edit-mode undo/redo stacks and the playback history (Step Back, GPU snapshots).
- **fields.js**: Grid snapping and the dual slider/number input helpers.
- **toolPanel.js**: `toolConfigs` (tool defaults derived from the schema), `wallOptions()`, ribbon tool buttons, tool help and the floating tool dialog.
- **propertyForm.js**: Renders schema fields (slider + number, segmented toggles, directions, switches, selects, text, color) with default notch, modified marker and reset; used by tool dialog, properties panel and sequencer.
- **inspector.js**: Properties panel below the tree: header with name, live info, geometry (X/Y/W/H or length/angle), schema fields for single or same-type multi-selections, sensor piston binding, actions.
- **elementTree.js**: Element tree: shapes/groups with segments, icons, names (double-click rename), live values, filter, hover highlight, multi-select, layer drag & drop.
- **menus.js**: Menu bar (File/Edit/View/Simulation/Help) with enabled/checked state, scene lifecycle (`openScene` for presets/recent/files, New Canvas, Revert to Saved, Save/Save As, PNG export), view toggles.
- **transform.js**: Selection transform frame (resize/rotate handles, hit-testing, cursors), linked vertices of wall shapes, exact size setters.
- **dimensions.js**: Live dimension labels while drawing, typed dimension input (drawing and selection size labels).
- **chartViewer.js**: Large chart dialog (metric/target, time range, wheel zoom, drag pan, PNG/CSV export).
- **ribbonLayout.js**: Responsive ribbon (icon-only tool buttons when a row would overflow, wheel scrolls horizontally).
- **playback.js**: Play/pause/step/step-back/stop, physics model and gravity toggles, zoom controls, `fitViewToScene()` (zoom to fit into the area not covered by panels).
- **canvasInput.js**: Canvas mouse interaction: coordinates and magnetic snapping, context menu, drawing (`createFromDrag`, click-move-click, polyline), dragging, panning.
- **selection.js**: Selection transforms (rotate/flip/group), duplicate, hit-testing and box selection, circle/arc wall generators, move and delete.
- **keyboard.js**: Keyboard shortcuts, info + shortcuts modals and chart tabs (side-effect module, imported bare by main.js).
- **dashboard.js**: Right sidebar: system stats, chamber cards and custom charts.
- **toolPreview.js**: Live previews of the active drawing tool.
- **splash.js**: Start screen: example cards and recent scenes with thumbnails, Continue (autosave), the ambient background scene.
- **sceneThumbnail.js**: Draws a small preview of a saved scene state (walls, pistons, zones, particles by speed).
- **autosave.js**: Keeps the open scene in localStorage (every 4 s, on page hide); `getAutosave()` for Continue.
- **canvasHint.js**: Hint on an empty canvas with a link to the examples.

## tests/ (Automated Verification & CDP Test Suites)
- **verify_all.py**: Master test suite running file size audits (< 350 lines), CSS syntax checks, build verification (incl. module check), headless browser runtime test, WebGPU runtime test, 50,000 particle Zero-Copy compute verification, and the UI smoke test.
- **test_webgpu_runtime.py**: Headless Chrome CDP test verifying WebGPU adapter, device, WGSL pipeline, and render pass.
- **bench_gpu.py**: WebGPU benchmark (headless Chrome CDP) reporting ms/frame for 50k–1M particles and up to ~480 wall segments; not part of verify_all.
- **test_gpu_compute_cdp.py**: Headless Chrome CDP test verifying 50,000 particle Zero-Copy GPU compute, CCD anti-tunneling, emitter streaming, dense-gas anti-freezing, GPU telemetry, sinks, piston-bound sensors, and GPU coupling (free piston pressure, relief valve, regulator, compaction, step-back history).
- **test_sequencer_modal_cdp.py**: Chrome DevTools Protocol end-to-end test verifying sequencer UI, dialogs, exclusive accordions, and scrolling.
- **test_sequencer_cycles_cdp.py**: Sequencer on a real cycle (alpha Stirling, two pistons, chamber bound to both): closed cycle, TDC on the gas side, isochoric steps, step labels in the history; adiabatic energy balance of the piston face pressure.
- **test_transition_cdp.py**: CDP test suite verifying 2D compound transition builder, Boolean precedence, square chip collapse, and cycle execution.
- **test_examples_cdp.py**: Runs every start-screen example and checks the physics claim of its card (Maxwell-Boltzmann relaxation, equilibrium without mixing, free expansion, barometric layers, adiabatic heating, positive net work of the three cycles). `uv run tests/test_examples_cdp.py carnot:7` runs one example for more cycles.
- **test_ui_smoke_cdp.py**: UI smoke test run against the bundle, `index.html?dev` and the standalone HTML: all ribbon tools, drawing every element type with real mouse events, selection/popup/context menu, Delete + undo/redo, view menu, playback; fails on any uncaught exception or console error.
