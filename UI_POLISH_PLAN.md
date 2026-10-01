# UI-Polish-Plan (Frontend-Durchgang)

Ziel: Das bestehende Frontend systematisch durchgehen und nachbessern, ohne es neu zu schreiben. Keine großen neuen Physik-Features. Jede Phase ist in 1–2 Sessions machbar, liefert ein nutzbares Ergebnis und endet mit grünem `verify_all` und einem PROGRESS-Eintrag.

## Arbeitsweise pro Phase

1. **Audit**: App im Browser-Pane durchklicken (Bundle *und* `?dev`), Screenshots nach `scratch/`, Befunde als Checkliste in diesen Plan eintragen.
2. **Kurz abstimmen**, wenn es eine Design-Entscheidung gibt (in den Phasen unten als **Entscheidung** markiert).
3. **Umsetzen** in kleinen Commits, und zwar datengetrieben statt pro Elementtyp kopiert, wo es sich anbietet.
4. **Absichern**: `test_ui_smoke_cdp.py` für jede neue Interaktion erweitern (echte Maus-Events), bei Bedarf eigene CDP-Tests.
5. PROGRESS.md / INDEX.md aktualisieren.

Querschnitt für alle Phasen: dieselben Design-Tokens (`css/variables.css`), einheitliche Begriffe/Einheiten laut `TOOL_CATALOG.md`, jede Aktion mit Tooltip + Shortcut, kein Feature nur im CPU- oder nur im GPU-Pfad.

---

## Bereits gefundene Befunde (erster Rundgang)

- [x] **Geschwindigkeitsvektoren fehlen komplett, sobald WebGPU aktiv ist**: `Renderer.js` zeichnet das Vektor-Overlay nur im Nicht-GPU-Zweig. `isGPUSimulating()` ist aber schon im Edit-Modus true, also werden Vektoren (und die Auswahl-Hervorhebung einzelner Partikel) nie gezeichnet. Fix: eigener Instanced-Line-Pass in `ParticleGPURenderer`, der direkt aus dem Compute-Puffer liest (zero-copy, skaliert auch bei 1 Mio.).
- [x] **Ribbon läuft über**: Die Bauteil-Zeile ist bei 1600 px Breite 1815 px breit, VALVES/SENSORS werden abgeschnitten.
- [x] **Nach dem Laden eines Presets/Profils wird die Ansicht nicht auf den Inhalt eingepasst**: Die Szene liegt oben links halb unter dem Header. Nötig ist „Zoom to Fit“ beim Laden und als Befehl.
- [ ] **Linke Sidebar**: flache Liste „Wall 1…10“, Gruppen heißen „Group (1 items)“ (Grammatik, kein Name, kein Typ), Labels werden abgeschnitten.
- [ ] **Charts** zeigen nur ein rollendes Fenster (`historyTemp.shift()` in `Engine.js`/`SensorZone.js`), der Verlauf geht verloren.
- [x] **Duplizieren** (Ctrl+D) verliert die Gruppe (dupliziertes Rechteck = lose Wände), kopiert keine Kolben, Texte und Spawner und nur einen Teil der Eigenschaften. Besser generisch über `toJSON()`/`fromJSON()` (Phase 2/3).
- [ ] Undo von „New Canvas“ stellt die Elemente wieder her, nicht aber den Projektnamen.
- [x] **Element-Popup** (`popup.js`) ist toter Code: `openPopup` wird nirgends aufgerufen, und seine Löschen-Buttons würden das Element nicht aus `engine.elements` entfernen. In Phase 3 entfernen oder durch das Schema ersetzen.
- [ ] Ohne WebGPU werden gar keine Partikel gezeichnet (es gibt nur das Fehler-Overlay). Das ist so gewollt, aber im Hinterkopf behalten.
- [ ] Tippfehler/Begriffe: „Ressavoir“ (Thermal Reservoir), „Sink“ im Thermal-Ribbon vs. „Absorber“ bei den Partikeln (zwei verschiedene Dinge heißen fast gleich).

---

## Phase 1 — Ribbon, Menüs, View ✅ (2026-09-30, PROGRESS AF)

**Ribbon Zeile 1, neue Gruppierung:**
| Gruppe | Inhalt |
|---|---|
| HISTORY | Undo, Redo, Reset (t=0), Clear |
| TOOLS | Select, Text (unverändert) |
| TRANSFORM | Rotate, Flip H/V, Group/Ungroup |
| GRID | Grid an/aus, Rastergröße, Snap |
| VIEW | Vektoren, Farbe (bestehende Optionen) |

- [x] Gruppen umbauen, Reset/Clear zu Undo/Redo verschieben. Clear bekommt eine Bestätigung (oder ist per Undo rückgängig machbar).
- [x] Vektor-Bug beheben (siehe oben).
- [x] Zoom to Fit beim Laden (Bugfix; als Befehl im View-Menü).
- [x] Ribbon responsiv: Bauteilgruppen bei Platzmangel auf Icon-only oder Überlauf-Menü umschalten.
- *Zurückgestellt (Entscheidung 2026-09-30)*: neue View-Optionen und neue allgemeine Tools (Pan/Measure/Probe). Der Bedarf hinter „Measure“ wird in Phase 2 über die Bemaßung gelöst.
- [x] **Menüs neu ordnen:**
  - *File*: New (= Clear) · Open… · Open Recent ▸ · Examples ▸ (Presets) · Save (Ctrl+S) · Save As… · Export ▸ (PNG-Screenshot; Telemetrie CSV/JSON folgt in Phase 4)
  - *Edit*: Undo · Redo · Cut/Copy/Paste · Duplicate · Select All · Delete · Group · Ungroup (Break Shape folgt in Phase 2)
  - *View*: Grid/Snap · Vektoren · Farbe · Zoom In/Out/Fit
  - *Simulation* (neu): Play/Pause · Step · Step Back · Reset · Physics Model ▸ · Gravity · Speed
  - *Help*: Guide · Shortcuts · About
- [x] Menüeinträge zeigen Häkchen/Shortcut rechtsbündig. Deaktivierte Einträge werden ausgegraut (z. B. Ungroup ohne Gruppe).

## Phase 2 — Canvas-Interaktion & Formen ✅ (2026-09-30, PROGRESS AG)

- [x] **Werkzeug-Modi getrennt**: Griffe, Vertices und der Transformationsrahmen reagieren nur mit dem Select-Tool. Der Magnet-Snap auf Wandenden bleibt beim Zeichnen erhalten.
- [x] **Geschlossene Formen hängen zusammen**. Datenmodell (entschieden): Die Segmente bleiben einzelne `Wall`s mit `groupId`. Eine Ecke zu ziehen bewegt alle Segment-Enden derselben Gruppe an diesem Punkt; `Ctrl` löst ein einzelnes Ende. Die Formart steckt im vorhandenen Präfix der Gruppen-ID (`g_rect_`, `g_circle_`, `g_arc_`, `g_poly_`). „Ungroup“ ist das Auftrennen. Alte Dateien funktionieren unverändert.
- [x] **Transformationsrahmen** (`src/app/transform.js`): 8 Griffe, Rahmenkanten, passende Resize-Cursor, Shift = proportional, Alt = vom Zentrum, Kanten rasten auf das Grid.
- [x] **Freie Rotation**: Griff über dem Rahmen oder das Band knapp außerhalb einer Ecke (Rotations-Cursor). 15°-Raster, Shift = frei, Winkel live. Auswahlen mit achsparallelen Elementen (Kolben, Zonen, Blöcke, Texte) drehen nur in 90°-Schritten, inklusive Kolbenhub, Orientierung und Richtung von Emitter/Absorber.
- [x] **Bemaßung** (`src/app/dimensions.js`):
  - Live-Maße für alle Werkzeuge.
  - Klick-Klick-Zeichnen und Zahleneingabe während des Zeichnens (`W, H`, `Länge, Winkel`, `R`).
  - Maß-Label am Rahmen bzw. an einer einzelnen Wand: Ein Klick darauf öffnet die Eingabe, vorausgefüllt und per Undo rückgängig machbar.
  - Offen für Phase 3: X/Y- und Rotationsfelder im Inspector; hier ist das Schema die richtige Stelle.
- [x] **Hover-Feedback**: Das Element unter der Maus wird dezent hervorgehoben, dazu Cursor je Aktion (move, resize, rotate, text).
- [x] **Duplizieren generisch** über `Engine.cloneElement()`/`addElement()`: Gruppen bleiben Gruppen, Kolben, Texte und Spawner (mit Partikeln) werden mitkopiert, und Sensoren binden sich an den kopierten Kolben.
- [x] Nebenbei: Die Z-Reihenfolge geht bei Undo, Speichern und Laden nicht mehr verloren (`elementOrder` im Zustand).

## Phase 3 — Einheitliche Eigenschaften & linke Sidebar ✅ (2026-10-01, PROGRESS AH)

Heute gibt es vier getrennte Formular-Implementierungen: `toolPanel.js` (Tool-Dialog), `inspector.js` (Sidebar), `popup.js` (Canvas-Popup) und `SequencerActionFields.js` (Sequencer). Deshalb sind sie inkonsistent.

- [x] **Ein Eigenschafts-Schema pro Elementtyp** (neues Modul, z. B. `src/app/elementSchema.js`): Key, Label, Einheit, Min/Max/Step, Default (aus `TOOL_CATALOG.md`), Widget-Typ, „sequenzierbar ja/nein“, Gruppe (Geometrie/Thermik/Antrieb …).
- [x] Alle vier Oberflächen rendern aus diesem Schema, mit einem gemeinsamen Satz Feld-Controls (die `SequencerFieldControls` sind die ausgereiftesten und werden die Basis). `SequencerCatalogDefaults` wird daraus abgeleitet statt parallel gepflegt. Das löst auch den offenen Punkt „toolPanel/inspector datengetrieben zerlegen“ aus PROGRESS.
- [x] **Element-Baum** (ohne Sichtbarkeit/Sperren; das bräuchte eigene Physik-Semantik):
  - Hierarchie: Gruppe/Form → aufklappbar → Einzelteile (Segmente); „Ungroup/Break Shape“ direkt am Eintrag.
  - Sinnvolle Namen („Rectangle 1“, „Cylinder wall“), umbenennbar per Doppelklick; die Namen tauchen dann auch im Sequencer auf.
  - Typ-Icons wie im Ribbon statt Text-Tags, Sichtbarkeit/Sperren (Auge/Schloss) pro Eintrag, Filter/Suche.
  - Auswahl synchron Canvas ↔ Baum, Hover im Baum hebt das Element im Canvas hervor.
- [x] Inspector unter dem Baum statt Accordion-im-Baum (**Entscheidung**; Empfehlung: Baum oben, Eigenschaften der Auswahl unten, CAD-typisch).

## Phase 4 — Auswertung / Charts (rechte Sidebar)

- [ ] **Vollständiger Verlauf**: Zeitreihen nicht mehr per `shift()` verwerfen, sondern in einem wachsenden Puffer mit Dezimierung speichern (z. B. min/max-Buckets, damit auch Stunden Simulation in Speicher passen). Chart-Ansicht: „Follow“ (letzte N s) oder „All“, Zoom/Pan per Mausrad/Drag.
- [ ] **Vergrößerte Ansicht**: Chart per Klick in ein großes Modal/Panel (Achsen mit Einheiten, Legende, Crosshair mit Werten).
- [ ] **Export**: PNG pro Chart, CSV/JSON aller Zeitreihen (steht auch schon in PROGRESS „Next Steps“).
- [ ] P-V-Diagramm: Zyklen farblich trennen, Fläche = Arbeit schraffieren, W_net pro Zyklus anzeigen (Anbindung an den Sequencer-Zykluszähler).
- [ ] Chamber-Karten und Custom Charts optisch vereinheitlichen, gleiche Kennzahlen-Formatierung (`dataviz`-Regeln: Farben, Einheiten, Tausendertrennung).

## Phase 5 — Sequencer an echten Kreisprozessen erproben

- [ ] Drei Referenz-Kreisprozesse *selbst* bauen (nicht die Gemini-Presets): Stirling (Verdränger + Arbeitskolben, Regenerator), Carnot-ähnlich (isotherm über Reservoir-Umschaltung, adiabat), Otto/Joule (Ventile + Kolben). Dabei alles notieren, was fehlt oder hakt.
- [ ] Erwartbare Lücken (prüfen, nicht vorab bauen): Bedingungen auf abgeleitete Größen (Volumen einer Zone, V/T-Schwellwert, dP/dt); Rampen statt Sprung-Aktionen (Temperatur/Position über Zeit); parallele Zweige bzw. Aktionen, die über mehrere Schritte gelten; Schritt kopieren/verschieben; Markierung der Zyklusphasen im P-V-Diagramm.
- [ ] Sequencer-Felder kommen aus dem Schema von Phase 3 (einheitlich mit Tool/Sidebar).
- [ ] Die 350-Zeilen-Grenze für `src/control/` bleibt bestehen.

## Phase 6 — Splash, Onboarding, Feinschliff

- [ ] Splash: Thumbnails für Presets/Recent (Canvas-Snapshot beim Speichern), „Continue last session“, kompakteres Layout. Die Presets werden später ohnehin durch eigene ersetzt.
- [ ] Leerer Canvas: dezenter Hinweis („Draw a wall with R / P …“).
- [ ] Shortcut-Übersicht aktualisieren, Tooltips mit Shortcuts vereinheitlichen.
- [ ] Konsistenz-Pass: Abstände, Schriftgrößen, Icon-Stil, Fokus-Zustände, Tastaturbedienung der Dialoge, Fenstergrößen 1366 → 2560 px.
- [ ] Autosave in `localStorage` (Absturz/Reload verliert sonst die Szene).

---

## Empfohlene Reihenfolge

1 → 2 → 3 → 4 → 5 → 6. Phase 1 ist schnell und macht den Rundgang durch alle weiteren Phasen angenehmer. Phase 2 behebt das, was beim Bauen am meisten stört. Phase 3 kommt vor dem Sequencer, weil dessen Felder davon abhängen. Phase 4 ist unabhängig und kann eingeschoben werden.
