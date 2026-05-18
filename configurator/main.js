// main.js
import { createViewer } from './viewer.js';

const root   = document.getElementById('viewport');
const status = document.getElementById('status');
const panel  = document.getElementById('ctrlpanel');

// Product select
const prodSelect = document.getElementById('prodtype');

// Arroyo controls
const fieldVType  = document.getElementById('field-vtype');
const fieldRot    = document.getElementById('field-rot');
const fieldLen    = document.getElementById('field-len');

// Basin controls
const fieldLsType  = document.getElementById('field-lstype');
const fieldFF      = document.getElementById('field-ff');

// Cella / Dune controls
const fieldHwTxtr  = document.getElementById('field-mechtype');
const fieldDens    = document.getElementById('field-dens');

function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value ?? '0';
}
function setRadioValue(name, value) {
  const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (el) el.checked = true;
}

// Sliders + their value chips (simplified now that IDs are unique)
const lenSlider = document.getElementById('len');
const lenValue  = document.getElementById('lenVal');

let twistCtrl = { getIndex: () => 2, setIndex: () => {} };

const ffSlider  = document.getElementById('ff');
const ffValue   = document.getElementById('ffVal');

//const densSlider = document.getElementById('dens'); //----uncomment to revert to old slider
const densToggle = document.getElementById('densToggle');
const densValue  = document.getElementById('densVal');

const spSlider = document.getElementById('sp');
const spValue  = document.getElementById('spVal');
const fieldSp  = document.getElementById('field-sp');

const radSlider = document.getElementById('rad');
const radValue  = document.getElementById('radVal');
const fieldRad  = document.getElementById('field-rad');



// Viewer
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

  if (product === 'arroyo') {
    if (state.arroyoType === 'knob') {
      const d = KNOB_DENS_MAP[clampIndex(densIndex, KNOB_DENS_MAP.length)];
      return `${MODEL_BASE}/arroyo/knob/rad${state.rad}_dens${d}${MODEL_EXT}`;
    }
    return `${MODEL_BASE}/arroyo/${state.arroyoType}/len${state.len}_dens${state.dens}${MODEL_EXT}`;
  }

  if (product === 'basin') {
    if (state.basinType === 'knob') {
      const d = KNOB_DENS_MAP[clampIndex(densIndex, KNOB_DENS_MAP.length)];
      return `${MODEL_BASE}/basin/knob/rad${state.rad}_dens${d}${MODEL_EXT}`;
    }
    return `${MODEL_BASE}/basin/simple/len${state.len}_tw${state.tw}${MODEL_EXT}`;
  }

  if (product === 'cella') {
    if (state.infillType === 'knob') {
      const d = KNOB_DENS_MAP[clampIndex(densIndex, KNOB_DENS_MAP.length)];
      return `${MODEL_BASE}/cella/knob/rad${state.rad}_dens${d}${MODEL_EXT}`;
    }
    return `${MODEL_BASE}/cella/len${state.len}_dens${state.dens}${MODEL_EXT}`;
  }

  if (product === 'dune') {
    if (state.infillType === 'knob') {
      const d = KNOB_DENS_MAP[clampIndex(densIndex, KNOB_DENS_MAP.length)];
      return `${MODEL_BASE}/dune/knob/rad${state.rad}_dens${d}${MODEL_EXT}`;
    }
    return `${MODEL_BASE}/dune/len${state.len}_dens${state.dens}${MODEL_EXT}`;
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
const DIAMETER_LABELS = ['1-1/4"', '1-9/16"', '2"', '2-1/2"'];
const KNOB_DENS_MAP   = [1, 2, 4]; // densIndex 0/1/2 → dens file suffix for knob


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
let renderDensToggle = () => {}; // set by initDensityToggle, used by restoreState
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

  renderDensToggle = render;

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
  const product = prodSelect.value; // "0" | "1" | "2" | "3"

  const state = {
    product:
      product === '0' ? 'arroyo' :
      product === '1' ? 'basin'  :
      product === '2' ? 'cella'  :
      'dune',

    len:  parseInt(lenSlider.value, 10),
    tw:   twistCtrl.getIndex(),
    ff:   parseInt(ffSlider.value, 10),
    sp:   parseInt(spSlider.value, 10),
    dens: densIndex,
    rad:  parseInt(radSlider.value, 10),

    arroyoType:
      getRadioValue('vtype') === '1' ? 'bulb' :
      getRadioValue('vtype') === '2' ? 'knob' :
      'ridges',
    basinType:  getRadioValue('lstype')   === '1' ? 'knob' : 'simple',
    infillType: getRadioValue('mechtype') === '1' ? 'knob' : 'bar',
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
  show(fieldRad, false);

  if (st.product === 'arroyo') {
    show(fieldVType, true);
    if (st.arroyoType === 'knob') {
      show(fieldRad, true);
      show(fieldDens, true);
    } else {
      show(fieldLen, true);
      show(fieldSp, true);
      show(fieldDens, true);
    }
    return;
  }

  if (st.product === 'basin') {
    show(fieldLsType, true);
    if (st.basinType === 'simple') {
      show(fieldLen, true);
      show(fieldSp, true);
      show(fieldRot, true);
    } else { // knob
      show(fieldRad, true);
      show(fieldDens, true);
    }
    return;
  }

  // cella / dune
  show(fieldHwTxtr, true);
  if (st.infillType === 'knob') {
    show(fieldRad, true);
    show(fieldDens, true);
  } else {
    show(fieldLen, true);
    show(fieldSp, true);
    show(fieldDens, true);
  }
}

function applyValueChips() {
  // length
  const li = clampIndex(parseInt(lenSlider.value, 10), LENGTH_LABELS.length);
  lenValue.textContent = LENGTH_LABELS[li];

  // diameter (knob) / form factor repurposed
  const ffi = clampIndex(parseInt(ffSlider.value, 10), DIAM_LABELS.length);
  ffValue.textContent = DIAM_LABELS[ffi];

  // heat wave knob diameter
  const ri = clampIndex(parseInt(radSlider.value, 10), DIAMETER_LABELS.length);
  radValue.textContent = DIAMETER_LABELS[ri];

  // hole spacing
  const spi = clampIndex(parseInt(spSlider.value, 10), SPACING_LABELS.length);
  spValue.textContent = SPACING_LABELS[spi];

  // density
  //const di = clampIndex(parseInt(densSlider.value, 10), DENS_LABELS.length);
  //densValue.textContent = DENS_LABELS[di];
  //----uncomment above to revert to old slider
  densValue.textContent = DENS_LABELS[clampIndex(densIndex, DENS_LABELS.length)];
}

// ----- quote list -----
let quoteItems = [];

function buildLabel(st) {
  const parts = [{ arroyo: 'Arroyo', basin: 'Basin', cella: 'Cella', dune: 'Dune' }[st.product]];

  if (st.product === 'arroyo') {
    if (st.arroyoType === 'knob') {
      parts.push('Knob');
      parts.push(DIAMETER_LABELS[clampIndex(st.rad, DIAMETER_LABELS.length)]);
      parts.push(DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)]);
    } else {
      parts.push(st.arroyoType === 'bulb' ? 'Bar-Bulbs' : 'Bar-Ridges');
      parts.push(LENGTH_LABELS[clampIndex(st.len, LENGTH_LABELS.length)]);
      parts.push('CTC' + SPACING_LABELS[clampIndex(st.sp, SPACING_LABELS.length)]);
      parts.push(DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)]);
    }
  } else if (st.product === 'basin') {
    if (st.basinType === 'knob') {
      parts.push('Knob');
      parts.push(DIAMETER_LABELS[clampIndex(st.rad, DIAMETER_LABELS.length)]);
      parts.push(DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)]);
    } else {
      parts.push('Simple');
      parts.push(LENGTH_LABELS[clampIndex(st.len, LENGTH_LABELS.length)]);
      parts.push('CTC' + SPACING_LABELS[clampIndex(st.sp, SPACING_LABELS.length)]);
      parts.push(TWIST_LABELS[clampIndex(st.tw, TWIST_LABELS.length)]);
    }
  } else { // cella / dune
    if (st.infillType === 'knob') {
      parts.push('Knob');
      parts.push(DIAMETER_LABELS[clampIndex(st.rad, DIAMETER_LABELS.length)]);
      parts.push(DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)]);
    } else {
      parts.push('Bar');
      parts.push(LENGTH_LABELS[clampIndex(st.len, LENGTH_LABELS.length)]);
      parts.push('CTC' + SPACING_LABELS[clampIndex(st.sp, SPACING_LABELS.length)]);
      parts.push(DENS_LABELS[clampIndex(st.dens, DENS_LABELS.length)]);
    }
  }

  const finishEl = document.querySelector('#matPicker .mat-swatch.is-active');
  if (finishEl) parts.push(finishEl.title.replace(/ /g, ''));
  return parts.join('.');
}

function renderQuoteList() {
  const list    = document.getElementById('quoteList');
  const sendBtn = document.getElementById('sendBtn');
  list.innerHTML = '';
  quoteItems.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'quote-item';
    div.innerHTML = `<span class="quote-item__label" data-index="${i}">${item.label}</span><button class="quote-item__remove" data-index="${i}" title="Remove">×</button>`;
    list.appendChild(div);
  });
  sendBtn.style.display = quoteItems.length > 0 ? '' : 'none';
}

function restoreState(snapshot) {
  prodSelect.value = { arroyo: '0', basin: '1', cella: '2', dune: '3' }[snapshot.product];
  setRadioValue('vtype',   snapshot.arroyoType === 'bulb' ? '1' : snapshot.arroyoType === 'knob' ? '2' : '0');
  setRadioValue('lstype',  snapshot.basinType  === 'knob' ? '1' : '0');
  setRadioValue('mechtype', snapshot.infillType === 'knob' ? '1' : '0');
  lenSlider.value   = snapshot.len;
  twistCtrl.setIndex(snapshot.tw ?? 2);
  ffSlider.value    = snapshot.ff;
  spSlider.value    = snapshot.sp;
  radSlider.value   = snapshot.rad ?? 0;
  densIndex = snapshot.dens;
  renderDensToggle();
  if (snapshot.mat) {
    document.querySelectorAll('#matPicker .mat-swatch').forEach(s =>
      s.classList.toggle('is-active', s.dataset.mat === snapshot.mat)
    );
    viewer.setMaterial(snapshot.mat);
  }
  applyVisibility();
  applyValueChips();
  loadForCurrentState();
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

  const stemUrl = resolveStemUrl();

  try {
    const isKnob =
      (st.product === 'arroyo' && st.arroyoType === 'knob') ||
      (st.product === 'basin'  && st.basinType  === 'knob') ||
      (st.product === 'cella'  && st.infillType === 'knob') ||
      (st.product === 'dune'   && st.infillType === 'knob');
    if (isKnob) {
      await viewer.loadSingle(handleUrl, stemUrl);
    } else {
      const spacingM = SPACING_METERS[clampIndex(st.sp, SPACING_METERS.length)];
      await viewer.loadComposite(handleUrl, stemUrl, spacingM);
    }

    // only the latest request should update status
    if (token !== loadToken) return;

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

function initSimpleToggle(elementId, defaultIndex, onChange) {
  const el = document.getElementById(elementId);
  if (!el) return { getIndex: () => defaultIndex, setIndex: () => {} };
  const btns  = Array.from(el.querySelectorAll('.segmented__btn'));
  const thumb = el.querySelector('.segmented__thumb');
  let idx = parseInt(el.getAttribute('data-active-index') || String(defaultIndex), 10);

  function render() {
    btns.forEach((b, i) => b.setAttribute('aria-pressed', i === idx ? 'true' : 'false'));
    const cs = getComputedStyle(el);
    const pad = parseFloat(cs.getPropertyValue('--pad')) || 0;
    const rootRect = el.getBoundingClientRect();
    const btnRect  = btns[idx].getBoundingClientRect();
    let left = (btnRect.left - rootRect.left) - pad;
    const maxLeft = (rootRect.width - pad * 2) - btnRect.width;
    thumb.style.width     = `${btnRect.width}px`;
    thumb.style.transform = `translateX(${Math.max(0, Math.min(left, maxLeft))}px)`;
  }

  btns.forEach(b => b.addEventListener('click', () => {
    const i = parseInt(b.dataset.index, 10);
    if (i === idx) return;
    idx = i;
    render();
    onChange(idx);
  }));

  new ResizeObserver(render).observe(el);
  render();
  return { getIndex: () => idx, setIndex: (i) => { idx = i; render(); } };
}

// ----- event wiring -----
function wireUI() {
  const buyBtn  = document.getElementById('buyBtn');
  const sendBtn = document.getElementById('sendBtn');

  buyBtn.addEventListener('click', () => {
    const st = getState();
    const finishEl = document.querySelector('#matPicker .mat-swatch.is-active');
    quoteItems.push({ label: buildLabel(st), state: { ...st, mat: finishEl?.dataset.mat || null } });
    renderQuoteList();
  });

  document.getElementById('quoteList').addEventListener('click', e => {
    const removeBtn = e.target.closest('.quote-item__remove');
    if (removeBtn) {
      quoteItems.splice(parseInt(removeBtn.dataset.index, 10), 1);
      renderQuoteList();
      return;
    }
    const labelEl = e.target.closest('.quote-item__label');
    if (labelEl) restoreState(quoteItems[parseInt(labelEl.dataset.index, 10)].state);
  });

  sendBtn.addEventListener('click', () => {
    if (!quoteItems.length) return;
    openQuoteModal();
  });

  // Quote modal
  const quoteModal      = document.getElementById('quoteModal');
  const quoteBackdrop   = document.getElementById('quoteBackdrop');
  const quoteClose      = document.getElementById('quoteClose');
  const quoteCancelBtn  = document.getElementById('quoteCancelBtn');
  const quoteSubmitBtn  = document.getElementById('quoteSubmitBtn');
  const quoteNameInput  = document.getElementById('quoteName');
  const quoteEmailInput = document.getElementById('quoteEmail');

  function openQuoteModal() {
    quoteNameInput.value = '';
    quoteEmailInput.value = '';
    quoteModal.classList.add('is-open');
    quoteModal.setAttribute('aria-hidden', 'false');
    quoteNameInput.focus();
  }
  function closeQuoteModal() {
    quoteModal.classList.remove('is-open');
    quoteModal.setAttribute('aria-hidden', 'true');
    quoteSubmitBtn.textContent = 'Request for Quote';
    quoteSubmitBtn.disabled = false;
  }

  quoteClose.addEventListener('click', closeQuoteModal);
  quoteCancelBtn.addEventListener('click', closeQuoteModal);
  quoteBackdrop.addEventListener('click', closeQuoteModal);

  quoteSubmitBtn.addEventListener('click', async () => {
    const name  = quoteNameInput.value.trim();
    const email = quoteEmailInput.value.trim();
    if (!name || !email) { alert('Please enter your name and email.'); return; }
    quoteSubmitBtn.textContent = 'Sending...';
    quoteSubmitBtn.disabled = true;
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'quote-request', name, email, items: quoteItems.map(i => i.label).join('\n') }).toString(),
      });
      if (!res.ok) throw new Error('failed');
      quoteItems = [];
      renderQuoteList();
      closeQuoteModal();
    } catch {
      quoteSubmitBtn.textContent = 'Request for Quote';
      quoteSubmitBtn.disabled = false;
      alert('Submission failed — please email us at info@voldtlab.com.');
    }
  });

  // About modal
  const aboutBtn   = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  const aboutBackdrop = document.getElementById('aboutBackdrop');

  function openAbout(){ aboutModal.classList.add('is-open'); aboutModal.setAttribute('aria-hidden','false'); }
  function closeAbout(){ aboutModal.classList.remove('is-open'); aboutModal.setAttribute('aria-hidden','true'); }

  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  aboutBackdrop.addEventListener('click', closeAbout);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAbout(); closeQuoteModal(); } });

  // Position viewport-tools flush against the panel's actual right edge
  const viewportTools = document.getElementById('viewport-tools');
  function positionViewportTools() {
    const r = panel.getBoundingClientRect();
    viewportTools.style.left = (r.right + 14) + 'px';
  }
  positionViewportTools();
  window.addEventListener('resize', positionViewportTools);

  // Fullscreen toggle
  const fsBtn = document.getElementById('fsBtn');
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fsBtn.classList.toggle('is-fullscreen', !!document.fullscreenElement);
    fsBtn.setAttribute('data-tip', document.fullscreenElement ? 'Exit full screen' : 'Full screen');
    fsBtn.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Full screen');
  });

  // Grid & Axis toggle
  const gridBtn = document.getElementById('gridToggle');
  let gridOn = true;
  gridBtn.addEventListener('click', () => {
    gridOn = !gridOn;
    viewer.setGridVisible(gridOn);
    gridBtn.classList.toggle('active', gridOn);
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

  // Finish material picker (handle + stems)
  const matPicker = document.getElementById('matPicker');
  matPicker.addEventListener('click', e => {
    const swatch = e.target.closest('.mat-swatch');
    if (!swatch) return;
    matPicker.querySelectorAll('.mat-swatch').forEach(s => s.classList.remove('is-active'));
    swatch.classList.add('is-active');
    viewer.setMaterial(swatch.dataset.mat);
  });
  document.getElementById('matExpandBtn').addEventListener('click', e => {
    e.stopPropagation();
    matPicker.classList.toggle('is-expanded');
  });

  // Backboard picker
  const backboardBtn    = document.getElementById('backboardBtn');
  const backboardMenu   = document.getElementById('backboardMenu');
  const backboardSwatch = document.getElementById('backboardSwatch');

  backboardBtn.addEventListener('click', e => {
    e.stopPropagation();
    backboardMenu.style.display = backboardMenu.style.display === 'none' ? '' : 'none';
  });

  backboardMenu.addEventListener('click', e => {
    const item = e.target.closest('.vp-dropdown-item');
    if (!item) return;
    backboardMenu.querySelectorAll('.vp-dropdown-item').forEach(i => i.classList.remove('is-active'));
    item.classList.add('is-active');
    backboardSwatch.style.background = item.style.background;
    viewer.setBaseMaterial(item.dataset.base);
    backboardMenu.style.display = 'none';
  });

  document.addEventListener('click', () => { backboardMenu.style.display = 'none'; });

  prodSelect.addEventListener('change', onMajorChange);
  fieldVType.addEventListener('change', onMajorChange);
  fieldLsType.addEventListener('change', onMajorChange);
  fieldHwTxtr.addEventListener('change', onMajorChange);

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
  twistCtrl = initSimpleToggle('twistToggle', 2, loadForCurrentState);
  wireSmoothSlider(ffSlider);
  wireSmoothSlider(radSlider);
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
