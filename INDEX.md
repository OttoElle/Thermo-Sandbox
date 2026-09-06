# Thermo Sandbox Codebase Index

## Root Directory
- **index.html**: Main single-page web interface markup (Ribbon toolbar, dual sidebars, modals, canvases).
- **style.css**: Complete responsive stylesheet (Dark theme, glassmorphism, ribbon controls, charts).
- **bundle.js**: Monolithic bundled script compiled for offline execution and fast single-file deployment.
- **ParticleLab_Standalone.html**: Zero-dependency standalone HTML bundle containing inlined CSS and JS.
- **build_all.py**: Python compiler script assembling bundle.js and ParticleLab_Standalone.html.
- **Start_ParticleLab.bat**: Windows batch launcher for instant local HTTP preview server.
- **PROGRESS.md**: Context recovery and task completion log for sessions.
- **INDEX.md**: Architectural directory and file purpose mapping.
- **logo.png**: Application brand icon.

## src/physics/ (Physics Engine & Geometry)
- **Vector2.js**: 2D vector mathematics utility (dot, cross, norm, rot, dist).
- **Particle.js**: Hard-sphere and Lennard-Jones particle model with position, velocity, mass, radius, and temperature coloring.
- **ParticleGroup.js**: Represents grouped clusters of particles for collective tracking in canvas elements outline.
- **SpatialGrid.js**: Spatial partitioning hash grid for optimized O(N) particle-particle collision detection.
- **Wall.js**: Static and conductive line segments, manual valves, check valves, and pressure relief valves with zero-allocation scalar projection.
- **ThrottleValve.js**: Variable opening orifice / aperture valve with wedge jaws, on-canvas drag handles, and live ΔP monitoring.
- **Piston.js**: 1D dynamic boundaries (Displacer, Accumulator, Compressor, Expander) with cached bounds and rail handles.
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
- **Engine.js**: Core simulation coordinator running numerical integration, zero-allocation in-place compaction, analytical Lennard-Jones, and state save/restore.

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
- **main.js**: Application orchestrator, dual-canvas synchronization, ribbon toolbar events, inspector synchronization, tool previews, and animation loop.
