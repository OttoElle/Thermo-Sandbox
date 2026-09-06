import os
import re

files_order = [
    'src/physics/Vector2.js',
    'src/physics/Particle.js',
    'src/physics/ParticleGroup.js',
    'src/physics/SpatialGrid.js',
    'src/physics/Wall.js',
    'src/physics/Piston.js',
    'src/physics/Reservoir.js',
    'src/physics/SensorZone.js',
    'src/physics/Emitter.js',
    'src/physics/Sink.js',
    'src/physics/Regulator.js',
    'src/physics/ThermalBlock.js',
    'src/physics/HeatExchanger.js',
    'src/physics/RegeneratorMatrix.js',
    'src/physics/TextLabel.js',
    'src/physics/ThrottleValve.js',
    'src/render/Colormap.js',
    'src/render/ParticleGLRenderer.js',
    'src/control/CycleSequencer.js',
    'src/physics/Engine.js',
    'src/render/Renderer.js',
    'src/analytics/TempTimeChart.js',
    'src/analytics/VelHistChart.js',
    'src/analytics/ChamberChart.js',
    'src/control/SequencerUI.js',
    'src/presets/index.js',
    'src/main.js'
]

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
    combined_js = "// ParticleLab Bundled Engine\n"
    for rel_path in files_order:
        path = os.path.join(base_dir, rel_path)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Remove import statements
        content = re.sub(r'import\s+.*?;?\n', '', content)
        # Remove export statements
        content = re.sub(r'export\s+(default\s+)?', '', content)
        combined_js += f"\n// --- {rel_path} ---\n" + content + "\n"

    bundle_path = os.path.join(base_dir, 'bundle.js')
    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write(combined_js)

    # Build Standalone HTML
    index_path = os.path.join(base_dir, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()
    css_path = os.path.join(base_dir, 'style.css')
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()

    import base64
    logo_path = os.path.join(base_dir, 'logo.png')
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            logo_b64 = base64.b64encode(f.read()).decode('utf-8')
        html = html.replace('src="logo.png"', f'src="data:image/png;base64,{logo_b64}"')

    standalone_html = re.sub(r'<link rel="stylesheet" href="style\.css(?:\?[^"]*)?">', '<style>\n' + css + '\n</style>', html)
    standalone_html = re.sub(r'<script src="bundle\.js(?:\?[^"]*)?"></script>', '<script>\n' + combined_js + '\n</script>', standalone_html)

    standalone_path = os.path.join(base_dir, 'ParticleLab_Standalone.html')
    with open(standalone_path, 'w', encoding='utf-8') as f:
        f.write(standalone_html)

    print("Build complete: bundle.js and ParticleLab_Standalone.html updated.")

if __name__ == '__main__':
    build()

