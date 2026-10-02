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
uv run tests/test_sequencer_cycles_cdp.py   # Stirling cycle + piston-pressure energy balance
uv run tests/test_examples_cdp.py           # every start-screen example shows what its card claims (~4 min)
uv run tests/test_webgpu_runtime.py
uv run tests/test_ui_smoke_cdp.py    # UI smoke test: bundle, index.html?dev, standalone
uv run tools/js_modules.py            # import/export report for src/ (also enforced by the build)
uv run python -m http.server 8000     # manual testing: http://localhost:8000/index.html (bundle) or index.html?dev (live src/)
```

- Python tooling is managed with **uv**: `.python-version` pins the interpreter, `pyproject.toml`/`uv.lock` pin `websocket-client`, and the env lives in `.venv/`. Always use `uv run …`, never a global `python`/`pip`. `uv sync` sets it up.
- This machine's Claude desktop app is an MSIX package, so writes to `%APPDATA%`/`%LOCALAPPDATA%` from agent shells get redirected into the app's private package folder. The user env vars `UV_PYTHON_INSTALL_DIR` and `UV_CACHE_DIR` point to `%USERPROFILE%\.uv\…` to avoid this. If a fresh shell doesn't see them, load them from the User scope (`[Environment]::GetEnvironmentVariable(..., 'User')`) before calling uv, and refresh `PATH` the same way if `uv` isn't found.
- CDP test screenshots are written to the git-ignored `scratch/` directory.
- WGSL mistakes (e.g. reserved words like `active`) only surface at runtime: pipelines become invalid and every dispatch silently no-ops. Compilation errors are logged to the console as `ParticleComputeShader:<line>:<col>`; check the console after shader edits.
- CDP tests need Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`. They start their own local HTTP server + headless Chrome (`--enable-unsafe-webgpu`) on fixed ports and drive the page via `Runtime.evaluate` against the globals `window.engine`, `window.renderer`, `window.sequencerUI`, `window.app` (shared UI state), `window.Examples`/`window.loadExample`. Only these `window.*` globals work in both modes; don't reach bundle-only top-level names from tests.
- Run tests from the repo root (paths are relative).

## Build model (important)

- `src/` is plain ES modules with the entry `src/main.js`. Two ways to run it:
  - **`index.html`** loads `bundle.js`: `build_all.py` walks the import graph from `src/main.js` (dependencies first), concatenates the files and strips `import` lines and `export` keywords, so everything shares one global script scope. `ParticleLab_Standalone.html` inlines the same bundle.
  - **`index.html?dev`** loads `src/main.js` as a real module (strict mode, no build step), so edits show up on reload.
- Both must keep working, so the build runs `tools/js_modules.py` and **fails** on: a module using another module's top-level name without importing it, imports of names that aren't exported, assignments to imported bindings, duplicate top-level names across modules (they'd collide in the bundle), and `.js` files under `src/` not reachable from `src/main.js`.
  - New files only need to be imported somewhere; there is no file list to maintain. A module that only registers listeners needs a bare `import './x.js';`.
  - Keep each `import` on a single line (`import { A, B } from './x.js';` or a bare import); the strip is line-based. No default exports, `export *` or dynamic imports.
  - Shared mutable state can't be an exported `let` (read-only for importers); put it on a shared object like `app`/`pointer` in `src/app/state.js`.
- CSS: `index.html` links the `css/*.css` modules directly; the build inlines them (via `css_files_order`) into the standalone HTML. New CSS files must be added both to `index.html` and to `css_files_order`.
- `bundle.js` and `ParticleLab_Standalone.html` are generated but committed. Rebuild before committing and before running browser tests, because the tests load `index.html` → `bundle.js`.

## Architecture

- **`src/main.js` + `src/app/`**: the UI orchestration, split by concern (see `INDEX.md`). `app/core.js` creates `Engine`, `Renderer`, charts and `SequencerUI`, then enables GPU compute (`new ParticleGPUCompute(renderer.gpuRenderer.device)` → `engine.enableGPUCompute(...)`) when WebGPU is available. `app/state.js` holds the shared mutable UI state (`app.activeTool`, `app.selectedItems`, `app.isSimulating`, … and the mouse/drawing state in `pointer`). `app/toolPanel.js` has the ribbon tool defaults (`toolConfigs`); the other modules cover inspector, element tree, menus, playback, canvas input, selection, popup, keyboard, dashboard, tool previews and splash. `main.js` runs start-up and the `requestAnimationFrame` loop. The modules reference each other freely (cyclic imports are fine because cross-module calls only happen inside functions/handlers); top-level code must not call into modules that may not be evaluated yet.
- **`src/physics/Constants.js`**: simulation units shared by CPU, WGSL (templated) and analytics: `KB` (35, so kB·T ≈ 35·T), `WORLD_SIZE`, `idealGasPressure()`. Don't reintroduce local `kB = 35.0` literals.
- **`src/physics/Engine.js`**: owns all scene element arrays (particles, walls, pistons, reservoirs, sensors, emitters, sinks, regulators, thermal blocks, heat exchangers, regenerators, throttle valves, labels). `step(dt)` has two branches that share `_updateComponents()` (thermal couplings, element updates, `updateBoundSensors()`):
  - **CPU**: `_subStep` (spatial grid, hard-sphere / Lennard-Jones, in-place compaction).
  - **GPU** (`_stepGPU`, when `isGPUSimulating()`): the ping-pong buffer in `ParticleGPUCompute` is the **single source of truth** while simulating. `engine.particles` only holds the edit-time/start state and is uploaded via `syncParticlesToGPU()` (edit, reset, load). Particles spawned during a step (emitters, regulators) go through `addParticle()` → `gpuCompute.queueParticle()` and never exist on the CPU. Never read `engine.particles` positions during a GPU simulation.
  - GPU → CPU data flows only through `submitReadback()`/`_applyGPUReadback()`: a reduction kernel produces global + per-sensor stats and speed histograms, and the integrate kernel counts momentum/heat per GPU wall. Engine turns these into rates fed into `Wall.accumulatedImpulse`/`addHeat` and `Piston.accumulatedImpulseLeft/Right` (piston faces are appended after `engine.walls` in `getGPUWalls()`: `[left/top, right/bottom]` per piston). Readbacks are async (1–3 frames latency) and tagged with `gpuCompute.epoch`; results from before a buffer replacement are discarded. Tests must yield between steps (`await engine.awaitGPUTelemetry()`), otherwise no readback resolves.
  - Per substep the compute pass builds a **cell-sorted grid**: count particles per bucket → prefix scan → scatter the particles into the other ping-pong buffer in bucket order (dead ones to the tail); pair search and integration read that sorted copy and write back, so the state buffer never changes between substeps (only compaction flips `pingPong`). Buckets use a wrapping row-major key (`cellKey`), not a scattering hash, so neighbour cells are adjacent in memory; the table size follows the particle count.
  - **Wall broadphase**: static wall segments are binned on the CPU into a coarse grid (`_updateWallGrid`, rebuilt only when static geometry changes); segments flagged `dynamic` (piston faces, throttle wings) are in a global list every particle tests. A particle whose reach (radius + move this substep) exceeds `WALL_GRID_MARGIN` tests all walls. CCD handles up to 3 bounces per substep.
  - Profile/benchmark with `uv run tests/bench_gpu.py` (not part of `verify_all`).
  - Buffer layouts (counters, zones, stats, aux = thermal temps + wall grid, fixed-point scales, limits: 512 walls, 64 sinks, 16 regulators, 16 sensors) live in `GPU_LAYOUT` in `ParticleGPUComputeShader.js` and are templated into the WGSL. Pipelines use `layout: 'auto'`; `PIPELINE_BINDINGS` in `ParticleGPUCompute.js` must list exactly the bindings each entry point uses (max 8 storage buffers per pipeline).
  - `getGPUWalls()` flattens all particle-blocking elements into GPU wall segments: walls, piston faces, throttle-valve wings and the 4 edges of reservoirs/thermal blocks. A parallel `_gpuWallOwners` table (`{ kind, ref }`) routes per-segment momentum (front/back side) and heat back to the element. Piston faces are uploaded at their frame-start position and swept with their velocity per substep. Heat exchangers and regenerator matrices are permeable "thermal zones" in the integrate kernel. Features added to only one branch (CPU `_subStep` vs. WGSL) silently misbehave in the other.
- **Heat exchange model** (CPU and GPU): surface contacts thermalize towards 1.5·kB·T (2D flux-weighted mean energy), volumetric zones towards kB·T. Finite-capacity elements accumulate heat Q and update once per frame; the 5 K floor keeps the deficit in the heat accumulator (heat owed), so clamping creates no energy.
  - **CPU path**: the update is implicit in the coupling conductance G (`T += Q / (C + G)`), stable for small capacities.
  - **GPU path**: readbacks arrive 1–3 frames late, so a small-capacity element would see a stale temperature, overshoot every frame and pump energy into the gas. Therefore every finite-capacity element (wall owner, piston, throttle, block, regenerator slice) is a **thermal body**: the GPU accumulates the heat it records per body (`BODY_HEAT_BASE`) and uses `T_uploaded + unacknowledged / C` as the current temperature; the CPU applies read-back heat exactly once (`T += Q / C`) and acknowledges the same fixed-point units (`ackBodyHeat` → `cs_ack_bodies` at frame start). Wall hits are additionally implicit per hit (`α / (1 + α·1.5·kB/C)`). Uploaded temperatures include heat owed below the floor. Measured impulse still goes through pending buffers (`_gpuWallPending*`) drained over the following frames.
  - Elements whose heat capacity is comparable to a single particle's (kB ≈ 35 J/K per particle) fluctuate strongly; that is statistics, not instability. Test section 15 in `test_gpu_compute_cdp.py` guards a closed conductive-wall box (T stays ~300 K, energy conserved) with realistic readback latency.
- **Rendering**: `Renderer.js` runs a layered canvas stack. `#gpuCanvas` holds particles via `ParticleGPURenderer` (WebGPU instanced draw, colormap LUT from `Colormap.js`; with GPU compute active it renders zero-copy from the compute buffers). `#simCanvas` is a 2D overlay for all CAD geometry, handles, and selection UI.
- **Sequencer (`src/control/`)**: a GRAFCET step/transition state machine. `CycleSequencer` (core) + `SequencerConditions` (compound AND/OR 2D condition grid) + `SequencerExecutor` (applies step action snapshots to engine elements) handle the logic. `SequencerUI` is the facade over the Dock/Timeline/ActionDialog/TransitionDialog UI modules. Piston TDC is the stroke end with the smallest gas volume, taken from a sensor zone bound to the piston (`strokeEnds`); drive targets and stroke conditions are in % of stroke from TDC. `verify_all.py` **fails if any `src/control/*.js` file reaches 350 lines**, so split modules instead of growing them.
- **Element model**: each physics element class has `toJSON()`/`fromJSON()` for save/load and the start-screen examples (`src/presets/index.js`, each checked by `tests/test_examples_cdp.py`). **`src/model/elementSchema.js` is the single source of truth for element properties** (label, unit, range, default, conditional visibility, setter, and in which context a field appears: tool dialog / properties panel / sequencer). `propertyForm.js` renders it for the tool dialog (`toolPanel.js`, whose `toolConfigs` are derived from the schema defaults), the properties panel (`inspector.js`) and the sequencer action form; `SequencerActions.js` applies actions through the same setters. A new element property needs serialization, Engine/Renderer handling and one schema field; nothing else. Display names (`elementNames.js`) and z-order are stored in the exported state (`elementNames`, `groupNames`, `elementOrder`).
- **`TOOL_CATALOG.md`** (German) describes every tool's parameters and their meaning; exact ranges and defaults live in the schema.

## Conventions

- Hot-path code (Engine substeps, wall/piston collision) is deliberately zero-allocation: cached `_bounds`, scalar projections instead of `Vector2` instances, and in-place array compaction. Preserve this.
- UI text is English. Docs and PROGRESS entries mix English and German.
- After finishing a milestone, the previous workflow updated `PROGRESS.md` (new lettered section + "Next Steps") and `INDEX.md` (file map).
