"""Every start-screen example runs and shows the effect it describes.

Loads each example through window.loadExample (the start screen's path),
simulates it with GPU telemetry and checks the physics claim of its card:
Maxwell-Boltzmann relaxation, thermal equilibrium without mixing, free
expansion at constant temperature, barometric layering, adiabatic heating,
and positive net work per cycle for the three engines.
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

PORT = 8896
DEBUG_PORT = 9456

RUN_JS = r"""
(async (key, seconds, maxCycles) => {
  const E = window.engine;
  const state = window.loadExample(E, window.Examples[key]);
  E.importState(state);
  E.ambientBounds = null;
  E.isPaused = false;
  const dt = 1 / 30;
  const t0 = performance.now();
  const sensors = E.sensors;
  const first = sensors.map(s => ({ n: s.particleCount }));
  const speeds0 = E.particles.map(p => Math.hypot(p.vel.x, p.vel.y));
  const particles0 = E.particles.length;
  const T0 = E.stats.systemTemperature, E0 = E.stats.totalKineticEnergy;
  let maxT = 0;
  for (let i = 0; i < seconds / dt; i++) {
    E.step(dt);
    if (E.isGPUSimulating()) await E.awaitGPUTelemetry();
    maxT = Math.max(maxT, ...sensors.map(s => s.temperature));
    if (maxCycles && E.sequencer.currentCycleCount > maxCycles) break;
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const rel = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))) / m; };
  // Net work of the gas per completed sequencer cycle from the piston face pressure
  const cycleWork = (s) => {
    const P = s.historyFacePressure, V = s.historyVolume, C = s.historyCycle;
    const out = {};
    for (let i = 1; i < P.length; i++) {
      if (!Number.isFinite(P[i]) || !Number.isFinite(P[i - 1]) || C[i] !== C[i - 1]) continue;
      out[C[i]] = (out[C[i]] || 0) + 0.5 * (P[i] + P[i - 1]) * (V[i] - V[i - 1]) / 100;
    }
    return out;
  };
  const tail = (s, key, n = 60) => mean(s[key].slice(-n));
  return {
    key, simTime: E.totalTime, wall: (performance.now() - t0) / 1000, gpu: E.isGPUSimulating(),
    particles0, particles: E.stats.particleCount, T0, energyDrift: E.stats.totalKineticEnergy / E0 - 1, systemT: E.stats.systemTemperature, maxT,
    speedSpread0: rel(speeds0), speedSpread: rel(E.latestSpeedSamples || []),
    cycles: E.sequencer.isEnabled ? E.sequencer.currentCycleCount : 0,
    sensors: sensors.map((s, k) => ({
      label: s.label, n0: first[k].n, n: Math.round(tail(s, 'historyCount', 90)), T: Math.round(tail(s, 'historyTemp', 90)),
      P: Math.round(tail(s, 'historyPressure', 90)), work: cycleWork(s)
    }))
  };
})
"""

# key, simulated seconds, stop after this many cycles
CASES = [
    ('idealGas', 6, 0),
    ('thermalEquilibrium', 40, 0),
    ('freeExpansion', 45, 0),
    ('barometric', 25, 0),
    ('adiabaticCompression', 40, 1),
    ('carnot', 400, 2),
    ('otto', 200, 2),
    ('stirling', 300, 2),
]


def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler) as httpd:
        httpd.serve_forever()


def check(r):
    k, s = r['key'], r['sensors']
    by = {x['label']: x for x in s}
    assert r['particles'] == r['particles0'], f"particles lost: {r['particles']} of {r['particles0']}"
    if k == 'idealGas':
        assert r['speedSpread0'] < 0.05, 'example should start with equal speeds'
        assert r['speedSpread'] > 0.4, f"speeds did not relax towards Maxwell-Boltzmann (rel. spread {r['speedSpread']:.2f}, 0.52 expected)"
        assert abs(by['Gas']['T'] - 300) < 20, 'temperature drifted'
    elif k == 'thermalEquilibrium':
        hot, cold = by['Hot side'], by['Cold side']
        assert hot['n'] == 200 and cold['n'] == 200, 'gases mixed through the conducting wall'
        assert hot['T'] - cold['T'] < 120, f"no thermal equilibrium: {hot['T']} K vs {cold['T']} K (started 600 / 150)"
    elif k == 'freeExpansion':
        left, right = by['Left chamber'], by['Right chamber']
        assert right['n'] > 100, f"gas did not expand into the right chamber: {right['n']}"
        assert abs(r['energyDrift']) < 0.01, f"energy not conserved: {r['energyDrift']:.2%}"
        assert abs(left['T'] - r['T0']) < 0.15 * r['T0'] and abs(right['T'] - r['T0']) < 0.15 * r['T0'], f"temperature changed in a free expansion: {left['T']} / {right['T']} (start {r['T0']:.0f})"
    elif k == 'barometric':
        top, mid, bot = by['Top'], by['Middle'], by['Bottom']
        assert bot['n'] > mid['n'] > top['n'], f"no barometric layering: {bot['n']} / {mid['n']} / {top['n']}"
        assert max(top['T'], mid['T'], bot['T']) - min(top['T'], mid['T'], bot['T']) < 80, 'temperature should be uniform'
    elif k == 'adiabaticCompression':
        assert r['maxT'] > 500, f"compression did not heat the gas: max {r['maxT']:.0f} K"
    else:
        work = {int(c): w for c, w in s[0]['work'].items() if int(c) >= 1}
        done = [work[c] for c in sorted(work) if c < r['cycles']]
        assert r['cycles'] >= 2 and done, f"{k}: no completed cycle"
        assert done[-1] > 0, f"{k}: cycle does net work on the gas instead of by it: {done}"


def main():
    threading.Thread(target=start_server, daemon=True).start()
    time.sleep(0.5)
    chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_examples_' + str(int(time.time())))
    proc = subprocess.Popen([
        chrome, '--headless=new', '--window-size=1440,900',
        f'--remote-debugging-port={DEBUG_PORT}', f'--user-data-dir={user_data}',
        '--remote-allow-origins=*', '--enable-unsafe-webgpu', '--enable-features=Vulkan,UseSkiaRenderer',
        f'http://127.0.0.1:{PORT}/index.html'
    ])
    # Optional arguments: example keys to run, each optionally with a cycle count (carnot:6)
    only = {a.split(':')[0]: (int(a.split(':')[1]) if ':' in a else None) for a in sys.argv[1:]}
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
        ws = websocket.create_connection(ws_url, timeout=600)
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
            if ev('!!(window.engine && window.loadExample)'):
                break
            time.sleep(0.2)
        time.sleep(1.5)
        ev("document.getElementById('btnSplashNew')?.click()")
        cards = ev("document.querySelectorAll('.splash-example-card').length")
        names = ev('Object.keys(window.Examples)')
        assert set(names) == {c[0] for c in CASES}, f'examples and test cases differ: {names}'

        failures = []
        for key, seconds, cycles in CASES:
            if only and key not in only:
                continue
            if only.get(key):
                cycles = only[key]
                seconds = max(seconds, 60 * cycles)
            r = ev(f'({RUN_JS})({json.dumps(key)}, {seconds}, {cycles})')
            summary = {k: v for k, v in r.items() if k != 'sensors'}
            print(f"\n{key}: {json.dumps(summary)}")
            for x in r['sensors']:
                print('   ', json.dumps(x))
            try:
                check(r)
                print('    OK')
            except AssertionError as e:
                print('    FAIL:', e)
                failures.append(f'{key}: {e}')
        print(f'\nstart screen cards: {cards}')
        assert not failures, 'examples failed:\n' + '\n'.join(failures)
        print('\nALL EXAMPLES PASSED')
    finally:
        proc.terminate()


if __name__ == '__main__':
    main()
