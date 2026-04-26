// Dashboard — Command Center
(function(){
  const el = document.getElementById('panel-dashboard');
  if(!el) return;

  function getStats(){
    const todos     = Store.get('todos',[]);
    const notes     = Store.get('notes',[]);
    const reminders = Store.get('reminders',[]);
    const tx        = Store.get('budget_tx',[]);
    const links     = Store.get('quicklinks',[]);
    const now       = Date.now();

    const todoPending  = todos.filter(t=>!t.done).length;
    const todoHigh     = todos.filter(t=>!t.done && t.priority==='high').length;
    const remDue       = reminders.filter(r=>!r.done && r.at && Date.parse(r.at)<=now).length;
    const remUpcoming  = reminders.filter(r=>!r.done && r.at && Date.parse(r.at)>now).length;
    const income  = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const balance = income - expense;

    return { todos, notes, reminders, tx, links, now,
             todoPending, todoHigh, remDue, remUpcoming,
             income, expense, balance, notesCount:notes.length };
  }

  function greet(){
    const h = new Date().getHours();
    if(h<12) return '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:6px;color:var(--primary)"><path d="M17 12h5M2 12h5M12 2v5M12 17v5M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54M19.07 4.93l-3.54 3.54M8.46 15.54l-3.54 3.54"></path></svg> Good morning';
    if(h<17) return '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:6px;color:var(--primary)"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Good afternoon';
    if(h<21) return '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:6px;color:var(--primary)"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Good evening';
    return '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:6px;color:var(--primary)"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Good night';
  }

  function render(){
    const s = getStats();
    const session = Auth.getSession();
    const name = session?.name?.split(' ')[0] || 'there';

    // Recent notes (last 3)
    const recentNotes = [...s.notes].sort((a,b)=>b.updated-a.updated).slice(0,3);
    // Upcoming reminders
    const upcomingRem = [...s.reminders].filter(r=>!r.done&&r.at&&Date.parse(r.at)>s.now)
                          .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(0,3);
    // High priority todos
    const urgentTodos = [...s.todos].filter(t=>!t.done&&t.priority==='high').slice(0,4);

    el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">${greet()}, ${esc(name)} </h1>
      <p class="panel-desc">Here's your TaskNexus overview — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
    </div>

    <!-- Stat Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
      ${statCard('<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--text-3)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>','Notes',s.notesCount,'notes','#a5b4fc', 0)}
      ${statCard('<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--success)"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>','Pending Tasks',s.todoPending,'todo', s.todoPending>0?'#fcd34d':'#86efac', 1)}
      ${statCard('<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>','Urgent',s.todoHigh,'todo','#fca5a5', 2)}
      ${statCard('<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--warning)"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>','Due Now',s.remDue,'reminders',s.remDue>0?'#f97316':'#86efac', 3)}
      ${statCard('<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--info)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>','Upcoming',s.remUpcoming,'reminders','#93c5fd', 4)}
      ${statCard('<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--success)"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>','Balance','$'+Math.abs(s.balance).toFixed(0),'budget',s.balance>=0?'#86efac':'#fca5a5', 5)}
    </div>

    <div class="grid-2" style="gap:16px; align-items: stretch">
      <!-- Urgent Tasks -->
      <div class="card dashboard-card stagger-1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-weight:700;font-family:var(--font-display);letter-spacing:-.02em"><svg class="urgent-pulse" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Urgent Tasks</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('todo')">View all →</button>
        </div>
        ${urgentTodos.length ? urgentTodos.map(t=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-2)">
            <span style="font-size:.75rem;opacity:.5"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></span>
            <span style="font-size:.86rem;flex:1;font-weight:500">${esc(t.title)}</span>
            ${t.due?`<span style="font-size:.7rem;color:var(--text-3)">${fmtDate(t.due)}</span>`:''}
          </div>`).join('')
        : `<div class="empty-state" style="padding:24px 0"><div class="empty-icon"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin:0 auto 10px;color:var(--text-4);display:block"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div><div class="empty-title">No urgent tasks!</div></div>`}
      </div>

      <!-- Upcoming Reminders -->
      <div class="card dashboard-card stagger-2">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-weight:700;font-family:var(--font-display);letter-spacing:-.02em"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--info)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> Upcoming</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('reminders')">View all →</button>
        </div>
        ${upcomingRem.length ? upcomingRem.map(r=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-2)">
            <span style="font-size:.75rem;opacity:.5"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--info)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
            <span style="font-size:.86rem;flex:1;font-weight:500">${esc(r.text)}</span>
            <span style="font-size:.7rem;color:var(--text-3)">${new Date(r.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
          </div>`).join('')
        : `<div class="empty-state" style="padding:24px 0"><div class="empty-icon"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin:0 auto 10px;color:var(--text-4);display:block"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><div class="empty-title">Nothing coming up</div></div>`}
      </div>

      <!-- Recent Notes -->
      <div class="card dashboard-card stagger-3">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-weight:700;font-family:var(--font-display);letter-spacing:-.02em"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--text-3)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Recent Notes</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('notes')">View all →</button>
        </div>
        ${recentNotes.length ? recentNotes.map(n=>`
          <div style="padding:10px 0;border-bottom:1px solid var(--border-2);cursor:pointer" onclick="navigate('notes')">
            <div style="font-size:.86rem;font-weight:600;margin-bottom:3px">${esc(n.title)||'Untitled'}</div>
            <div style="font-size:.75rem;color:var(--text-3)">${esc(n.body).slice(0,60)}${n.body.length>60?'…':''}</div>
          </div>`).join('')
        : `<div class="empty-state" style="padding:24px 0"><div class="empty-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--text-3)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><div class="empty-title">No notes yet</div></div>`}
      </div>

      <!-- Budget Snapshot -->
      <div class="card dashboard-card stagger-4">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-weight:700;font-family:var(--font-display);letter-spacing:-.02em"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--success)"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Budget Snapshot</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('budget')">Details →</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="text-align:center;padding:12px;background:rgba(34,197,94,.1);border-radius:10px;border:1px solid rgba(34,197,94,.2)">
            <div style="font-size:.65rem;color:rgba(134,239,172,.7);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Income</div>
            <div style="font-weight:800;color:var(--success);font-family:var(--font-display)">$${s.income.toFixed(0)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(239,68,68,.1);border-radius:10px;border:1px solid rgba(239,68,68,.2)">
            <div style="font-size:.65rem;color:rgba(252,165,165,.7);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Expenses</div>
            <div style="font-weight:800;color:var(--danger);font-family:var(--font-display)">$${s.expense.toFixed(0)}</div>
          </div>
        </div>
        <div style="height:8px;background:rgba(255,255,255,.07);border-radius:6px;overflow:hidden">
          <div style="height:100%;width:${s.income>0?Math.min(100,Math.round(s.expense/s.income*100)):0}%;background:linear-gradient(90deg,#86efac,#fca5a5);border-radius:6px;transition:width .6s"></div>
        </div>
        <div style="text-align:center;margin-top:10px;font-size:.8rem;color:${s.balance>=0?'#86efac':'#fca5a5'};font-weight:700">
          ${s.balance>=0?'Net savings':'Deficit'}: ${s.balance>=0?'+':''}$${s.balance.toFixed(2)}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card dashboard-card stagger-5" style="margin-top:16px">
      <div style="font-weight:700;font-family:var(--font-display);letter-spacing:-.02em;margin-bottom:14px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--warning)"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Quick Actions</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="navigate('todo')">+ Add Task</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('notes')"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--text-3)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> New Note</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('reminders')"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--info)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> Set Reminder</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('budget')"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle;margin-right:4px;color:var(--success)"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Add Expense</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('qrcode')">🔲 Make QR</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('calculator')">🧮 Calculator</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('timer')">⏱ Start Timer</button>
      </div>
    </div>`;
  }

  function statCard(icon, label, value, tool, color, index){
    // Stagger animation based on index
    const delay = index * 0.05 + 0.1;
    return `<div class="card dashboard-card" onclick="navigate('${tool}')" style="cursor:pointer;text-align:center;animation-delay:${delay}s" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='rgba(255,255,255,1)'" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor=''">
      <div style="font-size:1.5rem;margin-bottom:6px">${icon}</div>
      <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:900;color:${color};letter-spacing:-.02em">${value}</div>
      <div style="font-size:.68rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-top:4px;font-weight:700">${label}</div>
    </div>`;
  }

  render();
  // Refresh every 60s
  setInterval(()=>{ if(document.getElementById('panel-dashboard')?.classList.contains('active')) render(); }, 60000);
  
  // Refresh immediately when navigating back to the dashboard
  window.addEventListener('hashchange', () => {
    if(window.location.hash === '#dashboard') render();
  });
})();
