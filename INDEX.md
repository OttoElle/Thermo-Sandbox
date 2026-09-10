# Thermo Sandbox Codebase Index

## Root Directory
- **index.html**: Main web interface markup (Ribbon toolbar, dual sidebars, modals, canvases, playback dock, persistent bottom sequencer drawer, splash dashboard, modular CSS links).
- **style.css**: Master modular CSS aggregator (@import hub for variables, base, canvas, ribbon, sidebars, playback, modals, splash, and sequencer).
- **bundle.js**: Monolithic bundled script compiled for offline execution and fast single-file deployment.
- **ParticleLab_Standalone.html**: Zero-dependency standalone HTML bundle containing inlined CSS and JS.
- **build_all.py**: Python compiler script assembling bundle.js, bundling all modular CSS, and generating ParticleLab_Standalone.html.
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
- **splash.css**: Welcome dashboard overlay (`#splashOverlay`), quick actions, recent profiles, presets library, and splash-mode styling.
- **sequencer.css**: Persistent bottom drawer (`#seqDrawerHeader`, `#seqDrawerBody`), GRAFCET timeline, step cards, and transition gates.

## src/control/ (Cycle Automation & Sequencer Architecture)
- **CycleSequencer.js**: Precision GRAFCET state machine coordinator managing steps, loop cycles, and state import/export.
- **SequencerConditions.js**: Compound transition condition evaluator (Time Duration, Piston TDC/BDC/Position, Sensor Pressure/Temp) with AND/OR logic.
- **SequencerExecutor.js**: Generic action snapshot applier updating pistons, valves, thermals, emitters, sinks, and regulators in the simulation engine.
- **SequencerCatalogDefaults.js**: Canonical default parameter reference and lookup helpers conforming to TOOL_CATALOG.md for live default tracking and one-click reset.
- **SequencerFieldControls.js**: Modular UI form controls (DualInput slider+number, 5-button direction toggles, segmented buttons) with default indicators and live modified status.
- **SequencerActionFields.js**: Dynamic inspector property form generator and snapshot extractor for element action snapshots (omitting thickness, spawner, chamber).
- **SequencerActionDialog.js**: Object-anchored floating CAD modal dialog with live cyan glow highlight, smooth camera centering, free header dragging, modified indicators, and Reset to Default button.
- **SequencerTransitionDialog.js**: Compound transition configuration modal with AND/OR combining gates and safety fallback timeouts.
- **SequencerTransitionBuilder.js**: 2D compound condition builder grid with bracketed rows, monochrome CAD SVG chips, clickable operator pills, and formula generator.
- **SequencerSummary.js**: Summarizers, parameter key-value formatters, and expandable accordion body generators for step actions.
- **SequencerTimeline.js**: Visual timeline renderer for alternating Step Cards and Transition Nodes with expandable Element Accordions and smooth camera zoom.
- **SequencerDock.js**: Bottom unified dock bar controller, animated drawer expansion, loop/active toggle buttons with green active styling, and status badges.
- **SequencerUI.js**: Master coordinator facade integrating dock, timeline, action dialog, transition dialog, and engine hooks.

## src/presets/ (Simulation Templates)
- **index.js**: Library of built-in thermodynamic experiments (Split-Stirling Cryocooler, Venturi Nozzle, Dual-Chamber Partition, Joule-Thomson, Adiabatic Cylinder, Brownian Motion).

## src/physics/ (Physics Engine & Geometry)
- **Vector2.js**: 2D vector mathematics utility (dot, cross, norm, rot, dist).
- **Particle.js**: Hard-sphere and Lennard-Jones particle model with position, velocity, mass, radius, and thermal coloring.
- **ParticleGroup.js**: Represents grouped clusters of particles for collective tracking in canvas elements outline.
- **SpatialGrid.js**: Spatial partitioning hash grid for optimized O(N) particle-particle collision detection.
- **Wall.js**: Static and conductive line segments, manual valves, check valves, and pressure relief valves with zero-allocation scalar projection.
- **ThrottleValve.js**: Variable opening orifice / aperture valve with wedge jaws, on-canvas drag handles, and live ΔP monitoring.
- **Piston.js**: 1D dynamic boundaries (Displacer, Accumulator, Compressor, Expander) with cached bounds, rail limits, and TDC/BDC travel limits.
- **Reservoir.js**: Infinite heat capacity constant-temperature boundary with cached bounds (Thermal Sink).
- **HeatExchanger.js**: Permeable constant-T boundary with cross-hatch pattern for volumetric thermal equilibration.
- **Regenerator.js**: Segmented matrix storing and releasing thermal energy to passing gas streams.
- **RegeneratorMatrix.js**: Multi-slice thermal gradient matrix with directional parallel lines.
- **ThermalBlock.js**: Solid thermal storage obstacles (Ressavoir) with finite heat capacity and cached bounds.
- **ThermalNode.js**: Discrete thermal calculation node for segmented heat transfer matrices.
- **Regulator.js**: Particle population regulator maintaining setpoint N with configurable hysteresis deadband.
- **Emitter.js**: Directional & radial particle generator with velocity and temperature distribution control.
- **Sink.js**: Vacuum particle removal absorber with absorption efficiency.
- **SensorZone.js**: Spatial measurement chamber computing real-time T, P, V, N, and filtered drift velocity with single-pass variance.
- **TextLabel.js**: Canvas text annotations and formula labels.
- **Engine.js**: Core simulation coordinator running numerical integration, zero-allocation in-place compaction, analytical Lennard-Jones, gravity, cycle sequencer execution, and state save/restore.

## src/render/ (Canvas & WebGL Rendering)
- **Colormap.js**: Thermal temperature-to-RGB gradient interpolator (Cold Blue -> Cyan -> Orange -> Hot Magenta).
- **ParticleGLRenderer.js**: Hardware-accelerated WebGL 2 instanced particle renderer with anti-aliased discs and 256x1 LUT texture.
- **Renderer.js**: Dual-layer canvas renderer dispatching particles to WebGL 2 (with 2D fallback) and rendering physical geometry and interactive UI gizmos on 2D canvas.

## src/analytics/ (Telemetry & Charts)
- **ChamberChart.js**: Multi-metric chamber telemetry renderer and dynamic DashboardChart graph engine.
- **TempTimeChart.js**: Global system continuous temperature history curve.
- **VelHistChart.js**: Real-time velocity distribution histogram with theoretical Maxwell-Boltzmann curve.
- **MaxwellBoltzmann.js**: Maxwell-Boltzmann probability distribution functions for comparison.
- **StateDiagrams.js**: P-V indicator loops and thermodynamic state plane utilities.

## src/
- **main.js**: Application orchestrator, dual-canvas synchronization, ribbon toolbar events, inspector synchronization, tool previews, splash screen management, and animation loop.

## tests/ (Automated Verification & CDP Test Suites)
- **verify_all.py**: Master test suite running file size audits (< 350 lines), CSS syntax checks, build verification, and headless browser runtime test.
- **test_sequencer_modal_cdp.py**: Chrome DevTools Protocol end-to-end test verifying sequencer UI, dialogs, exclusive accordions, and scrolling.
- **test_transition_cdp.py**: CDP test suite verifying 2D compound transition builder, Boolean precedence, square chip collapse, and cycle execution.
