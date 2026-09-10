# Implementation Plan: Clean Re-Implementation of Thermodynamic Cycle Sequencer

This plan provides a clean, phased re-architecture of the **Thermodynamic Cycle Sequencer** from the ground up, strictly adhering to the user's design requirements, the new modular CSS system in `styles/`, and vibe-coding constraints (< 350 lines per file, zero external npm dependencies).

---

## 1. Core Architecture & Phasing Strategy

To ensure zero regressions, consistent styling, and flawless UI ergonomics, the re-implementation is executed in **3 individually verified stages**:

```
Stage 1: Floating Dock & Timeline Layout Shell
   │
   ├── Integrated Sequencer toggle button on the bottom control bar ([⏱ Sequencer])
   ├── Downward-unfolding timeline drawer widening almost to sidebars (calc(100vw - 760px))
   ├── Alternating Step Cards and Transition Nodes with monochrome SVG icons (NO emojis)
   └── 100% English UI, clean dark glassmorphism, no element overlaps or cutoffs
   │
Stage 2: Element Selection & Action Configuration Modal
   │
   ├── Interactive canvas and Elements Outline selection mode (+ Add Element)
   ├── Configuration modal displaying EXACT inspector properties for the chosen element:
   │     • Excludes Spawner (Gas) and Chamber (SensorZone)
   │     • Excludes Thickness for walls and valves
   ├── Snapshot property saving (loads current values, saves full parameter state for the step)
   └── Compact action summary badges in Step Cards with monochrome Edit / Delete buttons
   │
Stage 3: Transition Gates & State Machine Execution Loop
   │
   ├── Transition configuration dialog with 3 condition types:
   │     • Time Duration (t >= X s)
   │     • Piston Position (Target: TDC, BDC, or custom px)
   │     • Sensor Chamber (Pressure in Pa or Temperature in K, operator >= or <=)
   ├── Logical [AND] / [OR] combining gates with safety fallback timeout
   ├── Generic CycleSequencer execution loop applying step snapshots to scene objects
   └── Automated verification with CDP test suite & build script
```

---

## 2. Proposed Changes

### Stage 1: Floating Dock & Timeline Layout Shell

#### [MODIFY] [index.html](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/index.html)
- Clean up `#unifiedBottomDock` structure:
  - Top bar (`#unifiedDockBar`): Playback controls, time counter, speed slider, fluid model toggle, gravity toggle, divider, and a clean `[⏱ Sequencer]` button (`#btnToggleSequencer`) with an active indicator dot and expand/collapse chevron.
  - Body (`#seqTimelineDrawer`): Contains the timeline sub-header (`Cycle Sequencer`, Active toggle, Loop toggle, Step/Cycle badge, Reset button, and `+ Add Step` button), and the horizontal scrollable timeline track (`#seqTimelineTrack`).

#### [MODIFY] [styles/dock.css](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/styles/dock.css) & [styles/sequencer.css](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/styles/sequencer.css)
- Implement unified dock layout:
  - Collapsed state: Centered compact pill at `position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); height: 52px; width: fit-content;`.
  - Expanded state: Smoothly animates to `height: 310px; width: min(1240px, calc(100vw - 760px)); min-width: 540px;` (leaving comfortable clearance to left sidebar at 336px and right sidebar at 396px).
  - Dark glassmorphism (`rgba(16, 18, 22, 0.94)`, `backdrop-filter: blur(16px)`, `border: 1px solid var(--border-card)`, `border-radius: 14px`).
  - Style Step Cards (`.seq-step-card`) and Transition Nodes (`.seq-transition-node`):
    * Monochromatic stroke SVGs for Edit (`pencil`), Delete (`trash-2`), Add (`plus`), Chevron (`chevron-down`).
    * Strictly NO colorful emojis.
    * Proper box sizing, padding, and overflow protection so nothing is cut off or squished.

#### [MODIFY] [src/control/SequencerDock.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerDock.js) & [src/control/SequencerTimeline.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerTimeline.js)
- Wire `#btnToggleSequencer` to smoothly open/close the drawer.
- Render alternating Step Cards (`Step 1`, `Step 2`) and Transition Nodes (`[Time >= 1.5s]`).
- Reordering (drag / left-right buttons), duplicate step, delete step, and reset cycle.
- 100% English terminology throughout.

---

### Stage 2: Element Selection & Action Configuration Modal

#### [MODIFY] [src/control/SequencerActionDialog.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerActionDialog.js)
- Picking mode: Clicking `+ Add Element` in a Step card highlights the picking state with a subtle toast banner: *"Click an element on canvas or in the Elements Outline (ESC to cancel)"*.
- Clicking a canvas element (via `findItemAt`) or an item in the outline tree opens the Action Modal.
- Ignores `ParticleGroup` (Spawner) and `SensorZone` (Chamber).

#### [MODIFY] [src/control/SequencerActionFields.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerActionFields.js)
- Provide exact property controls matching `InspectorView.js` / `ItemAccordion.js` for each entity type:
  - **Piston**: Motion Type (`[Free] [Spring] [Load] [Motor]`), Mass, Conductivity, Spring Constant k (if spring), Damping Load γ (if load), Motor Frequency f & Phase φ (if motor).
  - **Wall**: Conductivity κ (*thickness omitted*).
  - **Manual Valve**: State (`VALVE IS OPEN` / `VALVE IS CLOSED`), Conductivity κ (*thickness omitted*).
  - **Check Valve**: Flow Direction (`Forward →` / `Reverse ←`), Conductivity κ (*thickness omitted*).
  - **Relief Valve (PRV)**: Trigger Pressure P_max, Hysteresis Band ΔP, Relief Mode (`[1-Way] [2-Way]`), Relief Direction, Conductivity κ (*thickness omitted*).
  - **Throttle Valve**: State (`THROTTLE IS ACTIVE` / `THROTTLE IS BYPASSED`), Opening Ratio (0–100%), Conductivity κ (*thickness omitted*).
  - **Reservoir**: State (`RESERVOIR IS ACTIVE` / `RESERVOIR IS INACTIVE`), Temperature, Thermal Coupling.
  - **Heat Exchanger**: State (`EXCHANGER IS ACTIVE` / `EXCHANGER IS INACTIVE`), Body Temperature, Thermal Coupling.
  - **Regenerator**: State (`MATRIX IS ACTIVE` / `MATRIX IS INACTIVE`), Flow Axis (`[Horizontal] [Vertical]`), Heat Capacity, Thermal Coupling.
  - **Thermal Block**: State (`BLOCK IS ACTIVE` / `BLOCK IS INACTIVE`), Temperature, Heat Capacity, Conductivity.
  - **Emitter**: State (`EMITTER IS FIRING` / `EMITTER IS PAUSED`), Flow Direction (`[→] [←] [↓] [↑] [360°]`), Rate, Temperature, Particle Mass, Capacity Limit.
  - **Sink**: State (`ABSORBER IS ACTIVE` / `ABSORBER IS INACTIVE`), Direction (`[→] [←] [↓] [↑] [360°]`), Thermal Filter (`[All] [Hot Only] [Cold Only]`), Cutoff Temp, Efficiency, Max Absorbed.
  - **Regulator**: State (`REGULATOR IS ACTIVE` / `REGULATOR IS INACTIVE`), Target Particle Count, Hysteresis Band, Temperature, Max Flow Rate.
- Snapshot property saving: Loads current element properties into the inputs, user adjusts values, and clicking "Save Action" snapshots the object state for that step.

---

### Stage 3: Transition Gates & State Machine Execution Loop

#### [MODIFY] [src/control/SequencerTransitionDialog.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerTransitionDialog.js)
- Clean floating dialog matching `.tool-dialog-panel`:
  - Operator toggle: `[AND (All met)]` / `[OR (Any met)]`.
  - Condition items list with type selector:
    1. **Time Duration**: `Elapsed Time >= X s` (number input / slider).
    2. **Piston Position**: Select piston dropdown, target type (`TDC`, `BDC`, or `Target Position (px)` with dual input).
    3. **Sensor Chamber**: Select chamber dropdown, metric (`Pressure (Pa)` or `Temperature (K)`), operator (`>=` or `<=`), threshold value.
  - `+ Add Condition` button and delete condition button per row.
  - Fallback safety timeout (default 10.0s).

#### [MODIFY] [src/control/SequencerExecutor.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerExecutor.js) & [src/control/SequencerConditions.js](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/src/control/SequencerConditions.js)
- Generic action executor applying snapshot properties to target elements in the simulation engine.
- Compound condition evaluator checking time, piston position, and chamber metrics according to the selected AND/OR logic.

#### [MODIFY] [build_all.py](file:///c:/Users/ottou/Documents/antigravity/Particle%20Simulation/build_all.py)
- Re-run `build_all.py` to regenerate `bundle.js` and `ParticleLab_Standalone.html`.

---

## 3. Verification Plan

### Automated Tests
1. **Build Verification**:
   - Run `python build_all.py` to ensure zero bundle syntax errors.
2. **File Size Audit**:
   - Run line-count check ensuring every `.js` file in `src/control/` is `< 350` lines.
3. **Automated CDP Headless Chrome Test**:
   - Run `python tests/verify_all.py` testing both `index.html` (Native ESM) and `ParticleLab_Standalone.html` (Bundled IIFE):
     - Toggle Sequencer dock open/close and verify bounding rects do not overlap sidebars.
     - Add Steps and verify alternating step and transition nodes.
     - Add actions for Piston, Valve, Emitter, Sink, and Thermal elements.
     - Configure Compound Transitions (Time + Sensor) with AND/OR gates.
     - Play simulation and verify step transitions trigger on conditions.
     - Verify 0 console errors and 100% English UI strings.

### Manual Verification
- Verify that clicking `[⏱ Sequencer]` on the control bar expands the dock smoothly without covering sidebars or charts.
- Verify that clicking `+ Add Element` highlights the canvas, opens the modal with matching inspector controls, and saves snapshots cleanly.
- Verify that Step cards and buttons look sleek, dark-themed, and have no emojis or cutoffs.
