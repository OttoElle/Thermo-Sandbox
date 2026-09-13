import os
import sys
import time
import json
import base64
import http.server
import socketserver
import websocket
import urllib.request
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

PORT = 8768
def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args): pass
    server = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()

import threading
threading.Thread(target=start_server, daemon=True).start()
time.sleep(0.5)

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_seq_trans_' + str(int(time.time())))
cmd = [
    chrome_path,
    '--headless=new',
    '--window-size=1440,900',
    '--remote-debugging-port=9448',
    f'--user-data-dir={user_data}',
    '--remote-allow-origins=*',
    '--disable-gpu',
    f'http://127.0.0.1:{PORT}/index.html'
]
proc = subprocess.Popen(cmd)
try:
    debugger_url = None
    for _ in range(30):
        time.sleep(0.2)
        try:
            with urllib.request.urlopen('http://127.0.0.1:9448/json/list', timeout=1) as resp:
                pages = json.loads(resp.read().decode('utf-8'))
                for p in pages:
                    if p.get('type') == 'page' and 'index.html' in p.get('url', ''):
                        debugger_url = p.get('webSocketDebuggerUrl')
                        break
                if debugger_url: break
        except Exception: pass

    ws = websocket.create_connection(debugger_url)
    ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
    ws.recv()

    msg_id = [10]
    def eval_js(expr):
        msg_id[0] += 1
        ws.send(json.dumps({"id": msg_id[0], "method": "Runtime.evaluate", "params": {"expression": expr, "awaitPromise": True, "returnByValue": True}}))
        while True:
            resp = json.loads(ws.recv())
            if resp.get('id') == msg_id[0]:
                return resp.get('result', {}).get('result', {}).get('value')

    time.sleep(1.0)
    # Dismiss splash
    eval_js("document.getElementById('btnSplashNew')?.click();")
    time.sleep(0.5)

    # Open sequencer drawer and add a 2nd step so there is a transition between Step 1 and Step 2
    eval_js("""
        (() => {
            window.sequencerUI.openDrawer();
            window.engine.sequencer.addStep({ name: 'Step 2' });
            window.sequencerUI.render();
        })()
    """)
    time.sleep(0.5)

    # 1. Click transition node between Step 1 and Step 2
    open_res = eval_js("""
        (() => {
            const transNode = document.querySelector('.seq-transition-node[data-step-trans="0"]');
            if (transNode) transNode.click();
            const modal = document.getElementById('seqTransitionModal');
            return {
                clicked: !!transNode,
                modalDisplay: modal ? window.getComputedStyle(modal).display : 'none'
            };
        })()
    """)
    print("1. Transition modal open:", open_res)
    assert open_res['modalDisplay'] == 'flex', "Modal failed to open"

    # 2. Add second condition to Row 1 using [+ &]
    add_cond_res = eval_js("""
        (() => {
            const btnAnd = document.querySelector('.seq-trans-btn-mini.btn-add-and');
            if (btnAnd) btnAnd.click();

            const row = document.querySelector('.seq-trans-row-card');
            const chips = row ? row.querySelectorAll('.seq-trans-chip') : [];
            const pills = row ? row.querySelectorAll('.seq-trans-op-pill') : [];
            const c0 = chips[0];
            const c1 = chips[1];

            return {
                chipsCount: chips.length,
                pillsCount: pills.length,
                c0IsCollapsed: c0 ? c0.classList.contains('is-collapsed') : false,
                c1IsExpanded: c1 ? c1.classList.contains('is-expanded') : false,
                pillText: pills[0] ? pills[0].textContent : ''
            };
        })()
    """)
    print("2. Add condition to Row 1 (+ &):", add_cond_res)
    assert add_cond_res['chipsCount'] == 2, f"Expected 2 chips, got {add_cond_res['chipsCount']}"
    assert add_cond_res['c0IsCollapsed'], "First chip should be collapsed"
    assert add_cond_res['c1IsExpanded'], "Second chip should be expanded"
    assert add_cond_res['pillText'] == '&', "Operator should be &"

    # 3. Change second condition to Piston Target
    eval_js("""
        (() => {
            const row = document.querySelector('.seq-trans-row-card');
            const c1 = row.querySelectorAll('.seq-trans-chip')[1];
            const sel = c1.querySelector('.seq-chip-type-select');
            if (sel) {
                sel.value = 'piston';
                sel.dispatchEvent(new Event('change'));
            }
        })()
    """)

    # 4. Add Row 2 using [+ || Zeile]
    add_row_res = eval_js("""
        (() => {
            const btnAddRowOr = document.querySelectorAll('.seq-trans-btn-add-row')[1];
            if (btnAddRowOr) btnAddRowOr.click();

            const rows = document.querySelectorAll('.seq-trans-row-card');
            const vDividers = document.querySelectorAll('.seq-trans-v-divider');
            const vPill = vDividers[0] ? vDividers[0].querySelector('.seq-trans-op-pill.v-pill') : null;

            return {
                rowsCount: rows.length,
                vDividersCount: vDividers.length,
                vPillText: vPill ? vPill.textContent : ''
            };
        })()
    """)
    print("3. Add Row 2 (+ || Zeile):", add_row_res)
    assert add_row_res['rowsCount'] == 2, f"Expected 2 rows, got {add_row_res['rowsCount']}"
    assert add_row_res['vPillText'] == '||', "Vertical operator should be ||"

    # 5. Change Row 2 condition to Sensor Chamber
    eval_js("""
        (() => {
            const rows = document.querySelectorAll('.seq-trans-row-card');
            const cRow2 = rows[1].querySelector('.seq-trans-chip.is-expanded');
            const sel = cRow2.querySelector('.seq-chip-type-select');
            if (sel) {
                sel.value = 'sensor';
                sel.dispatchEvent(new Event('change'));
            }
        })()
    """)

    # 6. Click on collapsed chip 0 in Row 1 to expand it
    toggle_expand_res = eval_js("""
        (() => {
            const oldRows = document.querySelectorAll('.seq-trans-row-card');
            const c0 = oldRows[0].querySelector('.seq-trans-chip.is-collapsed');
            if (c0) c0.click();

            const newRows = document.querySelectorAll('.seq-trans-row-card');
            const allExpanded = document.querySelectorAll('.seq-trans-chip.is-expanded');
            const c0Now = newRows[0] ? newRows[0].querySelectorAll('.seq-trans-chip')[0] : null;

            return {
                totalExpanded: allExpanded.length,
                c0NowExpanded: c0Now ? c0Now.classList.contains('is-expanded') : false
            };
        })()
    """)
    print("4. Toggle expand collapsed chip:", toggle_expand_res)
    assert toggle_expand_res['totalExpanded'] == 1, "Only one chip should be expanded"
    assert toggle_expand_res['c0NowExpanded'], "Chip 0 should now be expanded"

    # Take screenshot of the transition modal before applying
    time.sleep(0.3)
    ws.send(json.dumps({"id": 99, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        resp = json.loads(ws.recv())
        if resp.get('id') == 99:
            break
    img_data = base64.b64decode(resp['result']['data'])
    modal_snap_path = r'C:\Users\ottou\.gemini\antigravity\brain\013f42b0-3c20-49e5-8b21-c9a758da41d4\transition_modal_2d_verified.png'
    with open(modal_snap_path, 'wb') as f:
        f.write(img_data)
    print("Modal screenshot saved to:", modal_snap_path)

    # 7. Apply Transition and verify timeline summary
    apply_res = eval_js("""
        (() => {
            const btnSave = document.getElementById('seqTransBtnSave');
            if (btnSave) btnSave.click();

            const modal = document.getElementById('seqTransitionModal');
            const step0 = window.engine.sequencer.steps[0];
            const summary = document.querySelector('.seq-transition-node[data-step-trans="0"] .seq-trans-desc')?.textContent;

            return {
                modalDisplay: modal ? window.getComputedStyle(modal).display : 'none',
                stepRowsCount: step0.transition?.rows?.length,
                row0CondCount: step0.transition?.rows[0]?.conditions?.length,
                row1CondCount: step0.transition?.rows[1]?.conditions?.length,
                row0Op: step0.transition?.rows[0]?.operators[0],
                rowOp: step0.transition?.rowOperators[0],
                timelineSummary: summary
            };
        })()
    """)
    print("5. Applied transition verification:", apply_res)
    assert apply_res['modalDisplay'] == 'none', "Modal should close"
    assert apply_res['stepRowsCount'] == 2, "Transition should have 2 rows"
    assert apply_res['row0CondCount'] == 2, "Row 0 should have 2 conditions"
    assert apply_res['row1CondCount'] == 1, "Row 1 should have 1 condition"
    print("Timeline formula:", apply_res['timelineSummary'])

    time.sleep(0.3)
    ws.send(json.dumps({"id": 100, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        resp = json.loads(ws.recv())
        if resp.get('id') == 100:
            break
    img_data2 = base64.b64decode(resp['result']['data'])
    timeline_snap_path = r'C:\Users\ottou\.gemini\antigravity\brain\013f42b0-3c20-49e5-8b21-c9a758da41d4\transition_timeline_verified.png'
    with open(timeline_snap_path, 'wb') as f:
        f.write(img_data2)
    print("Timeline screenshot saved to:", timeline_snap_path)

    # 8. Test SequencerConditions evaluation with Boolean precedence
    eval_math_res = eval_js("""
        (() => {
            try {
                const seq = window.engine.sequencer;
                seq.isEnabled = true;
                seq.activeStepIndex = 0;
                
                // At elapsedStepTime = 0.2s: duration (1.5s) is NOT met -> stays on Step 0
                seq.elapsedStepTime = 0.2;
                seq.step(0.0, window.engine);
                const idx0 = seq.activeStepIndex;
                const prog0 = seq.stepProgress;

                // At elapsedStepTime = 2.0s: duration (1.5s) IS met -> advances to Step 1!
                seq.elapsedStepTime = 2.0;
                seq.step(0.0, window.engine);
                const idx1 = seq.activeStepIndex;

                return {
                    idx0: idx0,
                    prog0: prog0,
                    idx1: idx1
                };
            } catch (err) {
                return { error: err.message, stack: err.stack };
            }
        })()
    """)
    print("6. Evaluation test:", eval_math_res)
    assert eval_math_res['idx0'] == 0, f"Expected step 0, got {eval_math_res['idx0']}"
    assert eval_math_res['idx1'] == 1, f"Expected step 1, got {eval_math_res['idx1']}"

    print("\nALL TRANSITION BUILDER TESTS PASSED SUCCESSFULLY!")

    ws.close()
finally:
    proc.terminate()
