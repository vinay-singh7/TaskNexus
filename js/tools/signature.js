/* ============================================================
   TASKNEXUS — SIGNATURE MAKER (Text-to-Signature + Draw)
   ============================================================ */
(function(){
  const el = document.getElementById('panel-signature');
  if(!el) return;

  let sigMode = 'text'; // 'text' | 'draw'
  const SIG_FONTS = [
    'Dancing Script','Great Vibes','Pacifico','Satisfy','Sacramento','Allura',
    'Alex Brush','Yellowtail','Kaushan Script','Parisienne','Cookie','Caveat',
    'Shadows Into Light','Marck Script','Homemade Apple','Mr Dafoe','Pinyon Script',
    'Tangerine','Italianno','Niconne'
  ];
  const sig = { text:'Signature', size:44, color:'#1e3a8a', bg:'transparent', rotations:{}, visible:8, outW:0, outH:0, targetKB:0 };

  function ensureSigFonts(){
    if(document.getElementById('sig-fonts-link')) return;
    const families = SIG_FONTS.map(f=>'family='+f.replace(/ /g,'+')).join('&');
    const link=document.createElement('link');
    link.id='sig-fonts-link'; link.rel='stylesheet';
    link.href=`https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }

  // ── Small local helpers (kept self-contained) ──
  function canvasToBlob(cnv, fmt, q){ return new Promise(res=>cnv.toBlob(b=>res(b), fmt, q)); }

  async function encodeToTarget(srcCanvas, fmt, targetBytes){
    let work = srcCanvas;
    for(let attempt=0; attempt<10; attempt++){
      const minBlob = await canvasToBlob(work, fmt, 0.05);
      if(minBlob.size > targetBytes && work.width > 16 && work.height > 16){
        const scaled=document.createElement('canvas');
        scaled.width  = Math.max(1, Math.round(work.width  * 0.85));
        scaled.height = Math.max(1, Math.round(work.height * 0.85));
        scaled.getContext('2d').drawImage(work,0,0,scaled.width,scaled.height);
        work = scaled; continue;
      }
      if(minBlob.size > targetBytes) return { blob:minBlob, hitLimit:true };
      let lo=0.05, hi=1.0, best=minBlob;
      for(let i=0;i<8;i++){ const mid=(lo+hi)/2; const b=await canvasToBlob(work, fmt, mid); if(b.size<=targetBytes){ best=b; lo=mid; } else { hi=mid; } }
      return { blob:best, hitLimit:false };
    }
    return { blob: await canvasToBlob(work, fmt, 0.05), hitLimit:true };
  }

  function paperCss(bg){
    if(bg==='white') return 'background:#fff';
    if(bg==='lined') return 'background:#fff;background-image:repeating-linear-gradient(#fff 0 26px,#bcd4f6 26px 27px)';
    if(bg==='grid')  return 'background:#fff;background-image:linear-gradient(#e3eaf5 1px,transparent 1px),linear-gradient(90deg,#e3eaf5 1px,transparent 1px);background-size:22px 22px';
    return 'background:repeating-conic-gradient(#eef2f7 0% 25%,#fff 0% 50%) 50%/16px 16px';
  }
  function drawPaper(cx, W, H, bg){
    if(bg==='transparent') return;
    cx.save();
    cx.fillStyle='#fff'; cx.fillRect(0,0,W,H);
    if(bg==='lined'){ cx.strokeStyle='#bcd4f6'; cx.lineWidth=1; for(let y=26;y<H;y+=27){ cx.beginPath(); cx.moveTo(0,y+0.5); cx.lineTo(W,y+0.5); cx.stroke(); } }
    if(bg==='grid'){ cx.strokeStyle='#e3eaf5'; cx.lineWidth=1;
      for(let x=22;x<W;x+=22){ cx.beginPath(); cx.moveTo(x+0.5,0); cx.lineTo(x+0.5,H); cx.stroke(); }
      for(let y=22;y<H;y+=22){ cx.beginPath(); cx.moveTo(0,y+0.5); cx.lineTo(W,y+0.5); cx.stroke(); } }
    cx.restore();
  }

  function sigFileBase(){ return (sig.text||'signature').trim().replace(/[\/\\:*?"<>|]/g,'_').replace(/\s+/g,'_') || 'signature'; }

  function render(){
    ensureSigFonts();
    el.innerHTML=`
      <div class="panel-header"><h1 class="panel-title">Signature Maker</h1><p class="panel-desc">Generate a handwritten-style signature from your name, or draw your own.</p></div>
      <div class="card" style="padding-bottom:18px">
        <div class="tabs" style="margin-bottom:18px;flex-wrap:wrap">
          <button class="tab-btn${sigMode==='text'?' active':''}" data-sig="text">✍ Text to Signature</button>
          <button class="tab-btn${sigMode==='draw'?' active':''}" data-sig="draw">🖊 Draw Signature</button>
        </div>
        <div id="sig-mode-body"></div>
      </div>
      <div id="sig-result"></div>`;
    el.querySelectorAll('.tab-btn[data-sig]').forEach(b=>b.addEventListener('click',()=>{ sigMode=b.dataset.sig; render(); }));
    if(sigMode==='text') renderSigText(); else renderSigDraw();
  }

  // Build a high-res canvas of the typed signature in a given font
  async function buildSigCanvas(font){
    const text=sig.text||'Signature';
    const px=sig.size;
    const deg=sig.rotations[font]||0;
    try { await document.fonts.load(`${px}px "${font}"`, text); } catch(e){}
    const SC=3;
    const meas=document.createElement('canvas').getContext('2d');
    meas.font=`${px}px "${font}"`;
    const tw=meas.measureText(text).width;
    const W=sig.outW>0 ? sig.outW : Math.ceil(tw + px*1.4);
    const H=sig.outH>0 ? sig.outH : Math.ceil(px*2.4);
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(W*SC)); c.height=Math.max(1,Math.round(H*SC));
    const cx=c.getContext('2d');
    cx.scale(SC,SC);
    drawPaper(cx,W,H,sig.bg);
    cx.translate(W/2,H/2);
    cx.rotate(deg*Math.PI/180);
    cx.fillStyle=sig.color;
    cx.font=`${px}px "${font}"`;
    cx.textAlign='center'; cx.textBaseline='middle';
    cx.fillText(text,0,0);
    return c;
  }

  async function downloadSig(font){
    const c=await buildSigCanvas(font);
    let blob, ext='png';
    if(sig.targetKB>0){
      const fmt=sig.bg==='transparent' ? 'image/png' : 'image/jpeg';
      ext=fmt==='image/png'?'png':'jpg';
      const r=await encodeToTarget(c, fmt, sig.targetKB*1024);
      blob=r.blob;
      if(r.hitLimit) toast(`Couldn't get under ${sig.targetKB}KB — saved smallest (${(blob.size/1024).toFixed(1)}KB)`,'warning');
    } else {
      blob=await canvasToBlob(c,'image/png');
    }
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${sigFileBase()}_${font.replace(/\s+/g,'')}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast(`Downloaded (${(blob.size/1024).toFixed(1)}KB) ✓`,'success');
  }

  function renderSigText(){
    const host=document.getElementById('sig-mode-body');
    host.innerHTML=`
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px">
        <div class="form-group" style="margin:0;flex:2;min-width:200px">
          <label class="form-label">Your name / text</label>
          <input id="sigt-text" class="form-input" value="${esc(sig.text)}" placeholder="Type your name"/>
        </div>
        <div class="form-group" style="margin:0;width:120px">
          <label class="form-label">Size: <span id="sigt-size-val">${sig.size}</span>px</label>
          <input id="sigt-size" type="range" min="20" max="90" value="${sig.size}" style="width:100%;accent-color:var(--primary)"/>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Color</label>
          <input id="sigt-color" type="color" value="${sig.color}" style="width:48px;height:38px;padding:2px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);cursor:pointer"/>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Background</label>
          <select id="sigt-bg" class="form-select">
            <option value="transparent">Transparent</option>
            <option value="white">Blank paper</option>
            <option value="lined">Lined paper</option>
            <option value="grid">Grid paper</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:18px">
        <div class="form-group" style="margin:0;width:110px"><label class="form-label">Width (px)</label><input id="sigt-w" type="number" class="form-input" placeholder="auto" min="1" value="${sig.outW||''}"/></div>
        <div class="form-group" style="margin:0;width:110px"><label class="form-label">Height (px)</label><input id="sigt-h" type="number" class="form-input" placeholder="auto" min="1" value="${sig.outH||''}"/></div>
        <div class="form-group" style="margin:0;width:140px"><label class="form-label">Max size (KB)</label><input id="sigt-kb" type="number" class="form-input" placeholder="e.g. 15" min="1" value="${sig.targetKB||''}"/></div>
      </div>
      <div id="sigt-grid" class="sig-grid"></div>
      <div style="text-align:center;margin-top:18px">
        <button class="btn btn-secondary" id="sigt-more">↻ Load More Signatures</button>
      </div>

      <style>
        .sig-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
        .sig-card{ border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; background:var(--surface); display:flex; flex-direction:column; }
        .sig-card-top{ display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-bottom:1px solid var(--border); gap:8px; }
        .sig-rotate{ display:flex; align-items:center; gap:4px; }
        .sig-rotate button{ width:24px; height:22px; border:1px solid var(--border); background:var(--surface); border-radius:4px; cursor:pointer; color:var(--text-3); font-size:.8rem; line-height:1; }
        .sig-rotate button:hover{ background:var(--surface-3); color:var(--text); }
        .sig-deg{ font-size:.72rem; color:var(--text-3); min-width:30px; text-align:center; }
        .sig-fontname{ font-size:.68rem; color:var(--text-4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sig-preview{ min-height:120px; display:flex; align-items:center; justify-content:center; padding:14px; overflow:hidden; }
        .sig-preview span{ display:inline-block; line-height:1.2; max-width:100%; word-break:break-word; text-align:center; }
        .sig-card-bottom{ display:flex; justify-content:flex-end; padding:8px; border-top:1px solid var(--border); }
      </style>`;

    const refresh=()=>renderSigGrid();
    document.getElementById('sigt-text').addEventListener('input', e=>{ sig.text=e.target.value; refresh(); });
    document.getElementById('sigt-size').addEventListener('input', e=>{ sig.size=parseInt(e.target.value); document.getElementById('sigt-size-val').textContent=sig.size; refresh(); });
    document.getElementById('sigt-color').addEventListener('input', e=>{ sig.color=e.target.value; refresh(); });
    document.getElementById('sigt-bg').value=sig.bg;
    document.getElementById('sigt-bg').addEventListener('change', e=>{ sig.bg=e.target.value; refresh(); });
    document.getElementById('sigt-w').addEventListener('input', e=>{ sig.outW=parseInt(e.target.value)||0; });
    document.getElementById('sigt-h').addEventListener('input', e=>{ sig.outH=parseInt(e.target.value)||0; });
    document.getElementById('sigt-kb').addEventListener('input', e=>{ sig.targetKB=parseFloat(e.target.value)||0; });
    document.getElementById('sigt-more').addEventListener('click', ()=>{ sig.visible=Math.min(SIG_FONTS.length, sig.visible+8); renderSigGrid(); });

    renderSigGrid();
  }

  function renderSigGrid(){
    const grid=document.getElementById('sigt-grid');
    if(!grid) return;
    const fonts=SIG_FONTS.slice(0, sig.visible);
    const text=sig.text||'Your name';
    grid.innerHTML=fonts.map(font=>{
      const deg=sig.rotations[font]||0;
      return `<div class="sig-card">
        <div class="sig-card-top">
          <div class="sig-rotate">
            <button data-rot="${esc(font)}" data-dir="-1" title="Rotate left">↺</button>
            <span class="sig-deg">${deg}°</span>
            <button data-rot="${esc(font)}" data-dir="1" title="Rotate right">↻</button>
          </div>
          <span class="sig-fontname">${esc(font)}</span>
        </div>
        <div class="sig-preview" style="${paperCss(sig.bg)}">
          <span style="font-family:'${esc(font)}',cursive;font-size:${sig.size}px;color:${esc(sig.color)};transform:rotate(${deg}deg)">${esc(text)}</span>
        </div>
        <div class="sig-card-bottom">
          <button class="btn btn-secondary btn-sm" data-dl="${esc(font)}">⬇ Download</button>
        </div>
      </div>`;
    }).join('');

    document.getElementById('sigt-more').style.display = sig.visible>=SIG_FONTS.length ? 'none' : '';

    grid.querySelectorAll('[data-rot]').forEach(btn=>btn.addEventListener('click',()=>{
      const f=btn.dataset.rot; const dir=parseInt(btn.dataset.dir);
      sig.rotations[f]=(((sig.rotations[f]||0)+dir*5)+360)%360;
      const card=btn.closest('.sig-card');
      card.querySelector('.sig-preview span').style.transform=`rotate(${sig.rotations[f]}deg)`;
      card.querySelector('.sig-deg').textContent=`${sig.rotations[f]}°`;
    }));
    grid.querySelectorAll('[data-dl]').forEach(btn=>btn.addEventListener('click',()=>downloadSig(btn.dataset.dl)));
  }

  function renderSigDraw(){
    const host=document.getElementById('sig-mode-body');
    host.innerHTML=`
      <p style="font-size:.85rem;color:var(--text-3);margin-bottom:14px">Draw your signature with a mouse, trackpad, or finger, then save it.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Pen color</label>
          <input id="sig-color" type="color" value="${sig.color}" style="width:48px;height:38px;padding:2px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);cursor:pointer"/>
        </div>
        <div class="form-group" style="margin:0;flex:1;min-width:140px">
          <label class="form-label">Pen size: <span id="sig-size-val">3</span>px</label>
          <input id="sig-size" type="range" min="1" max="14" value="3" style="width:100%;accent-color:var(--primary)"/>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Background</label>
          <select id="sig-bg" class="form-select">
            <option value="transparent">Transparent</option>
            <option value="white">Blank paper</option>
            <option value="lined">Lined paper</option>
            <option value="grid">Grid paper</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;width:130px">
          <label class="form-label">Max size (KB)</label>
          <input id="sig-kb" type="number" class="form-input" placeholder="e.g. 15" min="1"/>
        </div>
      </div>
      <canvas id="sig-canvas" width="640" height="240" style="width:100%;height:auto;border:1px solid var(--border-2);border-radius:var(--radius-md);touch-action:none;cursor:crosshair"></canvas>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn-secondary" id="sig-clear">Clear</button>
        <button class="btn btn-primary" id="sig-save">Save Signature</button>
      </div>`;

    const cv=document.getElementById('sig-canvas');
    const cx=cv.getContext('2d');
    let bg='transparent';

    function paint(){
      drawPaper(cx, cv.width, cv.height, bg);
      cv.style.background = bg==='transparent'
        ? 'repeating-conic-gradient(#eef2f7 0% 25%,#fff 0% 50%) 50%/18px 18px'
        : '#fff';
    }
    function clearPad(){ cx.clearRect(0,0,cv.width,cv.height); paint(); }
    paint();

    document.getElementById('sig-size').addEventListener('input', e=>document.getElementById('sig-size-val').textContent=e.target.value);
    document.getElementById('sig-bg').addEventListener('change', e=>{ bg=e.target.value; clearPad(); });
    document.getElementById('sig-clear').addEventListener('click', clearPad);

    let drawing=false, last=null;
    const pos=e=>{
      const r=cv.getBoundingClientRect();
      const cxp=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
      const cyp=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
      return { x: cxp*(cv.width/r.width), y: cyp*(cv.height/r.height) };
    };
    const start=e=>{ drawing=true; last=pos(e); e.preventDefault(); };
    const move=e=>{
      if(!drawing) return;
      const p=pos(e);
      cx.strokeStyle=document.getElementById('sig-color').value;
      cx.lineWidth=parseInt(document.getElementById('sig-size').value)||3;
      cx.lineCap='round'; cx.lineJoin='round';
      cx.beginPath(); cx.moveTo(last.x,last.y); cx.lineTo(p.x,p.y); cx.stroke();
      last=p; e.preventDefault();
    };
    const end=()=>{ drawing=false; };
    cv.addEventListener('mousedown',start); cv.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
    cv.addEventListener('touchstart',start,{passive:false}); cv.addEventListener('touchmove',move,{passive:false}); cv.addEventListener('touchend',end);

    document.getElementById('sig-save').addEventListener('click', async ()=>{
      const targetKB=parseFloat(document.getElementById('sig-kb').value)||0;
      let blob, ext='png';
      if(targetKB>0){
        const fmt=bg==='transparent' ? 'image/png' : 'image/jpeg';
        ext=fmt==='image/png'?'png':'jpg';
        const r=await encodeToTarget(cv, fmt, targetKB*1024);
        blob=r.blob;
        if(r.hitLimit) toast(`Couldn't get under ${targetKB}KB — saved smallest`,'warning');
      } else {
        blob=await canvasToBlob(cv,'image/png');
      }
      showResult(blob, sigFileBase()+'_signature', ext, `${cv.width}×${cv.height}px · ${(blob.size/1024).toFixed(1)}KB`);
      toast('Signature ready ✓','success');
    });
  }

  // Rename + download card for the drawn signature
  function showResult(blob, baseName, ext, info){
    const url=URL.createObjectURL(blob);
    const res=document.getElementById('sig-result');
    res.innerHTML=`
      <div class="card" style="margin-top:18px">
        <h3 style="font-family:var(--font-display);margin-bottom:14px">Output ready</h3>
        <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">
          <img src="${url}" style="max-width:200px;width:100%;max-height:160px;object-fit:contain;border-radius:8px;border:1px solid var(--border);background:repeating-conic-gradient(#eef2f7 0% 25%,#fff 0% 50%) 50%/16px 16px"/>
          <div style="flex:1;min-width:240px">
            <div style="font-size:.8rem;color:var(--text-3);margin-bottom:14px">${esc(info)}</div>
            <div class="form-group" style="margin-bottom:14px">
              <label class="form-label">File name</label>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <input id="sig-result-name" class="form-input" value="${esc(baseName)}" style="flex:1;min-width:180px"/>
                <span style="font-size:.85rem;color:var(--text-3)">.${ext}</span>
              </div>
            </div>
            <button class="btn btn-primary" id="sig-result-dl">⬇ Download</button>
          </div>
        </div>
      </div>`;
    document.getElementById('sig-result-dl').addEventListener('click',()=>{
      let name=(document.getElementById('sig-result-name').value||'signature').trim().replace(/[\/\\:*?"<>|]/g,'_');
      if(!name) name='signature';
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${name}.${ext}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('Downloaded ✓','success');
    });
  }

  render();
})();
