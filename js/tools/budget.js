// Budget Tracker — Dark Theme
(function(){
  const el = document.getElementById('panel-budget');
  let filter = 'all';

  function load(){ return Store.get('budget_tx', []); }
  function save(t){ Store.set('budget_tx', t); }

  const CATEGORIES = ['🍕 Food','🏠 Housing','🚗 Transport','🎮 Entertainment','💊 Health','📚 Education','💼 Work','🛍 Shopping','💡 Utilities','📦 Other'];

  function totals(tx){
    const income  = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return { income, expense, balance: income - expense };
  }

  function render(){
    const tx = load();
    const visible = filter==='all' ? tx : tx.filter(t=>t.type===filter);
    const {income, expense, balance} = totals(tx);

    // Category breakdown for expenses
    const catMap = {};
    tx.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+t.amount; });
    const catEntries = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxCat = catEntries[0]?.[1] || 1;

    el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">Budget Tracker</h1><p class="panel-desc">Track income, expenses and category breakdowns.</p></div>

    <div class="grid-3" style="margin-bottom:18px">
      <div class="card" style="text-align:center;background:rgba(34,197,94,0.12);border-color:rgba(34,197,94,0.25)">
        <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(34,197,94,.7);font-weight:700;margin-bottom:6px">Income</div>
        <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:900;color:var(--success);letter-spacing:-.02em">$${income.toFixed(2)}</div>
      </div>
      <div class="card" style="text-align:center;background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.25)">
        <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(239,68,68,.7);font-weight:700;margin-bottom:6px">Expenses</div>
        <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:900;color:var(--danger);letter-spacing:-.02em">$${expense.toFixed(2)}</div>
      </div>
      <div class="card" style="text-align:center;background:${balance>=0?'rgba(79,70,229,0.12)':'rgba(239,68,68,0.1)'};border-color:${balance>=0?'rgba(79,70,229,0.25)':'rgba(239,68,68,0.2)'}">
        <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:${balance>=0?'rgba(165,180,252,.8)':'rgba(252,165,165,.7)'};font-weight:700;margin-bottom:6px">Balance</div>
        <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:900;color:${balance>=0?'#a5b4fc':'#fca5a5'};letter-spacing:-.02em">${balance>=0?'+':''}$${balance.toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2" style="align-items:start;gap:16px">
      <!-- Add transaction -->
      <div class="card">
        <div style="font-weight:700;margin-bottom:14px;font-family:var(--font-display);letter-spacing:-.02em">Add Transaction</div>
        <div style="display:flex;gap:6px;margin-bottom:12px">
          <button class="btn btn-sm ${filter!=='expense'?'btn-secondary':'btn-success'} tx-type-btn" data-t="income" style="flex:1">+ Income</button>
          <button class="btn btn-sm ${filter!=='income'?'btn-secondary':'btn-danger'} tx-type-btn" data-t="expense" style="flex:1">− Expense</button>
        </div>
        <input id="tx-desc" class="form-input" placeholder="Description…" style="margin-bottom:8px"/>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="tx-amount" type="number" class="form-input" placeholder="0.00" min="0" step="0.01" style="flex:1"/>
          <input id="tx-date" type="date" class="form-input" style="flex:1"/>
        </div>
        <select id="tx-category" class="form-select" style="margin-bottom:12px">
          ${CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
        <input type="hidden" id="tx-type" value="expense"/>
        <button class="btn btn-primary" style="width:100%" id="btn-add-tx">Add Transaction</button>
      </div>

      <!-- Category chart -->
      <div class="card">
        <div style="font-weight:700;margin-bottom:14px;font-family:var(--font-display);letter-spacing:-.02em">Top Expenses</div>
        ${catEntries.length ? catEntries.map(([cat,amt])=>`
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px">
              <span style="color:var(--text-2)">${esc(cat)}</span>
              <span style="font-weight:700;color:var(--text)">$${amt.toFixed(2)}</span>
            </div>
            <div style="height:6px;background:var(--surface-3);border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${Math.round(amt/maxCat*100)}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:4px"></div>
            </div>
          </div>`).join('')
          : `<div class="empty-state" style="padding:30px 0"><div class="empty-icon">💳</div><div class="empty-title">No expenses yet</div></div>`}
      </div>
    </div>

    <!-- Transaction history -->
    <div class="card" style="margin-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <span style="font-weight:700;font-family:var(--font-display);letter-spacing:-.02em">Transactions</span>
        <div style="display:flex;gap:6px">
          <div class="tabs" style="margin:0">
            ${['all','income','expense'].map(f=>`<button class="tab-btn${filter===f?' active':''}" data-f="${f}">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join('')}
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-csv"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg> CSV</button>
        </div>
      </div>
      <div style="max-height:320px;overflow-y:auto">
        ${visible.length ? `<table style="width:100%;border-collapse:collapse;font-size:.82rem">
          <thead><tr>
            ${['Date','Description','Category','Type','Amount',''].map(h=>`<th style="padding:8px 10px;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border-2)">${h}</th>`).join('')}
          </tr></thead>
          <tbody>${[...visible].reverse().map(t=>`
            <tr style="border-bottom:1px solid var(--border-2)">
              <td style="padding:9px 10px;color:var(--text-3);white-space:nowrap">${fmtDate(t.date||t.created)}</td>
              <td style="padding:9px 10px;color:var(--text);font-weight:500">${esc(t.desc)}</td>
              <td style="padding:9px 10px;color:var(--text-3)">${esc(t.category)}</td>
              <td style="padding:9px 10px"><span class="badge ${t.type==='income'?'badge-green':'badge-red'}">${t.type}</span></td>
              <td style="padding:9px 10px;font-weight:700;font-family:var(--font-display);color:${t.type==='income'?'#86efac':'#fca5a5'}">${t.type==='income'?'+':'-'}$${t.amount.toFixed(2)}</td>
              <td style="padding:9px 10px"><button class="btn btn-ghost btn-sm tx-del" data-id="${t.id}" style="opacity:.5"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></td>
            </tr>`).join('')}
          </tbody>
        </table>` : `<div class="empty-state" style="padding:40px 0"><div class="empty-icon">💳</div><div class="empty-title">No transactions</div></div>`}
      </div>
    </div>`;

    el.querySelectorAll('.tab-btn[data-f]').forEach(b => b.addEventListener('click',()=>{ filter=b.dataset.f; render(); }));
    el.querySelectorAll('.tx-type-btn').forEach(b => b.addEventListener('click',()=>{
      document.getElementById('tx-type').value = b.dataset.t;
      el.querySelectorAll('.tx-type-btn').forEach(x => x.classList.replace('btn-primary','btn-secondary'));
      b.classList.replace('btn-secondary', 'btn-primary');
    }));
    document.getElementById('btn-add-tx').addEventListener('click', addTx);
    document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
    el.querySelectorAll('.tx-del').forEach(b => b.addEventListener('click',()=>{
      save(load().filter(t=>t.id!==b.dataset.id)); render(); toast('Deleted');
    }));
  }

  function addTx(){
    const desc   = document.getElementById('tx-desc').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type   = document.getElementById('tx-type').value;
    if (!desc || isNaN(amount) || amount <= 0) { toast('Fill in description & valid amount','error'); return; }
    const tx = load();
    tx.push({ id:uid(), desc, amount, type, category:document.getElementById('tx-category').value,
              date:document.getElementById('tx-date').value, created:Date.now() });
    save(tx);
    document.getElementById('tx-desc').value = '';
    document.getElementById('tx-amount').value = '';
    render(); toast(`${type==='income'?'Income':'Expense'} added ✓`, 'success');
  }

  function exportCSV(){
    const tx = load();
    const csv = ['Date,Description,Category,Type,Amount',
      ...tx.map(t=>`${fmtDate(t.date||t.created)},${t.desc},${t.category},${t.type},${t.amount.toFixed(2)}`)].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'budget.csv'; a.click(); toast('CSV exported ✓','success');
  }

  render();
})();
