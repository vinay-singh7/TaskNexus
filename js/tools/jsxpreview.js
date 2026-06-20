/* ============================================================
   TASKNEXUS — JSX PREVIEW & HTML EXPORT
   Compile JSX in-browser (Babel Standalone), preview in a
   sandboxed iframe, and export a standalone runnable .html.
   ============================================================ */
(function(){
  const el = document.getElementById('panel-jsxpreview');
  if(!el) return;

  let isTs = false;
  let tsLoading = null;

  const SAMPLE = `export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 40, textAlign: 'center' }}>
      <h1>Hello World 👋</h1>
      <p>You clicked <b>{count}</b> times.</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer',
                 border: 'none', borderRadius: 8, background: '#4f46e5', color: '#fff' }}>
        Click Me
      </button>
    </div>
  );
}`;

  el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">JSX Preview</h1><p class="panel-desc">Paste or upload a JSX/TSX component, preview it instantly, and export a standalone HTML file — no React project or build step needed.</p></div>

    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin:0">
          ⬆ Upload .jsx / .tsx<input type="file" id="jsx-file" accept=".jsx,.tsx,.js,.ts" style="display:none"/>
        </label>
        <button class="btn btn-primary btn-sm" id="jsx-preview">▶ Preview</button>
        <button class="btn btn-secondary btn-sm" id="jsx-export">⬇ Download HTML</button>
        <button class="btn btn-ghost btn-sm" id="jsx-sample">Load sample</button>
        <span id="jsx-status" style="font-size:.78rem;color:var(--text-3)"></span>
      </div>
    </div>

    <div id="jsx-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:var(--radius-md);padding:12px 14px;margin-bottom:14px;font-family:var(--font-mono);font-size:.8rem;white-space:pre-wrap;overflow:auto"></div>

    <div class="jsx-grid">
      <div class="card" style="display:flex;flex-direction:column;min-height:360px">
        <div style="font-size:.8rem;font-weight:600;color:var(--text-2);margin-bottom:8px">JSX Code Editor</div>
        <textarea id="jsx-code" spellcheck="false" style="flex:1;width:100%;min-height:320px;resize:vertical;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-family:var(--font-mono);font-size:.82rem;line-height:1.5;color:var(--text);background:var(--surface);outline:none;tab-size:2"></textarea>
      </div>
      <div class="card" style="display:flex;flex-direction:column;min-height:360px;padding:0;overflow:hidden">
        <div style="font-size:.8rem;font-weight:600;color:var(--text-2);padding:14px 16px 8px">Live Preview</div>
        <iframe id="jsx-frame" title="JSX preview" sandbox="allow-scripts allow-popups allow-modals" style="flex:1;width:100%;border:none;background:#fff;min-height:320px"></iframe>
      </div>
    </div>

    <style>
      .jsx-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      @media (max-width:900px){ .jsx-grid{ grid-template-columns:1fr; } }
    </style>`;

  const codeEl   = document.getElementById('jsx-code');
  const errEl    = document.getElementById('jsx-error');
  const statusEl = document.getElementById('jsx-status');
  const frame    = document.getElementById('jsx-frame');

  codeEl.value = SAMPLE;

  // Tab key inserts two spaces instead of leaving the textarea
  codeEl.addEventListener('keydown', e=>{
    if(e.key==='Tab'){ e.preventDefault(); const s=codeEl.selectionStart, en=codeEl.selectionEnd;
      codeEl.value = codeEl.value.slice(0,s)+'  '+codeEl.value.slice(en); codeEl.selectionStart=codeEl.selectionEnd=s+2; }
  });

  document.getElementById('jsx-sample').addEventListener('click', ()=>{ codeEl.value=SAMPLE; isTs=false; clearError(); });
  document.getElementById('jsx-file').addEventListener('change', e=>{
    const f=e.target.files[0]; if(!f) return;
    const ext=(f.name.split('.').pop()||'').toLowerCase();
    isTs = (ext==='tsx'||ext==='ts');
    const r=new FileReader();
    r.onload=()=>{ codeEl.value=r.result; clearError(); status(`Loaded ${f.name}`); };
    r.readAsText(f);
    e.target.value='';
  });
  document.getElementById('jsx-preview').addEventListener('click', preview);
  document.getElementById('jsx-export').addEventListener('click', exportHtml);

  function status(msg){ statusEl.textContent = msg || ''; }
  function clearError(){ errEl.style.display='none'; errEl.textContent=''; }
  function showError(msg){ errEl.textContent = String(msg); errEl.style.display='block'; status(''); }

  function loadTypeScript(){
    if(window.ts) return Promise.resolve(window.ts);
    if(!tsLoading){
      tsLoading = new Promise((res, rej)=>{
        const s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/typescript@5/lib/typescript.js';
        s.async=true;
        s.onload=()=>{
          if(!window.ts) return rej(new Error('TypeScript failed to initialize.'));
          res(window.ts);
        };
        s.onerror=()=>rej(new Error('Network error loading TypeScript.'));
        document.head.appendChild(s);
      });
    }
    return tsLoading;
  }

  // Strip imports (React/ReactDOM are provided as globals) and normalise exports
  function preprocess(src){
    let code = src;
    code = code.replace(/^[ \t]*import[ \t][^\n;]*;?[ \t]*$/gm, '');           // drop import lines
    code = code.replace(/export\s+default\s+/, 'window.__COMP__ = ');          // default export → capture
    code = code.replace(/export\s*\{[^}]*\}\s*;?/g, '');                       // drop `export { ... }`
    code = code.replace(/\bexport\s+(const|let|var|function|class|async)\b/g, '$1'); // drop `export` keyword
    return code;
  }

  async function compile(){
    let ts;
    try {
      ts = await loadTypeScript();
    } catch(e){
      throw new Error('Compiler failed to load: ' + e.message);
    }
    if(!ts || typeof ts.transpileModule !== 'function'){
      throw new Error('Compiler unavailable.');
    }
    try {
      const code = preprocess(codeEl.value);
      const result = ts.transpileModule(code, {
        compilerOptions: {
          jsx: ts.JsxEmit.React,
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext
        }
      });
      if(!result.outputText) throw new Error('Transpile returned empty.');
      return result.outputText;
    } catch(e){
      throw new Error((e.message||'Compile failed'));
    }
  }

  function buildHtml(compiled){
    const safe = compiled.replace(/<\/script>/gi, '<\\/script>');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>JSX Preview</title>
<style>html,body{margin:0}#root{min-height:100vh}</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
<div id="root"></div>
<script>
(function(){
  function showErr(m){ document.body.innerHTML='<pre style="color:#b91c1c;padding:16px;white-space:pre-wrap;font:13px/1.5 ui-monospace,monospace">'+String(m).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>'; }
  window.addEventListener('error', function(e){ showErr(e.message); });
  window.addEventListener('unhandledrejection', function(e){ showErr((e.reason&&e.reason.message)||e.reason); });
  try {
    var React = window.React, ReactDOM = window.ReactDOM;
    var useState=React.useState, useEffect=React.useEffect, useRef=React.useRef, useMemo=React.useMemo,
        useCallback=React.useCallback, useContext=React.useContext, useReducer=React.useReducer,
        useLayoutEffect=React.useLayoutEffect, Fragment=React.Fragment, createContext=React.createContext;
    window.__COMP__ = undefined;
    ${safe}
    var __C = window.__COMP__;
    if(!__C){ throw new Error('No component exported. Use:  export default function App() { ... }'); }
    var __root = document.getElementById('root');
    var __el = React.createElement(__C);
    if(ReactDOM.createRoot) ReactDOM.createRoot(__root).render(__el);
    else ReactDOM.render(__el, __root);
  } catch(err){ showErr((err && err.stack) || err); }
})();
</script>
</body>
</html>`;
  }

  async function preview(){
    clearError(); status('Compiling…');
    try {
      const compiled = await compile();
      frame.srcdoc = buildHtml(compiled);
      status('Rendered ✓');
    } catch(err){
      showError(formatErr(err));
    }
  }

  async function exportHtml(){
    clearError(); status('Building HTML…');
    try {
      const compiled = await compile();
      const html = buildHtml(compiled);
      const blob = new Blob([html], { type:'text/html' });
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='output.html';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      status('Downloaded output.html ✓');
      toast('output.html downloaded — open it in any browser','success');
    } catch(err){
      showError(formatErr(err));
    }
  }

  function formatErr(err){
    const m = (err && err.message) ? err.message : String(err);
    return 'Compilation error:\n' + m;
  }

  // Render the sample on first open
  preview();
})();
