/* OSS License Sorter — Deck Mode with 37 licenses (no immediate repeats across rounds)
   Categories are simplified for gameplay; see references in the page. */

// --- Configuration ---
const POOL_VERSION = '2026-02-09-v1';
const STORAGE = {
  deck: 'oss-license-sorter-deck',
  deckIdx: 'oss-license-sorter-deck-idx',
  lastRound: 'oss-license-sorter-last-round',
  poolVersion: 'oss-license-sorter-pool-version'
};

// Master pool (~37 licenses)
const ALL_LICENSES = [
  // Permissive
  { name: 'MIT', category: 'Permissive' },
  { name: 'MIT-0', category: 'Permissive' },
  { name: 'Apache-2.0', category: 'Permissive' },
  { name: 'BSD-2-Clause', category: 'Permissive' },
  { name: 'BSD-3-Clause', category: 'Permissive' },
  { name: 'BSD-4-Clause', category: 'Permissive' },
  { name: 'BSD-3-Clause-Clear', category: 'Permissive' },
  { name: 'BSD-2-Clause-Patent', category: 'Permissive' },
  { name: 'ISC', category: 'Permissive' },
  { name: 'Zlib', category: 'Permissive' },
  { name: '0BSD', category: 'Permissive' },
  { name: 'BSL-1.0', category: 'Permissive' },
  { name: 'NCSA', category: 'Permissive' },
  { name: 'PostgreSQL', category: 'Permissive' },
  { name: 'UPL-1.0', category: 'Permissive' },
  { name: 'Artistic-2.0', category: 'Permissive' },
  { name: 'BlueOak-1.0.0', category: 'Permissive' },
  { name: 'Unlicense', category: 'Permissive' },
  { name: 'Python-2.0', category: 'Permissive' },
  { name: 'MulanPSL-2.0', category: 'Permissive' },
  { name: 'MS-PL', category: 'Permissive' },

  // Weak Copyleft
  { name: 'MPL-2.0', category: 'Weak Copyleft' },
  { name: 'EPL-2.0', category: 'Weak Copyleft' },
  { name: 'EPL-1.0', category: 'Weak Copyleft' },
  { name: 'CDDL-1.0', category: 'Weak Copyleft' },
  { name: 'CDDL-1.1', category: 'Weak Copyleft' },
  { name: 'LGPL-2.1', category: 'Weak Copyleft' },
  { name: 'LGPL-3.0', category: 'Weak Copyleft' },
  { name: 'MS-RL', category: 'Weak Copyleft' },
  { name: 'CPL-1.0', category: 'Weak Copyleft' },

  // Strong Copyleft
  { name: 'GPL-2.0', category: 'Strong Copyleft' },
  { name: 'GPL-3.0', category: 'Strong Copyleft' },
  { name: 'AGPL-3.0', category: 'Strong Copyleft' },
  { name: 'OSL-3.0', category: 'Strong Copyleft' },
  { name: 'EUPL-1.2', category: 'Strong Copyleft' },
  { name: 'CeCILL-2.1', category: 'Strong Copyleft' },
  { name: 'GPL-1.0', category: 'Strong Copyleft' }
];

// --- DOM references ---
const els = {
  roundSize: document.getElementById('roundSize'),
  btnStart: document.getElementById('btnStart'),
  btnReset: document.getElementById('btnReset'),
  btnCheck: document.getElementById('btnCheck'),
  time: document.getElementById('time'),
  pool: document.getElementById('licensePool'),
  bins: {
    'Permissive': document.getElementById('bin-permissive'),
    'Weak Copyleft': document.getElementById('bin-weak'),
    'Strong Copyleft': document.getElementById('bin-strong')
  },
  result: document.getElementById('resultText'),
  leaderboardList: document.getElementById('leaderboardList'),
  btnClearLB: document.getElementById('btnClearLB')
};

let roundLicenses = [];
let started = false; let startTs = 0; let timerId = null; let finished = false;

// --- Helpers ---
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
function msToDisplay(ms){ const m=String(Math.floor(ms/60000)).padStart(2,'0'); const s=String(Math.floor((ms%60000)/1000)).padStart(2,'0'); const ms3=String(ms%1000).padStart(3,'0'); return `${m}:${s}.${ms3}`; }
function startTimer(){ if (started) return; started=true; startTs=performance.now(); timerId=requestAnimationFrame(tick); }
function tick(){ if (!started) return; els.time.textContent=msToDisplay(performance.now()-startTs); timerId=requestAnimationFrame(tick); }
function stopTimer(){ started=false; if (timerId) cancelAnimationFrame(timerId); }

function clearBoard(){ els.pool.innerHTML=''; for(const k of Object.keys(els.bins)) els.bins[k].innerHTML=''; els.result.textContent=''; finished=false; stopTimer(); els.time.textContent='00:00.000'; }

// --- Deck management (no immediate repeats) ---
function initDeck(){
  const pv = localStorage.getItem(STORAGE.poolVersion);
  if (pv !== POOL_VERSION){ localStorage.removeItem(STORAGE.deck); localStorage.removeItem(STORAGE.deckIdx); localStorage.removeItem(STORAGE.lastRound); localStorage.setItem(STORAGE.poolVersion, POOL_VERSION); }
  let deck = JSON.parse(localStorage.getItem(STORAGE.deck) || 'null');
  if (!Array.isArray(deck) || deck.length !== ALL_LICENSES.length){ deck = shuffle(ALL_LICENSES.map(x=>x.name)); localStorage.setItem(STORAGE.deck, JSON.stringify(deck)); localStorage.setItem(STORAGE.deckIdx, '0'); }
}
function getDeck(){ return JSON.parse(localStorage.getItem(STORAGE.deck)); }
function setDeck(deck){ localStorage.setItem(STORAGE.deck, JSON.stringify(deck)); }
function getIdx(){ return parseInt(localStorage.getItem(STORAGE.deckIdx) || '0',10); }
function setIdx(i){ localStorage.setItem(STORAGE.deckIdx, String(i)); }
function getLastRound(){ return new Set(JSON.parse(localStorage.getItem(STORAGE.lastRound) || '[]')); }
function setLastRound(arr){ localStorage.setItem(STORAGE.lastRound, JSON.stringify(arr)); }

function drawNext(n){
  const names = ALL_LICENSES.map(x=>x.name);
  const nameToObj = Object.fromEntries(ALL_LICENSES.map(l=>[l.name,l]));
  let deck = getDeck();
  let idx = getIdx();
  const last = getLastRound();

  if (n === 'all' || n >= deck.length){ // full deck requested
    deck = shuffle(deck);
    setDeck(deck);
    setIdx(0);
    setLastRound(deck.slice());
    return deck.map(name=>nameToObj[name]);
  }
  let selection = [];
  const seen = new Set();
  while (selection.length < n){
    if (idx >= deck.length){ deck = shuffle(deck); setDeck(deck); idx = 0; }
    const candidate = deck[idx++];
    if (last.has(candidate) || seen.has(candidate)) continue; // avoid repeats
    selection.push(candidate); seen.add(candidate);
  }
  setIdx(idx % deck.length);
  setLastRound(selection);
  return selection.map(name=>nameToObj[name]);
}

// --- Render & DnD ---
function renderTokens(){
  els.pool.innerHTML = '';
  const frag = document.createDocumentFragment();
  roundLicenses.forEach(item => {
    const el = document.createElement('div');
    el.className = 'token'; el.draggable = true; el.textContent = item.name; el.dataset.license = item.name; el.title = item.name;
    el.addEventListener('dblclick', () => els.pool.appendChild(el));
    el.addEventListener('dragstart', onDragStart);
    frag.appendChild(el);
  });
  els.pool.appendChild(frag);
}
function onDragStart(e){ if (!started && !finished) startTimer(); e.dataTransfer.setData('text/plain', e.target.dataset.license); }
function setupDnd(){ const zones=[els.pool,...Object.values(els.bins)]; zones.forEach(z=>{ z.addEventListener('dragover',e=>{e.preventDefault(); z.classList.add('over');}); z.addEventListener('dragleave',()=>z.classList.remove('over')); z.addEventListener('drop',e=>{e.preventDefault(); z.classList.remove('over'); const lic=e.dataTransfer.getData('text/plain'); const token=[...document.querySelectorAll('.token')].find(t=>t.dataset.license===lic); if(token) z.appendChild(token); els.btnCheck.disabled=false;});}); }

// --- Checking & scoring ---
function checkAnswers(){ if (finished) return; const correct=Object.fromEntries(ALL_LICENSES.map(l=>[l.name,l.category])); let wrong=0; document.querySelectorAll('.token').forEach(t=>t.classList.remove('good','bad'));
  for (const [cat,dz] of Object.entries(els.bins)){
    [...dz.querySelectorAll('.token')].forEach(tok=>{ const lic=tok.dataset.license; const isRight = correct[lic]===cat; tok.classList.add(isRight?'good':'bad'); if(!isRight) wrong++; });
  }
  const totalPlaced = Object.values(els.bins).reduce((a,dz)=>a+dz.querySelectorAll('.token').length,0);
  if (totalPlaced !== roundLicenses.length){ els.result.textContent='Place all licenses before checking.'; return; }
  const raw=performance.now()-startTs; const penaltyMs=wrong*5000; const finalMs=raw+penaltyMs;
  if (wrong===0){ stopTimer(); finished=true; els.result.textContent=`✅ Perfect! Time: ${msToDisplay(raw)}. (Final = ${msToDisplay(finalMs)}; no penalties)`; saveScore(finalMs, roundLicenses.length); }
  else { els.result.textContent=`❌ ${wrong} incorrect. Raw: ${msToDisplay(raw)}  |  Penalty: +${(penaltyMs/1000)}s  |  Final: ${msToDisplay(finalMs)}. Fix reds and re-check.`; }
}

// --- Leaderboard ---
const LB_KEY='oss-license-sorter-lb';
function loadLB(){ try{return JSON.parse(localStorage.getItem(LB_KEY)||'[]')}catch{ return []; } }
function saveScore(ms,count){ const lb=loadLB(); lb.push({ms,count,when:new Date().toISOString()}); lb.sort((a,b)=>a.ms-b.ms); localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0,10))); renderLB(); }
function renderLB(){ const lb=loadLB(); els.leaderboardList.innerHTML=''; lb.forEach((s,i)=>{ const li=document.createElement('li'); const dt=new Date(s.when); li.textContent=`#${i+1} — ${msToDisplay(s.ms)} (${s.count} items on ${dt.toLocaleDateString()} ${dt.toLocaleTimeString()})`; els.leaderboardList.appendChild(li); }); }

// --- Round control ---
function startRound(advance=true){
  initDeck(); clearBoard();
  const val = els.roundSize.value; const n = (val==='all') ? 'all' : parseInt(val,10);
  roundLicenses = drawNext(n);
  renderTokens(); els.btnCheck.disabled=false;
}
function resetAll(){ // move to NEXT set immediately
  startRound(true);
}

function init(){ setupDnd(); renderLB(); initDeck();
  els.btnStart.addEventListener('click', ()=>startRound(true));
  els.btnReset.addEventListener('click', resetAll);
  els.btnCheck.addEventListener('click', checkAnswers);
  els.btnClearLB.addEventListener('click', ()=>{ localStorage.removeItem(LB_KEY); renderLB(); });
  // initial state
  els.pool.innerHTML = '<em>Click Start to begin a new round. Deck mode ensures no immediate repeats.</em>';
}

document.addEventListener('DOMContentLoaded', init);
