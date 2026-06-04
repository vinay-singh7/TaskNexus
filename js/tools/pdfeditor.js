/* ============================================================
   TASKNEXUS — PDF EDITOR
   Overlay editing: add/edit text, images, freehand sign, shapes,
   highlight, whiteout. Existing text is detected and made editable
   (cover original + matched overlay). Flatten & download via pdf-lib.
   ============================================================ */
(function(){
  const el = document.getElementById('panel-pdfeditor');
  if(!el) return;

  let srcBytes = null;
  let fileName = 'document.pdf';
  let pages = [];               // [{ canvas, canvasW, canvasH, ptW, ptH, textItems }]
  let elements = [];
  let tool = 'select';
  let selectedId = null;
  let zoom = 1;
  let history = [];
  let uidc = 0;
  const newId = () => 'e' + (++uidc);

  const DEFAULTS = { textColor:'#111111', shapeBorder:'#e11d48', highlight:'#ffeb3b', drawColor:'#1e3a8a', drawWidth:3 };

  function hexToRgb(hex){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex||'#000000');
    return m ? { r:parseInt(m[1],16)/255, g:parseInt(m[2],16)/255, b:parseInt(m[3],16)/255 } : { r:0,g:0,b:0 };
  }
  function toHex(r,g,b){ return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''); }

  const TOOLS = [
    { id:'select',   label:'▘ Select' },
    { id:'text',     label:'T Text' },
    { id:'draw',     label:'✎ Sign' },
    { id:'image',    label:'🖼 Image' },
    { id:'rect',     label:'▭ Rectangle' },
    { id:'ellipse',  label:'◯ Ellipse' },
    { id:'highlight',label:'▥ Highlight' },
    { id:'whiteout', label:'⬜ Whiteout' },
  ];

  function renderShell(){
    el.innerHTML = `
      <div class="panel-header"><h1 class="panel-title">PDF Editor</h1><p class="panel-desc">Edit existing text, add new text, images, signatures, shapes, highlights and whiteout — then download. Everything stays on your device.</p></div>

      <div class="card" id="pe-uploadcard">
        <input type="file" id="pe-input" class="form-input" accept="application/pdf" style="margin-bottom:10px"/>
        <p style="font-size:.8rem;color:var(--text-3)">Tip: with the <b>Text</b> tool, click existing text to edit it (it's matched for size/color/style). Not supported: Links, Forms, and adding/removing/rotating pages.</p>
      </div>

      <div id="pe-editor" style="display:none">
        <div class="pe-toolbar" id="pe-toolbar">
          ${TOOLS.map(t=>`<button class="pe-tool${t.id==='select'?' active':''}" data-tool="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div class="pe-toolbar pe-actions">
          <button class="pe-tool" id="pe-undo" title="Undo">⤺ Undo</button>
          <span class="pe-zoom"><button id="pe-zout" title="Zoom out">−</button><span id="pe-zlabel">100%</span><button id="pe-zin" title="Zoom in">+</button></span>
          <span class="pe-sep"></span>
          <button class="btn btn-secondary btn-sm" id="pe-newfile">New file</button>
          <button class="btn btn-primary btn-sm" id="pe-apply">⬇ Apply &amp; Download</button>
        </div>
        <div class="pe-props" id="pe-props"></div>
        <div id="pe-stage" class="pe-stage"></div>
        <div id="pe-result"></div>
      </div>

      <input type="file" id="pe-imginput" accept="image/png,image/jpeg" style="display:none"/>

      <style>
        .pe-toolbar{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-md); padding:8px; margin-bottom:10px; }
        .pe-toolbar.pe-actions{ position:sticky; top:0; z-index:6; }
        .pe-tool{ padding:7px 11px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); border-radius:var(--radius-sm); cursor:pointer; font-size:.8rem; font-weight:600; white-space:nowrap; }
        .pe-tool:hover{ background:var(--surface-3); }
        .pe-tool.active{ background:var(--primary); color:#fff; border-color:var(--primary); }
        .pe-tool:disabled{ opacity:.4; cursor:not-allowed; }
        .pe-sep{ flex:1; }
        .pe-zoom{ display:inline-flex; align-items:center; gap:4px; }
        .pe-zoom button{ width:30px; height:30px; border:1px solid var(--border); background:var(--surface); border-radius:var(--radius-sm); cursor:pointer; font-size:1rem; line-height:1; }
        .pe-zoom button:hover{ background:var(--surface-3); }
        .pe-zoom span{ font-size:.78rem; color:var(--text-3); min-width:42px; text-align:center; }
        .pe-props{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:10px; }
        .pe-props:empty{ display:none; }
        .pe-props .pe-pgrp{ display:flex; align-items:center; gap:6px; font-size:.78rem; color:var(--text-3); background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:5px 8px; }
        .pe-props input[type=color]{ width:30px; height:26px; padding:1px; border:1px solid var(--border); border-radius:4px; background:var(--surface); cursor:pointer; }
        .pe-props input[type=number]{ width:58px; }
        .pe-toggle{ width:30px; height:26px; border:1px solid var(--border); background:var(--surface); border-radius:4px; cursor:pointer; font-weight:800; }
        .pe-toggle.on{ background:var(--primary); color:#fff; border-color:var(--primary); }
        .pe-stage{ max-height:68vh; overflow:auto; background:var(--surface-3); border-radius:var(--radius-md); padding:16px; }
        .pe-stage-inner{ display:flex; flex-direction:column; align-items:center; gap:16px; width:max-content; min-width:100%; margin:0 auto; }
        .pe-page{ position:relative; box-shadow:var(--shadow-lg); background:#fff; flex:0 0 auto; }
        .pe-page canvas{ display:block; }
        .pe-overlay{ position:absolute; inset:0; }
        .pe-el{ position:absolute; box-sizing:border-box; }
        .pe-el.selected{ outline:1.5px dashed var(--primary); outline-offset:1px; }
        .pe-el[data-type="text"]{ cursor:move; padding:0 1px; white-space:pre; line-height:1; min-width:6px; }
        .pe-el[data-type="text"][contenteditable=true]{ cursor:text; outline:1.5px solid var(--primary); background:rgba(255,255,255,.65); }
        .pe-handle{ position:absolute; width:12px; height:12px; background:#fff; border:1.5px solid var(--primary); border-radius:2px; }
        .pe-handle.nw{ left:-6px; top:-6px; cursor:nwse-resize; } .pe-handle.ne{ right:-6px; top:-6px; cursor:nesw-resize; }
        .pe-handle.sw{ left:-6px; bottom:-6px; cursor:nesw-resize; } .pe-handle.se{ right:-6px; bottom:-6px; cursor:nwse-resize; }
        .pe-del{ position:absolute; top:-26px; right:-8px; width:22px; height:22px; border-radius:50%; background:var(--danger); color:#fff; border:none; cursor:pointer; font-size:.8rem; line-height:1; display:flex; align-items:center; justify-content:center; z-index:4; box-shadow:var(--shadow-md); }
        /* UI-only outlines over editable existing text (never exported) */
        .pe-hint{ position:absolute; border:1px dashed rgba(79,70,229,.55); background:rgba(79,70,229,.06); border-radius:2px; cursor:text; }
        .pe-hint:hover{ background:rgba(79,70,229,.18); border-color:var(--primary); }
        @media (max-width:600px){
          .pe-tool{ padding:6px 8px; font-size:.74rem; }
          .pe-stage{ max-height:60vh; padding:10px; }
        }
      </style>`;

    document.getElementById('pe-input').addEventListener('change', e=>{ if(e.target.files[0]) loadPdf(e.target.files[0]); });
    document.getElementById('pe-imginput').addEventListener('change', onImageChosen);
    document.getElementById('pe-newfile').addEventListener('click', ()=>{ renderShell(); });
    document.getElementById('pe-apply').addEventListener('click', applyAndDownload);
    document.getElementById('pe-undo').addEventListener('click', undo);
    document.getElementById('pe-zin').addEventListener('click', ()=>setZoom(zoom+0.2));
    document.getElementById('pe-zout').addEventListener('click', ()=>setZoom(zoom-0.2));
    el.querySelectorAll('.pe-tool[data-tool]').forEach(b=>b.addEventListener('click', ()=>setTool(b.dataset.tool)));
    updateUndoBtn();
  }

  function setZoom(z){
    zoom = Math.min(3, Math.max(0.4, Math.round(z*10)/10));
    const inner = document.querySelector('.pe-stage-inner');
    if(inner) inner.style.zoom = zoom;
    const lbl = document.getElementById('pe-zlabel'); if(lbl) lbl.textContent = Math.round(zoom*100)+'%';
  }

  function setTool(t){
    tool = t;
    el.querySelectorAll('.pe-tool[data-tool]').forEach(b=>b.classList.toggle('active', b.dataset.tool===t));
    if(t!=='select') selectedId=null;
    if(t==='image'){ document.getElementById('pe-imginput').click(); }
    renderProps(); renderElements(); // re-render so editable-text hints show/hide with the tool
  }

  // ---- history / undo ----
  function pushHistory(){ history.push(JSON.stringify(elements)); if(history.length>60) history.shift(); updateUndoBtn(); }
  function undo(){ if(!history.length) return; elements = JSON.parse(history.pop()); selectedId=null; renderElements(); renderProps(); updateUndoBtn(); }
  function updateUndoBtn(){ const b=document.getElementById('pe-undo'); if(b) b.disabled = history.length===0; }

  async function loadPdf(file){
    srcBytes = await file.arrayBuffer();
    fileName = file.name;
    elements = []; selectedId = null; pages = []; history = []; zoom = 1;
    document.getElementById('pe-uploadcard').style.display = 'none';
    document.getElementById('pe-editor').style.display = 'block';
    document.getElementById('pe-result').innerHTML = '';
    await renderPages();
    setZoom(1); updateUndoBtn();
    toast('PDF loaded — Text tool: click existing text to edit it','success');
  }

  async function renderPages(){
    const pdfjsLib = window.pdfjsLib;
    if(!pdfjsLib){ toast('PDF renderer not loaded','error'); return; }
    if(!pdfjsLib.GlobalWorkerOptions.workerSrc){
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const stage = document.getElementById('pe-stage');
    stage.innerHTML = '<div style="color:var(--text-3);font-size:.85rem;padding:20px">Rendering pages…</div>';

    const doc = await pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
    const avail = Math.max(280, stage.clientWidth - 32);
    const metas = [];
    let maxPtW = 0;
    for(let i=1;i<=doc.numPages;i++){
      const p = await doc.getPage(i);
      const vp1 = p.getViewport({ scale:1 });
      metas.push({ p, ptW:vp1.width, ptH:vp1.height });
      if(vp1.width>maxPtW) maxPtW=vp1.width;
    }
    const scale = Math.min(2.5, Math.max(0.5, avail / maxPtW));

    const inner = document.createElement('div');
    inner.className = 'pe-stage-inner';
    pages = [];
    for(let i=0;i<metas.length;i++){
      const { p, ptW, ptH } = metas[i];
      const vp = p.getViewport({ scale });
      const wrap = document.createElement('div');
      wrap.className='pe-page'; wrap.dataset.i=i;
      wrap.style.width = Math.ceil(vp.width)+'px'; wrap.style.height = Math.ceil(vp.height)+'px';
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

      // Extract existing text items (for click-to-edit)
      let textItems = [];
      try {
        const tc = await p.getTextContent();
        tc.items.forEach(it=>{
          if(!it.str || !it.str.trim()) return;
          const tx = pdfjsLib.Util.transform(vp.transform, it.transform);
          const fh = Math.hypot(tx[2], tx[3]) || (it.height*scale);
          const w = (it.width||0) * scale;
          textItems.push({ str:it.str, x:tx[4], top:tx[5]-fh, w:Math.max(w, fh*0.4), h:fh*1.25, fh, fontName:it.fontName||'' });
        });
      } catch(e){ /* image-only page */ }

      const overlay = document.createElement('div');
      overlay.className='pe-overlay'; overlay.dataset.i=i;
      wrap.appendChild(canvas); wrap.appendChild(overlay);
      inner.appendChild(wrap);
      pages.push({ canvas, canvasW:canvas.width, canvasH:canvas.height, ptW, ptH, textItems });
      attachOverlay(overlay, i);
    }
    stage.innerHTML=''; stage.appendChild(inner);
    inner.style.zoom = zoom;
    renderElements();
  }

  function pagePx(overlay, i, e){
    const r = overlay.getBoundingClientRect();
    const sx = pages[i].canvasW / r.width, sy = pages[i].canvasH / r.height;
    return { x:(e.clientX - r.left)*sx, y:(e.clientY - r.top)*sy };
  }

  // Sample the darkest opaque pixel (≈ text color) in a region
  function sampleColor(canvas, x, y, w, h, mode){
    try{
      const sx=Math.max(0,Math.floor(x)), sy=Math.max(0,Math.floor(y));
      const sw=Math.min(canvas.width-sx, Math.ceil(w)), sh=Math.min(canvas.height-sy, Math.ceil(h));
      if(sw<=0||sh<=0) return mode==='bg'?'#ffffff':'#000000';
      const d=canvas.getContext('2d').getImageData(sx,sy,sw,sh).data;
      let pick=null, target = mode==='bg' ? -1 : 999;
      for(let p=0;p<d.length;p+=4){
        if(d[p+3]<128) continue;
        const lum=0.299*d[p]+0.587*d[p+1]+0.114*d[p+2];
        if(mode==='bg' ? lum>target : lum<target){ target=lum; pick=[d[p],d[p+1],d[p+2]]; }
      }
      return pick ? toHex(pick[0],pick[1],pick[2]) : (mode==='bg'?'#ffffff':'#000000');
    }catch(e){ return mode==='bg'?'#ffffff':'#000000'; }
  }

  function attachOverlay(overlay, i){
    overlay.addEventListener('pointerdown', e=>{
      if(e.target!==overlay) return;
      const pt = pagePx(overlay, i, e);
      if(tool==='select'){ selectedId=null; renderProps(); renderElements(); return; }
      if(tool==='draw'){ startDraw(overlay, i, e); return; }
      if(tool==='text'){
        const item = (pages[i].textItems||[]).find(t => pt.x>=t.x-2 && pt.x<=t.x+t.w+2 && pt.y>=t.top-2 && pt.y<=t.top+t.h+2);
        if(item) editExistingText(i, item); else addText(i, pt);
      }
      else if(tool==='rect') addEl({ type:'rect', page:i, x:pt.x, y:pt.y, w:140, h:80, border:DEFAULTS.shapeBorder, fill:null, lineW:2 });
      else if(tool==='ellipse') addEl({ type:'ellipse', page:i, x:pt.x, y:pt.y, w:120, h:90, border:DEFAULTS.shapeBorder, fill:null, lineW:2 });
      else if(tool==='highlight') addEl({ type:'highlight', page:i, x:pt.x, y:pt.y-10, w:160, h:22, fill:DEFAULTS.highlight });
      else if(tool==='whiteout') addEl({ type:'whiteout', page:i, x:pt.x, y:pt.y, w:140, h:40, fill:'#ffffff' });
    });
  }

  function addEl(elm, opts){
    opts = opts || {};
    if(opts.snap!==false) pushHistory();
    elm.id = newId();
    elements.push(elm);
    if(opts.select!==false){ selectedId = elm.id; setTool('select'); }
    renderElements(); renderProps();
    return elm;
  }

  function addText(i, pt){
    const elm = addEl({ type:'text', page:i, x:pt.x, y:pt.y, text:'Text', fontSize:18, color:DEFAULTS.textColor, bold:false, italic:false, serif:false });
    setTimeout(()=>{ const node=document.querySelector(`.pe-el[data-id="${elm.id}"]`); if(node) editText(node, elm); }, 0);
  }

  // Sejda-style: cover original text with a background-matched box + editable overlay
  function editExistingText(i, item){
    pushHistory();
    const canvas = pages[i].canvas;
    const color = sampleColor(canvas, item.x, item.top, item.w, item.h, 'text');
    const bg    = sampleColor(canvas, item.x, item.top, item.w, item.h, 'bg');
    const fn = (item.fontName||'').toLowerCase();
    const bold = /bold|black|heavy|semibold|-b\b|,bold/.test(fn);
    const italic = /italic|oblique/.test(fn);
    const serif = /times|serif|georgia|garamond|roman|minion|book\s?antiqua/.test(fn) && !/sans/.test(fn);
    // cover original (slightly padded)
    addEl({ type:'whiteout', page:i, x:item.x-2, y:item.top-1, w:item.w+4, h:item.h+2, fill:bg }, { snap:false, select:false });
    // editable overlay — size = detected glyph height, placed at the item's top so the
    // export baseline (y = top + size from the page top) lines up with the original.
    const txt = addEl({ type:'text', page:i, x:item.x, y:item.top, text:item.str, fontSize:Math.max(6,Math.round(item.fh)), color, bold, italic, serif }, { snap:false });
    setTimeout(()=>{ const node=document.querySelector(`.pe-el[data-id="${txt.id}"]`); if(node) editText(node, txt); }, 0);
  }

  function onImageChosen(e){
    const file = e.target.files[0]; e.target.value='';
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const i=0; const maxW = pages[i] ? pages[i].canvasW*0.5 : 200;
        let w=img.naturalWidth, h=img.naturalHeight;
        if(w>maxW){ h=h*(maxW/w); w=maxW; }
        addEl({ type:'image', page:i, x:40, y:40, w, h, src:reader.result, fmt:file.type });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function startDraw(overlay, i, e){
    pushHistory();
    const pts = [ pagePx(overlay, i, e) ];
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText='position:absolute;inset:0;overflow:visible;pointer-events:none';
    svg.setAttribute('width', pages[i].canvasW); svg.setAttribute('height', pages[i].canvasH);
    const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    poly.setAttribute('fill','none'); poly.setAttribute('stroke',DEFAULTS.drawColor); poly.setAttribute('stroke-width',DEFAULTS.drawWidth);
    poly.setAttribute('stroke-linecap','round'); poly.setAttribute('stroke-linejoin','round');
    svg.appendChild(poly); overlay.appendChild(svg);
    const onMove = ev => { pts.push(pagePx(overlay, i, ev)); poly.setAttribute('points', pts.map(p=>`${p.x},${p.y}`).join(' ')); };
    const onUp = () => {
      overlay.removeEventListener('pointermove', onMove); overlay.removeEventListener('pointerup', onUp);
      svg.remove();
      if(pts.length<2){ history.pop(); updateUndoBtn(); return; }
      const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y);
      const minX=Math.min(...xs), minY=Math.min(...ys), w=Math.max(1,Math.max(...xs)-minX), h=Math.max(1,Math.max(...ys)-minY);
      addEl({ type:'draw', page:i, x:minX, y:minY, w, h, vbW:w, vbH:h, points:pts.map(p=>({x:p.x-minX,y:p.y-minY})), stroke:DEFAULTS.drawColor, lineW:DEFAULTS.drawWidth }, { snap:false });
    };
    overlay.setPointerCapture(e.pointerId);
    overlay.addEventListener('pointermove', onMove); overlay.addEventListener('pointerup', onUp);
  }

  function renderElements(){
    document.querySelectorAll('.pe-overlay').forEach(ov=>ov.innerHTML='');

    // Editable-text hints (only with the Text tool; pure UI, not exported)
    if(tool==='text'){
      pages.forEach((pg, pi)=>{
        const ov = document.querySelector(`.pe-overlay[data-i="${pi}"]`); if(!ov) return;
        (pg.textItems||[]).forEach(it=>{
          const hint=document.createElement('div'); hint.className='pe-hint';
          hint.style.left=it.x+'px'; hint.style.top=it.top+'px'; hint.style.width=it.w+'px'; hint.style.height=it.h+'px';
          hint.title='Click to edit this text';
          hint.addEventListener('pointerdown', e=>{ e.stopPropagation(); editExistingText(pi, it); });
          ov.appendChild(hint);
        });
      });
    }

    elements.forEach(elm=>{
      const ov = document.querySelector(`.pe-overlay[data-i="${elm.page}"]`); if(!ov) return;
      const node = document.createElement('div');
      node.className = 'pe-el' + (elm.id===selectedId?' selected':'');
      node.dataset.id = elm.id; node.dataset.type = elm.type;
      node.style.left = elm.x+'px'; node.style.top = elm.y+'px';

      if(elm.type==='text'){
        node.style.fontSize = elm.fontSize+'px';
        node.style.color = elm.color;
        node.style.fontWeight = elm.bold?'700':'400';
        node.style.fontStyle = elm.italic?'italic':'normal';
        node.style.fontFamily = elm.serif ? 'Georgia,"Times New Roman",serif' : 'Helvetica,Arial,sans-serif';
        node.textContent = elm.text;
      } else {
        node.style.width=elm.w+'px'; node.style.height=elm.h+'px';
        if(elm.type==='rect'){ node.style.border=`${elm.lineW}px solid ${elm.border}`; if(elm.fill) node.style.background=elm.fill; }
        else if(elm.type==='ellipse'){ node.style.border=`${elm.lineW}px solid ${elm.border}`; node.style.borderRadius='50%'; if(elm.fill) node.style.background=elm.fill; }
        else if(elm.type==='highlight'){ node.style.background=elm.fill; node.style.opacity='0.4'; }
        else if(elm.type==='whiteout'){ node.style.background=elm.fill||'#ffffff'; }
        else if(elm.type==='image'){ const im=document.createElement('img'); im.src=elm.src; im.style.cssText='width:100%;height:100%;display:block'; node.appendChild(im); }
        else if(elm.type==='draw'){
          const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
          svg.setAttribute('viewBox',`0 0 ${elm.vbW} ${elm.vbH}`); svg.setAttribute('preserveAspectRatio','none');
          svg.style.cssText='width:100%;height:100%;display:block;overflow:visible';
          const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');
          poly.setAttribute('fill','none'); poly.setAttribute('stroke',elm.stroke); poly.setAttribute('stroke-width',elm.lineW);
          poly.setAttribute('stroke-linecap','round'); poly.setAttribute('stroke-linejoin','round');
          poly.setAttribute('points', elm.points.map(p=>`${p.x},${p.y}`).join(' '));
          svg.appendChild(poly); node.appendChild(svg);
        }
      }

      if(elm.id===selectedId){
        const del=document.createElement('button'); del.className='pe-del'; del.textContent='✕';
        del.addEventListener('pointerdown', ev=>ev.stopPropagation());
        del.addEventListener('click', ev=>{ ev.stopPropagation(); pushHistory(); elements=elements.filter(x=>x.id!==elm.id); selectedId=null; renderElements(); renderProps(); });
        node.appendChild(del);
        if(elm.type!=='text'){ ['nw','ne','sw','se'].forEach(h=>{ const hd=document.createElement('div'); hd.className='pe-handle '+h; node.appendChild(hd); startResizeWire(hd, node, elm, h); }); }
      }

      wireElement(node, elm);
      ov.appendChild(node);
    });
  }

  function wireElement(node, elm){
    node.addEventListener('pointerdown', e=>{
      if(node.getAttribute('contenteditable')==='true') return;
      e.stopPropagation();
      selectedId = elm.id;
      if(tool!=='select') setTool('select'); else { renderProps(); document.querySelectorAll('.pe-el').forEach(n=>n.classList.toggle('selected', n.dataset.id===selectedId)); renderElements(); }
      pushHistory();
      const ov=node.parentElement; const start=pagePx(ov, elm.page, e); const ox=elm.x, oy=elm.y;
      let moved=false;
      node.setPointerCapture(e.pointerId);
      const mv=ev=>{ const p=pagePx(ov, elm.page, ev); elm.x=ox+(p.x-start.x); elm.y=oy+(p.y-start.y); node.style.left=elm.x+'px'; node.style.top=elm.y+'px'; moved=true; };
      const up=()=>{ node.removeEventListener('pointermove',mv); node.removeEventListener('pointerup',up); if(!moved){ history.pop(); updateUndoBtn(); } };
      node.addEventListener('pointermove',mv); node.addEventListener('pointerup',up);
    });
    if(elm.type==='text') node.addEventListener('dblclick', ()=>editText(node, elm));
  }

  function startResizeWire(handle, node, elm, dir){
    handle.addEventListener('pointerdown', e=>{
      e.stopPropagation(); pushHistory();
      const ov=node.parentElement; const start=pagePx(ov, elm.page, e); const o={x:elm.x,y:elm.y,w:elm.w,h:elm.h};
      handle.setPointerCapture(e.pointerId);
      const mv=ev=>{
        const p=pagePx(ov, elm.page, ev); const dx=p.x-start.x, dy=p.y-start.y;
        let x=o.x,y=o.y,w=o.w,h=o.h;
        if(dir.includes('e')) w=Math.max(8,o.w+dx);
        if(dir.includes('s')) h=Math.max(8,o.h+dy);
        if(dir.includes('w')){ w=Math.max(8,o.w-dx); x=o.x+(o.w-w); }
        if(dir.includes('n')){ h=Math.max(8,o.h-dy); y=o.y+(o.h-h); }
        elm.x=x; elm.y=y; elm.w=w; elm.h=h;
        node.style.left=x+'px'; node.style.top=y+'px'; node.style.width=w+'px'; node.style.height=h+'px';
      };
      const up=()=>{ handle.removeEventListener('pointermove',mv); handle.removeEventListener('pointerup',up); };
      handle.addEventListener('pointermove',mv); handle.addEventListener('pointerup',up);
    });
  }

  function editText(node, elm){
    node.setAttribute('contenteditable','true'); node.focus();
    const sel=window.getSelection(); const range=document.createRange(); range.selectNodeContents(node); range.collapse(false); sel.removeAllRanges(); sel.addRange(range);
    const finish=()=>{
      node.removeAttribute('contenteditable'); elm.text=node.textContent; node.removeEventListener('blur',finish);
      if(!elm.text.trim()){ elements=elements.filter(x=>x.id!==elm.id); selectedId=null; }
      renderElements(); renderProps();
    };
    node.addEventListener('blur', finish);
  }

  function renderProps(){
    const box=document.getElementById('pe-props'); if(!box) return;
    const elm=elements.find(x=>x.id===selectedId);
    if(!elm){ box.innerHTML=''; return; }
    let html='';
    if(elm.type==='text'){
      html=`<div class="pe-pgrp">Size <input type="number" id="pp-size" min="6" max="200" value="${elm.fontSize}"></div>
        <div class="pe-pgrp">Color <input type="color" id="pp-color" value="${elm.color}"></div>
        <button class="pe-toggle ${elm.bold?'on':''}" id="pp-bold">B</button>
        <button class="pe-toggle ${elm.italic?'on':''}" id="pp-italic" style="font-style:italic">I</button>
        <div class="pe-pgrp"><label style="font-size:.72rem"><input type="checkbox" id="pp-serif" ${elm.serif?'checked':''}> Serif</label></div>`;
    } else if(elm.type==='rect'||elm.type==='ellipse'){
      html=`<div class="pe-pgrp">Border <input type="color" id="pp-border" value="${elm.border}"></div>
        <div class="pe-pgrp">Width <input type="number" id="pp-lw" min="0" max="20" value="${elm.lineW}"></div>
        <div class="pe-pgrp">Fill <input type="color" id="pp-fill" value="${elm.fill||'#ffffff'}"> <label style="font-size:.72rem"><input type="checkbox" id="pp-fillon" ${elm.fill?'checked':''}> on</label></div>`;
    } else if(elm.type==='highlight'){
      html=`<div class="pe-pgrp">Color <input type="color" id="pp-hfill" value="${elm.fill}"></div>`;
    } else if(elm.type==='whiteout'){
      html=`<div class="pe-pgrp">Cover color <input type="color" id="pp-wfill" value="${elm.fill||'#ffffff'}"></div>`;
    } else if(elm.type==='draw'){
      html=`<div class="pe-pgrp">Stroke <input type="color" id="pp-stroke" value="${elm.stroke}"></div>
        <div class="pe-pgrp">Width <input type="number" id="pp-dlw" min="1" max="40" value="${elm.lineW}"></div>`;
    } else {
      html=`<div class="pe-pgrp" style="color:var(--text-3)">Image — drag to move, corners to resize</div>`;
    }
    html+=`<button class="btn btn-danger btn-sm" id="pp-del">Delete</button>`;
    box.innerHTML=html;

    const on=(id,ev,fn)=>{ const n=document.getElementById(id); if(n) n.addEventListener(ev,fn); };
    on('pp-size','input', e=>{ pushHistory(); elm.fontSize=parseInt(e.target.value)||18; renderElements(); });
    on('pp-color','input', e=>{ elm.color=e.target.value; renderElements(); });
    on('pp-bold','click', ()=>{ pushHistory(); elm.bold=!elm.bold; renderElements(); renderProps(); });
    on('pp-italic','click', ()=>{ pushHistory(); elm.italic=!elm.italic; renderElements(); renderProps(); });
    on('pp-serif','change', e=>{ pushHistory(); elm.serif=e.target.checked; renderElements(); });
    on('pp-border','input', e=>{ elm.border=e.target.value; renderElements(); });
    on('pp-lw','input', e=>{ elm.lineW=parseInt(e.target.value)||0; renderElements(); });
    on('pp-fill','input', e=>{ elm.fill=e.target.value; const c=document.getElementById('pp-fillon'); if(c) c.checked=true; renderElements(); });
    on('pp-fillon','change', e=>{ elm.fill=e.target.checked?document.getElementById('pp-fill').value:null; renderElements(); });
    on('pp-hfill','input', e=>{ elm.fill=e.target.value; renderElements(); });
    on('pp-wfill','input', e=>{ elm.fill=e.target.value; renderElements(); });
    on('pp-stroke','input', e=>{ elm.stroke=e.target.value; renderElements(); });
    on('pp-dlw','input', e=>{ elm.lineW=parseInt(e.target.value)||3; renderElements(); });
    on('pp-del','click', ()=>{ pushHistory(); elements=elements.filter(x=>x.id!==elm.id); selectedId=null; renderElements(); renderProps(); });
  }

  async function applyAndDownload(){
    if(!srcBytes) return;
    const btn=document.getElementById('pe-apply'); btn.disabled=true; const lbl=btn.textContent; btn.textContent='Working…';
    try {
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const pdf = await PDFDocument.load(srcBytes);
      const pdfPages = pdf.getPages();
      const fontCache={};
      const getFont=async(bold,italic,serif)=>{
        const key=(serif?'t':'h')+(bold?'b':'')+(italic?'i':'');
        if(!fontCache[key]){
          let f;
          if(serif) f = bold&&italic?StandardFonts.TimesRomanBoldItalic : bold?StandardFonts.TimesRomanBold : italic?StandardFonts.TimesRomanItalic : StandardFonts.TimesRoman;
          else f = bold&&italic?StandardFonts.HelveticaBoldOblique : bold?StandardFonts.HelveticaBold : italic?StandardFonts.HelveticaOblique : StandardFonts.Helvetica;
          fontCache[key]=await pdf.embedFont(f);
        }
        return fontCache[key];
      };

      for(const elm of elements){
        const page=pdfPages[elm.page]; if(!page) continue;
        const { width:pw, height:ph }=page.getSize();
        const sx=pw/pages[elm.page].canvasW, sy=ph/pages[elm.page].canvasH;

        if(elm.type==='text'){
          const font=await getFont(elm.bold, elm.italic, elm.serif);
          const size=elm.fontSize*sy; const c=hexToRgb(elm.color);
          (elm.text||'').split('\n').forEach((line, idx)=>{
            const yTop=elm.y*sy + (idx+1)*size;
            page.drawText(line, { x:elm.x*sx, y:ph-yTop, size, font, color:rgb(c.r,c.g,c.b) });
          });
        } else if(elm.type==='whiteout'||elm.type==='rect'||elm.type==='highlight'){
          const x=elm.x*sx, w=elm.w*sx, h=elm.h*sy, y=ph-(elm.y*sy)-h; const opts={x,y,width:w,height:h};
          if(elm.type==='whiteout'){ const f=hexToRgb(elm.fill||'#ffffff'); opts.color=rgb(f.r,f.g,f.b); }
          else if(elm.type==='highlight'){ const f=hexToRgb(elm.fill); opts.color=rgb(f.r,f.g,f.b); opts.opacity=0.4; }
          else { if(elm.fill){ const f=hexToRgb(elm.fill); opts.color=rgb(f.r,f.g,f.b); } if(elm.lineW>0){ const b=hexToRgb(elm.border); opts.borderColor=rgb(b.r,b.g,b.b); opts.borderWidth=elm.lineW*sx; } }
          page.drawRectangle(opts);
        } else if(elm.type==='ellipse'){
          const cx=(elm.x+elm.w/2)*sx, cy=ph-(elm.y+elm.h/2)*sy; const opts={ x:cx, y:cy, xScale:(elm.w/2)*sx, yScale:(elm.h/2)*sy };
          if(elm.fill){ const f=hexToRgb(elm.fill); opts.color=rgb(f.r,f.g,f.b); }
          if(elm.lineW>0){ const b=hexToRgb(elm.border); opts.borderColor=rgb(b.r,b.g,b.b); opts.borderWidth=elm.lineW*sx; }
          page.drawEllipse(opts);
        } else if(elm.type==='image'){
          const bytes=await (await fetch(elm.src)).arrayBuffer();
          const img=elm.fmt==='image/png'?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);
          page.drawImage(img, { x:elm.x*sx, y:ph-(elm.y*sy)-(elm.h*sy), width:elm.w*sx, height:elm.h*sy });
        } else if(elm.type==='draw'){
          const c=hexToRgb(elm.stroke); const fx=elm.w/elm.vbW, fy=elm.h/elm.vbH; const lw=(elm.lineW||3)*sx;
          for(let k=1;k<elm.points.length;k++){
            const a=elm.points[k-1], b=elm.points[k];
            page.drawLine({ start:{x:(elm.x+a.x*fx)*sx, y:ph-(elm.y+a.y*fy)*sy}, end:{x:(elm.x+b.x*fx)*sx, y:ph-(elm.y+b.y*fy)*sy}, thickness:lw, color:rgb(c.r,c.g,c.b) });
          }
        }
      }

      const bytes=await pdf.save();
      showResult(new Blob([bytes], { type:'application/pdf' }));
      toast('PDF edited — ready to download','success');
    } catch(err){
      console.error(err); toast('Error applying changes: '+(err.message||err),'error');
    } finally { btn.disabled=false; btn.textContent=lbl; }
  }

  function showResult(blob){
    const base=(fileName?fileName.replace(/\.[^.]+$/,''):'document')+'_edited';
    const res=document.getElementById('pe-result');
    res.innerHTML=`
      <div class="card" style="margin-top:14px;background:var(--surface-2)">
        <h4 style="font-family:var(--font-display);margin-bottom:6px">Edited PDF ready</h4>
        <div style="font-size:.8rem;color:var(--text-3);margin-bottom:12px">${(blob.size/1024).toFixed(1)}KB · ${pages.length} page(s)</div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label">File name</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input id="pe-name" class="form-input" value="${esc(base)}" style="flex:1;min-width:180px"/><span style="font-size:.85rem;color:var(--text-3)">.pdf</span>
          </div>
        </div>
        <button class="btn btn-primary" id="pe-dl">⬇ Download</button>
      </div>`;
    document.getElementById('pe-dl').addEventListener('click', ()=>{
      let name=(document.getElementById('pe-name').value||'document').trim().replace(/[\/\\:*?"<>|]/g,'_')||'document';
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${name}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('Downloaded ✓','success');
    });
  }

  renderShell();
})();
