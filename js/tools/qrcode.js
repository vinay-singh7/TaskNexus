// QR Generator + Scanner — catbox.moe upload, colors, password, camera scan
(function(){
  const el = document.getElementById('panel-qrcode');
  let mainMode = 'create'; // 'create' | 'scan'
  let qrType   = 'url';
  let scanStream  = null;
  let scanRaf     = null;
  let scanLast    = 0;        // timestamp of last scan attempt
  let scanHits    = 0;        // consecutive same-code hits
  let scanPrev    = '';       // last decoded value
  const SCAN_INTERVAL = 300; // ms between scan attempts
  const SCAN_CONFIRM  = 3;   // consecutive hits needed to confirm

  /* ── Load jsQR dynamically ── */
  function loadJsQR(cb){
    if(window.jsQR){ cb(); return; }
    const s=document.createElement('script');
    s.src='js/vendor/jsQR.js';
    s.onload=cb; s.onerror=()=>toast('jsQR load failed','error');
    document.head.appendChild(s);
  }


  /* ── Upload: tmpfiles.org → Pixeldrain fallback ── */
  async function uploadFile(file){
    // 1. tmpfiles.org — open CORS, works from file://, free (60 min expiry)
    try{
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('https://tmpfiles.org/api/v1/upload', {method:'POST', body:fd});
      const j = await r.json();
      if(j.status==='success' && j.data?.url){
        const url = j.data.url.replace('tmpfiles.org/','tmpfiles.org/dl/');
        return {url, svc:'tmpfiles.org ⏱ 60 min'};
      }
      throw new Error(j.message||'No URL');
    }catch(e0){
      // 2. Pixeldrain fallback
      try{
        const r = await fetch(
          `https://pixeldrain.com/api/file/${encodeURIComponent(file.name)}`,
          {method:'PUT', body:file, headers:{'Content-Type':file.type||'application/octet-stream'}}
        );
        const j = await r.json();
        if(j.id) return {url:`https://pixeldrain.com/u/${j.id}`, svc:'Pixeldrain'};
        throw new Error(j.message||'no id');
      }catch(e1){
        throw new Error('Upload failed.\ntmpfiles.org: '+e0.message+'\nPixeldrain: '+e1.message);
      }
    }
  }

  /* ── QR API URL builder ── */
  function qrUrl(data,size,ecc,fg,bg){
    const p=new URLSearchParams({size:`${size}x${size}`,ecc,data,color:fg.replace('#',''),bgcolor:bg.replace('#','')});
    return `https://api.qrserver.com/v1/create-qr-code/?${p}`;
  }

  /* ══════ RENDER ══════ */
  function render(){
    el.innerHTML=`
    <div class="panel-header"><h1 class="panel-title">QR Generator</h1><p class="panel-desc">Create custom QR codes & scan them with your camera.</p></div>

    <!-- Main mode toggle -->
    <div style="display:flex;gap:8px;margin-bottom:22px">
      <button class="btn btn-pill btn-sm ${mainMode==='create'?'btn-primary':'btn-secondary'}" id="mm-create">✨ Create QR</button>
      <button class="btn btn-pill btn-sm ${mainMode==='scan'?'btn-primary':'btn-secondary'}"   id="mm-scan">📷 Scan QR</button>
    </div>

    <div id="qr-main"></div>`;

    document.getElementById('mm-create').onclick=()=>{mainMode='create';render();};
    document.getElementById('mm-scan').onclick=()=>{stopScan();mainMode='scan';render();loadJsQR(renderScan);};

    if(mainMode==='create') renderCreate();
    else renderScan();
  }

  /* ══════ CREATE ══════ */
  function renderCreate(){
    const body=document.getElementById('qr-main');
    body.innerHTML=`
    <div class="grid-2" style="gap:20px;align-items:start">
      <div class="card">
        <!-- Type tabs -->
        <div class="tabs" style="flex-wrap:wrap;margin-bottom:16px">
          ${['url','text','vcard','wifi','file'].map(t=>`
            <button class="tab-btn${qrType===t?' active':''} qt" data-t="${t}">${{url:'URL',text:'Text',vcard:'vCard',wifi:'WiFi',file:'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> File Share'}[t]}</button>`).join('')}
        </div>
        <div id="type-form"></div>

        <div class="divider"></div>

        <!-- Style options -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div class="form-group" style="margin:0"><label class="form-label">Size</label>
            <select id="qr-size" class="form-select"><option value="150">Small</option><option value="250" selected>Medium</option><option value="400">Large</option></select>
          </div>
          <div class="form-group" style="margin:0"><label class="form-label">Error Correction</label>
            <select id="qr-ecc" class="form-select"><option value="L">L</option><option value="M" selected>M</option><option value="Q">Q</option><option value="H">H</option></select>
          </div>
          <div class="form-group" style="margin:0"><label class="form-label">QR Color</label>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="color" id="qr-fg" value="#050505" style="width:40px;height:34px;border:none;border-radius:8px;cursor:pointer;background:none"/>
              <span style="font-size:.75rem;color:var(--text-3)">Foreground</span>
            </div>
          </div>
          <div class="form-group" style="margin:0"><label class="form-label">BG Color</label>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="color" id="qr-bg" value="#ffffff" style="width:40px;height:34px;border:none;border-radius:8px;cursor:pointer;background:none"/>
              <span style="font-size:.75rem;color:var(--text-3)">Background</span>
            </div>
          </div>
        </div>

        <!-- Password option (all types including file) -->
        <div id="pw-section">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
            <input type="checkbox" id="qr-pw-on"/>
            ${qrType==='file'?'Password-protect this file share':'Add password note to QR'}
          </label>
          <input id="qr-pw" class="form-input" type="${qrType==='file'?'password':'text'}" placeholder="${qrType==='file'?'Set a password for this file':'Password hint embedded in QR'}" style="display:none"/>
        </div>

        <button class="btn btn-primary" id="btn-gen" style="width:100%;margin-top:10px">
          ${qrType==='file'?'☁️ Upload & Generate QR':'Generate QR Code'}
        </button>
      </div>

      <!-- Preview -->
      <div class="card" id="qr-preview" style="min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div style="font-size:3rem;opacity:.12">🔲</div>
        <div style="color:var(--text-3);font-size:.84rem;margin-top:8px">QR code appears here</div>
      </div>
    </div>`;

    el.querySelectorAll('.qt').forEach(b=>b.onclick=()=>{qrType=b.dataset.t;renderCreate();});
    buildTypeForm();

    document.getElementById('qr-pw-on').onchange=e=>{
      document.getElementById('qr-pw').style.display=e.target.checked?'block':'none';
    };

    document.getElementById('btn-gen').onclick=()=>{
      if(qrType==='file') handleFileUpload();
      else generateQR();
    };
  }

  /* ── Type form ── */
  function buildTypeForm(){
    const f=document.getElementById('type-form');
    if(qrType==='url') f.innerHTML=`<div class="form-group"><label class="form-label">URL</label><input id="qr-url" class="form-input" type="url" placeholder="https://example.com"/></div>`;
    else if(qrType==='text') f.innerHTML=`<div class="form-group"><label class="form-label">Text</label><textarea id="qr-text" class="form-textarea" placeholder="Any text…"></textarea></div>`;
    else if(qrType==='vcard') f.innerHTML=`
      <div class="form-group"><label class="form-label">Name</label><input id="vc-name" class="form-input" placeholder="Jane Doe"/></div>
      <div class="form-group"><label class="form-label">Phone</label><input id="vc-phone" class="form-input" placeholder="+1 555 000 0000"/></div>
      <div class="form-group"><label class="form-label">Email</label><input id="vc-email" class="form-input" placeholder="jane@example.com"/></div>
      <div class="form-group"><label class="form-label">Company</label><input id="vc-org" class="form-input" placeholder="Acme Corp"/></div>`;
    else if(qrType==='wifi') f.innerHTML=`
      <div class="form-group"><label class="form-label">SSID</label><input id="wifi-ssid" class="form-input" placeholder="Network name"/></div>
      <div class="form-group"><label class="form-label">Password</label><input id="wifi-pw" class="form-input" type="password" placeholder="••••••••"/></div>
      <div class="form-group"><label class="form-label">Security</label>
        <select id="wifi-enc" class="form-select"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Open</option></select>
      </div>`;
    else if(qrType==='file') f.innerHTML=`
      <div class="form-group">
        <label class="form-label">📎 Paste your file link (any cloud service)</label>
        <input id="fs-manual-url" class="form-input" type="url" placeholder="https://drive.google.com/… or any file URL"/>
        <div style="font-size:.7rem;color:var(--text-3);margin-top:5px">
          Upload to <b style="color:var(--text-2)">Google Drive</b>, <b style="color:var(--text-2)">Dropbox</b>,
          <b style="color:var(--text-2)">WeTransfer</b>, <b style="color:var(--text-2)">OneDrive</b> etc. — paste the share link here.
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:4px 0 12px">
        <div style="flex:1;height:1px;background:var(--border-2)"></div>
        <span style="font-size:.72rem;color:var(--text-3);font-weight:700">OR AUTO-UPLOAD</span>
        <div style="flex:1;height:1px;background:var(--border-2)"></div>
      </div>
      <div id="fs-drop" style="border:2px dashed rgba(79,70,229,.3);border-radius:12px;padding:22px;text-align:center;cursor:pointer;background:rgba(79,70,229,.04);transition:all .2s" onclick="document.getElementById('fs-inp').click()">
        <div style="font-size:1.8rem;margin-bottom:6px">☁️</div>
        <div style="font-size:.84rem;color:var(--text-2)">Drop file or <span style="color:var(--primary)">click to browse</span></div>
        <div style="font-size:.68rem;color:var(--text-3);margin-top:3px">tmpfiles.org (60 min) · Pixeldrain (fallback)</div>
        <input type="file" id="fs-inp" style="display:none"/>
      </div>
      <div id="fs-info" style="margin-top:8px"></div>
      <div id="fs-progress" style="height:4px;background:rgba(255,255,255,.06);border-radius:4px;margin-top:8px;overflow:hidden;display:none">
        <div id="fs-bar" style="height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));width:0%;transition:width .3s"></div>
      </div>
      <div style="margin-top:12px;background:rgba(255,255,255,.03);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.05)">
        <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0">
          <input type="checkbox" id="fs-app-friendly" />
          <span style="font-size:.8rem">Use TaskNexus Download Page</span>
        </label>
        <div style="font-size:.68rem;color:var(--text-3);margin-top:4px;line-height:1.4">
          By default, the QR links directly to the file so <b>any</b> scanner can download it.<br/>
          Check this to wrap it in a beautiful download UI (forces ON if password-protected).
        </div>
      </div>`;


    if(qrType==='file'){
      const drop=document.getElementById('fs-drop');
      const inp =document.getElementById('fs-inp');
      drop.ondragover =e=>{e.preventDefault();drop.style.background='rgba(79,70,229,.1)';drop.style.borderColor='rgba(79,70,229,.6)';};
      drop.ondragleave=()=>{drop.style.background='rgba(79,70,229,.04)';drop.style.borderColor='rgba(79,70,229,.3)';};
      drop.ondrop    =e=>{e.preventDefault();setFile(e.dataTransfer.files[0]);drop.style.background='rgba(79,70,229,.04)';drop.style.borderColor='rgba(79,70,229,.3)';};
      inp.onchange   =()=>setFile(inp.files[0]);
      function setFile(file){
        if(!file)return;
        window._qrFile=file;
        const kb=(file.size/1024).toFixed(1);
        document.getElementById('fs-info').innerHTML=
          `<div class="badge badge-green" style="width:100%;justify-content:flex-start;gap:6px;padding:8px 12px">📎 ${esc(file.name)} — ${kb} KB</div>`;
        document.getElementById('btn-gen').textContent='☁️ Upload File & Generate QR';
        document.getElementById('fs-manual-url').value='';
      }
      document.getElementById('fs-manual-url').addEventListener('input',()=>{
        window._qrFile=null;
        document.getElementById('fs-info').innerHTML='';
        document.getElementById('btn-gen').textContent='🔲 Generate QR from Link';
      });


    }
  } // end buildTypeForm

  /* ── Build QR data string ── */
  function buildData(){
    let d='';
    if(qrType==='url')   d=document.getElementById('qr-url')?.value.trim()||'https://example.com';
    else if(qrType==='text') d=document.getElementById('qr-text')?.value.trim()||'Hello';
    else if(qrType==='vcard') d=`BEGIN:VCARD\nVERSION:3.0\nFN:${v('vc-name')}\nTEL:${v('vc-phone')}\nEMAIL:${v('vc-email')}\nORG:${v('vc-org')}\nEND:VCARD`;
    else if(qrType==='wifi') d=`WIFI:T:${v('wifi-enc')};S:${v('wifi-ssid')};P:${v('wifi-pw')};;`;
    const pwOn=document.getElementById('qr-pw-on')?.checked;
    const pw  =document.getElementById('qr-pw')?.value.trim();
    if(pwOn&&pw) d+=` [🔒${pw}]`;
    return d;
  }
  function v(id){return document.getElementById(id)?.value.trim()||'';}

  /* ── Standard generate ── */
  function generateQR(){
    const data=buildData();
    const size=v('qr-size')||'250';
    const ecc =v('qr-ecc')||'M';
    const fg  =document.getElementById('qr-fg').value;
    const bg  =document.getElementById('qr-bg').value;
    const src =qrUrl(data,size,ecc,fg,bg);
    showQRPreview(src,size,data);
  }

  /* ── File Share: paste URL (always works) OR auto-upload ── */
  async function handleFileUpload(){
    // Path A: user pasted a URL → use it directly (no upload needed)
    const manualUrl=document.getElementById('fs-manual-url')?.value.trim();
    if(manualUrl){
      try{ new URL(manualUrl); }catch{ toast('Enter a valid URL','error'); return; }
      buildFileShareQR(manualUrl,'(external)','');
      return;
    }
    // Path B: file selected → try auto-upload
    const file=window._qrFile;
    if(!file){ toast('Paste a file link above or drop a file','error'); return; }
    const btn=document.getElementById('btn-gen');
    const prog=document.getElementById('fs-progress');
    const bar=document.getElementById('fs-bar');
    btn.disabled=true; btn.innerHTML='<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M2 12h20"></path><path d="M12 2v20"></path><path d="M4 4h16v16H4z"></path></svg> Uploading…';
    prog.style.display='block'; bar.style.width='15%';
    try{
      bar.style.width='50%';
      const {url:fileUrl,svc}=await uploadFile(file);
      bar.style.width='100%';
      buildFileShareQR(fileUrl,svc,file.name);
      toast('Uploaded via '+svc+' ✓','success');
    }catch(err){
      document.getElementById('qr-preview').innerHTML=`
        <div style="text-align:left">
          <div style="font-size:1.4rem;margin-bottom:8px;text-align:center"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>️</div>
          <div style="color:var(--danger);font-weight:700;margin-bottom:12px;text-align:center">Auto-upload blocked by browser</div>
          <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:14px;font-size:.8rem;color:var(--text-2);line-height:1.8">
            <b style="color:var(--text)">Use the paste-link method instead:</b><br/>
            1. Go to <a href="https://www.file.io" target="_blank" style="color:var(--primary)">file.io</a> /
               <a href="https://wetransfer.com" target="_blank" style="color:var(--primary)">WeTransfer</a> /
               <a href="https://drive.google.com" target="_blank" style="color:var(--primary)">Google Drive</a><br/>
            2. Upload your file there &amp; copy the share link<br/>
            3. Paste the link in the <b style="color:var(--text)">"Paste your file link"</b> field<br/>
            4. Click <b style="color:var(--text)">Generate QR from Link</b>
          </div>
        </div>`;
      toast('Paste a link instead — auto-upload blocked','warning',5000);
    }finally{
      btn.disabled=false; btn.innerHTML='☁️ Upload File & Generate QR';
      setTimeout(()=>{ prog.style.display='none'; bar.style.width='0%'; },800);
    }
  }

  function buildFileShareQR(fileUrl,svc,fileName){
    const pwOn=document.getElementById('qr-pw-on')?.checked;
    const pwVal=document.getElementById('qr-pw')?.value.trim();
    const pwHash=(pwOn&&pwVal)?hashStr(pwVal):'';
    const appFriendly=document.getElementById('fs-app-friendly')?.checked || (pwOn && pwVal);
    
    const size=v('qr-size')||'250',ecc=v('qr-ecc')||'M';
    const fg=document.getElementById('qr-fg').value,bg=document.getElementById('qr-bg').value;

    if(!appFriendly) {
      showQRPreview(qrUrl(fileUrl,size,ecc,fg,bg),size,fileUrl,false);
      return;
    }

    const base=window.location.href.split('#')[0].replace(/\/[^/]*$/,'/');
    const sp=new URLSearchParams();
    sp.set('url',fileUrl);
    if(fileName) sp.set('name',encodeURIComponent(fileName));
    if(svc) sp.set('svc',svc);
    if(pwHash) sp.set('pw',pwHash);
    const sharePage=base+'share.html#'+sp.toString();
    showQRPreview(qrUrl(sharePage,size,ecc,fg,bg),size,sharePage,true,fileName||fileUrl,svc,pwOn&&pwVal);
  }

  /* Simple hash for password (mirrors share.html) */
  function hashStr(s){let v=2166136261>>>0;for(let i=0;i<s.length;i++){v^=s.charCodeAt(i);v=Math.imul(v,16777619)>>>0;}return v.toString(16);}

  /* ── Show QR in preview panel ── */
  function showQRPreview(src,size,linkOrData,isFileShare=false,fileName='',svc='',hasPw=false){
    const prev=document.getElementById('qr-preview');
    const safeLink=esc(linkOrData);
    prev.innerHTML=`
      <div style="background:white;padding:14px;border-radius:14px;margin-bottom:14px;display:inline-block;box-shadow:0 8px 32px rgba(0,0,0,.3)">
        <img src="${src}" width="${size}" height="${size}" alt="QR"/>
      </div>
      ${isFileShare?`
        <div style="width:100%;max-width:320px;margin-bottom:10px">
          <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;justify-content:center">
            ${svc?`<span class="badge badge-green" style="font-size:.68rem">☁ ${esc(svc)}</span>`:''}           
            ${hasPw?`<span class="badge badge-purple" style="font-size:.68rem">🔒 Password protected</span>`:''}
          </div>
          <div style="font-size:.68rem;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Share Page Link</div>
          <div style="display:flex;gap:6px">
            <input class="form-input" style="font-size:.68rem;font-family:var(--font-mono);flex:1" readonly value="${safeLink}" id="share-link-out"/>
            <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('share-link-out').value);toast('Copied!','success')">Copy</button>
          </div>
          <div style="font-size:.7rem;color:var(--text-3);margin-top:5px">📎 ${esc(fileName)} — scanner opens a download page</div>
        </div>`:''}
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="(()=>{const a=document.createElement('a');a.href='${src}';a.download='qr.png';a.click()})()"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg> Download QR</button>
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${src}');toast('URL copied!','success')">📋 Copy URL</button>
        ${isFileShare?`<a href="${safeLink}" target="_blank" class="btn btn-secondary btn-sm">Preview Page ↗</a>`:''}
      </div>`;
  }

  /* ══════ SCAN ══════ */
  function renderScan(){
    const body=document.getElementById('qr-main');
    body.innerHTML=`
    <style>
      @keyframes scanMove{0%,100%{top:15%}50%{top:80%}}
      @keyframes cornerPulse{0%,100%{opacity:.5}50%{opacity:1}}
      .corner{position:absolute;width:22px;height:22px;border-color:var(--primary);border-style:solid;animation:cornerPulse 2s ease infinite}
    </style>
    <div class="grid-2" style="gap:20px;align-items:start">
      <div class="card">
        <div style="font-weight:700;font-family:var(--font-display);margin-bottom:12px;letter-spacing:-.02em">Camera Scanner</div>

        <!-- Camera viewport -->
        <div style="position:relative;background:#000;border-radius:12px;overflow:hidden;aspect-ratio:1;margin-bottom:12px" id="cam-wrap">
          <video id="qr-video" style="width:100%;height:100%;object-fit:cover" autoplay muted playsinline></video>
          <canvas id="qr-canvas" style="display:none"></canvas>

          <!-- Idle overlay (shown before camera starts) -->
          <div id="cam-idle" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,5,5,.85)">
            <div style="font-size:3rem;margin-bottom:10px;opacity:.4">📷</div>
            <div style="font-size:.82rem;color:rgba(255,255,255,.4)">Press Start Camera</div>
          </div>

          <!-- Aiming frame (shown when scanning) -->
          <div id="cam-aim" style="display:none;position:absolute;inset:0;pointer-events:none">
            <!-- corners -->
            <div class="corner" style="top:18%;left:18%;border-width:3px 0 0 3px;border-radius:3px 0 0 0"></div>
            <div class="corner" style="top:18%;right:18%;border-width:3px 3px 0 0;border-radius:0 3px 0 0"></div>
            <div class="corner" style="bottom:18%;left:18%;border-width:0 0 3px 3px;border-radius:0 0 0 3px"></div>
            <div class="corner" style="bottom:18%;right:18%;border-width:0 3px 3px 0;border-radius:0 0 3px 0"></div>
            <!-- scan line -->
            <div style="position:absolute;left:18%;right:18%;height:2px;background:linear-gradient(90deg,transparent,#a5b4fc,transparent);animation:scanMove 2s ease-in-out infinite"></div>
            <!-- label -->
            <div style="position:absolute;bottom:12%;left:50%;transform:translateX(-50%);font-size:.68rem;color:rgba(165,180,252,.7);letter-spacing:.1em;white-space:nowrap">SCANNING…</div>
          </div>

          <!-- Confirm progress dots -->
          <div id="cam-dots" style="position:absolute;top:8px;right:10px;display:none;gap:4px;display:none">
            <div class="dot" style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);transition:background .15s" id="dot0"></div>
            <div class="dot" style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);transition:background .15s" id="dot1"></div>
            <div class="dot" style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);transition:background .15s" id="dot2"></div>
          </div>
        </div>

        <!-- Status text -->
        <div id="cam-status" style="font-size:.78rem;color:var(--text-3);text-align:center;margin-bottom:10px">Camera not started</div>

        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="btn btn-primary" style="flex:1" id="btn-start-scan">📷 Start Camera</button>
          <button class="btn btn-secondary" id="btn-stop-scan">■ Stop</button>
        </div>
        <div class="divider"></div>
        <div style="font-weight:600;font-size:.84rem;margin-bottom:8px;color:var(--text-2)">Or scan from image file</div>
        <label class="btn btn-secondary" style="width:100%;justify-content:center;cursor:pointer">
          🖼 Upload Image to Scan
          <input type="file" id="scan-img-inp" accept="image/*" style="display:none"/>
        </label>
      </div>

      <div class="card">
        <div style="font-weight:700;font-family:var(--font-display);margin-bottom:12px;letter-spacing:-.02em">Scan Result</div>
        <div id="scan-result" style="min-height:200px;display:flex;align-items:center;justify-content:center;text-align:center">
          <div>
            <div style="font-size:2.5rem;opacity:.15;margin-bottom:8px">🔲</div>
            <div style="color:var(--text-3);font-size:.84rem">Result will appear here</div>
            <div style="color:var(--text-4);font-size:.72rem;margin-top:6px">Requires 3 consistent reads to confirm</div>
          </div>
        </div>
      </div>
    </div>`;

    document.getElementById('btn-start-scan').onclick=startScan;
    document.getElementById('btn-stop-scan').onclick=stopScan;
    document.getElementById('scan-img-inp').onchange=e=>scanFromImage(e.target.files[0]);
  }

  function setStatus(msg){ const s=document.getElementById('cam-status'); if(s) s.textContent=msg; }

  function startScan(){
    if(!window.jsQR){ toast('jsQR still loading — wait a moment and try again','warning'); return; }
    if(!navigator.mediaDevices?.getUserMedia){ toast('Camera not supported in this browser','error'); return; }

    // Reset confirmation state
    scanHits=0; scanPrev=''; scanLast=0;

    setStatus('Requesting camera…');
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}})
      .then(stream=>{
        scanStream=stream;
        const vid=document.getElementById('qr-video');
        if(!vid){ stopScan(); return; }
        vid.srcObject=stream;
        vid.play();

        // Show aiming UI, hide idle overlay
        const idle=document.getElementById('cam-idle');
        const aim =document.getElementById('cam-aim');
        const dots=document.getElementById('cam-dots');
        if(idle) idle.style.display='none';
        if(aim)  aim.style.display='block';
        if(dots) dots.style.display='flex';

        setStatus('Scanning — hold QR code steady inside the frame');
        // Small warmup delay before scanning starts
        setTimeout(()=>{ if(scanStream) scanFrame(); }, 600);
      })
      .catch(err=>{
        const msg = err.name==='NotAllowedError' ? 'Camera permission denied. Allow camera access and try again.'
                  : err.name==='NotFoundError'   ? 'No camera found on this device.'
                  : 'Camera error: '+err.message;
        toast(msg,'error',5000);
        setStatus(msg);
      });
  }

  function scanFrame(){
    if(!scanStream) return;
    const vid=document.getElementById('qr-video');
    const cvs=document.getElementById('qr-canvas');
    if(!vid||!cvs){ stopScan(); return; }

    const now=performance.now();
    if(now - scanLast >= SCAN_INTERVAL && vid.readyState===vid.HAVE_ENOUGH_DATA){
      scanLast=now;
      cvs.width=vid.videoWidth; cvs.height=vid.videoHeight;
      const ctx=cvs.getContext('2d');
      ctx.drawImage(vid,0,0);
      const imgData=ctx.getImageData(0,0,cvs.width,cvs.height);
      const code=window.jsQR(imgData.data,imgData.width,imgData.height,{inversionAttempts:'dontInvert'});

      if(code && code.data){
        if(code.data === scanPrev){
          scanHits++;
          // Update confirmation dots
          for(let i=0;i<3;i++){
            const dot=document.getElementById('dot'+i);
            if(dot) dot.style.background = i<scanHits ? '#a5b4fc' : 'rgba(255,255,255,.2)';
          }
          if(scanHits >= SCAN_CONFIRM){
            stopScan();
            showScanResult(code.data);
            return;
          }
        } else {
          // Different code detected — reset
          scanPrev=code.data; scanHits=1;
          for(let i=0;i<3;i++){ const d=document.getElementById('dot'+i); if(d) d.style.background='rgba(255,255,255,.2)'; }
          const dot0=document.getElementById('dot0'); if(dot0) dot0.style.background='#a5b4fc';
        }
      } else {
        // Nothing detected — decay hits slowly
        if(scanHits>0) scanHits=Math.max(0,scanHits-1);
        if(scanHits===0){ scanPrev=''; for(let i=0;i<3;i++){ const d=document.getElementById('dot'+i); if(d) d.style.background='rgba(255,255,255,.2)'; } }
      }
    }
    scanRaf=requestAnimationFrame(scanFrame);
  }

  function stopScan(){
    cancelAnimationFrame(scanRaf); scanRaf=null;
    if(scanStream){ scanStream.getTracks().forEach(t=>t.stop()); scanStream=null; }
    scanHits=0; scanPrev='';
    const idle=document.getElementById('cam-idle');
    const aim =document.getElementById('cam-aim');
    const dots=document.getElementById('cam-dots');
    if(idle){ idle.style.display='flex'; }
    if(aim)  aim.style.display='none';
    if(dots) dots.style.display='none';
    setStatus('Camera stopped');
  }

  function scanFromImage(file){
    if(!file)return;
    if(!window.jsQR){toast('jsQR still loading','warning');return;}
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const c=document.createElement('canvas');
      c.width=img.width; c.height=img.height;
      const ctx=c.getContext('2d');
      ctx.drawImage(img,0,0);
      const d=ctx.getImageData(0,0,img.width,img.height);
      const code=window.jsQR(d.data,d.width,d.height);
      if(code) showScanResult(code.data);
      else toast('No QR code found in image','warning');
      URL.revokeObjectURL(url);
    };
    img.src=url;
  }

  function showScanResult(data){
    const res=document.getElementById('scan-result');
    if(!res)return;
    const isUrl=data.startsWith('http')||data.startsWith('https');
    res.innerHTML=`
      <div style="width:100%">
        <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,.3);border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="font-size:.68rem;color:rgba(134,239,172,.7);font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">✓ QR Decoded</div>
          <div style="font-size:.84rem;color:var(--text);word-break:break-all;line-height:1.5;max-height:160px;overflow-y:auto">${esc(data)}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(data)});toast('Copied!','success')">📋 Copy</button>
          ${isUrl?`<a href="${esc(data)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Open Link ↗</a>`:''}
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('mm-create').click();document.getElementById('qr-url')&&(document.getElementById('qr-url').value=${JSON.stringify(data)})">Use in Generator</button>
        </div>
      </div>`;
    toast('QR scanned successfully ✓','success');
  }

  render();
})();
