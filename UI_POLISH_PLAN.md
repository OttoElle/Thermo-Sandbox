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
- [ ] **Duplizieren** (Ctrl+D) verliert die Gruppe (dupliziertes Rechteck = lose Wände), kopiert keine Kolben, Texte und Spawner und nur einen Teil der Eigenschaften. Besser generisch über `toJSON()`/`fromJSON()` (Phase 2/3).
- [ ] Undo von „New Canvas“ stellt die Elemente wieder her, nicht aber den Projektnamen.
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

## Phase 2 — Canvas-Interaktion & Formen (größter QoL-Hebel)

- [ ] **Werkzeug-Modi trennen**: Solange ein Erstellungswerkzeug aktiv ist (Spawner, Emitter, …), dürfen Klicks keine Nodes/Elemente greifen. Magnet-Snap auf Nodes bleibt als reines Snapping ohne Bearbeiten erhalten. Bearbeiten nur mit Select, alternativ mit gedrückter Modifier-Taste.
- [ ] **Geschlossene Formen als zusammenhängendes Objekt** (Rechteck, Polygon, Kreis, Bogen):
  - **Entscheidung** Datenmodell. Empfehlung: Die Segmente bleiben einzelne `Wall`s (GPU-Pfad, Owner-Tabelle und Wärmekopplung bleiben unverändert). Die Gruppe bekommt einen *Shape-Datensatz* (`kind`, geordnete Vertexliste, `closed`), der gemeinsame Ecken verknüpft. Wird eine Ecke gezogen, bewegen sich beide anliegenden Segmente mit, sodass die Form nicht mehr aufreißen kann.
  - „Break Shape“ (Kontextmenü/Sidebar) löst die Form in freie Segmente auf; das ist die optionale Trennung.
  - Serialisierung + Undo; alte Dateien ohne Shape-Datensatz laden weiter als lose Segmente.
- [ ] **Bounding-Box mit Resize-Griffen** für Formen und Rechteck-Elemente: Hover über Kante/Ecke zeigt den passenden Resize-Cursor (↔ ↕ ⤡), Shift = proportional, Alt = vom Zentrum aus. Kreise skalieren nur den Radius.
- [ ] **Freie Rotation**: Rotations-Griff über der Box (oder Hover knapp außerhalb einer Ecke → Rotations-Cursor). Rastet in 15°-Schritten ein, Shift = frei; Winkel wird live angezeigt. Rotate-Button im Ribbon bleibt für 90°. Inspector bekommt ein Feld „Rotation“.
- [ ] **Bemaßung statt Kästchenzählen** (ersetzt ein Measure-Tool):
  - *Beim Zeichnen*: Live-Maße für **alle** Werkzeuge (heute nur teilweise, Wände/Polylinien gar nicht): Länge + Winkel pro Segment, B × H, Radius, jeweils in derselben Einheit wie in den Eigenschaften.
  - *Direkteingabe beim Zeichnen* (CAD-Stil): Nach dem ersten Klick einfach Zahlen tippen, z. B. `200` ↵ für die Länge, `200,120` ↵ für B × H, `Tab` wechselt zwischen Länge und Winkel. Das Segment wird exakt gesetzt.
  - *Nach dem Zeichnen*: Geometrie-Felder im Inspector/Popup (X, Y, B, H bzw. Radius, Segmentlänge, Rotation), editierbar, mit Undo. Kommt aus dem Schema von Phase 3; für Phase 2 reicht vorerst Position/Größe für Formen.
  - *Bei Auswahl*: Maße an der Bounding-Box einblenden, beim Resizen live aktualisiert.
- [ ] Hover-Feedback allgemein: Hervorhebung des Elements unter der Maus, Cursor je Aktion (move/resize/rotate/vertex).
- [ ] Prüfen, welche Elemente (Kolben, Ventile, Sensor-Zonen, Blöcke) sinnvoll rotierbar sind. Auf der Physikseite sind Kolben/Rechteckzonen achsparallel; hier ggf. nur 90° erlauben und das im UI klar machen.

## Phase 3 — Einheitliche Eigenschaften & linke Sidebar

Heute gibt es vier getrennte Formular-Implementierungen: `toolPanel.js` (Tool-Dialog), `inspector.js` (Sidebar), `popup.js` (Canvas-Popup) und `SequencerActionFields.js` (Sequencer). Deshalb sind sie inkonsistent.

- [ ] **Ein Eigenschafts-Schema pro Elementtyp** (neues Modul, z. B. `src/app/elementSchema.js`): Key, Label, Einheit, Min/Max/Step, Default (aus `TOOL_CATALOG.md`), Widget-Typ, „sequenzierbar ja/nein“, Gruppe (Geometrie/Thermik/Antrieb …).
- [ ] Alle vier Oberflächen rendern aus diesem Schema, mit einem gemeinsamen Satz Feld-Controls (die `SequencerFieldControls` sind die ausgereiftesten und werden die Basis). `SequencerCatalogDefaults` wird daraus abgeleitet statt parallel gepflegt. Das löst auch den offenen Punkt „toolPanel/inspector datengetrieben zerlegen“ aus PROGRESS.
- [ ] **Element-Baum**:
  - Hierarchie: Gruppe/Form → aufklappbar → Einzelteile (Segmente); „Ungroup/Break Shape“ direkt am Eintrag.
  - Sinnvolle Namen („Rectangle 1“, „Cylinder wall“), umbenennbar per Doppelklick; die Namen tauchen dann auch im Sequencer auf.
  - Typ-Icons wie im Ribbon statt Text-Tags, Sichtbarkeit/Sperren (Auge/Schloss) pro Eintrag, Filter/Suche.
  - Auswahl synchron Canvas ↔ Baum, Hover im Baum hebt das Element im Canvas hervor.
- [ ] Inspector unter dem Baum statt Accordion-im-Baum (**Entscheidung**; Empfehlung: Baum oben, Eigenschaften der Auswahl unten, CAD-typisch).

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
