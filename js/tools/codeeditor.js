(function(){
  const el = document.getElementById('panel-codeeditor');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header" style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h1 class="panel-title">Code Editor</h1>
        <p class="panel-desc">Online code editor powered by Monaco (VS Code engine)</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <select id="code-lang" class="form-input" style="width:140px;padding:8px 12px">
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="python">Python</option>
          <option value="json">JSON</option>
          <option value="typescript">TypeScript</option>
        </select>
        <button class="btn btn-secondary" id="btn-copy-code" title="Copy to Clipboard">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="btn btn-primary" id="btn-run-code" title="Run Code">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run
        </button>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;height:calc(100vh - 200px);border-color:var(--border-2);display:flex;flex-direction:column">
      <div id="monaco-container" style="flex:1;width:100%;min-height:0"></div>
      <div id="code-output-pane" style="height:180px;border-top:1px solid var(--border-2);background:var(--bg);display:none;flex-direction:column">
        <div style="padding:6px 12px;background:var(--surface-2);font-size:0.75rem;font-weight:700;color:var(--text-3);border-bottom:1px solid var(--border-2);display:flex;justify-content:space-between;align-items:center">
          <span>OUTPUT PREVIEW</span>
          <button id="btn-close-output" style="background:none;border:none;color:var(--text-4);cursor:pointer;font-size:1.2rem;line-height:1">&times;</button>
        </div>
        <iframe id="code-output-frame" style="flex:1;width:100%;border:none;background:#fff"></iframe>
        <div id="code-output-console" style="flex:1;width:100%;border:none;background:var(--bg);color:var(--text);font-family:var(--font-mono);font-size:0.85rem;padding:12px;overflow-y:auto;display:none"></div>
      </div>
    </div>
  `;

  let editorInstance = null;

  function initMonaco() {
    if (window.monaco) {
      createEditor();
    } else {
      // Monaco uses an AMD loader
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
      require(['vs/editor/editor.main'], function() {
        createEditor();
      });
    }
  }

  function createEditor() {
    const container = document.getElementById('monaco-container');
    if (!container) return;
    
    editorInstance = monaco.editor.create(container, {
      value: '// Write your code here...\nconsole.log("Welcome to TaskNexus Code Editor!");',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: 'var(--font-mono), monospace',
      padding: { top: 16 }
    });

    document.getElementById('code-lang').addEventListener('change', (e) => {
      monaco.editor.setModelLanguage(editorInstance.getModel(), e.target.value);
    });

    document.getElementById('btn-copy-code').addEventListener('click', () => {
      const code = editorInstance.getValue();
      navigator.clipboard.writeText(code);
      toast('Code copied to clipboard', 'success');
    });

    document.getElementById('btn-close-output').addEventListener('click', () => {
      document.getElementById('code-output-pane').style.display = 'none';
    });

    document.getElementById('btn-run-code').addEventListener('click', () => {
      const lang = document.getElementById('code-lang').value;
      const code = editorInstance.getValue();
      const pane = document.getElementById('code-output-pane');
      const frame = document.getElementById('code-output-frame');
      const consoleOut = document.getElementById('code-output-console');
      
      pane.style.display = 'flex';
      
      if (lang === 'html') {
        frame.style.display = 'block';
        consoleOut.style.display = 'none';
        frame.srcdoc = code;
      } else if (lang === 'css') {
        frame.style.display = 'block';
        consoleOut.style.display = 'none';
        frame.srcdoc = `<style>${code}</style><div style="font-family:sans-serif;padding:20px;text-align:center"><h1>CSS Preview</h1><p>Edit CSS to style this preview pane.</p></div>`;
      } else if (lang === 'javascript') {
        frame.style.display = 'none';
        consoleOut.style.display = 'block';
        consoleOut.innerHTML = '';
        
        const logs = [];
        const mockConsole = {
          log: (...args) => logs.push(args.map(a => String(a)).join(' ')),
          error: (...args) => logs.push('<span style="color:var(--danger)">' + args.map(a => String(a)).join(' ') + '</span>'),
          warn: (...args) => logs.push('<span style="color:var(--warning)">' + args.map(a => String(a)).join(' ') + '</span>')
        };
        
        try {
          const fn = new Function('console', code);
          fn(mockConsole);
          consoleOut.innerHTML = logs.join('<br/>') || '<span style="color:var(--text-4)">Script executed successfully with no output.</span>';
        } catch (e) {
          consoleOut.innerHTML = `<span style="color:var(--danger)">Error: ${e.message}</span>`;
        }
      } else {
        frame.style.display = 'none';
        consoleOut.style.display = 'block';
        consoleOut.innerHTML = `<span style="color:var(--warning)">Execution for ${lang} is not supported directly in the browser. Only HTML, CSS, and JS can be previewed.</span>`;
      }
    });
  }

  // We need to wait for the panel to be active before initializing Monaco properly
  // Or we can initialize it right away if the library is loaded.
  // Wait for the loader script to be available.
  const checkLoader = setInterval(() => {
    if (window.require) {
      clearInterval(checkLoader);
      initMonaco();
    }
  }, 100);

})();
