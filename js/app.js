// TaskNexus — App Router & Shared Utilities
const TOOL_NAMES = {
  dashboard:'Dashboard', notes:'Notes', todo:'To-Do', reminders:'Reminders', timer:'Timer',
  budget:'Budget Tracker', quicklinks:'Quick Links', calculator:'Calculator',
  converter:'Unit Converter', qrcode:'QR Generator',
  texttools:'Text Tools', devtools:'Dev Tools', datatesting:'Data Testing', rsstools:'RSS Feeds',
  generators:'Generators', seo:'SEO Tools', datetime:'Date & Time', network:'Network Tools', pdftools:'PDF Tools',
  codeeditor: 'Code Editor', aigen: 'AI Image Gen', signature: 'Signature Maker', pdfeditor: 'PDF Editor', jsxpreview: 'JSX Preview'
};

// ---- Router ----
let currentTool = 'notes';
function navigate(tool) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel-${tool}`);
  if (panel) panel.classList.add('active');
  document.getElementById('topbar-title').textContent = TOOL_NAMES[tool] || tool;
  currentTool = tool;
  window.location.hash = tool;
  updateBadges();
}

document.querySelectorAll('.nav-item[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.tool));
});

// Hash routing
const hash = window.location.hash.replace('#','');
if (hash && TOOL_NAMES[hash]) navigate(hash);
else navigate('dashboard');

/* ── Sidebar Toggle (Mobile) ── */
const menuBtn = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
if (menuBtn && sidebar) {
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  };
  // Close sidebar when clicking a nav item on mobile
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    });
  });
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== menuBtn) {
        sidebar.classList.remove('open');
      }
    }
  });
}

// ---- Storage ----
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem('tn_'+key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem('tn_'+key, JSON.stringify(value)); } catch {} },
};

// ---- Toast ----
function toast(msg, type = 'default', ms = 3000) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast${type !== 'default' ? ' '+type : ''}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(10px)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(), 300); }, ms);
}

// ---- Generate ID ----
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ---- Format date ----
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function fmtTime(d) { return new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); }

// ---- Escape HTML ----
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ---- Live sidebar badges ----
function updateBadges(){
  try {
    const todos     = Store.get('todos',[]);
    const reminders = Store.get('reminders',[]);
    const pending   = todos.filter(t=>!t.done).length;
    const due       = reminders.filter(r=>!r.done && r.at && Date.parse(r.at)<=Date.now()).length;

    const bTodo = document.getElementById('badge-todo');
    const bRem  = document.getElementById('badge-rem');
    if(bTodo){ bTodo.textContent=pending; bTodo.style.display=pending>0?'inline':'none'; }
    if(bRem) { bRem.textContent=due;     bRem.style.display=due>0?'inline':'none'; }
  } catch(e){}
}
updateBadges();
setInterval(updateBadges, 30000);

// ---- Global Search (Ctrl+K) ----
document.addEventListener('keydown', e => {
  // Ctrl+K or Cmd+K → focus search
  if ((e.ctrlKey||e.metaKey) && e.key==='k') {
    e.preventDefault();
    const inp = document.getElementById('global-search');
    if(inp){ inp.focus(); inp.select(); }
  }
  // Escape → clear search
  if (e.key==='Escape') {
    const inp = document.getElementById('global-search');
    if(inp && document.activeElement===inp){ inp.value=''; inp.blur(); clearSearch(); }
  }
  // Alt+number shortcuts
  if (e.altKey && !e.ctrlKey) {
    const tools = Object.keys(TOOL_NAMES);
    const n = parseInt(e.key);
    if (n >= 1 && n <= tools.length) { e.preventDefault(); navigate(tools[n-1]); }
  }
});

// ---- Functional global search ----
function doGlobalSearch(q){
  q = q.toLowerCase().trim();
  if (!q) { clearSearch(); return; }

  // Search across tool data
  const results = [];

  // Notes
  Store.get('notes',[]).forEach(n => {
    if(n.title.toLowerCase().includes(q)||n.body.toLowerCase().includes(q))
      results.push({icon:'📝', title:n.title||'Untitled Note', desc:n.body.slice(0,60), tool:'notes'});
  });

  // Todos
  Store.get('todos',[]).forEach(t => {
    if(t.title.toLowerCase().includes(q))
      results.push({icon:'✅', title:t.title, desc:(t.done?'Completed':'Pending')+' · '+t.priority, tool:'todo'});
  });

  // Reminders
  Store.get('reminders',[]).forEach(r => {
    if(r.text.toLowerCase().includes(q))
      results.push({icon:'🔔', title:r.text, desc:r.at?new Date(r.at).toLocaleString():'No time set', tool:'reminders'});
  });

  // Budget
  Store.get('budget_tx',[]).forEach(t => {
    if(t.desc.toLowerCase().includes(q)||t.category.toLowerCase().includes(q))
      results.push({icon:t.type==='income'?'💚':'💸', title:t.desc, desc:`$${t.amount.toFixed(2)} · ${t.category}`, tool:'budget'});
  });

  // Quick Links
  Store.get('quicklinks',[]).forEach(l => {
    if(l.label.toLowerCase().includes(q)||l.url.toLowerCase().includes(q))
      results.push({icon:'🔗', title:l.label, desc:l.url, tool:'quicklinks'});
  });

  // Tool names
  Object.entries(TOOL_NAMES).forEach(([id,name]) => {
    if(name.toLowerCase().includes(q))
      results.push({icon:'🔧', title:'Open '+name, desc:'Navigate to tool', tool:id});
  });

  showSearchResults(results.slice(0,8));
}

function showSearchResults(results){
  let drop = document.getElementById('search-dropdown');
  if(!drop){
    drop = document.createElement('div');
    drop.id = 'search-dropdown';
    drop.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;right:0;background:var(--surface-2);border:1px solid var(--border-2);border-radius:12px;overflow:hidden;z-index:1000;box-shadow:0 16px 40px rgba(0,0,0,.5)';
    document.querySelector('.topbar-search').style.position='relative';
    document.querySelector('.topbar-search').appendChild(drop);
  }
  if(!results.length){ drop.innerHTML=`<div style="padding:14px;text-align:center;font-size:.82rem;color:var(--text-3)">No results found</div>`; return; }
  drop.innerHTML = results.map((r,i)=>`
    <div class="search-result-item" data-tool="${r.tool}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-2);transition:background .15s" onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background=''">
      <span style="font-size:1.1rem">${r.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:.84rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
        <div style="font-size:.71rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.desc)}</div>
      </div>
      <span style="font-size:.65rem;color:var(--text-4);background:var(--surface-3);padding:2px 8px;border-radius:20px">${TOOL_NAMES[r.tool]||r.tool}</span>
    </div>`).join('');
  drop.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => { navigate(item.dataset.tool); clearSearch(); });
  });
}

function clearSearch(){
  document.getElementById('search-dropdown')?.remove();
}

const searchInp = document.getElementById('global-search');
if(searchInp){
  searchInp.addEventListener('input', e => doGlobalSearch(e.target.value));
  document.addEventListener('click', e => {
    if(!e.target.closest('.topbar-search')) clearSearch();
  });
}

// expose globals
window.Store = Store;
window.toast = toast;
window.uid = uid;
window.fmtDate = fmtDate;
window.fmtTime = fmtTime;
window.esc = esc;
window.navigate = navigate;
window.updateBadges = updateBadges;
