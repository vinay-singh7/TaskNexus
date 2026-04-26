// Data Testing Tool
(function(){
  const el=document.getElementById('panel-datatesting');
  let mode='jsonschema';

  const LOREM='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
  const LOREM_WORDS=LOREM.replace(/[.,]/g,'').split(' ');

  function render(){
    el.innerHTML=`
    <div class="panel-header"><h1 class="panel-title">Data Testing</h1><p class="panel-desc">JSON schema validator, CSV parser, Lorem Ipsum, fake data, timestamp converter.</p></div>
    <div class="tabs" style="flex-wrap:wrap;margin-bottom:20px">
      ${['jsonschema','csv','lorem','fakedata','timestamp'].map(m=>`<button class="tab-btn${mode===m?' active':''}" data-m="${m}">${{jsonschema:'JSON Schema',csv:'CSV Parser',lorem:'Lorem Ipsum',fakedata:'Fake Data',timestamp:'Timestamp'}[m]}</button>`).join('')}
    </div>
    <div id="dt-tool-body"></div>`;
    el.querySelectorAll('.tab-btn[data-m]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.m;render();}));
    renderMode();
  }

  function renderMode(){
    const body=document.getElementById('dt-tool-body');
    if(mode==='jsonschema'){
      body.innerHTML=`
        <div class="grid-2" style="align-items:start;gap:16px">
          <div class="card">
            <div class="form-label" style="margin-bottom:8px">JSON Schema</div>
            <textarea id="schema-in" class="form-textarea form-mono" style="min-height:220px" placeholder='{"type":"object","required":["name"],"properties":{"name":{"type":"string"},"age":{"type":"number"}}}'></textarea>
            <div class="form-label" style="margin:12px 0 6px">Data to Validate</div>
            <textarea id="data-in" class="form-textarea form-mono" style="min-height:180px" placeholder='{"name":"Alice","age":30}'></textarea>
            <button class="btn btn-primary" style="width:100%;margin-top:10px" id="btn-validate-schema">Validate</button>
          </div>
          <div class="card">
            <div class="form-label" style="margin-bottom:8px">Result</div>
            <div id="schema-result" style="min-height:200px;padding:12px;background:var(--surface-2);border-radius:8px;font-family:monospace;font-size:.82rem">Run validation to see results…</div>
          </div>
        </div>`;
      document.getElementById('btn-validate-schema').addEventListener('click',()=>{
        try{
          const schema=JSON.parse(document.getElementById('schema-in').value);
          const data=JSON.parse(document.getElementById('data-in').value);
          const errors=validateSchema(data,schema,'root');
          const res=document.getElementById('schema-result');
          if(errors.length===0) res.innerHTML=`<span style="color:var(--success);font-size:1rem;font-weight:700">✓ Valid!</span><br/><br/>Data matches the schema.`;
          else res.innerHTML=`<span style="color:var(--danger);font-weight:700">✗ ${errors.length} error(s):</span><br/><br/>`+errors.map(e=>`<div style="color:var(--danger);margin-bottom:4px">• ${esc(e)}</div>`).join('');
        }catch(e){document.getElementById('schema-result').innerHTML=`<span style="color:var(--danger)">Parse error: ${esc(e.message)}</span>`;}
      });
    } else if(mode==='csv'){
      body.innerHTML=`
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <span class="form-label" style="margin:0">CSV Input</span>
            <label style="font-size:.8rem;display:flex;align-items:center;gap:4px"><input type="checkbox" id="csv-header" checked/> First row is header</label>
            <select id="csv-delim" class="form-select" style="width:110px"><option value=",">, (comma)</option><option value="	">⇥ (tab)</option><option value=";">; (semicolon)</option></select>
            <button class="btn btn-primary btn-sm" id="btn-parse-csv">Parse →</button>
          </div>
          <textarea id="csv-in" class="form-textarea form-mono" style="min-height:120px" placeholder="name,age,city\nAlice,30,NYC\nBob,25,LA"></textarea>
          <div id="csv-result" style="margin-top:16px;overflow-x:auto"></div>
        </div>`;
      document.getElementById('btn-parse-csv').addEventListener('click',()=>{
        const raw=document.getElementById('csv-in').value.trim();
        const delim=document.getElementById('csv-delim').value;
        const hasHeader=document.getElementById('csv-header').checked;
        const rows=raw.split('\n').map(r=>r.split(delim));
        const headers=hasHeader?rows[0]:rows[0].map((_,i)=>`Col ${i+1}`);
        const data=hasHeader?rows.slice(1):rows;
        document.getElementById('csv-result').innerHTML=`
          <div style="font-size:.78rem;color:var(--text-2);margin-bottom:8px">${data.length} rows × ${headers.length} columns</div>
          <table style="width:100%;border-collapse:collapse;font-size:.82rem">
            <thead><tr>${headers.map(h=>`<th style="padding:8px 12px;background:var(--surface-2);border:1px solid var(--border);font-weight:700;text-align:left">${esc(h)}</th>`).join('')}</tr></thead>
            <tbody>${data.map((row,i)=>`<tr style="background:${i%2?'var(--surface-2)':'white'}">${row.map(c=>`<td style="padding:7px 12px;border:1px solid var(--border)">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>`;
      });
    } else if(mode==='lorem'){
      body.innerHTML=`
        <div class="card" style="max-width:700px;margin:0 auto">
          <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:16px">
            <div class="form-group" style="margin:0">
              <label class="form-label">Type</label>
              <select id="lorem-type" class="form-select">
                <option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option>
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Count</label>
              <input id="lorem-count" type="number" class="form-input" value="3" min="1" max="50" style="width:80px"/>
            </div>
            <button class="btn btn-primary" id="btn-gen-lorem">Generate</button>
            <button class="btn btn-secondary" id="copy-lorem">📋 Copy</button>
          </div>
          <textarea id="lorem-out" class="form-textarea" style="min-height:300px;line-height:1.7" readonly></textarea>
        </div>`;
      document.getElementById('btn-gen-lorem').addEventListener('click',()=>{
        const type=document.getElementById('lorem-type').value;
        const count=parseInt(document.getElementById('lorem-count').value)||3;
        let out='';
        if(type==='words') out=LOREM_WORDS.slice(0,count).join(' ');
        else if(type==='sentences') out=LOREM.split('. ').slice(0,count).join('. ')+'.';
        else out=Array.from({length:count},(_,i)=>i===0?LOREM:LOREM_WORDS.sort(()=>Math.random()-.5).join(' ')+'.').join('\n\n');
        document.getElementById('lorem-out').value=out;
      });
      document.getElementById('copy-lorem').addEventListener('click',()=>{navigator.clipboard.writeText(document.getElementById('lorem-out').value);toast('Copied!','success');});
    } else if(mode==='fakedata'){
      const FIRST=['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Henry','Iris','Jack'];
      const LAST=['Smith','Johnson','Williams','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson'];
      const DOMAINS=['gmail.com','yahoo.com','outlook.com','company.io','example.org'];
      const CITIES=['New York','London','Tokyo','Paris','Sydney','Toronto','Berlin','Dubai','Mumbai','Seoul'];
      const STREETS=['Main St','Oak Ave','Maple Rd','Cedar Ln','Elm St','Pine Rd','Willow Dr','Rose Blvd'];
      const rand=a=>a[Math.floor(Math.random()*a.length)];
      const randInt=(mn,mx)=>Math.floor(Math.random()*(mx-mn+1))+mn;

      function genPerson(){
        const first=rand(FIRST),last=rand(LAST);
        return {name:`${first} ${last}`,email:`${first.toLowerCase()}.${last.toLowerCase()}${randInt(1,99)}@${rand(DOMAINS)}`,
          phone:`+1 ${randInt(200,999)}-${randInt(100,999)}-${randInt(1000,9999)}`,
          age:randInt(18,65),city:rand(CITIES),address:`${randInt(1,999)} ${rand(STREETS)}, ${rand(CITIES)}`,
          id:uid(),zip:`${randInt(10000,99999)}`};
      }

      body.innerHTML=`
        <div class="card" style="max-width:700px;margin:0 auto">
          <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap">
            <div class="form-group" style="margin:0"><label class="form-label">Count</label><input id="fake-count" type="number" class="form-input" value="5" min="1" max="50" style="width:80px"/></div>
            <div class="form-group" style="margin:0"><label class="form-label">Format</label>
              <select id="fake-fmt" class="form-select"><option value="json">JSON</option><option value="csv">CSV</option><option value="table">Table</option></select>
            </div>
            <button class="btn btn-primary" id="btn-gen-fake">Generate</button>
            <button class="btn btn-secondary" id="copy-fake">📋 Copy</button>
          </div>
          <div id="fake-out" style="background:var(--surface-2);border-radius:10px;padding:12px;min-height:200px;max-height:400px;overflow:auto;font-size:.82rem"></div>
        </div>`;
      let fakeData=[];
      document.getElementById('btn-gen-fake').addEventListener('click',()=>{
        const n=parseInt(document.getElementById('fake-count').value)||5;
        const fmt=document.getElementById('fake-fmt').value;
        fakeData=Array.from({length:n},genPerson);
        const out=document.getElementById('fake-out');
        if(fmt==='json') out.innerHTML=`<pre style="white-space:pre-wrap;font-family:monospace">${esc(JSON.stringify(fakeData,null,2))}</pre>`;
        else if(fmt==='csv'){
          const keys=Object.keys(fakeData[0]);
          const csv=[keys.join(','),...fakeData.map(d=>keys.map(k=>d[k]).join(','))].join('\n');
          out.innerHTML=`<pre style="white-space:pre-wrap;font-family:monospace">${esc(csv)}</pre>`;
        } else {
          const keys=Object.keys(fakeData[0]);
          out.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:.78rem">
            <thead><tr>${keys.map(k=>`<th style="padding:6px 8px;background:white;border:1px solid var(--border);white-space:nowrap">${k}</th>`).join('')}</tr></thead>
            <tbody>${fakeData.map((d,i)=>`<tr style="background:${i%2?'white':'var(--surface-2)'}">
              ${keys.map(k=>`<td style="padding:5px 8px;border:1px solid var(--border);white-space:nowrap">${esc(d[k])}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>`;
        }
      });
      document.getElementById('copy-fake').addEventListener('click',()=>{
        const fmt=document.getElementById('fake-fmt').value;
        const keys=Object.keys(fakeData[0]||{});
        const text=fmt==='json'?JSON.stringify(fakeData,null,2):fmt==='csv'?[keys.join(','),...fakeData.map(d=>keys.map(k=>d[k]).join(','))].join('\n'):JSON.stringify(fakeData);
        navigator.clipboard.writeText(text);toast('Copied!','success');
      });
    } else if(mode==='timestamp'){
      function renderTS(){
        const now=Date.now();
        const d=new Date(now);
        document.getElementById('ts-now').textContent=Math.floor(now/1000);
        document.getElementById('ts-ms').textContent=now;
        document.getElementById('ts-iso').textContent=d.toISOString();
        document.getElementById('ts-local').textContent=d.toLocaleString();
        document.getElementById('ts-utc').textContent=d.toUTCString();
      }
      body.innerHTML=`
        <div class="card" style="max-width:600px;margin:0 auto">
          <div style="font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            Current Timestamp <button class="btn btn-secondary btn-sm" id="refresh-ts">↻ Refresh</button>
          </div>
          ${[['Unix (s)','ts-now'],['Unix (ms)','ts-ms'],['ISO 8601','ts-iso'],['Local','ts-local'],['UTC','ts-utc']].map(([l,id])=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:.78rem;color:var(--text-2);font-weight:600">${l}</span>
              <span id="${id}" style="font-family:monospace;font-size:.82rem;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent);toast('Copied!','success')" title="Click to copy">—</span>
            </div>`).join('')}
          <div style="margin-top:20px;font-weight:700;margin-bottom:12px">Convert Timestamp</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="flex:1;margin:0"><label class="form-label">Unix Timestamp (s or ms)</label><input id="ts-conv-in" class="form-input form-mono" placeholder="e.g. 1714000000"/></div>
            <button class="btn btn-primary" id="btn-conv-ts">Convert</button>
          </div>
          <div id="ts-conv-out" style="margin-top:12px;background:var(--surface-2);border-radius:8px;padding:12px;font-family:monospace;font-size:.82rem;min-height:40px"></div>
        </div>`;
      renderTS();
      document.getElementById('refresh-ts').addEventListener('click',renderTS);
      document.getElementById('btn-conv-ts').addEventListener('click',()=>{
        const v=parseInt(document.getElementById('ts-conv-in').value);
        if(isNaN(v)){document.getElementById('ts-conv-out').textContent='Invalid timestamp';return;}
        const ms=v>1e11?v:v*1000;
        const d=new Date(ms);
        document.getElementById('ts-conv-out').innerHTML=`ISO: ${d.toISOString()}<br/>Local: ${d.toLocaleString()}<br/>UTC: ${d.toUTCString()}`;
      });
    }
  }

  function validateSchema(data,schema,path){
    const errors=[];
    if(schema.type){
      const t=schema.type;
      const actual=Array.isArray(data)?'array':typeof data;
      if(actual!==t) errors.push(`${path}: expected ${t}, got ${actual}`);
    }
    if(schema.required&&typeof data==='object'&&data!==null){
      schema.required.forEach(k=>{if(!(k in data)) errors.push(`${path}: missing required field "${k}"`);});
    }
    if(schema.properties&&typeof data==='object'&&data!==null){
      Object.entries(schema.properties).forEach(([k,sub])=>{if(k in data) errors.push(...validateSchema(data[k],sub,`${path}.${k}`));});
    }
    if(schema.minimum!=null&&typeof data==='number'&&data<schema.minimum) errors.push(`${path}: ${data} < minimum ${schema.minimum}`);
    if(schema.maximum!=null&&typeof data==='number'&&data>schema.maximum) errors.push(`${path}: ${data} > maximum ${schema.maximum}`);
    if(schema.minLength!=null&&typeof data==='string'&&data.length<schema.minLength) errors.push(`${path}: length ${data.length} < minLength ${schema.minLength}`);
    if(schema.maxLength!=null&&typeof data==='string'&&data.length>schema.maxLength) errors.push(`${path}: length ${data.length} > maxLength ${schema.maxLength}`);
    return errors;
  }

  render();
})();
