(function(){
  const el = document.getElementById('panel-seo');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">SEO & Meta Tools</h1>
      <p class="panel-desc">Generate HTML meta tags and preview your social cards</p>
    </div>

    <div class="grid-2" style="gap:16px;align-items:stretch">
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Page Details</h3>
        <label class="form-label" style="display:flex;justify-content:space-between">
          Page Title <span id="seo-title-count" style="font-weight:normal;color:var(--text-3)">0 / 60</span>
        </label>
        <input type="text" id="seo-title" class="form-input" placeholder="e.g. TaskNexus - Productivity Toolkit" style="margin-bottom:12px"/>
        
        <label class="form-label" style="display:flex;justify-content:space-between">
          Description <span id="seo-desc-count" style="font-weight:normal;color:var(--text-3)">0 / 160</span>
        </label>
        <textarea id="seo-desc" class="form-input" placeholder="e.g. The ultimate all-in-one productivity hub..." style="height:80px;margin-bottom:12px"></textarea>
        
        <label class="form-label">Image URL</label>
        <input type="text" id="seo-image" class="form-input" placeholder="https://example.com/og-image.png" style="margin-bottom:12px"/>
        
        <label class="form-label">Page URL</label>
        <input type="text" id="seo-url" class="form-input" placeholder="https://example.com"/>
      </div>

      <div class="card">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Generated Meta Tags</h3>
        <textarea id="seo-output" class="form-input" style="height:230px;font-family:monospace;white-space:pre;font-size:.8rem" readonly></textarea>
        <button class="btn btn-primary" id="btn-copy-seo" style="width:100%;margin-top:12px">Copy HTML</button>
      </div>
    </div>
  `;

  const titleIn = document.getElementById('seo-title');
  const descIn = document.getElementById('seo-desc');
  const imgIn = document.getElementById('seo-image');
  const urlIn = document.getElementById('seo-url');
  const output = document.getElementById('seo-output');
  
  const titleCount = document.getElementById('seo-title-count');
  const descCount = document.getElementById('seo-desc-count');

  function update() {
    const t = titleIn.value;
    const d = descIn.value;
    const i = imgIn.value;
    const u = urlIn.value;

    titleCount.textContent = `${t.length} / 60`;
    titleCount.style.color = t.length > 60 ? 'var(--danger)' : 'var(--text-3)';
    
    descCount.textContent = `${d.length} / 160`;
    descCount.style.color = d.length > 160 ? 'var(--danger)' : 'var(--text-3)';

    const html = `<!-- Standard SEO -->
<title>${esc(t)}</title>
<meta name="description" content="${esc(d)}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
${u ? `<meta property="og:url" content="${esc(u)}">\n` : ''}<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(d)}">
${i ? `<meta property="og:image" content="${esc(i)}">\n` : ''}
<!-- Twitter -->
<meta property="twitter:card" content="${i ? 'summary_large_image' : 'summary'}">
${u ? `<meta property="twitter:url" content="${esc(u)}">\n` : ''}<meta property="twitter:title" content="${esc(t)}">
<meta property="twitter:description" content="${esc(d)}">
${i ? `<meta property="twitter:image" content="${esc(i)}">\n` : ''}`;

    output.value = html;
  }

  titleIn.addEventListener('input', update);
  descIn.addEventListener('input', update);
  imgIn.addEventListener('input', update);
  urlIn.addEventListener('input', update);

  document.getElementById('btn-copy-seo').addEventListener('click', () => {
    if(!output.value) return;
    navigator.clipboard.writeText(output.value);
    toast('Meta tags copied to clipboard');
  });

  update();
})();
