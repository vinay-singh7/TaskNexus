// Image Tools — Dark Theme
(function(){
  const el = document.getElementById('panel-imagetools');
  let mode = 'convert';
  let loadedFile = null, loadedImg = null, canvas, ctx;
  let lastBlob = null, lastExt = 'png';
  let bgFg = null; // cached foreground (cutout) after background removal
  const cropState = { rot:0, flipH:false, flipV:false, aspect:0, rect:null, work:null };

  const TABS = [
    { id:'convert',      label:'Convert' },
    { id:'resize',       label:'Resize' },
    { id:'crop',         label:'Crop & Rotate' },
    { id:'compress',     label:'Compress' },
    { id:'increaseSize', label:'Increase Size' },
    { id:'enhance',      label:'Enhance Quality' },
    { id:'removeBg',     label:'Remove BG' },
    { id:'blurBg',       label:'Blur BG' },
  ];
  const needsImage = () => true;

  // Lazily-loaded AI modules (cached after first import)
  const AI = {};

  function render(){
    el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">Image Tools</h1><p class="panel-desc">Convert, resize, compress, enhance, and edit images in your browser.</p></div>
    <div class="tabs" style="margin-bottom:20px;flex-wrap:wrap">
      ${TABS.map(t=>`<button class="tab-btn${mode===t.id?' active':''}" data-m="${t.id}">${t.label}</button>`).join('')}
    </div>

    ${needsImage() ? `
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
    </div>` : ''}

    <div id="img-tool-body"></div>
    <div id="img-result"></div>
    <canvas id="proc-canvas" style="display:none"></canvas>`;

    canvas = document.getElementById('proc-canvas');
    ctx    = canvas.getContext('2d');

    if(needsImage()){
      const zone  = document.getElementById('drop-zone');
      const input = document.getElementById('img-file-input');
      zone.addEventListener('dragover',  e=>{ e.preventDefault(); zone.style.borderColor='rgba(79,70,229,0.6)'; zone.style.background='rgba(79,70,229,0.1)'; });
      zone.addEventListener('dragleave', ()=>{ zone.style.borderColor='rgba(79,70,229,0.3)'; zone.style.background='rgba(79,70,229,0.05)'; });
      zone.addEventListener('drop',      e=>{ e.preventDefault(); loadImage(e.dataTransfer.files[0]); zone.style.borderColor='rgba(79,70,229,0.3)'; zone.style.background='rgba(79,70,229,0.05)'; });
      input.addEventListener('change',   ()=>loadImage(input.files[0]));
      // Restore the previously loaded image (canvas is recreated on each tab switch)
      if(loadedImg){
        canvas.width=loadedImg.naturalWidth; canvas.height=loadedImg.naturalHeight;
        ctx.drawImage(loadedImg,0,0);
        showLoadedThumb();
      }
    }

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
        <div class="form-group">
          <label class="form-label">Target size (KB) — optional</label>
          <input id="target-kb" type="number" class="form-input" placeholder="e.g. 150 (leave empty for full quality)" min="1" style="max-width:320px"/>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">For JPEG/WebP, quality is auto-tuned to fit. PNG is lossless, so it's downscaled only if needed.</div>
        </div>
        <button class="btn btn-primary" id="btn-do-convert">Generate</button>
      </div>`;
      document.getElementById('btn-do-convert').addEventListener('click',()=>processAndDownload('convert'));
    } else if(mode==='resize'){
      body.innerHTML=`<div class="card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <div class="form-group" style="flex:1;min-width:120px;margin:0"><label class="form-label">Width (px)</label><input id="resize-w" type="number" class="form-input" placeholder="Width" min="1"/></div>
          <div class="form-group" style="flex:1;min-width:120px;margin:0"><label class="form-label">Height (px)</label><input id="resize-h" type="number" class="form-input" placeholder="Height" min="1"/></div>
        </div>
        <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:14px">
          <input type="checkbox" id="keep-ratio" checked/> Keep aspect ratio
        </label>
        <div class="form-group">
          <label class="form-label">Target size (KB) — optional</label>
          <input id="target-kb" type="number" class="form-input" placeholder="e.g. 200 (leave empty to keep quality)" min="1" style="max-width:320px"/>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">If set, the output is encoded as JPEG and compressed to stay at or under this size.</div>
        </div>
        <button class="btn btn-primary" id="btn-do-resize">Generate</button>
      </div>`;
      document.getElementById('btn-do-resize').addEventListener('click',()=>processAndDownload('resize'));
    } else if(mode==='crop'){
      renderCrop();
    } else if(mode==='compress'){
      body.innerHTML=`<div class="card">
        <div class="form-group">
          <label class="form-label">Quality: <span id="q-val">80</span>%</label>
          <input id="comp-quality" type="range" min="1" max="100" value="80" style="width:100%;accent-color:var(--primary)"/>
        </div>
        <div style="font-size:.78rem;color:var(--text-3);margin-bottom:14px">Higher = better quality, larger file. Lower = smaller file, more compression.</div>
        <div class="form-group">
          <label class="form-label">Target size (KB) — optional</label>
          <input id="target-kb" type="number" class="form-input" placeholder="e.g. 100 (overrides the quality slider)" min="1" style="max-width:320px"/>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">If set, quality is auto-tuned so the output stays at or under this size.</div>
        </div>
        <button class="btn btn-primary" id="btn-do-compress">Generate</button>
      </div>`;
      document.getElementById('comp-quality').addEventListener('input', e=>document.getElementById('q-val').textContent=e.target.value);
      document.getElementById('btn-do-compress').addEventListener('click',()=>processAndDownload('compress'));
    } else if(mode==='increaseSize'){
      body.innerHTML=`<div class="card">
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:14px">Inflate an image to a <b>minimum</b> file size (handy when an upload requires a file of at least N KB). Padding bytes are appended without changing how the image looks.</p>
        <div class="form-group">
          <label class="form-label">Target minimum size (KB)</label>
          <input id="inc-target-kb" type="number" class="form-input" placeholder="e.g. 500" min="1" style="max-width:320px"/>
        </div>
        <div class="form-group">
          <label class="form-label">Output Format</label>
          <select id="inc-fmt" class="form-select" style="max-width:220px">
            <option value="image/jpeg">JPEG</option><option value="image/png">PNG</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-do-increase">Generate</button>
      </div>`;
      document.getElementById('btn-do-increase').addEventListener('click', doIncreaseSize);
    } else if(mode==='enhance'){
      body.innerHTML=`<div class="card">
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:14px">Upscale and sharpen an image to increase its quality and resolution. Uses an in-browser AI super-resolution model when available, with a high-quality resampling fallback.</p>
        <div class="form-group">
          <label class="form-label">Upscale factor</label>
          <select id="enh-scale" class="form-select" style="max-width:220px">
            <option value="2" selected>2× (recommended)</option>
            <option value="3">3×</option>
            <option value="4">4×</option>
          </select>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">AI mode upscales at the model's fixed factor; the fallback uses the chosen factor.</div>
        </div>
        <button class="btn btn-primary" id="btn-do-enhance">Enhance</button>
        <div id="enh-status" style="margin-top:10px;font-size:.8rem;color:var(--primary);display:none"></div>
      </div>`;
      document.getElementById('btn-do-enhance').addEventListener('click', doEnhance);
    } else if(mode==='removeBg'){
      body.innerHTML=`<div class="card">
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:14px">Automatically remove the background, leaving the subject on a transparent (PNG) background. Runs an AI model in your browser — the first run downloads the model (needs internet) and may take a moment. After removal you can drop in a solid background color (e.g. white/blue for passport photos).</p>
        <button class="btn btn-primary" id="btn-do-removebg">Remove Background</button>
        <div id="bg-status" style="margin-top:10px;font-size:.8rem;color:var(--primary);display:none"></div>
      </div>`;
      document.getElementById('btn-do-removebg').addEventListener('click', doRemoveBg);
    } else if(mode==='blurBg'){
      body.innerHTML=`<div class="card">
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:14px">Keep the subject sharp and blur the background (portrait / depth-of-field effect). Uses the same in-browser AI to detect the subject.</p>
        <div class="form-group">
          <label class="form-label">Blur strength: <span id="blur-val">12</span>px</label>
          <input id="blur-amount" type="range" min="2" max="40" value="12" style="width:100%;accent-color:var(--primary)"/>
        </div>
        <button class="btn btn-primary" id="btn-do-blurbg">Blur Background</button>
        <div id="blur-status" style="margin-top:10px;font-size:.8rem;color:var(--primary);display:none"></div>
      </div>`;
      document.getElementById('blur-amount').addEventListener('input', e=>document.getElementById('blur-val').textContent=e.target.value);
      document.getElementById('btn-do-blurbg').addEventListener('click', doBlurBg);
    }
  }

  function showLoadedThumb(){
    const lbl=document.getElementById('drop-label');
    if(!lbl||!loadedFile) return;
    const url=URL.createObjectURL(loadedFile);
    lbl.innerHTML=`
      <img src="${url}" style="max-height:80px;border-radius:8px;margin-bottom:8px;object-fit:contain"/>
      <div style="font-size:.84rem;color:var(--text-2);font-weight:600">${esc(loadedFile.name)}</div>
      <div style="font-size:.72rem;color:var(--text-3)">${canvas.width}×${canvas.height}px · ${(loadedFile.size/1024).toFixed(1)}KB</div>
      <div style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button type="button" class="btn btn-secondary btn-sm" id="img-change-btn">Change image</button>
        <button type="button" class="btn btn-danger btn-sm" id="img-clear-btn">✕ Remove image</button>
      </div>`;
    const changeBtn=document.getElementById('img-change-btn');
    const clearBtn=document.getElementById('img-clear-btn');
    if(changeBtn) changeBtn.addEventListener('click', e=>{ e.stopPropagation(); document.getElementById('img-file-input').click(); });
    if(clearBtn)  clearBtn.addEventListener('click',  e=>{ e.stopPropagation(); clearImage(); });
  }

  function clearImage(){
    loadedFile=null; loadedImg=null; bgFg=null; lastBlob=null;
    if(canvas){ ctx.clearRect(0,0,canvas.width,canvas.height); canvas.width=0; canvas.height=0; }
    if(document.getElementById('img-file-input')) document.getElementById('img-file-input').value='';
    render(); // rebuilds the tab with the empty dropzone + clears the result
    toast('Image removed','default');
  }

  function loadImage(file){
    if(!file||!file.type.startsWith('image/')){ toast('Please select a valid image','error'); return; }
    loadedFile=file;
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      loadedImg=img;
      canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
      ctx.drawImage(img,0,0);
      showLoadedThumb();
      if(mode==='resize'){
        const wEl=document.getElementById('resize-w');
        const hEl=document.getElementById('resize-h');
        if(wEl) wEl.value=img.naturalWidth;
        if(hEl) hEl.value=img.naturalHeight;
      }
      const res=document.getElementById('img-result');
      if(res) res.innerHTML='';
      if(mode==='crop') renderTool(); // rebuild crop stage with the new image
      toast('Image loaded ✓','success');
    };
    img.src=url;
  }

  // Promise wrapper around canvas.toBlob
  function canvasToBlob(cnv, fmt, q){
    return new Promise(res=>cnv.toBlob(b=>res(b), fmt, q));
  }
  function blobToImage(blob){
    return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=URL.createObjectURL(blob); });
  }

  // High-quality resize. Big reductions are done in halving steps to avoid the
  // aliasing/pixelation a single low-quality drawImage produces.
  function scaleCanvas(src, w, h){
    w=Math.max(1,Math.round(w)); h=Math.max(1,Math.round(h));
    let cur=src;
    while(cur.width > w*2 || cur.height > h*2){
      const nw=Math.max(w, Math.floor(cur.width/2));
      const nh=Math.max(h, Math.floor(cur.height/2));
      const tmp=document.createElement('canvas'); tmp.width=nw; tmp.height=nh;
      const tctx=tmp.getContext('2d');
      tctx.imageSmoothingEnabled=true; tctx.imageSmoothingQuality='high';
      tctx.drawImage(cur,0,0,nw,nh);
      cur=tmp;
    }
    const out=document.createElement('canvas'); out.width=w; out.height=h;
    const octx=out.getContext('2d');
    octx.imageSmoothingEnabled=true; octx.imageSmoothingQuality='high';
    octx.drawImage(cur,0,0,w,h);
    return out;
  }

  // Fit a canvas to a target file size while keeping it looking good.
  // Strategy: hold quality HIGH and shrink resolution to fit (a sharp, slightly
  // smaller image beats a full-res one with crushed JPEG quality). Only as a last
  // resort (already tiny) do we lower quality. Returns { blob, width, height, hitLimit }.
  async function encodeToTarget(srcCanvas, fmt, targetBytes){
    // PNG is lossless — the only lever is resolution.
    if(fmt === 'image/png'){
      let work = srcCanvas;
      let blob = await canvasToBlob(work, fmt);
      while(blob.size > targetBytes && work.width > 24 && work.height > 24){
        work = scaleCanvas(work, work.width*0.85, work.height*0.85);
        blob = await canvasToBlob(work, fmt);
      }
      return { blob, width:work.width, height:work.height, hitLimit: blob.size > targetBytes };
    }

    const GOOD_Q = 0.82; // visually clean JPEG quality we try to preserve
    let work = srcCanvas;

    // Shrink resolution (high-quality steps) at GOOD_Q until it fits, or we're small.
    let blob = await canvasToBlob(work, fmt, GOOD_Q);
    while(blob.size > targetBytes && work.width > 32 && work.height > 32){
      work = scaleCanvas(work, work.width*0.9, work.height*0.9);
      blob = await canvasToBlob(work, fmt, GOOD_Q);
    }

    if(blob.size <= targetBytes){
      // Headroom left → push quality up toward 1.0 at the current resolution.
      let lo=GOOD_Q, hi=1.0, best=blob;
      for(let i=0;i<6;i++){ const mid=(lo+hi)/2; const b=await canvasToBlob(work, fmt, mid); if(b.size<=targetBytes){ best=b; lo=mid; } else { hi=mid; } }
      return { blob:best, width:work.width, height:work.height, hitLimit:false };
    }

    // Still too big even when small → lower quality as the last resort.
    let lo=0.2, hi=GOOD_Q, best=await canvasToBlob(work, fmt, 0.2);
    for(let i=0;i<7;i++){ const mid=(lo+hi)/2; const b=await canvasToBlob(work, fmt, mid); if(b.size<=targetBytes){ best=b; lo=mid; } else { hi=mid; } }
    return { blob:best, width:work.width, height:work.height, hitLimit: best.size > targetBytes };
  }

  async function processAndDownload(op){
    if(!loadedFile){ toast('Load an image first','error'); return; }

    let fmt='image/png', quality=1, outW=canvas.width, outH=canvas.height;

    if(op==='convert') fmt=document.getElementById('conv-fmt').value;
    if(op==='compress'){ fmt='image/jpeg'; quality=parseInt(document.getElementById('comp-quality').value)/100; }
    if(op==='resize'){
      outW=parseInt(document.getElementById('resize-w').value)||canvas.width;
      outH=parseInt(document.getElementById('resize-h').value)||canvas.height;
      if(document.getElementById('keep-ratio').checked){
        const ratio=canvas.width/canvas.height;
        if(document.activeElement && document.activeElement.id==='resize-w') outH=Math.round(outW/ratio);
        else outW=Math.round(outH*ratio);
      }
    }

    const out=scaleCanvas(canvas, outW, outH);

    const tEl=document.getElementById('target-kb');
    let targetKB=tEl ? parseFloat(tEl.value) : 0;
    if(!(targetKB>0)) targetKB=0;

    const extOf={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};

    const btnId = {convert:'btn-do-convert', resize:'btn-do-resize', compress:'btn-do-compress'}[op];
    const btn=document.getElementById(btnId);
    const origLabel=btn ? btn.textContent : '';
    if(btn){ btn.disabled=true; btn.textContent='Generating…'; }

    try {
      let blob, ext, info;

      if(targetKB>0){
        if(op!=='convert') fmt='image/jpeg';
        ext=extOf[fmt]||'png';
        const r=await encodeToTarget(out, fmt, targetKB*1024);
        blob=r.blob;
        const sizeKB=(blob.size/1024).toFixed(1);
        if(r.hitLimit){
          info=`Smallest achievable: ${sizeKB}KB (couldn't reach ${targetKB}KB)`;
          toast(`Couldn't reach ${targetKB}KB — smallest is ${sizeKB}KB`,'warning');
        } else {
          info=`${sizeKB}KB · target ${targetKB}KB · ${r.width}×${r.height}px`;
        }
      } else {
        if(op==='resize'){ fmt='image/png'; }
        else if(op==='compress'){ fmt='image/jpeg'; }
        ext=extOf[fmt]||'png';
        const q = (op==='compress') ? quality : (op==='convert' ? quality : undefined);
        blob=await canvasToBlob(out, fmt, q);
        info=`${(blob.size/1024).toFixed(1)}KB · ${out.width}×${out.height}px`;
      }

      showResult(blob, op, ext, info);
    } catch(err){
      console.error(err);
      toast('Processing failed','error');
    } finally {
      if(btn){ btn.disabled=false; btn.textContent=origLabel; }
    }
  }

  // ── Increase Image Size in KB (pad to a minimum size) ──
  async function doIncreaseSize(){
    if(!loadedFile){ toast('Load an image first','error'); return; }
    const targetKB=parseFloat(document.getElementById('inc-target-kb').value);
    if(!(targetKB>0)){ toast('Enter a target size in KB','error'); return; }
    const fmt=document.getElementById('inc-fmt').value;
    const ext=fmt==='image/jpeg'?'jpg':'png';

    const base=await canvasToBlob(canvas, fmt, fmt==='image/jpeg'?0.95:undefined);
    const targetBytes=Math.round(targetKB*1024);
    let finalBlob, info;
    if(base.size>=targetBytes){
      finalBlob=base;
      info=`${(base.size/1024).toFixed(1)}KB — already at or above target (${targetKB}KB)`;
      toast('Image is already larger than the target','warning');
    } else {
      // Append padding bytes (ignored by image viewers) to reach the target size
      const pad=new Uint8Array(targetBytes-base.size);
      finalBlob=new Blob([base, pad], { type: fmt });
      info=`${(finalBlob.size/1024).toFixed(1)}KB · padded up to target (${targetKB}KB)`;
    }
    showResult(finalBlob, 'increased', ext, info);
    toast('Done ✓','success');
  }

  // ── Crop & Rotate ──
  function renderCrop(){
    const body=document.getElementById('img-tool-body');
    if(!loadedImg){
      body.innerHTML=`<div class="card"><p style="color:var(--text-3);font-size:.9rem">Load an image above to start cropping.</p></div>`;
      return;
    }
    // reset transform state for a fresh image session
    cropState.rot=0; cropState.flipH=false; cropState.flipV=false; cropState.aspect=0;

    body.innerHTML=`<div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <button class="btn btn-secondary btn-sm" id="crop-rotl" title="Rotate left">⟲ 90°</button>
        <button class="btn btn-secondary btn-sm" id="crop-rotr" title="Rotate right">⟳ 90°</button>
        <button class="btn btn-secondary btn-sm" id="crop-fliph" title="Flip horizontal">↔ Flip</button>
        <button class="btn btn-secondary btn-sm" id="crop-flipv" title="Flip vertical">↕ Flip</button>
        <button class="btn btn-ghost btn-sm" id="crop-reset" title="Reset crop">Reset</button>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Aspect ratio</label>
          <select id="crop-aspect" class="form-select">
            <option value="0">Free</option><option value="1">1:1 (Square)</option>
            <option value="1.333">4:3</option><option value="0.75">3:4</option>
            <option value="1.777">16:9</option><option value="0.5625">9:16</option>
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Format</label>
          <select id="crop-fmt" class="form-select"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select>
        </div>
        <div class="form-group" style="margin:0;width:150px">
          <label class="form-label">Max size (KB)</label>
          <input id="crop-kb" type="number" class="form-input" placeholder="optional" min="1"/>
        </div>
        <button class="btn btn-primary" id="crop-export">Crop &amp; Export</button>
      </div>
      <div id="crop-dims" style="font-size:.78rem;color:var(--text-3);margin-bottom:10px"></div>
      <div class="crop-stage" id="crop-stage" style="position:relative;display:inline-block;max-width:100%;line-height:0;user-select:none;touch-action:none">
        <canvas id="crop-canvas" style="display:block;max-width:100%;height:auto;border-radius:var(--radius-sm)"></canvas>
        <div id="crop-box" style="position:absolute;border:1px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45);box-sizing:border-box;cursor:move">
          ${['nw','n','ne','e','se','s','sw','w'].map(h=>`<div class="crop-h" data-h="${h}" style="position:absolute;width:14px;height:14px;background:#fff;border:1px solid var(--primary);border-radius:3px;${cropHandlePos(h)}"></div>`).join('')}
        </div>
      </div>
    </div>`;

    rebuildWork(true);

    document.getElementById('crop-rotl').addEventListener('click',()=>{ cropState.rot=(cropState.rot+270)%360; rebuildWork(true); });
    document.getElementById('crop-rotr').addEventListener('click',()=>{ cropState.rot=(cropState.rot+90)%360; rebuildWork(true); });
    document.getElementById('crop-fliph').addEventListener('click',()=>{ cropState.flipH=!cropState.flipH; rebuildWork(true); });
    document.getElementById('crop-flipv').addEventListener('click',()=>{ cropState.flipV=!cropState.flipV; rebuildWork(true); });
    document.getElementById('crop-reset').addEventListener('click',()=>{ setCropRect(); positionBox(); updateDims(); });
    document.getElementById('crop-aspect').addEventListener('change', e=>{ cropState.aspect=parseFloat(e.target.value)||0; setCropRect(); positionBox(); updateDims(); });
    document.getElementById('crop-export').addEventListener('click', exportCrop);

    initCropDrag();
  }

  function cropHandlePos(h){
    const c='margin:-7px 0 0 -7px;'; // center handles on their anchor
    const map={
      nw:'top:0;left:0;cursor:nwse-resize;', n:'top:0;left:50%;cursor:ns-resize;',
      ne:'top:0;left:100%;cursor:nesw-resize;', e:'top:50%;left:100%;cursor:ew-resize;',
      se:'top:100%;left:100%;cursor:nwse-resize;', s:'top:100%;left:50%;cursor:ns-resize;',
      sw:'top:100%;left:0;cursor:nesw-resize;', w:'top:50%;left:0;cursor:ew-resize;'
    };
    return map[h]+c;
  }

  function rebuildWork(resetRect){
    const sw=loadedImg.naturalWidth, sh=loadedImg.naturalHeight;
    const swap=(cropState.rot===90||cropState.rot===270);
    const W=swap?sh:sw, H=swap?sw:sh;
    const c=document.createElement('canvas'); c.width=W; c.height=H;
    const cx=c.getContext('2d');
    cx.translate(W/2,H/2);
    cx.rotate(cropState.rot*Math.PI/180);
    cx.scale(cropState.flipH?-1:1, cropState.flipV?-1:1);
    cx.drawImage(loadedImg, -sw/2, -sh/2);
    cropState.work=c;

    const disp=document.getElementById('crop-canvas');
    disp.width=W; disp.height=H;
    disp.getContext('2d').drawImage(c,0,0);

    if(resetRect || !cropState.rect) setCropRect();
    positionBox(); updateDims();
  }

  function setCropRect(){
    const W=cropState.work.width, H=cropState.work.height;
    if(cropState.aspect>0){
      let w=W, h=W/cropState.aspect;
      if(h>H){ h=H; w=H*cropState.aspect; }
      cropState.rect={ x:(W-w)/2, y:(H-h)/2, w, h };
    } else {
      cropState.rect={ x:W*0.05, y:H*0.05, w:W*0.9, h:H*0.9 };
    }
  }

  function positionBox(){
    const box=document.getElementById('crop-box'); if(!box) return;
    const W=cropState.work.width, H=cropState.work.height, r=cropState.rect;
    box.style.left=(r.x/W*100)+'%'; box.style.top=(r.y/H*100)+'%';
    box.style.width=(r.w/W*100)+'%'; box.style.height=(r.h/H*100)+'%';
  }

  function updateDims(){
    const d=document.getElementById('crop-dims'); if(!d) return;
    const r=cropState.rect;
    d.textContent=`Crop: ${Math.round(r.w)} × ${Math.round(r.h)} px  ·  Canvas: ${cropState.work.width} × ${cropState.work.height} px`;
  }

  function initCropDrag(){
    const stage=document.getElementById('crop-stage');
    const box=document.getElementById('crop-box');
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

    function begin(mode, handle, e){
      e.preventDefault(); e.stopPropagation();
      const disp=document.getElementById('crop-canvas');
      const dispRect=disp.getBoundingClientRect();
      const scale=cropState.work.width/dispRect.width;
      const sx=(e.touches?e.touches[0].clientX:e.clientX);
      const sy=(e.touches?e.touches[0].clientY:e.clientY);
      const start={...cropState.rect};
      const W=cropState.work.width, H=cropState.work.height;
      const asp=cropState.aspect;

      function moveHandler(ev){
        const cx=(ev.touches?ev.touches[0].clientX:ev.clientX);
        const cy=(ev.touches?ev.touches[0].clientY:ev.clientY);
        const dx=(cx-sx)*scale, dy=(cy-sy)*scale;
        if(mode==='move'){
          cropState.rect={ x:clamp(start.x+dx,0,W-start.w), y:clamp(start.y+dy,0,H-start.h), w:start.w, h:start.h };
        } else {
          let left=start.x, top=start.y, right=start.x+start.w, bottom=start.y+start.h;
          if(handle.includes('e')) right=clamp(start.x+start.w+dx, start.x+20, W);
          if(handle.includes('w')) left =clamp(start.x+dx, 0, right-20);
          if(handle.includes('s')) bottom=clamp(start.y+start.h+dy, start.y+20, H);
          if(handle.includes('n')) top =clamp(start.y+dy, 0, bottom-20);
          let w=right-left, h=bottom-top;
          if(asp>0 && handle.length===2){ // corner: lock ratio off width
            h=w/asp;
            if(handle.includes('n')) top=bottom-h; else bottom=top+h;
            if(top<0){ top=0; h=bottom; w=h*asp; if(handle.includes('w')) left=right-w; }
            if(bottom>H){ bottom=H; h=bottom-top; w=h*asp; if(handle.includes('w')) left=right-w; }
            w=right-left;
          }
          cropState.rect={ x:left, y:top, w:Math.max(1,w), h:Math.max(1,h) };
        }
        positionBox(); updateDims(); ev.preventDefault();
      }
      function up(){
        window.removeEventListener('mousemove',moveHandler); window.removeEventListener('mouseup',up);
        window.removeEventListener('touchmove',moveHandler); window.removeEventListener('touchend',up);
      }
      window.addEventListener('mousemove',moveHandler); window.addEventListener('mouseup',up);
      window.addEventListener('touchmove',moveHandler,{passive:false}); window.addEventListener('touchend',up);
    }

    box.addEventListener('mousedown', e=>begin('move',null,e));
    box.addEventListener('touchstart', e=>begin('move',null,e), {passive:false});
    box.querySelectorAll('.crop-h').forEach(h=>{
      h.addEventListener('mousedown', e=>begin('resize',h.dataset.h,e));
      h.addEventListener('touchstart', e=>begin('resize',h.dataset.h,e), {passive:false});
    });
  }

  async function exportCrop(){
    const r=cropState.rect, work=cropState.work;
    const out=document.createElement('canvas');
    out.width=Math.max(1,Math.round(r.w)); out.height=Math.max(1,Math.round(r.h));
    const octx=out.getContext('2d');
    octx.imageSmoothingEnabled=true; octx.imageSmoothingQuality='high';
    octx.drawImage(work, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);

    const fmt=document.getElementById('crop-fmt').value;
    let targetKB=parseFloat(document.getElementById('crop-kb').value); if(!(targetKB>0)) targetKB=0;
    const extOf={'image/png':'png','image/jpeg':'jpg'};
    let blob, ext=extOf[fmt]||'png', info;

    if(targetKB>0){
      const r2=await encodeToTarget(out, fmt, targetKB*1024);
      blob=r2.blob;
      info=`${out.width}×${out.height}px · ${(blob.size/1024).toFixed(1)}KB`+(r2.hitLimit?` (couldn't reach ${targetKB}KB)`:` · target ${targetKB}KB`);
      if(r2.hitLimit) toast(`Couldn't reach ${targetKB}KB — saved smallest`,'warning');
    } else {
      blob=await canvasToBlob(out, fmt, fmt==='image/jpeg'?0.92:undefined);
      info=`${out.width}×${out.height}px · ${(blob.size/1024).toFixed(1)}KB`;
    }
    showResult(blob, 'cropped', ext, info);
    toast('Cropped ✓','success');
  }

  // ── Enhance Quality (AI upscale with resample+sharpen fallback) ──
  async function loadUpscaler(){
    if(AI.upscaler) return AI.upscaler;
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/+esm');
    const UpscalerMod = await import('https://cdn.jsdelivr.net/npm/upscaler@1.0.0-beta.19/+esm');
    const Upscaler = UpscalerMod.default || UpscalerMod;
    const modelMod = await import('https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-slim@1.0.0-beta.19/+esm');
    const model = modelMod.default || modelMod;
    AI.upscaler = new Upscaler({ model });
    return AI.upscaler;
  }

  function applySharpen(cx, w, h){
    const src=cx.getImageData(0,0,w,h);
    const dst=cx.createImageData(w,h);
    const k=[0,-1,0,-1,5,-1,0,-1,0];
    const s=src.data, d=dst.data;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        for(let c=0;c<3;c++){
          let sum=0, ki=0;
          for(let ky=-1;ky<=1;ky++){
            for(let kx=-1;kx<=1;kx++){
              const px=Math.min(w-1,Math.max(0,x+kx));
              const py=Math.min(h-1,Math.max(0,y+ky));
              sum+=s[(py*w+px)*4+c]*k[ki++];
            }
          }
          d[(y*w+x)*4+c]=Math.min(255,Math.max(0,sum));
        }
        d[(y*w+x)*4+3]=s[(y*w+x)*4+3];
      }
    }
    cx.putImageData(dst,0,0);
  }

  async function resampleSharpen(srcCanvas, factor){
    const w=Math.round(srcCanvas.width*factor), h=Math.round(srcCanvas.height*factor);
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const cx=c.getContext('2d');
    cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high';
    cx.drawImage(srcCanvas,0,0,w,h);
    if(w*h<=4000*4000) applySharpen(cx,w,h); // skip sharpen on huge images
    return await canvasToBlob(c,'image/png');
  }

  async function doEnhance(){
    if(!loadedFile){ toast('Load an image first','error'); return; }
    const factor=parseInt(document.getElementById('enh-scale').value)||2;
    const status=document.getElementById('enh-status');
    const btn=document.getElementById('btn-do-enhance');
    btn.disabled=true; status.style.display='block';

    let blob=null, method='AI super-resolution';
    try {
      status.textContent='Loading AI model (first run downloads it)…';
      const upscaler=await loadUpscaler();
      status.textContent='Enhancing…';
      const src=canvas.toDataURL('image/png');
      const result=await upscaler.upscale(src, { output:'base64' });
      const dataUrl=typeof result==='string' ? result : (result && result.src);
      const resp=await fetch(dataUrl);
      blob=await resp.blob();
    } catch(e){
      console.warn('AI upscaler unavailable, using resample fallback:', e);
      method='high-quality resampling';
    }

    try {
      if(!blob){ status.textContent='Enhancing (resampling)…'; blob=await resampleSharpen(canvas, factor); }
      const img=await blobToImage(blob);
      showResult(blob, 'enhanced', 'png', `${img.naturalWidth}×${img.naturalHeight}px · ${(blob.size/1024).toFixed(1)}KB · ${method}`);
      toast('Enhanced ✓','success');
    } catch(err){
      console.error(err); toast('Enhancement failed','error');
    } finally {
      btn.disabled=false; status.style.display='none';
    }
  }

  // ── Remove / Blur Background (AI segmentation via @imgly/background-removal) ──
  // NOTE: load from esm.sh — jsdelivr's "+esm" build mis-bundles the lodash
  // dependency and throws "(0 , p.memoize) is not a function".
  async function loadImgly(){
    if(!AI.imgly){
      try {
        AI.imgly = await import('https://esm.sh/@imgly/background-removal@1.5.5');
      } catch(e){
        // fallback to a newer pinned version if 1.5.5 is unavailable
        AI.imgly = await import('https://esm.sh/@imgly/background-removal@1.6.0');
      }
    }
    return AI.imgly;
  }

  async function doRemoveBg(){
    if(!loadedFile){ toast('Load an image first','error'); return; }
    const status=document.getElementById('bg-status');
    const btn=document.getElementById('btn-do-removebg');
    btn.disabled=true; status.style.display='block';
    status.textContent='Loading AI model & processing (first run downloads the model)…';
    try {
      const { removeBackground } = await loadImgly();
      const blob = await removeBackground(loadedFile);
      bgFg = await blobToImage(blob);
      showRemoveBgResult();
      toast('Background removed ✓','success');
    } catch(err){
      console.error(err);
      toast('Background removal failed: '+(err.message||err),'error');
    } finally {
      btn.disabled=false; status.style.display='none';
    }
  }

  // Composite the cached cutout over a solid color ('transparent' = none)
  function compositeBg(color){
    const out=document.createElement('canvas');
    out.width=bgFg.naturalWidth; out.height=bgFg.naturalHeight;
    const octx=out.getContext('2d');
    if(color && color!=='transparent'){ octx.fillStyle=color; octx.fillRect(0,0,out.width,out.height); }
    octx.drawImage(bgFg,0,0);
    return out;
  }

  // Result card for Remove BG: live background-color swatches + rename + download
  function showRemoveBgResult(){
    const presets=[
      {label:'Transparent', val:'transparent'},
      {label:'White',  val:'#ffffff'},
      {label:'Passport blue', val:'#2563eb'},
      {label:'Sky',    val:'#bfdbfe'},
      {label:'Red',    val:'#dc2626'},
      {label:'Gray',   val:'#9ca3af'},
      {label:'Black',  val:'#000000'},
    ];
    let currentBg='transparent';
    const baseName=(loadedFile && loadedFile.name ? loadedFile.name.replace(/\.[^.]+$/,'') : 'image')+'_nobg';

    const res=document.getElementById('img-result');
    res.innerHTML=`
      <div class="card" style="margin-top:18px">
        <h3 style="font-family:var(--font-display);margin-bottom:14px">Background removed</h3>
        <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">
          <img id="rbg-preview" style="max-width:200px;width:100%;max-height:220px;object-fit:contain;border-radius:8px;border:1px solid var(--border);background:repeating-conic-gradient(#eef2f7 0% 25%,#fff 0% 50%) 50%/16px 16px"/>
          <div style="flex:1;min-width:240px">
            <label class="form-label">Background</label>
            <div id="rbg-swatches" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
              ${presets.map(p=>`<button class="rbg-sw" data-c="${p.val}" title="${p.label}" style="width:30px;height:30px;border-radius:6px;cursor:pointer;border:2px solid var(--border-2);${p.val==='transparent'?'background:repeating-conic-gradient(#e2e8f0 0% 25%,#fff 0% 50%) 50%/9px 9px':'background:'+p.val}"></button>`).join('')}
              <label title="Custom color" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:1px dashed var(--border-2);border-radius:6px;cursor:pointer">
                <input type="color" id="rbg-custom" value="#22c55e" style="width:26px;height:26px;border:none;background:none;padding:0;cursor:pointer"/>
              </label>
            </div>
            <div id="rbg-info" style="font-size:.78rem;color:var(--text-3);margin:10px 0 14px"></div>
            <div class="form-group" style="margin-bottom:14px">
              <label class="form-label">File name</label>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <input id="rbg-name" class="form-input" value="${esc(baseName)}" style="flex:1;min-width:180px"/>
                <span style="font-size:.85rem;color:var(--text-3)">.png</span>
              </div>
            </div>
            <button class="btn btn-primary" id="rbg-download">⬇ Download</button>
          </div>
        </div>
      </div>`;

    async function update(color){
      currentBg=color;
      const out=compositeBg(color);
      const blob=await canvasToBlob(out,'image/png');
      lastBlob=blob; lastExt='png';
      const prev=document.getElementById('rbg-preview');
      prev.src=URL.createObjectURL(blob);
      prev.style.background = color==='transparent'
        ? 'repeating-conic-gradient(#eef2f7 0% 25%,#fff 0% 50%) 50%/16px 16px' : color;
      document.getElementById('rbg-info').textContent=`${out.width}×${out.height}px · ${(blob.size/1024).toFixed(1)}KB · ${color==='transparent'?'transparent':color} background`;
      res.querySelectorAll('.rbg-sw').forEach(s=>s.style.borderColor = s.dataset.c===color ? 'var(--primary)' : 'var(--border-2)');
    }

    res.querySelectorAll('.rbg-sw').forEach(sw=>sw.addEventListener('click',()=>update(sw.dataset.c)));
    document.getElementById('rbg-custom').addEventListener('input', e=>update(e.target.value));
    document.getElementById('rbg-download').addEventListener('click',()=>{
      let name=(document.getElementById('rbg-name').value||'image').trim().replace(/[\/\\:*?"<>|]/g,'_');
      if(!name) name='image';
      const a=document.createElement('a');
      a.href=URL.createObjectURL(lastBlob);
      a.download=`${name}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('Downloaded ✓','success');
    });

    update('transparent');
  }

  async function doBlurBg(){
    if(!loadedFile){ toast('Load an image first','error'); return; }
    const radius=parseInt(document.getElementById('blur-amount').value)||12;
    const status=document.getElementById('blur-status');
    const btn=document.getElementById('btn-do-blurbg');
    btn.disabled=true; status.style.display='block';
    status.textContent='Loading AI model & detecting subject…';
    try {
      const { removeBackground } = await loadImgly();
      const fgBlob = await removeBackground(loadedFile); // subject on transparent bg
      const fgImg = await blobToImage(fgBlob);

      const out=document.createElement('canvas');
      out.width=canvas.width; out.height=canvas.height;
      const octx=out.getContext('2d');
      // Blurred full image as the background
      octx.filter=`blur(${radius}px)`;
      octx.drawImage(canvas,0,0);
      octx.filter='none';
      // Sharp subject on top
      octx.drawImage(fgImg,0,0,out.width,out.height);

      const blob=await canvasToBlob(out,'image/png');
      showResult(blob, 'blurbg', 'png', `${(blob.size/1024).toFixed(1)}KB · background blurred ${radius}px`);
      toast('Background blurred ✓','success');
    } catch(err){
      console.error(err);
      toast('Blur background failed: '+(err.message||err),'error');
    } finally {
      btn.disabled=false; status.style.display='none';
    }
  }

  // Show a preview + rename field + download button for the generated output
  function showResult(blob, op, ext, info){
    lastBlob=blob; lastExt=ext;
    const url=URL.createObjectURL(blob);
    const baseName=(loadedFile && loadedFile.name ? loadedFile.name.replace(/\.[^.]+$/,'') : 'image') + `_${op}`;

    const res=document.getElementById('img-result');
    res.innerHTML=`
      <div class="card" style="margin-top:18px">
        <h3 style="font-family:var(--font-display);margin-bottom:14px">Output ready</h3>
        <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">
          <img src="${url}" style="max-width:160px;width:100%;max-height:160px;object-fit:contain;border-radius:8px;border:1px solid var(--border);background:repeating-conic-gradient(#eef2f7 0% 25%, #ffffff 0% 50%) 50%/16px 16px"/>
          <div style="flex:1;min-width:240px">
            <div style="font-size:.8rem;color:var(--text-3);margin-bottom:14px">${esc(info)}</div>
            <div class="form-group" style="margin-bottom:14px">
              <label class="form-label">File name</label>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <input id="result-name" class="form-input" value="${esc(baseName)}" style="flex:1;min-width:180px"/>
                <span style="font-size:.85rem;color:var(--text-3);white-space:nowrap">.${ext}</span>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-download-result">⬇ Download</button>
          </div>
        </div>
      </div>`;

    document.getElementById('btn-download-result').addEventListener('click',()=>{
      let name=(document.getElementById('result-name').value||'image').trim().replace(/[\/\\:*?"<>|]/g,'_');
      if(!name) name='image';
      const a=document.createElement('a');
      a.href=URL.createObjectURL(lastBlob);
      a.download=`${name}.${lastExt}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('Downloaded ✓','success');
    });
  }

  render();
})();
