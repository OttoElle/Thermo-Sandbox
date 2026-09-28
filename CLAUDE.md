# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Thermo Sandbox (a.k.a. "ParticleLab") is a zero-dependency, client-side 2D particle-physics / thermodynamics sandbox in vanilla JavaScript. Macroscopic quantities (P, T, V, work) emerge from particle collisions. Physics runs on WebGPU compute shaders when available, with a CPU fallback path. The project was previously developed with Gemini/Antigravity; `PROGRESS.md` (partly in German) is the running milestone log and lists the "Next Session" tasks at the end.

## Commands

```bash
uv run build_all.py            # REQUIRED after any src/ or css/ change: regenerates bundle.js + ParticleLab_Standalone.html
uv run tests/verify_all.py     # full suite: line-count audit, CSS brace check, build, headless Chrome CDP tests
uv run tests/test_gpu_compute_cdp.py        # run a single CDP test (each script is standalone)
uv run tests/test_transition_cdp.py
uv run tests/test_sequencer_modal_cdp.py
uv run tests/test_webgpu_runtime.py
uv run python -m http.server 8000     # serve for manual testing at http://localhost:8000/index.html
```

- Python tooling is managed with **uv**: `.python-version` pins the interpreter, `pyproject.toml`/`uv.lock` pin `websocket-client`, and the env lives in `.venv/`. Always use `uv run …`, never a global `python`/`pip`. `uv sync` sets it up.
- This machine's Claude desktop app is an MSIX package, so writes to `%APPDATA%`/`%LOCALAPPDATA%` from agent shells get redirected into the app's private package folder. The user env vars `UV_PYTHON_INSTALL_DIR` and `UV_CACHE_DIR` point to `%USERPROFILE%\.uv\…` to avoid this. If a fresh shell doesn't see them, load them from the User scope (`[Environment]::GetEnvironmentVariable(..., 'User')`) before calling uv, and refresh `PATH` the same way if `uv` isn't found.
- CDP test screenshots are written to the git-ignored `scratch/` directory.
- WGSL mistakes (e.g. reserved words like `active`) only surface at runtime: pipelines become invalid and every dispatch silently no-ops. Compilation errors are logged to the console as `ParticleComputeShader:<line>:<col>`; check the console after shader edits.
- CDP tests need Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`. They start their own local HTTP server + headless Chrome (`--enable-unsafe-webgpu`) on fixed ports and drive the page via `Runtime.evaluate` against the globals `window.engine`, `window.renderer`, `window.sequencerUI`.
- Run tests from the repo root (paths are relative).

## Build model (important)

- `src/` files are written as ES modules (`import`/`export`), but **nothing loads them as modules**. `index.html` loads only `bundle.js`. `build_all.py` concatenates files in the hardcoded `files_order` list and strips `import`/`export` lines with regexes, so everything ends up in one global script scope.
  - A **new JS file must be added to `files_order`** in `build_all.py`, after its dependencies (order matters, since classes are evaluated top to bottom).
  - Class/const names must be globally unique across all of `src/`.
  - Keep `import`/`export` statements on a single line; the strip regex is line-based.
  - Note: `MaxwellBoltzmann.js`, `StateDiagrams.js`, `Regenerator.js`, and `ThermalNode.js` are not currently in `files_order` (not bundled).
- CSS: `index.html` links the `css/*.css` modules directly; the build inlines them (via `css_files_order`) into the standalone HTML. New CSS files must be added both to `index.html` and to `css_files_order`.
- `bundle.js` and `ParticleLab_Standalone.html` are generated but committed. Rebuild before committing and before running browser tests, because the tests load `index.html` → `bundle.js`.

## Architecture

- **`src/main.js`** (~4.6k lines): the app orchestrator. It handles DOM wiring, the ribbon tool state (`toolConfigs`), canvas mouse interaction and editing (draw/select/drag/snap/group, undo/redo), inspector popups, splash screen/presets/recent profiles (localStorage), save/load JSON, and the `requestAnimationFrame` loop. It creates `Engine`, `Renderer`, and `SequencerUI`, then enables GPU compute (`new ParticleGPUCompute(renderer.gpuRenderer.device)` → `engine.enableGPUCompute(...)`) when WebGPU is available.
- **`src/physics/Engine.js`**: owns all scene element arrays (particles, walls, pistons, reservoirs, sensors, emitters, sinks, regulators, thermal blocks, heat exchangers, regenerators, throttle valves, labels). `step(dt)` has two branches that share `_updateComponents()` (thermal couplings, element updates, `updateBoundSensors()`):
  - **CPU**: `_subStep` (spatial grid, hard-sphere / Lennard-Jones, in-place compaction).
  - **GPU** (`_stepGPU`, when `isGPUSimulating()`): the ping-pong buffer in `ParticleGPUCompute` is the **single source of truth** while simulating. `engine.particles` only holds the edit-time/start state and is uploaded via `syncParticlesToGPU()` (edit, reset, load). Particles spawned during a step (emitters, regulators) go through `addParticle()` → `gpuCompute.queueParticle()` and never exist on the CPU. Never read `engine.particles` positions during a GPU simulation.
  - GPU → CPU data flows only through `submitReadback()`/`_applyGPUReadback()`: a reduction kernel produces global + per-sensor stats and speed histograms, and the integrate kernel counts momentum/heat per GPU wall. Engine turns these into rates fed into `Wall.accumulatedImpulse`/`addHeat` and `Piston.accumulatedImpulseLeft/Right` (piston faces are appended after `engine.walls` in `getGPUWalls()`: `[left/top, right/bottom]` per piston). Readbacks are async (1–3 frames latency) and tagged with `gpuCompute.epoch`; results from before a buffer replacement are discarded. Tests must yield between steps (`await engine.awaitGPUTelemetry()`), otherwise no readback resolves.
  - Per substep the compute pass builds a **cell-sorted grid**: count particles per bucket → prefix scan → scatter the particles into the other ping-pong buffer in bucket order (dead ones to the tail); pair search and integration read that sorted copy and write back, so the state buffer never changes between substeps (only compaction flips `pingPong`). Buckets use a wrapping row-major key (`cellKey`), not a scattering hash, so neighbour cells are adjacent in memory; the table size follows the particle count.
  - **Wall broadphase**: static wall segments are binned on the CPU into a coarse grid (`_updateWallGrid`, rebuilt only when static geometry changes); segments flagged `dynamic` (piston faces, throttle wings) are in a global list every particle tests. A particle whose reach (radius + move this substep) exceeds `WALL_GRID_MARGIN` tests all walls. CCD handles up to 3 bounces per substep.
  - Profile/benchmark with `uv run tests/bench_gpu.py` (not part of `verify_all`).
  - Buffer layouts (counters, zones, stats, aux = thermal temps + wall grid, fixed-point scales, limits: 512 walls, 64 sinks, 16 regulators, 16 sensors) live in `GPU_LAYOUT` in `ParticleGPUComputeShader.js` and are templated into the WGSL. Pipelines use `layout: 'auto'`; `PIPELINE_BINDINGS` in `ParticleGPUCompute.js` must list exactly the bindings each entry point uses (max 8 storage buffers per pipeline).
  - `getGPUWalls()` flattens all particle-blocking elements into GPU wall segments: walls, piston faces, throttle-valve wings and the 4 edges of reservoirs/thermal blocks. A parallel `_gpuWallOwners` table (`{ kind, ref }`) routes per-segment momentum (front/back side) and heat back to the element. Piston faces are uploaded at their frame-start position and swept with their velocity per substep. Heat exchangers and regenerator matrices are permeable "thermal zones" in the integrate kernel. Features added to only one branch (CPU `_subStep` vs. WGSL) silently misbehave in the other.
- **Heat exchange model** (CPU and GPU): surface contacts thermalize towards 1.5·kB·T (2D flux-weighted mean energy), volumetric zones towards kB·T. Finite-capacity elements accumulate heat Q and coupling conductance G and update implicitly (`T += Q / (C + G)`), which stays stable for small capacities. On the GPU path, measured impulse and heat go into pending buffers (`_gpuWallPending*`, `_gpuSlicePendingHeat`) that are credited exactly once, drained over the following frames, so momentum and energy are conserved despite readback latency. Elements whose heat capacity is comparable to a single particle's energy (kB·T ≈ 35·T) fluctuate strongly; that is statistics, not instability.
- **Rendering**: `Renderer.js` runs a layered canvas stack. `#gpuCanvas` holds particles via `ParticleGPURenderer` (WebGPU instanced draw, colormap LUT from `Colormap.js`; with GPU compute active it renders zero-copy from the compute buffers). `#simCanvas` is a 2D overlay for all CAD geometry, handles, and selection UI.
- **Sequencer (`src/control/`)**: a GRAFCET step/transition state machine. `CycleSequencer` (core) + `SequencerConditions` (compound AND/OR 2D condition grid) + `SequencerExecutor` (applies step action snapshots to engine elements) handle the logic. `SequencerUI` is the facade over the Dock/Timeline/ActionDialog/TransitionDialog UI modules. `verify_all.py` **fails if any `src/control/*.js` file reaches 350 lines**, so split modules instead of growing them.
- **Element model**: each physics element class has `toJSON()`/`fromJSON()` for save/load and presets (`src/presets/index.js`). New element properties need serialization plus handling in Engine, Renderer (drawing/hit-testing), main.js (tool config, inspector), and, if sequenceable, `SequencerCatalogDefaults`/`SequencerExecutor`.
- **`TOOL_CATALOG.md`** (German) is the canonical spec for every tool's parameters, labels, units, and defaults. `SequencerCatalogDefaults.TOOL_DEFAULTS` must stay consistent with it. Some file references in it (`src/ui/...`) are stale; the UI lives in `main.js`.

## Conventions

- Hot-path code (Engine substeps, wall/piston collision) is deliberately zero-allocation: cached `_bounds`, scalar projections instead of `Vector2` instances, and in-place array compaction. Preserve this.
- UI text is English. Docs and PROGRESS entries mix English and German.
- After finishing a milestone, the previous workflow updated `PROGRESS.md` (new lettered section + "Next Steps") and `INDEX.md` (file map).
