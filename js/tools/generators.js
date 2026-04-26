(function(){
  const el = document.getElementById('panel-generators');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Generators</h1>
      <p class="panel-desc">Secure passwords and unique identifiers</p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <h3 style="margin-bottom:16px;font-family:var(--font-display)">Password Generator</h3>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input type="text" id="gen-pw-output" class="form-input" style="flex:1;font-family:monospace;font-size:1.1rem;letter-spacing:1px" readonly placeholder="Generated password..."/>
        <button class="btn btn-primary" id="btn-gen-pw">Generate</button>
        <button class="btn btn-secondary" id="btn-copy-pw" title="Copy"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:150px">
          <label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px">Length: <span id="pw-len-val">16</span></label>
          <input type="range" id="pw-len" min="8" max="64" value="16" style="width:100%"/>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding-top:20px">
          <label style="display:flex;align-items:center;gap:4px;font-size:.85rem"><input type="checkbox" id="pw-up" checked/> Uppercase</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:.85rem"><input type="checkbox" id="pw-low" checked/> Lowercase</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:.85rem"><input type="checkbox" id="pw-num" checked/> Numbers</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:.85rem"><input type="checkbox" id="pw-sym" checked/> Symbols</label>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:16px;font-family:var(--font-display)">UUIDv4 Generator</h3>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <select id="uuid-count" class="form-input" style="width:100px">
          <option value="1">1</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="50">50</option>
        </select>
        <button class="btn btn-primary" id="btn-gen-uuid">Generate UUIDs</button>
        <button class="btn btn-secondary" id="btn-copy-uuid" title="Copy"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
      </div>
      <textarea id="gen-uuid-output" class="form-input" style="height:150px;font-family:monospace;white-space:pre" readonly placeholder="UUIDs will appear here..."></textarea>
    </div>
  `;

  // Password Logic
  const pwOut = document.getElementById('gen-pw-output');
  const pwLen = document.getElementById('pw-len');
  const pwLenVal = document.getElementById('pw-len-val');
  
  pwLen.addEventListener('input', e => { pwLenVal.textContent = e.target.value; generatePw(); });
  
  document.getElementById('btn-gen-pw').addEventListener('click', generatePw);
  document.getElementById('pw-up').addEventListener('change', generatePw);
  document.getElementById('pw-low').addEventListener('change', generatePw);
  document.getElementById('pw-num').addEventListener('change', generatePw);
  document.getElementById('pw-sym').addEventListener('change', generatePw);

  function generatePw() {
    const len = parseInt(pwLen.value);
    const up = document.getElementById('pw-up').checked;
    const low = document.getElementById('pw-low').checked;
    const num = document.getElementById('pw-num').checked;
    const sym = document.getElementById('pw-sym').checked;

    const charSets = [];
    if(up) charSets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if(low) charSets.push('abcdefghijklmnopqrstuvwxyz');
    if(num) charSets.push('0123456789');
    if(sym) charSets.push('!@#$%^&*()_+~`|}{[]:;?><,./-=');

    if(charSets.length === 0) {
      pwOut.value = 'Select at least one character type';
      return;
    }

    let pw = '';
    // ensure at least one of each selected type
    charSets.forEach(set => {
      pw += set[Math.floor(Math.random() * set.length)];
    });

    const allChars = charSets.join('');
    while(pw.length < len) {
      pw += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // shuffle
    pw = pw.split('').sort(() => 0.5 - Math.random()).join('');
    pwOut.value = pw;
  }

  document.getElementById('btn-copy-pw').addEventListener('click', () => {
    if(!pwOut.value || pwOut.value.includes('Select')) return;
    navigator.clipboard.writeText(pwOut.value);
    toast('Password copied');
  });

  // UUID Logic
  const uuidOut = document.getElementById('gen-uuid-output');
  document.getElementById('btn-gen-uuid').addEventListener('click', () => {
    const count = parseInt(document.getElementById('uuid-count').value);
    const uuids = [];
    for(let i=0; i<count; i++) {
      uuids.push(crypto.randomUUID());
    }
    uuidOut.value = uuids.join('\n');
  });

  document.getElementById('btn-copy-uuid').addEventListener('click', () => {
    if(!uuidOut.value) return;
    navigator.clipboard.writeText(uuidOut.value);
    toast('UUIDs copied');
  });

  // Initial generate
  generatePw();
})();
