# Thermo Sandbox Codebase Index

## Root Directory
- **index.html**: Main web interface markup (Ribbon toolbar, dual sidebars, modals, canvases, playback dock, persistent bottom sequencer drawer, splash dashboard).
- **style.css**: Complete responsive stylesheet (Dark slate theme, glassmorphism, ribbon controls, charts, GRAFCET timeline, splash dashboard).
- **bundle.js**: Monolithic bundled script compiled for offline execution and fast single-file deployment.
- **ParticleLab_Standalone.html**: Zero-dependency standalone HTML bundle containing inlined CSS and JS.
- **build_all.py**: Python compiler script assembling bundle.js and ParticleLab_Standalone.html.
- **Start_ParticleLab.bat**: Windows batch launcher for instant local preview.
- **PROGRESS.md**: Context recovery and task completion log across sessions.
- **INDEX.md**: Architectural directory and file purpose mapping.
- **logo.png**: Application brand icon.

## src/control/ (Cycle Automation & Sequencer)
- **CycleSequencer.js**: Precision GRAFCET state machine and sequence controller coordinating pistons (TDC/BDC strokes), valves, and thermals.
- **SequencerUI.js**: Persistent bottom drawer controller and interactive GRAFCET step-transition timeline track.

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
