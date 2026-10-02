// Hint on an empty canvas: how to start drawing, or open an example.
import { engine } from './core.js';
import { app } from './state.js';
import { showSplashScreen } from './splash.js';

const hint = document.getElementById('emptyCanvasHint');
document.getElementById('btnHintExamples')?.addEventListener('click', () => showSplashScreen({ isReturning: true }));

export function updateCanvasHint() {
  if (!hint) return;
  const empty = !app.isSplashActive && !app.isSimulating && engine.elements.length === 0 && engine.particles.length === 0;
  if (hint.hidden === empty) hint.hidden = !empty;
}
