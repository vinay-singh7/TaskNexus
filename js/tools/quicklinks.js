// Quick Links — Dark Theme
(function(){
  const el = document.getElementById('panel-quicklinks');
  let viewMode = 'grid';

  function load(){ return Store.get('quicklinks', []); }
  function save(l){ Store.set('quicklinks', l); }

  function getFavicon(url){
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
    catch { return ''; }
  }

  function render(){
    const links = load();
    const q = (document.getElementById('ql-search')?.value||'').toLowerCase();
    const filterTag = document.getElementById('ql-tag-filter')?.value||'';
    let filtered = q ? links.filter(l=>l.title.toLowerCase().includes(q)||l.url.toLowerCase().includes(q)||(l.tags||[]).some(t=>t.toLowerCase().includes(q))) : links;
    if(filterTag) filtered = filtered.filter(l=>(l.tags||[]).includes(filterTag));
    const allTags = [...new Set(links.flatMap(l=>l.tags||[]))];

    el.innerHTML = `
    <div class="panel-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div><h1 class="panel-title">Quick Links</h1><p class="panel-desc">Save, tag, and launch your most-used URLs.</p></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="ql-search" class="form-input" placeholder="Search links…" style="width:165px" value="${esc(q)}"/>
          <select id="ql-tag-filter" class="form-select" style="width:120px">
            <option value="">All tags</option>
            ${allTags.map(t=>`<option value="${esc(t)}" ${filterTag===t?'selected':''}>${esc(t)}</option>`).join('')}
          </select>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm btn-icon ${viewMode==='grid'?'active':''}" id="view-grid" title="Grid view">⊞</button>
            <button class="btn btn-secondary btn-sm btn-icon ${viewMode==='list'?'active':''}" id="view-list" title="List view">☰</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add link form -->
    <div class="card" style="margin-bottom:18px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
        <input id="ql-url"   class="form-input" placeholder="https://…" style="flex:2;min-width:160px"/>
        <input id="ql-title" class="form-input" placeholder="Label (optional)" style="flex:1;min-width:120px"/>
        <input id="ql-tags"  class="form-input" placeholder="Tags (comma-sep)" style="flex:1;min-width:120px"/>
        <button class="btn btn-primary" id="btn-add-link">+ Add Link</button>
      </div>
    </div>

    <!-- Links display -->
    ${viewMode === 'grid' ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px">
        ${filtered.length ? filtered.map(l=>`
          <div class="card" style="text-align:center;cursor:pointer;padding:20px 14px;position:relative;transition:transform .2s,border-color .2s"
            onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='rgba(79,70,229,0.4)'"
            onmouseout="this.style.transform='';this.style.borderColor=''">
            <a href="${esc(l.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
              <div style="width:40px;height:40px;border-radius:12px;background:var(--surface-3);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border-2)">
                ${getFavicon(l.url)?`<img src="${getFavicon(l.url)}" style="width:22px;height:22px;object-fit:contain" onerror="this.style.display='none'">`:'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'}
              </div>
              <div style="font-size:.84rem;font-weight:700;color:var(--text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.title||l.url)}</div>
              <div style="font-size:.68rem;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(new URL(l.url).hostname)}</div>
            </a>
            <button class="btn btn-ghost btn-sm ql-del" data-id="${l.id}" style="position:absolute;top:6px;right:6px;opacity:0;transition:opacity .2s;padding:3px 7px;font-size:11px"
              onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">✕</button>
            ${(l.tags||[]).length?`<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:3px;justify-content:center">${(l.tags).map(t=>`<span class="badge badge-purple" style="font-size:.58rem">${esc(t)}</span>`).join('')}</div>`:''}
          </div>`).join('')
          : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div><div class="empty-title">No links saved</div><div class="empty-desc">Add your first link above</div></div>`}
      </div>` : `
      <div class="card" style="padding:0;overflow:hidden">
        ${filtered.length ? filtered.map((l,i)=>`
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border-2);transition:background .15s"
            onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background=''">
            <div style="width:32px;height:32px;border-radius:8px;background:var(--surface-3);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid var(--border-2)">
              ${getFavicon(l.url)?`<img src="${getFavicon(l.url)}" style="width:18px;height:18px;object-fit:contain" onerror="this.style.display='none'">`:'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:.88rem;color:var(--text)">${esc(l.title||l.url)}</div>
              <div style="font-size:.72rem;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.url)}</div>
            </div>
            ${(l.tags||[]).length?`<div style="display:flex;gap:3px">${l.tags.map(t=>`<span class="badge badge-purple" style="font-size:.6rem">${esc(t)}</span>`).join('')}</div>`:''}
            <a href="${esc(l.url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="flex-shrink:0">Open ↗</a>
            <button class="btn btn-ghost btn-sm ql-del" data-id="${l.id}" style="opacity:.5;flex-shrink:0"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
          </div>`).join('')
          : `<div class="empty-state" style="padding:40px 0"><div class="empty-icon"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div><div class="empty-title">No links found</div></div>`}
      </div>`}`;

    document.getElementById('btn-add-link').addEventListener('click', addLink);
    document.getElementById('ql-url').addEventListener('keydown', e=>e.key==='Enter'&&addLink());
    document.getElementById('ql-search').addEventListener('input', render);
    document.getElementById('ql-tag-filter').addEventListener('change', render);
    document.getElementById('view-grid').addEventListener('click',()=>{ viewMode='grid'; render(); });
    document.getElementById('view-list').addEventListener('click',()=>{ viewMode='list'; render(); });
    el.querySelectorAll('.ql-del').forEach(b=>b.addEventListener('click', e=>{ e.preventDefault(); save(load().filter(l=>l.id!==b.dataset.id)); render(); toast('Link removed'); }));
  }

  function addLink(){
    const url = document.getElementById('ql-url').value.trim();
    if(!url){ toast('Enter a URL','error'); return; }
    const href = url.startsWith('http')?url:'https://'+url;
    try { new URL(href); } catch{ toast('Invalid URL','error'); return; }
    const title = document.getElementById('ql-title').value.trim();
    const rawTags = document.getElementById('ql-tags').value;
    const tags = rawTags.split(',').map(t=>t.trim()).filter(Boolean);
    const links = load();
    links.unshift({ id:uid(), url:href, title:title||new URL(href).hostname, tags, created:Date.now() });
    save(links);
    document.getElementById('ql-url').value='';
    document.getElementById('ql-title').value='';
    document.getElementById('ql-tags').value='';
    render(); toast('Link saved ✓','success');
  }

  render();
})();
