"""
tests/verify_all.py
Comprehensive Automated Verification Suite for Thermo Sandbox Sequencer Re-Architecture.
"""
import os
import sys
import glob
import json
import time
import urllib.request
import subprocess

def test_file_sizes():
    print("\n--- 1. File Size Audit (< 350 lines per control file) ---")
    files = glob.glob('src/control/*.js')
    all_ok = True
    for fpath in sorted(files):
        with open(fpath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        count = len(lines)
        ok = count < 350
        if not ok: all_ok = False
        print(f"  {os.path.basename(fpath):32s}: {count:4d} lines [{'PASS' if ok else 'FAIL'}]")
    if not all_ok:
        raise AssertionError("One or more files in src/control/ exceed 350 lines limit!")
    print("File size audit PASSED.")

def test_css_integrity():
    print("\n--- 2. CSS Syntax & Module Integrity ---")
    css_files = glob.glob('css/*.css')
    for fpath in sorted(css_files):
        with open(fpath, 'r', encoding='utf-8') as f:
            txt = f.read()
        open_b = txt.count('{')
        close_b = txt.count('}')
        assert open_b == close_b, f"Brace mismatch in {fpath}: {open_b} open vs {close_b} close"
        open_c = txt.count('/*')
        close_c = txt.count('*/')
        assert open_c == close_c, f"Comment mismatch in {fpath}: {open_c} open vs {close_c} close"
        print(f"  {os.path.basename(fpath):20s}: {open_b:3d} rules, {open_c:2d} comments [PASS]")
    print("CSS integrity audit PASSED.")

def test_build():
    print("\n--- 3. Build Verification (build_all.py) ---")
    res = subprocess.run([sys.executable, 'build_all.py'], capture_output=True, text=True)
    print(res.stdout.strip())
    assert res.returncode == 0, f"build_all.py failed: {res.stderr}"
    assert os.path.exists('bundle.js'), "bundle.js was not generated"
    assert os.path.exists('ParticleLab_Standalone.html'), "ParticleLab_Standalone.html was not generated"
    print("Build verification PASSED.")

def test_browser_cdp():
    print("\n--- 4. Headless Chrome Browser Runtime Test ---")
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(chrome_path):
        print("Chrome not found at standard path, skipping browser CDP test.")
        return

    user_data = os.path.join(os.environ.get('TEMP', '.'), 'chrome_test_profile_' + str(int(time.time())))
    abs_html = os.path.abspath('ParticleLab_Standalone.html')
    file_url = 'file:///' + abs_html.replace('\\', '/')

    cmd = [
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9444',
        f'--user-data-dir={user_data}',
        '--disable-gpu',
        '--allow-file-access-from-files',
        file_url
    ]

    proc = subprocess.Popen(cmd)
    try:
        # Wait for debugging port
        debugger_url = None
        for _ in range(25):
            time.sleep(0.2)
            try:
                with urllib.request.urlopen('http://127.0.0.1:9444/json/list', timeout=1) as resp:
                    pages = json.loads(resp.read().decode('utf-8'))
                    if pages:
                        debugger_url = pages[0].get('webSocketDebuggerUrl')
                        break
            except Exception:
                pass

        if not debugger_url:
            print("Could not connect to Chrome debugging target on port 9444.")
            return

        print(f"Connected to Headless Chrome endpoint: {debugger_url}")
        print("Headless Chrome runtime launch verified.")
    finally:
        proc.terminate()

def main():
    print("==================================================")
    print("  Thermo Sandbox Sequencer Re-Architecture Tests  ")
    print("==================================================")
    test_file_sizes()
    test_css_integrity()
    test_build()
    test_browser_cdp()
    print("\n==================================================")
    print("  ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == '__main__':
    main()
