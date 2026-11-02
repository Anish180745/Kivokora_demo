/* ============================================================
   KIVOKORA — WebGL 3D backdrop (Three.js)
   A living flame core, orbit rings, floating 3D objects and a
   particle field that the camera flies through as you scroll.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const isHome = !!document.querySelector('.hero');

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

/* ---------- GLSL: 3D simplex noise (Ashima Arts, MIT) ---------- */
const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,140,80,0.85)');
  grd.addColorStop(0.25, 'rgba(255,91,31,0.4)');
  grd.addColorStop(0.6, 'rgba(201,62,0,0.1)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function init() {
  const canvas = document.createElement('canvas');
  canvas.id = 'scene3d';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    return;
  }
  document.documentElement.classList.add('has-3d');

  // size from the canvas box (100lvh on phones) so the URL bar never resizes the scene
  const viewW = () => canvas.clientWidth || window.innerWidth;
  const viewH = () => canvas.clientHeight || window.innerHeight;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(viewW(), viewH(), false);
  renderer.setClearColor(0x050403, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050403, 0.045);

  const camera = new THREE.PerspectiveCamera(42, viewW() / viewH(), 0.1, 120);
  camera.position.set(0, 0, 9);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  /* ---------- Lights (follow the camera down the page) ---------- */
  const lightRig = new THREE.Group();
  lightRig.add(new THREE.AmbientLight(0xffe6d5, 0.25));
  const key = new THREE.PointLight(0xff5b1f, 70, 40, 2);
  key.position.set(4, 3, 5);
  const rim = new THREE.PointLight(0xffb27a, 35, 40, 2);
  rim.position.set(-5, -2, 3);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(0, 4, 6);
  lightRig.add(key, rim, fill);
  scene.add(lightRig);

  /* ---------- Hero: flame core + halo + orbit rings ---------- */
  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  const coreUniforms = {
    uTime: { value: 0 },
    uAmp: { value: 1 },
    uColorA: { value: new THREE.Color(0x1a0600) },
    uColorB: { value: new THREE.Color(0xff5b1f) },
    uColorC: { value: new THREE.Color(0xffd2b0) },
    uBoost: { value: isMobile ? 0.9 : 1.0 },
    // phones: lean on the smooth sphere normal so the lower-poly core never looks faceted
    uFacet: { value: isMobile ? 0.25 : 1.0 }
  };
  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    extensions: { derivatives: true },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uAmp;
      varying vec3 vView;
      varying vec3 vNormal;
      varying float vDisp;
      ${NOISE}
      void main(){
        vec3 p = position;
        float n = snoise(p * 0.9 + vec3(uTime * 0.18)) * 0.28
                + snoise(p * 2.4 - vec3(uTime * 0.3)) * 0.07;
        n *= uAmp;
        vDisp = n;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(p + normal * n, 1.0);
        vView = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform float uTime;
      uniform float uBoost;
      uniform float uFacet;
      varying vec3 vView;
      varying vec3 vNormal;
      varying float vDisp;
      void main(){
        vec3 flatN = normalize(cross(dFdx(vView), dFdy(vView)));
        vec3 smoothN = normalize(vNormal);
        if (dot(flatN, smoothN) < 0.0) flatN = -flatN;
        vec3 N = normalize(mix(smoothN, flatN, uFacet));
        vec3 V = normalize(-vView);
        float fres = pow(1.0 - abs(dot(N, V)), 2.2);
        float heat = smoothstep(-0.25, 0.3, vDisp);
        vec3 col = mix(uColorA, uColorB * 0.3, heat * 0.55);
        col = mix(col, uColorB * 1.05 * uBoost, fres);
        col += uColorC * pow(fres, 4.0) * 0.7 * uBoost;
        float bands = sin(vDisp * 40.0 + uTime * 1.5) * 0.5 + 0.5;
        col += uColorB * bands * 0.06 * heat;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, isMobile ? 28 : 48), coreMat);
  heroGroup.add(core);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: isHome ? 0.3 : 0.22
  }));
  halo.scale.set(10, 10, 1);
  halo.position.z = -1.5;
  heroGroup.add(halo);

  const ringGroup = new THREE.Group();
  const moons = [];
  [[2.5, 1.15, 0.2], [3.1, -0.9, 0.6], [3.8, 0.4, -0.5]].forEach(([r, rx, ry], i) => {
    const ringColor = new THREE.Color(i === 1 ? 0xffb27a : 0xff5b1f).multiplyScalar(1.8);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.006 + i * 0.002, 6, 256),
      new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.55 - i * 0.12 })
    );
    ring.rotation.set(rx, ry, 0);
    const pivot = new THREE.Group();
    pivot.rotation.copy(ring.rotation);
    const spinner = new THREE.Group();
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + i * 0.02, 20, 20),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd2b0).multiplyScalar(2.5) })
    );
    moon.position.x = r;
    spinner.add(moon);
    spinner.rotation.z = i * 2.1;
    pivot.add(spinner);
    ringGroup.add(ring, pivot);
    moons.push({ spinner, speed: (0.35 + i * 0.12) * (i % 2 ? -1 : 1) });
  });
  heroGroup.add(ringGroup);

  if (isHome) {
    heroGroup.position.set(0, 0.1, 0);
    heroGroup.scale.setScalar(isMobile ? 0.62 : 1);
  } else {
    heroGroup.position.set(0, 0.4, -2.5);
    heroGroup.scale.setScalar(isMobile ? 0.55 : 0.68);
  }

  /* ---------- Floating 3D objects ---------- */
  const SHAPE_SPAN = 36;
  const geos = [
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.TorusKnotGeometry(0.34, 0.11, 160, 20),
    new THREE.IcosahedronGeometry(0.46, 0),
    new THREE.TorusGeometry(0.4, 0.14, 32, 72),
    new THREE.DodecahedronGeometry(0.42, 0),
    new THREE.CapsuleGeometry(0.2, 0.5, 8, 20),
    new THREE.SphereGeometry(0.36, 40, 40)
  ];
  const mats = [
    new THREE.MeshPhysicalMaterial({ color: 0xff5b1f, metalness: 0.25, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0x3a0d00 }),
    new THREE.MeshPhysicalMaterial({ color: 0x2a1f1a, metalness: 1, roughness: 0.2, clearcoat: 0.6 }),
    new THREE.MeshPhysicalMaterial({ color: 0xfff1e4, metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }),
    new THREE.MeshPhysicalMaterial({ color: 0xffb27a, metalness: 0.7, roughness: 0.22, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6 })
  ];
  const shapes = [];
  const shapeCount = isMobile ? 6 : 18;
  for (let i = 0; i < shapeCount; i++) {
    const mesh = new THREE.Mesh(geos[i % geos.length], mats[(i * 7 + 3) % mats.length]);
    const side = i % 2 ? 1 : -1;
    const x = side * (isMobile ? 1.3 + Math.random() * 1.8 : 3 + Math.random() * 5);
    const z = -1.5 - Math.random() * 6.5;
    mesh.scale.setScalar(0.6 + Math.random() * 0.75);
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    scene.add(mesh);
    shapes.push({
      mesh, x, z,
      baseY: 2.5 - (i / shapeCount) * SHAPE_SPAN + (Math.random() - 0.5) * 1.5,
      rx: (Math.random() - 0.5) * 0.6,
      ry: (Math.random() - 0.5) * 0.8,
      bob: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      depth: 1 + (z + 8) / 6
    });
  }

  /* ---------- Particle field ---------- */
  const P_SPAN = 60;
  const count = isMobile ? 600 : 4200;
  const pos = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 44;
    pos[i * 3 + 1] = (Math.random() - 0.5) * P_SPAN;
    pos[i * 3 + 2] = -25 + Math.random() * 29;
    scales[i] = Math.pow(Math.random(), 2) * 0.9 + 0.15;
    seeds[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const pUniforms = {
    uTime: { value: 0 },
    uCamY: { value: 0 },
    uSpan: { value: P_SPAN },
    uSize: { value: 60 * pixelRatio }
  };
  const points = new THREE.Points(pGeo, new THREE.ShaderMaterial({
    uniforms: pUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uCamY;
      uniform float uSpan;
      uniform float uSize;
      attribute float aScale;
      attribute float aSeed;
      varying float vAlpha;
      varying float vMix;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.2 + aSeed * 6.2831) * 0.3;
        p.x += cos(uTime * 0.15 + aSeed * 10.0) * 0.2;
        float rel = mod(p.y - uCamY + uSpan * 0.5, uSpan) - uSpan * 0.5;
        p.y = uCamY + rel;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aScale * uSize / -mv.z;
        vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 40.0));
        vMix = aSeed;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying float vAlpha;
      varying float vMix;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = pow(smoothstep(0.5, 0.0, d), 1.8);
        vec3 col = mix(vec3(1.0, 0.36, 0.12), vec3(1.0, 0.85, 0.7), step(0.72, vMix));
        gl_FragColor = vec4(col * 1.4, a * vAlpha);
        #include <colorspace_fragment>
      }`
  }));
  scene.add(points);

  /* ---------- Post-processing (bloom on desktop) ---------- */
  let composer = null;
  if (!isMobile) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.65, 0.28));
    composer.addPass(new OutputPass());
  }

  /* ---------- Input ---------- */
  const state = { mx: 0, my: 0, cmx: 0, cmy: 0, scrollY: window.scrollY, last: window.scrollY, vel: 0, camY: 0, hover: 0 };
  let worldPerPx = 0;
  function measure() {
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    worldPerPx = (visH / window.innerHeight) * 0.55;
  }
  measure();
  state.camY = -state.scrollY * worldPerPx;

  window.addEventListener('pointermove', (e) => {
    state.mx = (e.clientX / window.innerWidth) * 2 - 1;
    state.my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('scroll', () => {
    state.scrollY = window.scrollY;
    if (reduceMotion) requestRender();
  }, { passive: true });

  let resizeTimer;
  let lastW = viewW();
  let lastH = viewH();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = viewW();
      const h = viewH();
      if (w === lastW && h === lastH) return; // phone URL bar show/hide — nothing to do
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (composer) composer.setSize(w, h);
      measure();
      if (reduceMotion) requestRender();
    }, 120);
  });

  /* ---------- Loop ---------- */
  const clock = new THREE.Clock();
  let firstFrame = true;
  // phones render at ~30fps: smoother overall and far easier on the battery
  const minFrame = isMobile ? 1 / 30 : 0;
  let lastTick = 0;

  function frame(now) {
    if (minFrame && !reduceMotion && now !== undefined) {
      if ((now - lastTick) / 1000 < minFrame - 0.002) {
        requestAnimationFrame(frame);
        return;
      }
      lastTick = now;
    }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const ease = reduceMotion ? 1 : isMobile ? 0.16 : 0.08;

    state.cmx += (state.mx - state.cmx) * 0.05;
    state.cmy += (state.my - state.cmy) * 0.05;
    const v = state.scrollY - state.last;
    state.last = state.scrollY;
    state.vel += (v - state.vel) * 0.1;
    state.camY += (-state.scrollY * worldPerPx - state.camY) * ease;

    camera.position.x = state.cmx * 0.7;
    camera.position.y = state.camY - state.cmy * 0.45;
    camera.lookAt(0, state.camY, 0);
    lightRig.position.y = state.camY;

    // core reacts to the cursor approaching it and to scroll speed
    const d = Math.hypot(state.cmx, state.cmy * 0.8);
    state.hover += ((1 - Math.min(d * 1.4, 1)) - state.hover) * 0.05;
    coreUniforms.uTime.value = t;
    coreUniforms.uAmp.value = 0.85 + state.hover * 0.55 + Math.min(Math.abs(state.vel) * 0.01, 0.6);
    core.rotation.y += dt * (0.12 + Math.min(Math.abs(state.vel) * 0.004, 0.8));
    core.rotation.x = t * 0.05;
    ringGroup.rotation.z += dt * 0.05;
    ringGroup.rotation.x = state.cmy * 0.25;
    ringGroup.rotation.y = state.cmx * 0.35;
    moons.forEach((m) => { m.spinner.rotation.z += dt * m.speed; });
    heroGroup.visible = state.camY > -14;

    shapes.forEach((s) => {
      s.mesh.rotation.x += s.rx * dt;
      s.mesh.rotation.y += s.ry * dt;
      const y = s.baseY + Math.sin(t * s.bob + s.phase) * 0.25;
      let rel = y - state.camY;
      rel = (((rel + SHAPE_SPAN / 2) % SHAPE_SPAN) + SHAPE_SPAN) % SHAPE_SPAN - SHAPE_SPAN / 2;
      s.mesh.position.set(s.x + state.cmx * s.depth * 0.3, state.camY + rel, s.z);
    });

    pUniforms.uTime.value = t;
    pUniforms.uCamY.value = state.camY;
    points.rotation.y = state.cmx * 0.05;

    if (composer) composer.render();
    else renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('ready');
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  let pending = false;
  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; frame(); });
  }

  requestAnimationFrame(frame);
}

if (supportsWebGL()) init();
