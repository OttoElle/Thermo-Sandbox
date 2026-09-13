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

PORT = 8879

def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    server = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()

def run_test():
    srv_thread = threading.Thread(target=start_server, daemon=True)
    srv_thread.start()
    time.sleep(0.5)

    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    target_url = f'http://127.0.0.1:{PORT}/index.html'
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_webgpu_test_' + str(int(time.time())))

    cmd = [
        chrome_path,
        '--headless=new',
        '--window-size=1440,900',
        '--remote-debugging-port=9446',
        f'--user-data-dir={user_data}',
        '--remote-allow-origins=*',
        '--enable-unsafe-webgpu',
        '--enable-features=Vulkan,UseSkiaRenderer',
        target_url
    ]

    proc = subprocess.Popen(cmd)
    try:
        debugger_url = None
        for _ in range(40):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen('http://127.0.0.1:9446/json/list', timeout=1) as resp:
                    pages = json.loads(resp.read().decode('utf-8'))
                    for p in pages:
                        if p.get('type') == 'page' and 'index.html' in p.get('url', ''):
                            debugger_url = p.get('webSocketDebuggerUrl')
                            break
                    if debugger_url:
                        break
            except Exception:
                pass

        if not debugger_url:
            print("Failed to get WebSocket debugger URL")
            sys.exit(1)

        ws = websocket.create_connection(debugger_url)
        msg_id = 1

        def send_cdp(method, params=None):
            nonlocal msg_id
            m = {'id': msg_id, 'method': method}
            if params:
                m['params'] = params
            ws.send(json.dumps(m))
            msg_id += 1
            while True:
                resp = json.loads(ws.recv())
                if resp.get('id') == m['id']:
                    return resp.get('result', {})

        # Enable runtime & console
        send_cdp('Runtime.enable')
        send_cdp('Page.enable')
        send_cdp('Console.enable')

        time.sleep(1.0)

        # Re-invoke and await initGPU directly to catch any error message
        diag = send_cdp('Runtime.evaluate', {
            'expression': '''(async () => {
                const canvas = document.getElementById('gpuCanvas');
                try {
                    const ok = await window.renderer.initGPU(canvas);
                    return { ok, isSupported: window.renderer.gpuRenderer.isSupported };
                } catch(e) {
                    return { error: e.toString(), stack: e.stack };
                }
            })()''',
            'awaitPromise': True,
            'returnByValue': True
        })
        print("Explicit initGPU Diagnosis:", json.dumps(diag.get('result', {}).get('value', {}), indent=2))

        # Evaluate window state
        res = send_cdp('Runtime.evaluate', {
            'expression': '''(() => {
                return {
                    hasRenderer: !!window.renderer,
                    hasEngine: !!window.engine,
                    hasGpuRenderer: !!(window.renderer && window.renderer.gpuRenderer),
                    useWebGPU: window.renderer ? window.renderer.useWebGPU : false,
                    gpuCanvasExists: !!document.getElementById('gpuCanvas'),
                    errorOverlayVisible: document.getElementById('webgpuErrorOverlay') ? document.getElementById('webgpuErrorOverlay').style.display : 'none',
                    particleCount: window.engine ? window.engine.particles.length : 0
                };
            })()''',
            'returnByValue': True
        })

        val = res.get('result', {}).get('value', {})
        print("WebGPU State Evaluation:", json.dumps(val, indent=2))

        assert val.get('hasRenderer') == True, "window.renderer is missing"
        assert val.get('hasEngine') == True, "window.engine is missing"
        assert val.get('gpuCanvasExists') == True, "#gpuCanvas is missing from DOM"
        assert val.get('hasGpuRenderer') == True, "gpuRenderer instance is missing"

        # Check render call
        eval_sim = send_cdp('Runtime.evaluate', {
            'expression': '''(() => {
                try {
                    window.renderer.render(window.engine);
                    return { success: true, particleCount: window.engine.particles.length };
                } catch(e) {
                    return { success: false, error: e.toString() };
                }
            })()''',
            'returnByValue': True
        })
        sim_val = eval_sim.get('result', {}).get('value', {})
        print("Render Evaluation:", json.dumps(sim_val, indent=2))
        assert sim_val.get('success') == True, f"Render failed: {sim_val.get('error')}"

        print("\nAll WebGPU runtime assertions PASSED!")

    finally:
        proc.terminate()

if __name__ == '__main__':
    run_test()
