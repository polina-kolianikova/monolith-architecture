import * as THREE from "./assets/vendor/three.module.js?v=ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb";

const $ = (s) => document.querySelector(s);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let floor = "all",
  daylight = 14,
  progress = 0,
  targetProgress = 0,
  dragAngle = 0,
  dragTarget = 0,
  activeChapter = -1,
  invalidate = () => {};
const levelNames = {
  all: "Whole house",
  living: "Living floor",
  roof: "Roof plane",
};
const levelDescriptions = {
  all: "The full composition brings living, terrace and roof together.",
  living:
    "A 156 m² open living floor, framed by deep glazing and a sheltered terrace.",
  roof: "The overhanging stone roof shades the glazing and carries the upper garden.",
};
const dialog = $("#project-dialog");
function openDialog() {
  updateSpec();
  dialog.showModal();
}
$("#open-project").addEventListener("click", openDialog);
$("#open-spec").addEventListener("click", openDialog);
$("#close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
function formatTime(value) {
  let h = Math.floor(value),
    m = Math.round((value - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function updateSpec() {
  $("#selected-floor").textContent = levelNames[floor];
  $("#selected-time").textContent = formatTime(daylight);
  $("#floor-description").textContent = levelDescriptions[floor];
}
document.querySelectorAll("[data-floor]").forEach((button) =>
  button.addEventListener("click", () => {
    floor = button.dataset.floor;
    document
      .querySelectorAll("[data-floor]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    updateSpec();
    invalidate();
  }),
);
$("#daylight").addEventListener("input", (e) => {
  daylight = Number(e.target.value);
  $("#time-output").textContent = formatTime(daylight);
  updateSpec();
  invalidate();
});
$("#save-spec").addEventListener("click", () => {
  const text = `MONOLITH\nStone House No. 01\nIndependent architectural concept, 2026\n\nBuilt area: 318 m², design study\nStructure: stone, concrete, glass\nSelected view: ${levelNames[floor]}\nSun study: ${formatTime(daylight)}\n${levelDescriptions[floor]}\n\nNo property is offered for sale.\nIndependent concept by BlackStack Studio.\n`;
  const a = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
  a.href = url;
  a.download = "monolith-stone-house-notes.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#save-feedback").textContent = "Your project notes have been saved.";
});
$("#orbit-turn").addEventListener("click", () => {
  dragTarget = dragTarget > 0.55 ? -0.5 : dragTarget + 0.35;
  invalidate();
});
// The control panel changes height with fonts, orientation and safe-area layout.
const modelControls = $(".model-controls");
const measureModelControls = () => {
  document.documentElement.style.setProperty(
    "--model-controls-height",
    `${Math.ceil(modelControls.getBoundingClientRect().height)}px`,
  );
};
new ResizeObserver(measureModelControls).observe(modelControls);
measureModelControls();

const chapters = [...document.querySelectorAll(".chapter")],
  links = [...document.querySelectorAll(".chapter-nav a")];
function scrollProgress() {
  let index = 0;
  while (
    index < chapters.length - 1 &&
    scrollY >= chapters[index + 1].offsetTop
  )
    index++;
  const start = chapters[index].offsetTop,
    end = chapters[index + 1]?.offsetTop ?? start + innerHeight;
  targetProgress = index + clamp((scrollY - start) / (end - start), 0, 1);
  const current = Math.min(3, Math.round(targetProgress));
  if (current !== activeChapter) {
    activeChapter = current;
    links.forEach((a, i) => {
      a.classList.toggle("active", i === current);
      if (i === current) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
    });
  }
}
addEventListener(
  "scroll",
  () => {
    scrollProgress();
    invalidate();
  },
  { passive: true },
);
scrollProgress();

let renderer,
  scene,
  camera,
  sun,
  ambient,
  house,
  roofGroup,
  livingGroup,
  groundGroup,
  pool,
  glassMaterial;
const host = $("#scene");
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 800 ? 1.15 : 1.5),
  );
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9e5da");
  scene.fog = new THREE.Fog("#e9e5da", 26, 65);
  camera = new THREE.PerspectiveCamera(
    35,
    host.clientWidth / host.clientHeight,
    0.1,
    160,
  );
  ambient = new THREE.HemisphereLight("#f7f9f0", "#7e8773", 2.4);
  scene.add(ambient);
  sun = new THREE.DirectionalLight("#fff1d4", 3.8);
  sun.position.set(-7, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00025;
  sun.shadow.radius = 3;
  scene.add(sun);
  const bounce = new THREE.DirectionalLight("#b9d3df", 1.2);
  bounce.position.set(9, 5, -7);
  scene.add(bounce);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 256;
  const tc = textureCanvas.getContext("2d");
  tc.fillStyle = "#cdc7b7";
  tc.fillRect(0, 0, 256, 256);
  let seed = 17;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 18000; i++) {
    const v = 150 + Math.floor(rnd() * 60);
    tc.fillStyle = `rgba(${v},${v},${v - 10},.12)`;
    tc.fillRect(rnd() * 256, rnd() * 256, rnd() * 2 + 0.3, rnd() * 1 + 0.3);
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  for (let band = 0; band < 32; band++) {
    tc.strokeStyle = `rgba(96,78,48,${0.02 + (band % 4) * 0.008})`;
    tc.lineWidth = 0.25 + (band % 3) * 0.3;
    tc.beginPath();
    for (let x = 0; x <= 256; x += 8) {
      const yy = band * 8 + Math.sin(x * 0.025 + band) * 1.3;
      x ? tc.lineTo(x, yy) : tc.moveTo(x, yy);
    }
    tc.stroke();
  }
  texture.needsUpdate = true;
  const stone = new THREE.MeshStandardMaterial({
    color: "#d4c4a5",
    roughness: 0.79,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.045,
  });
  const darkStone = new THREE.MeshStandardMaterial({
    color: "#95937f",
    roughness: 0.88,
    map: texture,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: "#866d4c",
    roughness: 0.78,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: "#343c34",
    metalness: 0.65,
    roughness: 0.4,
  });
  const leaf = new THREE.MeshStandardMaterial({
    color: "#748267",
    roughness: 0.95,
  });
  const leafLight = new THREE.MeshStandardMaterial({
    color: "#87916b",
    roughness: 1,
  });
  const cushion = new THREE.MeshStandardMaterial({
    color: "#e6ddc7",
    roughness: 1,
  });
  glassMaterial = new THREE.MeshPhysicalMaterial({
    color: "#a9bcb1",
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  function box(w, h, d, material, x, y, z, parent = house) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cylinder(radius, height, material, x, y, z, parent = house) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 16),
      material,
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  house = new THREE.Group();
  scene.add(house);
  groundGroup = new THREE.Group();
  house.add(groundGroup);
  livingGroup = new THREE.Group();
  house.add(livingGroup);
  roofGroup = new THREE.Group();
  house.add(roofGroup);
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: "#dfdccf", roughness: 1 }),
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.11;
  terrain.receiveShadow = true;
  scene.add(terrain);
  box(13, 0.2, 9, darkStone, 0, 0, 0, groundGroup);
  box(12.4, 0.28, 8.4, stone, 0, 0.2, 0, groundGroup);
  // Lower terrace, pool, stair and shadow gaps.
  box(9, 0.12, 2.3, wood, 1.05, 0.38, 3.6, groundGroup);
  for (let i = 0; i < 32; i++)
    box(
      0.018,
      0.009,
      2.25,
      darkStone,
      -3.25 + i * 0.275,
      0.447,
      3.6,
      groundGroup,
    );
  box(4.6, 0.2, 2.2, stone, -3.1, 0.29, -3.15, groundGroup);
  pool = box(
    4.25,
    0.035,
    1.85,
    new THREE.MeshPhysicalMaterial({
      color: "#8ab6b1",
      roughness: 0.18,
      metalness: 0.3,
      transparent: true,
      opacity: 0.78,
    }),
    -3.1,
    0.405,
    -3.15,
    groundGroup,
  );
  pool.castShadow = false;
  for (let i = 0; i < 5; i++)
    box(
      1.65,
      0.15,
      1,
      stone,
      -6.2 - i * 0.4,
      0.17 - i * 0.045,
      2.4,
      groundGroup,
    );
  // Ground floor enclosure, genuinely thick walls and independently layered roof.
  box(2.9, 2.7, 5.25, stone, -3.8, 1.71, -0.45, groundGroup);
  box(0.22, 2.7, 5.8, stone, 4.15, 1.71, -0.1, groundGroup);
  box(7.1, 2.6, 0.12, glassMaterial, 0.85, 1.7, 2.45, groundGroup);
  box(7.1, 2.6, 0.12, glassMaterial, 0.85, 1.7, -2.65, groundGroup);
  for (let x = -2.7; x < 4.3; x += 1.38) {
    box(0.05, 2.64, 0.11, metal, x, 1.72, 2.48, groundGroup);
    box(0.05, 2.64, 0.11, metal, x, 1.72, -2.68, groundGroup);
  }
  // Living furniture is readable when the planes separate.
  box(2.8, 0.36, 0.95, cushion, 0.7, 0.69, 0.8, groundGroup);
  box(2.8, 0.8, 0.24, cushion, 0.7, 1, 0.35, groundGroup);
  box(0.22, 0.52, 1.1, cushion, -0.75, 0.75, 0.82, groundGroup);
  box(0.22, 0.52, 1.1, cushion, 2.15, 0.75, 0.82, groundGroup);
  box(1.7, 0.12, 0.8, wood, 0.6, 0.59, 2, groundGroup);
  box(11, 0.24, 7.2, stone, 0, 3.17, -0.35, livingGroup);
  box(1.95, 2.45, 4.65, stone, -3.65, 4.51, -0.6, livingGroup);
  box(6.8, 2.4, 0.11, glassMaterial, 0.8, 4.52, 2.05, livingGroup);
  box(6.8, 2.4, 0.11, glassMaterial, 0.8, 4.52, -2.55, livingGroup);
  box(0.1, 2.4, 4.6, glassMaterial, 4.15, 4.52, -0.25, livingGroup);
  for (let x = -2.4; x < 4.2; x += 1.32) {
    box(0.045, 2.45, 0.1, metal, x, 4.53, 2.07, livingGroup);
    box(0.045, 2.45, 0.1, metal, x, 4.53, -2.58, livingGroup);
  }
  for (let i = 0; i < 14; i++)
    box(0.075, 2.48, 0.22, wood, -4.83 + i * 0.19, 4.53, 1.89, livingGroup);
  for (const [x, z] of [
    [4.35, 2.65],
    [4.35, -3.1],
    [-4.75, 2.65],
    [-4.75, -3.1],
  ])
    cylinder(0.085, 2.75, metal, x, 4.63, z, livingGroup);
  box(2.7, 0.25, 1.25, wood, 0.25, 3.55, -0.6, livingGroup);
  box(2.55, 0.13, 1.2, cushion, 0.25, 3.74, -0.6, livingGroup);
  box(0.2, 0.55, 1.28, cushion, -1.15, 3.85, -0.6, livingGroup);
  box(0.2, 0.55, 1.28, cushion, 1.65, 3.85, -0.6, livingGroup);
  box(2.8, 0.7, 0.18, cushion, 0.25, 4, -1.2, livingGroup);
  box(12, 0.3, 8.5, stone, 0, 5.95, -0.35, roofGroup);
  box(10.9, 0.05, 7.4, darkStone, 0, 6.125, -0.35, roofGroup);
  box(
    3.8,
    0.12,
    4.7,
    new THREE.MeshStandardMaterial({ color: "#8d9671", roughness: 1 }),
    -3,
    6.2,
    -0.55,
    roofGroup,
  );
  // Roof gravel, garden shrubs and tree trunks ground the building.
  for (let i = 0; i < 80; i++) {
    const pebble = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.04 + rnd() * 0.05, 0),
      stone,
    );
    pebble.position.set(-0.8 + rnd() * 5.8, 6.17, -3.5 + rnd() * 6.3);
    pebble.scale.y = 0.4;
    roofGroup.add(pebble);
  }
  function tree(x, z, s = 1) {
    cylinder(0.06 * s, 1.8 * s, wood, x, 0.9 * s, z, groundGroup);
    for (let j = 0; j < 6; j++) {
      const angle = (j / 6) * Math.PI * 2,
        a = new THREE.Vector3(x, 1.35 * s, z),
        b = new THREE.Vector3(
          x + Math.cos(angle) * 0.7 * s,
          2.25 * s + (j % 2) * 0.25 * s,
          z + Math.sin(angle) * 0.65 * s,
        ),
        branch = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015 * s, 0.034 * s, a.distanceTo(b), 6),
          wood,
        );
      branch.position.copy(a).add(b).multiplyScalar(0.5);
      branch.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.sub(a).normalize(),
      );
      branch.castShadow = true;
      groundGroup.add(branch);
    }
    for (let j = 0; j < 145; j++) {
      const a = rnd() * Math.PI * 2,
        r = Math.sqrt(rnd()),
        foliage = new THREE.Mesh(
          new THREE.SphereGeometry(0.075 * s, 5, 3),
          j % 3 ? leaf : leafLight,
        );
      foliage.position.set(
        x + Math.cos(a) * r * 1.05 * s,
        (1.8 + rnd() * 0.95) * s,
        z + Math.sin(a) * r * 0.85 * s,
      );
      foliage.scale.set(1.65, 0.16, 0.48);
      foliage.rotation.set(rnd() * 0.6, rnd() * Math.PI, rnd() * 0.7);
      foliage.castShadow = true;
      groundGroup.add(foliage);
    }
  }
  tree(-7.2, -4.3, 1.25);
  tree(6.1, -3.7, 0.95);
  tree(7, 2.9, 0.85);
  tree(0.5, -7.8, 1.05);
  tree(-3.7, -8.5, 0.9);
  for (let i = 0; i < 32; i++) {
    const x = -5.4 + rnd() * 1.5,
      z = -4.3 + rnd() * 7.5;
    const shrub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.18 + rnd() * 0.18, 1),
      leaf,
    );
    shrub.position.set(x, 0.49, z);
    shrub.scale.y = 0.6;
    shrub.castShadow = true;
    groundGroup.add(shrub);
  }
  const gardenBeds = [
    [-7, -1.4],
    [-6.8, -2.2],
    [6.9, -1.3],
    [6.4, -0.4],
  ];
  gardenBeds.forEach(([x, z]) => {
    box(1.3, 0.16, 1.3, darkStone, x, 0.02, z, groundGroup);
    for (let i = 0; i < 7; i++) {
      const shrub = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.18 + rnd() * 0.22, 1),
        leafLight,
      );
      shrub.position.set(x + (rnd() - 0.5), 0.22, z + (rnd() - 0.5));
      shrub.castShadow = true;
      groundGroup.add(shrub);
    }
  });
  const rug = box(
    5.7,
    0.018,
    3.4,
    new THREE.MeshStandardMaterial({ color: "#c7b798", roughness: 1 }),
    0.8,
    0.47,
    0.2,
    groundGroup,
  );
  rug.castShadow = false;
  cylinder(0.68, 0.09, darkStone, 1.1, 0.74, 1.6, groundGroup);
  cylinder(0.32, 0.22, wood, 1.1, 0.6, 1.6, groundGroup);
  const pendant = cylinder(0.5, 0.045, metal, 0.85, 2.7, -0.7, groundGroup);
  cylinder(0.012, 0.3, metal, 0.85, 2.89, -0.7, groundGroup);
  // Bake immutable submeshes by material and moving storey. The exploded floors remain separate.
  function batch(group) {
    const buckets = new Map();
    for (const child of [...group.children]) {
      if (!child.isMesh || child.material.transparent) continue;
      const list = buckets.get(child.material) || [];
      list.push(child);
      buckets.set(child.material, list);
    }
    for (const [material, meshes] of buckets) {
      if (meshes.length < 2) continue;
      const positions = [],
        normals = [],
        uvs = [],
        indices = [];
      let offset = 0;
      for (const mesh of meshes) {
        mesh.updateMatrix();
        const g = mesh.geometry.clone().applyMatrix4(mesh.matrix),
          p = g.attributes.position.array,
          n = g.attributes.normal.array,
          u = g.attributes.uv?.array;
        positions.push(...p);
        normals.push(...n);
        if (u) uvs.push(...u);
        else for (let i = 0; i < p.length / 3; i++) uvs.push(0, 0);
        if (g.index) for (const v of g.index.array) indices.push(offset + v);
        else for (let i = 0; i < p.length / 3; i++) indices.push(offset + i);
        offset += p.length / 3;
        g.dispose();
        group.remove(mesh);
        mesh.geometry.dispose();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(indices);
      const mesh = new THREE.Mesh(g, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  batch(groundGroup);
  batch(livingGroup);
  batch(roofGroup);
  let pointer = null;
  host.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    pointer = { x: e.clientX, angle: dragTarget };
    host.setPointerCapture(e.pointerId);
    host.style.cursor = "grabbing";
  });
  host.addEventListener("pointermove", (e) => {
    if (pointer) {
      dragTarget = clamp(
        pointer.angle + (e.clientX - pointer.x) * 0.003,
        -0.75,
        0.75,
      );
      invalidate();
    }
  });
  function release() {
    pointer = null;
    host.style.cursor = "grab";
  }
  host.addEventListener("pointerup", release);
  host.addEventListener("pointercancel", release);
  host.style.cursor = "grab";
  let quality = Math.min(devicePixelRatio, innerWidth < 800 ? 1.15 : 1.5),
    raf = 0,
    visible = true,
    previous = 0,
    frames = 0,
    lastSpread = -1,
    lastSun = -1,
    spread = 0,
    slow = 0;
  const diagnostics = (mode) => {
    const d = document.documentElement.dataset;
    d.renderFrames = String(frames);
    d.drawCalls = String(renderer.info.render.calls);
    d.triangles = String(renderer.info.render.triangles);
    d.renderDpr = String(renderer.getPixelRatio());
    d.renderMode = mode;
  };
  const resize = () => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    quality = Math.min(devicePixelRatio, innerWidth < 800 ? 1.15 : 1.5);
    renderer.setPixelRatio(quality);
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    scrollProgress();
    invalidate();
  };
  addEventListener("resize", resize);
  const poses = [
    { p: [19, 13, 23], l: [0, 2.6, 0], e: 0 },
    { p: [16, 13, 18], l: [0, 4.6, 0], e: 1 },
    { p: [0.8, 1.8, 1.65], l: [0.6, 1.4, -3.8], e: 0 },
    { p: [-17, 9, -18], l: [0, 2.5, 0], e: 0 },
  ];
  const modelBox = new THREE.Box3(),
    modelCorner = new THREE.Vector3();
  let phoneOffset = 0,
    phoneZoom = 1,
    phoneFraming = false;
  function screenBounds() {
    house.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    modelBox.setFromObject(house);
    let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
    for (let n = 0; n < 8; n++) {
      modelCorner.set(
        n & 1 ? modelBox.max.x : modelBox.min.x,
        n & 2 ? modelBox.max.y : modelBox.min.y,
        n & 4 ? modelBox.max.z : modelBox.min.z,
      ).project(camera);
      const x = (modelCorner.x + 1) * host.clientWidth * 0.5,
        y = (1 - modelCorner.y) * host.clientHeight * 0.5;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    return { top, bottom, left, right };
  }
  function framePhoneModel(d, weight) {
    camera.clearViewOffset();
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    phoneFraming = false;
    if (weight === 0) {
      phoneOffset = 0;
      phoneZoom = 1;
      renderer.domElement.style.opacity = "1";
      return;
    }
    const width = host.clientWidth,
      height = host.clientHeight,
      limitTop = $(".site-header").getBoundingClientRect().bottom + 16,
      limitBottom = $(".model-controls").getBoundingClientRect().top - 16;
    const reading = [...document.querySelectorAll(
      ".chapter-content,.hero-meta,.final footer",
    )].map((el) => el.getBoundingClientRect()).filter((rect) =>
      rect.bottom > limitTop && rect.top < limitBottom && rect.height > 0,
    ).sort((a, b) => a.top - b.top);
    const gaps = [];
    let edge = limitTop;
    for (const rect of reading) {
      if (rect.top - 16 > edge) gaps.push([edge, rect.top - 16]);
      edge = Math.max(edge, rect.bottom + 16);
    }
    if (edge < limitBottom) gaps.push([edge, limitBottom]);
    const base = screenBounds(),
      centre = (base.top + base.bottom) * 0.5;
    let best = [limitTop, limitTop], score = -Infinity;
    for (const gap of gaps) {
      const value = Math.min(gap[1] - gap[0], 380) - Math.abs((gap[0] + gap[1]) * 0.5 - centre) * 0.1;
      if (value > score) { best = gap; score = value; }
    }
    const available = Math.max(0, best[1] - best[0]),
      fit = Math.min(1, (width - 40) / (base.right - base.left), Math.max(65, available) / (base.bottom - base.top)),
      desiredZoom = mix(1, Math.max(0.18, fit), weight);
    camera.zoom = desiredZoom;
    camera.updateProjectionMatrix();
    const fitted = screenBounds(),
      desiredOffset = ((fitted.top + fitted.bottom) * 0.5 - (best[0] + best[1]) * 0.5) * weight;
    phoneZoom = frames === 0 ? desiredZoom : mix(phoneZoom, desiredZoom, d);
    phoneOffset = frames === 0 ? desiredOffset : mix(phoneOffset, desiredOffset, d);
    camera.zoom = phoneZoom;
    camera.setViewOffset(width, height, 0, phoneOffset, width, height);
    const actual = screenBounds();
    let overlap = 0;
    for (const rect of reading) overlap = Math.max(overlap,
      Math.max(0, Math.min(actual.bottom, rect.bottom + 12) - Math.max(actual.top, rect.top - 12)),
    );
    const opacity = mix(1, smooth(45, 95, available) * (1 - smooth(0, 38, overlap)), weight);
    renderer.domElement.style.opacity = String(opacity);
    phoneFraming = Math.abs(phoneZoom - desiredZoom) > 0.0002 || Math.abs(phoneOffset - desiredOffset) > 0.1;
    Object.assign(document.documentElement.dataset, {
      modelTop: actual.top.toFixed(2), modelBottom: actual.bottom.toFixed(2),
      modelOverlap: overlap.toFixed(2), modelOpacity: opacity.toFixed(4),
    });
  }
  const aColor = new THREE.Color("#ddd3c0"),
    bColor = new THREE.Color("#e9e5da");
  function frame(now) {
    raf = 0;
    if (document.hidden || !visible) {
      diagnostics(document.hidden ? "hidden" : "offscreen");
      return;
    }
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60;
    previous = now;
    const d = 1 - Math.exp(-9 * dt);
    progress = reduced.matches || innerWidth < 800
      ? targetProgress
      : mix(progress, targetProgress, d);
    dragAngle = mix(dragAngle, dragTarget, d);
    const mobile = innerWidth < 800,
      p = reduced.matches
        ? Math.round(clamp(progress, 0, 3))
        : clamp(progress, 0, 3),
      i = Math.min(2, Math.floor(p)),
      t = smooth(0, 1, p - i),
      a = poses[i],
      b = poses[i + 1];
    const targetSpread =
      floor === "all" ? mix(a.e, b.e, t) : floor === "roof" ? 1 : 0.72;
    spread = reduced.matches ? targetSpread : mix(spread, targetSpread, d);
    livingGroup.position.y = spread * 2.0;
    roofGroup.position.y = spread * 4.25;
    livingGroup.rotation.y = spread * 0.035;
    roofGroup.rotation.y = -spread * 0.055;
    let x = mix(a.p[0], b.p[0], t),
      y = mix(a.p[1], b.p[1], t),
      z = mix(a.p[2], b.p[2], t);
    const inside = smooth(1.6, 1.92, p) * (1 - smooth(2.1, 2.5, p)),
      lx = mix(a.l[0], b.l[0], t),
      ly = mix(a.l[1], b.l[1], t),
      lz = mix(a.l[2], b.l[2], t);
    const fit = mobile
      ? mix(Math.max(1.5, 1.07 / camera.aspect), 1, inside)
      : 1;
    if (mobile) {
      x = lx + (x - lx) * fit;
      y = ly + (y - ly) * fit;
      z = lz + (z - lz) * fit;
    }
    scene.fog.near = 26 * fit;
    scene.fog.far = 65 * fit;
    const cos = Math.cos(dragAngle * (1 - inside)),
      sin = Math.sin(dragAngle * (1 - inside));
    camera.position.set(x * cos + z * sin, y, z * cos - x * sin);
    camera.lookAt(lx, ly + (mobile ? 3 * fit * (1 - inside) : 0), lz);
    framePhoneModel(reduced.matches ? 1 : 1 - Math.exp(-30 * dt), mobile ? smooth(0.12, 0.28, targetProgress) * (1 - smooth(0.08, 0.35, inside)) : 0);
    const sunT = (daylight - 7) / 12;
    sun.position.set(mix(-12, 12, sunT), 3 + Math.sin(sunT * Math.PI) * 13, 7);
    sun.color.set(
      sunT > 0.78 ? "#ffbb77" : sunT < 0.18 ? "#ffd3a0" : "#fff2da",
    );
    sun.intensity = 2.1 + Math.sin(sunT * Math.PI) * 2;
    ambient.intensity = 1.65 + Math.sin(sunT * Math.PI) * 0.75;
    scene.background.copy(aColor).lerp(bColor, Math.sin(sunT * Math.PI));
    scene.fog.color.copy(scene.background);
    if (Math.abs(spread - lastSpread) > 0.012 || daylight !== lastSun) {
      renderer.shadowMap.needsUpdate = true;
      lastSpread = spread;
      lastSun = daylight;
    }
    const title = $(".architectural-title");
    title.style.transform = `translate3d(0,${-smooth(0, 0.7, p) * 130}px,0)`;
    title.style.opacity = String(1 - smooth(0.12, 0.7, p));
    document.body.dataset.space = inside > 0.5 ? "inside" : "outside";
    const start = performance.now();
    renderer.render(scene, camera);
    frames++;
    if (performance.now() - start > 24) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 12 && quality > 0.8) {
      quality = Math.max(0.8, quality - 0.15);
      renderer.setPixelRatio(quality);
      slow = 0;
    }
    const moving =
      Math.abs(progress - targetProgress) > 0.0003 ||
      Math.abs(dragAngle - dragTarget) > 0.0003 ||
      Math.abs(spread - targetSpread) > 0.0003 || phoneFraming;
    diagnostics(moving ? "active" : "idle");
    if (moving) raf = requestAnimationFrame(frame);
  }
  invalidate = () => {
    if (!raf && !document.hidden && visible) {
      previous = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
      diagnostics("offscreen");
    } else invalidate();
  }).observe($("#project"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      diagnostics("hidden");
    } else invalidate();
  });
  reduced.addEventListener("change", invalidate);
  invalidate();
  $("#loading").classList.add("done");
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    visible = false;
    diagnostics("offscreen");
    document.body.classList.add("no-webgl");
    $("#loading").classList.add("done");
  });
} catch (error) {
  document.body.classList.add("no-webgl");
  $("#loading").classList.add("done");
  $("#daylight").disabled = true;
  console.warn("Static architectural view enabled.", error.message);
}
