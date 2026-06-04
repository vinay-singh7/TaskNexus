(function(){
  const el = document.getElementById('panel-pdftools');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">PDF Tools</h1>
      <p class="panel-desc">Combine, extract, and create PDFs entirely on your device (no uploads needed).</p>
    </div>

    <div class="grid-2 pdf-grid" style="gap:16px;align-items:start">

      <!-- Combine PDFs & Images -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:8px;font-family:var(--font-display)">Combine to PDF</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Add multiple PDFs and images (PNG/JPG) — they'll be combined into one PDF in the order listed below.</p>

        <label for="pdf-combine-input" class="pdf-dropzone" id="pdf-dropzone">
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="1.8" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span class="pdf-dropzone-title">Click to add files</span>
          <span class="pdf-dropzone-sub">PDF, PNG or JPG · select multiple</span>
        </label>
        <input type="file" id="pdf-combine-input" accept="application/pdf,image/png,image/jpeg" multiple style="display:none"/>

        <div class="pdf-file-list" id="pdf-file-list"></div>

        <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:0">
          <input type="checkbox" id="combine-compress-toggle"/> Compress output (smaller file — pages become images)
        </label>
        <div id="combine-compress-opts" style="display:none;margin-top:12px">
          <div class="form-group">
            <label class="form-label">Quality: <span id="combine-q-val">70</span>%</label>
            <input id="combine-compress-quality" type="range" min="10" max="95" value="70" style="width:100%;accent-color:var(--primary)"/>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Target size (KB) — optional</label>
            <input id="combine-target-kb" type="number" class="form-input" placeholder="e.g. 500 (overrides the quality slider)" min="1" style="max-width:320px"/>
          </div>
        </div>

        <div class="pdf-actions" id="pdf-combine-actions" style="display:none;margin-top:14px">
          <button class="btn btn-ghost btn-sm" id="btn-combine-clear">Clear all</button>
          <button class="btn btn-primary" id="btn-combine-pdf">Combine into Single PDF</button>
        </div>
        <div id="combine-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
        <div id="pdf-combine-result"></div>
      </div>

      <!-- Compress PDF -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:8px;font-family:var(--font-display)">Compress PDF</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Shrink a PDF's file size. Pages are re-rendered as optimized images — set a target size or pick a quality level.</p>
        <input type="file" id="pdf-compress-input" class="form-input" accept="application/pdf" style="margin-bottom:12px"/>
        <div class="form-group">
          <label class="form-label">Quality: <span id="pdf-q-val">70</span>%</label>
          <input id="pdf-compress-quality" type="range" min="10" max="95" value="70" style="width:100%;accent-color:var(--primary)"/>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:4px">Higher = sharper pages, larger file. Used when no target size is set.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Target size (KB) — optional</label>
          <input id="pdf-target-kb" type="number" class="form-input" placeholder="e.g. 500 (overrides the quality slider)" min="1" style="max-width:320px"/>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:6px">If set, quality is auto-tuned so the output stays at or under this size.</div>
        </div>
        <button class="btn btn-primary" id="btn-compress-pdf" style="width:100%">Compress PDF</button>
        <div id="compress-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
        <div id="pdf-compress-result"></div>
      </div>

      <!-- Organize Pages -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:8px;font-family:var(--font-display)">Organize Pages</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Reorder (drag or ◀ ▶), rotate, or delete pages, then save as a new PDF.</p>
        <input type="file" id="pdf-org-input" class="form-input" accept="application/pdf" style="margin-bottom:12px"/>
        <div id="org-status" style="margin-bottom:8px;font-size:0.8rem;color:var(--primary);display:none">Loading pages…</div>
        <div id="pdf-org-grid" class="pdf-org-grid"></div>
        <div class="pdf-actions" id="pdf-org-actions" style="display:none;margin-top:14px">
          <button class="btn btn-ghost btn-sm" id="btn-org-reset">Reset</button>
          <button class="btn btn-primary" id="btn-org-save">Save PDF</button>
        </div>
        <div id="pdf-org-result"></div>
      </div>

      <!-- PDF to Images -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:8px;font-family:var(--font-display)">PDF to Images</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Export each page of a PDF as an image. Multiple pages download as a ZIP.</p>
        <input type="file" id="pdf-toimg-input" class="form-input" accept="application/pdf" style="margin-bottom:12px"/>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div class="form-group" style="flex:1;min-width:140px">
            <label class="form-label">Format</label>
            <select id="pdf-toimg-fmt" class="form-select"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select>
          </div>
          <div class="form-group" style="flex:1;min-width:140px">
            <label class="form-label">Resolution</label>
            <select id="pdf-toimg-scale" class="form-select"><option value="1">Standard (1×)</option><option value="1.5" selected>High (1.5×)</option><option value="2.5">Very High (2.5×)</option></select>
          </div>
        </div>
        <button class="btn btn-primary" id="btn-pdf-toimg" style="width:100%">Convert to Images</button>
        <div id="toimg-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
      </div>

      <!-- Images to PDF -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:8px;font-family:var(--font-display)">Images to PDF</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Quickly turn PNG/JPG images into a single PDF (one image per page). For mixing PDFs in too, use Combine to PDF above.</p>
        <input type="file" id="pdf-img2pdf-input" class="form-input" accept="image/png,image/jpeg" multiple style="margin-bottom:12px"/>
        <button class="btn btn-primary" id="btn-img2pdf" style="width:100%">Convert to PDF</button>
        <div id="img2pdf-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
        <div id="pdf-img2pdf-result"></div>
      </div>

      <!-- Split / Extract PDF -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Extract Pages</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Extract specific pages (e.g. 1,3,4-6) from a PDF.</p>
        <input type="file" id="pdf-extract-input" class="form-input" accept="application/pdf" style="margin-bottom:12px"/>
        <input type="text" id="pdf-extract-pages" class="form-input" placeholder="Pages (e.g. 1, 3, 5-8)" style="margin-bottom:12px"/>
        <button class="btn btn-primary" id="btn-extract-pdf" style="width:100%">Extract Pages</button>
        <div id="extract-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
      </div>

    </div>

    <style>
      /* ── Combine to PDF — responsive UI ── */
      .pdf-dropzone {
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        gap:6px; text-align:center;
        padding:24px 16px; margin-bottom:14px;
        border:1.5px dashed var(--border-2); border-radius:var(--radius-md);
        background:var(--surface-2); color:var(--text-3);
        cursor:pointer; transition:border-color .15s, background .15s, color .15s;
      }
      .pdf-dropzone:hover, .pdf-dropzone.dragover {
        border-color:var(--border-focus); background:var(--surface); color:var(--primary);
      }
      .pdf-dropzone-title { font-size:0.9rem; font-weight:600; color:var(--text-2); }
      .pdf-dropzone-sub { font-size:0.75rem; color:var(--text-4); }

      .pdf-file-list { display:flex; flex-direction:column; gap:8px; }
      .pdf-file-list:not(:empty) { margin-bottom:14px; }
      .pdf-file-item {
        display:flex; align-items:center; gap:10px;
        padding:8px 10px;
        background:var(--surface-2); border:1px solid var(--border);
        border-radius:var(--radius-sm);
        min-width:0;
      }
      .pdf-file-item.dragging { opacity:.5; border-style:dashed; }
      .pdf-file-handle {
        flex:0 0 auto; cursor:grab; color:var(--text-4); font-size:1rem;
        line-height:1; user-select:none; padding:0 2px;
      }
      .pdf-file-handle:active { cursor:grabbing; }
      .pdf-file-icon {
        flex:0 0 auto; width:32px; height:32px; border-radius:var(--radius-sm);
        display:flex; align-items:center; justify-content:center;
        font-size:1rem; background:var(--surface-3);
      }
      .pdf-file-move { flex:0 0 auto; display:flex; flex-direction:column; gap:2px; }
      .pdf-file-move button {
        width:24px; height:18px; border:1px solid var(--border); background:var(--surface);
        color:var(--text-3); border-radius:4px; cursor:pointer; font-size:.7rem; line-height:1;
        display:flex; align-items:center; justify-content:center; padding:0;
      }
      .pdf-file-move button:hover:not(:disabled) { background:var(--surface-3); color:var(--text); }
      .pdf-file-move button:disabled { opacity:.35; cursor:not-allowed; }
      .pdf-file-meta { flex:1 1 auto; min-width:0; }
      .pdf-file-name {
        font-size:0.85rem; font-weight:600; color:var(--text);
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .pdf-file-sub { font-size:0.72rem; color:var(--text-3); }
      .pdf-file-remove {
        flex:0 0 auto; width:28px; height:28px; border-radius:var(--radius-sm);
        display:flex; align-items:center; justify-content:center;
        border:none; cursor:pointer; background:transparent; color:var(--text-3);
        transition:background .15s, color .15s; line-height:1; font-size:1.1rem;
      }
      .pdf-file-remove:hover { background:#fef2f2; color:var(--danger); }

      .pdf-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
      .pdf-actions .btn-primary { flex:1 1 200px; }

      /* ── Organize Pages grid ── */
      .pdf-org-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:14px; }
      .pdf-org-card { border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; background:var(--surface); display:flex; flex-direction:column; }
      .pdf-org-card.dragging { opacity:.45; border-style:dashed; }
      .pdf-org-thumbwrap { height:170px; display:flex; align-items:center; justify-content:center; background:var(--surface-2); overflow:hidden; cursor:grab; }
      .pdf-org-thumbwrap img { max-width:90%; max-height:90%; box-shadow:var(--shadow-sm); transition:transform .15s; }
      .pdf-org-bar { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:6px 8px; border-top:1px solid var(--border); }
      .pdf-org-bar > span { font-size:.72rem; color:var(--text-3); white-space:nowrap; }
      .pdf-org-btns { display:flex; gap:3px; }
      .pdf-org-btns button { width:24px; height:24px; border:1px solid var(--border); background:var(--surface); color:var(--text-3); border-radius:4px; cursor:pointer; font-size:.72rem; line-height:1; display:flex; align-items:center; justify-content:center; padding:0; }
      .pdf-org-btns button:hover:not(:disabled) { background:var(--surface-3); color:var(--text); }
      .pdf-org-btns button:disabled { opacity:.3; cursor:not-allowed; }
      .pdf-org-btns button[data-act="del"]:hover { background:#fef2f2; color:var(--danger); }

      @media (max-width: 480px) {
        .pdf-dropzone { padding:20px 12px; }
        .pdf-actions { flex-direction:column-reverse; align-items:stretch; }
        .pdf-actions .btn { width:100%; }
      }
    </style>
  `;

  // ── State for the combine list (own array — file inputs aren't directly mutable) ──
  let combineFiles = []; // { id, file }
  let dragIndex = null;  // index of the row currently being dragged

  const SUPPORTED = ['application/pdf', 'image/png', 'image/jpeg'];

  function fmtSize(bytes){
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  }
  function fileIcon(file){
    if(file.type === 'application/pdf') return '📄';
    return '🖼';
  }
  function fileKind(file){
    if(file.type === 'application/pdf') return 'PDF';
    if(file.type === 'image/png') return 'PNG image';
    if(file.type === 'image/jpeg') return 'JPG image';
    return 'File';
  }

  function addFiles(fileSource){
    let added = 0, skipped = 0;
    Array.from(fileSource).forEach(f => {
      if(!SUPPORTED.includes(f.type)){ skipped++; return; }
      combineFiles.push({ id: (window.uid ? uid() : String(Date.now()+Math.random())), file: f });
      added++;
    });
    if(skipped) toast(`${skipped} unsupported file(s) skipped`, 'warning');
    if(added) renderFileList();
  }

  function renderFileList(){
    const list = document.getElementById('pdf-file-list');
    const actions = document.getElementById('pdf-combine-actions');
    if(!list) return;

    const last = combineFiles.length - 1;
    list.innerHTML = combineFiles.map((item, idx) => `
      <div class="pdf-file-item" data-id="${item.id}" data-idx="${idx}" draggable="true">
        <span class="pdf-file-handle" title="Drag to reorder" aria-hidden="true">⠿</span>
        <div class="pdf-file-icon">${fileIcon(item.file)}</div>
        <div class="pdf-file-meta">
          <div class="pdf-file-name" title="${esc(item.file.name)}">${esc(item.file.name)}</div>
          <div class="pdf-file-sub">${fileKind(item.file)} · ${fmtSize(item.file.size)}</div>
        </div>
        <div class="pdf-file-move">
          <button class="pdf-file-up" data-id="${item.id}" title="Move up" aria-label="Move up" ${idx===0?'disabled':''}>↑</button>
          <button class="pdf-file-down" data-id="${item.id}" title="Move down" aria-label="Move down" ${idx===last?'disabled':''}>↓</button>
        </div>
        <button class="pdf-file-remove" data-id="${item.id}" title="Remove" aria-label="Remove ${esc(item.file.name)}">&times;</button>
      </div>
    `).join('');

    actions.style.display = combineFiles.length ? 'flex' : 'none';

    const indexOfId = id => combineFiles.findIndex(f => f.id === id);
    const moveItem = (from, to) => {
      if(from < 0 || to < 0 || to >= combineFiles.length) return;
      const [moved] = combineFiles.splice(from, 1);
      combineFiles.splice(to, 0, moved);
      renderFileList();
    };

    list.querySelectorAll('.pdf-file-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        combineFiles = combineFiles.filter(f => f.id !== btn.dataset.id);
        renderFileList();
      });
    });
    // Up / down buttons (touch-friendly reordering)
    list.querySelectorAll('.pdf-file-up').forEach(btn =>
      btn.addEventListener('click', () => { const i = indexOfId(btn.dataset.id); moveItem(i, i - 1); }));
    list.querySelectorAll('.pdf-file-down').forEach(btn =>
      btn.addEventListener('click', () => { const i = indexOfId(btn.dataset.id); moveItem(i, i + 1); }));

    // Native drag-and-drop reordering (desktop)
    list.querySelectorAll('.pdf-file-item').forEach(itemEl => {
      itemEl.addEventListener('dragstart', e => {
        dragIndex = parseInt(itemEl.dataset.idx, 10);
        itemEl.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      itemEl.addEventListener('dragend', () => { itemEl.classList.remove('dragging'); dragIndex = null; });
      itemEl.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      itemEl.addEventListener('drop', e => {
        e.preventDefault();
        const overIdx = parseInt(itemEl.dataset.idx, 10);
        if(dragIndex === null || dragIndex === overIdx) return;
        moveItem(dragIndex, overIdx);
      });
    });
  }

  async function downloadBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- COMBINE (PDFs + Images) ---
  const combineInput = document.getElementById('pdf-combine-input');
  const dropzone = document.getElementById('pdf-dropzone');

  combineInput.addEventListener('change', () => {
    addFiles(combineInput.files);
    combineInput.value = ''; // reset so re-selecting the same file re-appends
  });

  // Drag & drop support on the dropzone
  ['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e => {
    e.preventDefault(); dropzone.classList.add('dragover');
  }));
  ['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e => {
    e.preventDefault(); dropzone.classList.remove('dragover');
  }));
  dropzone.addEventListener('drop', e => {
    if(e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  document.getElementById('btn-combine-clear').addEventListener('click', () => {
    combineFiles = [];
    document.getElementById('pdf-combine-result').innerHTML = '';
    renderFileList();
  });

  // Toggle the compress options for the combine tool
  document.getElementById('combine-compress-toggle').addEventListener('change', e => {
    document.getElementById('combine-compress-opts').style.display = e.target.checked ? 'block' : 'none';
  });
  document.getElementById('combine-compress-quality').addEventListener('input', e => {
    document.getElementById('combine-q-val').textContent = e.target.value;
  });

  document.getElementById('btn-combine-pdf').addEventListener('click', async () => {
    if(combineFiles.length < 1) return toast('Add at least one file to combine', 'error');

    const status = document.getElementById('combine-status');
    const btn = document.getElementById('btn-combine-pdf');
    const resultEl = document.getElementById('pdf-combine-result');
    resultEl.innerHTML = '';
    status.style.display = 'block';
    status.textContent = 'Combining…';
    btn.disabled = true;

    const compress = document.getElementById('combine-compress-toggle').checked;

    try {
      const { PDFDocument } = window.PDFLib;
      const outPdf = await PDFDocument.create();

      for (const { file } of combineFiles) {
        const arrayBuffer = await file.arrayBuffer();

        if (file.type === 'application/pdf') {
          const src = await PDFDocument.load(arrayBuffer);
          const pages = await outPdf.copyPages(src, src.getPageIndices());
          pages.forEach(p => outPdf.addPage(p));
        } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
          const image = file.type === 'image/jpeg'
            ? await outPdf.embedJpg(arrayBuffer)
            : await outPdf.embedPng(arrayBuffer);
          const page = outPdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
      }

      let pdfBytes = await outPdf.save();
      let info = `${(pdfBytes.length/1024).toFixed(1)}KB · ${combineFiles.length} file(s) combined`;

      if(compress){
        let targetKB = parseFloat(document.getElementById('combine-target-kb').value);
        if(!(targetKB > 0)) targetKB = 0;
        const sliderQ = parseInt(document.getElementById('combine-compress-quality').value) / 100;
        const origLen = pdfBytes.length;
        const result = await compressPdfBytes(pdfBytes, { targetKB, quality: sliderQ, statusEl: status });
        info = compressionInfo(origLen, result, targetKB, sliderQ);
        pdfBytes = result.bytes;
      }

      showPdfResult(pdfBytes, 'combined_document', info, 'pdf-combine-result');
      toast('Files combined into a single PDF!', 'success');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Error combining files', 'error');
    } finally {
      status.style.display = 'none';
      btn.disabled = false;
    }
  });

  // --- SHARED PDF RASTER COMPRESSION (used by Compress PDF + Combine) ---
  // Render every page of a PDF to a canvas at the given scale (uses PDF.js)
  async function renderPdfPages(source, scale){
    const pdfjsLib = window.pdfjsLib;
    if(!pdfjsLib) throw new Error('PDF renderer (PDF.js) failed to load — check your connection and reload.');
    if(!pdfjsLib.GlobalWorkerOptions.workerSrc){
      // Use the CDN worker; if it can't be fetched, PDF.js automatically falls
      // back to running on the main thread ("fake worker"), so this still works.
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    // getDocument may transfer the buffer — clone so the caller's copy stays usable
    const data = source.slice ? source.slice(0) : source;
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const canvases = [];
    for(let i=1; i<=doc.numPages; i++){
      const page = await doc.getPage(i);
      // getViewport applies the page's intrinsic rotation, so orientation is preserved
      const viewport = page.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width  = Math.ceil(viewport.width);
      c.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: c.getContext('2d'), viewport }).promise;
      canvases.push(c);
    }
    return canvases;
  }

  // Build a PDF from page canvases, encoding each as JPEG at quality q. Returns Uint8Array.
  async function buildPdfFromCanvases(canvases, q){
    const { PDFDocument } = window.PDFLib;
    const outPdf = await PDFDocument.create();
    for(const c of canvases){
      const blob = await new Promise(r => c.toBlob(b => r(b), 'image/jpeg', q));
      const bytes = await blob.arrayBuffer();
      const img = await outPdf.embedJpg(bytes);
      const page = outPdf.addPage([img.width, img.height]);
      page.drawImage(img, { x:0, y:0, width:img.width, height:img.height });
    }
    return await outPdf.save();
  }

  // Rasterize + compress PDF bytes. opts: { targetKB, quality (0-1), statusEl }.
  // Returns { bytes, hitLimit }.
  async function compressPdfBytes(source, opts){
    const { targetKB = 0, quality = 0.7, statusEl } = opts || {};
    const setStatus = t => { if(statusEl) statusEl.textContent = t; };
    let scale = 1.5;
    setStatus('Rendering pages…');
    let canvases = await renderPdfPages(source, scale);

    if(targetKB > 0){
      const targetBytes = targetKB * 1024;
      setStatus('Tuning quality to hit target size…');
      let result = null, hitLimit = false;

      // Up to 3 passes: shrink the render scale if even the lowest quality is too big
      for(let pass = 0; pass < 3; pass++){
        const minBytes = await buildPdfFromCanvases(canvases, 0.1);
        if(minBytes.length > targetBytes && scale > 0.6){
          scale = Math.max(0.6, scale * 0.75);
          setStatus('Reducing resolution to fit target…');
          canvases = await renderPdfPages(source, scale);
          result = minBytes; hitLimit = true;
          continue;
        }
        if(minBytes.length > targetBytes){ result = minBytes; hitLimit = true; break; }

        // Binary search for the highest quality under target
        let lo = 0.1, hi = 0.95, best = minBytes;
        for(let i = 0; i < 7; i++){
          const mid = (lo + hi) / 2;
          const b = await buildPdfFromCanvases(canvases, mid);
          if(b.length <= targetBytes){ best = b; lo = mid; } else { hi = mid; }
        }
        result = best; hitLimit = false; break;
      }
      return { bytes: result, hitLimit };
    }

    setStatus('Compressing…');
    return { bytes: await buildPdfFromCanvases(canvases, quality), hitLimit: false };
  }

  // Build the human-readable size summary for a compression result
  function compressionInfo(origBytes, result, targetKB, quality){
    const finalKB = (result.bytes.length / 1024).toFixed(1);
    let info;
    if(targetKB > 0){
      info = result.hitLimit
        ? `Smallest achievable: ${finalKB}KB (couldn't reach ${targetKB}KB)`
        : `${finalKB}KB · target ${targetKB}KB`;
      if(result.hitLimit) toast(`Couldn't reach ${targetKB}KB — smallest is ${finalKB}KB`, 'warning');
    } else {
      info = `${finalKB}KB · quality ${Math.round(quality*100)}%`;
    }
    const saved = origBytes > result.bytes.length
      ? ` · ${Math.round((1 - result.bytes.length / origBytes) * 100)}% smaller`
      : ' · already optimized (no reduction)';
    return `${(origBytes/1024).toFixed(1)}KB → ${info}${saved}`;
  }

  // --- COMPRESS PDF ---
  document.getElementById('pdf-compress-quality').addEventListener('input', e => {
    document.getElementById('pdf-q-val').textContent = e.target.value;
  });

  document.getElementById('btn-compress-pdf').addEventListener('click', async () => {
    const files = document.getElementById('pdf-compress-input').files;
    if(files.length === 0) return toast('Please select a PDF', 'error');

    const targetEl = document.getElementById('pdf-target-kb');
    let targetKB = parseFloat(targetEl.value);
    if(!(targetKB > 0)) targetKB = 0;
    const sliderQ = parseInt(document.getElementById('pdf-compress-quality').value) / 100;

    const status = document.getElementById('compress-status');
    const btn = document.getElementById('btn-compress-pdf');
    const resultEl = document.getElementById('pdf-compress-result');
    resultEl.innerHTML = '';
    status.style.display = 'block';
    btn.disabled = true;

    const sourceFile = files[0];
    try {
      const arrayBuffer = await sourceFile.arrayBuffer();
      const result = await compressPdfBytes(arrayBuffer, { targetKB, quality: sliderQ, statusEl: status });
      const info = compressionInfo(sourceFile.size, result, targetKB, sliderQ);
      showPdfResult(result.bytes, baseNameFrom(sourceFile.name, '_compressed'), info, 'pdf-compress-result');
      toast('PDF compressed!', 'success');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Error compressing PDF', 'error');
    } finally {
      status.style.display = 'none';
      btn.disabled = false;
    }
  });

  function baseNameFrom(filename, suffix){
    return (filename ? filename.replace(/\.[^.]+$/, '') : 'document') + (suffix || '');
  }

  // Result card with rename + download for a generated PDF (reused by multiple tools)
  function showPdfResult(bytes, baseName, info, containerId){
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const resultEl = document.getElementById(containerId);

    resultEl.innerHTML = `
      <div class="card" style="margin-top:16px;background:var(--surface-2)">
        <h4 style="font-family:var(--font-display);margin-bottom:6px">Output ready</h4>
        <div style="font-size:.8rem;color:var(--text-3);margin-bottom:14px">${esc(info)}</div>
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">File name</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input class="form-input pdf-result-name" value="${esc(baseName)}" style="flex:1;min-width:180px"/>
            <span style="font-size:.85rem;color:var(--text-3);white-space:nowrap">.pdf</span>
          </div>
        </div>
        <button class="btn btn-primary pdf-download-result">⬇ Download</button>
      </div>`;

    resultEl.querySelector('.pdf-download-result').addEventListener('click', () => {
      let name = (resultEl.querySelector('.pdf-result-name').value || 'document').trim().replace(/[\/\\:*?"<>|]/g, '_');
      if(!name) name = 'document';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${name}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Downloaded ✓', 'success');
    });
  }

  // --- PDF TO IMAGES ---
  document.getElementById('btn-pdf-toimg').addEventListener('click', async () => {
    const files = document.getElementById('pdf-toimg-input').files;
    if(files.length === 0) return toast('Please select a PDF', 'error');

    const fmt = document.getElementById('pdf-toimg-fmt').value;
    const ext = fmt === 'image/jpeg' ? 'jpg' : 'png';
    const scale = parseFloat(document.getElementById('pdf-toimg-scale').value) || 1.5;
    const status = document.getElementById('toimg-status');
    const btn = document.getElementById('btn-pdf-toimg');
    status.style.display = 'block';
    status.textContent = 'Rendering pages…';
    btn.disabled = true;

    const sourceFile = files[0];
    try {
      const arrayBuffer = await sourceFile.arrayBuffer();
      const canvases = await renderPdfPages(arrayBuffer, scale);
      const base = baseNameFrom(sourceFile.name, '');
      const q = fmt === 'image/jpeg' ? 0.92 : undefined;

      const triggerDownload = (blob, name) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      if(canvases.length === 1){
        const blob = await new Promise(r => canvases[0].toBlob(b => r(b), fmt, q));
        triggerDownload(blob, `${base}.${ext}`);
      } else if(window.JSZip){
        status.textContent = 'Packaging ZIP…';
        const zip = new JSZip();
        for(let i=0; i<canvases.length; i++){
          const blob = await new Promise(r => canvases[i].toBlob(b => r(b), fmt, q));
          zip.file(`${base}_page_${String(i+1).padStart(3,'0')}.${ext}`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${base}_images.zip`);
      } else {
        // Fallback: no JSZip — download pages individually
        for(let i=0; i<canvases.length; i++){
          const blob = await new Promise(r => canvases[i].toBlob(b => r(b), fmt, q));
          triggerDownload(blob, `${base}_page_${i+1}.${ext}`);
        }
      }
      toast(`Exported ${canvases.length} page(s) ✓`, 'success');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Error converting PDF to images', 'error');
    } finally {
      status.style.display = 'none';
      btn.disabled = false;
    }
  });

  // --- IMAGES TO PDF ---
  document.getElementById('btn-img2pdf').addEventListener('click', async () => {
    const files = document.getElementById('pdf-img2pdf-input').files;
    if(files.length === 0) return toast('Please select images', 'error');

    const status = document.getElementById('img2pdf-status');
    const btn = document.getElementById('btn-img2pdf');
    document.getElementById('pdf-img2pdf-result').innerHTML = '';
    status.style.display = 'block';
    btn.disabled = true;

    try {
      const { PDFDocument } = window.PDFLib;
      const outPdf = await PDFDocument.create();
      for(let i=0; i<files.length; i++){
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if(file.type === 'image/jpeg') image = await outPdf.embedJpg(arrayBuffer);
        else if(file.type === 'image/png') image = await outPdf.embedPng(arrayBuffer);
        else continue;
        const page = outPdf.addPage([image.width, image.height]);
        page.drawImage(image, { x:0, y:0, width:image.width, height:image.height });
      }
      const bytes = await outPdf.save();
      showPdfResult(bytes, 'images', `${(bytes.length/1024).toFixed(1)}KB · ${files.length} image(s)`, 'pdf-img2pdf-result');
      toast('Images converted to PDF!', 'success');
    } catch (err) {
      console.error(err);
      toast('Error converting images', 'error');
    } finally {
      status.style.display = 'none';
      btn.disabled = false;
    }
  });

  // --- ORGANIZE PAGES (reorder / rotate / delete) ---
  let orgBytes = null;     // source PDF ArrayBuffer
  let orgName = 'document';
  let orgThumbs = {};      // srcIndex -> dataURL
  let orgCount = 0;
  let orgPages = [];       // [{ id, src, rot }] in display order
  let orgDragIdx = null;

  document.getElementById('pdf-org-input').addEventListener('change', async e => {
    const f = e.target.files[0];
    if(!f) return;
    const status = document.getElementById('org-status');
    document.getElementById('pdf-org-result').innerHTML = '';
    status.style.display = 'block';
    try {
      orgBytes = await f.arrayBuffer();
      orgName = f.name;
      const canvases = await renderPdfPages(orgBytes, 0.5);
      orgThumbs = {}; orgPages = []; orgCount = canvases.length;
      canvases.forEach((c, i) => {
        orgThumbs[i] = c.toDataURL('image/jpeg', 0.7);
        orgPages.push({ id: (window.uid ? uid() : 'p'+i), src: i, rot: 0 });
      });
      renderOrgGrid();
    } catch(err){
      console.error(err);
      toast(err.message || 'Could not load PDF', 'error');
    } finally {
      status.style.display = 'none';
    }
  });

  function renderOrgGrid(){
    const grid = document.getElementById('pdf-org-grid');
    const actions = document.getElementById('pdf-org-actions');
    const last = orgPages.length - 1;
    grid.innerHTML = orgPages.map((p, idx) => `
      <div class="pdf-org-card" data-idx="${idx}" draggable="true">
        <div class="pdf-org-thumbwrap"><img src="${orgThumbs[p.src]}" style="transform:rotate(${p.rot}deg)" alt="Page ${p.src+1}"/></div>
        <div class="pdf-org-bar">
          <span>Page ${p.src+1}</span>
          <div class="pdf-org-btns">
            <button data-act="left" data-idx="${idx}" title="Move earlier" ${idx===0?'disabled':''}>◀</button>
            <button data-act="rot" data-idx="${idx}" title="Rotate 90°">⟳</button>
            <button data-act="right" data-idx="${idx}" title="Move later" ${idx===last?'disabled':''}>▶</button>
            <button data-act="del" data-idx="${idx}" title="Delete page">✕</button>
          </div>
        </div>
      </div>`).join('');

    actions.style.display = orgPages.length ? 'flex' : 'none';

    const move = (from, to) => {
      if(to < 0 || to >= orgPages.length) return;
      const [m] = orgPages.splice(from, 1);
      orgPages.splice(to, 0, m);
      renderOrgGrid();
    };

    grid.querySelectorAll('.pdf-org-btns button').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx, 10);
        const act = btn.dataset.act;
        if(act==='left') move(i, i-1);
        else if(act==='right') move(i, i+1);
        else if(act==='del'){ orgPages.splice(i, 1); renderOrgGrid(); }
        else if(act==='rot'){ orgPages[i].rot = (orgPages[i].rot + 90) % 360; renderOrgGrid(); }
      });
    });

    grid.querySelectorAll('.pdf-org-card').forEach(card => {
      card.addEventListener('dragstart', e => { orgDragIdx = parseInt(card.dataset.idx,10); card.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); orgDragIdx=null; });
      card.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect='move'; });
      card.addEventListener('drop', e => {
        e.preventDefault();
        const over = parseInt(card.dataset.idx,10);
        if(orgDragIdx===null || orgDragIdx===over) return;
        move(orgDragIdx, over);
      });
    });
  }

  document.getElementById('btn-org-reset').addEventListener('click', () => {
    if(!orgCount) return;
    orgPages = Array.from({length:orgCount}, (_,i)=>({ id:(window.uid?uid():'p'+i), src:i, rot:0 }));
    document.getElementById('pdf-org-result').innerHTML = '';
    renderOrgGrid();
  });

  document.getElementById('btn-org-save').addEventListener('click', async () => {
    if(!orgPages.length) return toast('No pages to save', 'error');
    const status = document.getElementById('org-status');
    const btn = document.getElementById('btn-org-save');
    status.style.display = 'block'; status.textContent = 'Saving…'; btn.disabled = true;
    try {
      const { PDFDocument, degrees } = window.PDFLib;
      const src = await PDFDocument.load(orgBytes);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, orgPages.map(p => p.src));
      copied.forEach((pg, i) => {
        const add = orgPages[i].rot;
        if(add){ const base = pg.getRotation().angle || 0; pg.setRotation(degrees((base + add) % 360)); }
        out.addPage(pg);
      });
      const bytes = await out.save();
      showPdfResult(bytes, baseNameFrom(orgName, '_organized'), `${(bytes.length/1024).toFixed(1)}KB · ${orgPages.length} page(s)`, 'pdf-org-result');
      toast('PDF saved!', 'success');
    } catch(err){
      console.error(err);
      toast('Error saving PDF', 'error');
    } finally {
      status.style.display = 'none'; status.textContent = 'Loading pages…'; btn.disabled = false;
    }
  });

  // --- EXTRACT PDF ---
  document.getElementById('btn-extract-pdf').addEventListener('click', async () => {
    const files = document.getElementById('pdf-extract-input').files;
    const pageString = document.getElementById('pdf-extract-pages').value.trim();
    if(files.length === 0) return toast('Please select a PDF', 'error');
    if(!pageString) return toast('Please specify pages to extract', 'error');

    const status = document.getElementById('extract-status');
    status.style.display = 'block';

    try {
      const { PDFDocument } = window.PDFLib;
      const sourcePdf = await PDFDocument.load(await files[0].arrayBuffer());
      const totalPages = sourcePdf.getPageCount();

      // parse page string (1-indexed to 0-indexed)
      const pagesToExtract = new Set();
      const parts = pageString.split(',');
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(n => parseInt(n.trim()));
          if (start && end && start <= end) {
            for (let i = start; i <= end; i++) {
              if(i > 0 && i <= totalPages) pagesToExtract.add(i - 1);
            }
          }
        } else {
          const n = parseInt(part.trim());
          if (n > 0 && n <= totalPages) pagesToExtract.add(n - 1);
        }
      }

      const indices = Array.from(pagesToExtract).sort((a,b) => a-b);
      if(indices.length === 0) {
        status.style.display = 'none';
        return toast('No valid pages found in range', 'error');
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      downloadBytes(pdfBytes, 'extracted_pages.pdf');
      toast('Pages extracted successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Error extracting pages', 'error');
    } finally {
      status.style.display = 'none';
    }
  });

})();
