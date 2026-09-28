"""
tests/bench_gpu.py
WebGPU simulation benchmark (headless Chrome via CDP). Not part of verify_all.

Measures milliseconds per frame (4 substeps, dt = 1/60 s) for scenes of
increasing particle count and wall count:
  - gpu:    ParticleGPUCompute.step() only (pure compute cost)
  - engine: full Engine.step() incl. CPU element updates, uploads and readback

Frames are submitted back to back and awaited once (throughput per frame).

Usage:  uv run tests/bench_gpu.py [--quick]
"""
import os
import sys
import time
import json
import threading
import http.server
import socketserver
import urllib.request
import subprocess
import websocket

PORT = 8893
DEBUG_PORT = 9453
QUICK = '--quick' in sys.argv

BENCH_JS = r'''
(async () => {
  const E = window.engine;
  const G = window.gpuCompute;
  const dev = G.device;
  window.app.isAmbientSim = false;
  E.ambientBounds = null;
  E.isPaused = false;
  E.subSteps = 4;
  const adapterInfo = G.device.adapterInfo || {};

  const QUICK = %QUICK%;
  const FRAMES = QUICK ? 20 : 60;
  const WARMUP = 10;
  const dt = 1 / 60;

  // Square box sized for ~100 px^2 per particle (typical gas density)
  const buildScene = (n, obstacles) => {
    E.clear();
    const side = Math.ceil(Math.sqrt(n * 100));
    const x0 = 0, y0 = 0, x1 = side, y1 = side;
    E.addWall(x0, y0, x1, y0, { thickness: 4 });
    E.addWall(x0, y1, x1, y1, { thickness: 4 });
    E.addWall(x0, y0, x0, y1, { thickness: 4 });
    E.addWall(x1, y0, x1, y1, { thickness: 4 });
    // Obstacles: small square pillars on a grid (4 segments each)
    const perRow = Math.ceil(Math.sqrt(obstacles));
    let placed = 0;
    for (let r = 0; r < perRow && placed < obstacles; r++) {
      for (let c = 0; c < perRow && placed < obstacles; c++) {
        const cx = (c + 0.5) * side / perRow, cy = (r + 0.5) * side / perRow, h = 6;
        E.addWall(cx - h, cy - h, cx + h, cy - h, { thickness: 2 });
        E.addWall(cx + h, cy - h, cx + h, cy + h, { thickness: 2 });
        E.addWall(cx + h, cy + h, cx - h, cy + h, { thickness: 2 });
        E.addWall(cx - h, cy + h, cx - h, cy - h, { thickness: 2 });
        placed++;
      }
    }
    E.spawnGasRaster(x0 + 8, y0 + 8, side - 16, side - 16, n, 1.0, 300);
    E.syncParticlesToGPU();
    E.syncWallsToGPU();
    E.syncSinksToGPU();
  };

  // Throughput: submit all frames back to back and wait once, like the real
  // render loop (which never blocks on the GPU). A per-frame wait would add a
  // fixed multi-millisecond round-trip to every sample.
  const timeLoop = async (fn) => {
    for (let i = 0; i < WARMUP; i++) fn();
    await dev.queue.onSubmittedWorkDone();
    const t0 = performance.now();
    for (let i = 0; i < FRAMES; i++) fn();
    await dev.queue.onSubmittedWorkDone();
    return (performance.now() - t0) / FRAMES;
  };

  const scenes = QUICK
    ? [[50000, 0], [200000, 0], [200000, 64]]
    : [[50000, 0], [200000, 0], [1000000, 0], [200000, 16], [200000, 64], [200000, 120]];

  const results = [];
  for (const [n, obstacles] of scenes) {
    buildScene(n, obstacles);
    const walls = G.wallCount;
    const gpuMs = await timeLoop(() => G.step(dt, false, 350, 1.0, null, 380, 4, 0));
    buildScene(n, obstacles);
    const engineMs = await timeLoop(() => E.step(dt));
    await E.awaitGPUTelemetry();
    results.push({ particles: n, walls, gpuMs: +gpuMs.toFixed(2), engineMs: +engineMs.toFixed(2), live: E.stats.particleCount });
  }
  E.clear();
  return { adapter: [adapterInfo.vendor, adapterInfo.architecture, adapterInfo.description].filter(Boolean).join(' / '), frames: FRAMES, results };
})()
'''


def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()


def main():
    threading.Thread(target=start_server, daemon=True).start()
    time.sleep(0.5)
    chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_bench_' + str(int(time.time())))
    proc = subprocess.Popen([
        chrome, '--headless=new', '--window-size=1440,900',
        f'--remote-debugging-port={DEBUG_PORT}', f'--user-data-dir={user_data}',
        '--remote-allow-origins=*', '--enable-unsafe-webgpu', '--use-webgpu-adapter=default',
        '--enable-features=Vulkan,UseSkiaRenderer',
        f'http://127.0.0.1:{PORT}/index.html'
    ])
    try:
        ws_url = None
        for _ in range(50):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{DEBUG_PORT}/json/list', timeout=1) as r:
                    for p in json.loads(r.read().decode('utf-8')):
                        if p.get('type') == 'page' and 'index.html' in p.get('url', ''):
                            ws_url = p.get('webSocketDebuggerUrl')
                if ws_url:
                    break
            except Exception:
                pass
        if not ws_url:
            sys.exit('Could not connect to headless Chrome')

        ws = websocket.create_connection(ws_url, timeout=600)
        msg_id = [0]

        def evaluate(expr, await_promise=True):
            msg_id[0] += 1
            ws.send(json.dumps({'id': msg_id[0], 'method': 'Runtime.evaluate', 'params': {
                'expression': expr, 'awaitPromise': await_promise, 'returnByValue': True}}))
            while True:
                resp = json.loads(ws.recv())
                if resp.get('id') == msg_id[0]:
                    return resp.get('result', {})

        for _ in range(75):
            if evaluate('!!(window.engine && window.gpuCompute && window.engine.isGPUSimulating())', False).get('result', {}).get('value'):
                break
            time.sleep(0.2)

        res = evaluate(BENCH_JS.replace('%QUICK%', 'true' if QUICK else 'false'))
        if 'exceptionDetails' in res:
            sys.exit(json.dumps(res['exceptionDetails'], indent=2))
        val = res.get('result', {}).get('value', {})
        print(f"Adapter: {val.get('adapter') or 'unknown'}   frames per scene: {val.get('frames')}")
        print(f"{'particles':>10} {'walls':>6} {'gpu ms':>8} {'engine ms':>10} {'live':>9}")
        for r in val.get('results', []):
            print(f"{r['particles']:>10} {r['walls']:>6} {r['gpuMs']:>8} {r['engineMs']:>10} {r['live']:>9}")
    finally:
        proc.terminate()


if __name__ == '__main__':
    main()
