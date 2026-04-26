// Image Tools — Dark Theme
(function(){
  const el = document.getElementById('panel-imagetools');
  let mode = 'convert';
  let loadedFile = null, canvas, ctx;

  function render(){
    el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">Image Tools</h1><p class="panel-desc">Convert, resize, and compress images in your browser.</p></div>
    <div class="tabs" style="margin-bottom:20px">
      ${['convert','resize','compress'].map(m=>`<button class="tab-btn${mode===m?' active':''}" data-m="${m}">${m.charAt(0).toUpperCase()+m.slice(1)}</button>`).join('')}
    </div>

    <!-- Drop zone -->
    <div class="card" id="drop-zone" style="border:2px dashed rgba(79,70,229,0.3);background:rgba(79,70,229,0.05);
      text-align:center;padding:36px;cursor:pointer;transition:background .2s,border-color .2s;margin-bottom:18px"
      onclick="document.getElementById('img-file-input').click()">
      <div id="drop-label">
        <div style="font-size:2.5rem;margin-bottom:8px">🖼</div>
        <div style="font-size:.9rem;color:var(--text-2);margin-bottom:4px">Drop an image or <span style="color:var(--primary);text-decoration:underline">click to browse</span></div>
        <div style="font-size:.72rem;color:var(--text-3)">Supports PNG, JPG, WEBP, GIF, BMP</div>
      </div>
      <input type="file" id="img-file-input" accept="image/*" style="display:none"/>
    </div>

    <div id="img-tool-body"></div>
    <canvas id="proc-canvas" style="display:none"></canvas>`;

    canvas = document.getElementById('proc-canvas');
    ctx    = canvas.getContext('2d');

    const zone  = document.getElementById('drop-zone');
    const input = document.getElementById('img-file-input');
    zone.addEventListener('dragover',  e=>{ e.preventDefault(); zone.style.borderColor='rgba(79,70,229,0.6)'; zone.style.background='rgba(79,70,229,0.1)'; });
    zone.addEventListener('dragleave', ()=>{ zone.style.borderColor='rgba(79,70,229,0.3)'; zone.style.background='rgba(79,70,229,0.05)'; });
    zone.addEventListener('drop',      e=>{ e.preventDefault(); loadImage(e.dataTransfer.files[0]); zone.style.borderColor='rgba(79,70,229,0.3)'; zone.style.background='rgba(79,70,229,0.05)'; });
    input.addEventListener('change',   ()=>loadImage(input.files[0]));

    el.querySelectorAll('.tab-btn[data-m]').forEach(b=>b.addEventListener('click',()=>{ mode=b.dataset.m; render(); }));
    renderTool();
  }

  function renderTool(){
    const body = document.getElementById('img-tool-body');
    if(mode==='convert'){
      body.innerHTML=`<div class="card">
        <div class="form-group">
          <label class="form-label">Output Format</label>
          <select id="conv-fmt" class="form-select" style="max-width:220px">
            <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-do-convert">Convert & Download</button>
      </div>`;
      document.getElementById('btn-do-convert').addEventListener('click',()=>processAndDownload('convert'));
    } else if(mode==='resize'){
      body.innerHTML=`<div class="card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <div class="form-group" style="flex:1;margin:0"><label class="form-label">Width (px)</label><input id="resize-w" type="number" class="form-input" placeholder="Width" min="1"/></div>
          <div class="form-group" style="flex:1;margin:0"><label class="form-label">Height (px)</label><input id="resize-h" type="number" class="form-input" placeholder="Height" min="1"/></div>
        </div>
        <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:14px">
          <input type="checkbox" id="keep-ratio" checked/> Keep aspect ratio
        </label>
        <button class="btn btn-primary" id="btn-do-resize">Resize & Download</button>
      </div>`;
      document.getElementById('btn-do-resize').addEventListener('click',()=>processAndDownload('resize'));
    } else {
      body.innerHTML=`<div class="card">
        <div class="form-group">
          <label class="form-label">Quality: <span id="q-val">80</span>%</label>
          <input id="comp-quality" type="range" min="1" max="100" value="80" style="width:100%;accent-color:var(--primary)"/>
        </div>
        <div style="font-size:.78rem;color:var(--text-3);margin-bottom:14px">Higher = better quality, larger file. Lower = smaller file, more compression.</div>
        <button class="btn btn-primary" id="btn-do-compress">Compress & Download</button>
      </div>`;
      document.getElementById('comp-quality').addEventListener('input', e=>document.getElementById('q-val').textContent=e.target.value);
      document.getElementById('btn-do-compress').addEventListener('click',()=>processAndDownload('compress'));
    }
  }

  function loadImage(file){
    if(!file||!file.type.startsWith('image/')){ toast('Please select a valid image','error'); return; }
    loadedFile=file;
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
      ctx.drawImage(img,0,0);
      document.getElementById('drop-label').innerHTML=`
        <img src="${url}" style="max-height:80px;border-radius:8px;margin-bottom:8px;object-fit:contain"/>
        <div style="font-size:.84rem;color:var(--text-2);font-weight:600">${esc(file.name)}</div>
        <div style="font-size:.72rem;color:var(--text-3)">${img.naturalWidth}×${img.naturalHeight}px · ${(file.size/1024).toFixed(1)}KB</div>`;
      if(mode==='resize'){
        const wEl=document.getElementById('resize-w');
        const hEl=document.getElementById('resize-h');
        if(wEl) wEl.value=img.naturalWidth;
        if(hEl) hEl.value=img.naturalHeight;
      }
      toast('Image loaded ✓','success');
    };
    img.src=url;
  }

  function processAndDownload(op){
    if(!loadedFile){ toast('Load an image first','error'); return; }
    let fmt='image/png', quality=1, outW=canvas.width, outH=canvas.height;
    if(op==='convert') fmt=document.getElementById('conv-fmt').value;
    if(op==='compress'){ fmt='image/jpeg'; quality=parseInt(document.getElementById('comp-quality').value)/100; }
    if(op==='resize'){
      outW=parseInt(document.getElementById('resize-w').value)||canvas.width;
      outH=parseInt(document.getElementById('resize-h').value)||canvas.height;
      if(document.getElementById('keep-ratio').checked){
        const ratio=canvas.width/canvas.height;
        if(document.activeElement.id==='resize-w') outH=Math.round(outW/ratio);
        else outW=Math.round(outH*ratio);
      }
    }
    const out=document.createElement('canvas');
    out.width=outW; out.height=outH;
    const octx=out.getContext('2d');
    octx.drawImage(canvas,0,0,outW,outH);
    out.toBlob(blob=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      const ext={png:'png','image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[fmt]||'png';
      a.href=url; a.download=`tasknexus_${op}.${ext}`; a.click();
      toast(`${op.charAt(0).toUpperCase()+op.slice(1)} complete — ${(blob.size/1024).toFixed(1)}KB ✓`,'success');
    }, fmt, quality);
  }

  render();
})();
