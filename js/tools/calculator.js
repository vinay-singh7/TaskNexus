// Calculator — Dark Theme
(function(){
  const el = document.getElementById('panel-calculator');
  let expr = ''; let history = []; let mode = 'standard';

  function render(){
    el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">Calculator</h1><p class="panel-desc">Standard, scientific, and expression evaluator.</p></div>
    <div style="max-width:460px;margin:0 auto">
      <div class="tabs" style="margin-bottom:16px;overflow-x:auto;white-space:nowrap;padding-bottom:4px">
        ${['standard','scientific','expression','financial'].map(m=>`<button class="tab-btn${mode===m?' active':''}" data-m="${m}" style="flex-shrink:0">${m.charAt(0).toUpperCase()+m.slice(1)}</button>`).join('')}
      </div>
      <div class="card" style="padding:0;overflow:hidden;background:var(--surface-3);border-color:var(--border)">
        <!-- Display -->
        <div style="padding:20px 20px 12px;background:var(--surface-2);border-bottom:1px solid var(--border-2)">
          <div id="calc-expr" style="font-size:.78rem;color:var(--text-3);min-height:18px;font-family:var(--font-mono);text-align:right;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(expr) || '&nbsp;'}</div>
          <div id="calc-display" style="font-family:var(--font-display);font-size:2.4rem;font-weight:900;text-align:right;letter-spacing:-.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-height:52px">0</div>
        </div>

        ${mode === 'expression' ? `
        <div style="padding:16px">
          <textarea id="expr-input" class="form-textarea form-mono" style="min-height:80px;background:var(--surface-2);margin-bottom:10px" placeholder="Math.PI * 5**2  or  sin(30)*180/Math.PI"></textarea>
          <button class="btn btn-primary" style="width:100%" id="btn-eval">Evaluate ↵</button>
          <div id="expr-result" style="margin-top:12px;padding:12px;background:var(--surface-2);border-radius:8px;font-family:var(--font-mono);font-size:.85rem;min-height:40px;color:var(--text-2)"></div>
        </div>` : mode === 'financial' ? `
        <div style="padding:16px;max-height:400px;overflow-y:auto">
          <label class="form-label">Calculator Type</label>
          <select id="fin-type" class="form-input" style="width:100%;margin-bottom:16px">
            <option value="si">Simple Interest</option>
            <option value="ci">Compound Interest</option>
            <option value="emi">EMI Calculator</option>
            <option value="roi">Return on Investment (ROI)</option>
          </select>
          <div id="fin-inputs" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px"></div>
          <button class="btn btn-primary" style="width:100%" id="btn-fin-calc">Calculate</button>
          <div id="fin-result" style="margin-top:16px;padding:16px;background:var(--surface-2);border-radius:8px;text-align:center;display:none"></div>
        </div>` : `
        <!-- Button grid -->
        <div style="display:grid;grid-template-columns:${mode==='scientific'?'repeat(5,1fr)':'repeat(4,1fr)'};gap:1px;background:var(--border-2)">
          ${getButtons().map(b=>`
            <button class="calc-btn" data-val="${esc(b.val)}" style="
              padding:${mode==='scientific'?'13px':'18px'} 0;font-size:${mode==='scientific'?'.78rem':'1rem'};
              font-family:var(--font-display);font-weight:700;
              background:${b.cls==='op'?'rgba(79,70,229,0.2)':b.cls==='fn'?'var(--surface-3)':'rgba(0,0,0,0.15)'};
              color:${b.cls==='op'?'#a5b4fc':b.cls==='eq'?'white':'var(--text)'};
              border:none;cursor:pointer;
              border-radius:0;
              transition:background .15s;
            ${b.cls==='eq'?'background:linear-gradient(135deg,var(--primary),var(--accent));grid-column:span 1;':''}"
            onmouseover="this.style.filter='brightness(1.2)'"
            onmouseout="this.style.filter=''">
              ${esc(b.label||b.val)}
            </button>`).join('')}
        </div>`}
      </div>

      ${history.length ? `
      <div class="card" style="margin-top:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:.72rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.1em">History</span>
          <button class="btn btn-ghost btn-sm" id="btn-clear-hist" style="font-size:.72rem">Clear</button>
        </div>
        ${history.slice(-6).reverse().map(h=>`
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-2);font-size:.82rem;cursor:pointer;color:var(--text-2)" onclick="navigator.clipboard.writeText('${h.result}');toast('Copied!','success')">
            <span style="font-family:var(--font-mono);color:var(--text-3)">${esc(h.expr)}</span>
            <span style="font-weight:700;font-family:var(--font-mono);color:var(--text)">${esc(h.result)}</span>
          </div>`).join('')}
      </div>` : ''}
    </div>`;

    el.querySelectorAll('.tab-btn[data-m]').forEach(b => b.addEventListener('click',()=>{ mode=b.dataset.m; expr=''; render(); }));

    if (mode === 'expression') {
      document.getElementById('btn-eval').addEventListener('click', () => {
        const input = document.getElementById('expr-input').value;
        try {
          const result = Function(`'use strict'; const {sin,cos,tan,sqrt,log,abs,floor,ceil,round,pow,PI,E}=Math; return (${input})`)();
          document.getElementById('expr-result').innerHTML = `<span style="color:var(--success);font-weight:700">${result}</span>`;
          history.push({expr:input, result:String(result)}); render();
        } catch(e) {
          document.getElementById('expr-result').innerHTML = `<span style="color:var(--danger)">Error: ${esc(e.message)}</span>`;
        }
      });
    } else if (mode === 'financial') {
      const typeSel = document.getElementById('fin-type');
      const inps = document.getElementById('fin-inputs');
      const btn = document.getElementById('btn-fin-calc');
      const res = document.getElementById('fin-result');
      
      const config = {
        si: '<input type="number" id="f-p" class="form-input" placeholder="Principal Amount"/><input type="number" id="f-r" class="form-input" placeholder="Annual Rate (%)"/><input type="number" id="f-t" class="form-input" placeholder="Time (Years)"/>',
        ci: '<input type="number" id="f-p" class="form-input" placeholder="Principal Amount"/><input type="number" id="f-r" class="form-input" placeholder="Annual Rate (%)"/><input type="number" id="f-t" class="form-input" placeholder="Time (Years)"/><select id="f-n" class="form-input"><option value="1">Annually</option><option value="12">Monthly</option><option value="4">Quarterly</option></select>',
        emi: '<input type="number" id="f-p" class="form-input" placeholder="Loan Amount"/><input type="number" id="f-r" class="form-input" placeholder="Annual Rate (%)"/><input type="number" id="f-t" class="form-input" placeholder="Tenure (Months)"/>',
        roi: '<input type="number" id="f-i" class="form-input" placeholder="Amount Invested"/><input type="number" id="f-v" class="form-input" placeholder="Amount Returned"/>'
      };

      // restore type
      if (window._tn_finType) typeSel.value = window._tn_finType;
      inps.innerHTML = config[typeSel.value];

      typeSel.addEventListener('change', () => {
        window._tn_finType = typeSel.value;
        inps.innerHTML = config[typeSel.value];
        res.style.display = 'none';
      });

      btn.addEventListener('click', () => {
        const v = id => parseFloat(document.getElementById(id)?.value) || 0;
        const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
        let out = '';
        
        if (typeSel.value === 'si') {
          const i = (v('f-p') * v('f-r') * v('f-t')) / 100;
          out = `<div style="font-size:0.8rem;color:var(--text-3);text-transform:uppercase">Interest</div><div style="font-size:1.6rem;color:var(--primary);font-weight:900;margin-bottom:8px">${fmt(i)}</div><div style="font-size:0.8rem;color:var(--text-3)">Total Amount: <span style="color:var(--text)">${fmt(v('f-p')+i)}</span></div>`;
        } else if (typeSel.value === 'ci') {
          const p=v('f-p'), r=v('f-r')/100, t=v('f-t'), n=v('f-n');
          const a = p * Math.pow(1 + (r/n), n*t);
          out = `<div style="font-size:0.8rem;color:var(--text-3);text-transform:uppercase">Total Amount</div><div style="font-size:1.6rem;color:var(--primary);font-weight:900;margin-bottom:8px">${fmt(a)}</div><div style="font-size:0.8rem;color:var(--text-3)">Interest Earned: <span style="color:var(--text)">${fmt(a-p)}</span></div>`;
        } else if (typeSel.value === 'emi') {
          const p=v('f-p'), r=(v('f-r')/12)/100, n=v('f-t');
          const emi = p * r * (Math.pow(1+r, n) / (Math.pow(1+r, n) - 1));
          out = `<div style="font-size:0.8rem;color:var(--text-3);text-transform:uppercase">Monthly EMI</div><div style="font-size:1.6rem;color:var(--warning);font-weight:900;margin-bottom:8px">${fmt(emi)}</div><div style="font-size:0.8rem;color:var(--text-3)">Total Payable: <span style="color:var(--text)">${fmt(emi*n)}</span></div>`;
        } else if (typeSel.value === 'roi') {
          const i=v('f-i'), ret=v('f-v');
          const roi = ((ret - i) / i) * 100;
          out = `<div style="font-size:0.8rem;color:var(--text-3);text-transform:uppercase">ROI</div><div style="font-size:1.6rem;color:${roi>=0?'var(--success)':'var(--danger)'};font-weight:900;margin-bottom:8px">${roi.toFixed(2)}%</div><div style="font-size:0.8rem;color:var(--text-3)">Net Profit: <span style="color:var(--text)">${fmt(ret-i)}</span></div>`;
        }
        res.innerHTML = out;
        res.style.display = 'block';
      });
    } else {
      el.querySelectorAll('.calc-btn').forEach(b => b.addEventListener('click', () => handleInput(b.dataset.val)));
      document.getElementById('btn-clear-hist')?.addEventListener('click', () => { history=[]; render(); });
      updateDisplay();
    }
  }

  function getButtons(){
    const ops = ['+','-','×','÷'];
    const std = [
      {val:'C',label:'C',cls:'fn'},{val:'±',label:'±',cls:'fn'},{val:'%',label:'%',cls:'fn'},{val:'÷',label:'÷',cls:'op'},
      {val:'7',cls:''},{val:'8',cls:''},{val:'9',cls:''},{val:'×',label:'×',cls:'op'},
      {val:'4',cls:''},{val:'5',cls:''},{val:'6',cls:''},{val:'-',cls:'op'},
      {val:'1',cls:''},{val:'2',cls:''},{val:'3',cls:''},{val:'+',cls:'op'},
      {val:'0',cls:''},{val:'.',cls:''},{val:'⌫',label:'⌫',cls:'fn'},{val:'=',cls:'eq'},
    ];
    if (mode==='scientific') return [
      {val:'sin(',label:'sin',cls:'fn'},{val:'cos(',label:'cos',cls:'fn'},{val:'tan(',label:'tan',cls:'fn'},{val:'log(',label:'log',cls:'fn'},{val:'sqrt(',label:'√',cls:'fn'},
      {val:'(',label:'(',cls:'fn'},{val:')',label:')',cls:'fn'},{val:'π',label:'π',cls:'fn'},{val:'e',label:'e',cls:'fn'},{val:'x²',label:'x²',cls:'fn'},
      ...std
    ];
    return std;
  }

  function handleInput(v){
    if (v==='C'){ expr=''; }
    else if (v==='⌫'){ expr=expr.slice(0,-1); }
    else if (v==='='){ evaluate(); return; }
    else if (v==='±'){ try{ expr=String(-parseFloat(evaluate(true))); }catch{} return; }
    else if (v==='%'){ try{ expr=String(parseFloat(evaluate(true))/100); }catch{} return; }
    else if (v==='π'){ expr+=String(Math.PI); }
    else if (v==='e'){ expr+=String(Math.E); }
    else if (v==='x²'){ try{ const r=evaluate(true); expr=String(r*r); }catch{} return; }
    else if (v==='×'){ expr+='*'; }
    else if (v==='÷'){ expr+='/'; }
    else { expr+=v; }
    updateDisplay();
  }

  function evaluate(peek=false){
    try {
      const result = Function(`'use strict'; const {sin,cos,tan,sqrt,log,abs,PI,E}=Math; return (${expr})`)();
      if (!peek) { history.push({expr,result:String(result)}); expr=String(result); render(); }
      return result;
    } catch { return 'Error'; }
  }

  function updateDisplay(){
    const d = document.getElementById('calc-display');
    const e = document.getElementById('calc-expr');
    if (d) d.textContent = expr || '0';
    if (e) {
      try { const v=Function(`'use strict'; const {sin,cos,tan,sqrt,log,abs,PI,E}=Math; return (${expr})`)(); e.textContent=expr?`= ${v}`:''; }
      catch { e.textContent=expr; }
    }
  }

  render();
})();
