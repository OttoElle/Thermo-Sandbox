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
    # Threaded with a long accept queue: dev mode requests ~40 modules at once,
    # which overflows the single-threaded default server (fetch failures).
    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True
        request_queue_size = 128
    server = Server(('127.0.0.1', PORT), QuietHandler)
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
    missing = []
    for i, (tool, dx, dy) in enumerate(DRAW_TOOLS):
        assert page.click_id(tool), f'missing tool button {tool}'
        x = 660 + (i % 5) * 76  # right of the floating tool dialog
        y = 300 + (i // 5) * 140
        n0 = page.eval(COUNT_JS)
        page.drag(x, y, x + dx, y + dy)
        if page.eval(COUNT_JS) == n0:
            missing.append(tool)
    if missing:
        print(f'tools that created nothing: {missing}')
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
    page.click(690, 325)
    page.click(690, 325, clicks=2)
    page.mouse('mouseMoved', 690, 325, 'none', buttons=0)
    page.mouse('mousePressed', 690, 325, 'right')
    page.mouse('mouseReleased', 690, 325, 'right')
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

    # Edit menu / shortcuts: select all, group, ungroup
    page.key('a', 'KeyA', 65, modifiers=2)
    all_selected = page.eval('window.app.selectedItems.length')
    all_elements = page.eval('window.engine.elements.length')
    page.key('g', 'KeyG', 71, modifiers=2)
    grouped = page.eval('new Set(window.app.selectedItems.map(i => i.groupId)).size === 1 && !!window.app.selectedItems[0].groupId')
    page.key('G', 'KeyG', 71, modifiers=10)
    ungrouped = page.eval('window.app.selectedItems.every(i => !i.groupId)')
    page.key('Escape', 'Escape', 27)

    # View menu toggles (grid size, vectors, zoom to fit), simulation menu and help
    for entry in ['menuEntryToggleGrid', 'menuEntryGrid10', 'menuEntryGrid20', 'menuEntryToggleSnap',
                  'menuEntryToggleVectors', 'menuEntryToggleColor', 'menuEntryZoomIn', 'menuEntryZoomOut',
                  'menuEntryResetView', 'menuEntryModelReal', 'menuEntryModelIdeal', 'menuEntryGravity',
                  'menuEntryGravity', 'menuEntrySequencer', 'menuEntrySequencer', 'menuEntryGuide']:
        page.click_id(entry)
    page.key('Escape', 'Escape', 27)
    page.click_id('menuEntryShortcuts')
    page.key('Escape', 'Escape', 27)
    page.key('f', 'KeyF', 70)
    view_ok = page.eval('window.renderer.showVectors && window.renderer.gridSize === 20 && Number.isFinite(window.renderer.zoom)')

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

    # History group: New Canvas and Revert are undoable
    n_before_clear = page.eval('window.engine.elements.length')
    page.click_id('btnToolbarClear')
    n_cleared = page.eval('window.engine.elements.length')
    page.key('z', 'KeyZ', 90, modifiers=2)
    n_restored = page.eval('window.engine.elements.length')
    page.click_id('btnToolbarReset')
    n_reverted = page.eval('window.engine.elements.length')
    page.key('z', 'KeyZ', 90, modifiers=2)
    n_revert_undone = page.eval('window.engine.elements.length')

    # Transform frame on a fresh canvas: rectangle corner drag keeps the shape
    # closed, frame edge resizes, rotate handle turns in 15° steps.
    page.click_id('btnToolbarClear')
    page.eval('window.renderer.setViewport(600, 350, 1)')
    w2s = lambda x, y: (600 + x, 350 + y)
    walls_js = 'JSON.stringify(window.engine.walls.map(w => [w.p1.x, w.p1.y, w.p2.x, w.p2.y].map(Math.round)))'
    page.click_id('toolWallRect')
    page.drag(*w2s(0, 0), *w2s(200, 140))
    page.click_id('toolSelect')
    page.click(*w2s(100, 0))                      # select the rectangle via its top wall
    page.drag(*w2s(200, 140), *w2s(240, 160))     # corner vertex
    corner = json.loads(page.eval(walls_js))
    page.drag(*w2s(248, 80), *w2s(288, 80))       # east frame edge (pad 8 px)
    resized = json.loads(page.eval(walls_js))
    page.drag(*w2s(140, -34), *w2s(400, 80))      # rotate handle (26 px above the frame)
    rotated = json.loads(page.eval(walls_js))
    page.click_id('toolGas')                      # drawing tools must not grab vertices
    page.drag(*w2s(0, 0), *w2s(60, 60))
    after_gas = json.loads(page.eval(walls_js))
    page.click_id('toolSelect')

    # Click-move-click drawing with a typed size: 120 x 60 heat exchanger
    page.click_id('toolHeatEx')
    page.click(*w2s(400, 0))
    page.mouse('mouseMoved', *w2s(460, 40), 'none', buttons=0)
    page.key('1', 'Digit1', 49)
    page.send('Input.insertText', {'text': '20,60'})
    page.key('Enter', 'Enter', 13)
    typed_hx = page.eval('JSON.stringify(window.engine.heatExchangers.map(h => [h.x, h.y, h.width, h.height]))')
    page.click_id('toolSelect')

    def closed(ws):
        return all(ws[i][2:] == ws[(i + 1) % len(ws)][:2] for i in range(len(ws)))

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
    assert all_selected == all_elements, 'Ctrl+A did not select all elements'
    assert grouped and ungrouped, 'Ctrl+G / Ctrl+Shift+G did not group / ungroup'
    assert view_ok, 'view menu state is wrong (vectors, grid size, zoom)'
    assert n_cleared == 0 and n_restored == n_before_clear, 'New Canvas is not undoable'
    assert corner[1][2:] == [240, 160] and closed(corner), f'corner drag broke the rectangle: {corner}'
    assert max(w[0] for w in resized) == 280 and closed(resized), f'frame resize failed: {resized}'
    assert rotated != resized and closed(rotated), f'rotation failed: {rotated}'
    assert after_gas == rotated, 'spawner tool moved a wall vertex'
    assert json.loads(typed_hx) == [[400, 0, 120, 60]], f'typed dimensions failed: {typed_hx}'
    assert n_reverted == 0 and n_revert_undone == n_before_clear, f'Revert to Saved is not undoable ({n_before_clear} -> {n_reverted} -> {n_revert_undone})'
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
