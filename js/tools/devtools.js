// Developer Tools — JSON, Base64, Color Picker, Regex, UUID, Hash
(function(){
  const el=document.getElementById('panel-devtools');
  let mode='json';

  function render(){
    el.innerHTML=`
    <div class="panel-header"><h1 class="panel-title">Developer Tools</h1><p class="panel-desc">JSON formatter, Base64, color converter, regex tester, UUID & hash generators.</p></div>
    <div class="tabs" style="flex-wrap:wrap;margin-bottom:20px">
      ${['json','color','regex','uuid','hash'].map(m=>`<button class="tab-btn${mode===m?' active':''}" data-m="${m}">${{json:'JSON',color:'Color',regex:'Regex',uuid:'UUID/ID',hash:'Hash'}[m]}</button>`).join('')}
    </div>
    <div id="dt-body"></div>`;
    el.querySelectorAll('.tab-btn[data-m]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.m;render();}));
    renderMode();
  }

  function renderMode(){
    const body=document.getElementById('dt-body');
    if(mode==='json'){
      body.innerHTML=`
        <div class="grid-2" style="align-items:start;gap:16px">
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span class="form-label" style="margin:0">Input JSON</span>
              <div style="display:flex;gap:6px">
                <button class="btn btn-primary btn-sm" id="btn-fmt">Format ✨</button>
                <button class="btn btn-secondary btn-sm" id="btn-min">Minify</button>
                <button class="btn btn-secondary btn-sm" id="btn-validate">Validate</button>
              </div>
            </div>
            <textarea id="json-in" class="form-textarea form-mono" style="min-height:400px" placeholder='{"key":"value","arr":[1,2,3]}'></textarea>
          </div>
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span class="form-label" style="margin:0">Output</span>
              <button class="btn btn-ghost btn-sm" id="copy-json">📋 Copy</button>
            </div>
            <div id="json-status" style="margin-bottom:8px"></div>
            <textarea id="json-out" class="form-textarea form-mono" style="min-height:400px;background:var(--surface-2)" readonly></textarea>
          </div>
        </div>`;
      document.getElementById('btn-fmt').addEventListener('click',()=>{
        try{const o=JSON.parse(document.getElementById('json-in').value);document.getElementById('json-out').value=JSON.stringify(o,null,2);document.getElementById('json-status').innerHTML=`<span class="badge badge-green">✓ Valid JSON</span>`;}
        catch(e){document.getElementById('json-status').innerHTML=`<span class="badge badge-red">✗ ${esc(e.message)}</span>`;}
      });
      document.getElementById('btn-min').addEventListener('click',()=>{
        try{document.getElementById('json-out').value=JSON.stringify(JSON.parse(document.getElementById('json-in').value));}
        catch(e){document.getElementById('json-status').innerHTML=`<span class="badge badge-red">✗ ${esc(e.message)}</span>`;}
      });
      document.getElementById('btn-validate').addEventListener('click',()=>{
        try{JSON.parse(document.getElementById('json-in').value);document.getElementById('json-status').innerHTML=`<span class="badge badge-green">✓ Valid JSON</span>`;}
        catch(e){document.getElementById('json-status').innerHTML=`<span class="badge badge-red">✗ ${esc(e.message)}</span>`;}
      });
      document.getElementById('copy-json').addEventListener('click',()=>{navigator.clipboard.writeText(document.getElementById('json-out').value);toast('Copied!','success');});
    } else if(mode==='color'){
      body.innerHTML=`
        <div class="card" style="max-width:600px;margin:0 auto">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap">
            <input type="color" id="color-pick" value="#4f46e5" style="width:64px;height:64px;border:none;cursor:pointer;border-radius:12px;background:none"/>
            <div style="flex:1">
              <div style="font-size:1.5rem;font-weight:800;letter-spacing:-.03em" id="color-hex">#4f46e5</div>
              <div style="font-size:.82rem;color:var(--text-2);margin-top:4px" id="color-rgb">rgb(79, 70, 229)</div>
            </div>
          </div>
          <div id="color-formats" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px"></div>
          <div style="font-weight:700;margin-bottom:10px">Shades</div>
          <div id="color-shades" style="display:flex;gap:6px;flex-wrap:wrap"></div>
          <div style="font-weight:700;margin-top:16px;margin-bottom:10px">Input Any Format</div>
          <div style="display:flex;gap:8px">
            <input id="color-input" class="form-input" placeholder="#ff0000 or rgb(255,0,0) or hsl(0,100%,50%)" style="flex:1"/>
            <button class="btn btn-primary" id="btn-parse-color">Parse</button>
          </div>
        </div>`;
      function updateColor(hex){
        document.getElementById('color-pick').value=hex;
        document.getElementById('color-hex').textContent=hex;
        const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
        const h2=(v,m,s)=>{v/=255;m/=255;s/=255;const max=Math.max(v,m,s),min=Math.min(v,m,s),d=max-min;let h=0,sat=0,l=(max+min)/2;if(d!==0){sat=d/(1-Math.abs(2*l-1));h=max===v?((m-s)/d)%6:max===m?(b-v)/d+2:(v-m)/d+4;h=Math.round(h*60);if(h<0)h+=360;}return[h,Math.round(sat*100),Math.round(l*100)];};
        const [h,s,l]=h2(r,g,b);
        document.getElementById('color-rgb').textContent=`rgb(${r}, ${g}, ${b})`;
        const fmts=[['HEX',hex],['RGB',`rgb(${r},${g},${b})`],['HSL',`hsl(${h},${s}%,${l}%)`],['RGBA',`rgba(${r},${g},${b},1)`]];
        document.getElementById('color-formats').innerHTML=fmts.map(([n,v])=>`
          <div style="background:var(--surface-2);padding:10px 12px;border-radius:8px;cursor:pointer" onclick="navigator.clipboard.writeText('${v}');toast('Copied!','success')">
            <div style="font-size:.7rem;color:var(--text-3);font-weight:700">${n}</div>
            <div style="font-family:monospace;font-size:.82rem;margin-top:2px">${esc(v)}</div>
          </div>`).join('');
        document.getElementById('color-shades').innerHTML=[9,7,5,4,3,2,1].map(lv=>{
          const lp=lv*10;const shade=`hsl(${h},${s}%,${lp}%)`;
          return `<div style="width:36px;height:36px;border-radius:8px;background:${shade};cursor:pointer;border:2px solid ${lp>85?'var(--border)':'transparent'}" title="${shade}" onclick="navigator.clipboard.writeText('${shade}');toast('Copied!','success')"></div>`;
        }).join('');
      }
      document.getElementById('color-pick').addEventListener('input',e=>updateColor(e.target.value));
      document.getElementById('btn-parse-color').addEventListener('click',()=>{
        const v=document.getElementById('color-input').value.trim();
        const c=document.createElement('canvas');c.width=1;c.height=1;const ctx=c.getContext('2d');
        ctx.fillStyle=v;ctx.fillRect(0,0,1,1);
        const [r,g,b]=ctx.getImageData(0,0,1,1).data;
        updateColor('#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''));
      });
      updateColor('#4f46e5');
    } else if(mode==='regex'){
      body.innerHTML=`
        <div class="card" style="max-width:700px;margin:0 auto">
          <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
            <span style="font-size:1.2rem;color:var(--text-3)">/</span>
            <input id="regex-pat" class="form-input form-mono" placeholder="([a-z]+)\\d+" style="flex:1"/>
            <span style="font-size:1.2rem;color:var(--text-3)">/</span>
            <input id="regex-flags" class="form-input" style="width:70px" placeholder="gim" value="g"/>
          </div>
          <div class="form-group"><label class="form-label">Test String</label>
            <textarea id="regex-test" class="form-textarea form-mono" style="min-height:140px" placeholder="Enter text to test against…"></textarea>
          </div>
          <div id="regex-status" style="margin-bottom:10px"></div>
          <div id="regex-matches" style="background:var(--surface-2);border-radius:8px;padding:12px;min-height:60px;font-family:monospace;font-size:.82rem"></div>
          <div style="margin-top:12px">
            <div style="font-weight:700;font-size:.8rem;margin-bottom:8px">Quick Patterns</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${[['Email','[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}'],['URL','https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_+.~#?&/=]*)'],['Phone','[\\+]?[0-9]{1,3}[-.\\s]?[0-9]{3,4}[-.\\s]?[0-9]{4}'],['IPv4','\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b'],['Date','\\d{4}-\\d{2}-\\d{2}']].map(([n,p])=>`<button class="btn btn-secondary btn-sm regex-preset" data-p="${esc(p)}">${n}</button>`).join('')}
            </div>
          </div>
        </div>`;
      function testRegex(){
        const pat=document.getElementById('regex-pat').value;
        const flags=document.getElementById('regex-flags').value;
        const txt=document.getElementById('regex-test').value;
        if(!pat){document.getElementById('regex-matches').textContent='Enter a pattern';return;}
        try{
          const re=new RegExp(pat,flags);
          const matches=[...txt.matchAll(re)];
          document.getElementById('regex-status').innerHTML=`<span class="badge badge-${matches.length?'green':'yellow'}">${matches.length} match${matches.length!==1?'es':''}</span>`;
          document.getElementById('regex-matches').innerHTML=matches.length
            ?matches.map((m,i)=>`<div style="margin-bottom:6px"><span style="color:var(--text-3)">Match ${i+1}:</span> <span style="background:rgba(79,70,229,.1);color:var(--primary);padding:2px 6px;border-radius:4px">${esc(m[0])}</span>${m.length>1?' Groups: '+m.slice(1).map(g=>`<span style="background:rgba(34,197,94,.1);color:var(--success);padding:2px 6px;border-radius:4px;margin-left:4px">${esc(g??'undefined')}</span>`).join(''):''}</div>`).join('')
            :'<span style="color:var(--text-3)">No matches found</span>';
        }catch(e){document.getElementById('regex-status').innerHTML=`<span class="badge badge-red">✗ ${esc(e.message)}</span>`;}
      }
      document.getElementById('regex-pat').addEventListener('input',testRegex);
      document.getElementById('regex-flags').addEventListener('input',testRegex);
      document.getElementById('regex-test').addEventListener('input',testRegex);
      el.querySelectorAll('.regex-preset').forEach(b=>b.addEventListener('click',()=>{document.getElementById('regex-pat').value=b.dataset.p;testRegex();}));
    } else if(mode==='uuid'){
      function genUUID(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16);});}
      function genNano(len=21){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b=>chars[b%64]).join('');}
      body.innerHTML=`
        <div class="card" style="max-width:600px;margin:0 auto">
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button class="btn btn-primary" id="gen-uuid-btn">Generate UUID v4</button>
            <button class="btn btn-secondary" id="gen-nano-btn">Generate NanoID</button>
            <input id="uid-count" type="number" class="form-input" value="5" min="1" max="20" style="width:70px" title="Count"/>
          </div>
          <div id="uuid-list" style="font-family:monospace;font-size:.85rem;background:var(--surface-2);border-radius:10px;padding:12px;min-height:200px;max-height:400px;overflow-y:auto"></div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" id="copy-all-uuid">📋 Copy All</button>
        </div>`;
      let items=[];
      function gen(type){
        const n=parseInt(document.getElementById('uid-count').value)||1;
        items=Array.from({length:n},()=>type==='uuid'?genUUID():genNano());
        document.getElementById('uuid-list').innerHTML=items.map(i=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer;user-select:all" onclick="navigator.clipboard.writeText('${i}');toast('Copied!','success')">${i}</div>`).join('');
      }
      document.getElementById('gen-uuid-btn').addEventListener('click',()=>gen('uuid'));
      document.getElementById('gen-nano-btn').addEventListener('click',()=>gen('nano'));
      document.getElementById('copy-all-uuid').addEventListener('click',()=>{navigator.clipboard.writeText(items.join('\n'));toast('All copied!','success');});
      gen('uuid');
    } else if(mode==='hash'){
      body.innerHTML=`
        <div class="card" style="max-width:600px;margin:0 auto">
          <div class="form-group"><label class="form-label">Input Text</label>
            <textarea id="hash-in" class="form-textarea" style="min-height:100px" placeholder="Enter text to hash…"></textarea>
          </div>
          <button class="btn btn-primary" id="btn-hash" style="width:100%;margin-bottom:16px">Generate Hashes</button>
          <div id="hash-results"></div>
        </div>`;
      document.getElementById('btn-hash').addEventListener('click',async()=>{
        const txt=document.getElementById('hash-in').value;
        const enc=new TextEncoder().encode(txt);
        const results=document.getElementById('hash-results');
        results.innerHTML='Computing…';
        const algos=['SHA-1','SHA-256','SHA-384','SHA-512'];
        const rows=await Promise.all(algos.map(async a=>{
          const buf=await crypto.subtle.digest(a,enc);
          const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
          return [a,hex];
        }));
        results.innerHTML=rows.map(([a,h])=>`
          <div style="margin-bottom:10px;background:var(--surface-2);padding:10px 12px;border-radius:8px">
            <div style="font-size:.72rem;font-weight:700;color:var(--text-3);margin-bottom:4px">${a}</div>
            <div style="font-family:monospace;font-size:.78rem;word-break:break-all;cursor:pointer" onclick="navigator.clipboard.writeText('${h}');toast('Copied!','success')" title="Click to copy">${h}</div>
          </div>`).join('');
      });
    }
  }
  render();
})();
