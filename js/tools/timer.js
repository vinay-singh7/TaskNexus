// Timer Tool — Dark Theme
(function(){
  const el = document.getElementById('panel-timer');
  let mode = 'stopwatch';

  // Stopwatch state
  let swRunning=false, swStart=null, swElapsed=0, swLaps=[], swRaf=null;
  // Countdown state
  let cdRunning=false, cdEnd=null, cdRemain=0, cdTotal=1, cdRaf=null;
  // Pomodoro
  const POMO_PHASES=[{label:'Work',duration:25*60},{label:'Short Break',duration:5*60},{label:'Long Break',duration:15*60}];
  let pomoPhase=0, pomoRunning=false, pomoEnd=null, pomoRemain=POMO_PHASES[0].duration, pomoRaf=null;

  function fmtMs(ms){
    const cs=Math.floor((ms%1000)/10),s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000);
    return (h?pad(h)+':':'')+pad(m)+':'+pad(s)+(mode==='stopwatch'?'.'+pad(cs):'');
  }
  function fmtSecs(s){ const m=Math.floor(s/60),sec=s%60; return pad(m)+':'+pad(sec); }
  function pad(n){ return String(n).padStart(2,'0'); }

  function ring(pct, color='#4f46e5', size=160, stroke=12){
    const r=size/2-stroke/2, circ=2*Math.PI*r;
    const dash=circ*(1-pct);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${dash}"
        style="transition:stroke-dashoffset .25s ease"/>
    </svg>`;
  }

  function render(){
    el.innerHTML=`
    <div class="panel-header"><h1 class="panel-title">Timer</h1><p class="panel-desc">Stopwatch, countdown, and Pomodoro with ring progress.</p></div>
    <div class="tabs" style="margin-bottom:20px">
      ${['stopwatch','countdown','pomodoro'].map(m2=>`<button class="tab-btn${mode===m2?' active':''}" data-m="${m2}">${m2.charAt(0).toUpperCase()+m2.slice(1)}</button>`).join('')}
    </div>
    <div id="timer-body"></div>`;
    el.querySelectorAll('.tab-btn[data-m]').forEach(b=>b.addEventListener('click',()=>{
      stopAll(); mode=b.dataset.m; render();
    }));
    renderMode();
  }

  function renderMode(){
    const body=document.getElementById('timer-body');
    if(mode==='stopwatch'){
      body.innerHTML=`
        <div class="card" style="text-align:center;max-width:380px;margin:0 auto;padding:32px">
          <div id="sw-display" style="font-family:var(--font-display);font-size:3rem;font-weight:900;letter-spacing:-.04em;margin-bottom:24px;color:var(--text)">00:00.00</div>
          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:24px">
            <button class="btn btn-primary btn-pill" style="min-width:90px" id="sw-startstop">${swRunning?'Pause':'Start'}</button>
            <button class="btn btn-secondary btn-pill" id="sw-lap">Lap</button>
            <button class="btn btn-ghost btn-pill" id="sw-reset">Reset</button>
          </div>
          <div id="sw-laps" style="max-height:200px;overflow-y:auto;text-align:left">
            ${swLaps.slice().reverse().map((l,i)=>`
              <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border-2);font-size:.82rem">
                <span style="color:var(--text-3)">Lap ${swLaps.length-i}</span>
                <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">${fmtMs(l)}</span>
              </div>`).join('')}
          </div>
        </div>`;
      document.getElementById('sw-startstop').addEventListener('click',()=>{
        swRunning=!swRunning;
        if(swRunning){ swStart=performance.now()-swElapsed; swTick(); }
        else{ cancelAnimationFrame(swRaf); }
        document.getElementById('sw-startstop').textContent=swRunning?'Pause':'Resume';
      });
      document.getElementById('sw-lap').addEventListener('click',()=>{ if(swRunning) swLaps.push(swElapsed); renderLaps(); });
      document.getElementById('sw-reset').addEventListener('click',()=>{
        swRunning=false; cancelAnimationFrame(swRaf); swElapsed=0; swLaps=[];
        document.getElementById('sw-display').textContent='00:00.00';
        document.getElementById('sw-laps').innerHTML='';
        document.getElementById('sw-startstop').textContent='Start';
      });
      if(swRunning) swTick();

    } else if(mode==='countdown'){
      body.innerHTML=`
        <div class="card" style="text-align:center;max-width:380px;margin:0 auto;padding:32px">
          <div style="position:relative;width:160px;height:160px;margin:0 auto 24px">
            <div id="cd-ring" style="position:absolute;inset:0">${ring(cdRemain/cdTotal,'#7c3aed')}</div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column">
              <div id="cd-display" style="font-family:var(--font-display);font-size:1.7rem;font-weight:900;letter-spacing:-.03em">${fmtSecs(cdRemain)}</div>
              <div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-top:2px">remaining</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px;flex-wrap:wrap">
            ${[1,5,10,25].map(m=>`<button class="btn btn-secondary btn-sm btn-pill cd-preset" data-min="${m}">${m}m</button>`).join('')}
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
            <input id="cd-h" type="number" class="form-input" placeholder="hh" style="width:65px;text-align:center" min="0" max="23"/>
            <input id="cd-m" type="number" class="form-input" placeholder="mm" style="width:65px;text-align:center" min="0" max="59"/>
            <input id="cd-s" type="number" class="form-input" placeholder="ss" style="width:65px;text-align:center" min="0" max="59"/>
            <button class="btn btn-secondary btn-pill" id="cd-set">Set</button>
          </div>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-primary btn-pill" style="min-width:90px" id="cd-startstop">${cdRunning?'Pause':'Start'}</button>
            <button class="btn btn-ghost btn-pill" id="cd-reset">Reset</button>
          </div>
        </div>`;
      el.querySelectorAll('.cd-preset').forEach(b=>b.addEventListener('click',()=>{
        const secs=parseInt(b.dataset.min)*60; cdRemain=secs; cdTotal=secs; cdRunning=false;
        cancelAnimationFrame(cdRaf); document.getElementById('cd-display').textContent=fmtSecs(cdRemain);
        updateRing('cd-ring', cdRemain/cdTotal, '#7c3aed');
        document.getElementById('cd-startstop').textContent='Start';
      }));
      document.getElementById('cd-set').addEventListener('click',()=>{
        const h=parseInt(document.getElementById('cd-h').value)||0;
        const m=parseInt(document.getElementById('cd-m').value)||0;
        const s=parseInt(document.getElementById('cd-s').value)||0;
        const secs=h*3600+m*60+s;
        if(secs>0){ cdRemain=secs; cdTotal=secs; cancelAnimationFrame(cdRaf); cdRunning=false;
          document.getElementById('cd-display').textContent=fmtSecs(secs);
          updateRing('cd-ring',1,'#7c3aed'); document.getElementById('cd-startstop').textContent='Start'; }
      });
      document.getElementById('cd-startstop').addEventListener('click',()=>{
        if(!cdRemain) return;
        cdRunning=!cdRunning;
        if(cdRunning){ cdEnd=Date.now()+cdRemain*1000; cdTick(); }
        else cancelAnimationFrame(cdRaf);
        document.getElementById('cd-startstop').textContent=cdRunning?'Pause':'Resume';
      });
      document.getElementById('cd-reset').addEventListener('click',()=>{
        cdRunning=false; cancelAnimationFrame(cdRaf); cdRemain=cdTotal;
        document.getElementById('cd-display').textContent=fmtSecs(cdRemain);
        updateRing('cd-ring',1,'#7c3aed'); document.getElementById('cd-startstop').textContent='Start';
      });
      if(cdRunning){ cdEnd=Date.now()+cdRemain*1000; cdTick(); }

    } else if(mode==='pomodoro'){
      const phase=POMO_PHASES[pomoPhase];
      const pct=pomoRemain/phase.duration;
      const phaseColors=['#4f46e5','#22c55e','#f59e0b'];
      body.innerHTML=`
        <div class="card" style="text-align:center;max-width:380px;margin:0 auto;padding:32px">
          <div style="display:flex;gap:6px;justify-content:center;margin-bottom:24px">
            ${POMO_PHASES.map((p,i)=>`<button class="btn btn-sm btn-pill pomo-phase ${pomoPhase===i?'btn-primary':'btn-secondary'}" data-p="${i}">${p.label}</button>`).join('')}
          </div>
          <div style="position:relative;width:160px;height:160px;margin:0 auto 24px">
            <div id="pomo-ring" style="position:absolute;inset:0">${ring(pct,phaseColors[pomoPhase])}</div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column">
              <div id="pomo-display" style="font-family:var(--font-display);font-size:1.7rem;font-weight:900;letter-spacing:-.03em">${fmtSecs(pomoRemain)}</div>
              <div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-top:2px">${phase.label}</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-primary btn-pill" style="min-width:90px" id="pomo-startstop">${pomoRunning?'Pause':'Start'}</button>
            <button class="btn btn-ghost btn-pill" id="pomo-reset">Reset</button>
          </div>
        </div>`;
      el.querySelectorAll('.pomo-phase').forEach(b=>b.addEventListener('click',()=>{
        pomoPhase=parseInt(b.dataset.p); pomoRunning=false; cancelAnimationFrame(pomoRaf);
        pomoRemain=POMO_PHASES[pomoPhase].duration; renderMode();
      }));
      document.getElementById('pomo-startstop').addEventListener('click',()=>{
        pomoRunning=!pomoRunning;
        if(pomoRunning){ pomoEnd=Date.now()+pomoRemain*1000; pomoTick(); }
        else cancelAnimationFrame(pomoRaf);
        document.getElementById('pomo-startstop').textContent=pomoRunning?'Pause':'Resume';
      });
      document.getElementById('pomo-reset').addEventListener('click',()=>{
        pomoRunning=false; cancelAnimationFrame(pomoRaf);
        pomoRemain=POMO_PHASES[pomoPhase].duration;
        document.getElementById('pomo-display').textContent=fmtSecs(pomoRemain);
        updateRing('pomo-ring',1,phaseColors[pomoPhase]);
        document.getElementById('pomo-startstop').textContent='Start';
      });
      if(pomoRunning){ pomoEnd=Date.now()+pomoRemain*1000; pomoTick(); }
    }
  }

  function swTick(){
    swElapsed=performance.now()-swStart;
    const d=document.getElementById('sw-display');
    if(d) d.textContent=fmtMs(swElapsed);
    if(swRunning) swRaf=requestAnimationFrame(swTick);
  }
  function renderLaps(){
    const laps=document.getElementById('sw-laps');
    if(laps) laps.innerHTML=swLaps.slice().reverse().map((l,i)=>`
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border-2);font-size:.82rem">
        <span style="color:var(--text-3)">Lap ${swLaps.length-i}</span>
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">${fmtMs(l)}</span>
      </div>`).join('');
  }
  function cdTick(){
    cdRemain=Math.max(0,Math.round((cdEnd-Date.now())/1000));
    const d=document.getElementById('cd-display');
    if(d) d.textContent=fmtSecs(cdRemain);
    updateRing('cd-ring',cdRemain/cdTotal,'#7c3aed');
    if(cdRemain>0 && cdRunning) cdRaf=requestAnimationFrame(cdTick);
    else if(cdRemain===0){ cdRunning=false; toast('Countdown finished! ⏰','success'); }
  }
  function pomoTick(){
    pomoRemain=Math.max(0,Math.round((pomoEnd-Date.now())/1000));
    const d=document.getElementById('pomo-display');
    const phaseColors=['#4f46e5','#22c55e','#f59e0b'];
    if(d) d.textContent=fmtSecs(pomoRemain);
    updateRing('pomo-ring',pomoRemain/POMO_PHASES[pomoPhase].duration,phaseColors[pomoPhase]);
    if(pomoRemain>0 && pomoRunning) pomoRaf=requestAnimationFrame(pomoTick);
    else if(pomoRemain===0){ pomoRunning=false; toast(`${POMO_PHASES[pomoPhase].label} complete! 🍅`,'success'); }
  }
  function updateRing(id, pct, color){
    const wrap=document.getElementById(id);
    if(wrap) wrap.innerHTML=ring(pct,color);
  }
  function stopAll(){
    swRunning=false; cdRunning=false; pomoRunning=false;
    cancelAnimationFrame(swRaf); cancelAnimationFrame(cdRaf); cancelAnimationFrame(pomoRaf);
  }

  render();
})();
