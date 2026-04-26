(function(){
  const el = document.getElementById('panel-datetime');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Date & Time</h1>
      <p class="panel-desc">Calculate durations and add/subtract time</p>
    </div>

    <div class="grid-2" style="gap:16px;align-items:stretch">
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Time Difference</h3>
        <label class="form-label">Start Date & Time</label>
        <input type="datetime-local" id="dt-start" class="form-input" style="margin-bottom:12px"/>
        
        <label class="form-label">End Date & Time</label>
        <input type="datetime-local" id="dt-end" class="form-input" style="margin-bottom:16px"/>
        
        <div style="padding:16px;background:var(--surface-2);border-radius:var(--radius-md);text-align:center">
          <div style="font-size:.8rem;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Difference</div>
          <div id="dt-diff-result" style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--primary)">0 days</div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Add / Subtract Time</h3>
        <label class="form-label">Base Date</label>
        <input type="date" id="dt-base" class="form-input" style="margin-bottom:12px"/>
        
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <select id="dt-math-op" class="form-input" style="width:100px">
            <option value="add">Add</option>
            <option value="sub">Subtract</option>
          </select>
          <input type="number" id="dt-math-val" class="form-input" value="7" style="width:80px"/>
          <select id="dt-math-unit" class="form-input" style="flex:1">
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </div>
        
        <div style="padding:16px;background:var(--surface-2);border-radius:var(--radius-md);text-align:center">
          <div style="font-size:.8rem;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Result Date</div>
          <div id="dt-math-result" style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--success)">-</div>
        </div>
      </div>
    </div>
  `;

  // Time Difference
  const startIn = document.getElementById('dt-start');
  const endIn = document.getElementById('dt-end');
  const diffOut = document.getElementById('dt-diff-result');

  function updateDiff() {
    if(!startIn.value || !endIn.value) return;
    const start = new Date(startIn.value);
    const end = new Date(endIn.value);
    
    let diffMs = end - start;
    const isNegative = diffMs < 0;
    diffMs = Math.abs(diffMs);

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diffMs / 1000 / 60) % 60);

    let res = [];
    if(days > 0) res.push(`${days} day${days>1?'s':''}`);
    if(hours > 0) res.push(`${hours} hr${hours>1?'s':''}`);
    if(mins > 0) res.push(`${mins} min${mins>1?'s':''}`);
    
    if(res.length === 0) res = ['Exactly the same'];
    
    diffOut.textContent = (isNegative ? '- ' : '') + res.join(', ');
  }

  // default to today and tomorrow
  const now = new Date();
  const tmrw = new Date(now.getTime() + 86400000);
  startIn.value = now.toISOString().slice(0,16);
  endIn.value = tmrw.toISOString().slice(0,16);
  updateDiff();

  startIn.addEventListener('input', updateDiff);
  endIn.addEventListener('input', updateDiff);

  // Math
  const baseIn = document.getElementById('dt-base');
  const opIn = document.getElementById('dt-math-op');
  const valIn = document.getElementById('dt-math-val');
  const unitIn = document.getElementById('dt-math-unit');
  const mathOut = document.getElementById('dt-math-result');

  baseIn.value = now.toISOString().slice(0,10);

  function updateMath() {
    if(!baseIn.value || !valIn.value) return;
    const base = new Date(baseIn.value);
    const val = parseInt(valIn.value);
    const mult = opIn.value === 'add' ? 1 : -1;
    const unit = unitIn.value;

    if(unit === 'days') base.setDate(base.getDate() + (val * mult));
    if(unit === 'weeks') base.setDate(base.getDate() + (val * 7 * mult));
    if(unit === 'months') base.setMonth(base.getMonth() + (val * mult));
    if(unit === 'years') base.setFullYear(base.getFullYear() + (val * mult));

    mathOut.textContent = base.toLocaleDateString('en-US', {weekday:'short', year:'numeric', month:'short', day:'numeric'});
  }

  updateMath();
  baseIn.addEventListener('input', updateMath);
  opIn.addEventListener('change', updateMath);
  valIn.addEventListener('input', updateMath);
  unitIn.addEventListener('change', updateMath);

})();
