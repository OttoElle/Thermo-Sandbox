"""Static import/export analysis for the ES-module sources in src/.

The build concatenates all modules into one global script, so a missing
import goes unnoticed there but breaks the unbundled dev mode
(index.html?dev). `analyze()` resolves the import graph from an entry file,
returns the files in dependency order and reports:

- imports of names the target file does not export,
- top-level names of another module used without importing them,
- assignments to imported bindings (allowed in the bundle, TypeError in modules),
- top-level names declared in more than one module (collide in the bundle).

The scanner is regex-based after stripping comments and string contents, so
it works on this codebase's plain style, not on arbitrary JavaScript.
"""
import os
import re

IDENT = r'[A-Za-z_$][\w$]*'
TOP_DECL = re.compile(rf'^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:class|function\*?|const|let|var)\s+({IDENT})', re.M)
EXPORT_DECL = re.compile(rf'^export\s+(?:default\s+)?(?:async\s+)?(?:class|function\*?|const|let|var)\s+({IDENT})', re.M)
EXPORT_LIST = re.compile(r'^export\s*\{([^}]*)\}', re.M)
IMPORT = re.compile(r'^import\s*\{([^}]*)\}\s*from\s*[\'"]([^\'"]+)[\'"]\s*;?', re.M)
IMPORT_BARE = re.compile(r'^import\s*[\'"]([^\'"]+)[\'"]\s*;?', re.M)
IMPORT_ANY = re.compile(r'^import\b.*$', re.M)
LOCAL_DECL = re.compile(rf'\b(?:class|function|const|let|var)\s+({IDENT})')
DESTRUCTURE = re.compile(r'\b(?:const|let|var)\s*[{\[]([^}\]=]*)[}\]]\s*=')
METHOD_PREFIX = r'^\s*(?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?'
METHOD_DEF = re.compile(rf'{METHOD_PREFIX}({IDENT})\s*\([^()]*\)\s*\{{', re.M)
PARAMS = re.compile(rf'(?:\bfunction\s*{IDENT}?\s*|{METHOD_PREFIX}{IDENT}\s*)\(([^()]*)\)\s*\{{|\(([^()]*)\)\s*=>|\b({IDENT})\s*=>|\bcatch\s*\(\s*({IDENT})', re.M)
USE = re.compile(rf'(?<![\w$.])({IDENT})\b')

REGEX_PREFIX = set('(,=:[!&|?{};+-*%<>~^')


def strip_code(src):
    """Blank out comments, string and regex literal contents; keep template ${} code."""
    out = []
    i, n = 0, len(src)
    stack = []  # open template literals: brace depth inside ${ }, -1 = in template text
    last = ''   # last significant char, to tell regexes from divisions
    while i < n:
        c = src[i]
        if stack and stack[-1] == 0 and c == '}':
            stack[-1] = -1  # back inside the template text
            out.append(c)
            i += 1
            continue
        if stack and stack[-1] == -1:
            if c == '\\':
                out.append('  ')
                i += 2
            elif c == '`':
                stack.pop()
                out.append(c)
                i += 1
                last = '`'
            elif src.startswith('${', i):
                stack[-1] = 0
                out.append('${')
                i += 2
                last = '{'
            else:
                out.append('\n' if c == '\n' else ' ')
                i += 1
            continue
        if src.startswith('//', i):
            j = src.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i))
            i = j
        elif src.startswith('/*', i):
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', src[i:j]))
            i = j
        elif c in '\'"':
            j = i + 1
            while j < n and src[j] != c and src[j] != '\n':
                j += 2 if src[j] == '\\' else 1
            out.append(c + ' ' * (j - i - 1) + c)
            i = j + 1
            last = c
        elif c == '`':
            stack.append(-1)
            out.append(c)
            i += 1
        elif c == '/' and (last in REGEX_PREFIX or last == ''):
            j = i + 1
            in_class = False
            while j < n and src[j] != '\n':
                if src[j] == '\\':
                    j += 2
                    continue
                if src[j] == '[':
                    in_class = True
                elif src[j] == ']':
                    in_class = False
                elif src[j] == '/' and not in_class:
                    break
                j += 1
            out.append('/' + ' ' * (j - i - 1) + '/')
            i = j + 1
            last = '/'
        else:
            if stack and stack[-1] >= 0:
                if c == '{':
                    stack[-1] += 1
                elif c == '}':
                    stack[-1] -= 1
            out.append(c)
            if not c.isspace():
                last = 'a' if (c.isalnum() or c in '_$') else c
            i += 1
    return ''.join(out)


def _names(listing):
    """'A, B as C' -> [(A, A), (B, C)] as (exported, local)."""
    result = []
    for part in listing.split(','):
        part = part.strip()
        if not part:
            continue
        bits = re.split(r'\s+as\s+', part)
        result.append((bits[0].strip(), bits[-1].strip()))
    return result


class Module:
    def __init__(self, path, text):
        self.path = path
        self.code = strip_code(text)
        self.top = TOP_DECL.findall(self.code)
        self.exports = set(EXPORT_DECL.findall(self.code))
        for listing in EXPORT_LIST.findall(self.code):
            self.exports.update(local for local, _ in _names(listing))
        self.imports = []  # (resolved path, exported name, local name)
        for listing, spec in IMPORT.findall(text):
            target = os.path.normpath(os.path.join(os.path.dirname(path), spec))
            for exported, local in _names(listing):
                self.imports.append((target, exported, local))
        # Side-effect-only imports (modules that just register listeners)
        self.side_effect_imports = [os.path.normpath(os.path.join(os.path.dirname(path), spec))
                                    for spec in IMPORT_BARE.findall(text)]
        self.bad_import_lines = [m for m in IMPORT_ANY.findall(text) if not IMPORT.match(m) and not IMPORT_BARE.match(m)]
        body = IMPORT_ANY.sub('', self.code)
        self.locals = set(LOCAL_DECL.findall(body))
        for group in DESTRUCTURE.findall(body):
            self.locals.update(re.findall(IDENT, group))
        for m in PARAMS.finditer(body):
            for group in m.groups():
                if group:
                    self.locals.update(re.findall(rf'(?<![.\w$])({IDENT})(?=\s*(?:[,=)]|$))', group))
        self.uses = set(USE.findall(METHOD_DEF.sub('', body)))
        self.body = body

    def assigns(self, name):
        """True if the module assigns to the free name (=, op=, ++, --)."""
        n = re.escape(name)
        return re.search(rf'(?<![\w$.]){n}\s*(?:=(?!=)|\+\+|--|[-+*/%|&^]=)|(?:\+\+|--){n}\b', self.body) is not None


def analyze(root, entry):
    """Returns (ordered file list relative to root, list of error strings)."""
    modules = {}
    order = []
    errors = []

    def visit(path):
        if path in modules:
            return
        full = os.path.join(root, path)
        if not os.path.exists(full):
            errors.append(f'{path}: file not found')
            modules[path] = None
            return
        with open(full, encoding='utf-8') as f:
            mod = Module(path, f.read())
        modules[path] = mod
        for target, _, _ in mod.imports:
            visit(target)
        for target in mod.side_effect_imports:
            visit(target)
        order.append(path)

    visit(os.path.normpath(entry))

    src_dir = os.path.dirname(os.path.normpath(entry))
    for dirpath, _, files in os.walk(os.path.join(root, src_dir)):
        for f in files:
            rel = os.path.normpath(os.path.relpath(os.path.join(dirpath, f), root))
            if f.endswith('.js') and rel not in modules:
                errors.append(f'{rel}: not reachable from {entry} (add an import, or a bare import for side effects)')

    owners = {}
    for path in order:
        for name in modules[path].top:
            owners.setdefault(name, []).append(path)
    for name, paths in owners.items():
        if len(paths) > 1:
            errors.append(f'top-level name {name!r} declared in several modules: {", ".join(paths)}')

    for path in order:
        mod = modules[path]
        for line in mod.bad_import_lines:
            errors.append(f'{path}: unsupported import form (use a single-line named import): {line.strip()}')
        imported = set()
        for target, exported, local in mod.imports:
            imported.add(local)
            tmod = modules.get(target)
            if tmod is not None and exported not in tmod.exports:
                errors.append(f'{path}: imports {exported!r} from {target}, which does not export it')
            if local not in mod.locals and mod.assigns(local):
                errors.append(f'{path}: assigns to imported binding {local!r} (read-only in modules; use a shared state object)')
        for name in sorted(mod.uses - imported - set(mod.top) - mod.locals):
            owner = owners.get(name)
            if not owner:
                continue
            if name in modules[owner[0]].exports:
                errors.append(f'{path}: uses {name!r} from {owner[0]} without importing it')
            else:
                errors.append(f'{path}: uses {name!r}, a non-exported top-level name of {owner[0]} (implicit global)')
    return [p.replace('\\', '/') for p in order], errors


if __name__ == '__main__':
    import sys
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files, errs = analyze(base, 'src/main.js')
    print('\n'.join(files))
    print(f'\n{len(errs)} problem(s)')
    print('\n'.join(errs))
    sys.exit(1 if errs else 0)
