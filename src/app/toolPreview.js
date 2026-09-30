// Live previews of the active drawing tool on the canvas.
import { renderer } from './core.js';
import { app, pointer } from './state.js';
import { toolConfigs } from './toolPanel.js';
import { getDraftMeasurement } from './dimensions.js';

// Live Previews
export function renderLiveToolPreviews() {
  const ctx = renderer.ctx;
  ctx.save();
  ctx.translate(renderer.panX, renderer.panY);
  ctx.scale(renderer.zoom, renderer.zoom);

  // Polygon Line Preview
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length > 0 && pointer.currentCursorWorld) {
    const last = pointer.polygonPoints[pointer.polygonPoints.length - 1];
    const p0 = pointer.polygonPoints[0];
    const closeDist = 18 / renderer.zoom;
    const isNearStart = pointer.polygonPoints.length >= 2 && (
      Math.hypot(pointer.currentCursorWorld.x - p0.x, pointer.currentCursorWorld.y - p0.y) < closeDist ||
      (renderer.snapCursor && renderer.snapCursor.x === p0.x && renderer.snapCursor.y === p0.y)
    );

    const targetX = isNearStart ? p0.x : pointer.currentCursorWorld.x;
    const targetY = isNearStart ? p0.y : pointer.currentCursorWorld.y;

    // Draw dashed connecting line
    ctx.save();
    ctx.strokeStyle = isNearStart ? '#38bdf8' : '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Draw vertex markers for placed points
    for (let i = 0; i < pointer.polygonPoints.length; i++) {
      const pt = pointer.polygonPoints[i];
      const isStart = (i === 0);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isStart ? 6 / renderer.zoom : 4 / renderer.zoom, 0, Math.PI * 2);
      ctx.fillStyle = isStart ? (isNearStart ? '#38bdf8' : '#eab308') : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / renderer.zoom;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Highlight start node when hovering to close
    if (isNearStart) {
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 11 / renderer.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5 / renderer.zoom;
      ctx.setLineDash([]);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(11, 13 / renderer.zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Click to close', p0.x, p0.y - (14 / renderer.zoom));
    }

    ctx.restore();
  }

  // Arc Preview
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'arc' && pointer.arcSteps.length > 0 && pointer.currentCursorWorld) {
    const c = pointer.arcSteps[0];
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    if (pointer.arcSteps.length === 1) {
      const r = Math.hypot(pointer.currentCursorWorld.x - c.x, pointer.currentCursorWorld.y - c.y);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    } else if (pointer.arcSteps.length === 2) {
      const p1 = pointer.arcSteps[1];
      const r = Math.hypot(p1.x - c.x, p1.y - c.y);
      const a1 = Math.atan2(p1.y - c.y, p1.x - c.x);
      const a2 = Math.atan2(pointer.currentCursorWorld.y - c.y, pointer.currentCursorWorld.x - c.x);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, a1, a2); ctx.stroke();
    }
  }

  // Live dimensions of the current draft
  const m = getDraftMeasurement();
  if (m) renderer.drawHudLabel(m.x, m.y, m.text);

  ctx.restore();
}
