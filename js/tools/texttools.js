// Text Tools — Dark Theme
(function(){
  const el = document.getElementById('panel-texttools');
  let mode = 'case';

  function render(){
    el.innerHTML=`
    <div class="panel-header"><h1 class="panel-title">Text Tools</h1><p class="panel-desc">Case conversion, Markdown preview, diff, word count, and encoding.</p></div>
    <div class="tabs" style="flex-wrap:wrap;margin-bottom:20px">
      ${['case','markdown','stats','diff','encode'].map(m=>`
        <button class="tab-btn${mode===m?' active':''}" data-m="${m}">${{case:'Case',markdown:'Markdown',stats:'Stats',diff:'Diff',encode:'Encode'}[m]}</button>`).join('')}
    </div>
    <div id="tt-body"></div>`;
    el.querySelectorAll('.tab-btn[data-m]').forEach(b=>b.addEventListener('click',()=>{ mode=b.dataset.m; render(); }));
    renderMode();
  }

  function renderMode(){
    const body=document.getElementById('tt-body');
    if(mode==='case'){
      body.innerHTML=`
        <div class="grid-2" style="align-items:start;gap:16px">
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span class="form-label" style="margin:0">Input Text</span>
              <button class="btn btn-ghost btn-sm" onclick="document.getElementById('case-in').value='';document.getElementById('case-out').value=''">Clear</button>
            </div>
            <textarea id="case-in" class="form-textarea" style="min-height:220px" placeholder="Enter your text…"></textarea>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
              ${[['UPPER','toUpperCase'],['lower','toLowerCase'],['Title','title'],['Sentence','sentence'],['camelCase','camel'],['snake_case','snake'],['kebab-case','kebab'],['PascalCase','pascal']].map(([l,v])=>`
                <button class="btn btn-secondary btn-sm btn-pill case-btn" data-case="${v}">${l}</button>`).join('')}
            </div>
          </div>
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span class="form-label" style="margin:0">Output</span>
              <button class="btn btn-ghost btn-sm" id="copy-case">📋 Copy</button>
            </div>
            <textarea id="case-out" class="form-textarea" style="min-height:220px;background:var(--surface-2)" readonly></textarea>
          </div>
        </div>`;
      el.querySelectorAll('.case-btn').forEach(b=>b.addEventListener('click',()=>{
        const txt=document.getElementById('case-in').value;
        let out=txt;
        const t=b.dataset.case;
        if(t==='toUpperCase') out=txt.toUpperCase();
        else if(t==='toLowerCase') out=txt.toLowerCase();
        else if(t==='title') out=txt.replace(/\b\w/g,c=>c.toUpperCase());
        else if(t==='sentence') out=txt.charAt(0).toUpperCase()+txt.slice(1).toLowerCase();
        else if(t==='camel') out=txt.trim().toLowerCase().replace(/[\s_-]+(.)/g,(_,c)=>c.toUpperCase());
        else if(t==='snake') out=txt.trim().replace(/\s+/g,'_').replace(/([A-Z])/g,'_$1').toLowerCase().replace(/^_/,'');
        else if(t==='kebab') out=txt.trim().replace(/\s+/g,'-').replace(/([A-Z])/g,'-$1').toLowerCase().replace(/^-/,'');
        else if(t==='pascal') out=txt.trim().replace(/[\s_-]+(.)/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase());
        document.getElementById('case-out').value=out;
      }));
      document.getElementById('copy-case').addEventListener('click',()=>{ navigator.clipboard.writeText(document.getElementById('case-out').value); toast('Copied!','success'); });

    } else if(mode==='markdown'){
      body.innerHTML=`
        <div class="grid-2" style="align-items:start;gap:16px">
          <div class="card">
            <div class="form-label" style="margin-bottom:8px">Markdown Input</div>
            <textarea id="md-in" class="form-textarea form-mono" style="min-height:380px" placeholder="# Hello\n\nWrite **Markdown** here…"></textarea>
          </div>
          <div class="card" style="background:var(--surface-2)">
            <div class="form-label" style="margin-bottom:8px">Preview</div>
            <div id="md-out" style="min-height:380px;font-size:.9rem;line-height:1.7;color:var(--text-2);
              padding:4px;overflow-y:auto"></div>
          </div>
        </div>`;
      function updateMD(){
        const md=document.getElementById('md-in').value;
        let html=md
          .replace(/^##### (.*$)/gm,'<h5 style="font-family:var(--font-display);font-size:.9rem;margin:.8em 0 .3em;color:var(--text)">$1</h5>')
          .replace(/^#### (.*$)/gm,'<h4 style="font-family:var(--font-display);font-size:1rem;margin:.8em 0 .3em;color:var(--text)">$1</h4>')
          .replace(/^### (.*$)/gm,'<h3 style="font-family:var(--font-display);font-size:1.1rem;margin:.8em 0 .3em;color:var(--text)">$1</h3>')
          .replace(/^## (.*$)/gm,'<h2 style="font-family:var(--font-display);font-size:1.3rem;margin:.8em 0 .3em;color:var(--text);letter-spacing:-.02em">$1</h2>')
          .replace(/^# (.*$)/gm,'<h1 style="font-family:var(--font-display);font-size:1.6rem;font-weight:900;margin:.8em 0 .3em;color:var(--text);letter-spacing:-.03em">$1</h1>')
          .replace(/\*\*(.*?)\*\*/g,'<strong style="color:var(--text)">$1</strong>')
          .replace(/\*(.*?)\*/g,'<em>$1</em>')
          .replace(/`([^`]+)`/g,'<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:.85em;color:var(--primary)">$1</code>')
          .replace(/```([\s\S]*?)```/g,'<pre style="background:var(--surface-2);border:1px solid var(--border-2);border-radius:8px;padding:12px;font-family:var(--font-mono);font-size:.82rem;overflow-x:auto">$1</pre>')
          .replace(/^> (.*$)/gm,'<blockquote style="border-left:3px solid rgba(79,70,229,0.5);padding-left:12px;margin:8px 0;color:var(--text-3);font-style:italic">$1</blockquote>')
          .replace(/^- (.*$)/gm,'<li style="margin:.2em 0;list-style:disc;margin-left:20px">$1</li>')
          .replace(/^\d+\. (.*$)/gm,'<li style="margin:.2em 0;list-style:decimal;margin-left:20px">$1</li>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" style="color:var(--primary);text-decoration:underline">$1</a>')
          .replace(/\n/g,'<br/>');
        document.getElementById('md-out').innerHTML=html;
      }
      document.getElementById('md-in').addEventListener('input', updateMD);

    } else if(mode==='stats'){
      body.innerHTML=`
        <div class="card" style="max-width:700px">
          <div class="form-label" style="margin-bottom:8px">Input Text</div>
          <textarea id="stats-in" class="form-textarea" style="min-height:180px" placeholder="Paste any text to analyze…"></textarea>
          <div id="stats-out" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:16px"></div>
        </div>`;
      function updateStats(){
        const txt=document.getElementById('stats-in').value;
        const words=txt.trim()?txt.trim().split(/\s+/).length:0;
        const chars=txt.length; const charsNoSpace=txt.replace(/\s/g,'').length;
        const lines=txt?txt.split('\n').length:0; const sents=txt?(txt.match(/[.!?]+/g)||[]).length:0;
        const readTime=Math.ceil(words/200);
        const stats=[['Characters',chars],['No-Space',charsNoSpace],['Words',words],['Lines',lines],['Sentences',sents],['~Read Time',readTime>0?readTime+'min':'<1min']];
        document.getElementById('stats-out').innerHTML=stats.map(([l,v])=>`
          <div style="background:var(--surface-3);border:1px solid var(--border-2);border-radius:10px;padding:14px;text-align:center">
            <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:900;letter-spacing:-.03em;color:var(--text)">${v}</div>
            <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-top:4px;font-weight:600">${l}</div>
          </div>`).join('');
      }
      document.getElementById('stats-in').addEventListener('input',updateStats);
      updateStats();

    } else if(mode==='diff'){
      body.innerHTML=`
        <div class="grid-2" style="align-items:start;gap:16px">
          <div class="card"><div class="form-label" style="margin-bottom:8px">Original</div>
            <textarea id="diff-a" class="form-textarea form-mono" style="min-height:220px" placeholder="Original text…"></textarea>
          </div>
          <div class="card"><div class="form-label" style="margin-bottom:8px">Modified</div>
            <textarea id="diff-b" class="form-textarea form-mono" style="min-height:220px" placeholder="Modified text…"></textarea>
          </div>
        </div>
        <div class="card" style="margin-top:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span class="form-label" style="margin:0">Diff Result</span>
            <button class="btn btn-primary btn-sm" id="btn-diff">Compare →</button>
          </div>
          <div id="diff-out" style="font-family:var(--font-mono);font-size:.82rem;min-height:80px;line-height:1.6"></div>
        </div>`;
      document.getElementById('btn-diff').addEventListener('click',()=>{
        const a=document.getElementById('diff-a').value.split('\n');
        const b=document.getElementById('diff-b').value.split('\n');
        const max=Math.max(a.length,b.length);
        let html='';
        for(let i=0;i<max;i++){
          const la=a[i]??'', lb=b[i]??'';
          if(la===lb){ html+=`<div style="padding:1px 8px;color:var(--text-2)">${esc(la)}</div>`; }
          else{
            if(la) html+=`<div style="padding:1px 8px;background:rgba(239,68,68,0.12);color:var(--danger);border-left:3px solid rgba(239,68,68,0.5)">− ${esc(la)}</div>`;
            if(lb) html+=`<div style="padding:1px 8px;background:rgba(34,197,94,0.1);color:var(--success);border-left:3px solid rgba(34,197,94,0.4)">+ ${esc(lb)}</div>`;
          }
        }
        document.getElementById('diff-out').innerHTML=html||'<span style="color:var(--text-3)">No differences found.</span>';
      });

    } else if(mode==='encode'){
      body.innerHTML=`
        <div class="card" style="max-width:700px">
          <div class="form-group"><label class="form-label">Input</label>
            <textarea id="enc-in" class="form-textarea form-mono" style="min-height:120px" placeholder="Enter text to encode/decode…"></textarea>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
            ${[['Base64 Encode','b64enc'],['Base64 Decode','b64dec'],['URL Encode','urlenc'],['URL Decode','urldec'],['HTML Encode','htmlenc'],['HTML Decode','htmldec']].map(([l,v])=>`
              <button class="btn btn-secondary btn-sm btn-pill enc-btn" data-op="${v}">${l}</button>`).join('')}
          </div>
          <div class="form-label" style="margin-bottom:6px">Output</div>
          <div style="position:relative">
            <textarea id="enc-out" class="form-textarea form-mono" style="min-height:120px;background:var(--surface-2);padding-right:80px" readonly></textarea>
            <button class="btn btn-ghost btn-sm" style="position:absolute;top:8px;right:8px" id="copy-enc">📋 Copy</button>
          </div>
        </div>`;
      el.querySelectorAll('.enc-btn').forEach(b=>b.addEventListener('click',()=>{
        const txt=document.getElementById('enc-in').value; let out='';
        try{
          if(b.dataset.op==='b64enc') out=btoa(unescape(encodeURIComponent(txt)));
          else if(b.dataset.op==='b64dec') out=decodeURIComponent(escape(atob(txt)));
          else if(b.dataset.op==='urlenc') out=encodeURIComponent(txt);
          else if(b.dataset.op==='urldec') out=decodeURIComponent(txt);
          else if(b.dataset.op==='htmlenc') out=txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
          else if(b.dataset.op==='htmldec'){const d=document.createElement('div');d.innerHTML=txt;out=d.textContent;}
        }catch(e){ out=`Error: ${e.message}`; }
        document.getElementById('enc-out').value=out;
      }));
      document.getElementById('copy-enc').addEventListener('click',()=>{ navigator.clipboard.writeText(document.getElementById('enc-out').value); toast('Copied!','success'); });
    }
  }

  render();
})();
