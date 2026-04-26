// Notes Tool
(function(){
  const el = document.getElementById('panel-notes');

  // Dark glassmorphic note color palette
  const COLORS = [
    {bg:'rgba(79,70,229,0.18)',  border:'rgba(79,70,229,0.3)',   label:'Indigo'},
    {bg:'rgba(124,58,237,0.18)', border:'rgba(124,58,237,0.3)',  label:'Violet'},
    {bg:'rgba(219,39,119,0.18)', border:'rgba(219,39,119,0.3)',  label:'Pink'},
    {bg:'rgba(245,158,11,0.15)', border:'rgba(245,158,11,0.3)',  label:'Amber'},
    {bg:'rgba(34,197,94,0.15)',  border:'rgba(34,197,94,0.3)',   label:'Green'},
    {bg:'rgba(59,130,246,0.18)', border:'rgba(59,130,246,0.3)',  label:'Blue'},
    {bg:'rgba(239,68,68,0.15)',  border:'rgba(239,68,68,0.3)',   label:'Red'},
    {bg:'var(--surface-3)',border:'var(--border)',label:'Neutral'},
  ];

  function load() { return Store.get('notes', []); }
  function save(n) { Store.set('notes', n); }

  function render() {
    const notes = load();
    const q = (document.getElementById('notes-search')?.value || '').toLowerCase();
    const filtered = q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) : notes;
    const sorted = [...filtered].sort((a,b) => (b.pinned||0)-(a.pinned||0) || b.updated - a.updated);

    el.innerHTML = `
      <div class="panel-header">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <h1 class="panel-title">Notes</h1>
            <p class="panel-desc">Rich notes saved locally — always available.</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="notes-search" class="form-input" placeholder="Search notes…" style="width:180px" value="${esc(q)}"/>
            <button class="btn btn-primary" id="btn-new-note">+ New Note</button>
          </div>
        </div>
      </div>
      <div id="notes-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">
        ${sorted.length ? sorted.map(n => {
          const col = COLORS.find(c=>c.bg===n.color) || COLORS[7];
          return `
          <div class="note-card card" data-id="${n.id}"
            style="background:${n.color||col.bg};border-color:${col.border};cursor:pointer;min-height:160px;position:relative">
            ${n.pinned?`<span style="position:absolute;top:10px;right:10px;font-size:11px;opacity:.7"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></span>`:''}
            <div style="font-weight:700;font-size:.92rem;margin-bottom:8px;padding-right:20px;color:var(--text)">${esc(n.title)||'Untitled'}</div>
            <div style="font-size:.81rem;color:var(--text-2);white-space:pre-wrap;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;line-height:1.6">${esc(n.body)}</div>
            <div style="margin-top:12px;font-size:.67rem;color:var(--text-3)">${fmtDate(n.updated)}</div>
            <div style="position:absolute;bottom:10px;right:10px;display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm btn-pin" data-id="${n.id}" title="Pin" style="opacity:.6;padding:4px 7px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>
              <button class="btn btn-ghost btn-sm btn-del-note" data-id="${n.id}" title="Delete" style="opacity:.6;padding:4px 7px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </div>
          </div>`;
        }).join('') : `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No notes yet</div>
          <div class="empty-desc">Click "+ New Note" to get started</div>
        </div>`}
      </div>
      <div id="note-editor" style="display:none"></div>
    `;

    el.querySelectorAll('.note-card').forEach(c => {
      c.addEventListener('click', e => { if (e.target.closest('button')) return; openEditor(c.dataset.id); });
    });
    el.querySelectorAll('.btn-del-note').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      save(load().filter(n => n.id !== b.dataset.id));
      render(); toast('Note deleted');
    }));
    el.querySelectorAll('.btn-pin').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const notes = load(); const n = notes.find(x => x.id === b.dataset.id);
      if (n) { n.pinned = !n.pinned; save(notes); render(); }
    }));
    document.getElementById('btn-new-note').addEventListener('click', () => openEditor(null));
    document.getElementById('notes-search').addEventListener('input', render);
  }

  function openEditor(id) {
    const notes = load();
    let note = id ? notes.find(n => n.id === id) : null;
    const isNew = !note;
    if (!note) note = { id:uid(), title:'', body:'', color:COLORS[0].bg, pinned:false, created:Date.now(), updated:Date.now() };

    const editorEl = document.getElementById('note-editor');
    const gridEl   = document.getElementById('notes-grid');
    const hdrEl    = el.querySelector('.panel-header');
    gridEl.style.display = 'none';
    hdrEl.style.display  = 'none';
    editorEl.style.display = 'block';

    editorEl.innerHTML = `
      <div style="max-width:740px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btn-back-notes">← Back</button>
          <input id="edit-title" class="form-input" placeholder="Note title…"
            value="${esc(note.title)}"
            style="flex:1;font-weight:700;font-size:1rem;min-width:200px"/>
          <div style="display:flex;gap:6px;align-items:center">
            ${COLORS.map((c,i) => `
              <button class="color-pick" data-idx="${i}" title="${c.label}"
                style="width:22px;height:22px;border-radius:50%;background:${c.bg};
                       border:${note.color===c.bg?'2px solid #a5b4fc':'2px solid var(--border)'};
                       cursor:pointer;transition:transform .15s"
                onmouseover="this.style.transform='scale(1.2)'"
                onmouseout="this.style.transform=''">
              </button>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-export-note" title="Export as .txt"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg> Export</button>
          <button class="btn btn-primary" id="btn-save-note">Save</button>
        </div>
        <textarea id="edit-body" class="form-textarea" placeholder="Write your note here…"
          style="min-height:420px;font-size:.93rem;line-height:1.75;border-radius:12px;background:${note.color||COLORS[0].bg}">${esc(note.body)}</textarea>
        <div style="display:flex;justify-content:flex-end;gap:16px;margin-top:6px;font-size:.72rem;color:var(--text-3)">
          <span id="word-count">0 words</span>
          <span id="char-count">0 chars</span>
        </div>
      </div>
    `;

    // Store mutable color ref
    let currentColor = note.color || COLORS[0].bg;

    editorEl.querySelectorAll('.color-pick').forEach(b => {
      b.addEventListener('click', () => {
        currentColor = COLORS[+b.dataset.idx].bg;
        document.getElementById('edit-body').style.background = currentColor;
        editorEl.querySelectorAll('.color-pick').forEach(x => {
          x.style.border = x === b ? '2px solid #a5b4fc' : '2px solid var(--border)';
        });
      });
    });

    // Live word/char count
    function updateCount(){
      const body = document.getElementById('edit-body')?.value || '';
      const words = body.trim() ? body.trim().split(/\s+/).length : 0;
      const chars = body.length;
      const wEl = document.getElementById('word-count');
      const cEl = document.getElementById('char-count');
      if(wEl) wEl.textContent = words + ' word' + (words!==1?'s':'');
      if(cEl) cEl.textContent = chars + ' char' + (chars!==1?'s':'');
    }
    document.getElementById('edit-body').addEventListener('input', updateCount);
    updateCount();

    document.getElementById('btn-back-notes').addEventListener('click', render);

    document.getElementById('btn-export-note')?.addEventListener('click', () => {
      const title = document.getElementById('edit-title').value || 'note';
      const body  = document.getElementById('edit-body').value;
      const blob  = new Blob([`${title}\n${'='.repeat(title.length)}\n\n${body}`], {type:'text/plain'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = title.replace(/[^a-z0-9]/gi,'_').toLowerCase() + '.txt';
      a.click();
      toast('Note exported ✓', 'success');
    });

    document.getElementById('btn-save-note').addEventListener('click', () => {
      note.title   = document.getElementById('edit-title').value;
      note.body    = document.getElementById('edit-body').value;
      note.color   = currentColor;
      note.updated = Date.now();
      const existing = load();
      const idx = existing.findIndex(n => n.id === note.id);
      if (idx >= 0) existing[idx] = note; else existing.unshift(note);
      save(existing);
      render();
      toast('Note saved ✓', 'success');
    });
  }

  render();
})();
