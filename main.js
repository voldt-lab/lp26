// main.js
import { createViewer } from './viewer.js';

const root   = document.getElementById('viewport');
const status = document.getElementById('status');
const panel  = document.getElementById('ctrlpanel');

// Product select
const prodSelect = document.getElementById('prodtype');

// Venturi controls
const vTypeSelect = document.getElementById('vtype');
const fieldVType  = document.getElementById('field-vtype');
const fieldRad    = document.getElementById('field-rad');
const fieldRot    = document.getElementById('field-rot');
const fieldLen    = document.getElementById('field-len');

// Lake Shore controls
const lsTypeSelect = document.getElementById('lstype');
const fieldLsType  = document.getElementById('field-lstype');
const fieldFF      = document.getElementById('field-ff');

// Heat Wave controls
const mechTxtrSelect = document.getElementById('mechtype');
const fieldHwTxtr  = document.getElementById('field-mechtype');
const fieldDens    = document.getElementById('field-dens');

// Sliders + their value chips (simplified now that IDs are unique)
const lenSlider = document.getElementById('len');
const lenValue  = document.getElementById('lenVal');

const twistSlider = document.getElementById('rot');
const twistValue  = document.getElementById('rotVal');

const radSlider = document.getElementById('rad');
const radValue  = document.getElementById('radVal');

const ffSlider  = document.getElementById('ff');
const ffValue   = document.getElementById('ffVal');

//const densSlider = document.getElementById('dens'); //----uncomment to revert to old slider
const densToggle = document.getElementById('densToggle');
const densValue  = document.getElementById('densVal');


// Viewer (keep your old look)
const viewer = createViewer(root, {
  env: 'hdr',
  hdrUrl: './royal_espl_1k.hdr',
  background: 'gradient',
  envIntensity: 3.0,
});

// ----- model path strategy -----
// IMPORTANT: This is the *only* place you should need to edit to match your actual filenames.
const MODEL_BASE = '.';   // root folder
const MODEL_EXT  = '.glb';     // change to '.gltf' if needed

function resolveModelUrl(state) {
  // We intentionally use *indices* (slider values) in filenames.
  // That makes it easy to pre-bake without worrying about decimal formatting.
  const { product } = state;

  if (product === 'venturi') {
    const vtype = state.venturiType; // 'bar' | 'knob'
    if (vtype === 'knob') {
      // knob uses radius + twist
      return `${MODEL_BASE}/venturi/knob/rad${state.rad}_tw${state.tw}${MODEL_EXT}`;
    }
    // bar uses length + twist
    return `${MODEL_BASE}/venturi/bar/len${state.len}_tw${state.tw}${MODEL_EXT}`;
  }

  if (product === 'lakeshore') {
    const lstype = state.lakeType; // 'simple' | 'freeform'
    if (lstype === 'freeform') {
      // freeform uses form factor only
      return `${MODEL_BASE}/lake_shore/free_form/ff${state.ff}${MODEL_EXT}`;
    }
    // simple uses length + twist
    return `${MODEL_BASE}/lake_shore/simple/len${state.len}_tw${state.tw}${MODEL_EXT}`;
  }

  if (product === 'mechanic') {
    const tx = state.mechTexture; // 'gyroid' | 'voronoi'
    // both use length + density
    return `${MODEL_BASE}/mechanic/${tx}/len${state.len}_dens${state.dens}${MODEL_EXT}`;
  }

  return null;
}

// ----- UI value display mappings -----
// These are just for the *label chips* (not filenames).
// Adjust to match your real-world intended values if you want.
const LENGTH_LABELS = ['3-3/4"', '5"', '6-5/16"', '7-9/16"', '10-1/16"', '12-5/8"'];
const TWIST_LABELS  = ['None', 'Minor', 'Max'];
const FF_LABELS     = ['1', '2', '3', '4', '5'];
const DENS_LABELS   = ['Low', 'Mid', 'Hi'];
const RAD_LABELS    = ['3/4"', '1"', '1-1/8"'];

// ----- state + helpers -----
let busy = false;

function show(el, on) {
  //el is the control element
  el.style.display = on ? '' : 'none';
}

function setBusy(on, text = '') {
  busy = !!on;
  viewer.setLoading(busy);
  panel.classList.toggle('busy', busy);
  panel.disabled = busy; // harmless even if fieldset; your CSS uses .busy anyway
  status.textContent = text || '';
}

// --- Density segmented control (replaces dens slider) ---
let densIndex = 1; // default "Mid"
function initDensityToggle() {
  if (!densToggle) return;
  /*begin defining click-slide*/
  function indexFromClientX(clientX) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < btns.length; i++) {
      const r = btns[i].getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const d = Math.abs(clientX - cx);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  let dragging = false;

  densToggle.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    densToggle.setPointerCapture(e.pointerId);

    densIndex = indexFromClientX(e.clientX);
    render(); // UI only
    e.preventDefault();
  });

  densToggle.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    const idx = indexFromClientX(e.clientX);
    if (idx !== densIndex) {
      densIndex = idx;
      render(); // UI only
    }
    e.preventDefault();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { densToggle.releasePointerCapture(e.pointerId); } catch {}

    // Reload once, on release:
    loadForCurrentState();
    e.preventDefault();
  }

  densToggle.addEventListener('pointerup', endDrag);
  densToggle.addEventListener('pointercancel', endDrag);

  /*end defining click-slide*/

  const btns  = Array.from(densToggle.querySelectorAll('.segmented__btn'));
  const thumb = densToggle.querySelector('.segmented__thumb');

  densIndex = parseInt(densToggle.getAttribute('data-active-index') || '1', 10);

  function render({ reload = false } = {}) {
    densIndex = clampIndex(densIndex, DENS_LABELS.length);
    densValue.textContent = DENS_LABELS[densIndex];

    btns.forEach((b, i) => b.setAttribute('aria-pressed', i === densIndex ? 'true' : 'false'));

    // position thumb to active button, clamped to interior
    const cs = getComputedStyle(densToggle);
    const pad = parseFloat(cs.getPropertyValue('--pad')) || 0;
    const rootRect = densToggle.getBoundingClientRect();
    const btnRect  = btns[densIndex].getBoundingClientRect();

    let left = (btnRect.left - rootRect.left) - pad;
    const width = btnRect.width;
    const maxLeft = (rootRect.width - (pad * 2)) - width;
    left = Math.max(0, Math.min(left, maxLeft));

    thumb.style.width = `${width}px`;
    thumb.style.transform = `translateX(${left}px)`;

    if (reload) loadForCurrentState();
  }

  btns.forEach((b) => {
    b.addEventListener('click', () => {
      densIndex = parseInt(b.dataset.index, 10);
      render({reload: true});
    });
  });

  // keep thumb correct on resize/font load
  new ResizeObserver(() => render()).observe(densToggle);

  render();
}

function getState() {
  const product = prodSelect.value; // "0" | "1" | "2"

  const state = {
    // normalized product key
    product:
      product === '0' ? 'venturi' :
      product === '1' ? 'mechanic' :
      'lakeshore',

    // slider indices
    len:  parseInt(lenSlider.value, 10),
    tw:   parseInt(twistSlider.value, 10),
    rad:  parseInt(radSlider.value, 10),     
    ff:   parseInt(ffSlider.value, 10),
    //dens: parseInt(densSlider.value, 10), //----uncomment to revert to old slider
    dens: densIndex, // from segmented control

    // subtypes
    venturiType: (vTypeSelect.value === '1') ? 'knob' : 'bar',
    lakeType: (lsTypeSelect.value === '1') ? 'freeform' : 'simple',
    mechTexture: (mechTxtrSelect.value === '1') ? 'voronoi' : 'gyroid',
  };

  return state;
}

function applyVisibility() {
  const st = getState();

  // defaults: hide everything subtype-specific, then enable per product
  // subtype dropdowns
  show(fieldVType, false);
  show(fieldLsType, false);
  show(fieldHwTxtr, false);

  // shared sliders
  show(fieldLen, false);
  show(fieldRot, false);
  show(fieldRad, false);
  show(fieldFF, false);
  show(fieldDens, false);

  if (st.product === 'venturi') {
    show(fieldVType, true);

    // venturi: always uses twist
    show(fieldRot, true);

    if (st.venturiType === 'knob') {
      show(fieldRad, true);
      show(fieldLen, false);
    } else {
      show(fieldLen, true);
      show(fieldRad, false);
    }
    return;
  }

  if (st.product === 'lakeshore') {
    show(fieldLsType, true);

    if (st.lakeType === 'simple') {
      show(fieldLen, true);
      show(fieldRot, true);
      show(fieldFF, false);
    } else {
      show(fieldFF, true);
      show(fieldLen, false);
      show(fieldRot, false);
    }
    return;
  }

  // mechanic
  show(fieldHwTxtr, true);
  show(fieldLen, true);
  show(fieldDens, true);
}

function applyValueChips() {
  // length
  const li = clampIndex(parseInt(lenSlider.value, 10), LENGTH_LABELS.length);
  lenValue.textContent = LENGTH_LABELS[li];

  // twist
  const ti = clampIndex(parseInt(twistSlider.value, 10), TWIST_LABELS.length);
  twistValue.textContent = TWIST_LABELS[ti];

  // radius 
  const ri = clampIndex(parseInt(radSlider.value, 10), RAD_LABELS.length);
  radValue.textContent = RAD_LABELS[ri];

  // form factor
  const ffi = clampIndex(parseInt(ffSlider.value, 10), FF_LABELS.length);
  ffValue.textContent = FF_LABELS[ffi];

  // density
  //const di = clampIndex(parseInt(densSlider.value, 10), DENS_LABELS.length); 
  //densValue.textContent = DENS_LABELS[di];
  //----uncomment above to revert to old slider
  densValue.textContent = DENS_LABELS[clampIndex(densIndex, DENS_LABELS.length)];
}

function clampIndex(i, n) {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(n - 1, i));
}

let loadToken = 0;
async function loadForCurrentState() {
  const token = ++loadToken;
  const st = getState();
  const url = resolveModelUrl(st);

  if (!url) return;

  setBusy(true, 'loading model...');
  try {
    // If another change happens while loading, ignore completion
    await viewer.loadModel(url, { fit: true, overrideMaterials: true });
    if (token === loadToken) status.textContent = 'for illustration only';
  } catch (e) {
    console.error(e);
    if (token === loadToken) status.textContent = 'error (see console)';
  } finally {
    if (token === loadToken) setBusy(false, status.textContent);
  }
}

// ----- event wiring -----
function wireUI() {
  // About modal (unchanged behavior)
  const aboutBtn   = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  const aboutBackdrop = document.getElementById('aboutBackdrop');

  function openAbout(){ aboutModal.classList.add('is-open'); aboutModal.setAttribute('aria-hidden','false'); }
  function closeAbout(){ aboutModal.classList.remove('is-open'); aboutModal.setAttribute('aria-hidden','true'); }

  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  aboutBackdrop.addEventListener('click', closeAbout);
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeAbout(); });

  // Grid & Axis toggle (unchanged)
  const gridBtn = document.getElementById('gridToggle');
  let gridOn = true;
  gridBtn.addEventListener('click', () => {
    gridOn = !gridOn;
    viewer.setGridVisible(gridOn);
    gridBtn.classList.toggle('active', gridOn);
    gridBtn.textContent = gridOn ? '3D Markers: On' : '3D Markers: Off';
  });

  // Product + subtype changes affect visibility + model
  const onMajorChange = () => {
    applyVisibility();
    applyValueChips();
    loadForCurrentState();
  };

  prodSelect.addEventListener('change', onMajorChange);
  vTypeSelect.addEventListener('change', onMajorChange);
  lsTypeSelect.addEventListener('change', onMajorChange);
  mechTxtrSelect.addEventListener('change', onMajorChange);

  // Sliders: update chip on input, load on change (release)
  lenSlider.addEventListener('input', applyValueChips);
  lenSlider.addEventListener('change', loadForCurrentState);

  twistSlider.addEventListener('input', applyValueChips);
  twistSlider.addEventListener('change', loadForCurrentState);

  radSlider.addEventListener('input', applyValueChips);
  radSlider.addEventListener('change', loadForCurrentState);

  ffSlider.addEventListener('input', applyValueChips);
  ffSlider.addEventListener('change', loadForCurrentState);
/* uncomment below to revert to old slider
  densSlider.addEventListener('input', applyValueChips);
  densSlider.addEventListener('change', loadForCurrentState);*/
  initDensityToggle();

  // initial
  applyVisibility();
  applyValueChips();
  loadForCurrentState();
}

// boot
wireUI();
