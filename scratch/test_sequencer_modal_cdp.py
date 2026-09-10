"""
scratch/test_sequencer_modal_cdp.py
Interactive browser CDP test for Sequencer Action Dialog anchored modal, cyan glow, and settings.
"""
import os
import sys
import time
import json
import threading
import http.server
import socketserver
import websocket
import urllib.request
import subprocess

PORT = 8765

def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    server = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()

def test_sequencer_modal():
    srv_thread = threading.Thread(target=start_server, daemon=True)
    srv_thread.start()
    time.sleep(0.5)

    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    target_url = f'http://127.0.0.1:{PORT}/ParticleLab_Standalone.html'
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_seq_modal_test_' + str(int(time.time())))

    cmd = [
        chrome_path,
        '--headless=new',
        '--window-size=1440,900',
        '--remote-debugging-port=9445',
        f'--user-data-dir={user_data}',
        '--remote-allow-origins=*',
        '--disable-gpu',
        target_url
    ]

    proc = subprocess.Popen(cmd)
    try:
        # 1. Connect CDP
        debugger_url = None
        for _ in range(30):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen('http://127.0.0.1:9445/json/list', timeout=1) as resp:
                    pages = json.loads(resp.read().decode('utf-8'))
                    for p in pages:
                        if p.get('type') == 'page' and 'ParticleLab' in p.get('url', ''):
                            debugger_url = p.get('webSocketDebuggerUrl')
                            break
                    if debugger_url:
                        break
            except Exception:
                pass

        if not debugger_url:
            raise RuntimeError("Could not connect to Chrome debugging target on port 9445")

        ws = websocket.create_connection(debugger_url)
        ws.send(json.dumps({"id": 9991, "method": "Runtime.enable"}))
        ws.send(json.dumps({"id": 9992, "method": "Log.enable"}))
        msg_id = [0]

        def eval_js(expression):
            msg_id[0] += 1
            payload = {
                "id": msg_id[0],
                "method": "Runtime.evaluate",
                "params": {
                    "expression": expression,
                    "returnByValue": True,
                    "awaitPromise": True
                }
            }
            ws.send(json.dumps(payload))
            while True:
                resp = json.loads(ws.recv())
                if 'method' in resp and resp['method'] in ['Runtime.exceptionThrown', 'Log.entryAdded']:
                    print("BROWSER LOG/EXCEPTION:", resp)
                if resp.get('id') == msg_id[0]:
                    result = resp.get('result', {}).get('result', {})
                    if 'value' in result:
                        return result['value']
                    elif 'description' in result:
                        return result['description']
                    return result

        print("Testing initial UI and Sequencer loading...")
        time.sleep(1.0)

        # Dismiss splash screen if open
        eval_js("""
            (() => {
                const btnNew = document.getElementById('btnSplashNew');
                if (btnNew) btnNew.click();
            })()
        """)
        time.sleep(0.5)

        info = eval_js("""
            (() => {
                return {
                    title: document.title,
                    hasEngine: typeof window.engine !== 'undefined',
                    hasSequencerUI: typeof window.sequencerUI !== 'undefined',
                    keys: Object.keys(window).filter(k => ['engine', 'renderer', 'sequencerUI'].includes(k))
                };
            })()
        """)
        print("Window diagnostic:", info)
        assert info['hasEngine'] and info['hasSequencerUI'], "Engine or SequencerUI not initialized"

        # 2. Test Sequencer drawer open and step addition
        res1 = eval_js("""
            (() => {
                const seq = window.engine.sequencer;
                const ui = window.sequencerUI;
                ui.openDrawer();
                if (seq.steps.length === 0) seq.addStep();
                return {
                    isOpen: ui.isOpen,
                    stepsCount: seq.steps.length,
                    dialogExists: !!document.getElementById('seqActionDialog')
                };
            })()
        """)
        print("Sequencer setup:", res1)
        assert res1['stepsCount'] >= 1, "Expected at least 1 sequencer step"
        assert res1['dialogExists'], "seqActionDialog not found in DOM"

        # 3. Add a piston and trigger openForElement
        res2 = eval_js("""
            (() => {
                const p = window.engine.addPiston({ x: 400, y: 300, width: 30, height: 100, mode: 'spring', springK: 75 });
                window.sequencerUI.actionDialog.openForElement(p, 0);
                const dlg = document.getElementById('seqActionDialog');
                const glow = window.renderer.highlightedSequencerItem === p;
                const dualInputSlider = !!dlg.querySelector('#seqAct_pSpring_slider');
                const dualInputNum = !!dlg.querySelector('#seqAct_pSpring_num');
                const rect = dlg.getBoundingClientRect();
                return {
                    pistonId: p.id,
                    display: dlg.style.display,
                    glowSet: glow,
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    hasDualSlider: dualInputSlider,
                    hasDualNum: dualInputNum
                };
            })()
        """)
        print("Piston action dialog test:", res2)
        assert res2['display'] == 'flex', "Action dialog should be displayed with display: flex"
        assert res2['glowSet'], "renderer.highlightedSequencerItem should be set to piston"
        assert res2['hasDualSlider'] and res2['hasDualNum'], "Piston springK DualInput elements missing"
        assert res2['left'] > 300, f"Expected dialog positioned to right of element, got left={res2['left']}"

        # 4. Test saving action
        res3 = eval_js("""
            (() => {
                // Change mass and spring values
                const massSlider = document.getElementById('seqAct_pMass_slider');
                if (massSlider) { massSlider.value = '45'; massSlider.dispatchEvent(new Event('input')); }
                const saveBtn = document.getElementById('seqActBtnSave');
                saveBtn.click();
                const step = window.engine.sequencer.steps[0];
                const action = step.actions[step.actions.length - 1];
                const glowCleared = window.renderer.highlightedSequencerItem === null;
                const dlg = document.getElementById('seqActionDialog');
                return {
                    actionSaved: !!action,
                    targetId: action?.targetId,
                    mass: action?.mass,
                    springK: action?.springK,
                    motionType: action?.motionType,
                    glowCleared: glowCleared,
                    displayAfterClose: dlg.style.display
                };
            })()
        """)
        print("Save action test:", res3)
        assert res3['actionSaved'], "Action was not saved to step"
        assert res3['glowCleared'], "Glow highlight should be cleared after save"
        assert res3['displayAfterClose'] == 'none', "Dialog should be hidden after save"

        # 5. Test Emitter dialog (5-button direction toggle and particle params)
        em_diag = eval_js("""
            (() => {
                const em = window.engine.addEmitter(500, 250, 40, 40, { direction: 'down', rate: 12 });
                return {
                    constructor: em.constructor.name,
                    rate: em.rate,
                    type: window.SequencerActionFields ? window.SequencerActionFields.getElementType(em) : 'no_fields',
                    keys: Object.keys(em)
                };
            })()
        """)
        print("Emitter diagnosis:", em_diag)
        res4 = eval_js("""
            (() => {
                const em = window.engine.addEmitter(500, 250, 40, 40, { direction: 'down', rate: 12 });
                window.sequencerUI.actionDialog.openForElement(em, 0);
                const dlg = document.getElementById('seqActionDialog');
                return {
                    emitterId: em.id,
                    badge: dlg.querySelector('#seqActBadge')?.textContent,
                    dirButtonsCount: dlg.querySelectorAll('#seqAct_emDir button').length,
                    activeDir: dlg.querySelector('#seqAct_emDir button.active')?.dataset.dir,
                    display: dlg.style.display
                };
            })()
        """)
        print("Emitter action dialog test:", json.dumps(res4))
        # 6. Test Wider Sequencer Drawer, Lifted Panels, and Centered Controls
        res_ui = eval_js("""
            (async () => {
                const ui = window.sequencerUI;
                ui.dock.openDrawer();
                await new Promise(r => setTimeout(r, 450));
                const body = document.body;
                const dock = document.getElementById('unifiedBottomDock');
                const dockRect = dock.getBoundingClientRect();
                const zoomPanel = document.querySelector('.floating-zoom-panel');
                const zoomStyle = window.getComputedStyle(zoomPanel);
                const velLegend = document.getElementById('floatingVelLegend');
                const velStyle = window.getComputedStyle(velLegend);
                const btnActive = document.getElementById('seqBtnActive');
                const btnLoop = document.getElementById('seqBtnLoop');

                return {
                    isExpanded: body.classList.contains('sequencer-expanded'),
                    dockWidth: Math.round(dockRect.width),
                    dockHeight: Math.round(dockRect.height),
                    dockLeft: Math.round(dockRect.left),
                    dockRight: Math.round(window.innerWidth - dockRect.right),
                    zoomBottom: parseInt(zoomStyle.bottom, 10),
                    velBottom: parseInt(velStyle.bottom, 10),
                    hasBtnActive: !!btnActive,
                    hasBtnLoop: !!btnLoop
                };
            })()
        """)
        print("Sequencer UI Geometry & Controls Test:", res_ui)
        assert res_ui['isExpanded'], "Body should have class sequencer-expanded"
        assert res_ui['dockWidth'] > 600, f"Expected dock width > 600px, got {res_ui['dockWidth']}"
        assert abs(res_ui['dockHeight'] - 420) <= 5, f"Expected dock height 420px, got {res_ui['dockHeight']}"
        assert abs(res_ui['dockLeft'] - 352) <= 10, f"Expected dock left ~352px, got {res_ui['dockLeft']}"
        assert abs(res_ui['dockRight'] - 412) <= 10, f"Expected dock right ~412px, got {res_ui['dockRight']}"
        assert res_ui['zoomBottom'] >= 440, f"Expected zoom panel lifted >= 440px, got {res_ui['zoomBottom']}"
        assert res_ui['velBottom'] >= 580, f"Expected vel legend lifted >= 580px, got {res_ui['velBottom']}"
        assert res_ui['hasBtnActive'] and res_ui['hasBtnLoop'], "Active and Loop buttons must exist"

        # 7. Test Active and Loop buttons toggle
        res_toggles = eval_js("""
            (() => {
                const btnActive = document.getElementById('seqBtnActive');
                const btnLoop = document.getElementById('seqBtnLoop');
                const seq = window.engine.sequencer;

                const initActive = seq.isEnabled;
                btnActive.click();
                const afterActive = seq.isEnabled;
                const activeClass = btnActive.classList.contains('active');

                btnLoop.click();
                const afterLoop = seq.isLooping;
                const loopClass = btnLoop.classList.contains('active');

                return {
                    toggledActive: afterActive !== initActive,
                    activeHasClass: activeClass === afterActive,
                    loopHasClass: loopClass === afterLoop
                };
            })()
        """)
        print("Active & Loop Buttons Test:", res_toggles)
        assert res_toggles['toggledActive'], "Active button did not toggle engine.sequencer.isEnabled"
        assert res_toggles['activeHasClass'], "Active button .active class out of sync"
        assert res_toggles['loopHasClass'], "Loop button .active class out of sync"

        # 8. Test Step Action Accordion In-Line Sliders & Two-Way Live Binding
        res_accordion = eval_js("""
            (() => {
                const ui = window.sequencerUI;
                const seq = window.engine.sequencer;
                ui.dock.openDrawer();
                ui.actionDialog.close();

                // Check action card
                const actionCard = document.querySelector('.seq-action-card[data-action="0"]');
                if (!actionCard) return { error: 'no action card found' };

                const actionHeader = actionCard.querySelector('.seq-action-header');
                const hasEditBtn = !!actionCard.querySelector('.btn-edit-action');
                const dialogBefore = document.getElementById('seqActionDialog').style.display;

                // Click header to expand accordion
                actionHeader.click();

                const cardAfterClick = document.querySelector('.seq-action-card[data-action="0"]');
                const isExpanded = cardAfterClick ? cardAfterClick.classList.contains('is-expanded') : false;
                const actionBody = cardAfterClick ? cardAfterClick.querySelector('.seq-action-body') : null;
                const inlineSliders = actionBody ? actionBody.querySelectorAll('.styled-slider') : [];
                const inlineNotches = actionBody ? actionBody.querySelectorAll('.slider-notch') : [];
                const dialogAfter = document.getElementById('seqActionDialog').style.display;
                const highlighted = window.renderer.highlightedSequencerItem !== null;

                // Test live update: drag the in-line mass slider
                const massSlider = actionBody ? actionBody.querySelector('[id$="pMass_slider"]') : null;
                let massBefore = massSlider ? parseFloat(massSlider.value) : -1;
                if (massSlider) {
                    massSlider.value = 65;
                    massSlider.dispatchEvent(new Event('input'));
                }
                const actionData = seq.steps[0].actions[0];

                return {
                    cardFound: true,
                    hasEditBtn: hasEditBtn,
                    dialogBefore: dialogBefore,
                    isExpanded: isExpanded,
                    hasBody: !!actionBody,
                    inlineSlidersCount: inlineSliders.length,
                    inlineNotchesCount: inlineNotches.length,
                    dialogAfter: dialogAfter,
                    isHighlighted: highlighted,
                    massBefore: massBefore,
                    massAfterInStep: actionData ? actionData.mass : -1
                };
            })()
        """)
        print("Step Accordion In-line Controls Test:", res_accordion)
        assert not res_accordion['hasEditBtn'], "Edit button (.btn-edit-action) should NOT exist on action card!"
        assert res_accordion['isExpanded'], "Accordion card should have .is-expanded class"
        assert res_accordion['hasBody'], "Accordion body (.seq-action-body) should be rendered"
        assert res_accordion['inlineSlidersCount'] > 0, "In-line sliders should be rendered inside accordion body"
        assert res_accordion['inlineNotchesCount'] > 0, "Slider default notches should exist in in-line controls"
        assert res_accordion['dialogAfter'] == 'none', "Dialog should NOT open when expanding accordion!"
        assert res_accordion['isHighlighted'], "Target element should be highlighted on canvas"
        assert res_accordion['massAfterInStep'] == 65, f"Expected live-updated mass 65 in step action, got {res_accordion['massAfterInStep']}"

        # 9. Test Header Reset Arrow Button and Notch in Action Dialog
        res_reset = eval_js("""
            (() => {
                const ui = window.sequencerUI;
                const p = window.engine.pistons[0];
                ui.actionDialog.openForElement(p, 0, null, 0);

                const dlg = document.getElementById('seqActionDialog');
                const header = document.getElementById('seqActHeader');
                const resetBtn = document.getElementById('seqActBtnReset');
                const footer = dlg.querySelector('.modal-actions-row');
                const footerResetBtn = footer ? footer.querySelector('#seqActBtnReset') : null;

                // Verify reset button is in header and has reset icon
                const isInHeader = header && header.contains(resetBtn);
                const hasSvg = resetBtn && resetBtn.querySelector('svg') !== null;

                // Check notches
                const notches = dlg.querySelectorAll('.slider-notch');

                // Check speed slider default (160 px/s)
                const speedSlider = dlg.querySelector('#seqAct_pSpeed_slider');
                const speedRow = dlg.querySelector('#row_seqAct_pSpeed');

                // Modify speed away from default
                speedSlider.value = 350;
                speedSlider.dispatchEvent(new Event('input'));
                const isModifiedBeforeReset = speedRow.classList.contains('is-modified');

                // Click Reset to Default arrow in header
                resetBtn.click();

                const speedAfterReset = parseFloat(dlg.querySelector('#seqAct_pSpeed_slider').value);
                const isModifiedAfterReset = dlg.querySelector('#row_seqAct_pSpeed').classList.contains('is-modified');

                dlg.style.display = 'none';
                return {
                    isInHeader: isInHeader,
                    hasSvg: hasSvg,
                    footerHasReset: !!footerResetBtn,
                    notchesCount: notches.length,
                    isModifiedBeforeReset: isModifiedBeforeReset,
                    speedAfterReset: speedAfterReset,
                    isModifiedAfterReset: isModifiedAfterReset
                };
            })()
        """)
        print("Header Reset Button & Notches Test:", res_reset)
        assert res_reset['isInHeader'], "Reset button must be located in modal header"
        assert res_reset['hasSvg'], "Reset button must contain SVG icon"
        assert not res_reset['footerHasReset'], "Footer should NOT have reset button"
        assert res_reset['notchesCount'] > 0, "Dialog sliders should have default notch markers"
        assert res_reset['isModifiedBeforeReset'], "Modified input row should have .is-modified"
        assert res_reset['speedAfterReset'] == 160, f"Expected reset speed 160, got {res_reset['speedAfterReset']}"
        assert not res_reset['isModifiedAfterReset'], "Row should not have .is-modified after reset"

        # 10. Test Hover Highlighting during Picking Mode
        res_hover = eval_js("""
            (() => {
                const ui = window.sequencerUI;
                const rend = window.renderer;
                const p = window.engine.pistons[0];
                const canvas = document.getElementById('simCanvas');

                // Start picking mode for step 0
                ui.actionDialog.startPicking(0);

                // Mouse move over piston coordinates
                const screenPiston = rend.worldToScreen(p.x, p.y);
                const moveOverEvent = new MouseEvent('mousemove', {
                    clientX: screenPiston.x,
                    clientY: screenPiston.y,
                    bubbles: true
                });
                window.dispatchEvent(moveOverEvent);

                const glowOverPiston = rend.highlightedSequencerItem === p;
                const cursorOverPiston = canvas.style.cursor;

                // Mouse move to empty area
                const moveAwayEvent = new MouseEvent('mousemove', {
                    clientX: 10,
                    clientY: 10,
                    bubbles: true
                });
                window.dispatchEvent(moveAwayEvent);

                const glowAway = rend.highlightedSequencerItem === null;

                // Stop picking
                ui.actionDialog.stopPicking();
                const glowAfterStop = rend.highlightedSequencerItem === null;

                return {
                    glowOverPiston: glowOverPiston,
                    cursorOverPiston: cursorOverPiston,
                    glowAway: glowAway,
                    glowAfterStop: glowAfterStop
                };
            })()
        """)
        print("Picking Hover Highlighting Test:", res_hover)
        assert res_hover['glowOverPiston'], "Piston should be glow highlighted on hover during picking mode"
        assert res_hover['cursorOverPiston'] == 'pointer', f"Canvas cursor should be pointer, got {res_hover['cursorOverPiston']}"
        assert res_hover['glowAway'], "Glow highlight should clear when mouse moves away"
        assert res_hover['glowAfterStop'], "Glow highlight should clear when picking stops"

        eval_js("window.sequencerUI.actionDialog.close();")
        print("\nAll CDP sequencer modal and UI tests passed successfully!")

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    test_sequencer_modal()
