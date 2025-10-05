// ==========================================
//  Periodic Table - Interaktif + Filter Legenda
// ==========================================

const DATA_URL = './elements.json'; // kalau masih online, ubah ke URL GitHub JSON
const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');
const detailModal = document.getElementById('detailModal');
const elTitle = document.getElementById('elTitle');
const elBody = document.getElementById('elBody');
const closeModalBtn = document.getElementById('closeModal');
const legend = document.getElementById('legend');

let ELEMENTS = [];
let CATEGORY_COLORS = {};
let ACTIVE_CATEGORY = null;

const CATEGORY_COLOR_PRESET = [
  ['diatomic nonmetal', '#22c55e'],
  ['noble gas', '#06b6d4'],
  ['alkali metal', '#f97316'],
  ['alkaline earth metal', '#f59e0b'],
  ['metalloid', '#a855f7'],
  ['polyatomic nonmetal', '#10b981'],
  ['post-transition metal', '#0ea5e9'],
  ['transition metal', '#ef4444'],
  ['lanthanide', '#8b5cf6'],
  ['actinide', '#ec4899'],
  ['unknown', '#94a3b8']
];

function normCategory(cat){
  if(!cat) return 'unknown';
  return cat.toLowerCase().replace(/-/g,' ').trim();
}
function colorFor(cat){
  const key = normCategory(cat);
  if(CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  const found = CATEGORY_COLOR_PRESET.find(([k]) => key.includes(k));
  return (found ? found[1] : '#94a3b8');
}

// Render legenda + event klik filter
function renderLegend(){
  const cats = [...new Set(ELEMENTS.map(e => normCategory(e.category)))].sort();
  legend.innerHTML = '';
  cats.forEach(c => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.category = c;

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = colorFor(c);

    const label = document.createElement('span');
    label.textContent = c[0].toUpperCase() + c.slice(1);

    chip.append(dot, label);
    chip.addEventListener('click', () => toggleCategoryFilter(c));
    legend.appendChild(chip);
  });
  updateLegendActive();
}

// Highlight kategori aktif
function updateLegendActive(){
  document.querySelectorAll('#legend .chip').forEach(chip=>{
    chip.style.opacity = (!ACTIVE_CATEGORY || chip.dataset.category===ACTIVE_CATEGORY) ? '1' : '.4';
    chip.style.borderColor = (chip.dataset.category===ACTIVE_CATEGORY)?'var(--accent)':'var(--border)';
  });
}

// Saat kategori diklik
function toggleCategoryFilter(cat){
  ACTIVE_CATEGORY = (ACTIVE_CATEGORY === cat) ? null : cat;
  updateLegendActive();
  applySearch(); // pakai logika pencarian yang sama
}

function renderGrid(items){
  grid.setAttribute('aria-busy','true');
  grid.innerHTML = '';
  items.forEach(el => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.style.gridColumn = String(el.xpos);
    cell.style.gridRow = String(el.ypos);

    const color = colorFor(el.category);
    cell.style.color = color;
    cell.dataset.color = '1';

    cell.title = `${el.symbol} — ${el.name}`;
    cell.innerHTML = `
      <div class="number">${el.number}</div>
      <div class="symbol">${el.symbol}</div>
      <div class="name">${el.name}</div>
      <div class="badge">${(el.phase||'').toUpperCase()||'—'}</div>
    `;
    cell.addEventListener('click', () => openDetail(el));
    grid.appendChild(cell);
  });
  grid.removeAttribute('aria-busy');
}

function openDetail(el){
  elTitle.textContent = `${el.symbol} — ${el.name}`;
  const rows = [
    ['Nomor Atom', el.number],
    ['Massa Atom', formatMass(el.atomic_mass)],
    ['Golongan', el.group || el.group_block || '—'],
    ['Periode', el.period || '—'],
    ['Kategori', (el.category||'—')],
    ['Kondisi Fisik', el.phase || '—'],
    ['Densitas', formatMaybe(el.density, 'g/cm³')],
    ['Titik Lebur', formatTemp(el.melt)],
    ['Titik Didih', formatTemp(el.boil)],
    ['Konfigurasi e⁻', el.electron_configuration || '—'],
    ['Elektronegativitas (Pauling)', formatMaybe(el.electronegativity_pauling)],
    ['Nomor CAS', el.cpk_hex || '—']
  ];
  elBody.innerHTML = `
    <p class="summary">${el.summary || '—'}</p>
    <dl class="dl">
      ${rows.map(([k,v]) => `<dt>${k}</dt><dd>${v ?? '—'}</dd>`).join('')}
    </dl>
  `;
  if(typeof detailModal.showModal==='function') detailModal.showModal();
  else detailModal.setAttribute('open','');
}

function formatMass(m){ return m?Number(m).toFixed(4):'—'; }
function formatTemp(k){ return k?`${(k-273.15).toFixed(2)} °C (${k.toFixed(2)} K)`:'—'; }
function formatMaybe(v,s=''){ return v?(s?`${v} ${s}`:v):'—'; }

function applySearch(){
  const q = (searchInput.value||'').trim().toLowerCase();
  let filtered = ELEMENTS;
  if(ACTIVE_CATEGORY){
    filtered = filtered.filter(e => normCategory(e.category) === ACTIVE_CATEGORY);
  }
  if(q){
    filtered = filtered.filter(el =>
      String(el.number).includes(q) ||
      (el.symbol||'').toLowerCase().includes(q) ||
      (el.name||'').toLowerCase().includes(q) ||
      normCategory(el.category).includes(q)
    );
  }
  renderGrid(filtered);
}

function loadTheme(){
  const saved = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('light', saved==='light');
  themeToggle.checked = saved==='light';
}
function toggleTheme(){
  const next = themeToggle.checked ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  document.body.classList.toggle('light', next==='light');
}

async function init(){
  loadTheme();
  try{
    const res = await fetch(DATA_URL,{cache:'force-cache'});
    const json = await res.json();
    ELEMENTS = (json.elements||[]).map(e=>({
      number:e.number,
      name:e.name,
      symbol:e.symbol,
      atomic_mass:e.atomic_mass,
      category:e.category,
      group:e.group_block,
      period:e.period,
      phase:e.phase,
      electron_configuration:e.electron_configuration,
      density:e.density,
      melt:e.melt,
      boil:e.boil,
      xpos:e.xpos,
      ypos:e.ypos,
      summary:e.summary,
      cpk_hex:e.cpk_hex
    }));
    const uniqueCats = [...new Set(ELEMENTS.map(e=>normCategory(e.category)))];
    uniqueCats.forEach(c=>CATEGORY_COLORS[c]=colorFor(c));
    renderLegend();
    renderGrid(ELEMENTS);
  }catch(err){
    grid.innerHTML = `<div style="grid-column:1/-1;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--panel);">
      <strong>Gagal memuat data unsur.</strong><br>${err.message}</div>`;
  }
}

searchInput.addEventListener('input',applySearch);
clearBtn.addEventListener('click',()=>{searchInput.value='';applySearch();});
themeToggle.addEventListener('change',toggleTheme);
closeModalBtn.addEventListener('click',e=>{e.preventDefault();detailModal.close();});
detailModal.addEventListener('click',e=>{if(e.target===detailModal)detailModal.close();});

init();
