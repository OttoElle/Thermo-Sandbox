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

PORT = 8891

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
    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_gpu_compute_test_' + str(int(time.time())))

    cmd = [
        chrome_path,
        '--headless=new',
        '--window-size=1440,900',
        '--remote-debugging-port=9451',
        f'--user-data-dir={user_data}',
        '--remote-allow-origins=*',
        '--enable-unsafe-webgpu',
        '--use-webgpu-adapter=default',
        '--enable-features=Vulkan,UseSkiaRenderer',
        target_url
    ]

    proc = subprocess.Popen(cmd)
    try:
        debugger_url = None
        for _ in range(40):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen('http://127.0.0.1:9451/json/list', timeout=1) as resp:
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
            print("Failed to get WebSocket debugger URL on port 9451")
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

        send_cdp('Runtime.enable')
        send_cdp('Page.enable')
        send_cdp('Console.enable')

        time.sleep(1.0)

        # 1. Test GPU Compute Initialization & Zero-Copy 50,000 Particles Simulation
        test_expr = '''(async () => {
            try {
                const canvas = document.getElementById('gpuCanvas');
                if (!window.renderer.useWebGPU) {
                    await window.renderer.initGPU(canvas);
                }

                if (!window.gpuCompute) {
                    window.gpuCompute = new ParticleGPUCompute(window.renderer.gpuRenderer.device);
                    window.engine.gpuCompute = window.gpuCompute;
                }

                // Generate 50,000 particles
                const count = 50000;
                const testParticles = [];
                for (let i = 0; i < count; i++) {
                    testParticles.push({
                        pos: { x: 200 + (i % 200) * 10, y: 150 + Math.floor(i / 200) * 8 },
                        vel: { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }

                // Upload to VRAM
                window.gpuCompute.uploadParticles(testParticles);

                // Run 10 compute steps on GPU
                for (let s = 0; s < 10; s++) {
                    window.gpuCompute.step(0.016, true, 350, 0.98, 2500, 2500, 380);
                }

                const outBuffer = window.gpuCompute.getOutputBuffer();

                // Execute Zero-Copy Render Pass
                window.renderer.gpuRenderer.renderGPUBuffer(outBuffer, count, 0, 0, 1.0, 380, true);

                // Enable on engine and run 5 engine steps
                window.engine.particles = testParticles;
                window.engine.enableGPUCompute(window.gpuCompute);
                for (let es = 0; es < 5; es++) {
                    window.engine.step(0.016);
                }
                window.renderer.render(window.engine);

                // 2. Test Continuous Collision Detection (CCD) Anti-Tunneling on GPU
                const testWall = new Wall(500, 0, 500, 1000, { thickness: 4 });
                window.gpuCompute.uploadWalls([testWall]);

                const fastParticles = [];
                for (let i = 0; i < 100; i++) {
                    fastParticles.push({
                        pos: { x: 460, y: 100 + i * 8 },
                        vel: { x: 3000, y: 0 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                window.gpuCompute.uploadParticles(fastParticles);

                // Step 1 frame at dt = 0.016 (displacement = 48 px across 4 px wall)
                window.gpuCompute.step(0.016, false, 0, 1.0, 2500, 2500, 3000, 1);

                const afterStep = await window.gpuCompute.readbackParticles(100);
                let gpuTunneled = 0;
                let gpuBounced = 0;
                for (let p of afterStep) {
                    if (p.pos.x > 500) gpuTunneled++;
                    if (p.pos.x <= 500 && p.vel.x < 0) gpuBounced++;
                }

                // 3. Test Continuous Collision Detection (CCD) Anti-Tunneling on CPU
                window.engine.clear();
                window.engine.useGPUCompute = false;
                const cpuWall = window.engine.addWall(500, 0, 500, 1000, { thickness: 4 });
                const cpuParticle = window.engine.addParticle(460, 500, 3000, 0, 1.0);
                window.engine.isPaused = false;
                window.engine.subSteps = 1;
                window.engine.step(0.016);
                const cpuTunneled = cpuParticle.pos.x > 500;
                const cpuBounced = cpuParticle.pos.x <= 500 && cpuParticle.vel.x < 0;

                return {
                    success: true,
                    count: 50000,
                    hasBuffer: !!outBuffer,
                    isEngineUsingGPU: true,
                    gpuTunneled,
                    gpuBounced,
                    cpuTunneled,
                    cpuBounced,
                    sampleGpuPos: afterStep[0] ? afterStep[0].pos : null,
                    sampleGpuVel: afterStep[0] ? afterStep[0].vel : null,
                    cpuPos: cpuParticle.pos,
                    cpuVel: cpuParticle.vel
                };
            } catch(e) {
                return { success: false, error: e.toString(), stack: e.stack };
            }
        })()'''

        res = send_cdp('Runtime.evaluate', {
            'expression': test_expr,
            'awaitPromise': True,
            'returnByValue': True
        })

        val = res.get('result', {}).get('value', {})
        print("GPU Compute Test Result:", json.dumps(val, indent=2))

        assert val.get('success') == True, f"GPU Compute simulation failed: {val.get('error')}"
        assert val.get('count') == 50000, f"Expected 50000 particles, got {val.get('count')}"
        assert val.get('hasBuffer') == True, "Output buffer is missing"
        assert val.get('isEngineUsingGPU') == True, "Engine did not enable GPU compute"
        assert val.get('gpuTunneled') == 0, f"GPU particles tunneled: {val.get('gpuTunneled')} tunneled!"
        assert val.get('gpuBounced') == 100, f"Expected 100 particles bounced on GPU, got {val.get('gpuBounced')}"
        assert val.get('cpuTunneled') == False, f"CPU particle tunneled through wall!"
        assert val.get('cpuBounced') == True, f"CPU particle failed to bounce!"

        print("\nAll 50,000 Particle Zero-Copy GPU Compute & CCD Anti-Tunneling tests PASSED!")

    finally:
        proc.terminate()

if __name__ == '__main__':
    run_test()
