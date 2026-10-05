
function chipAkshaya(root = document.body){
  const re = /Akshaya Patra/g, hits = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n =>
    n.parentElement && !n.parentElement.closest('.ap-chip,script,style,textarea,title') && /Akshaya Patra/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  while (w.nextNode()) hits.push(w.currentNode);
  for (const n of hits){
    const frag = document.createDocumentFragment(); let last = 0; const v = n.nodeValue; re.lastIndex = 0; let m;
    while ((m = re.exec(v))){ frag.append(v.slice(last, m.index)); const b = document.createElement('b'); b.className = 'ap-chip'; b.textContent = m[0]; frag.append(b); last = m.index + m[0].length; }
    frag.append(v.slice(last)); n.replaceWith(frag);
  }
}
(async () => {
const $ = s => document.querySelector(s);
const WA = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/';
const embedded = id => { const el = document.getElementById(id); try { return el ? JSON.parse(el.textContent) : null; } catch { return null; } };
let SEED = embedded('seed'), T110 = embedded('world110'), T50 = embedded('world50');
if (!SEED){
  try { SEED = await fetch('data/mock-data.json').then(r => r.json()); }
  catch { document.body.insertAdjacentHTML('afterbegin', '<div class="demo-bar">Could not load data/mock-data.json. Serve this folder with a local server, for example: python3 -m http.server 8000</div>'); return; }
}
if (!T110){ try { [T110, T50] = await Promise.all(['countries-110m.json','countries-50m.json'].map(f => fetch(WA + f).then(r => r.json()))); } catch {} }
const LOAD = Date.now();
const H = 3600000;
const BANKS = SEED.foodBanks;
const CITIES = SEED.cities;
const bankById = Object.fromEntries(BANKS.map(b => [b.id, b]));
const DIETS = ["Vegetarian","Vegan","Halal","Gluten-free","Dairy-free","Nut-free","Kid-friendly","Soft food"];
const KINDS = ["Cooked meal","Produce","Bakery","Pantry","Snacks","Baby & kids"];
const KCOL = {"Cooked meal":"meal","Produce":"produce","Bakery":"bakery","Pantry":"pantry","Snacks":"snacks","Baby & kids":"baby"};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const ls = {
  get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const seedPackets = SEED.packets.map(p => {
  const packedAt = LOAD - p.packedMinutesAgo * 60000;
  return {...p, packedAt, eatBy: packedAt + p.eatWithinHours * H, source:'seed'};
});

/* ---------- i18n: English + 22 scheduled languages of India ---------- */
const LANGS = [
  ['en','English','English'],['hi','हिन्दी','Hindi'],['bn','বাংলা','Bengali'],['te','తెలుగు','Telugu'],['mr','मराठी','Marathi'],
  ['ta','தமிழ்','Tamil'],['ur','اردو','Urdu'],['gu','ગુજરાતી','Gujarati'],['kn','ಕನ್ನಡ','Kannada'],['or','ଓଡ଼ିଆ','Odia'],
  ['ml','മലയാളം','Malayalam'],['pa','ਪੰਜਾਬੀ','Punjabi'],['as','অসমীয়া','Assamese'],['mai','मैथिली','Maithili'],['sat','ᱥᱟᱱᱛᱟᱲᱤ','Santali'],
  ['ks','کٲشُر','Kashmiri'],['ne','नेपाली','Nepali'],['sd','سنڌي','Sindhi'],['kok','कोंकणी','Konkani'],['doi','डोगरी','Dogri'],
  ['mni','ꯃꯩꯇꯩꯂꯣꯟ','Manipuri'],['brx','बड़ो','Bodo'],['sa','संस्कृतम्','Sanskrit']
];
const RTL = new Set(['ur','ks','sd']);
const I18N_ALL = embedded('i18n') || {};
const dictCache = {...I18N_ALL};
let LANG = 'en', DICT = {}, EN = dictCache.en || {};
async function loadDict(code){
  if (dictCache[code]) return dictCache[code];
  try { dictCache[code] = await fetch(`i18n/${code}.json`).then(r => r.json()); } catch { dictCache[code] = {}; }
  return dictCache[code];
}
function t(k, v){ let s = DICT[k] ?? EN[k] ?? k; if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => v[x] ?? m); return s; }
const tN = (n, v) => (n === 1 && LANG === 'en') ? t('u.box1') : t('u.boxes', {n, ...(v||{})});
const LOC = () => { const l = `${LANG === 'en' ? 'en' : LANG}-IN-u-nu-latn`; try { return Intl.DateTimeFormat.supportedLocalesOf([l]).length ? l : 'en-IN'; } catch { return 'en-US'; } };
const kindLabel = k => t('kind.' + k), dietLabel = d => t('diet.' + d);
function applyStatic(){
  document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (k in EN || k in DICT) el.textContent = t(k); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  chipAkshaya();
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const cur = LANGS.find(l => l[0] === LANG);
  document.querySelectorAll('.lang-cur').forEach(el => el.textContent = cur ? cur[1] : 'English');
}
async function setLang(code, persist = true){
  if (!LANGS.some(l => l[0] === code)) code = 'en';
  EN = await loadDict('en'); DICT = code === 'en' ? EN : await loadDict(code);
  LANG = code;
  document.documentElement.lang = code; document.documentElement.dir = RTL.has(code) ? 'rtl' : 'ltr';
  if (persist) ls.set('eternalpot.lang', code);
  applyStatic();
  if (typeof relabel === 'function') relabel();
}

const SFI = Math.max(0, CITIES.findIndex(c => c.name === 'San Francisco'));
const cityMe = i => ({ lat: CITIES[i].lat, lng: CITIES[i].lng, label: CITIES[i].name, cc: CITIES[i].cc });
const state = {
  mode: 'find', q: '', diets: new Set(), kinds: new Set(),
  openNow: false, hasFood: true,
  me: cityMe(SFI),
  selected: null, armed: null,
  drops: [], claims: {}, store: 'local'
};
const myIds = new Set(ls.get('kindbox.mine', []));
let db = null;
const mqDesk = matchMedia('(min-width:1024px)');
const isDesk = () => mqDesk.matches;

/* ---------- time & distance ---------- */
const fmtCache = {};
function localMinutes(tz){
  const f = fmtCache[tz] ||= new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const parts = f.formatToParts(new Date());
  return (+parts.find(p=>p.type==='hour').value)*60 + (+parts.find(p=>p.type==='minute').value);
}
const toMin = s => { const [h,m] = s.split(':').map(Number); return h*60+m; };
function isOpen(b){ const n = localMinutes(b.tz || 'America/Los_Angeles'); return n >= toMin(b.open) && n < toMin(b.close); }
function fmtHM(s){ const [h,m] = s.split(':').map(Number); const d = new Date(Date.UTC(2026,0,1,h%24,m)); return d.toLocaleTimeString(LOC(),{hour:'numeric',minute:m?'2-digit':undefined,timeZone:'UTC'}); }
function hoursText(b){ return b.open==='00:00' && b.close==='24:00' ? t('st.24') : `${fmtHM(b.open)} – ${fmtHM(b.close)}`; }
function miles(a, b){
  const R = 3958.8, r = x => x*Math.PI/180;
  const dLat = r(b.lat-a.lat), dLng = r(b.lng-a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
const unit = () => (state.me.cc === 'US' || state.me.cc === 'GB') ? 'mi' : 'km';
function distShort(mi){
  const u = unit(), v = u === 'mi' ? mi : mi*1.609;
  return `${v<0.1?'<0.1':v<10?v.toFixed(1):Math.round(v).toLocaleString('en-US')} ${u}`;
}
function distText(mi){ const walk = Math.max(1, Math.round(mi*20)); return mi < 3 ? `${distShort(mi)} · ${t('u.walk',{n:walk})}` : distShort(mi); }
function ago(ts){ const m = Math.round((Date.now()-ts)/60000); if (m<1) return t('ago.now'); if (m<60) return t('ago.min',{n:m}); const h = Math.round(m/60); return h<48 ? t('ago.h',{n:h}) : t('ago.d',{n:Math.round(h/24)}); }
function clock(ts, tz){ return new Date(ts).toLocaleString(LOC(),{timeZone:tz||'America/Los_Angeles',weekday:'short',hour:'numeric',minute:'2-digit'}); }
function eatText(p){
  const left = p.eatBy - Date.now(); const tz = bankById[p.bankId]?.tz;
  if (left > 14*24*H) return t('time.shelfStable');
  if (left > 48*H) return t('time.eatBy',{t:new Date(p.eatBy).toLocaleDateString(LOC(),{timeZone:tz,month:'short',day:'numeric'})});
  return t('time.eatBy',{t:clock(p.eatBy, tz)});
}
const fmtN = n => n >= 1000 ? (n/1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/,'') + 'k' : String(n);

/* ---------- data ---------- */
function allPackets(){ return [...state.drops, ...seedPackets]; }
function live(p){ return !state.claims[p.id] && p.eatBy > Date.now(); }
function matchesFilters(p){
  for (const d of state.diets) if (!p.tags.includes(d)) return false;
  if (state.kinds.size && !state.kinds.has(p.kind)) return false;
  return true;
}
function textHit(s, q){ return s.toLowerCase().includes(q); }
function computeBanks(){
  const q = state.q.trim().toLowerCase();
  const byBank = {};
  for (const p of allPackets()) (byBank[p.bankId] ||= []).push(p);
  const out = [];
  for (const b of BANKS){
    const bankHit = !q || textHit(`${b.name} ${b.hood} ${b.address} ${b.city} ${b.country}`, q);
    const all = (byBank[b.id]||[]);
    const avail = all.filter(p => live(p) && matchesFilters(p) && (bankHit || textHit(`${p.title} ${p.contents} ${p.kind} ${p.tags.join(' ')}`, q)));
    if (!bankHit && !avail.length) continue;
    const open = isOpen(b);
    if (state.openNow && !open) continue;
    if (state.hasFood && !avail.length) continue;
    out.push({ b, avail: avail.sort((x,y)=>y.packedAt-x.packedAt), all, open, mi: miles(state.me, b) });
  }
  return out.sort((x,y)=>x.mi-y.mi);
}

/* ---------- FIND: controls ---------- */
const nearSel = $('#nearSel');
nearSel.innerHTML = CITIES.map((c,i)=>`<option value="${i}">${esc(c.name)}, ${esc(c.country)}</option>`).join('') + `<option value="pin" hidden>Pinned spot</option>`;
nearSel.value = String(SFI);
const savedNear = ls.get('kindbox.city', null);
if (savedNear !== null && CITIES[+savedNear]) { nearSel.value = String(savedNear); state.me = cityMe(+savedNear); }
nearSel.addEventListener('change', () => {
  if (nearSel.value === 'pin') return;
  state.me = cityMe(+nearSel.value); state.selected = null;
  ls.set('kindbox.city', nearSel.value);
  renderFind(); flyTo([state.me.lng, state.me.lat], CITY_K);
});

function buildDeskChips(){
$('#dietChips').innerHTML = DIETS.map(d=>`<button class="chip" aria-pressed="${state.diets.has(d)}" data-diet="${d}"><span class="kdot desk-only" style="background:var(--leaf)"></span>${dietLabel(d)}<span class="n desk-only"></span></button>`).join('');
$('#kindChips').innerHTML = KINDS.map(k=>`<button class="chip" aria-pressed="${state.kinds.has(k)}" data-kind="${k}"><span class="kdot" style="background:var(--k-${KCOL[k]})"></span>${kindLabel(k)}<span class="n"></span></button>`).join('');
$('#toggleChips').innerHTML = `
  <button class="chip toggle" data-t="hasFood" aria-pressed="${state.hasFood}">${t('f.hasFood')}</button>
  <button class="chip toggle" data-t="openNow" aria-pressed="${state.openNow}">${t('f.openNow')}</button>
  ${KINDS.map(k=>`<button class="chip mob-kind" data-kind="${k}" aria-pressed="${state.kinds.has(k)}">${kindLabel(k)}</button>`).join('')}`;
}
buildDeskChips();
$('#dietChips').addEventListener('click', e => {
  const c = e.target.closest('[data-diet]'); if (!c) return;
  const d = c.dataset.diet; state.diets.has(d) ? state.diets.delete(d) : state.diets.add(d);
  c.setAttribute('aria-pressed', state.diets.has(d)); renderFind();
});
function toggleKind(v){ state.kinds.has(v)?state.kinds.delete(v):state.kinds.add(v); document.querySelectorAll(`[data-kind="${CSS.escape(v)}"]`).forEach(x=>x.setAttribute('aria-pressed', state.kinds.has(v))); }
$('#toggleChips').addEventListener('click', e => {
  const t = e.target.closest('[data-t]'), k = e.target.closest('[data-kind]');
  if (t){ state[t.dataset.t] = !state[t.dataset.t]; t.setAttribute('aria-pressed', state[t.dataset.t]); }
  else if (k){ toggleKind(k.dataset.kind); }
  else return;
  renderFind();
});
$('#kindChips').addEventListener('click', e => { const k = e.target.closest('[data-kind]'); if (!k) return; toggleKind(k.dataset.kind); renderFind(); });
$('#resetF').addEventListener('click', () => {
  state.diets.clear(); state.kinds.clear(); state.openNow = false; state.hasFood = true; state.q = ''; $('#q').value = '';
  document.querySelectorAll('[data-diet],[data-kind]').forEach(x=>x.setAttribute('aria-pressed','false'));
  document.querySelector('[data-t="hasFood"]').setAttribute('aria-pressed','true'); document.querySelector('[data-t="openNow"]').setAttribute('aria-pressed','false');
  renderFind();
});
function renderFacets(){
  const lp = allPackets().filter(live);
  document.querySelectorAll('#dietChips [data-diet] .n').forEach(n => { n.textContent = lp.filter(p=>p.tags.includes(n.parentNode.dataset.diet)).length; });
  document.querySelectorAll('#kindChips [data-kind] .n').forEach(n => { n.textContent = lp.filter(p=>p.kind===n.parentNode.dataset.kind).length; });
}
let qTimer; $('#q').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(()=>{ state.q = e.target.value; state.selected = null; renderFind(); }, 140); });
$('#q').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const r = lastRows[0]; if (!r) return;
  const q = state.q.trim().toLowerCase();
  const city = CITIES.find(c => c.name.toLowerCase().startsWith(q) || c.country.toLowerCase().startsWith(q));
  if (city) flyTo([city.lng, city.lat], CITY_K); else select(r.b.id, true);
});

/* ---------- FIND: list + detail ---------- */
function packetCard(p){
  const taken = !!state.claims[p.id];
  const span = p.eatBy - p.packedAt, left = Math.max(0, p.eatBy - Date.now());
  const pct = Math.max(4, Math.min(100, left/span*100));
  const shelf = left > 14*24*H;
  const armed = state.armed === p.id;
  const isNew = p.source !== 'seed';
  return `<article class="tag${taken?' taken':''}">
    <div class="row1"><h4>${esc(p.title)}</h4><span class="kind">${esc(p.kind)}</span></div>
    ${p.contents?`<p>${esc(p.contents)}</p>`:''}
    ${p.tags.length?`<div class="diet">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
    <div class="fresh"><span class="mono">${p.servings} serving${p.servings>1?'s':''}</span><span>${shelf?'Shelf-stable':`<span class="bar" style="display:block" title="Time left"><i class="${pct<30?'late':''}" style="width:${pct}%"></i></span>`}</span></div>
    <div class="foot">
      <span>Packed ${ago(p.packedAt)} · ${eatText(p)}${p.donor?` · From ${esc(p.donor)}`:''} ${isNew?'<span class="new">New</span>':''}</span>
      ${taken ? `<span class="pill closed">Taken</span>` :
        `<button class="btn small ${armed?'give':''}" data-claim="${p.id}">${armed?'Tap again to confirm':'I’m taking this'}</button>`}
    </div>
  </article>`;
}
function rowFor(id, rows){
  const b = bankById[id];
  return rows.find(r=>r.b.id===id) || { b, open:isOpen(b), mi:miles(state.me,b), avail: allPackets().filter(p=>p.bankId===id && live(p)) };
}
function detailHTML(row, desk){
  const b = row.b;
  const taken = allPackets().filter(p=>p.bankId===b.id && state.claims[p.id] && p.eatBy>Date.now());
  const kinds = [...new Set(row.avail.map(p=>p.kind))];
  return `${desk?`<button class="x" id="closeDrawer" aria-label="Close details">×</button>`:''}
    ${desk?`<div style="height:12px"></div><div class="hero-art" style="background:${artBg(kinds[0]||'Pantry')}">${kindArt(kinds[0]||'Pantry', 96)}</div>`:''}
    <div class="detail">
      ${desk?'':`<button class="back" id="backBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg>All drop points</button>`}
      <div><div class="sect">${esc(b.hood)} · ${esc(b.city)}</div><h2>${esc(b.name)}</h2></div>
      <dl class="facts">
        <div><dt>${t('prog.where')}</dt><dd><span class="addr">${esc(b.address)}, ${esc(b.city)}</span>, ${esc(b.country)}</dd></div>
        <div><dt>Hours</dt><dd>${hoursText(b)} <span class="pill ${row.open?'open':'closed'}">${row.open?'Open now':'Closed now'}</span></dd></div>
        <div><dt>Distance</dt><dd>${distText(row.mi)} from ${esc(state.me.label)}</dd></div>
        <div><dt>Storage</dt><dd>${b.fridge?'Fridge and shelf':'Shelf only'}</dd></div>
        <div><dt>Access</dt><dd>${esc(b.access)}</dd></div>
        <div><dt>Note</dt><dd>${esc(b.note)}</dd></div>
      </dl>
      <div class="actions">
        <a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking" target="_blank" rel="noopener">Directions</a>
        <button class="btn" data-act="copy">Copy address</button>
        <button class="btn" data-act="drop">Drop food here</button>
      </div>
      <div class="sect">${row.avail.length} box${row.avail.length===1?'':'es'} available${state.diets.size||state.kinds.size||state.q?' matching your filters':''}</div>
      ${row.avail.length ? row.avail.map(packetCard).join('') : `<div class="empty"><b>Nothing here right now</b>Boxes go fast. Check a nearby point or come back later.</div>`}
      ${taken.length?`<div class="sect">Recently taken</div>${taken.map(packetCard).join('')}`:''}
    </div>`;
}
const LIST_MAX = 60;
function renderList(rows){
  const list = $('#list');
  if (state.selected && !isDesk()){ list.innerHTML = detailHTML(rowFor(state.selected, rows), false); return; }
  if (!rows.length){ list.innerHTML = `<div class="empty"><b>No drop points match</b>Try removing a filter, or turn off “Has food now”.</div>`; return; }
  list.innerHTML = rows.slice(0, LIST_MAX).map(r => `<button class="bank${r.b.id===state.selected?' hl':''}" data-bank="${r.b.id}">
      <h3>${esc(r.b.name)}</h3>
      <div class="count${r.avail.length?'':' zero'}"><b class="mono">${r.avail.length}</b><span>box${r.avail.length===1?'':'es'}</span></div>
      <div class="meta">${esc(r.b.hood)}${r.b.city!==state.me.label?`, ${esc(r.b.city)}`:''} · ${r.mi<3?distText(r.mi):distShort(r.mi)} · <span class="pill ${r.open?'open':'closed'}">${r.open?'Open':'Closed'}</span></div>
      ${r.avail.length?`<div class="items">${r.avail.slice(0,3).map(p=>esc(p.title)).join(' · ')}</div>`:''}
    </button>`).join('') + (rows.length > LIST_MAX ? `<div class="empty" style="padding:14px">Showing the ${LIST_MAX} nearest of ${rows.length} drop points. Search a city to see more.</div>` : '');
}
let drawerFor = null;
function renderDrawer(rows){
  const d = $('#drawer');
  const show = isDesk() && !!state.selected;
  d.hidden = !show;
  if (!show){ drawerFor = null; return; }
  const keep = drawerFor === state.selected ? d.scrollTop : 0;
  d.innerHTML = detailHTML(rowFor(state.selected, rows), true);
  d.scrollTop = keep; drawerFor = state.selected;
}
function renderSummary(rows){
  const boxes = rows.reduce((s,r)=>s+r.avail.length,0);
  const servings = rows.reduce((s,r)=>s+r.avail.reduce((a,p)=>a+p.servings,0),0);
  const nearest = rows.find(r=>r.avail.length);
  $('#summary').innerHTML = `<span>${esc(t('side.summary',{b:boxes,s:servings,p:rows.length}))}</span>
    ${nearest?`<span>${esc(t('side.nearest',{d:distShort(nearest.mi)}))}</span>`:''}`;
}

/* kind illustrations (no photos needed) */
function artBg(kind){ const c = `var(--k-${KCOL[kind]||'meal'})`; return `radial-gradient(120% 90% at 30% 20%, color-mix(in srgb, ${c} 55%, #fff), ${c})`; }
function kindArt(kind, h){
  const W2 = 'rgb(255 255 255/.92)', D = 'rgb(23 37 30/.18)';
  const art = {
    "Cooked meal": `<path d="M18 46h84a42 30 0 0 1-84 0z" fill="${W2}"/><path d="M14 46h92" stroke="${W2}" stroke-width="4" stroke-linecap="round"/><path d="M46 36c0-7 6-7 6-15M60 36c0-7 6-7 6-15M74 36c0-7 6-7 6-15" stroke="${W2}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M34 58h52" stroke="${D}" stroke-width="3" stroke-linecap="round"/>`,
    "Produce": `<circle cx="48" cy="52" r="20" fill="${W2}"/><path d="M48 32c2-8 8-12 14-12-1 7-6 12-14 12z" fill="${W2}"/><path d="M74 30l18 40-8 4-18-40z" fill="${W2}"/><path d="M70 28l-4-8M74 27l2-9M78 29l6-6" stroke="${W2}" stroke-width="3" stroke-linecap="round"/>`,
    "Bakery": `<path d="M24 62V48c0-14 16-22 36-22s36 8 36 22v14z" fill="${W2}"/><path d="M42 38l-6 12M60 34l-4 14M78 38l-4 12" stroke="${D}" stroke-width="3.5" stroke-linecap="round"/>`,
    "Pantry": `<rect x="30" y="26" width="30" height="42" rx="4" fill="${W2}"/><ellipse cx="45" cy="26" rx="15" ry="4" fill="${W2}"/><rect x="30" y="38" width="30" height="14" fill="${D}"/><rect x="66" y="36" width="26" height="32" rx="4" fill="${W2}"/><rect x="66" y="44" width="26" height="10" fill="${D}"/>`,
    "Snacks": `<path d="M26 64 60 22l34 42z" fill="${W2}"/><path d="M33 56h54" stroke="${D}" stroke-width="4"/><path d="M38 50h44" stroke="${D}" stroke-width="2"/>`,
    "Baby & kids": `<rect x="46" y="34" width="28" height="36" rx="8" fill="${W2}"/><rect x="50" y="24" width="20" height="10" rx="3" fill="${W2}"/><path d="M56 24c0-6 8-6 8 0" fill="${W2}"/><path d="M50 46h8M50 54h8M50 62h8" stroke="${D}" stroke-width="2.5" stroke-linecap="round"/>`
  }[kind] || '';
  return `<svg width="${h*1.5}" height="${h}" viewBox="0 0 120 80" aria-hidden="true">${art}</svg>`;
}

function renderRail(rows){
  const lp = allPackets().filter(live);
  const servings = lp.reduce((a,p)=>a+p.servings,0);
  const openN = BANKS.filter(isOpen).length;
  const countries = new Set(BANKS.map(b=>b.country)).size;
  $('#rBoxes').textContent = fmtN(lp.length); $('#rServ').textContent = fmtN(servings);
  $('#rCountries').textContent = countries; $('#rCities').textContent = CITIES.length;
  $('#rMeter').style.width = (openN/BANKS.length*100)+'%';
  $('#rOpen').textContent = t('rail.open',{n:openN,total:BANKS.length});
  const by = {};
  for (const r of rows){ const k = r.b.country; (by[k] ||= {n:0, b:r.b, mi:r.mi}); by[k].n += r.avail.length; if (r.mi < by[k].mi){ by[k].mi = r.mi; } }
  const top = Object.entries(by).sort((a,b)=>b[1].n-a[1].n || a[1].mi-b[1].mi).slice(0,7);
  const max = Math.max(1, ...top.map(t=>t[1].n));
  $('#rRank').innerHTML = top.length ? top.map(([c,v],i)=>`<button data-fly="${v.b.id}"><span class="i">${String(i+1).padStart(2,'0')}</span><span>${esc(c)}</span><b class="mono">${v.n}</b><span class="bar2"><i style="width:${v.n/max*100}%"></i></span></button>`).join('') : `<div class="fine">No matches for these filters.</div>`;
}
function renderDock(rows){
  const items = rows.flatMap(r => r.avail.map(p => ({p, r}))).sort((a,b)=> a.r.mi-b.r.mi || a.p.eatBy-b.p.eatBy).slice(0,16);
  $('#dockCnt').textContent = items.length;
  $('#strip').innerHTML = items.length ? items.map(({p,r}) => `<button class="bcard" data-bank="${r.b.id}">
      <span class="art" style="background:${artBg(p.kind)}">${kindArt(p.kind, 60)}<span class="k">${esc(kindLabel(p.kind))}</span><span class="t">${distShort(r.mi)}</span></span>
      <b>${esc(p.title)}</b>
      <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/></svg>${esc(r.b.name)}, ${esc(r.b.city)}</span>
      <span>${servTxt(p.servings)} · ${eatText(p)}</span>
    </button>`).join('') : `<div class="fine" style="padding:20px 4px">No boxes match. Try clearing a filter.</div>`;
}
$('#strip').addEventListener('click', e => { const b = e.target.closest('[data-bank]'); if (b) select(b.dataset.bank, true); });
$('#rRank').addEventListener('click', e => { const b = e.target.closest('[data-fly]'); if (!b) return; const bk = bankById[b.dataset.fly]; flyTo([bk.lng, bk.lat], COUNTRY_K); });
$('#dPrev').onclick = () => $('#strip').scrollBy({left:-380, behavior:'smooth'});
$('#dNext').onclick = () => $('#strip').scrollBy({left:380, behavior:'smooth'});
$('#nearestOpen').onclick = () => {
  const r = lastRows.find(x => x.open && x.avail.length) || lastRows.find(x=>x.avail.length);
  if (r) select(r.b.id, true); else toast(t('toast.noOpen'));
};

async function onDetailClick(e){
  const bank = e.target.closest('[data-bank]');
  if (bank){ select(bank.dataset.bank, true); return; }
  if (e.target.closest('#backBtn') || e.target.closest('#closeDrawer')){ state.selected = null; state.armed = null; renderFind(); return; }
  const act = e.target.closest('[data-act]');
  if (act && act.dataset.act === 'copy'){
    const b = bankById[state.selected]; const text = `${b.address}, ${b.city}, ${b.country}`;
    try { await navigator.clipboard.writeText(text); toast(t('toast.copied')); }
    catch { const r = document.createRange(); r.selectNodeContents(e.currentTarget.querySelector('.addr')); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); toast('Address selected. Copy it.'); }
    return;
  }
  if (act && act.dataset.act === 'drop'){ setMode('give'); $('#gBank').value = state.selected; updatePreview(); return; }
  const c = e.target.closest('[data-claim]');
  if (c){
    const id = c.dataset.claim;
    if (state.armed !== id){ state.armed = id; renderFind(); return; }
    state.armed = null; await claim(id);
  }
}
$('#list').addEventListener('click', onDetailClick);
$('#drawer').addEventListener('click', onDetailClick);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.selected && isDesk()){ state.selected = null; renderFind(); } });

function select(id, center){
  state.selected = id; state.armed = null; renderFind();
  if (center && (isDesk() || state.mode === 'find')){ const b = bankById[id]; flyTo([b.lng, b.lat], Math.max(view.k, SELECT_K)); }
  if (!isDesk()) openSheet(id);
}

/* ======================================================================
   WORLD MAP — canvas, d3-geo. Flat (Mercator) and 3D globe (orthographic)
   ====================================================================== */
const cv = $('#map'), ctx = cv.getContext('2d');
const hasD3 = typeof d3 !== 'undefined' && typeof topojson !== 'undefined' && !!T110;
let C110 = [], C50 = [], M110 = null, M50 = null;
if (hasD3){
  const t110 = T110, t50 = T50 || T110;
  const feats = t => topojson.feature(t, t.objects.countries).features.filter(f => f.id !== '010');
  C110 = feats(t110); C50 = feats(t50);
  M110 = topojson.mesh(t110, t110.objects.countries, (a,b)=>a!==b);
  M50 = topojson.mesh(t50, t50.objects.countries, (a,b)=>a!==b);
}
const SPHERE = {type:'Sphere'};
const GRAT = hasD3 ? d3.geoGraticule10() : null;
const KMAX = 220000, CITY_K = 26000, SELECT_K = 38000, COUNTRY_K = 2600;
const view = { mode: ls.get('kindbox.view','flat') === 'globe' ? 'globe' : 'flat', c:[10, 22], k: 0 };
let CW = 0, CH = 0, DPR = 1, P = null, clusters = [], lastRows = [], inited = false;
let TK = {};
function readTokens(){
  const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  TK = { ocean:g('--ocean'), land:g('--landfill'), border:g('--border'), grat:g('--grat'), glow:g('--globeglow'),
         leaf:g('--leaf'), squash:g('--squash'), surface:g('--surface'), muted:g('--muted'), ink:g('--ink'), taken:g('--taken'), leafInk:g('--leaf-ink') };
}
function insets(){
  if (!isDesk()) return {l:0, r:0, t:40, b:0};
  const narrow = innerWidth <= 1240;
  return {l: narrow?332:372, r: state.selected ? 432 : (narrow?316:356), t:150, b:250};
}
function safe(){ const i = insets(); const w = Math.max(160, CW-i.l-i.r), h = Math.max(160, CH-i.t-i.b); return {x:i.l + w/2, y:i.t + h/2, w, h}; }
function kMin(mode = view.mode){ const s = safe(); return mode === 'globe' ? Math.min(s.w, s.h)/2*0.94 : s.w/(2*Math.PI); }
function clampView(){
  view.k = Math.max(kMin(), Math.min(KMAX, view.k));
  view.c[0] = ((view.c[0] + 540) % 360) - 180;
  view.c[1] = Math.max(view.mode==='globe' ? -80 : -62, Math.min(view.mode==='globe' ? 80 : 75, view.c[1]));
}
function makeProj(){
  const s = safe();
  if (view.mode === 'globe') return d3.geoOrthographic().scale(view.k).rotate([-view.c[0], -view.c[1]]).translate([s.x, s.y]).clipAngle(90).precision(0.4);
  return d3.geoMercator().scale(view.k).center(view.c).translate([s.x, s.y]).clipExtent([[-40,-40],[CW+40, CH+40]]);
}
function visible(ll){ return view.mode !== 'globe' || d3.geoDistance(ll, view.c) < Math.PI/2 - 0.02; }

function resizeMap(){
  const r = cv.getBoundingClientRect(); if (!r.width) return;
  CW = r.width; CH = r.height; DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(CW*DPR); cv.height = Math.round(CH*DPR);
  if (!inited){ inited = true; homeView(true); }
  clampView(); draw();
}
function homeView(initial){
  if (initial && !isDesk()){ view.c = [state.me.lng, state.me.lat]; view.k = CITY_K*2.2; return; }
  view.c = view.mode === 'globe' ? [state.me.lng, Math.max(-30, Math.min(40, state.me.lat))] : [10, 22];
  view.k = kMin();
}

let raf = 0;
function draw(){ if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawNow(); }); }
function drawNow(){
  if (!CW) return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,CW,CH);
  if (!hasD3){ ctx.fillStyle = TK.muted; ctx.font = '14px system-ui'; ctx.fillText('Map needs an internet connection to load.', 20, 40); return; }
  P = makeProj();
  const path = d3.geoPath(P, ctx);
  const detailed = view.k > 900;
  const globe = view.mode === 'globe';
  const s = safe();
  if (globe){
    const R = view.k;
    const g = ctx.createRadialGradient(s.x, s.y, R*0.9, s.x, s.y, R*1.35);
    g.addColorStop(0, TK.glow); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,0,CW,CH);
    ctx.beginPath(); path(SPHERE); ctx.fillStyle = TK.ocean; ctx.fill();
  } else { ctx.fillStyle = TK.ocean; ctx.fillRect(0,0,CW,CH); }
  ctx.beginPath(); path(GRAT); ctx.strokeStyle = TK.grat; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath(); for (const f of (detailed ? C50 : C110)) path(f);
  ctx.fillStyle = TK.land; ctx.fill();
  ctx.beginPath(); path(detailed ? M50 : M110); ctx.strokeStyle = TK.border; ctx.lineWidth = detailed ? 1 : 0.7; ctx.stroke();
  if (globe){ ctx.beginPath(); path(SPHERE); ctx.strokeStyle = TK.border; ctx.lineWidth = 1.2; ctx.stroke(); }
  // city labels
  if (view.k > 1400){
    ctx.font = `700 11px ${getComputedStyle(document.body).fontFamily}`; ctx.textAlign = 'center';
    ctx.fillStyle = TK.muted;
    for (const c of CITIES){ const ll = [c.lng, c.lat]; if (!visible(ll)) continue; const p = P(ll); if (!p) continue;
      const off = view.k > 15000 ? -46 : -24; ctx.fillText(c.name.toUpperCase(), p[0], p[1] + off); }
  }
  buildClusters(); drawClusters(); drawMe();
}
function buildClusters(){
  const pts = [];
  const rows = lastRows.slice();
  if (state.selected && !rows.find(r=>r.b.id===state.selected)) rows.push(rowFor(state.selected, []));
  for (const r of rows){
    const ll = [r.b.lng, r.b.lat]; if (!visible(ll)) continue;
    const p = P(ll); if (!p || p[0] < -30 || p[1] < -30 || p[0] > CW+30 || p[1] > CH+30) continue;
    pts.push({x:p[0], y:p[1], rows:[r], n:r.avail.length, ll});
  }
  pts.sort((a,b)=>b.n-a.n);
  const R = isDesk() ? 44 : 40, merge = view.k < KMAX*0.8;
  clusters = [];
  for (const pt of pts){
    const isSel = pt.rows[0].b.id === state.selected;
    const c = merge && !isSel && clusters.find(c => !c.sel &&(c.x-pt.x)**2 + (c.y-pt.y)**2 < R*R);
    if (c){ c.rows.push(...pt.rows); c.n += pt.n; c.sx += pt.x; c.sy += pt.y; c.m++; }
    else clusters.push({...pt, sx:pt.x, sy:pt.y, m:1, sel:isSel});
  }
  for (const c of clusters){ if (c.m > 1){ c.x = c.sx/c.m; c.y = c.sy/c.m; c.ll = P.invert([c.x, c.y]) || c.ll; } }
}
function radiusOf(c){ return c.rows.length > 1 ? 14 + Math.min(16, Math.log2(c.n+1)*3.2) : 11 + Math.min(c.n, 8)*0.6; }
function drawClusters(){
  const font = getComputedStyle(document.documentElement).getPropertyValue('--f-display');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const c of [...clusters].sort((a,b)=>(a.sel?1:0)-(b.sel?1:0))){
    const multi = c.rows.length > 1, r = radiusOf(c);
    const sel = c.rows.some(x => x.b.id === state.selected);
    const open = c.rows.some(x => x.open);
    const zero = c.n === 0;
    if (multi){ ctx.beginPath(); ctx.arc(c.x, c.y, r + 5, 0, Math.PI*2); ctx.fillStyle = sel ? TK.ink : TK.squash; ctx.globalAlpha = .18; ctx.fill(); ctx.globalAlpha = 1; }
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI*2);
    const fill = sel ? TK.leaf : zero ? TK.taken : (!open && !multi) ? TK.surface : TK.squash;
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = (!open && !multi && !sel && !zero) ? TK.squash : TK.surface; ctx.stroke();
    ctx.fillStyle = (!open && !multi && !sel && !zero) ? TK.squash : '#fff';
    ctx.font = `800 ${multi ? 12.5 : 11.5}px ${font}`;
    ctx.fillText(fmtN(c.n), c.x, c.y + 0.5);
  }
}
function drawMe(){
  const ll = [state.me.lng, state.me.lat]; if (!visible(ll)) return; const p = P(ll); if (!p) return;
  ctx.beginPath(); ctx.arc(p[0], p[1], 15, 0, Math.PI*2); ctx.fillStyle = TK.leaf; ctx.globalAlpha = .18; ctx.fill(); ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI*2); ctx.fillStyle = TK.leaf; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = TK.surface; ctx.stroke();
}

/* camera animation */
let anim = null;
function flyTo(ll, k, dur = 1100){
  if (!hasD3) return;
  cancelAnimationFrame(anim);
  const c0 = view.c.slice(), k0 = view.k, k1 = Math.max(kMin(), Math.min(KMAX, k));
  const dist = d3.geoDistance(c0, ll);
  const interp = d3.geoInterpolate(c0, ll);
  const kArc = dist > 0.15 ? Math.max(kMin(), Math.min(k0, k1) / (1 + dist*4)) : null;
  if (RM.matches || dur === 0){ view.c = ll.slice(); view.k = k1; clampView(); draw(); return; }
  const t0 = performance.now(); dur = dist > 0.5 ? dur*1.4 : dur;
  const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const lerpLog = (a,b,t) => Math.exp(Math.log(a) + (Math.log(b)-Math.log(a))*t);
  const step = now => {
    const t = Math.min(1, (now - t0)/dur), e = ease(t);
    view.c = interp(e);
    view.k = kArc ? (e < .5 ? lerpLog(k0, kArc, e*2) : lerpLog(kArc, k1, e*2-1)) : lerpLog(k0, k1, e);
    clampView(); drawNow();
    if (t < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}

/* interaction: drag to pan/rotate, wheel/pinch to zoom, tap to pick */
const ptrs = new Map(); let drag = null;
function zoomAt(f, mx, my){
  const k1 = Math.max(kMin(), Math.min(KMAX, view.k * f));
  if (view.mode === 'globe' || mx == null){ view.k = k1; clampView(); draw(); return; }
  const P0 = makeProj(); const ll = P0.invert([mx, my]);
  view.k = k1; clampView();
  const P1 = makeProj(); const q = P1(ll); const s = safe();
  if (q){ const c = P1.invert([s.x + (q[0]-mx), s.y + (q[1]-my)]); if (c) view.c = c; }
  clampView(); draw();
}
function panBy(dx, dy){
  if (view.mode === 'globe'){
    const deg = 180/Math.PI/view.k;
    view.c[0] -= dx*deg; view.c[1] += dy*deg;
  } else {
    const s = safe(); const P0 = makeProj(); const c = P0.invert([s.x - dx, s.y - dy]); if (c) view.c = c;
  }
  clampView(); draw();
}
const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', e => {
  cancelAnimationFrame(anim);
  ptrs.set(e.pointerId, local(e));
  try { cv.setPointerCapture(e.pointerId); } catch {}
  if (ptrs.size === 1) drag = {start: local(e), last: local(e), moved: false};
  else { drag = null; }
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId), cur = local(e);
  if (ptrs.size === 2){
    const [a, b] = [...ptrs.values()];
    const other = a === prev ? b : a;
    const d0 = Math.hypot(prev[0]-other[0], prev[1]-other[1]), d1 = Math.hypot(cur[0]-other[0], cur[1]-other[1]);
    ptrs.set(e.pointerId, cur);
    if (d0 > 0) zoomAt(d1/d0, (cur[0]+other[0])/2, (cur[1]+other[1])/2);
    return;
  }
  ptrs.set(e.pointerId, cur);
  if (!drag) return;
  if (!drag.moved && Math.hypot(cur[0]-drag.start[0], cur[1]-drag.start[1]) > 5) drag.moved = true;
  if (drag.moved){ panBy(cur[0]-drag.last[0], cur[1]-drag.last[1]); cv.style.cursor = 'grabbing'; }
  drag.last = cur;
});
function endPtr(e){
  ptrs.delete(e.pointerId); cv.style.cursor = '';
  if (!drag || ptrs.size) { if (!ptrs.size) drag = null; return; }
  const d = drag; drag = null;
  if (d.moved || e.type === 'pointercancel') return;
  const [x, y] = local(e);
  let hit = null, best = 1e9;
  for (const c of clusters){ const dd = Math.hypot(c.x-x, c.y-y); if (dd < radiusOf(c) + 6 && dd < best){ best = dd; hit = c; } }
  if (hit){
    if (hit.rows.length > 1){
      const xs = hit.rows.map(r=>r.b.lng), ys = hit.rows.map(r=>r.b.lat);
      const span = Math.max(Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys), 0.02);
      const ctr = [(Math.max(...xs)+Math.min(...xs))/2, (Math.max(...ys)+Math.min(...ys))/2];
      const s = safe(); const k = Math.min(KMAX, Math.max(view.k*2.5, Math.min(s.w, s.h) / (span*Math.PI/180) * 0.55));
      flyTo(ctr, k, 900);
    } else select(hit.rows[0].b.id, false);
    return;
  }
  const ll = P && P.invert([x, y]);
  if (!ll || !isFinite(ll[0]) || !isFinite(ll[1]) || !visible(ll)) return;
  let near = CITIES[0], nd = 1e9; for (const c of CITIES){ const m = miles({lat:ll[1],lng:ll[0]}, c); if (m < nd){ nd = m; near = c; } }
  state.me = {lat: ll[1], lng: ll[0], label: 'your pinned spot', cc: nd < 400 ? near.cc : state.me.cc};
  nearSel.value = 'pin'; renderFind(); toast('Location set. Sorted by distance from your pin.');
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('wheel', e => { e.preventDefault(); cancelAnimationFrame(anim); const [x,y] = local(e); zoomAt(Math.exp(-e.deltaY*0.0016), x, y); }, {passive:false});
cv.addEventListener('dblclick', e => { const [x,y] = local(e); zoomAt(2, x, y); });
cv.addEventListener('pointermove', e => {
  if (drag || ptrs.size) return;
  const [x,y] = local(e); const over = clusters.some(c => Math.hypot(c.x-x, c.y-y) < radiusOf(c)+4);
  cv.style.cursor = over ? 'pointer' : 'grab';
});
cv.addEventListener('keydown', e => {
  const k = e.key, step = 60;
  if (k === '+' || k === '=') zoomAt(1.6); else if (k === '-') zoomAt(1/1.6);
  else if (k === 'ArrowLeft') panBy(step,0); else if (k === 'ArrowRight') panBy(-step,0);
  else if (k === 'ArrowUp') panBy(0,step); else if (k === 'ArrowDown') panBy(0,-step); else return;
  e.preventDefault();
});
$('#zin').onclick = () => flyTo(view.c.slice(), view.k*1.9, 450);
$('#zout').onclick = () => flyTo(view.c.slice(), view.k/1.9, 450);
$('#zreset').onclick = () => { state.selected = null; renderFind(); const k = kMin(); flyTo(view.mode==='globe' ? [view.c[0], 20] : [10, 22], k, 900); };
function setView(m){
  view.mode = m; ls.set('kindbox.view', m);
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === m));
  if (!CW) return;
  if (m === 'globe' && view.k < kMin('globe')) view.k = kMin('globe');
  clampView(); draw();
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
setView(view.mode);

function renderFind(){
  lastRows = computeBanks();
  renderSummary(lastRows); renderList(lastRows); renderFacets(); draw();
  if (isDesk()){ renderDrawer(lastRows); renderRail(lastRows); renderDock(lastRows); } else { $('#drawer').hidden = true; renderMobile(); }
}

/* ---------- claims & drops (shared store with local fallback) ---------- */
async function claim(id){
  const at = Date.now();
  state.claims[id] = at; renderFind();
  if (db){
    try { await db.collection('claims').doc(id).set({at}); toast(t('toast.taken')); return; }
    catch(err){ /* fall through to local */ }
  }
  const local = ls.get('kindbox.claims', {}); local[id] = at; ls.set('kindbox.claims', local);
  toast(t('toast.taken'));
}
function setStoreStatus(){
  const el = $('#storeStatus');
  el.className = 'status' + (state.store==='shared'?' live':'');
  el.innerHTML = `<i></i>${state.store==='shared' ? 'Listings are shared live with everyone' : 'Demo mode: listings stay on this device'}`;
}
function mergeLocal(){ return { localDrops: ls.get('kindbox.drops', []), localClaims: ls.get('kindbox.claims', {}) }; }
(function applyLocal(){ const { localDrops, localClaims } = mergeLocal(); state.drops = localDrops; state.claims = {...localClaims}; })();
async function connect(){
  try { if (!window.claude?.use) throw 0; db = await window.claude.use('db'); } catch { db = null; }
  if (!db){ state.store = 'local'; setStoreStatus(); return; }
  state.store = 'shared'; setStoreStatus(); listenPrograms();
  const { localDrops, localClaims } = mergeLocal();
  db.collection('drops').onSnapshot(snap => {
    const remote = snap.docs.map(d => { const x = d.data()||{}; return {
      id:d.id, bankId:String(x.bankId||''), title:String(x.title||'Food box').slice(0,60), contents:String(x.contents||'').slice(0,200),
      kind: KINDS.includes(x.kind)?x.kind:'Cooked meal', servings: Math.max(1, Math.min(50, +x.servings||1)),
      tags: Array.isArray(x.tags)?x.tags.filter(t=>DIETS.includes(t)):[], packedAt:+x.packedAt||Date.now(), eatBy:+x.eatBy||Date.now(),
      donor:String(x.donor||'').slice(0,24), code:String(x.code||'').slice(0,8), source:'drop' }; }).filter(x => bankById[x.bankId]);
    const ids = new Set(remote.map(r=>r.id));
    state.drops = [...remote, ...localDrops.filter(d=>!ids.has(d.id))];
    renderFind(); renderMine();
  }, () => { state.store='local'; setStoreStatus(); });
  db.collection('claims').onSnapshot(snap => {
    const c = {...localClaims}; snap.docs.forEach(d => { c[d.id] = d.data().at || 1; });
    state.claims = c; renderFind();
  }, () => {});
}

/* ---------- GIVE ---------- */
const gBank = $('#gBank');
function fillBankSelect(){
  const byCity = {};
  for (const b of BANKS) (byCity[`${b.city}, ${b.country}`] ||= []).push(b);
  const order = Object.keys(byCity).sort((a,b) => miles(state.me, byCity[a][0]) - miles(state.me, byCity[b][0]));
  const cur = gBank.value;
  gBank.innerHTML = order.map(c => `<optgroup label="${esc(c)}">${byCity[c].map(b=>`<option value="${b.id}">${esc(b.hood)} — ${esc(b.name)}</option>`).join('')}</optgroup>`).join('');
  if (cur && bankById[cur]) gBank.value = cur;
}
fillBankSelect();
$('#gKind').innerHTML = KINDS.map(k=>`<option>${k}</option>`).join('');
$('#gTags').innerHTML = DIETS.map(d=>`<button type="button" class="chip" aria-pressed="false" data-tag="${d}">${d}</button>`).join('');
const gTags = new Set(); let servings = 2;
$('#gTags').addEventListener('click', e => { const c = e.target.closest('[data-tag]'); if(!c) return; const t=c.dataset.tag; gTags.has(t)?gTags.delete(t):gTags.add(t); c.setAttribute('aria-pressed', gTags.has(t)); updatePreview(); });
$('#sMinus').onclick = () => { servings = Math.max(1, servings-1); $('#gServ').textContent = servings; updatePreview(); };
$('#sPlus').onclick = () => { servings = Math.min(50, servings+1); $('#gServ').textContent = servings; updatePreview(); };
['#gBank','#gTitle','#gContents','#gKind','#gPacked','#gEat','#gName'].forEach(s => $(s).addEventListener('input', updatePreview));
let pendingCode = makeCode();
function makeCode(){ return 'EP-' + String(Math.floor(1000 + Math.random()*9000)); }
function formDraft(){
  const packedAt = Date.now() - (+$('#gPacked').value)*60000;
  return { bankId: gBank.value, title: $('#gTitle').value.trim(), contents: $('#gContents').value.trim(),
    kind: $('#gKind').value, servings, tags: DIETS.filter(d=>gTags.has(d)),
    packedAt, eatBy: packedAt + (+$('#gEat').value)*H, donor: $('#gName').value.trim() };
}
function updatePreview(){
  const d = formDraft(); const b = bankById[d.bankId]; const tz = b?.tz;
  $('#gBankHint').textContent = b ? `${b.address}, ${b.city} · ${hoursText(b)} · ${b.fridge?'Has a fridge':'Shelf only — no cooked food that needs cold storage'}` : '';
  $('#labelPreview').innerHTML = `
    <div class="hd"><b>ETERNAL POT</b><span>${pendingCode}</span></div>
    <div class="ttl">${esc(d.title) || '<span class="muted">What\'s inside</span>'}</div>
    <dl>
      <dt>Packed</dt><dd>${clock(d.packedAt, tz)}</dd>
      <dt>Eat by</dt><dd>${clock(d.eatBy, tz)}</dd>
      <dt>Serves</dt><dd>${d.servings}</dd>
      <dt>Type</dt><dd>${esc(d.kind)}</dd>
      <dt>For</dt><dd>${d.tags.length?esc(d.tags.join(', ')):'—'}</dd>
      ${d.contents?`<dt>Note</dt><dd>${esc(d.contents)}</dd>`:''}
    </dl>`;
}
$('#giveForm').addEventListener('submit', async e => {
  e.preventDefault();
  const d = formDraft(); const err = $('#gErr');
  if (!d.title){ err.textContent = t('give.errTitle'); $('#gTitle').focus(); return; }
  if (!$('#gPledge').checked){ err.textContent = t('give.errPledge'); $('#gPledge').focus(); return; }
  if (!bankById[d.bankId].fridge && +$('#gEat').value <= 24 && d.kind === 'Cooked meal'){
    err.textContent = t('give.errFridge'); gBank.focus(); return;
  }
  err.textContent = '';
  const before = computeRewards();
  const id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const drop = {...d, code: pendingCode, createdAt: Date.now(), source:'drop'};
  let shared = false;
  if (db){ try { await db.collection('drops').doc(id).set(drop); shared = true; } catch {} }
  if (!shared){ const arr = ls.get('kindbox.drops', []); arr.unshift({...drop, id}); ls.set('kindbox.drops', arr); state.drops = [{...drop,id}, ...state.drops.filter(x=>x.id!==id)]; }
  myIds.add(id); ls.set('kindbox.mine', [...myIds].slice(-20));
  const after = computeRewards();
  showDone({...drop, id}, shared, after.pts - before.pts, after);
  renderFind(); renderMine();
  if (after.certs.length > before.certs.length) setTimeout(() => { toast(t('rew.newCert')); openCert(after.certs[after.certs.length-1]); }, 600);
});
function showDone(drop, shared, gained = 0, R = null){
  const b = bankById[drop.bankId];
  $('#giveFormWrap').hidden = true; const box = $('#doneBox'); box.hidden = false;
  box.innerHTML = `<div class="done">
    <div class="sect">${t('give.listed')}</div>
    <h2>${t('give.thanks')}${drop.donor?', '+esc(drop.donor):''}</h2>
    <p class="lede" style="margin:0">${esc(t('give.codeHint',{place:b.name+', '+b.city}))}</p>
    <div class="code">${drop.code}</div>
    <p class="muted" style="margin:0">${esc(drop.title)} · ${servTxt(drop.servings)} · ${eatText(drop)}</p>
    ${R ? `<div class="earned"><b>${t('give.points',{n:gained})}</b><span>${t('give.streak',{n:R.inRow || (R.certs.length ? 5 : 0)})}</span><button class="btn small" data-mode="rewards">${t('promo.rew.go')}</button></div>` : ''}
    <div class="actions">
      <button class="btn primary" id="seeIt">${t('give.seeMap')}</button>
      <button class="btn" id="another">${t('give.another')}</button>
    </div></div>`;
  $('#seeIt').onclick = () => { setMode('find'); state.q=''; $('#q').value=''; select(drop.bankId, true); };
  $('#another').onclick = resetGive;
  box.querySelector('h2').setAttribute('tabindex','-1'); box.querySelector('h2').focus();
}
function resetGive(){
  ['#gTitle','#gContents','#gName'].forEach(s => $(s).value = '');
  $('#gPledge').checked = false; gTags.clear(); servings = 2; $('#gServ').textContent = 2;
  document.querySelectorAll('#gTags .chip').forEach(c => c.setAttribute('aria-pressed','false'));
  pendingCode = makeCode();
  $('#doneBox').hidden = true; $('#giveFormWrap').hidden = false; updatePreview(); $('#gTitle').focus();
}
function renderMine(){
  const mine = state.drops.filter(d => myIds.has(d.id));
  $('#myDropsCard').hidden = !mine.length;
  $('#myDrops').innerHTML = mine.slice(0,6).map(d => `<div><span><b class="mono">${esc(d.code)}</b> ${esc(d.title)}</span><span class="muted">${state.claims[d.id]?'Picked up':(d.eatBy<Date.now()?'Expired':esc(bankById[d.bankId]?.city||''))}</span></div>`).join('');
}


/* ---------- PROGRAMS (NGOs, city councils, community groups) ---------- */
const PCATS = ["Job training","Food drive","Community meal","Housing & benefits","Health & wellbeing","Volunteer event"];
const PCOL = {"Job training":"var(--leaf)","Food drive":"var(--squash)","Community meal":"var(--k-meal)","Housing & benefits":"var(--k-baby)","Health & wellbeing":"var(--k-snacks)","Volunteer event":"var(--k-bakery)"};
const PAUD = ["Adults","Youth","Families","Seniors","Veterans"];
const SF_TZ = 'America/Los_Angeles';
function todayISO(){ const f = new Intl.DateTimeFormat('en-CA',{timeZone:SF_TZ,year:'numeric',month:'2-digit',day:'2-digit'}); return f.format(new Date()); }
function addDays(iso, n){ const [y,m,d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y, m-1, d+n)); return t.toISOString().slice(0,10); }
const TODAY = todayISO();
const seedPrograms = (SEED.programs || []).map(p => ({...p, date: addDays(TODAY, p.dayOffset), source:'seed'}));
const pstate = { cat: null, aud: new Set(), q: '', posted: ls.get('kindbox.programs', []), remote: [], saved: new Set(ls.get('kindbox.saved', [])), open: new Set(), savedOnly: false };
function allPrograms(){
  const ids = new Set(pstate.remote.map(p=>p.id));
  return [...pstate.remote, ...pstate.posted.filter(p=>!ids.has(p.id)), ...seedPrograms].filter(p => p.date >= TODAY).sort((a,b) => (a.date+a.start).localeCompare(b.date+b.start));
}
function dParts(iso){ const [y,m,d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y,m-1,d));
  return { day: d, mon: t.toLocaleDateString(LOC(),{month:'short',timeZone:'UTC'}), wk: t.toLocaleDateString(LOC(),{weekday:'short',timeZone:'UTC'}), long: t.toLocaleDateString(LOC(),{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'}) }; }
function relDay(iso){ if (iso === TODAY) return t('prog.today'); if (iso === addDays(TODAY,1)) return t('prog.tomorrow'); return dParts(iso).long; }
function buildProgChips(){
  $('#pCats').innerHTML = `<button class="chip toggle" data-pcat="" aria-pressed="${!pstate.cat}">${t('prog.all')}</button>` + PCATS.map(c=>`<button class="chip" data-pcat="${c}" aria-pressed="${pstate.cat===c}"><span class="kdot" style="background:${PCOL[c]}"></span>${t('pcat.'+c)}</button>`).join('') + `<button class="chip" data-psaved aria-pressed="${pstate.savedOnly}">${t('prog.saved')}</button>`;
  $('#pAud').innerHTML = PAUD.map(a=>`<button class="chip" data-paud="${a}" aria-pressed="${pstate.aud.has(a)}">${t('aud.'+a)}</button>`).join('');
}
buildProgChips();
$('#pCats').addEventListener('click', e => {
  const sv = e.target.closest('[data-psaved]');
  if (sv){ pstate.savedOnly = !pstate.savedOnly; sv.setAttribute('aria-pressed', pstate.savedOnly); renderPrograms(); return; }
  const c = e.target.closest('[data-pcat]'); if (!c) return;
  pstate.cat = c.dataset.pcat || null;
  document.querySelectorAll('[data-pcat]').forEach(x => x.setAttribute('aria-pressed', (x.dataset.pcat || null) === pstate.cat));
  renderPrograms();
});
$('#pAud').addEventListener('click', e => { const c = e.target.closest('[data-paud]'); if (!c) return; const a = c.dataset.paud; pstate.aud.has(a)?pstate.aud.delete(a):pstate.aud.add(a); c.setAttribute('aria-pressed', pstate.aud.has(a)); renderPrograms(); });
let pqT; $('#pq').addEventListener('input', e => { clearTimeout(pqT); pqT = setTimeout(()=>{ pstate.q = e.target.value.trim().toLowerCase(); renderPrograms(); }, 120); });
function progCard(p){
  const d = dParts(p.date), c = PCOL[p.category] || 'var(--leaf)', saved = pstate.saved.has(p.id), open = pstate.open.has(p.id);
  return `<article class="pcard" style="--c:${c}">
    <div class="pdate" aria-label="${esc(d.long)}"><small>${d.wk}</small><b>${d.day}</b><span>${d.mon}</span></div>
    <div class="pbody">
      <div class="ptop"><span class="pcat">${t('pcat.'+p.category)}</span><span class="potype">${esc(p.orgType)}</span>${p.source!=='seed'?'<span class="pnew">New</span>':''}</div>
      <h3>${esc(p.title)}</h3>
      <div class="porg">by ${esc(p.org)}</div>
      <dl class="pfacts">
        <dt>${t('prog.when')}</dt><dd>${relDay(p.date)}, ${fmtHM(p.start)} – ${fmtHM(p.end)}${p.recurring?` · ${esc(p.recurring)}`:''}</dd>
        <dt>${t('prog.where')}</dt><dd>${esc(p.place)}${p.address?`, ${esc(p.address)}`:''} · ${esc(p.hood)}</dd>
        <dt>${t('prog.cost')}</dt><dd>${esc(p.cost||'Free')}</dd>
        ${p.languages?.length?`<dt>${t('prog.langs')}</dt><dd>${esc(p.languages.join(', '))}</dd>`:''}
        ${p.audience?.length?`<dt>${t('prog.for')}</dt><dd>${esc(p.audience.map(a=>t('aud.'+a)).join(', '))}</dd>`:''}
      </dl>
      ${p.desc?`<p>${esc(p.desc)}</p>`:''}
      <div class="pfoot">
        <span class="spots">${t('prog.spots',{n:p.spots})}</span>
        <button class="btn small${saved?' saved':''}" data-psave="${p.id}" aria-pressed="${saved}">${saved?t('prog.saved'):t('prog.save')}</button>
        <button class="btn small primary" data-phow="${p.id}" aria-expanded="${open}">${t('prog.how')}</button>
      </div>
      ${open?`<div class="phow"><span>${esc(p.contact)}</span><button class="btn small" data-pcopy="${p.id}">Copy</button></div>`:''}
    </div>
  </article>`;
}
function renderPrograms(){
  const q = pstate.q;
  const list = allPrograms().filter(p => (!pstate.cat || p.category === pstate.cat)
    && (!pstate.savedOnly || pstate.saved.has(p.id))
    && [...pstate.aud].every(a => (p.audience||[]).includes(a))
    && (!q || `${p.title} ${p.org} ${p.hood} ${p.place} ${p.category} ${p.desc} ${(p.languages||[]).join(' ')}`.toLowerCase().includes(q)));
  const week = list.filter(p => p.date <= addDays(TODAY, 6)).length;
  const orgs = new Set(list.map(p=>p.org)).size;
  $('#pSum').innerHTML = esc(t('prog.sum',{n:list.length,o:orgs,w:week}));
  $('#pGrid').innerHTML = list.length ? list.map(progCard).join('') : `<div class="empty p-empty"><b>No programs match</b>Try another category or clear your search.</div>`;
}
$('#pGrid').addEventListener('click', async e => {
  const s = e.target.closest('[data-psave]'), h = e.target.closest('[data-phow]'), c = e.target.closest('[data-pcopy]');
  if (s){ const id = s.dataset.psave; pstate.saved.has(id) ? pstate.saved.delete(id) : pstate.saved.add(id); ls.set('kindbox.saved', [...pstate.saved]); toast(pstate.saved.has(id) ? 'Saved on this device' : 'Removed from saved'); renderPrograms(); }
  else if (h){ const id = h.dataset.phow; pstate.open.has(id) ? pstate.open.delete(id) : pstate.open.add(id); renderPrograms(); }
  else if (c){ const p = allPrograms().find(x => x.id === c.dataset.pcopy); try { await navigator.clipboard.writeText(p.contact); toast('Copied'); } catch { const r = document.createRange(); r.selectNodeContents(c.previousElementSibling); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Selected. Copy it.'); } }
});
// post form
$('#pCat').innerHTML = PCATS.map(c=>`<option>${c}</option>`).join('');
$('#pAudPick').innerHTML = PAUD.map(a=>`<button type="button" class="chip" data-pa="${a}" aria-pressed="false">${a}</button>`).join('');
const pAudSel = new Set();
$('#pAudPick').addEventListener('click', e => { const c = e.target.closest('[data-pa]'); if (!c) return; const a = c.dataset.pa; pAudSel.has(a)?pAudSel.delete(a):pAudSel.add(a); c.setAttribute('aria-pressed', pAudSel.has(a)); });
$('#pDate').min = TODAY; $('#pDate').value = addDays(TODAY, 7);
$('#postProgBtn').onclick = () => { $('#pPost').hidden = false; $('#pOrg').focus(); };
$('#pClose').onclick = () => { $('#pPost').hidden = true; };
$('#progForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => $(id).value.trim(), err = $('#pErr');
  if (!v('#pOrg') || !v('#pTitle') || !v('#pContact')){ err.textContent = 'Add the organization, program title and how people can join.'; return; }
  if (!v('#pDate') || v('#pDate') < TODAY){ err.textContent = 'Pick a date from today onward.'; $('#pDate').focus(); return; }
  if (!$('#pConfirm').checked){ err.textContent = 'Please confirm your organization type and that the details are accurate.'; $('#pConfirm').focus(); return; }
  err.textContent = '';
  const id = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const prog = { title:v('#pTitle'), org:v('#pOrg'), orgType:v('#pOrgType'), category:v('#pCat'), date:v('#pDate'), start:v('#pStart')||'10:00', end:v('#pEnd')||'12:00',
    recurring:v('#pRec'), place:v('#pPlace')||'To be announced', address:v('#pAddr'), hood:v('#pHood'), cost:'Free',
    languages: v('#pLang') ? v('#pLang').split(',').map(x=>x.trim()).filter(Boolean).slice(0,6) : ['English'],
    audience:[...pAudSel], spots: Math.max(1, Math.min(2000, +v('#pSpots')||20)), contact:v('#pContact'), desc:v('#pDesc'), createdAt: Date.now(), source:'posted' };
  let shared = false;
  if (db){ try { await db.collection('programs').doc(id).set(prog); shared = true; } catch {} }
  if (!shared){ pstate.posted = [{...prog, id}, ...pstate.posted]; ls.set('kindbox.programs', pstate.posted.slice(0,50)); }
  e.target.reset(); pAudSel.clear(); document.querySelectorAll('#pAudPick .chip').forEach(c=>c.setAttribute('aria-pressed','false'));
  $('#pDate').value = addDays(TODAY, 7); $('#pPost').hidden = true;
  pstate.cat = null; document.querySelectorAll('[data-pcat]').forEach(x => x.setAttribute('aria-pressed', !x.dataset.pcat));
  renderPrograms(); toast(shared ? 'Program published' : 'Program published on this device');
});
function listenPrograms(){
  if (!db) return;
  db.collection('programs').onSnapshot(snap => {
    pstate.remote = snap.docs.map(d => { const x = d.data()||{}; return {
      id:d.id, title:String(x.title||'Program').slice(0,70), org:String(x.org||'Community group').slice(0,60), orgType:String(x.orgType||'Community group').slice(0,30),
      category: PCATS.includes(x.category)?x.category:'Volunteer event', date:/^\d{4}-\d{2}-\d{2}$/.test(x.date)?x.date:TODAY,
      start:/^\d{2}:\d{2}$/.test(x.start)?x.start:'10:00', end:/^\d{2}:\d{2}$/.test(x.end)?x.end:'12:00', recurring:String(x.recurring||'').slice(0,40),
      place:String(x.place||'').slice(0,60), address:String(x.address||'').slice(0,80), hood:String(x.hood||'San Francisco').slice(0,40), cost:String(x.cost||'Free').slice(0,40),
      languages:Array.isArray(x.languages)?x.languages.map(String).slice(0,6):[], audience:Array.isArray(x.audience)?x.audience.filter(a=>PAUD.includes(a)):[],
      spots:Math.max(1, Math.min(2000, +x.spots||1)), contact:String(x.contact||'').slice(0,80), desc:String(x.desc||'').slice(0,400), source:'posted' }; });
    if (state.mode === 'programs') renderPrograms();
  }, () => {});
}


/* ======================================================================
   MOBILE APP (phones and tablets, <1024px): home feed, map tab, sheets
   ====================================================================== */
const MKIND = {"Cooked meal":"Meals","Produce":"Produce","Bakery":"Bakery","Pantry":"Pantry","Snacks":"Snacks","Baby & kids":"Baby"};
const IC = {
  dir:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-8-8 18-2-8z"/></svg>',
  copy:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  drop:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 8l3-5h12l3 5M12 12v6M9 15h6"/></svg>',
  arrow:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
};
function openText(b){ if (b.open==='00:00' && b.close==='24:00') return t('st.24'); return isOpen(b) ? t('st.until',{t:fmtHM(b.close)}) : t('st.opens',{t:fmtHM(b.open)}); }
function walkBit(mi){ return mi < 3 ? ` · ${t('u.walk',{n:Math.max(1, Math.round(mi*20))})}` : ''; }
const servTxt = n => t('u.servings', {n});
function storeCard(r, big){
  const k = r.avail[0]?.kind || 'Pantry';
  return `<button class="m-store${big?' big':''}" data-sel="${r.b.id}">
    <span class="m-art" style="background:${artBg(k)}">${kindArt(k, big?92:70)}<span class="badge ${r.open?'ok':'no'}">${r.open?t('st.open'):t('st.closed')}</span><span class="cnt">${tN(r.avail.length)}</span></span>
    <span class="t">${esc(r.b.name)}</span>
    <span class="s">${esc(r.b.hood)} · ${distShort(r.mi)}${walkBit(r.mi)}</span>
    <span class="s"><span class="${r.open?'ok':'no'}">${openText(r.b)}</span> · ${r.b.fridge?t('st.fridge'):t('st.shelf')}</span>
  </button>`;
}
function syncFilterUI(){
  document.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', !!state[x.dataset.t]));
  document.querySelectorAll('[data-diet]').forEach(x => x.setAttribute('aria-pressed', state.diets.has(x.dataset.diet)));
  document.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', state.kinds.has(x.dataset.kind)));
  document.querySelectorAll('[data-mt]').forEach(x => x.setAttribute('aria-pressed', !!state[x.dataset.mt]));
  document.querySelectorAll('[data-md]').forEach(x => x.setAttribute('aria-pressed', state.diets.has(x.dataset.md)));
  document.querySelectorAll('[data-mk]').forEach(x => x.setAttribute('aria-pressed', state.kinds.has(x.dataset.mk)));
}
const PROMOS = [
  {id:'hungry', k:'promo.hungry', bg:'linear-gradient(135deg,var(--leaf),color-mix(in srgb,var(--leaf) 55%,#0b2a1a))', art:'Cooked meal'},
  {id:'give', k:'promo.give', bg:'linear-gradient(135deg,var(--squash),color-mix(in srgb,var(--squash) 60%,#5a1d00))', art:'Bakery'},
  {id:'rewards', k:'promo.rew', bg:'linear-gradient(135deg,var(--k-baby),color-mix(in srgb,var(--k-baby) 55%,#0b1f33))', art:'Produce'},
  {id:'programs', k:'promo.prog', bg:'linear-gradient(135deg,var(--k-bakery),color-mix(in srgb,var(--k-bakery) 55%,#3b2600))', art:'Pantry'}
];
function buildMobileChrome(){
  $('#mCats').innerHTML = KINDS.map(k => `<button class="m-cat" data-mk="${k}" aria-pressed="${state.kinds.has(k)}"><span class="ci" style="background:${artBg(k)}">${kindArt(k, 30)}</span><span>${kindLabel(k)}</span></button>`).join('');
  $('#mChips').innerHTML = `<button class="m-chip" data-mt="openNow" aria-pressed="${state.openNow}">${t('f.openNow')}</button><button class="m-chip" data-mt="hasFood" aria-pressed="${state.hasFood}">${t('f.hasFood')}</button>` + DIETS.map(d => `<button class="m-chip" data-md="${d}" aria-pressed="${state.diets.has(d)}">${dietLabel(d)}</button>`).join('');
  $('#mPromos').innerHTML = PROMOS.map(p => `<button class="m-promo" data-promo="${p.id}" style="background:${p.bg}"><b>${t(p.k+'.t')}</b><span>${t(p.k+'.s')}</span><i class="go">${t(p.k+'.go')} ${IC.arrow}</i><svg class="art" width="150" height="100" viewBox="0 0 120 80" aria-hidden="true">${kindArt(p.art, 80).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg></button>`).join('');
}
buildMobileChrome();
$('#mCats').addEventListener('click', e => { const c = e.target.closest('[data-mk]'); if (!c) return; toggleKind(c.dataset.mk); syncFilterUI(); renderFind(); });
$('#mChips').addEventListener('click', e => {
  const tg = e.target.closest('[data-mt]'), d = e.target.closest('[data-md]');
  if (tg) state[tg.dataset.mt] = !state[tg.dataset.mt];
  else if (d){ const v = d.dataset.md; state.diets.has(v) ? state.diets.delete(v) : state.diets.add(v); }
  else return;
  syncFilterUI(); renderFind();
});
let mqT; $('#mq').addEventListener('input', e => { clearTimeout(mqT); mqT = setTimeout(() => { state.q = e.target.value; $('#q').value = e.target.value; renderFind(); }, 140); });
$('#mPromos').addEventListener('click', e => {
  const p = e.target.closest('[data-promo]'); if (!p) return;
  const id = p.dataset.promo;
  if (id === 'hungry'){ const r = lastRows.find(x => x.open && x.avail.length) || lastRows.find(x => x.avail.length); if (r) select(r.b.id, false); else toast(t('toast.noOpen')); }
  else setMode(id === 'give' ? 'give' : id);
});

function renderMobile(){
  if (isDesk()) return;
  $('#mLocName').textContent = state.me.label === 'your pinned spot' ? t('m.pinned') : state.me.label;
  const rows = lastRows;
  const open = rows.filter(r => r.open && r.avail.length).slice(0, 10);
  $('#mOpen').innerHTML = open.length ? open.map(r => storeCard(r)).join('') : `<div class="m-empty">${t('empty.open')}</div>`;
  const near = rows.slice(0, 40);
  const fresh = near.flatMap(r => r.avail.map(p => ({p, r}))).filter(x => x.r.mi < 25 || near.indexOf(x.r) < 8).sort((a,b) => b.p.packedAt - a.p.packedAt).slice(0, 12);
  $('#mFresh').innerHTML = fresh.length ? fresh.map(({p, r}) => `<button class="m-store m-box" data-sel="${r.b.id}">
      <span class="m-art" style="background:${artBg(p.kind)}">${kindArt(p.kind, 54)}<span class="cnt">${servTxt(p.servings)}</span></span>
      <span class="t">${esc(p.title)}</span><span class="s">${esc(r.b.name)}</span><span class="s">${t('time.packed',{t:ago(p.packedAt)})} · ${distShort(r.mi)}</span></button>`).join('') : `<div class="m-empty">${t('empty.boxes')}</div>`;
  const progs = (typeof allPrograms === 'function') ? allPrograms().filter(p => p.date <= addDays(TODAY, 6)).slice(0, 8) : [];
  $('#mProgSec').hidden = !progs.length;
  $('#mProg').innerHTML = progs.map(p => { const d = dParts(p.date); return `<button class="m-pcard" data-mode="programs" style="--c:${PCOL[p.category]}"><span class="m-pdate"><small>${d.wk}</small><b>${d.day}</b></span><span class="m-pbody"><i>${t('pcat.'+p.category)}</i><b>${esc(p.title)}</b><span>${fmtHM(p.start)} · ${esc(p.hood)}</span></span></button>`; }).join('');
  const list = rows.slice(0, 30);
  $('#mCount').textContent = rows.length > 30 ? t('u.nearestOf',{n:30,total:rows.length}) : t('u.places',{n:rows.length});
  $('#mList').innerHTML = list.length ? list.map(r => storeCard(r, true)).join('') : `<div class="m-empty">${t('empty.filters')}</div>`;
  const mc = rows.filter(r => r.avail.length).slice(0, 12);
  $('#mMapCards').innerHTML = mc.map(r => { const k = r.avail[0]?.kind || 'Pantry'; return `<button class="m-mapcard${r.b.id===state.selected?' sel':''}" data-sel="${r.b.id}" data-fly="1"><span class="m-art" style="background:${artBg(k)}">${kindArt(k, 34)}</span><span><b>${esc(r.b.name)}</b><span class="s">${tN(r.avail.length)} · ${distShort(r.mi)}</span><span class="s ${r.open?'ok':'no'}">${openText(r.b)}</span></span></button>`; }).join('');
  $('#mPts').textContent = computeRewards().pts;
  if (sheetFor && !$('#mSheet').hidden) renderSheet();
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-sel]'); if (!s) return;
  if (e.target.closest('#mSheet')) return;
  select(s.dataset.sel, !!s.dataset.fly);
});

/* drop point sheet */
let sheetFor = null;
function sheetHTML(row){
  const b = row.b, k = row.avail[0]?.kind || 'Pantry';
  const taken = allPackets().filter(p => p.bankId===b.id && state.claims[p.id] && p.eatBy > Date.now());
  const item = (p, isTaken) => `<div class="ms-item${isTaken?' taken':''}">
      <div><h4>${esc(p.title)}</h4>${p.contents?`<p>${esc(p.contents)}</p>`:''}
        ${p.tags.length?`<div class="diet">${p.tags.slice(0,4).map(x=>`<span>${esc(dietLabel(x))}</span>`).join('')}</div>`:''}
        <div class="meta">${servTxt(p.servings)} · ${eatText(p)} · ${t('time.packed',{t:ago(p.packedAt)})}${p.donor?` · ${t('time.from',{name:esc(p.donor)})}`:''}</div></div>
      <div class="ms-thumb" style="background:${artBg(p.kind)}">${kindArt(p.kind, 50)}${isTaken?`<span class="ms-take done">${t('sheet.takenBtn')}</span>`:`<button class="ms-take${state.armed===p.id?' armed':''}" data-claim="${p.id}">${state.armed===p.id?t('sheet.confirm'):t('sheet.take')}</button>`}</div>
    </div>`;
  return `<div class="ms-hero" style="background:${artBg(k)}"><span class="ms-grab"></span>${kindArt(k, 120)}<button class="ms-x" data-close aria-label="Close">×</button></div>
    <div class="ms-body">
      <div><div class="sect">${esc(b.hood)} · ${esc(b.city)}</div><h2>${esc(b.name)}</h2>
        <div class="ms-meta"><span class="${row.open?'ok':'no'}">${row.open?t('st.open'):t('st.closedNow')}</span><span>·</span><span>${hoursText(b)}</span><span>·</span><span>${distText(row.mi)}</span></div></div>
      <div class="ms-acts">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking" target="_blank" rel="noopener">${IC.dir}${t('sheet.dir')}</a>
        <button data-act="copy">${IC.copy}${t('sheet.copy')}</button>
        <button data-act="drop">${IC.drop}${t('sheet.drop')}</button>
      </div>
      <div class="ms-info"><div><b>${t('sheet.address')}</b><span class="addr">${esc(b.address)}, ${esc(b.city)}</span></div><div><b>${t('sheet.storage')}</b><span>${b.fridge?t('sheet.fridgeShelf'):t('sheet.shelfOnly')}</span></div><div><b>${t('sheet.access')}</b><span>${esc(b.access)}</span></div><div><b>${t('sheet.note')}</b><span>${esc(b.note)}</span></div></div>
      <h3 class="ms-h">${t('sheet.avail',{n:row.avail.length})}</h3>
      ${row.avail.length ? row.avail.map(p => item(p, false)).join('') : `<div class="m-empty">${t('sheet.empty')}</div>`}
      ${taken.length ? `<h3 class="ms-h">${t('sheet.taken')}</h3>${taken.map(p => item(p, true)).join('')}` : ''}
    </div>`;
}
function renderSheet(){ if (!sheetFor) return; const box = $('#mSheetIn'), st = box.scrollTop; box.innerHTML = sheetHTML(rowFor(sheetFor, lastRows)); box.scrollTop = st; }
function openSheet(id){ sheetFor = id; renderSheet(); $('#mSheet').hidden = false; $('#mSheetIn').scrollTop = 0; document.body.style.overflow = 'hidden'; }
function closeSheet(){ if ($('#mSheet').hidden) return; $('#mSheet').hidden = true; sheetFor = null; document.body.style.overflow = ''; state.selected = null; state.armed = null; renderFind(); }
$('#mSheet').addEventListener('click', async e => {
  if (e.target === e.currentTarget || e.target.closest('[data-close]')){ closeSheet(); return; }
  const act = e.target.closest('[data-act]');
  if (act?.dataset.act === 'copy'){
    const b = bankById[sheetFor]; const text = `${b.address}, ${b.city}, ${b.country}`;
    try { await navigator.clipboard.writeText(text); toast(t('toast.copied')); }
    catch { const r = document.createRange(); r.selectNodeContents(e.currentTarget.querySelector('.addr')); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); }
    return;
  }
  if (act?.dataset.act === 'drop'){ const id = sheetFor; closeSheet(); setMode('give'); $('#gBank').value = id; updatePreview(); return; }
  const c = e.target.closest('[data-claim]');
  if (c){ const id = c.dataset.claim; if (state.armed !== id){ state.armed = id; renderSheet(); return; } state.armed = null; await claim(id); renderSheet(); }
});

/* city picker */
function renderPicker(){
  const q = $('#mPickQ').value.trim().toLowerCase();
  const list = CITIES.map((c, i) => ({c, i})).filter(x => !q || `${x.c.name} ${x.c.country}`.toLowerCase().includes(q));
  $('#mPickList').innerHTML = list.map(({c, i}) => { const n = BANKS.filter(b => b.city === c.name).length; return `<button data-city="${i}" class="${state.me.label===c.name?'on':''}"><span><b>${esc(c.name)}</b><small>${esc(c.country)}</small></span><span class="m-sub">${n} drop point${n===1?'':'s'}</span></button>`; }).join('') || `<div class="m-empty">No cities match.</div>`;
}
$('#mLoc').onclick = () => { $('#mPickQ').value = ''; renderPicker(); $('#mPicker').hidden = false; document.body.style.overflow = 'hidden'; };
const closePicker = () => { $('#mPicker').hidden = true; document.body.style.overflow = ''; };
$('#mPickClose').onclick = closePicker;
$('#mPicker').addEventListener('click', e => {
  if (e.target === e.currentTarget){ closePicker(); return; }
  const b = e.target.closest('[data-city]'); if (!b) return;
  nearSel.value = b.dataset.city; state.me = cityMe(+b.dataset.city); ls.set('kindbox.city', b.dataset.city);
  closePicker(); renderFind(); flyTo([state.me.lng, state.me.lat], CITY_K*2.2, 0); window.scrollTo(0,0);
});
$('#mPickQ').addEventListener('input', renderPicker);

/* ======================================================================
   REWARDS + CERTIFICATES
   ====================================================================== */
const DAYMS = 864e5;
const LEVELS = [[0,'Seedling'],[100,'Sprout'],[250,'Helper'],[500,'Good Neighbor'],[1000,'Community Hero'],[2000,'City Champion']];
let demoHist = ls.get('kindbox.demoHistory', []);
const dayKey = ts => new Intl.DateTimeFormat('en-CA',{timeZone:SF_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ts));
const fmtDate = ts => new Date(ts).toLocaleDateString(LOC(),{timeZone:SF_TZ,month:'long',day:'numeric',year:'numeric'});
function myGiving(){
  const mine = state.drops.filter(d => myIds.has(d.id)).map(d => ({id:d.id, createdAt:d.createdAt || d.packedAt, servings:d.servings, title:d.title, bankId:d.bankId, demo:false}));
  return [...mine, ...demoHist].sort((a,b) => a.createdAt - b.createdAt);
}
function computeRewards(){
  const list = myGiving();
  let pts = 0, streak = 0, last = null, run = [], doubleDays = 0, servings = 0;
  const certs = [], perDay = {};
  for (const d of list){
    pts += 10 + 2*d.servings; servings += d.servings;
    const k = dayKey(d.createdAt); perDay[k] = (perDay[k]||0) + 1;
    if (perDay[k] === 2){ pts += 15; doubleDays++; }
    if (last !== null && d.createdAt - last > 7*DAYMS){ streak = 0; run = []; }
    streak++; run.push(d); last = d.createdAt;
    if (streak % 5 === 0){ const five = run.slice(-5); certs.push({no: certs.length+1, issuedAt: d.createdAt, from: five[0].createdAt, to: d.createdAt, servings: five.reduce((a,x)=>a+x.servings,0)}); }
  }
  const alive = last !== null && Date.now() - last <= 7*DAYMS;
  const cur = alive ? streak : 0;
  let li = 0; LEVELS.forEach(([min], i) => { if (pts >= min) li = i; });
  return { list, pts, certs, servings, boxes: list.length, doubleDays, streak: cur, inRow: cur % 5, nextDue: alive ? last + 7*DAYMS : null, level: LEVELS[li], next: LEVELS[li+1] || null };
}
const BADGES = R => [
  {n:'badge.first', d:'badge.firstD', ok:R.boxes>=1, p:`${Math.min(R.boxes,1)}/1`},
  {n:'badge.regular', d:'badge.regularD', ok:R.boxes>=2, p:`${Math.min(R.boxes,2)}/2`},
  {n:'badge.double', d:'badge.doubleD', ok:R.doubleDays>=1, p:R.doubleDays>=1?'Done':'0/1'},
  {n:'badge.five', d:'badge.fiveD', ok:R.certs.length>=1, p:`${Math.min(R.certs.length,1)}/1`},
  {n:'badge.family', d:'badge.familyD', ok:R.servings>=20, p:`${Math.min(R.servings,20)}/20`},
  {n:'badge.hero', d:'badge.heroD', ok:R.boxes>=10, p:`${Math.min(R.boxes,10)}/10`},
  {n:'badge.champ', d:'badge.champD', ok:R.boxes>=25, p:`${Math.min(R.boxes,25)}/25`}
];
const MEDAL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/></svg>';
$('#rName').value = ls.get('kindbox.certName', '');
$('#rName').addEventListener('input', e => ls.set('kindbox.certName', e.target.value.trim()));
function certName(){ return $('#rName').value.trim() || [...myGiving()].reverse().map(d => state.drops.find(x=>x.id===d.id)?.donor).find(Boolean) || 'A Kind Neighbor'; }
function renderRewards(){
  const R = computeRewards();
  $('#rPts').textContent = R.pts.toLocaleString('en-US'); $('#rLevel').textContent = t('lvl.'+R.level[1]); $('#rMedal').innerHTML = MEDAL;
  const span = R.next ? (R.pts - R.level[0]) / (R.next[0] - R.level[0]) : 1;
  $('#rBar').style.width = Math.max(3, Math.min(100, span*100)) + '%';
  $('#rNext').textContent = R.next ? t('rew.next',{n:R.next[0] - R.pts, level:t('lvl.'+R.next[1])}) : t('rew.top');
  $('#rBoxesN').textContent = R.boxes; $('#rServN').textContent = R.servings; $('#rCertN').textContent = R.certs.length;
  $('#rStreakTxt').textContent = t('rew.ofFive',{n:R.inRow});
  $('#rDots').innerHTML = Array.from({length:5}, (_, i) => `<span class="r-dot${i < R.inRow ? ' on' : ''}${i===4?' last':''}">${i===4 ? MEDAL : i+1}</span>`).join('');
  $('#rStreakHelp').textContent = R.nextDue
    ? t('rew.streakHelp',{n:R.streak, t:fmtDate(R.nextDue), k:5 - R.inRow})
    : t('rew.start');
  $('#rDemo').textContent = demoHist.length ? t('rew.clear') : t('rew.sample');
  $('#rBadges').innerHTML = BADGES(R).map(b => `<div class="r-badge${b.ok?' ok':''}"><span class="r-bi">${MEDAL}</span><b>${t(b.n)}</b><span>${t(b.d)}</span><small>${b.ok?t('rew.earned'):b.p}</small></div>`).join('');
  $('#rCerts').innerHTML = R.certs.length ? R.certs.slice().reverse().map(c => `<div class="r-cert"><div class="r-cert-mini"><i>${t('rew.certTitle')}</i><b>${esc(certName())}</b><small>No. ${certNo(c)}</small></div><div class="r-cert-meta"><b>${t('rew.fiveRow',{n:c.no})}</b><span>${fmtDate(c.from)} – ${fmtDate(c.to)} · ${servTxt(c.servings)}</span></div><button class="btn small primary" data-cert="${c.no}">${t('rew.view')}</button></div>`).join('')
    : `<div class="r-card r-empty"><b>${t('rew.noCerts')}</b><span>${t('rew.noCertsS')}</span></div>`;
  $('#rHist').innerHTML = R.list.length ? R.list.slice().reverse().map(d => { const b = bankById[d.bankId]; return `<div class="r-row"><span><b>${esc(d.title)}</b><small>${b?esc(b.name)+', '+esc(b.city):''}${d.demo?' · sample':''}</small></span><span class="r-fine">${fmtDate(d.createdAt)} · ${servTxt(d.servings)}</span></div>`; }).join('')
    : `<div class="r-fine">${t('rew.histEmpty')}</div>`;
  if ($('#mPts')) $('#mPts').textContent = R.pts;
}
function certNo(c){ let h = 0; const s = certName() + c.issuedAt; for (const ch of s) h = (h*31 + ch.charCodeAt(0)) >>> 0; return `EP-${String(c.no).padStart(3,'0')}-${h.toString(36).toUpperCase().slice(0,5)}`; }
$('#rDemo').onclick = () => {
  if (demoHist.length){ demoHist = []; ls.set('kindbox.demoHistory', []); renderRewards(); toast('Sample history cleared'); return; }
  const sf = BANKS.filter(b => b.city === 'San Francisco');
  const items = [[33,'Vegetable biryani',4],[27,'Lentil soup',3],[21,'Banana bread',8],[15,'Chicken and rice bowls',3],[10,'Apples and oranges',6],[4,'Pasta with marinara',4],[4,'Turkey sandwiches',6]];
  demoHist = items.map(([ago, title, servings], i) => ({id:'demo'+i, createdAt: Date.now() - ago*DAYMS - (i%2)*3600e3, servings, title, bankId: sf[(i*5) % sf.length].id, demo:true}));
  ls.set('kindbox.demoHistory', demoHist); renderRewards(); toast('Sample history loaded. You earned a certificate.');
};
$('#rCerts').addEventListener('click', e => { const b = e.target.closest('[data-cert]'); if (!b) return; const R = computeRewards(); openCert(R.certs.find(c => c.no === +b.dataset.cert)); });

/* certificate canvas */
let certShown = null;
async function drawCert(c){
  try { await document.fonts.ready; } catch {}
  const cv2 = $('#certCanvas'), g = cv2.getContext('2d'), W = cv2.width, Hc = cv2.height;
  const leaf = '#2B7349', squash = '#C95F17', ink = '#17251E', muted = '#5B6B62';
  const serif = '"Fraunces", Georgia, serif', sans = '"Atkinson Hyperlegible", system-ui, sans-serif', disp = '"Bricolage Grotesque", system-ui, sans-serif', mono = '"IBM Plex Mono", ui-monospace, monospace';
  g.fillStyle = '#FFFFFF'; g.fillRect(0,0,W,Hc);
  const grd = g.createRadialGradient(W/2, Hc*0.45, 50, W/2, Hc*0.45, W*0.7); grd.addColorStop(0,'rgba(43,115,73,0.06)'); grd.addColorStop(1,'rgba(43,115,73,0)'); g.fillStyle = grd; g.fillRect(0,0,W,Hc);
  g.strokeStyle = leaf; g.lineWidth = 14; g.strokeRect(40,40,W-80,Hc-80);
  g.strokeStyle = squash; g.lineWidth = 2; g.strokeRect(66,66,W-132,Hc-132);
  for (const [x,y] of [[66,66],[W-66,66],[66,Hc-66],[W-66,Hc-66]]){ g.beginPath(); g.arc(x,y,10,0,Math.PI*2); g.fillStyle = squash; g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = leaf; g.font = `800 34px ${disp}`; g.fillText('E T E R N A L   P O T', W/2, 160);
  g.fillStyle = muted; g.font = `700 20px ${sans}`; g.fillText('POWERED BY MNEMOIQ.COM  ·  DEMO CERTIFICATE', W/2, 196);
  g.fillStyle = ink; g.font = `400 96px ${serif}`; g.fillText('Certificate of Kindness', W/2, 318);
  g.fillStyle = muted; g.font = `400 32px ${sans}`; g.fillText('This certificate is presented to', W/2, 392);
  const name = certName();
  let fs = 112; g.font = `italic 400 ${fs}px ${serif}`; while (g.measureText(name).width > W-360 && fs > 50){ fs -= 6; g.font = `italic 400 ${fs}px ${serif}`; }
  g.fillStyle = squash; g.fillText(name, W/2, 512);
  g.strokeStyle = 'rgba(23,37,30,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W/2-420, 548); g.lineTo(W/2+420, 548); g.stroke();
  const text = `for sharing 5 meal boxes in a row with neighbors who needed them, feeding ${c.servings} people between ${fmtDate(c.from)} and ${fmtDate(c.to)}.`;
  g.fillStyle = ink; g.font = `400 34px ${sans}`;
  const words = text.split(' '); let line = '', y = 618; const lines = [];
  for (const w of words){ const t = line ? line + ' ' + w : w; if (g.measureText(t).width > 1080){ lines.push(line); line = w; } else line = t; }
  lines.push(line); lines.forEach((l, i) => g.fillText(l, W/2, y + i*50));
  // seal
  const sx = W/2, sy = 880;
  g.beginPath(); for (let i = 0; i < 36; i++){ const a = i/36*Math.PI*2, r = i%2 ? 86 : 96; g.lineTo(sx + Math.cos(a)*r, sy + Math.sin(a)*r); } g.closePath(); g.fillStyle = squash; g.fill();
  g.beginPath(); g.arc(sx, sy, 70, 0, Math.PI*2); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#fff'; g.font = `800 46px ${disp}`; g.fillText('5', sx, sy - 2); g.font = `800 17px ${disp}`; g.fillText('IN A ROW', sx, sy + 28);
  // signature + number
  g.textAlign = 'left'; g.strokeStyle = 'rgba(23,37,30,0.4)'; g.beginPath(); g.moveTo(160, 900); g.lineTo(560, 900); g.stroke();
  g.fillStyle = leaf; g.font = `italic 400 44px ${serif}`; g.fillText('Eternal Pot Community', 170, 885);
  g.fillStyle = muted; g.font = `700 20px ${sans}`; g.fillText('ETERNAL POT COMMUNITY TEAM (DEMO ISSUER)', 160, 934);
  g.textAlign = 'right'; g.fillStyle = ink; g.font = `500 26px ${mono}`; g.fillText(`No. ${certNo(c)}`, W-160, 880);
  g.fillStyle = muted; g.font = `700 20px ${sans}`; g.fillText(`ISSUED ${fmtDate(c.issuedAt).toUpperCase()}`, W-160, 916);
  g.textAlign = 'center'; g.fillStyle = muted; g.font = `400 19px ${sans}`;
  g.fillText('Eternal Pot, powered by mnemoIQ.com. Demo certificate for illustration only. Eternal Pot is inspired by the Akshaya Patra Foundation and is not affiliated with or endorsed by it.', W/2, Hc - 100);
}
async function openCert(c){ if (!c) return; certShown = c; $('#certTitle').textContent = `Certificate no. ${certNo(c)}`; $('#certModal').hidden = false; document.body.style.overflow = 'hidden'; await drawCert(c); }
const closeCert = () => { $('#certModal').hidden = true; document.body.style.overflow = ''; };
$('#certClose').onclick = closeCert;
$('#certModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeCert(); });
$('#certDl').onclick = async () => {
  const blob = await new Promise(r => $('#certCanvas').toBlob(r, 'image/png'));
  const filename = `eternal-pot-certificate-${certShown?.no || 1}.png`;
  try {
    const dl = window.claude?.use ? await window.claude.use('downloads') : null;
    if (dl){ await dl.save({filename, data: blob}); toast('Certificate saved'); return; }
  } catch (err){ if (err?.code === 'declined') return; if (err?.code && err.code !== 'unavailable' && err.code !== 'not_granted') { toast('Could not save the file here.'); return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('#certModal').hidden) closeCert(); else if (!$('#mPicker').hidden) closePicker(); else if (!$('#mSheet').hidden) closeSheet(); });

/* ---------- mode ---------- */
function setMode(m){
  if (m === 'home' && isDesk()) m = 'find';
  state.mode = m;
  const navMode = m === 'home' ? 'find' : m;
  document.querySelectorAll('.switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode===navMode));
  document.querySelectorAll('.m-tabs button').forEach(b => { if (b.dataset.mode === m) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  $('#mHome').hidden = m!=='home'; $('#findView').hidden = m!=='find'; $('#giveView').hidden = m!=='give'; $('#progView').hidden = m!=='programs'; $('#rewView').hidden = m!=='rewards';
  document.body.classList.toggle('on-find', m==='find');
  document.body.dataset.mode = m;
  hideLanding();
  if (!$('#mSheet').hidden){ $('#mSheet').hidden = true; sheetFor = null; document.body.style.overflow = ''; }
  if (m==='find') requestAnimationFrame(() => { resizeMap(); renderMobile(); });
  else { window.scrollTo(0,0); }
  if (m==='home') renderMobile();
  if (m==='give'){ fillBankSelect(); updatePreview(); }
  if (m==='programs') renderPrograms();
  if (m==='rewards') renderRewards();
  try { history.replaceState(null,'', '#' + m); } catch {}
}
document.addEventListener('click', e => {
  const m = e.target.closest('[data-mode]'); if (m){ setMode(m.dataset.mode); return; }
  const g = e.target.closest('[data-go]'); if (!g) return;
  if (g.dataset.go === 'home') showLanding(); else setMode(g.dataset.go);
});

/* ---------- landing (web only): rotating dotted globe ---------- */
const lcv = $('#lMap'), lctx = lcv.getContext('2d');
let lDots = null, lRot = 0, lRaf = 0, lW = 0, lH = 0;
function buildDots(){
  if (!hasD3) return [];
  const W = 720, Hh = 360, off = document.createElement('canvas'); off.width = W; off.height = Hh;
  const o = off.getContext('2d');
  const pr = d3.geoEquirectangular().scale(W/(2*Math.PI)).translate([W/2, Hh/2]);
  o.beginPath(); d3.geoPath(pr, o)({type:'FeatureCollection', features:C110}); o.fillStyle = '#000'; o.fill();
  const img = o.getImageData(0,0,W,Hh).data; const dots = [];
  for (let lat = -58; lat <= 80; lat += 2.1){
    const step = 2.1 / Math.max(0.25, Math.cos(lat*Math.PI/180));
    for (let lng = -180; lng < 180; lng += step){
      const [x, y] = pr([lng, lat]);
      if (img[(Math.floor(y)*W + Math.floor(x))*4 + 3] > 100) dots.push([lng, lat]);
    }
  }
  return dots;
}
function landingFrame(t){
  lRaf = 0;
  if ($('#landing').hidden) return;
  const r = lcv.getBoundingClientRect();
  if (r.width !== lW || r.height !== lH){ lW = r.width; lH = r.height; lcv.width = lW*DPRL(); lcv.height = lH*DPRL(); }
  const d = DPRL(); lctx.setTransform(d,0,0,d,0,0); lctx.clearRect(0,0,lW,lH);
  if (!hasD3){ return; }
  const R = Math.min(lW, lH)*0.46, cx = lW/2, cy = lH/2;
  const pr = d3.geoOrthographic().scale(R).translate([cx, cy]).rotate([lRot, -18]).clipAngle(90);
  const center = [-lRot, 18];
  const g = lctx.createRadialGradient(cx - R*.3, cy - R*.35, R*.1, cx, cy, R*1.08);
  g.addColorStop(0, TK.surface); g.addColorStop(1, TK.glow);
  lctx.beginPath(); lctx.arc(cx, cy, R, 0, Math.PI*2); lctx.fillStyle = g; lctx.fill();
  // orbits
  lctx.save(); lctx.translate(cx, cy);
  for (const [rx, ry, rot] of [[R*1.38, R*.42, -.24],[R*1.22, R*.9, .34]]){
    lctx.beginPath(); lctx.ellipse(0, 0, rx, ry, rot, 0, Math.PI*2); lctx.setLineDash([2,6]); lctx.strokeStyle = TK.squash; lctx.globalAlpha = .35; lctx.lineWidth = 1; lctx.stroke();
  }
  lctx.setLineDash([]); lctx.globalAlpha = 1;
  const a = (t||0)/9000; lctx.beginPath(); lctx.arc(Math.cos(a)*R*1.38*Math.cos(-.24) - Math.sin(a)*R*.42*Math.sin(-.24), Math.cos(a)*R*1.38*Math.sin(-.24) + Math.sin(a)*R*.42*Math.cos(-.24), 4, 0, Math.PI*2); lctx.fillStyle = TK.squash; lctx.fill();
  lctx.restore();
  lctx.fillStyle = TK.leaf;
  for (const ll of lDots){
    const dist = d3.geoDistance(ll, center); if (dist > Math.PI/2) continue;
    const p = pr(ll); if (!p) continue;
    const z = Math.cos(dist);
    lctx.globalAlpha = 0.25 + 0.6*z;
    lctx.beginPath(); lctx.arc(p[0], p[1], 0.7 + 1.1*z, 0, Math.PI*2); lctx.fill();
  }
  lctx.globalAlpha = 1;
  const pulse = ((t||0) % 2400)/2400;
  for (const c of CITIES){
    const ll = [c.lng, c.lat]; const dist = d3.geoDistance(ll, center); if (dist > Math.PI/2 - .05) continue;
    const p = pr(ll); const z = Math.cos(dist);
    lctx.beginPath(); lctx.arc(p[0], p[1], 4 + pulse*12, 0, Math.PI*2); lctx.strokeStyle = TK.squash; lctx.globalAlpha = (1-pulse)*.6*z; lctx.lineWidth = 1.5; lctx.stroke();
    lctx.globalAlpha = .5 + .5*z; lctx.beginPath(); lctx.arc(p[0], p[1], 3.6, 0, Math.PI*2); lctx.fillStyle = TK.squash; lctx.fill();
  }
  lctx.globalAlpha = 1;
  if (!RM.matches){ lRot += 0.08; lRaf = requestAnimationFrame(landingFrame); }
}
const DPRL = () => Math.min(2, devicePixelRatio || 1);
function showLanding(){
  if (!isDesk()) return;
  $('#landing').hidden = false;
  if (!lDots) lDots = buildDots();
  const lp = allPackets().filter(live);
  $('#lsBoxes').textContent = fmtN(lp.length);
  $('#lsServ').textContent = fmtN(lp.reduce((a,p)=>a+p.servings,0));
  $('#lsPoints').textContent = BANKS.length;
  $('#lsCountries').textContent = `In ${CITIES.length} cities across ${new Set(BANKS.map(b=>b.country)).size} countries.`;
  lRot = -state.me.lng;
  if (!lRaf) lRaf = requestAnimationFrame(landingFrame);
  try { history.replaceState(null,'',location.pathname+location.search); } catch {}
}
function hideLanding(){ $('#landing').hidden = true; cancelAnimationFrame(lRaf); lRaf = 0; }

let toastT; function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true, 2600); }


/* ---------- language picker ---------- */
function relabel(){
  buildDeskChips(); buildMobileChrome(); buildProgChips(); syncFilterUI();
  renderFind(); renderMobile();
  if (state.mode === 'programs') renderPrograms();
  if (state.mode === 'rewards') renderRewards();
  if (state.mode === 'give') updatePreview();
  renderMine();
}
function renderLangGrid(){
  $('#langGrid').innerHTML = LANGS.map(([c, n, e]) => `<button class="lang-opt${c===LANG?' on':''}" data-lang="${c}" lang="${c}" dir="${RTL.has(c)?'rtl':'ltr'}"><b>${n}</b><small>${e}</small></button>`).join('');
}
function openLang(){ renderLangGrid(); $('#langModal').hidden = false; document.body.style.overflow = 'hidden'; }
function closeLang(){ $('#langModal').hidden = true; document.body.style.overflow = ''; ls.set('eternalpot.langAsked', true); }
document.addEventListener('click', e => { if (e.target.closest('[data-lang-open]')) openLang(); });
$('#langClose').onclick = closeLang;
$('#langModal').addEventListener('click', async e => {
  if (e.target === e.currentTarget){ closeLang(); return; }
  const b = e.target.closest('[data-lang]'); if (!b) return;
  await setLang(b.dataset.lang); closeLang();
});

/* ---------- boot ---------- */
const savedLang = ls.get('eternalpot.lang', null);
const navLang = (navigator.languages || [navigator.language || 'en']).map(x => x.split('-')[0]).find(x => LANGS.some(l => l[0] === x));
await setLang(savedLang || 'en', false);
readTokens();
const themeChanged = () => { readTokens(); draw(); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChanged);
new MutationObserver(themeChanged).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
mqDesk.addEventListener('change', () => { if (state.mode === 'home' && isDesk()) setMode('find'); else if (state.mode === 'find' && !isDesk()) setMode('home'); resizeMap(); renderFind(); });
new ResizeObserver(() => resizeMap()).observe(cv);
setInterval(() => { if (state.mode==='find' && !state.armed) renderFind(); }, 60000);
setStoreStatus(); updatePreview(); renderMine();
document.body.classList.add('on-find');
renderFind(); resizeMap();
syncFilterUI();
const startHash = location.hash.slice(1);
if (['give','programs','rewards','find','home'].includes(startHash)) setMode(startHash);
else if (isDesk()){ setMode('find'); showLanding(); }
else setMode('home');
if (!savedLang && !ls.get('eternalpot.langAsked', false)) setTimeout(openLang, 400);
connect();
})();
