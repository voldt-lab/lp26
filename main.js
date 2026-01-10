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

const rotSlider = document.getElementById('rot');
const rotValue  = document.getElementById('rotVal');

const radSlider = document.getElementById('rad');
const radValue  = document.getElementById('radVal');

const ffSlider  = document.getElementById('ff');
const ffValue   = document.getElementById('ffVal');

const densSlider = document.getElementById('dens');
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
const TWIST_LABELS  = ['None', 'Minor', 'Medium', 'Max'];
const FF_LABELS     = ['1', '2', '3', '4', '5'];
const DENS_LABELS   = ['Low', 'Mid', 'Hi'];

// ----- state + helpers -----
let busy = false;

function show(el, on) {
  el.style.display = on ? '' : 'none';
}

function setBusy(on, text = '') {
  busy = !!on;
  viewer.setLoading(busy);
  panel.classList.toggle('busy', busy);
  panel.disabled = busy; // harmless even if fieldset; your CSS uses .busy anyway
  status.textContent = text || '';
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
    tw:   parseInt(rotSlider.value, 10),
    rad:  parseInt(radSlider.value, 10),     // note: radius slider is actual 4/6/8/10
    ff:   parseInt(ffSlider.value, 10),
    dens: parseInt(densSlider.value, 10),

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
  const ti = clampIndex(parseInt(rotSlider.value, 10), TWIST_LABELS.length);
  rotValue.textContent = TWIST_LABELS[ti];

  // radius (already “real” 4/6/8/10)
  radValue.textContent = String(parseInt(radSlider.value, 10));

  // form factor
  const ffi = clampIndex(parseInt(ffSlider.value, 10), FF_LABELS.length);
  ffValue.textContent = FF_LABELS[ffi];

  // density
  const di = clampIndex(parseInt(densSlider.value, 10), DENS_LABELS.length);
  densValue.textContent = DENS_LABELS[di];
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
    if (token === loadToken) status.textContent = 'done';
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
    gridBtn.textContent = gridOn ? 'Grid & Axis: On' : 'Grid & Axis: Off';
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

  rotSlider.addEventListener('input', applyValueChips);
  rotSlider.addEventListener('change', loadForCurrentState);

  radSlider.addEventListener('input', applyValueChips);
  radSlider.addEventListener('change', loadForCurrentState);

  ffSlider.addEventListener('input', applyValueChips);
  ffSlider.addEventListener('change', loadForCurrentState);

  densSlider.addEventListener('input', applyValueChips);
  densSlider.addEventListener('change', loadForCurrentState);

  // initial
  applyVisibility();
  applyValueChips();
  loadForCurrentState();
}

// boot
wireUI();
