// Mutable app-wide state shared by the src/app modules. ES module bindings
// are read-only for importers, so shared variables live on these objects.

// Workflow state
export const app = {
  currentProjectName: 'Untitled Simulation',
  isSimulating: false,
  isSplashActive: true,
  isAmbientSim: true,
  hasActiveSession: false,
  activeTool: 'select',
  selectedItems: [],
};
window.app = app; // for tests and console debugging

// Mouse, drag and drawing-draft state
export const pointer = {
  isMouseDown: false,
  isPanning: false,
  panStartScreen: { x: 0, y: 0 },
  panStartCamera: { x: 0, y: 0 },
  dragStartWorld: null,
  currentCursorWorld: null,
  polygonPoints: [],
  polygonGroupId: null,
  polygonWalls: [],
  arcSteps: [],
  draggingHandle: null,
  isMovingSelection: false,
  moveStartWorld: null,
  pendingStart: null, // first corner of a click-move-click drawing
};

export function resetPolygonDraft() {
  pointer.polygonPoints = [];
  pointer.polygonGroupId = null;
  pointer.polygonWalls = [];
  pointer.pendingStart = null;
}
