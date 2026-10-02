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

## Phase 4 — Auswertung / Charts ✅ (2026-10-01, PROGRESS AI)

- [x] **Vollständiger Verlauf** (`src/physics/HistoryBuffer.js`): Nichts wird mehr verworfen. Die letzten ~40 s bleiben in voller Auflösung, ältere Samples liegen in gleichmäßigen Zeit-Buckets (1 h ≈ 3000 Samples). Jedes Sample trägt den Sequencer-Zyklus.
- [x] **Einheitliche Chart-Komponente** (`src/analytics/ChartView.js`):
  - Gilt für Systemverlauf, Kammerkarten, Custom Charts und den großen Dialog.
  - Achsen mit „schönen“ Werten und Einheiten, Legende ab zwei Reihen, Fadenkreuz und Tooltip.
  - Min/Max je Pixelspalte (Spitzen bleiben sichtbar), scharf auf HiDPI.
  - Validierte Farbpalette; neue Sensoren bekommen der Reihe nach eigene Farben.
- [x] **Vergrößerte Ansicht** (`src/app/chartViewer.js`): Metrik und Quelle wählbar, Bereich All / letzte 60 s / 10 s, Zoom per Mausrad, Pan per Ziehen, Doppelklick zeigt alles.
- [x] **Export**:
  - PNG und CSV pro Chart.
  - File → Export Data als CSV (Long-Format) oder JSON mit allen Zeitreihen.
- [x] **P-V-Diagramm**: Der laufende Zyklus ist kräftig, frühere sind blass. Arbeit pro Zyklus W = ∮P dV / 100 in denselben Einheiten wie E_kin (vorher Faktor 1e-4, also um ×100 daneben). Vorher war der P-V-Tab des Systemverlaufs nur ein Platzhalter.
- [ ] Erkenntnis für Phase 5: Der Sensor misst den mittleren Gleichgewichtsdruck. Bei Kolbengeschwindigkeiten nahe der thermischen Geschwindigkeit fehlt deshalb die Stoßarbeit an der Kolbenfläche im P-V-Diagramm (gemessen: ΔE_kin ≈ +2,7 MJ pro Zyklus bei W_Sensor ≈ +2,7 MJ). Abhilfe: eine Kurve „Druck an der Kolbenfläche“ aus dem Kolbenimpuls.

## Phase 5 — Sequencer an echten Kreisprozessen erproben ✅ (2026-10-02, PROGRESS AJ)

- [x] Drei Kreisprozesse selbst gebaut (`scratch/cycles.js`, nicht die Presets): Carnot-artig (Wärmetauscher heiß/kalt umgeschaltet, adiabat), Otto (Kompression, isochore Wärmezufuhr, Arbeitstakt, isochore Kühlung), Alpha-Stirling (zwei Kolben, Regenerator, zwei Wärmetauscher).
- [x] Gefundene Lücken, behoben:
  - Kolben kannten nur TDC/BDC: Isotherme Abschnitte ließen sich nur über die Zeit steuern, und der Zyklus wanderte (TDC 1263 → 1238 → 1216 → 1210 px). Neu: **„Drive to stroke position“** (0 % = TDC, 100 % = BDC) und die Bedingung **„Stroke ≥ / ≤ x %“**.
  - TDC war immer die kleine Koordinate. Liegt das Gas rechts vom (oder unter dem) Kolben, war TDC das größte Volumen. Neu: Die Seite des Gases kommt aus der gebundenen Messkammer.
  - Eine Kammer zwischen zwei Kolben (Alpha-Stirling) ließ sich nicht messen. Neu: zweite Kolbenbindung für die gegenüberliegende Kante.
  - Das 10-s-Sicherheitszeitlimit war immer an und schnitt langsame Schritte ab. Neu: standardmäßig aus, frei einstellbar.
  - Bedingungen nur auf P und T. Neu: auch auf V, N und den Kolbendruck.
  - Übergangsdialog: eigene Controls, „Piston 1“ statt Namen, deutsche Reste. Neu: gemeinsame Property-Form, Elementnamen, lesbare Zusammenfassungen.
  - P-V-Arbeit aus dem Kammerdruck verfehlt bei zügigen Kolben die Hälfte der Arbeit. Neu: **Kolbendruck** aus dem Impulsübertrag mit P-V-Diagramm (Kolben); die Arbeit stimmt auf 1–2 % mit ΔE.
  - Zyklusphasen im Diagramm: Neu sind nummerierte Marken an jedem Schrittbeginn und der Schrittname im Tooltip.
- [x] Nicht gebraucht, daher nicht gebaut: Rampen, parallele Zweige, dP/dt-Bedingungen. Schritt kopieren und verschieben gab es schon.
- [x] Die Sequencer-Felder (auch die Bedingungen) kommen aus dem Schema bzw. der gemeinsamen Property-Form. `src/control/` bleibt unter 350 Zeilen pro Datei.

## Phase 6 — Splash, Onboarding, Feinschliff

- [ ] Splash: Thumbnails für Presets/Recent (Canvas-Snapshot beim Speichern), „Continue last session“, kompakteres Layout. Die Presets werden später ohnehin durch eigene ersetzt.
- [ ] Leerer Canvas: dezenter Hinweis („Draw a wall with R / P …“).
- [ ] Shortcut-Übersicht aktualisieren, Tooltips mit Shortcuts vereinheitlichen.
- [ ] Konsistenz-Pass: Abstände, Schriftgrößen, Icon-Stil, Fokus-Zustände, Tastaturbedienung der Dialoge, Fenstergrößen 1366 → 2560 px.
- [ ] Autosave in `localStorage` (Absturz/Reload verliert sonst die Szene).

---

## Empfohlene Reihenfolge

1 → 2 → 3 → 4 → 5 → 6. Phase 1 ist schnell und macht den Rundgang durch alle weiteren Phasen angenehmer. Phase 2 behebt das, was beim Bauen am meisten stört. Phase 3 kommt vor dem Sequencer, weil dessen Felder davon abhängen. Phase 4 ist unabhängig und kann eingeschoben werden.
