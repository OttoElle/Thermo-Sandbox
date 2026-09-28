import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tools'))
from js_modules import analyze

# JS file order is derived from the import graph starting at src/main.js
# (dependencies first), see tools/js_modules.py.
ENTRY = 'src/main.js'

css_files_order = [
    'css/variables.css',
    'css/base.css',
    'css/canvas.css',
    'css/ribbon.css',
    'css/sidebar-left.css',
    'css/sidebar-right.css',
    'css/playback.css',
    'css/modals.css',
    'css/splash.css',
    'css/sequencer.css'
]

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
    
    # 1. Bundle JavaScript Engine
    files_order, module_errors = analyze(base_dir, ENTRY)
    if module_errors:
        print('Module check failed (index.html?dev would break):')
        print('\n'.join('  ' + e for e in module_errors))
        sys.exit(1)

    combined_js = "// ParticleLab Bundled Engine\n"
    for rel_path in files_order:
        path = os.path.join(base_dir, rel_path)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Remove import lines and export keywords (line-anchored)
        content = re.sub(r'^import\b.*(?:\n|$)', '', content, flags=re.M)
        content = re.sub(r'^export\s+(default\s+)?', '', content, flags=re.M)
        combined_js += f"\n// --- {rel_path} ---\n" + content + "\n"

    bundle_path = os.path.join(base_dir, 'bundle.js')
    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write(combined_js)

    # 2. Bundle Modular CSS
    combined_css = "/* Thermo Sandbox Bundled Stylesheet */\n"
    for rel_path in css_files_order:
        path = os.path.join(base_dir, rel_path)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        combined_css += f"\n/* --- {rel_path} --- */\n" + content + "\n"

    # 3. Build Standalone HTML Bundle
    index_path = os.path.join(base_dir, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    import base64
    logo_path = os.path.join(base_dir, 'logo.png')
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            logo_b64 = base64.b64encode(f.read()).decode('utf-8')
        html = html.replace('src="logo.png"', f'src="data:image/png;base64,{logo_b64}"')

    # Replace modular CSS link tags (or legacy style.css) with inlined combined_css
    css_link_pattern = r'(?:\s*<!--.*?-->\s*)?(?:\s*<link rel="stylesheet" href="(?:style\.css|css/[^"]+)(?:\?[^"]*)?">\s*)+'
    # (function replacements, so backslashes in the sources are not treated as escapes)
    standalone_html = re.sub(css_link_pattern, lambda _: '\n  <style>\n' + combined_css + '  </style>\n', html)
    # The dev/bundle loader block in index.html becomes the inlined bundle
    app_script = re.compile(r'<!-- app-script\b.*?<!-- /app-script -->', re.S)
    if not app_script.search(standalone_html):
        print('index.html: <!-- app-script --> block not found')
        sys.exit(1)
    standalone_html = app_script.sub(lambda _: '<script>\n' + combined_js + '\n</script>', standalone_html)

    standalone_path = os.path.join(base_dir, 'ParticleLab_Standalone.html')
    with open(standalone_path, 'w', encoding='utf-8') as f:
        f.write(standalone_html)

    print("Build complete: bundle.js and ParticleLab_Standalone.html updated.")

if __name__ == '__main__':
    build()
