// Reminders — Dark Theme
(function(){
  const el = document.getElementById('panel-reminders');

  function load(){ return Store.get('reminders', []); }
  function save(r){ Store.set('reminders', r); }

  if(Notification.permission==='default') Notification.requestPermission();

  // Background poll every 30s
  setInterval(()=>{
    const now = Date.now();
    const reminders = load();
    let changed = false;
    reminders.forEach(r=>{
      if(!r.done && r.at && Date.parse(r.at) <= now){
        r.done=true; changed=true;
        if(Notification.permission==='granted'){
          new Notification('TaskNexus Reminder', { body: r.text, icon: 'favicon.ico' });
        } else {
          toast(`⏰ ${r.text}`, 'warning', 6000);
        }
      }
    });
    if(changed){ save(reminders); renderList(); }
  }, 30000);

  function renderList(){
    const reminders = load();
    const list = document.getElementById('reminder-list');
    if(!list) return;
    const sorted = [...reminders].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    list.innerHTML = sorted.length ? sorted.map(r=>{
      const isPast = r.done || (r.at && Date.parse(r.at) <= Date.now());
      return `
      <div class="card" style="margin-bottom:8px;display:flex;align-items:center;gap:12px;opacity:${r.done?'.4':'1'}">
        <input type="checkbox" class="reminder-check" data-id="${r.id}" ${r.done?'checked':''}
          style="width:17px;height:17px;cursor:pointer;flex-shrink:0"/>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.9rem;text-decoration:${r.done?'line-through':'none'};color:var(--text)">${esc(r.text)}</div>
          ${r.at?`<div style="font-size:.72rem;margin-top:3px;color:${isPast&&!r.done?'#fca5a5':'var(--text-3)'}">
            ${isPast&&!r.done?'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Past due: ':''}${new Date(r.at).toLocaleString()}
          </div>`:'<div style="font-size:.72rem;color:var(--text-4);margin-top:3px">No time set</div>'}
        </div>
        ${r.repeat?`<span class="badge badge-purple">🔁 ${r.repeat}</span>`:''}
        <button class="btn btn-ghost btn-sm rem-del" data-id="${r.id}" style="opacity:.5"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </div>`;
    }).join('') : `<div class="empty-state" style="padding:40px 0"><div class="empty-icon"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></div><div class="empty-title">No reminders yet</div><div class="empty-desc">Set a reminder to get notified</div></div>`;

    list.querySelectorAll('.reminder-check').forEach(cb=>cb.addEventListener('change',()=>{
      const rs=load(); const r=rs.find(x=>x.id===cb.dataset.id);
      if(r){ r.done=cb.checked; save(rs); renderList(); }
    }));
    list.querySelectorAll('.rem-del').forEach(b=>b.addEventListener('click',()=>{
      save(load().filter(r=>r.id!==b.dataset.id)); renderList(); toast('Reminder removed');
    }));
  }

  function render(){
    el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">Reminders</h1><p class="panel-desc">Browser notifications at the right time.</p></div>

    ${Notification.permission==='denied'?`<div class="card" style="background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.3);margin-bottom:16px;display:flex;gap:10px;align-items:center">
      <span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>️</span>
      <span style="font-size:.84rem;color:var(--warning)">Notifications are blocked. Enable them in your browser settings for alerts to work.</span>
    </div>`:''}

    <div class="card" style="margin-bottom:18px">
      <div style="font-weight:700;margin-bottom:14px;font-family:var(--font-display);letter-spacing:-.02em">New Reminder</div>
      <div class="form-group">
        <label class="form-label">What to remind you about</label>
        <input id="rem-text" class="form-input" placeholder="Meeting with team, Take medication…"/>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <div class="form-group" style="flex:1;margin:0">
          <label class="form-label">Date & Time</label>
          <input id="rem-at" type="datetime-local" class="form-input"/>
        </div>
        <div class="form-group" style="flex:1;margin:0">
          <label class="form-label">Repeat</label>
          <select id="rem-repeat" class="form-select">
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${[5,15,30,60].map(m=>`<button class="btn btn-secondary btn-sm btn-pill quick-time" data-min="${m}">+${m}m</button>`).join('')}
        <button class="btn btn-secondary btn-sm btn-pill quick-time" data-min="1440">+1d</button>
        <button class="btn btn-primary" id="btn-add-rem" style="margin-left:auto">Set Reminder</button>
      </div>
    </div>

    <div id="reminder-list"></div>`;

    el.querySelectorAll('.quick-time').forEach(b=>b.addEventListener('click',()=>{
      const d=new Date(Date.now()+parseInt(b.dataset.min)*60000);
      document.getElementById('rem-at').value=d.toISOString().slice(0,16);
    }));
    document.getElementById('btn-add-rem').addEventListener('click', addReminder);
    document.getElementById('rem-text').addEventListener('keydown', e=>e.key==='Enter'&&addReminder());
    renderList();
  }

  function addReminder(){
    const text = document.getElementById('rem-text').value.trim();
    if(!text){ toast('Enter reminder text','error'); return; }
    const rs = load();
    rs.push({ id:uid(), text, at:document.getElementById('rem-at').value,
              repeat:document.getElementById('rem-repeat').value, done:false, created:Date.now() });
    save(rs);
    document.getElementById('rem-text').value='';
    document.getElementById('rem-at').value='';
    renderList(); toast('Reminder set ✓','success');
  }

  render();
})();
