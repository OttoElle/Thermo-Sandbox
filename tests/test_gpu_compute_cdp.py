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

                // 2b. Test Shallow-Angle (Glancing) Wall Collision Detection
                const shallowWall = new Wall(500, 0, 500, 1000, { thickness: 4 });
                window.gpuCompute.uploadWalls([shallowWall]);
                const shallowParticles = [];
                for (let i = 0; i < 50; i++) {
                    shallowParticles.push({
                        pos: { x: 490, y: 100 + i * 15 },
                        vel: { x: 1200, y: 7000 }, // ~80 degree glancing angle
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                window.gpuCompute.uploadParticles(shallowParticles);
                window.gpuCompute.step(0.016, false, 0, 1.0, null, 3000, 1);
                const afterShallow = await window.gpuCompute.readbackParticles(50);
                let shallowTunneled = 0;
                let shallowBounced = 0;
                for (let p of afterShallow) {
                    if (p.pos.x > 500) shallowTunneled++;
                    if (p.pos.x <= 500 && p.vel.x < 0) shallowBounced++;
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

                // 4. Test Continuous Emitter Emission in GPU Mode
                window.engine.clear();
                window.engine.useGPUCompute = true;
                window.engine.isPaused = false;
                window.engine.addEmitter(100, 100, 40, 40, { rate: 60, temperature: 300, mass: 1.0 });
                for (let emStep = 0; emStep < 15; emStep++) {
                    window.engine.step(0.016);
                }
                const emitterActive = window.engine.particles.length > 0;
                const emitterGpuCount = window.gpuCompute.count;

                // 5. Test Ideal Gas Energy Conservation (No Freezing / Damping)
                window.engine.clear();
                window.engine.simModel = 'hard_sphere';
                const initialParticles = [];
                for (let i = 0; i < 500; i++) {
                    initialParticles.push({
                        pos: { x: 300 + (i % 20) * 10, y: 300 + Math.floor(i / 20) * 10 },
                        vel: { x: 200, y: 0 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                window.gpuCompute.uploadParticles(initialParticles);
                for (let s = 0; s < 30; s++) {
                    window.gpuCompute.step(0.016, false, 0, 1.0, null, 380, 4, 0);
                }
                const afterSim = await window.gpuCompute.readbackParticles(500);
                let totalSpeed = 0;
                for (let p of afterSim) {
                    totalSpeed += Math.hypot(p.vel.x, p.vel.y);
                }
                const meanSpeedAfter = totalSpeed / afterSim.length;

                // 6. Test Dense Confined Gas: Anti-Freezing, Anti-Clustering & Anti-Tunneling against Walls
                window.engine.clear();
                window.engine.useGPUCompute = true;
                window.engine.enableGPUCompute(window.gpuCompute);
                window.engine.addWall(200, 100, 200, 700, { thickness: 4 });
                window.engine.addWall(600, 100, 600, 700, { thickness: 4 });
                window.engine.addWall(200, 100, 600, 100, { thickness: 4 });
                window.engine.addWall(200, 700, 600, 700, { thickness: 4 });

                const denseN = 1000;
                window.engine.spawnGasRaster(220, 120, 360, 560, denseN, 1.0, 300);
                window.engine.syncParticlesToGPU();
                window.engine.syncWallsToGPU();

                for (let step = 0; step < 180; step++) {
                    window.engine.step(0.016);
                }

                const denseAfter = await window.gpuCompute.readbackParticles(denseN);
                let denseTunneled = 0;
                let denseFrozen = 0;
                let denseSpeedSum = 0;
                for (let p of denseAfter) {
                    const spd = Math.hypot(p.vel.x, p.vel.y);
                    denseSpeedSum += spd;
                    if (spd < 10) denseFrozen++;
                    if (p.pos.x < 195 || p.pos.x > 605 || p.pos.y < 95 || p.pos.y > 705) {
                        denseTunneled++;
                    }
                }
                const denseMeanSpeed = denseSpeedSum / denseAfter.length;

                // 7. Test Negative World Space Collisions (Unbounded GPU Spatial Hash Grid)
                const negPts = [
                    { pos: { x: -1205, y: -800 }, vel: { x: 100, y: 0 }, radius: 3.5, mass: 1.0 },
                    { pos: { x: -1195, y: -800 }, vel: { x: -100, y: 0 }, radius: 3.5, mass: 1.0 }
                ];
                window.gpuCompute.uploadParticles(negPts);
                for (let i = 0; i < 5; i++) {
                    window.gpuCompute.step(0.016, false, 0, 1.0, null, 380, 4, 0);
                }
                const negRes = await window.gpuCompute.readbackParticles(2);
                const negCollisionBounced = (negRes[0].vel.x < 0) && (negRes[1].vel.x > 0);

                // 8. Test GPU Telemetry Readback, Sensor Zone Metrics, Drift Compass, and Dashboard Chart
                window.engine.clear();
                window.engine.useGPUCompute = true;
                window.engine.enableGPUCompute(window.gpuCompute);
                const sensor = window.engine.addSensor(300, 300, 200, 200, { label: 'TestChamber' });
                
                const driftPts = [];
                for (let i = 0; i < 300; i++) {
                    driftPts.push({
                        pos: { x: 320 + (i % 15) * 10, y: 320 + Math.floor(i / 15) * 8 },
                        vel: { x: 150 + Math.random() * 20, y: Math.random() * 10 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                window.engine.particles = driftPts;
                window.engine.syncParticlesToGPU();
                for (let i = 0; i < 10; i++) {
                    window.engine.step(0.016);
                }

                const telem = await window.gpuCompute.fetchTelemetry(50000);
                let telemSuccess = false;
                if (telem) {
                    window.engine.updateTelemetryFromGPU(telem);
                    telemSuccess = true;
                }

                const telemStats = {
                    hasTelem: telemSuccess,
                    sysTemp: window.engine.stats.systemTemperature,
                    sysEnergy: window.engine.stats.totalKineticEnergy,
                    sysSpeed: window.engine.stats.meanSpeed,
                    sensorCount: sensor.particleCount,
                    sensorTemp: sensor.temperature,
                    sensorPressure: sensor.pressure,
                    sensorDriftSpeed: sensor.displayDriftSpeed,
                    hasSpeedSamples: !!(sensor.speedSamples && sensor.speedSamples.length > 0)
                };

                // 9. Test GPU Sink (Absorber) Absorption & Compaction
                window.engine.clear();
                window.engine.useGPUCompute = true;
                window.engine.enableGPUCompute(window.gpuCompute);
                
                const testSink = window.engine.addSink(400, 400, 100, 100, { maxParticles: 50 });
                const sinkPts = [];
                // 25 particles placed inside the sink
                for (let i = 0; i < 25; i++) {
                    sinkPts.push({
                        pos: { x: 420 + (i % 5) * 10, y: 420 + Math.floor(i / 5) * 10 },
                        vel: { x: 50, y: 0 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                // 15 particles placed outside the sink
                for (let i = 0; i < 15; i++) {
                    sinkPts.push({
                        pos: { x: 100 + i * 10, y: 100 },
                        vel: { x: 0, y: 0 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                window.engine.particles = sinkPts;
                window.engine.syncParticlesToGPU();
                window.engine.syncSinksToGPU();

                // Run steps on GPU so sink absorbs inside particles
                for (let i = 0; i < 5; i++) {
                    window.engine.step(0.016);
                }

                const sinkTelem = await window.gpuCompute.fetchTelemetry(50000);
                if (sinkTelem) {
                    window.engine.updateTelemetryFromGPU(sinkTelem);
                }

                const sinkAbsorbedCount = testSink.absorbedCount;
                const particleCountAfterAbsorb = window.engine.stats.particleCount;

                // Delete the sink and verify particles in that area are NO LONGER absorbed
                window.engine.sinks = [];
                window.engine.syncSinksToGPU();

                const newPtsInArea = [];
                for (let i = 0; i < 10; i++) {
                    newPtsInArea.push({
                        pos: { x: 420 + i * 5, y: 420 },
                        vel: { x: 10, y: 0 },
                        radius: 3.5,
                        mass: 1.0
                    });
                }
                window.engine.particles = newPtsInArea;
                window.engine.syncParticlesToGPU();

                for (let i = 0; i < 5; i++) {
                    window.engine.step(0.016);
                }

                const postDeleteTelem = await window.gpuCompute.fetchTelemetry(50000);
                if (postDeleteTelem) {
                    window.engine.updateTelemetryFromGPU(postDeleteTelem);
                }
                const particleCountAfterDelete = window.engine.stats.particleCount;

                // 10. Test Drift Chart & History Rendering
                const dummyCanvas = document.createElement('canvas');
                dummyCanvas.width = 200; dummyCanvas.height = 100;
                const globalDriftChart = new window.DashboardChart('d1', 'global', 'drift', dummyCanvas);
                globalDriftChart.render(window.engine);

                const chamberDriftChart = new window.DashboardChart('d2', sensor, 'drift', dummyCanvas);
                chamberDriftChart.render(window.engine);

                const hasGlobalDriftHistory = !!(window.engine.historyDrift && window.engine.historyDrift.length > 0);

                // 11. Test Piston-Sensor Dynamic Boundary Binding & Volume Tracking
                const testPiston = window.engine.addPiston({
                    x: 500, y: 300, width: 28, height: 120,
                    orientation: 'horizontal',
                    mode: 'motorized',
                    frequency: 1.0,
                    minPos: 350,
                    maxPos: 650
                });
                const boundSensor = window.engine.addSensor({
                    x: 200, y: 240, width: 286, height: 120,
                    label: 'BoundChamber'
                });
                boundSensor.bindToPiston(testPiston, 'right', true);
                const initialSensorWidth = boundSensor.width;

                for (let s = 0; s < 25; s++) {
                    window.engine.step(0.016);
                }

                const steppedSensorWidth = boundSensor.width;
                const steppedPistonLeftFace = testPiston.x - testPiston.width * 0.5;
                const widthFollowedPiston = Math.abs((boundSensor.x + boundSensor.width) - steppedPistonLeftFace) < 1.0;
                const volumeChanged = (boundSensor.volume !== initialSensorWidth * 120);

                // Test P-V Dashboard Chart rendering and work badge
                const pvCanvas = document.createElement('canvas');
                pvCanvas.width = 240; pvCanvas.height = 140;
                const pvChart = new window.DashboardChart('pv1', boundSensor, 'pv', pvCanvas);
                pvChart.render(window.engine);

                // Test unbinding
                boundSensor.unbindPiston();
                const isUnbound = (boundSensor.pistonBinding === null);

                return {
                    success: true,
                    count: 50000,
                    hasBuffer: !!outBuffer,
                    isEngineUsingGPU: true,
                    gpuTunneled,
                    gpuBounced,
                    shallowTunneled,
                    shallowBounced,
                    cpuTunneled,
                    cpuBounced,
                    emitterActive,
                    emitterGpuCount,
                    meanSpeedAfter,
                    denseTunneled,
                    denseFrozen,
                    denseMeanSpeed,
                    negCollisionBounced,
                    telemStats,
                    sinkAbsorbedCount,
                    particleCountAfterAbsorb,
                    particleCountAfterDelete,
                    hasGlobalDriftHistory,
                    widthFollowedPiston,
                    volumeChanged,
                    isUnbound,
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
        assert val.get('shallowTunneled') == 0, f"Shallow glancing GPU particles tunneled: {val.get('shallowTunneled')} tunneled!"
        assert val.get('shallowBounced') == 50, f"Expected 50 shallow particles bounced on GPU, got {val.get('shallowBounced')}"
        assert val.get('cpuTunneled') == False, f"CPU particle tunneled through wall!"
        assert val.get('cpuBounced') == True, f"CPU particle failed to bounce!"
        assert val.get('emitterActive') == True, "Emitter did not emit particles in GPU mode!"
        assert val.get('emitterGpuCount', 0) > 0, "GPU compute did not synchronize emitted particles!"
        assert val.get('meanSpeedAfter', 0) > 120, f"Ideal gas froze! Mean speed {val.get('meanSpeedAfter')} is too low (expected > 120)"
        assert val.get('denseTunneled') == 0, f"Dense gas particles tunneled through wall: {val.get('denseTunneled')}"
        assert val.get('denseFrozen') < 20, f"Dense gas froze into cluster! {val.get('denseFrozen')} particles frozen"
        assert val.get('denseMeanSpeed', 0) > 120, f"Dense gas mean speed {val.get('denseMeanSpeed')} is too low (expected > 120, MB eq is ~128.4)"
        assert val.get('negCollisionBounced') == True, "Particles at negative coordinates failed to collide/bounce on GPU!"

        # Telemetry & Sensor Zone assertions
        telem = val.get('telemStats', {})
        assert telem.get('hasTelem') == True, "Failed to fetch GPU telemetry"
        assert telem.get('sysTemp', 0) > 0, f"System temperature is {telem.get('sysTemp')}, expected > 0"
        assert telem.get('sysEnergy', 0) > 0, f"System kinetic energy is {telem.get('sysEnergy')}, expected > 0"
        assert telem.get('sysSpeed', 0) > 0, f"System mean speed is {telem.get('sysSpeed')}, expected > 0"
        assert telem.get('sensorCount', 0) > 0, f"Sensor particle count is {telem.get('sensorCount')}, expected > 0"
        assert telem.get('sensorTemp', 0) > 0, f"Sensor temperature is {telem.get('sensorTemp')}, expected > 0"
        assert telem.get('sensorPressure', 0) > 0, f"Sensor pressure is {telem.get('sensorPressure')}, expected > 0"
        assert telem.get('sensorDriftSpeed', 0) > 0, f"Sensor macroscopic drift speed is {telem.get('sensorDriftSpeed')}, expected > 0"
        assert telem.get('hasSpeedSamples') == True, "Sensor speedSamples not recorded for velocity histograms"

        # Sink absorption & Drift chart assertions
        assert val.get('sinkAbsorbedCount') == 25, f"Expected 25 particles absorbed by GPU sink, got {val.get('sinkAbsorbedCount')}"
        assert val.get('particleCountAfterAbsorb') == 15, f"Expected 15 live particles remaining, got {val.get('particleCountAfterAbsorb')}"
        assert val.get('particleCountAfterDelete') == 10, f"Expected 10 particles to survive after sink deletion, got {val.get('particleCountAfterDelete')}"
        assert val.get('hasGlobalDriftHistory') == True, "Global drift velocity was not recorded into engine.historyDrift"

        # Piston-Sensor dynamic boundary assertions
        assert val.get('widthFollowedPiston') == True, "Bound sensor chamber width failed to follow piston left face!"
        assert val.get('volumeChanged') == True, "Bound sensor chamber volume did not dynamically change as piston moved!"
        assert val.get('isUnbound') == True, "Sensor unbindPiston failed to clear pistonBinding!"

        print("\nAll 50,000 Particle Zero-Copy GPU Compute, Emitter, Telemetry & Sensor Zone tests PASSED!")

    finally:
        proc.terminate()

if __name__ == '__main__':
    run_test()
