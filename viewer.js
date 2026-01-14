// viewer.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Not in your importmap, so we import via full URL to avoid touching index.html
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';


// --- simple equirect "studio" environment (LDR) ---
function makeStudioEnv(renderer, opts = {}) {
  const {
    width = 2048, height = 1024,
    bg = '#2a2a2cff',
    cards = [
      [0.20, 0.65, 0.20, 0.14, 30, 1.00],
      [0.50, 0.12, 0.28, 0.16, 40, 0.95],
      [0.80, 0.35, 0.20, 0.14, 30, 1.00],
      [0.50, 0.75, 0.26, 0.15, 35, 0.90],
    ]
  } = opts;

  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  cards.forEach(([u, v, w, h, blur, alpha]) => {
    const x = Math.round((u - w / 2) * width);
    const y = Math.round((v - h / 2) * height);
    const ww = Math.round(w * width);
    const hh = Math.round(h * height);

    ctx.save();
    ctx.shadowColor = `rgba(255,255,255,${alpha})`;
    ctx.shadowBlur = blur;
    ctx.fillStyle = '#f5feffff';
    ctx.fillRect(x, y, ww, hh);
    ctx.restore();

    if (x + ww > width) ctx.fillRect(x - width, y, ww, hh);
    if (x < 0)          ctx.fillRect(x + width, y, ww, hh);
  });

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  else tex.encoding = THREE.sRGBEncoding;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromEquirectangular(tex);
  tex.dispose();
  return envRT.texture;
}

function setEnvIntensity(root, value){
  root.traverse(o => {
    if (o.isMesh) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        if (m && 'envMapIntensity' in m) {
          m.envMapIntensity = value;
          m.needsUpdate = true;
        }
      });
    }
  });
}

// --- simple canvas gradient as a Texture for scene.background ---
function makeGradient({
  width = 1024,
  height = 1024,
  stops = [
    [0.00, '#0c1018ff'],
    [0.55, '#0f1722ff'],
    [1.00, '#262933ff'],
  ],
  vertical = true,
} = {}) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');

  const g = vertical
    ? ctx.createLinearGradient(0, 0, 0, height)
    : ctx.createLinearGradient(0, 0, width, 0);

  stops.forEach(([t, color]) => g.addColorStop(t, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  else tex.encoding = THREE.sRGBEncoding;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// Heuristic: apply a consistent “house” material feel to imported GLTF meshes
function pickMaterialForMesh(meshName){
  const n = String(meshName || '').toLowerCase();
  if (/\b(hardware|handle|knob|bar)\b/.test(n)) return 'metal';
  if (/\b(wall|body|shell)\b/.test(n)) return 'satin';
  return 'satin'; //catch all
}

export function createViewer(container, opts = {}) {
  const scene = new THREE.Scene();

  const axes = new THREE.AxesHelper(1);
  scene.add(axes);

  const grid = new THREE.GridHelper(10, 10, 0x334, 0x223);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.001, 10000);
  camera.position.set(2.5, 2.0, 2.5);

  // shared “house look” materials (kept from your old repo)
  const metalMat = new THREE.MeshPhysicalMaterial({
    color: 0xB08D57,
    metalness: 1.0,
    roughness: 0.38,
    envMapIntensity: 1.2,
    clearcoat: 0.01,
    clearcoatRoughness: 0.12,
    side: THREE.FrontSide,
  });

  const satinMat = new THREE.MeshStandardMaterial({
    color: 0x828282,
    metalness: 0.05,
    roughness: 0.7,
    side: THREE.FrontSide,
    envMapIntensity: 1.0
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);

  // Lighting (environment does most work)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(3, 4, 2);
  scene.add(dir);

  // Model root
  const group = new THREE.Group();
  scene.add(group);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = 1.1;
  controls.zoomSpeed = 1.8;
  controls.panSpeed = 1.4;
  controls.zoomToCursor = true;
  controls.screenSpacePanning = true;

  // Post-processing (optional bloom)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.8, 0.85);
  bloom.enabled = false;
  composer.addPass(bloom);

  // Environment (same knobs as old)
  async function setEnvironment({ mode = 'studio', hdrUrl = null, envIntensity = 3.0, background = 'gradient' } = {}) {
    let envTex = null;
    const pmrem = new THREE.PMREMGenerator(renderer);

    if (mode === 'room') {
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      envTex = envRT.texture;
    } else if (mode === 'hdr' && hdrUrl) {
      const hdr = await new RGBELoader().loadAsync(hdrUrl);
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const envRT = pmrem.fromEquirectangular(hdr);
      envTex = envRT.texture;
      hdr.dispose();
    } else {
      envTex = makeStudioEnv(renderer);
    }

    scene.environment = envTex;
    scene.background = (background === 'env') ? envTex : makeGradient();
    setEnvIntensity(scene, envIntensity);
    pmrem.dispose();
  }

  // init env immediately
  setEnvironment({
    mode: opts.env ?? 'hdr',
    hdrUrl: opts.hdrUrl ?? './royal_espl_1k.hdr',
    envIntensity: opts.envIntensity ?? 3.0,
    background: opts.background ?? 'gradient',
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  renderer.setAnimationLoop(() => {
    controls.update();
    if (bloom.enabled) composer.render();
    else renderer.render(scene, camera);
  });

  function setLoading(on) {
    container.classList.toggle('loading', !!on);
  }

  function clear() {
    while (group.children.length) {
      const obj = group.children.pop();
      obj.traverse(n => {
        n.geometry?.dispose?.();
        if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose?.());
      });
    }
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    group.scale.set(1, 1, 1);
  }

  function setGridVisible(show) {
    const v = !!show;
    grid.visible = v;
    axes.visible = v;
  }

  function fitToObject(obj3d) {
    const box = new THREE.Box3().setFromObject(obj3d);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    obj3d.position.sub(center);
    controls.target.set(0, 0, 0);

    const radius = 0.5 * size.length() || 1;
    camera.near = Math.max(0.01, radius / 100);
    camera.far  = radius * 20;
    camera.updateProjectionMatrix();

    const dist = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    camera.position.set(dist, dist * 0.7, dist * 1.2);
    camera.lookAt(0, 0, 0);
    controls.update();
  }

  // Load a GLTF/GLB and apply the “house” material style
  const gltfLoader = new GLTFLoader();
  // Draco (for GLB/GLTF with KHR_draco_mesh_compression)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/'); // or './draco/'
  dracoLoader.setWorkerLimit(Math.min(4, navigator.hardwareConcurrency || 4));
  gltfLoader.setDRACOLoader(dracoLoader);
  let lastUrl = null;

  async function loadModel(url, {
    fit = true,
    overrideMaterials = true, // set false if you want to keep gltf materials as-authored
  } = {}) {
    if (!url) throw new Error('loadModel(url) requires a url');
    if (url === lastUrl) return; // no-op

    lastUrl = url;
    clear();

    const gltf = await gltfLoader.loadAsync(url);
    const model = gltf.scene || gltf.scenes?.[0];
    if (!model) throw new Error(`No scene in glTF: ${url}`);

    // Apply consistent materials / env intensity
    model.traverse(o => {
      if (!o.isMesh) return;

      // normals (some exports omit them)
      if (o.geometry && !o.geometry.attributes.normal) {
        o.geometry.computeVertexNormals();
      }

      if (overrideMaterials) {
        const which = pickMaterialForMesh(o.name);
        o.material = (which === 'satin') ? satinMat : metalMat;
      }

      // ensure envMapIntensity consistent even if material is kept
      if (o.material && 'envMapIntensity' in o.material) {
        o.material.envMapIntensity = 1.2;
        o.material.needsUpdate = true;
      }
    });

    group.add(model);

    if (fit) fitToObject(group);
  }

  function setBloomEnabled(on, { strength = 0.4, radius = 0.8, threshold = 0.85 } = {}) {
    bloom.enabled = !!on;
    bloom.strength = strength;
    bloom.radius = radius;
    bloom.threshold = threshold;
  }

  function setToneExposure(exp = 1.25) {
    renderer.toneMappingExposure = exp;
  }

  return {
    setLoading,
    clear,
    loadModel,
    setEnvironment,
    setBloomEnabled,
    setToneExposure,
    setGridVisible,
  };
}
