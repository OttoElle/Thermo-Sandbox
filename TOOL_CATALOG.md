# Thermo Sandbox – Werkzeug- & Einstellungskatalog (Tool Specification Catalog)

> **Zweck dieses Dokuments:**  
> Dieses Dokument ist die **kanonische Referenz** für alle Werkzeuge, deren Eigenschaften, Einstellungsmenüs und physikalische Parameter. Es dient Entwicklern und KIs beim Vibe-Coding als verbindliche Richtlinie (Single Source of Truth), damit sich Konfigurationen, Bezeichnungen, Einheiten und Menüstrukturen nicht unbeabsichtigt ändern.

---

## Inhaltsverzeichnis
1. [Übersicht & Globale UI-Konventionen](#1-übersicht--globale-ui-konventionen)
2. [Werkzeuge (Tools & Beschriftung)](#2-werkzeuge-tools--beschriftung)
3. [Wände & Begrenzungen (Walls)](#3-wände--begrenzungen-walls)
4. [Partikel, Quellen & Regler (Particles)](#4-partikel-quellen--regler-particles)
5. [Thermik & Wärmetausch (Thermal Triad)](#5-thermik--wärmetausch-thermal-triad)
6. [Kolben & Arbeitstransfer (Pistons)](#6-kolben--arbeitstransfer-pistons)
7. [Ventile & Drosseln (Valves)](#7-ventile--drosseln-valves)
8. [Messkammern & Sensoren (Sensors)](#8-messkammern--sensoren-sensors)
9. [Übersichtstabelle aller Standardwerte (toolConfigs)](#9-übersichtstabelle-aller-standardwerte-toolconfigs)

---

## 1. Übersicht & Globale UI-Konventionen

Jedes Werkzeug besitzt zwei Repräsentationen in der Benutzeroberfläche:
1. **Werkzeug-Einstellungsmenü (Tool Options Panel):**  
   Befindet sich in der linken Seitenleiste (`src/ui/InspectorView.js`) und ist aktiv, wenn das Werkzeug in der Ribbon-Leiste ausgewählt ist. Hier eingestellte Werte gelten als Vorlage für neu gezeichnete Elemente und synchronisieren sich automatisch mit selektierten Elementen desselben Typs.
2. **Element-Akkordeon (Item Accordion):**  
   Befindet sich in der linken Elements-Outline (`src/ui/ItemAccordion.js`), wenn ein bereits auf dem Canvas platziertes Element selektiert wird.

### UI-Komponenten
- **Dual-Input (`makeDualInput`):** Gekoppeltes Paar aus Schieberegler (Slider) und Zahlenfeld (Number Input) mit Live-Einheitenanzeige.
- **Segmented Button Group (`.btn-toggle-group`):** Horizontale Schaltflächengruppe für diskrete Modi (z. B. Richtungen, Zustände).
- **Richtungs-Buttons (`dirs`):** Für Emitter und Absorber gilt die **einheitliche 5-Tasten-Reihe**:  
  `[ → ]` (Rechts) | `[ ← ]` (Links) | `[ ↓ ]` (Unten) | `[ ↑ ]` (Oben) | `[ 360° ]` (Omnidirektional / Radial)

---

## 2. Werkzeuge (Tools & Beschriftung)

### 2.1 Auswahl-Werkzeug (`select`)
- **Ribbon-ID:** `#toolSelect` | **Tool-Key:** `'select'`
- **Kategorie:** `TOOLS` (Row 1)
- **Funktion:** Einzel- und Mehrfachauswahl, Verschieben per Drag & Drop, Aufziehen eines Auswahlrahmens (Marquee Box), Anfasser für Resizing.
- **Shortcuts & Aktionen:**
  - `Ctrl + Klick`: Mehrfachauswahl
  - `Ctrl + G`: Gruppe erstellen / auflösen
  - `Ctrl + D`: Selektierte Elemente duplizieren
  - `Entf / Backspace`: Selektierte Elemente löschen
  - `90° Drehen` (`#btnRotate90`), `Horizontal spiegeln` (`#btnFlipH`), `Vertikal spiegeln` (`#btnFlipV`)
- **Menü-Aufbau:**
  - Zeigt im Tool-Panel eine Kurzanleitung (Shortcuts).
  - Bei Mehrfachauswahl: Anzeige der Anzahl selektierter Elemente mit Sammel-Löschen- und Gruppieren-Buttons.

### 2.2 Text-Notiz (`text`)
- **Ribbon-ID:** `#toolText` | **Tool-Key:** `'text'`
- **Kategorie:** `TOOLS` (Row 1)
- **Funktion:** Platzieren von Textbeschriftungen, thermodynamischen Formeln oder Notizen auf dem Canvas.
- **Eigenschaften:**
  | Parameter | Key | Typ | Bereich / Optionen | Default | Einheit |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | Textinhalt | `text` | Prompt / Text | Beliebiger String | `'Note'` | – |
  | Schriftgröße | `fontSize` | Zahl | 10 – 32 | `14` | px |
  | Textfarbe | `color` | Color-Hex | Hex-Farbe | `'#94a3b8'` | – |

---

## 3. Wände & Begrenzungen (Walls)

- **Ribbon-Gruppe:** `WALLS` (Row 2) | **Tool-Key:** `'wall'`
- **Funktion:** Starre, undurchdringliche Randbegrenzungen zur Führung von Gasen und Trennung von Kammern.

### 3.1 Geometrie-Formen (Shape Sub-Modes)
1. **Polylinie (`polygon`):** `#toolWallPoly` – Klick für Klick verbundene Wandzüge. Ein Klick auf den Startpunkt schließt das Polygon ab.
2. **Rechteck (`rect`):** `#toolWallRect` – Aufziehen mit der Maus erzeugt 4 rechtwinklig verbundene Wände.
3. **Kreis (`circle`):** `#toolWallCircle` – Aufziehen vom Mittelpunkt erzeugt eine geschlossene kreisförmige Wand.
4. **Bogen (`arc`):** `#toolWallArc` – 3-Klick-Bogen (Mittelpunkt $\rightarrow$ Startpunkt $\rightarrow$ Endwinkel).

### 3.2 Menü-Aufbau & Eigenschaften
| Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dicke** | `thickness` | Dual-Input | 2 – 16 | 1 | `4` | px | Visuelle und kollisionsrelevante Wandstärke. |
| **Leitfähigkeit κ** | `conductivity` | Dual-Input | 0.00 – 1.00 | 0.05 | `0.00` | – | `0` = adiabatisch isolierend; `1` = ideal thermisch leitend. |

---

## 4. Partikel, Quellen & Regler (Particles)

- **Ribbon-Gruppe:** `PARTICLES` (Row 2)

### 4.1 Gas-Spawner (`gas`)
- **Ribbon-ID:** `#toolGas` | **Tool-Key:** `'gas'`
- **Funktion:** Einmaliges Befüllen eines aufgezogenen Bereichs mit einem Gitter thermalisierter Partikel.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Geschwindigkeitsmodus** | `velocityMode` | Toggle-Buttons | `[Uniform]` / `[Maxwell]` | – | `uniform_speed` | – | Gleichverteilte Startgeschwindigkeit vs. theoretische Maxwell-Boltzmann-Verteilung. |
  | **Partikelanzahl N** | `count` | Dual-Input | 5 – 120 | 5 | `30` | – | Anzahl der im Rechteck erzeugten Partikel. |
  | **Temperatur T** | `temperature` | Dual-Input | 20 – 800 | 20 | `300` | K | Mittlere kinetische Starttemperatur ($E_\text{kin} = k_B T$). |
  | **Partikelmasse m** | `mass` | Dual-Input | 0.2 – 5.0 | 0.2 | `1.0` | – | Relative Masse der Partikel (beeinflusst Stoßimpuls und Trägheit). |

---

### 4.2 Kontinuierlicher Emitter (`emitter`)
- **Ribbon-ID:** `#toolEmitter` | **Tool-Key:** `'emitter'`
- **Funktion:** Kontinuierliche Partikelquelle (Einspritzdüse), die Partikel mit einstellbarer Rate und Temperatur abgibt.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich / Optionen | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Flussrichtung** | `direction` | 5-Button Toggle | `[→]` `[←]` `[↓]` `[↑]` `[360°]` | – | `'right'` | – | Ausströmungsvektor mit thermischer Streuung oder 360°-Rundum-Ausstoß. |
  | **Emissionsrate** | `rate` | Dual-Input | 1 – 50 | 1 | `8` | /s | Ausgestoßene Partikel pro Sekunde. |
  | **Temperatur T** | `temperature` | Dual-Input | 20 – 800 | 20 | `300` | K | Temperatur der injizierten Partikel. |
  | **Partikelmasse m** | `mass` | Dual-Input | 0.2 – 5.0 | 0.2 | `1.0` | – | Masse der injizierten Partikel. |
  | **Kapazitätsgrenze** | `maxParticles` | Dual-Input | 0 – 500 | 25 | `0` | – | `0` = unbegrenzt; schaltet Emitter nach $N$ Partikeln automatisch ab. |
- **Akkordeon-Zusatzfunktionen:**
  - `EMITTER IS FIRING / PAUSED` Toggle-Schalter mit Statusanzeige.
  - Gleiche 5 Richtungs-Buttons zur Live-Umschaltung im laufenden Betrieb.

---

### 4.3 Partikel-Absorber / Sink (`sink`)
- **Ribbon-ID:** `#toolSink` | **Tool-Key:** `'sink'`
- **Funktion:** Vakuum-Absaugzone, die eintretende Partikel aus der Simulation entfernt.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich / Optionen | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Absorptionsrichtung** | `direction` | 5-Button Toggle | `[→]` `[←]` `[↓]` `[↑]` `[360°]` | – | `'360'` | – | Filtert nach Flugrichtung (z. B. nur Partikel, die sich nach rechts bewegen). |
  | **Thermischer Filter** | `tempFilterMode`| 3-Button Toggle | `[All]` / `[Hot Only]` / `[Cold Only]` | – | `'all'` | – | Selektive Absorption nach Partikeltemperatur. |
  | **Schwellentemperatur T** | `filterTemperature` | Dual-Input | 50 – 800 *(nur wenn != 'all')* | 25 | `300` | K | Trenntemperatur für den Heiß-/Kalt-Filter. |
  | **Absorptions-Effizienz**| `absorptionEfficiency`| Dual-Input | 0.10 – 1.00 (10% – 100%) | 0.05 | `1.00` | – | Wahrscheinlichkeit, mit der ein Partikel beim Durchqueren absorbiert wird. |
  | **Kapazitätsgrenze** | `maxParticles` | Dual-Input | 0 – 500 | 25 | `0` | – | `0` = unbegrenzt; schaltet Absorber nach $N$ absorbierten Partikeln ab. |
- **Akkordeon-Zusatzfunktionen:**
  - `ABSORBER IS ACTIVE / INACTIVE` Toggle-Schalter.
  - Gleiche 5 Richtungs-Buttons zur Live-Umschaltung im laufenden Betrieb.

---

### 4.4 Populations-Regulator (`regulator`)
- **Ribbon-ID:** `#toolRegulator` | **Tool-Key:** `'regulator'`
- **Funktion:** Geschlossener Zweipunkt-Dichteregler mit Hysterese-Totband zur automatischen Konstanthaltung der Partikelzahl in Kammern.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Soll-Partikelanzahl** | `targetCount` | Dual-Input | 5 – 200 | 5 | `50` | – | Angestrebte Teilchenzahl $N_\text{set}$. |
  | **Hystereseband ΔN** | `hysteresis` | Dual-Input | 1 – 15 | 1 | `3` | – | Totband $N_\text{set} \pm \Delta N$ zur Vermeidung von Regler-Schwingungen. |
  | **Gas-Temperatur T** | `temperature` | Dual-Input | 20 – 800 | 20 | `300` | K | Temperatur der bei Unterschreitung nachgefüllten Partikel. |
  | **Partikelmasse m** | `mass` | Dual-Input | 0.2 – 5.0 | 0.2 | `1.0` | – | Masse der nachgefüllten Partikel. |
  | **Max. Durchflussrate** | `rate` | Dual-Input | 1 – 50 | 1 | `15` | /s | Maximale Injektions-/Absorptionsrate pro Sekunde. |
- **Akkordeon-Zusatzfunktionen:**
  - `REGULATOR IS ACTIVE / INACTIVE` Toggle-Schalter.

---

## 5. Thermik & Wärmetausch (Thermal Triad)

- **Ribbon-Gruppe:** `THERMAL` (Row 2)

### 5.1 Thermisches Reservoir / Wärmesenke (`solid_res`)
- **Ribbon-ID:** `#toolReservoir` | **Tool-Key:** `'solid_res'`
- **Funktion:** Unendliche Wärmekapazität ($C = \infty$), konstante Temperaturzone (z. B. Kühlkörper oder Brenner).
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Konstante Temperatur T** | `temperature` | Dual-Input | 0 – 1000 | 25 | `500` | K | Feste isotherme Solltemperatur. |
  | **Thermische Kopplung κ** | `conductance` | Dual-Input | 0.05 – 1.00 | 0.05 | `0.80` | – | Stoßweiser Wärmeübergangskoeffizient auf abprallende Partikel. |

---

### 5.2 Permeabler Wärmetauscher (`heat_exchanger`)
- **Ribbon-ID:** `#toolHeatEx` | **Tool-Key:** `'heat_exchanger'`
- **Funktion:** Partikel fliegen ungehindert durch das Gitternetz (Cross-Hatch) und tauschen volumetrisch Wärme mit dem Tauscher aus.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Körper-Temperatur T** | `temperature` | Dual-Input | 0 – 1000 | 25 | `300` | K | Konstante Fluid-Wärmetauschtemperatur. |
  | **Thermische Kopplung κ** | `conductivity` | Dual-Input | 0.05 – 1.00 | 0.05 | `0.60` | – | Wärmeübertragungsrate pro Durchflug-Zeitschritt. |

---

### 5.3 Regenerator-Matrix (`regenerator`)
- **Ribbon-ID:** `#toolRegenerator` | **Tool-Key:** `'regenerator'`
- **Funktion:** Segmentierter interner Wärmespeicher für Gegenstrom-Prozesse (z. B. Stirling-Motor). Speichert Wärme beim Ausstrom und gibt sie beim Rückstrom an das Gas zurück.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich / Optionen | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Strömungsachse** | `orientation` | 2-Button Toggle | `[Horizontal]` / `[Vertical]` | – | `'horizontal'`| – | Richtung der parallelen Kapillarschichten. |
  | **Basis-Temperatur T** | `temperature` | Dual-Input | 0 – 1000 | 25 | `300` | K | Initiale Starttemperatur der Matrix-Schichten. |
  | **Gesamte Wärmekapazität C**| `heatCapacity`| Dual-Input | 50 – 1500 | 50 | `400` | J/K | Endliche Speicherfähigkeit des Regeneratormaterials. |
  | **Thermische Kopplung κ** | `conductivity` | Dual-Input | 0.05 – 1.00 | 0.05 | `0.70` | – | Wärmeübertragungskoeffizient zwischen Gas und Lamellen. |

---

### 5.4 Fester Thermoblock / Ressavoir (`storage_block`)
- **Ribbon-ID:** `#toolStorageBlock` | **Tool-Key:** `'storage_block'`
- **Funktion:** Undurchlässiges festes Hindernis mit endlicher Wärmekapazität ($C = m \cdot c_p$), das sich durch Partikelstöße dynamisch erwärmt/abkühlt.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Temperatur T** | `temperature` | Dual-Input | 0 – 1000 | 25 | `300` | K | Momentane Blocktemperatur. |
  | **Wärmekapazität C** | `heatCapacity` | Dual-Input | 50 – 1500 | 50 | `300` | J/K | Wärmekapazität des Festkörpers. |
  | **Leitfähigkeit κ** | `conductivity` | Dual-Input | 0.05 – 1.00 | 0.05 | `0.60` | – | Thermische Kopplung bei Stoßkontakt. |

---

## 6. Kolben & Arbeitstransfer (Pistons)

- **Ribbon-Gruppe:** `PISTONS` (Row 2) | **Tool-Key:** `'piston'`
- **Gemeinsame Basis-Eigenschaften:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Kolbenmasse m** | `mass` | Dual-Input | 0 – 150 | 5 | `30` | kg | Trägheitsmasse bei Gasdruck-Beschleunigung ($a = F/m$). |
  | **Leitfähigkeit κ** | `conductivity` | Dual-Input | 0.00 – 1.00 | 0.05 | `0.20` | – | Thermischer Durchgang durch den Kolbenboden. |

### 6.1 Kolben-Betriebsmodi (`mode`)
1. **Displacer (`free`):** `#toolPistonFree` – Frei schwingender Verdrängerkolben ohne externe Last.
2. **Akkumulator / Feder (`spring`):** `#toolPistonSpring` – Gasfederspeicher.
   - `Federkonstante k`: Range 10 – 500 N/m, Step 10, Default `50 N/m`.
3. **Kompressor / Motor (`motorized`):** `#toolPistonMotor` – Externe sinusförmige Arbeitszufuhr.
   - `Motorfrequenz f`: Range 0.1 – 5.0 Hz, Step 0.1, Default `0.8 Hz`.
   - `Phasenversatz φ`: Range -180° – +180°, Step 15°, Default `0°`.
4. **Expander / Dämpfer (`damper`):** `#toolPistonDamper` – Hydraulische oder mechanische Arbeitsabfuhr.
   - `Dämpfungslast γ`: Range 5 – 150 Ns/m, Step 5, Default `25 Ns/m`.

### 6.2 Interaktive Canvas-Steuerung
- **Hub-Begrenzungsgriffe (`minPos`, `maxPos`):** Ziehbare kreisförmige Anfasspunkte zur Einstellung des oberen Totpunkts (OT / TDC) und unteren Totpunkts (UT / BDC).
- **Sequencer-Kopplung:** Über den GRAFCET-Sequencer können Kolben aktiv auf OT, UT, Halt oder Freiflug gesteuert werden.

---

## 7. Ventile & Drosseln (Valves)

- **Ribbon-Gruppe:** `VALVES` (Row 2)

### 7.1 Diskrete Ventile (`valve`)
Gemeinsame Parameter für alle Ventiltypen:
- `Dicke`: 2 – 16 px, Default `4 px`.
- `Leitfähigkeit κ`: 0.00 – 1.00, Default `0.00`.

#### Ventiltypen:
1. **Manuelles Ventil (`manual_valve`):** `#toolValveManual`
   - Klickbarer Schieber während aktiver Simulation (Offen $\leftrightarrow$ Geschlossen).
2. **Rückschlagventil (`check_valve`):** `#toolValveCheck`
   - Lässt Gas nur in einer Vorzugsrichtung passieren.
   - Button: `[Flip Flow Direction (Forward → / Reverse ←)]` invertiert Sperrichtung.
3. **Überdruckventil / PRV (`relief_valve`):** `#toolValveRelief`
   - Öffnet automatisch federbelastet bei Überschreiten des Solldrucks.
   | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
   | **Auslösedruck P_max** | `triggerPressure` | Dual-Input | 50 – 1000 | 25 | `250` | Pa | Öffnungsdruck des Ventils. |
   | **Hystereseband ΔP** | `pressureHysteresis`| Dual-Input | 0 – 100 | 5 | `25` | Pa | Druckdifferenz bis zum Wieder-Schließen. |
   | **Entlastungsmodus** | `reliefMode` | Toggle-Buttons | `[1-Way]` / `[2-Way]` | – | `'oneway'` | – | Einseitiger Kammer-Überdruck vs. beidseitige Druckdifferenz. |

---

### 7.2 Variable Drossel / Joule-Thomson-Ventil (`throttle_valve`)
- **Ribbon-ID:** `#toolThrottleValve` | **Tool-Key:** `'throttle_valve'`
- **Funktion:** Verengung mit keilförmigen Backen zur Erzeugung von Drucksprüngen ($\Delta P$), Bernoulli-Effekten und Joule-Thomson-Expansion.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Bereich | Schritt | Default | Einheit | Physikalische Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Öffnungsverhältnis** | `openRatio` | Dual-Input | 0 – 100 | 5 | `30` | % | Spaltöffnung zwischen den Drosselbacken ($0\% = \text{geschlossen}$). |
  | **Dicke** | `thickness` | Dual-Input | 2 – 16 | 1 | `6` | px | Materialstärke der Drossel-Keilbacken. |
  | **Leitfähigkeit κ** | `conductivity` | Dual-Input | 0.00 – 1.00 | 0.05 | `0.00` | – | Thermische Leitfähigkeit der Drosselwände. |
- **Interaktive Canvas-Steuerung:**
  - 2 quadratische Spalt-Anfasser auf dem Canvas erlauben das direkte Auf- und Zuziehen des Querschnitts mit der Maus.

---

## 8. Messkammern & Sensoren (Sensors)

- **Ribbon-Gruppe:** `SENSORS` (Row 2) | **Tool-Key:** `'sensor'`
- **Ribbon-ID:** `#toolSensor`
- **Funktion:** Definiert eine transparente Messkammer zur kontinuierlichen Erfassung von Druck $P(t)$, Temperatur $T(t)$, Volumen $V(t)$, Partikeldichte $N(t)$ und makroskopischer Driftgeschwindigkeit $|v_\text{drift}|$.
- **Menü-Aufbau:**
  | Parameter | Key | UI-Element | Typ | Default | Bedeutung |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Kammer-Präfix** | `label` | Text Input | String | `'Chamber'` | Automatisches Zählen: Chamber A, Chamber B, ... |
  | **Kammerfarbe** | `color` | Color Picker | Hex | `'#38bdf8'` | Rahmen- und Kurvenfarbe in Telemetrie-Dashboards. |
- **Echtzeit-Telemetrie:**
  - Kammerdaten werden mit 15 Hz in den Sidebar-Karten aktualisiert.
  - Ermöglicht $P$-$V$-Indikatordiagramme für geschlossene Kreisprozesse.

---

## 9. Übersichtstabelle aller Standardwerte (`toolConfigs`)

Zur Absicherung gegen unerwünschte Abweichungen im Codebase-Zustand (`src/ui/DualInput.js`):

```javascript
export const toolConfigs = {
  wall:           { shape: 'polygon', thickness: 4, conductivity: 0.0 },
  piston:         { mass: 30, mode: 'free', springK: 50, frequency: 0.8, amplitude: 50, phase: 0, dampingCoeff: 25.0, conductivity: 0.2 },
  solid_res:      { temperature: 500, conductance: 0.8 },
  heat_exchanger: { temperature: 300, conductivity: 0.6 },
  regenerator:    { temperature: 300, heatCapacity: 400, conductivity: 0.7, orientation: 'horizontal', sliceCount: 10 },
  storage_block:  { temperature: 300, heatCapacity: 300, conductivity: 0.6 },
  valve:          { type: 'manual_valve', thickness: 4, conductivity: 0.0, allowedDirection: 1, triggerPressure: 250, pressureHysteresis: 25, reliefMode: 'oneway' },
  throttle_valve: { openRatio: 0.3, thickness: 6, conductivity: 0.0 },
  gas:            { temperature: 300, mass: 1.0, count: 30, velocityMode: 'uniform_speed' },
  regulator:      { temperature: 300, mass: 1.0, targetCount: 50, hysteresis: 3, rate: 15 },
  emitter:        { direction: 'right', rate: 8, temperature: 300, mass: 1.0, maxParticles: 0 },
  sink:           { direction: '360', tempFilterMode: 'all', filterTemperature: 300, maxParticles: 0, absorptionEfficiency: 1.0 },
  sensor:         { label: 'Chamber', color: '#38bdf8' },
  text:           { text: 'Note', fontSize: 14, color: '#94a3b8' }
};
```
