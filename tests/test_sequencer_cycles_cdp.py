"""Sequencer on a real cycle: an alpha Stirling engine in one cylinder.

Hot piston (gas on its right), regenerator and heat exchangers, cold piston
(gas on its left); the sensor chamber is bound to both pistons. Four steps:
isothermal compression, isochoric transfer, isothermal expansion, isochoric
transfer back, driven with stroke positions and "every driven piston at its
target" transitions. Checks that the cycle closes, TDC/BDC follow the gas side,
the chamber tracks both pistons, volume stays constant in the isochoric steps,
the piston face pressure is measured and every sample carries its step.

Second scenario: an insulated cylinder compressed by a piston faster than
quasi-static. No heat flows, so the work done on the gas equals dE_kin; the
P-V work from the piston face pressure has to match it, while the chamber's
equilibrium pressure misses the dynamic part.
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

sys.stdout.reconfigure(encoding='utf-8')

PORT = 8895
DEBUG_PORT = 9455


def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler) as httpd:
        httpd.serve_forever()


SCENE_JS = """
(() => {
  const E = window.engine;
  E.clear();
  const y0 = 1200, h = 120;
  E.addWall(900, y0, 1700, y0); E.addWall(900, y0 + h, 1700, y0 + h);
  E.addWall(900, y0, 900, y0 + h); E.addWall(1700, y0, 1700, y0 + h);
  const A = E.addPiston({ x: 1150, y: y0 + h / 2, width: 20, height: h, minPos: 900, maxPos: 1160, mode: 'hold', conductivity: 0 });
  const B = E.addPiston({ x: 1690, y: y0 + h / 2, width: 20, height: h, minPos: 1440, maxPos: 1700, mode: 'hold', conductivity: 0 });
  A.name = 'Hot piston'; B.name = 'Cold piston';
  E.addHeatExchanger(1165, y0 + 2, 70, h - 4, { temperature: 600, conductivity: 0.8 });
  E.addRegeneratorMatrix(1260, y0 + 2, 80, h - 4, { temperature: 450, conductivity: 0.7, heatCapacity: 400 });
  E.addHeatExchanger(1360, y0 + 2, 70, h - 4, { temperature: 300, conductivity: 0.8 });
  const s = E.addSensor(1160, y0, 520, h, { label: 'Working gas' });
  s.bindToPiston(A, 'left', true, 1);
  s.bindToPiston(B, 'right', true, 2);
  E.spawnGasRaster(1170, y0, 500, h, 150, 1, 300);
  const P = (p, command, extra = {}) => ({ targetId: p.id, type: 'piston', command, targetSpeed: 60, ...extra });
  const at = { type: 'piston', pistonId: '', pistonTarget: 'step' };
  const step = (name, actions) => ({ name, actions, transition: { type: 'compound_grid', fallbackTimeout: 0, rows: [{ conditions: [at], operators: [] }], rowOperators: [] } });
  const data = E.exportState('Stirling');
  data.cycleSequencer = { isEnabled: true, isLooping: true, activeStepIndex: 0, currentCycleCount: 1, steps: [
    step('Compression', [P(A, 'hold'), P(B, 'drive_to', { strokeTarget: 50 })]),
    step('Heating', [P(A, 'drive_to', { strokeTarget: 50 }), P(B, 'drive_tdc')]),
    step('Expansion', [P(A, 'drive_bdc'), P(B, 'hold')]),
    step('Cooling', [P(A, 'drive_tdc'), P(B, 'drive_bdc')])
  ] };
  E.importState(data);
  window.sequencerUI?.render();
  return { pistons: E.pistons.length, bindings: E.sensors[0].getPistonBindings().length };
})()
"""

RUN_JS = """
(async () => {
  const E = window.engine;
  const seq = E.sequencer;
  const s = E.sensors[0];
  const [A, B] = E.pistons;
  E.isPaused = false;
  const dt = 1 / 30;
  let prevStep = seq.activeStepIndex;
  const cycleStarts = [];       // hot piston position when step 0 begins
  const isoVolumes = { 1: [], 3: [] };
  let maxEdgeError = 0;
  for (let i = 0; i < 1500 && seq.currentCycleCount < 4; i++) {
    E.step(dt);
    if (E.isGPUSimulating()) await E.awaitGPUTelemetry();
    const st = seq.activeStepIndex;
    if (st !== prevStep && st === 0) cycleStarts.push({ A: A.getPos(), B: B.getPos() });
    prevStep = st;
    if (st === 1 || st === 3) isoVolumes[st].push(s.width * s.height);
    maxEdgeError = Math.max(maxEdgeError, Math.abs(s.x - (A.x + A.width / 2)), Math.abs(s.x + s.width - (B.x - B.width / 2)));
  }
  const spread = a => a.length ? (Math.max(...a) - Math.min(...a)) / Math.max(...a) : 1;
  const limitsA = A.getTravelLimits(), limitsB = B.getTravelLimits();
  const face = s.historyFacePressure.filter(Number.isFinite);
  const mean = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  return {
    cycles: seq.currentCycleCount, time: E.totalTime, gpu: E.isGPUSimulating(),
    particles: E.stats.particleCount, inChamber: s.particleCount,
    cycleStarts, aTdc: limitsA.maxTravel, bBdc: limitsB.maxTravel,
    isoSpread1: spread(isoVolumes[1]), isoSpread3: spread(isoVolumes[3]),
    maxEdgeError,
    faceSamples: face.length, faceMean: mean(face), bulkMean: mean(s.historyPressure),
    steps: [...new Set(s.historyStep)].sort(),
    summary: document.querySelector('.seq-transition-node[data-step-trans="0"] .seq-trans-desc')?.textContent || ''
  };
})()
"""


ADIABATIC_JS = """
(async () => {
  const E = window.engine;
  E.clear();
  const y0 = 1200, h = 120;
  E.addWall(1000, y0, 1600, y0); E.addWall(1000, y0 + h, 1600, y0 + h); E.addWall(1000, y0, 1000, y0 + h);
  const p = E.addPiston({ x: 1500, y: y0 + h / 2, width: 20, height: h, minPos: 1080, maxPos: 1600, mode: 'hold', conductivity: 0 });
  const s = E.addSensor(1000, y0, 490, h, { label: 'Gas' });
  s.bindToPiston(p, 'right');
  E.spawnGasRaster(1000, y0, 490, h, 150, 1, 300);
  const step = (name, a, cond) => ({ name, actions: [{ targetId: p.id, type: 'piston', targetSpeed: 40, ...a }], transition: { fallbackTimeout: 0, rows: [{ conditions: [cond], operators: [] }], rowOperators: [] } });
  const data = E.exportState('Adiabatic');
  data.cycleSequencer = { isEnabled: true, isLooping: false, activeStepIndex: 0, currentCycleCount: 1, steps: [
    step('Compress', { command: 'drive_to', strokeTarget: 30 }, { type: 'piston', pistonId: '', pistonTarget: 'step' }),
    step('Rest', { command: 'hold' }, { type: 'duration', duration: 30 })
  ] };
  E.importState(data);
  E.isPaused = false;
  const dt = 1 / 30;
  for (let i = 0; i < 400 && E.sequencer.activeStepIndex === 0; i++) {
    E.step(dt);
    if (E.isGPUSimulating()) await E.awaitGPUTelemetry();
  }
  for (let i = 0; i < 30; i++) {  // let the centred face-pressure window pass the turning point
    E.step(dt);
    if (E.isGPUSimulating()) await E.awaitGPUTelemetry();
  }
  const sensor = E.sensors[0];
  const V = sensor.historyVolume, K = sensor.historyKineticEnergy;
  const work = (P) => {
    let w = 0;
    for (let i = 1; i < P.length; i++) if (Number.isFinite(P[i]) && Number.isFinite(P[i - 1])) w += 0.5 * (P[i] + P[i - 1]) * (V[i] - V[i - 1]) / 100;
    return w;
  };
  return { dE: K[K.length - 1] - K[0], wFace: work(sensor.historyFacePressure), wBulk: work(sensor.historyPressure),
           particles: sensor.particleCount, compressed: V[0] / V[V.length - 1] };
})()
"""


def main():
    threading.Thread(target=start_server, daemon=True).start()
    time.sleep(0.5)
    chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_seq_cycles_' + str(int(time.time())))
    proc = subprocess.Popen([
        chrome, '--headless=new', '--window-size=1440,900',
        f'--remote-debugging-port={DEBUG_PORT}', f'--user-data-dir={user_data}',
        '--remote-allow-origins=*', '--enable-unsafe-webgpu', '--enable-features=Vulkan,UseSkiaRenderer',
        f'http://127.0.0.1:{PORT}/index.html'
    ])
    try:
        ws_url = None
        for _ in range(50):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{DEBUG_PORT}/json/list', timeout=1) as resp:
                    for p in json.loads(resp.read().decode('utf-8')):
                        if p.get('type') == 'page' and 'index.html' in p.get('url', ''):
                            ws_url = p.get('webSocketDebuggerUrl')
                if ws_url:
                    break
            except Exception:
                pass
        assert ws_url, 'no debuggable page'
        ws = websocket.create_connection(ws_url, timeout=180)
        msg = [0]

        def ev(expr):
            msg[0] += 1
            ws.send(json.dumps({'id': msg[0], 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'awaitPromise': True, 'returnByValue': True}}))
            while True:
                r = json.loads(ws.recv())
                if r.get('id') == msg[0]:
                    res = r.get('result', {})
                    if 'exceptionDetails' in res:
                        raise RuntimeError(json.dumps(res['exceptionDetails'])[:800])
                    return res.get('result', {}).get('value')

        for _ in range(50):
            if ev('!!(window.engine && window.sequencerUI)'):
                break
            time.sleep(0.2)
        time.sleep(1.5)  # GPU compute initialises asynchronously
        ev("document.getElementById('btnSplashNew')?.click()")

        built = ev(SCENE_JS)
        print('Scene:', built)
        assert built['pistons'] == 2 and built['bindings'] == 2, built

        r = ev(RUN_JS)
        print('Run:', json.dumps(r, indent=1))
        assert r['cycles'] >= 3, f"cycle did not repeat: {r['cycles']} cycles in {r['time']:.1f} s"
        # Closed cycle: every cycle starts with the hot piston at its TDC (gas on its right -> max travel)
        for c in r['cycleStarts']:
            assert abs(c['A'] - r['aTdc']) < 4, f"hot piston not at TDC at cycle start: {c}"
            assert abs(c['B'] - r['bBdc']) < 4, f"cold piston not at BDC at cycle start: {c}"
        assert r['isoSpread1'] < 0.03 and r['isoSpread3'] < 0.03, f"volume not constant in isochoric steps: {r['isoSpread1']:.3f}, {r['isoSpread3']:.3f}"
        assert r['maxEdgeError'] < 0.5, f"chamber does not follow both pistons: {r['maxEdgeError']}"
        assert r['faceSamples'] > 50 and r['faceMean'] > 0, 'no piston face pressure recorded'
        ratio = r['faceMean'] / max(1e-9, r['bulkMean'])
        assert 0.6 < ratio < 2.5, f'piston face pressure implausible vs. gas pressure: ratio {ratio:.2f}'
        assert r['steps'] == [0, 1, 2, 3], f"samples miss sequencer steps: {r['steps']}"
        assert 'Pistons at target' in r['summary'], f"unexpected transition summary: {r['summary']}"

        a = ev(ADIABATIC_JS)
        print('Adiabatic:', a)
        assert a['particles'] == 150 and a['compressed'] > 2 and a['dE'] > 1e6, f'compression did not heat the gas: {a}'
        err = abs(a['wFace'] + a['dE']) / a['dE']
        assert err < 0.05, f"P-V work from the piston pressure misses the energy balance by {err:.1%}: {a}"
        assert -a['wBulk'] < 0.9 * a['dE'], f"chamber pressure unexpectedly captures the dynamic work: {a}"
        print('\nSEQUENCER CYCLE TEST PASSED')
    finally:
        proc.terminate()


if __name__ == '__main__':
    main()
