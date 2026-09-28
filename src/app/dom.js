// DOM element lookups shared by the app modules.


// Canvas DOM Elements
export const canvas = document.getElementById('simCanvas');
export const bgCanvas = document.getElementById('bgCanvas');
export const gpuCanvas = document.getElementById('gpuCanvas') || document.getElementById('glCanvas');
export const tempChartCanvas = document.getElementById('tempChartCanvas');
export const velChartCanvas = document.getElementById('velChartCanvas');

// Header & Navigation Elements
export const btnToggleGrid = document.getElementById('btnToggleGrid');
export const selectGridSize = document.getElementById('selectGridSize');
export const btnToggleSnap = document.getElementById('btnToggleSnap');
export const btnToggleVectors = document.getElementById('btnToggleVectors');
export const btnToggleColor = document.getElementById('btnToggleColor');
export const btnUndo = document.getElementById('btnUndo');
export const btnRedo = document.getElementById('btnRedo');
export const headerProjectTitle = document.getElementById('headerProjectTitle');
export const fileImportInput = document.getElementById('fileImportInput');
export const btnToolbarReset = document.getElementById('btnToolbarReset');
export const btnToolbarClear = document.getElementById('btnToolbarClear');
export const brandBadge = document.getElementById('brandBadge');
export const brandTitle = document.getElementById('brandTitle');

// Splash Screen / Welcome Dashboard Elements
export const splashOverlay = document.getElementById('splashOverlay');
const splashCard = document.getElementById('splashCard');
export const btnSplashNew = document.getElementById('btnSplashNew');
export const btnSplashOpen = document.getElementById('btnSplashOpen');
export const btnSplashResume = document.getElementById('btnSplashResume');
export const btnSplashClose = document.getElementById('btnSplashClose');
export const splashRecentContainer = document.getElementById('splashRecentContainer');
export const splashPresetsContainer = document.getElementById('splashPresetsContainer');
export const btnClearRecent = document.getElementById('btnClearRecent');

// Transform Ribbon Elements
export const btnRotate90 = document.getElementById('btnRotate90');
export const btnFlipH = document.getElementById('btnFlipH');
export const btnFlipV = document.getElementById('btnFlipV');
export const btnGroupSelected = document.getElementById('btnGroupSelected');

// Save Modal Elements
export const saveModal = document.getElementById('saveModal');
export const saveProjectNameInput = document.getElementById('saveProjectNameInput');
export const saveFilenamePreview = document.getElementById('saveFilenamePreview');
export const btnSaveClose = document.getElementById('btnSaveClose');
export const btnSaveCancel = document.getElementById('btnSaveCancel');
export const btnSaveDownload = document.getElementById('btnSaveDownload');

// Custom Chart Dashboard Modal & Elements
export const btnAddCustomChart = document.getElementById('btnAddCustomChart');
export const chartModal = document.getElementById('chartModal');
export const btnChartModalClose = document.getElementById('btnChartModalClose');
export const btnChartCancel = document.getElementById('btnChartCancel');
export const btnChartConfirm = document.getElementById('btnChartConfirm');
export const selectChartTarget = document.getElementById('selectChartTarget');
export const selectChartMetric = document.getElementById('selectChartMetric');
export const customChartsContainer = document.getElementById('customChartsContainer');

// Left Sidebar & Floating Tool Options Dialog (Onshape CAD Style)
const sidebarLeft = document.getElementById('sidebarLeft');
export const toolDialogPanel = document.getElementById('toolDialogPanel');
export const toolDialogHeader = document.getElementById('toolDialogHeader');
export const toolDialogTitle = document.getElementById('toolDialogTitle');
export const toolDialogBadge = document.getElementById('toolDialogBadge');
export const btnToolDialogClose = document.getElementById('btnToolDialogClose');
const toolDialogTitleGroup = document.getElementById('toolDialogTitleGroup');
export const helpArrowIcon = document.getElementById('helpArrowIcon');
export const toolDialogHelpPanel = document.getElementById('toolDialogHelpPanel');
export const toolPropertiesContainer = document.getElementById('toolPropertiesContainer');
export const elementsListContainer = document.getElementById('elementsListContainer');
export const elementCountBadge = document.getElementById('elementCountBadge');

// Context Popup & Menu
export const elementPopup = document.getElementById('elementPopup');
export const popupTitle = document.getElementById('popupTitle');
export const popupBody = document.getElementById('popupBody');
export const btnPopupClose = document.getElementById('btnPopupClose');

export const contextMenu = document.getElementById('contextMenu');
export const ctxDuplicate = document.getElementById('ctxDuplicate');
export const ctxGroup = document.getElementById('ctxGroup');
export const ctxBringFront = document.getElementById('ctxBringFront');
export const ctxBringForward = document.getElementById('ctxBringForward');
export const ctxSendBackward = document.getElementById('ctxSendBackward');
export const ctxSendBack = document.getElementById('ctxSendBack');
export const ctxDelete = document.getElementById('ctxDelete');

// Playback Bar & Model Toggle Controls
const modelToggleGroup = document.getElementById('modelToggleGroup');
export const modelToggleBtns = modelToggleGroup ? modelToggleGroup.querySelectorAll('.model-toggle-btn') : [];
export const btnToggleGravity = document.getElementById('btnToggleGravity');
export const btnPlayPause = document.getElementById('btnPlayPause');
export const playIcon = document.getElementById('playIcon');
export const btnStep = document.getElementById('btnStep');
export const btnStepBack = document.getElementById('btnStepBack');
export const btnStopReset = document.getElementById('btnStopReset');
export const speedSlider = document.getElementById('speedSlider');
export const speedVal = document.getElementById('speedVal');
export const timeVal = document.getElementById('timeVal');

// Zoom Controls
export const btnZoomIn = document.getElementById('btnZoomIn');
export const btnZoomOut = document.getElementById('btnZoomOut');
export const btnResetView = document.getElementById('btnResetView');
export const zoomDisplay = document.getElementById('zoomDisplay');

// Stats & Chamber Analytics
export const statN = document.getElementById('statN');
export const statT = document.getElementById('statT');
export const statE = document.getElementById('statE');
export const statV = document.getElementById('statV');
export const chamberCardsContainer = document.getElementById('chamberCardsContainer');
export const tabTemp = document.getElementById('tabTemp');
export const tabPV = document.getElementById('tabPV');

export const infoModal = document.getElementById('infoModal');
export const btnInfoClose = document.getElementById('btnInfoClose');
