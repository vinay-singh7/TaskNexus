// To-Do Tool — Enhanced
(function(){
  const el = document.getElementById('panel-todo');
  const PRIORITIES = { high:'🔴 High', medium:'🟡 Medium', low:'🟢 Low' };
  const PBADGE = { high:'badge-red', medium:'badge-yellow', low:'badge-green' };
  const CATS = ['Work','Personal','Health','Shopping','Learning','Finance','Home','Other'];
  let filter = 'all';
  let catFilter = '';
  let editingId = null;

  function load(){ return Store.get('todos', []); }
  function save(t){ Store.set('todos', t); updateBadges?.(); }

  function render(){
    const todos = load();
    let vis = filter === 'all' ? todos : todos.filter(t => filter === 'active' ? !t.done : t.done);
    if(catFilter) vis = vis.filter(t => t.category === catFilter);
    const done = todos.filter(t => t.done).length;
    const pct  = todos.length ? Math.round(done / todos.length * 100) : 0;
    const sorted = [...vis].sort((a,b) => {
      const o = {high:0, medium:1, low:2};
      return (a.done - b.done) || (o[a.priority] - o[b.priority]) || (a.created - b.created);
    });

    // Category usage
    const usedCats = [...new Set(todos.map(t=>t.category).filter(Boolean))];

    el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">To-Do</h1>
      <p class="panel-desc">Tasks with priorities, categories, due dates &amp; progress.</p>
    </div>

    <!-- Add Task -->
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
        <input id="todo-input" class="form-input" placeholder="What needs to be done?" style="flex:1;min-width:200px"/>
        <select id="todo-priority" class="form-select" style="width:130px">
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
          <option value="low">🟢 Low</option>
        </select>
        <select id="todo-cat" class="form-select" style="width:130px">
          <option value=""><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> Category</option>
          ${CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
        <input id="todo-due" type="date" class="form-input" style="width:155px"/>
        <button class="btn btn-primary" id="btn-add-todo">Add Task</button>
      </div>
      <div id="todo-note-row" style="margin-top:8px">
        <input id="todo-note" class="form-input" placeholder="Optional note…" style="font-size:.8rem"/>
      </div>
    </div>

    <!-- Filters -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <div class="tabs">
          ${['all','active','completed'].map(f=>`<button class="tab-btn${filter===f?' active':''}" data-f="${f}">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join('')}
        </div>
        ${usedCats.map(c=>`<button class="btn btn-sm ${catFilter===c?'btn-primary':'btn-secondary'} btn-pill cat-filter-btn" data-cat="${c}">${c}</button>`).join('')}
        ${catFilter?`<button class="btn btn-sm btn-ghost btn-pill" id="btn-clear-cat">✕ Clear</button>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:.8rem;color:var(--text-3)">${done}/${todos.length} · <span style="color:var(--text-2);font-weight:700">${pct}%</span></span>
        ${done>0?`<button class="btn btn-ghost btn-sm" id="btn-clear-done" style="opacity:.6">Clear done</button>`:''}
      </div>
    </div>

    <!-- Progress bar -->
    <div style="height:5px;background:var(--surface-3);border-radius:4px;margin-bottom:16px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:4px;transition:width .4s var(--ease-cinematic)"></div>
    </div>

    <!-- Task list -->
    <div id="todo-list">
      ${sorted.length ? sorted.map(t => renderTask(t, editingId===t.id)).join('')
        : `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No tasks here</div><div class="empty-desc">Add a task above to get started</div></div>`}
    </div>`;

    // Events
    el.querySelectorAll('.tab-btn[data-f]').forEach(b => b.addEventListener('click', () => { filter=b.dataset.f; render(); }));
    el.querySelectorAll('.cat-filter-btn').forEach(b => b.addEventListener('click', () => { catFilter=catFilter===b.dataset.cat?'':b.dataset.cat; render(); }));
    document.getElementById('btn-clear-cat')?.addEventListener('click', () => { catFilter=''; render(); });
    document.getElementById('btn-clear-done')?.addEventListener('click', () => { save(load().filter(t=>!t.done)); render(); toast('Completed tasks cleared'); });
    document.getElementById('btn-add-todo').addEventListener('click', addTodo);
    document.getElementById('todo-input').addEventListener('keydown', e => e.key==='Enter' && addTodo());

    el.querySelectorAll('.todo-check').forEach(cb => cb.addEventListener('change', () => {
      const ts=load(); const t=ts.find(x=>x.id===cb.dataset.id);
      if(t){ t.done=cb.checked; save(ts); render(); }
    }));
    el.querySelectorAll('.todo-del').forEach(b => b.addEventListener('click', () => {
      save(load().filter(x=>x.id!==b.dataset.id)); render(); toast('Task removed');
    }));
    el.querySelectorAll('.todo-edit-btn').forEach(b => b.addEventListener('click', () => {
      editingId = editingId===b.dataset.id ? null : b.dataset.id; render();
    }));
    el.querySelectorAll('.todo-save-edit').forEach(b => b.addEventListener('click', () => {
      const ts=load(); const t=ts.find(x=>x.id===b.dataset.id);
      if(t){
        t.title    = document.getElementById(`edit-title-${t.id}`).value.trim() || t.title;
        t.priority = document.getElementById(`edit-pri-${t.id}`).value;
        t.due      = document.getElementById(`edit-due-${t.id}`).value;
        t.note     = document.getElementById(`edit-note-${t.id}`)?.value || '';
        save(ts);
      }
      editingId=null; render(); toast('Task updated ✓','success');
    }));
  }

  function renderTask(t, isEditing){
    const overdue = t.due && !t.done && new Date(t.due) < new Date();
    if(isEditing){
      return `
      <div class="card" style="margin-bottom:8px;border-color:rgba(165,180,252,.3);background:rgba(79,70,229,.06)">
        <div style="font-size:.72rem;color:var(--accent);font-weight:700;margin-bottom:10px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Editing task</div>
        <input id="edit-title-${t.id}" class="form-input" value="${esc(t.title)}" style="margin-bottom:8px"/>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <select id="edit-pri-${t.id}" class="form-select" style="flex:1">
            ${['high','medium','low'].map(p=>`<option value="${p}" ${t.priority===p?'selected':''}>${PRIORITIES[p]}</option>`).join('')}
          </select>
          <input id="edit-due-${t.id}" type="date" class="form-input" value="${t.due||''}" style="flex:1"/>
        </div>
        <input id="edit-note-${t.id}" class="form-input" placeholder="Note…" value="${esc(t.note||'')}" style="font-size:.8rem;margin-bottom:10px"/>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm todo-save-edit" data-id="${t.id}">Save</button>
          <button class="btn btn-ghost btn-sm todo-edit-btn" data-id="${t.id}">Cancel</button>
        </div>
      </div>`;
    }
    return `
    <div class="card" style="margin-bottom:8px;display:flex;align-items:flex-start;gap:12px;opacity:${t.done?'.45':'1'};transition:opacity .2s">
      <input type="checkbox" ${t.done?'checked':''} class="todo-check" data-id="${t.id}" style="margin-top:3px;width:17px;height:17px;cursor:pointer;flex-shrink:0"/>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.9rem;text-decoration:${t.done?'line-through':'none'};color:var(--text);line-height:1.4">${esc(t.title)}</div>
        ${t.note?`<div style="font-size:.75rem;color:var(--text-3);margin-top:3px">${esc(t.note)}</div>`:''}
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center">
          <span class="badge ${PBADGE[t.priority]}">${PRIORITIES[t.priority]}</span>
          ${t.category?`<span class="badge" style="background:rgba(79,70,229,.15);border-color:rgba(79,70,229,.25);color:var(--accent)"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> ${esc(t.category)}</span>`:''}
          ${t.due?`<span class="badge ${overdue?'badge-red':'badge-blue'}">${overdue?'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Overdue: ':'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> '}${fmtDate(t.due)}</span>`:''}
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm todo-edit-btn" data-id="${t.id}" title="Edit" style="opacity:.5;padding:4px 7px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
        <button class="btn btn-ghost btn-sm todo-del" data-id="${t.id}" title="Delete" style="opacity:.5;padding:4px 7px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </div>
    </div>`;
  }

  function addTodo(){
    const inp = document.getElementById('todo-input');
    const title = inp.value.trim();
    if (!title) { toast('Enter a task', 'error'); return; }
    const ts = load();
    ts.unshift({ id:uid(), title,
      priority:document.getElementById('todo-priority').value,
      category:document.getElementById('todo-cat').value,
      due:document.getElementById('todo-due').value,
      note:document.getElementById('todo-note').value.trim(),
      done:false, created:Date.now() });
    save(ts); inp.value='';
    document.getElementById('todo-note').value='';
    render(); toast('Task added ✓', 'success');
  }

  render();
})();
