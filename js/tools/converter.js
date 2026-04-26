// Unit Converter — Dark Theme
(function(){
  const el = document.getElementById('panel-converter');
  let cat = 'length';

  const UNITS = {
    length:   { label:'Length',   base:'m',   units:{ m:1, km:1e3, cm:0.01, mm:0.001, mi:1609.34, ft:0.3048, inch:0.0254, yd:0.9144, nmi:1852 }},
    weight:   { label:'Weight',   base:'kg',  units:{ kg:1, g:0.001, mg:1e-6, lb:0.453592, oz:0.028350, t:1000, st:6.35029 }},
    temp:     { label:'Temperature', base:'c', units:{ c:1, f:1, k:1 }},
    volume:   { label:'Volume',   base:'l',   units:{ l:1, ml:0.001, gal:3.78541, qt:0.946353, pt:0.473176, fl_oz:0.0295735, cup:0.236588 }},
    speed:    { label:'Speed',    base:'ms',  units:{ ms:1, kmh:0.277778, mph:0.44704, knot:0.514444, fps:0.3048 }},
    data:     { label:'Data',     base:'b',   units:{ b:1, kb:1024, mb:1048576, gb:1073741824, tb:1099511627776, pb:1.126e15 }},
    area:     { label:'Area',     base:'m2',  units:{ m2:1, km2:1e6, cm2:0.0001, ft2:0.092903, mi2:2.59e6, acre:4046.86, ha:10000 }},
    time:     { label:'Time',     base:'s',   units:{ s:1, ms:0.001, min:60, hr:3600, day:86400, wk:604800, mo:2629800, yr:31557600 }},
    pressure: { label:'Pressure', base:'pa',  units:{ pa:1, kpa:1000, mpa:1e6, bar:100000, psi:6894.76, atm:101325, mmhg:133.322 }},
    energy:   { label:'Energy',   base:'j',   units:{ j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, ev:1.602e-19, btu:1055.06 }},
  };

  const UNIT_LABELS = {
    m:'Meters',km:'Kilometers',cm:'Centimeters',mm:'Millimeters',mi:'Miles',ft:'Feet',inch:'Inches',yd:'Yards',nmi:'Nautical Miles',
    kg:'Kilograms',g:'Grams',mg:'Milligrams',lb:'Pounds',oz:'Ounces',t:'Tonnes',st:'Stones',
    c:'Celsius',f:'Fahrenheit',k:'Kelvin',
    l:'Liters',ml:'Milliliters',gal:'Gallons',qt:'Quarts',pt:'Pints',fl_oz:'Fluid Ounces',cup:'Cups',
    ms:'m/s',kmh:'km/h',mph:'mph',knot:'Knots',fps:'ft/s',
    b:'Bytes',kb:'Kilobytes',mb:'Megabytes',gb:'Gigabytes',tb:'Terabytes',pb:'Petabytes',
    m2:'m²',km2:'km²',cm2:'cm²',ft2:'ft²',mi2:'mi²',acre:'Acres',ha:'Hectares',
    s:'Seconds',min:'Minutes',hr:'Hours',day:'Days',wk:'Weeks',mo:'Months',yr:'Years',
    pa:'Pascals',kpa:'Kilopascals',mpa:'Megapascals',bar:'Bar',psi:'PSI',atm:'Atmospheres',mmhg:'mmHg',
    j:'Joules',kj:'Kilojoules',cal:'Calories',kcal:'Kilocalories',wh:'Watt-hours',kwh:'kWh',ev:'Electronvolts',btu:'BTU',
  };

  function convertTemp(val, from, to){
    let c = from==='f'?(val-32)*5/9 : from==='k'?val-273.15 : val;
    if(to==='f') return c*9/5+32;
    if(to==='k') return c+273.15;
    return c;
  }
  function convert(val, from, to, units){
    if(cat==='temp') return convertTemp(val, from, to);
    return val * units[from] / units[to];
  }

  let fromU, toU;

  function render(){
    const { units } = UNITS[cat];
    fromU = fromU || Object.keys(units)[0];
    toU   = toU   || Object.keys(units)[1];

    el.innerHTML = `
    <div class="panel-header"><h1 class="panel-title">Unit Converter</h1><p class="panel-desc">10 categories, instant conversion.</p></div>

    <!-- Category tabs -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">
      ${Object.entries(UNITS).map(([k,v])=>`
        <button class="btn btn-sm btn-pill ${cat===k?'btn-primary':'btn-secondary'} cat-btn" data-c="${k}">${v.label}</button>`).join('')}
    </div>

    <!-- Converter -->
    <div class="card" style="max-width:600px;margin:0 auto">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:120px">
          <label class="form-label">From</label>
          <select id="from-unit" class="form-select">
            ${Object.keys(units).map(u=>`<option value="${u}" ${fromU===u?'selected':''}>${UNIT_LABELS[u]||u}</option>`).join('')}
          </select>
        </div>
        <div style="margin-top:20px">
          <button class="btn btn-secondary btn-icon btn-pill" id="btn-swap" title="Swap" style="font-size:1.1rem">⇄</button>
        </div>
        <div style="flex:1;min-width:120px">
          <label class="form-label">To</label>
          <select id="to-unit" class="form-select">
            ${Object.keys(units).map(u=>`<option value="${u}" ${toU===u?'selected':''}>${UNIT_LABELS[u]||u}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display:flex;gap:10px;align-items:flex-end;margin-top:16px">
        <div style="flex:1">
          <label class="form-label">Input Value</label>
          <input id="conv-input" type="number" class="form-input" placeholder="Enter value…" value="1"/>
        </div>
        <button class="btn btn-primary" id="btn-convert">Convert →</button>
      </div>

      <div id="conv-result" style="margin-top:16px;padding:18px;background:rgba(79,70,229,0.1);border:1px solid rgba(79,70,229,0.25);border-radius:12px;min-height:60px">
        <div style="font-size:.7rem;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Result</div>
        <div id="result-value" style="font-family:var(--font-display);font-size:1.8rem;font-weight:900;letter-spacing:-.03em;color:var(--primary)">—</div>
      </div>
    </div>

    <!-- Reference table -->
    <div class="card" style="margin-top:18px;max-width:600px;margin-left:auto;margin-right:auto">
      <div style="font-weight:700;margin-bottom:12px;font-family:var(--font-display);letter-spacing:-.02em">Quick Reference — All ${UNITS[cat].label} Units</div>
      <table style="width:100%;font-size:.8rem;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:left;padding:7px 10px;font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border-2)">Unit</th>
          <th style="text-align:right;padding:7px 10px;font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:700;border-bottom:1px solid var(--border-2)">Relative to 1 ${UNIT_LABELS[Object.keys(units)[0]]||Object.keys(units)[0]}</th>
        </tr></thead>
        <tbody>
          ${Object.entries(units).map(([u])=>{
            let val; try { val = cat==='temp'?`${convertTemp(1,Object.keys(units)[0],u).toFixed(4)} ${UNIT_LABELS[u]}`:convert(1,Object.keys(units)[0],u,units).toFixed(6); } catch{ val='—'; }
            return `<tr style="border-bottom:1px solid var(--border-2)">
              <td style="padding:8px 10px;color:var(--text-2);font-weight:500">${UNIT_LABELS[u]||u}</td>
              <td style="padding:8px 10px;text-align:right;font-family:var(--font-mono);color:var(--text)">${val}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

    el.querySelectorAll('.cat-btn').forEach(b=>b.addEventListener('click',()=>{
      cat=b.dataset.c; fromU=null; toU=null; render();
    }));
    document.getElementById('from-unit').addEventListener('change',e=>fromU=e.target.value);
    document.getElementById('to-unit').addEventListener('change',e=>toU=e.target.value);
    document.getElementById('btn-swap').addEventListener('click',()=>{ [fromU,toU]=[toU,fromU]; render(); });
    document.getElementById('btn-convert').addEventListener('click', doConvert);
    document.getElementById('conv-input').addEventListener('keydown',e=>e.key==='Enter'&&doConvert());
    doConvert();
  }

  function doConvert(){
    const val = parseFloat(document.getElementById('conv-input').value);
    fromU = document.getElementById('from-unit').value;
    toU   = document.getElementById('to-unit').value;
    if(isNaN(val)){ document.getElementById('result-value').textContent='—'; return; }
    const res = convert(val, fromU, toU, UNITS[cat].units);
    const formatted = Math.abs(res) < 0.001 || Math.abs(res) > 1e9 ? res.toExponential(6) : +res.toFixed(8);
    document.getElementById('result-value').textContent = `${formatted} ${UNIT_LABELS[toU]||toU}`;
  }

  render();
})();
