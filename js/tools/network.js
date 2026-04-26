(function(){
  const el = document.getElementById('panel-network');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Network & Web Utilities</h1>
      <p class="panel-desc">Check your network fingerprint and encode URLs</p>
    </div>

    <div class="grid-2" style="gap:16px;align-items:stretch;margin-bottom:16px">
      <!-- IP Address -->
      <div class="card" style="display:flex;flex-direction:column">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Your Public IP</h3>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--surface-2);border-radius:var(--radius-md)">
          <div id="net-ip" style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--primary);letter-spacing:1px">Fetching...</div>
        </div>
        <button class="btn btn-secondary" id="btn-copy-ip" style="margin-top:12px">Copy IP Address</button>
      </div>

      <!-- User Agent -->
      <div class="card" style="display:flex;flex-direction:column">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Browser Fingerprint</h3>
        <div style="margin-bottom:12px;display:flex;gap:12px">
          <div style="flex:1;padding:12px;background:var(--surface-2);border-radius:var(--radius-md);text-align:center">
            <div style="font-size:.7rem;color:var(--text-3);text-transform:uppercase;margin-bottom:4px">Browser</div>
            <div id="net-browser" style="font-weight:700">Unknown</div>
          </div>
          <div style="flex:1;padding:12px;background:var(--surface-2);border-radius:var(--radius-md);text-align:center">
            <div style="font-size:.7rem;color:var(--text-3);text-transform:uppercase;margin-bottom:4px">OS</div>
            <div id="net-os" style="font-weight:700">Unknown</div>
          </div>
        </div>
        <div style="font-size:.7rem;color:var(--text-3);margin-bottom:4px">Raw User-Agent</div>
        <div id="net-ua" style="font-family:monospace;font-size:.75rem;padding:8px;background:var(--surface-2);border-radius:4px;word-break:break-all;color:var(--text)"></div>
      </div>
    </div>

    <!-- URL Encoder -->
    <div class="card">
      <h3 style="margin-bottom:16px;font-family:var(--font-display)">URL Encoder / Decoder</h3>
      <textarea id="net-url-input" class="form-input" style="height:80px;font-family:monospace;margin-bottom:12px" placeholder="Paste string or URL here..."></textarea>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn btn-primary" id="btn-url-enc" style="flex:1">Encode URL</button>
        <button class="btn btn-secondary" id="btn-url-dec" style="flex:1">Decode URL</button>
        <button class="btn btn-secondary" id="btn-url-clear">Clear</button>
      </div>
      <textarea id="net-url-output" class="form-input" style="height:80px;font-family:monospace" readonly placeholder="Result..."></textarea>
    </div>
  `;

  // Fetch IP
  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(data => {
      document.getElementById('net-ip').textContent = data.ip;
    })
    .catch(() => {
      document.getElementById('net-ip').textContent = 'Unavailable';
    });

  document.getElementById('btn-copy-ip').addEventListener('click', () => {
    const ip = document.getElementById('net-ip').textContent;
    if(ip && ip !== 'Fetching...' && ip !== 'Unavailable'){
      navigator.clipboard.writeText(ip);
      toast('IP Address copied');
    }
  });

  // User Agent
  const ua = navigator.userAgent;
  document.getElementById('net-ua').textContent = ua;

  let browser = 'Unknown';
  if(ua.includes('Firefox')) browser = 'Firefox';
  else if(ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if(ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if(ua.includes('Edg')) browser = 'Edge';

  let os = 'Unknown';
  if(ua.includes('Win')) os = 'Windows';
  else if(ua.includes('Mac')) os = 'MacOS';
  else if(ua.includes('Linux')) os = 'Linux';
  else if(ua.includes('Android')) os = 'Android';
  else if(ua.includes('like Mac')) os = 'iOS';

  document.getElementById('net-browser').textContent = browser;
  document.getElementById('net-os').textContent = os;

  // URL Encoder
  const urlIn = document.getElementById('net-url-input');
  const urlOut = document.getElementById('net-url-output');

  document.getElementById('btn-url-enc').addEventListener('click', () => {
    try { urlOut.value = encodeURIComponent(urlIn.value); } catch(e) { urlOut.value = 'Error encoding'; }
  });
  document.getElementById('btn-url-dec').addEventListener('click', () => {
    try { urlOut.value = decodeURIComponent(urlIn.value); } catch(e) { urlOut.value = 'Invalid URI Component'; }
  });
  document.getElementById('btn-url-clear').addEventListener('click', () => {
    urlIn.value = ''; urlOut.value = '';
  });

})();
