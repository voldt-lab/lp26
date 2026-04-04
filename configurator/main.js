// main.js
import { createViewer } from './viewer.js';

const root   = document.getElementById('viewport');
const status = document.getElementById('status');
const panel  = document.getElementById('ctrlpanel');

// Product select
const prodSelect = document.getElementById('prodtype');

// Heat Wave controls
const vTypeSelect = document.getElementById('vtype');
const fieldVType  = document.getElementById('field-vtype');
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

const ffSlider  = document.getElementById('ff');
const ffValue   = document.getElementById('ffVal');

//const densSlider = document.getElementById('dens'); //----uncomment to revert to old slider
const densToggle = document.getElementById('densToggle');
const densValue  = document.getElementById('densVal');

const spSlider = document.getElementById('sp');
const spValue  = document.getElementById('spVal');
const fieldSp  = document.getElementById('field-sp');



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

function resolveStemUrl() {
  return `${MODEL_BASE}/stem${MODEL_EXT}`;
}

function resolveModelUrl(state) {
  // We intentionally use *indices* (slider values) in filenames.
  // That makes it easy to pre-bake without worrying about decimal formatting.
  const { product } = state;

  if (product === 'heatwave') {
    const vtype = state.heatwaveType; // 'chrystal' | 'bulb'
    return `${MODEL_BASE}/heat_wave/${vtype}/len${state.len}_dens${state.dens}${MODEL_EXT}`;
  }

  if (product === 'lakeshore') {
    const lstype = state.lakeType; // 'simple' | 'knob'
    if (lstype === 'knob') {
      return `${MODEL_BASE}/lake_shore/knob/diam${state.ff}_dens${state.dens}${MODEL_EXT}`;
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
const LENGTH_LABELS  = ['5-11/16"', '7-9/16"', '9-1/2"', '11-3/8"', '13-3/4"'];
const TWIST_LABELS   = ['None', 'Minor', 'Max'];
const DIAM_LABELS    = ['1-1/2"', '1-3/4"', '2"', '2-1/4"', '2-1/2"'];
const DENS_LABELS    = ['Low', 'Mid', 'Hi'];
const SPACING_LABELS = ['3-3/4"', '5"', '6-5/16"', '7-9/16"', '10-1/16"'];
const SPACING_METERS = [0.09525, 0.127, 0.160338, 0.192088, 0.255588];


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
      product === '0' ? 'heatwave' :
      product === '1' ? 'mechanic' :
      'lakeshore',

    // slider indices
    len:  parseInt(lenSlider.value, 10),
    tw:   parseInt(twistSlider.value, 10),
    ff:   parseInt(ffSlider.value, 10),
    sp:   parseInt(spSlider.value, 10),
    //dens: parseInt(densSlider.value, 10), //----uncomment to revert to old slider
    dens: densIndex, // from segmented control

    // subtypes
    heatwaveType: vTypeSelect.value === '1' ? 'bulb' : 'chrystal',
    lakeType: (lsTypeSelect.value === '1') ? 'knob' : 'simple',
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
  show(fieldSp, false);
  show(fieldRot, false);
  show(fieldFF, false);
  show(fieldDens, false);

  if (st.product === 'heatwave') {
    show(fieldVType, true);
    show(fieldLen, true);
    show(fieldSp, true);
    show(fieldDens, true);
    return;
  }

  if (st.product === 'lakeshore') {
    show(fieldLsType, true);

    if (st.lakeType === 'simple') {
      show(fieldLen, true);
      show(fieldSp, true);
      show(fieldRot, true);
      show(fieldFF, false);
      show(fieldDens, false);
    } else { // knob
      show(fieldFF, true);
      show(fieldDens, true);
      show(fieldLen, false);
      show(fieldSp, false);
      show(fieldRot, false);
    }
    return;
  }

  // mechanic
  show(fieldHwTxtr, true);
  show(fieldLen, true);
  show(fieldSp, true);
  show(fieldDens, true);
}

function applyValueChips() {
  // length
  const li = clampIndex(parseInt(lenSlider.value, 10), LENGTH_LABELS.length);
  lenValue.textContent = LENGTH_LABELS[li];

  // twist
  const ti = clampIndex(parseInt(twistSlider.value, 10), TWIST_LABELS.length);
  twistValue.textContent = TWIST_LABELS[ti];

  // diameter (knob) / form factor repurposed
  const ffi = clampIndex(parseInt(ffSlider.value, 10), DIAM_LABELS.length);
  ffValue.textContent = DIAM_LABELS[ffi];

  // hole spacing
  const spi = clampIndex(parseInt(spSlider.value, 10), SPACING_LABELS.length);
  spValue.textContent = SPACING_LABELS[spi];

  // density
  //const di = clampIndex(parseInt(densSlider.value, 10), DENS_LABELS.length);
  //densValue.textContent = DENS_LABELS[di];
  //----uncomment above to revert to old slider
  densValue.textContent = DENS_LABELS[clampIndex(densIndex, DENS_LABELS.length)];
}

function updatePriceTag() {
  const st = getState();
  const isKnob = st.product === 'lakeshore' && st.lakeType === 'knob';
  const dollars = isKnob ? 49 : [49, 59, 69, 79, 89][clampIndex(st.len, 5)];
  document.getElementById('priceTag').textContent = `MSRP $${dollars}`;
}

function clampIndex(i, n) {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(n - 1, i));
}

let loadToken = 0;
async function loadForCurrentState() {
  const token = ++loadToken;
  const st = getState();
  const handleUrl = resolveModelUrl(st);

  if (!handleUrl) return;

  setBusy(true, 'Loading model...');

  const stemUrl  = resolveStemUrl();
  const spacingM = SPACING_METERS[clampIndex(st.sp, SPACING_METERS.length)];

  try {
    await viewer.loadComposite(handleUrl, stemUrl, spacingM);

    // only the latest request should update status
    if (token !== loadToken) return;

    updatePriceTag();
    status.textContent = 'For illustration only';
  } catch (e) {
    console.error(`Failed to load`, e);

    // if this request is already stale, do nothing
    if (token !== loadToken) return;

    const msg = String(e?.message || e);
    status.textContent =
      msg.includes('404') || msg.includes('Not Found')
        ? 'Missing resource'
        : 'Load failed';
  } finally {
    // always release busy state for the latest request
    if (token === loadToken) {
      setBusy(false, status.textContent);
    }
  }
}

// ----- event wiring -----
function wireUI() {
  // Add to Cart button -- posts cart item to parent page via postMessage
  const buyBtn = document.getElementById('buyBtn');
  buyBtn.addEventListener('click', () => {
    const st = getState();
    const isKnob = st.product === 'lakeshore' && st.lakeType === 'knob';

    const PRODUCT_NAMES = { heatwave: 'Heat Wave', mechanic: 'Mechanic', lakeshore: 'Lake Shore' };
    const subtype = {
      heatwave:  st.heatwaveType === 'chrystal' ? 'Chrystal' : 'Bulb',
      mechanic:  st.mechTexture  === 'gyroid'   ? 'Gyroid'   : 'Voronoi',
      lakeshore: isKnob ? 'Knob' : 'Simple',
    }[st.product];
    const name = `VOLDT Hardware — ${PRODUCT_NAMES[st.product]} ${subtype}`;

    let id, price, options;
    if (isKnob) {
      id    = 'voldt-hardware-knob';
      price = 49;
      options = {
        'Diameter': DIAM_LABELS[clampIndex(st.ff, DIAM_LABELS.length)],
        'Density':  DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)],
      };
    } else {
      id    = `voldt-hardware-${st.len}`;
      price = [49, 59, 69, 79, 89][st.len];
      options = {
        'Size': LENGTH_LABELS[clampIndex(st.len, LENGTH_LABELS.length)],
        'Hole Spacing (CTC)': SPACING_LABELS[clampIndex(st.sp, SPACING_LABELS.length)],
      };
      if (st.product === 'lakeshore') {
        options['Twist'] = TWIST_LABELS[clampIndex(st.tw, TWIST_LABELS.length)];
      } else {
        options['Density'] = DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)];
      }
    }

    window.parent.postMessage({
      type: 'voldt-add-to-cart',
      item: { id, name, price, image: 'assets/ap25_2.jpg', options },
    }, '*');
  });

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

  // Position viewport-tools flush against the panel's actual right edge
  const viewportTools = document.getElementById('viewport-tools');
  function positionViewportTools() {
    const r = panel.getBoundingClientRect();
    viewportTools.style.left = (r.right + 14) + 'px';
  }
  positionViewportTools();
  window.addEventListener('resize', positionViewportTools);

  // Grid & Axis toggle
  const gridBtn = document.getElementById('gridToggle');
  let gridOn = true;
  gridBtn.addEventListener('click', () => {
    gridOn = !gridOn;
    viewer.setGridVisible(gridOn);
    gridBtn.classList.toggle('active', gridOn);
    gridBtn.textContent = gridOn ? '3D Markers: On' : '3D Markers: Off';
  });

  // Zoom to fit
  document.getElementById('zoomFitBtn').addEventListener('click', () => {
    viewer.zoomToFit();
  });

  // Product + subtype changes affect visibility + model
  const onMajorChange = () => {
    applyVisibility();
    applyValueChips();
    loadForCurrentState();
  };

  // Material picker
  document.getElementById('matPicker').addEventListener('click', e => {
    const swatch = e.target.closest('.mat-swatch');
    if (!swatch) return;
    document.querySelectorAll('.mat-swatch').forEach(s => s.classList.remove('is-active'));
    swatch.classList.add('is-active');
    viewer.setMaterial(swatch.dataset.mat);
  });

  prodSelect.addEventListener('change', onMajorChange);
  vTypeSelect.addEventListener('change', onMajorChange);
  lsTypeSelect.addEventListener('change', onMajorChange);
  mechTxtrSelect.addEventListener('change', onMajorChange);

  // Sliders: smooth drag (step=any while held), snap+load on release
  function wireSmoothSlider(slider, onSnap) {
    slider.addEventListener('pointerdown', () => {
      slider.dataset.origStep = slider.step;
      slider.step = 'any';
    });
    slider.addEventListener('input', applyValueChips);
    slider.addEventListener('change', () => {
      slider.value = Math.round(parseFloat(slider.value));
      slider.step = slider.dataset.origStep || '1';
      if (onSnap) onSnap();
      applyValueChips();
      loadForCurrentState();
    });
  }

  wireSmoothSlider(lenSlider, () => {
    // Auto-clamp CTC down when length slides below it
    if (parseInt(spSlider.value, 10) > parseInt(lenSlider.value, 10)) {
      spSlider.value = lenSlider.value;
    }
  });
  // CTC slider: snap to len max on release; tooltip when dragging past limit
  const spTip = document.createElement('span');
  spTip.className = 'ctc-tip';
  spTip.textContent = 'Will snap to max allowed';
  fieldSp.appendChild(spTip);

  spSlider.addEventListener('pointerdown', () => {
    spSlider.dataset.origStep = spSlider.step;
    spSlider.step = 'any';
  });
  spSlider.addEventListener('input', () => {
    const over = parseFloat(spSlider.value) > parseInt(lenSlider.value, 10);
    spTip.classList.toggle('ctc-tip--visible', over);
    applyValueChips();
  });
  spSlider.addEventListener('change', () => {
    spSlider.value = Math.min(Math.round(parseFloat(spSlider.value)), parseInt(lenSlider.value, 10));
    spSlider.step = spSlider.dataset.origStep || '1';
    spTip.classList.remove('ctc-tip--visible');
    applyValueChips();
    loadForCurrentState();
  });
  wireSmoothSlider(twistSlider);
  wireSmoothSlider(ffSlider);
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
