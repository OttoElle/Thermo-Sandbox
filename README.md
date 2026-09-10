# Thermo Sandbox

**Thermo Sandbox** is an interactive, browser-based virtual physics laboratory and CAD-style engineering sandbox for exploring **thermodynamics, kinetic gas theory, fluid dynamics, and automated thermal cycle machines**.

Rather than relying on pre-calculated formulas, macroscopic thermodynamic phenomena—such as pressure, temperature, expansion work, heat exchange, entropy increase, and throttling effects—**emerge naturally** from thousands of microscopic particle collisions computed in real time.

---

## 🌟 Overview & Core Philosophy

Thermo Sandbox combines precision kinetic particle modeling with CAD-inspired design tools and industrial cycle automation:

- **Emergent Thermodynamics**: Observe how the laws of thermodynamics (Boyle-Mariotte, Gay-Lussac, 2nd Law, Maxwell-Boltzmann statistics) arise directly from Newtonian and Lennard-Jones molecular dynamics.
- **CAD-Style Construction**: Draw, configure, and inspect physical machinery on an interactive coordinate canvas using an intuitive 2-row ribbon toolbar and feature tree.
- **Automated Cycle Sequencer (GRAFCET)**: Automate complex thermodynamic machines (e.g., Stirling cryocoolers, Otto/Diesel cycles, heat pumps) using a timeline-based state machine with 2D compound transition conditions (time delays, piston TDC/BDC limits, and sensor chamber thresholds).
- **Real-Time Telemetry & Indicator Diagrams**: Place spatial measurement zones to monitor real-time temperature, pressure, and volume, inspect dynamic $P$-$V$ indicator loops, and compare live particle velocity distributions with theoretical Maxwell-Boltzmann curves.
- **Zero Dependencies, Pure Web**: Runs 100% client-side in any modern web browser using hardware-accelerated WebGL 2. Zero npm packages, zero build dependencies required for execution, and zero backend services.

---

## 🔬 Key Capabilities

### 1. Kinetic Particle Physics Engine
- **Molecular Dynamics Models**: Hard-sphere elastic collisions and Lennard-Jones analytical inter-particle potentials with spatial grid acceleration ($O(N)$).
- **Thermal Velocity Mapping**: Continuous kinetic temperature calculated dynamically from velocities and visualized via custom thermal color gradients (Cold Blue $\rightarrow$ Cyan $\rightarrow$ Orange $\rightarrow$ Hot Magenta).
- **Drift-Corrected Pressure & Temperature**: Single-pass variance and velocity-drift compensation ensure accurate thermodynamic readings even within high-speed flowing gas streams.
- **Gravity & Force Fields**: Dynamic global gravity toggles with customizable vectors and boundaries.

### 2. Physical CAD Components & Boundaries
- **Pistons & Work Boundaries**: 1D dynamic moving boundaries (compressors, expanders, spring-loaded accumulators, and free displacers) with real-time Work ($W = \int P \, dV$) calculation.
- **Thermal Boundaries**: Constant-temperature Reservoirs (heat sources/sinks), porous volumetric Heat Exchangers, segmented Regenerator matrices, and conductive Thermal Blocks with finite heat capacity.
- **Valves & Fluid Control**: Manual toggle valves, one-way Check Valves, Pressure Relief Valves (PRV), and variable-orifice Throttle Valves for Joule-Thomson expansion experiments.
- **Sources & Sinks**: Mass emitters with velocity and temperature control, vacuum absorption sinks, and closed-loop particle population regulators.

### 3. Cycle Sequencer & Automation
- **GRAFCET State Machine**: Sequence thermodynamic steps along a timeline drawer with intuitive visual step cards and transition gates.
- **In-Line Interactive Controls**: Fine-tune component parameters (piston speeds, valve states, emitter rates, temperatures) directly inside expandable step accordions on the timeline.
- **Arbitrary 2D Compound Transitions**: Build robust logic gates connecting conditions both horizontally (bracketed rows) and vertically with Boolean precedence:
  $$\big(\text{Elapsed} \ge 1.5\,\text{s} \ \land\ \text{Piston at TDC}\big) \ \lor\ \big(\text{Chamber Pressure} \ge 200\,\text{Pa}\big)$$
- **Safety Fallback Timeouts**: Automatic fail-safes prevent cycles from stalling if physical boundary conditions are unfulfilled.

### 4. Live Analytics & Telemetry Dashboard
- **Chamber Telemetry**: Multi-metric graphs tracking $P$, $T$, $V$, $N$, and internal energy $U$ over time.
- **$P$-$V$ Indicator Loops**: Real-time state plane tracing of work cycles to analyze thermodynamic efficiency and enclosed net work.
- **Maxwell-Boltzmann Histograms**: Live velocity distribution curves overlaid with theoretical kinetic distributions.
- **Spatial Measurement Chambers**: Non-intrusive sensor zones that sample and calculate state variables without disturbing particle trajectories.

---

## 🧪 Built-In Physical Presets & Experiments

Thermo Sandbox comes with ready-to-run experiments demonstrating fundamental thermodynamic processes:

1. **Split-Stirling Cryocooler**: A dual-piston (compressor + displacer) regenerative cooling cycle demonstrating cryogenic refrigeration via out-of-phase volume variation and regenerator heat storage.
2. **Venturi Nozzle & Bernoulli Flow**: High-velocity gas flowing through a converging-diverging constriction demonstrating dynamic pressure drop and kinetic energy conservation.
3. **Dual-Chamber Thermal Equalization**: Hot and cold gas chambers separated by a conductive partition wall illustrating the 2nd Law of Thermodynamics and thermal conduction.
4. **Joule-Thomson Throttle Expansion**: High-pressure real gas forced through a narrow throttling aperture exhibiting non-ideal cooling behavior.
5. **Adiabatic Cylinder Compression**: Rapid volume reduction by a motorized piston illustrating work input, reversible heating, and ideal gas compression laws.
6. **Brownian Motion**: Heavy tracer particles suspended among thousands of lightweight gas molecules demonstrating statistical thermal agitation.

---

## 🚀 Getting Started

### Option 1: Instant Standalone (Recommended)
Simply double-click or open **`ParticleLab_Standalone.html`** in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari.
- Entire application (HTML, modular CSS, icons, shaders, and JavaScript) is fully inlined in a single self-contained file.
- Works 100% offline with zero installation.

### Option 2: Live Local Development
To launch the modular development version with live reload support:
1. Double-click **`Start_ParticleLab.bat`** (Windows), or
2. Serve the repository folder with any local web server:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

---

## 🛠️ Project Structure & Architecture

```
Thermo-Sandbox/
├── index.html                   # Main application markup & CAD layout
├── style.css                    # CSS import hub for modular stylesheets
├── css/                         # Modular CSS architecture
│   ├── variables.css            # CAD color tokens, accents, and themes
│   ├── base.css                 # Viewport layout and resets
│   ├── canvas.css               # WebGL 2 and 2D canvas layers
│   ├── ribbon.css               # Top CAD 2-row ribbon toolbar
│   ├── sidebar-left.css         # Elements tree & tool options dialog
│   ├── sidebar-right.css        # System telemetry & chamber accordion
│   ├── playback.css             # Floating dock, play/pause & speed slider
│   ├── modals.css               # Dialog system & file import/export
│   ├── splash.css               # Welcome dashboard & preset launcher
│   └── sequencer.css            # Bottom GRAFCET drawer, cards & 2D gates
├── src/
│   ├── main.js                  # Application coordinator & event loop
│   ├── physics/                 # Particle simulation & mechanical boundaries
│   ├── control/                 # Cycle sequencer, actions & transition gates
│   ├── analytics/               # Real-time telemetry, P-V loops & MB curves
│   ├── render/                  # WebGL 2 particle instancing & 2D overlay
│   └── presets/                 # Pre-configured thermodynamic experiments
├── tests/                       # Automated test suites & headless CDP tests
├── build_all.py                 # Compiler script generating bundle.js & Standalone HTML
├── ParticleLab_Standalone.html  # Portable zero-dependency distribution
├── INDEX.md                     # Complete codebase index & file map
└── PROGRESS.md                  # Development history & milestone tracking
```

---

## 🔧 Building & Testing

To compile modular source files into the distribution bundles:
```bash
python build_all.py
```

To run the automated verification suite (file size audits, modular CSS syntax, build checks, and headless Chrome browser runtime test):
```bash
python tests/verify_all.py
```

---

## 📄 License & Attribution

Thermo Sandbox is developed as an open virtual physics laboratory for thermodynamic research, engineering prototyping, and interactive education.

