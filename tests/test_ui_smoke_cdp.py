"""
UI smoke test in headless Chrome, run against the bundle (index.html), the
unbundled ES modules (index.html?dev, strict mode) and the standalone HTML.

Drives the app with real input events: every ribbon tool, drawing each
element type on the canvas, selecting, popup, context menu, undo/redo,
delete, view menu toggles and playback. Fails on any uncaught exception or
console error. The dev pass catches missing imports and implicit globals
that the concatenated bundle hides.
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

PORT = 8881
DEBUG_PORT = 9448

# Tools drawn by dragging on the canvas: (button id, drag dx, drag dy)
DRAW_TOOLS = [
    ('toolGas', 60, 50), ('toolEmitter', 40, 30), ('toolSink', 40, 40),
    ('toolRegulator', 50, 50), ('toolSolidRes', 60, 40), ('toolHeatEx', 60, 40),
    ('toolRegen', 60, 40), ('toolStorage', 50, 40), ('toolValveThrottle', 60, 0),
    ('toolSensor', 60, 50),
]

COUNT_JS = '''(() => {
    const E = window.engine;
    const keys = ['walls', 'pistons', 'reservoirs', 'sensors', 'emitters', 'sinks', 'regulators',
                  'thermalBlocks', 'heatExchangers', 'regenerators', 'throttleValves', 'particleGroups'];
    return keys.reduce((n, k) => n + (Array.isArray(E[k]) ? E[k].length : 0), 0);
})()'''


def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()


class Page:
    def __init__(self, debugger_url):
        self.ws = websocket.create_connection(debugger_url)
        self.msg_id = 0
        self.problems = []

    def _event(self, msg):
        method = msg.get('method')
        params = msg.get('params', {})
        if method == 'Runtime.exceptionThrown':
            d = params.get('exceptionDetails', {})
            desc = d.get('exception', {}).get('description') or d.get('text')
            self.problems.append(f"exception: {desc} ({d.get('url', '')}:{d.get('lineNumber')})")
        elif method == 'Runtime.consoleAPICalled' and params.get('type') == 'error':
            args = ' '.join(str(a.get('value', a.get('description', ''))) for a in params.get('args', []))
            self.problems.append(f'console.error: {args}')

    def send(self, method, params=None):
        self.msg_id += 1
        mid = self.msg_id
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') == mid:
                return msg.get('result', {})
            self._event(msg)

    def eval(self, expr):
        res = self.send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
        if 'exceptionDetails' in res:
            raise AssertionError(f"evaluate failed: {expr[:80]}: {res['exceptionDetails']}")
        return res.get('result', {}).get('value')

    def mouse(self, kind, x, y, button='left', clicks=1, buttons=None):
        if buttons is None:
            buttons = 0 if kind == 'mouseReleased' else (1 if button == 'left' else 2)
        self.send('Input.dispatchMouseEvent', {'type': kind, 'x': x, 'y': y, 'button': button,
                                                'buttons': buttons, 'clickCount': clicks})

    def click(self, x, y, button='left', clicks=1):
        self.mouse('mouseMoved', x, y, 'none', buttons=0)
        self.mouse('mousePressed', x, y, button, clicks)
        self.mouse('mouseReleased', x, y, button, clicks)

    def drag(self, x0, y0, x1, y1, steps=6):
        self.mouse('mouseMoved', x0, y0, 'none', buttons=0)
        self.mouse('mousePressed', x0, y0)
        for i in range(1, steps + 1):
            self.mouse('mouseMoved', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, 'left', buttons=1)
        self.mouse('mouseReleased', x1, y1)

    def key(self, key, code, key_code, modifiers=0):
        for kind in ('rawKeyDown', 'keyUp'):
            self.send('Input.dispatchKeyEvent', {'type': kind, 'key': key, 'code': code,
                                                 'windowsVirtualKeyCode': key_code, 'modifiers': modifiers})

    def click_id(self, element_id):
        return self.eval(f'(() => {{ const el = document.getElementById("{element_id}"); if (el) el.click(); return !!el; }})()')


MODES = {
    'bundle': 'index.html',
    'dev modules': 'index.html?dev',
    'standalone': 'ParticleLab_Standalone.html',
}


def run_pass(page, label):
    dev = label == 'dev modules'
    print(f'\n=== {label} ===')
    page.problems.clear()
    page.send('Page.navigate', {'url': f'http://127.0.0.1:{PORT}/' + MODES[label]})
    time.sleep(0.5)
    for _ in range(75):
        if page.eval('!!(window.engine && window.renderer && window.sequencerUI && window.app)'):
            break
        time.sleep(0.2)
    else:
        raise AssertionError(f'app did not start ({label}): {page.problems}')

    loaded = page.eval('''({
        module: !!document.querySelector('script[type="module"][src="src/main.js"]'),
        globalEngineClass: typeof Engine !== 'undefined'
    })''')
    assert loaded['module'] == dev, f'wrong loader in {label} mode: {loaded}'
    assert loaded['globalEngineClass'] != dev, f'unexpected global scope in {label} mode: {loaded}'

    # Every ribbon tool renders its property panel
    n_tools = page.eval('''(() => {
        const btns = [...document.querySelectorAll('.ribbon-tool-btn')];
        btns.forEach(b => b.click());
        document.getElementById('toolSelect')?.click();
        return btns.length;
    })()''')

    # Leave the splash screen into an empty scene
    page.click_id('btnSplashNew')
    time.sleep(0.3)
    before = page.eval(COUNT_JS)

    # Draw every element type, spread over a grid in the middle of the canvas
    for i, (tool, dx, dy) in enumerate(DRAW_TOOLS):
        assert page.click_id(tool), f'missing tool button {tool}'
        x = 470 + (i % 5) * 110
        y = 300 + (i // 5) * 140
        page.drag(x, y, x + dx, y + dy)
    # Walls: first variant of the wall tool, dragged segment + a polyline closed by double click
    page.eval('document.querySelector(\'.ribbon-tool-btn[data-tool="wall"]\').click()')
    page.drag(470, 620, 600, 620)
    page.click(650, 620)
    page.click(720, 660)
    page.click(720, 660, clicks=2)
    after_draw = page.eval(COUNT_JS)
    walls = page.eval('window.engine.walls.length')

    # Select, popup, context menu, duplicate, undo/redo, delete
    page.click_id('toolSelect')
    page.click(500, 325)
    page.click(500, 325, clicks=2)
    page.mouse('mouseMoved', 500, 325, 'none', buttons=0)
    page.mouse('mousePressed', 500, 325, 'right')
    page.mouse('mouseReleased', 500, 325, 'right')
    page.click_id('ctxDuplicate')
    page.key('z', 'KeyZ', 90, modifiers=2)
    page.key('y', 'KeyY', 89, modifiers=2)
    page.drag(420, 250, 1050, 700)  # box selection
    selected = page.eval('window.app.selectedItems.length')
    after_box = page.eval(COUNT_JS)
    page.key('Delete', 'Delete', 46)
    after_delete = page.eval(COUNT_JS)
    page.key('z', 'KeyZ', 90, modifiers=2)
    after_undo = page.eval(COUNT_JS)
    page.key('Escape', 'Escape', 27)

    # View menu toggles and help
    for entry in ['menuEntryToggleGrid', 'menuEntryGrid20', 'menuEntryToggleSnap', 'menuEntryToggleVectors',
                  'menuEntryToggleColor', 'menuEntryResetView', 'menuEntryGuide']:
        page.click_id(entry)
    page.key('Escape', 'Escape', 27)
    page.click_id('btnInfoClose')

    # Playback: play, step back, stop/reset
    page.click_id('btnPlayPause')
    time.sleep(1.0)
    state = page.eval('({ t: window.engine.totalTime, gpu: window.engine.isGPUSimulating(), sim: window.app.isSimulating })')
    page.click_id('btnPlayPause')
    page.click_id('btnStep')
    page.click_id('btnStepBack')
    page.click_id('btnStopReset')
    time.sleep(0.3)
    page.eval('1')  # drain pending events

    print(f'tools: {n_tools}, elements: {before} -> {after_draw} after drawing ({walls} walls)')
    print(f'box selection: {selected} items of {after_box}, {after_delete} after Delete, {after_undo} after Ctrl+Z')
    print(f'run: {state}')
    if page.problems:
        print('Problems:')
        print('\n'.join('  ' + p for p in page.problems))
    assert after_draw >= before + len(DRAW_TOOLS), f'drawing created too few elements ({before} -> {after_draw})'
    assert walls >= 2, 'wall tool did not create the polyline walls'
    assert selected > 0, 'box selection selected nothing'
    assert after_delete < after_box, 'Delete key did not delete the selection'
    assert after_undo == after_box, 'Ctrl+Z did not restore the deleted elements'
    assert state['sim'] and state['t'] > 0, 'simulation did not run'
    assert not page.problems, f'{len(page.problems)} runtime error(s) in {label} mode'
    print(f'{label}: PASSED')


def run_test():
    threading.Thread(target=start_server, daemon=True).start()
    time.sleep(0.5)

    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_ui_smoke_' + str(int(time.time())))
    cmd = [
        chrome_path, '--headless=new', '--window-size=1440,900',
        f'--remote-debugging-port={DEBUG_PORT}', f'--user-data-dir={user_data}',
        '--remote-allow-origins=*', '--enable-unsafe-webgpu',
        '--enable-features=Vulkan,UseSkiaRenderer', 'about:blank'
    ]
    proc = subprocess.Popen(cmd)
    try:
        debugger_url = None
        for _ in range(40):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{DEBUG_PORT}/json/list', timeout=1) as resp:
                    pages = [p for p in json.loads(resp.read().decode('utf-8')) if p.get('type') == 'page']
                    if pages:
                        debugger_url = pages[0]['webSocketDebuggerUrl']
                        break
            except Exception:
                pass
        if not debugger_url:
            print('Failed to get WebSocket debugger URL')
            sys.exit(1)

        page = Page(debugger_url)
        page.send('Runtime.enable')
        page.send('Page.enable')
        for label in MODES:
            run_pass(page, label)
        print('\nUI smoke test PASSED (bundle, dev modules, standalone)!')
    finally:
        proc.terminate()


if __name__ == '__main__':
    run_test()
