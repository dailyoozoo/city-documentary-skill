/**
 * Shanghai 3D Historical Landscape & Documentary Engine (V6 R2)
 * Spatially Guided 6 Acts | 39 Shots | 78 Beats | 465.92s soundtrack
 * Full Procedural Architecture: Pitched-Roof Courtyards, City Wall, Yu Garden, Shiliupu Junks, The Bund, Shikumen, Pudong Supertalls
 */

let scene, camera, renderer, controls;
let cityGroup, globeGroup;
let ancientDeltaGroup, mingOldCityGroup, shiliupuGroup, bundClassicalGroup;
let shikumenGroup, redPulseGroup, shipyardGroup, laserScanGroup;
let buildingsData = [];
let buildingMeshes = [];
const dynamicBuildings = [];
const cmabData = window.CMAB_SHANGHAI_DATA || { buildings: [], waterways: [] };
let landmarkGroups = {};
let subtitlesData = [];
let currentTheme = 'cyan-gold';
let currentAttrMode = 'age';
let isPlayingDoc = false;
let isCinemaMode = false;
let audioElem;
let timelineSlider;
let raycaster, mouse;

const camCurrentPos = new THREE.Vector3(-850, 900, 1200);
const camCurrentTarget = new THREE.Vector3(-400, 50, 100);

const THEMES = {
  'cyan-gold':   { bg: 0x091628, fog: 0x091628, ambient: 0x4a6282, dirLight: 0xffeacc, water: 0x063452, ground: 0x08101d },
  'night-cyber': { bg: 0x04070f, fog: 0x04070f, ambient: 0x1e293b, dirLight: 0x00e5ff, water: 0x041628, ground: 0x050912 },
  'golden-hour': { bg: 0x181018, fog: 0x181018, ambient: 0x52382c, dirLight: 0xffb74d, water: 0x24151c, ground: 0x120c10 },
  'ink-wash':    { bg: 0x16191e, fog: 0x16191e, ambient: 0x3f444c, dirLight: 0xe2e8f0, water: 0x222831, ground: 0x111317 }
};

const CMAB_COLORS = {
  age: {
    'Pre-1843':  0xd97706,
    '1843-1949': 0xf59e0b,
    '1949-1978': 0x38bdf8,
    '1978-2000': 0x2dd4bf,
    '1990-2010': 0x00e5ff,
    'AF2010':    0x60a5fa
  },
  function: {
    'Office': 0x0284c7,
    'Commercial': 0xf59e0b,
    'Public Service': 0x8b5cf6,
    'Residential': 0x10b981,
    'Heritage/Cultural': 0xe11d48,
    'Other': 0x64748b
  },
  structure: {
    'Timber-Earth': 0xd97706,
    'Masonry-Stone': 0xf59e0b,
    'Steel-Concrete': 0x38bdf8,
    'Megastructure-Glass': 0x00e5ff
  }
};

// ==================== PROCEDURAL ARCHITECTURAL TEXTURES ====================
function createWindowFacadeTexture(baseHex, litHex, cols = 8, rows = 20) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = baseHex;
  g.fillRect(0, 0, 128, 256);

  const stepY = Math.floor(244 / rows);
  const stepX = Math.floor(116 / cols);
  for (let y = 6; y < 248; y += stepY) {
    g.fillStyle = 'rgba(0,0,0,0.26)';
    g.fillRect(0, y - 2, 128, 2);
    for (let x = 6; x < 120; x += stepX) {
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const frac = seed - Math.floor(seed);
      if (frac > 0.28) {
        g.fillStyle = litHex;
        g.globalAlpha = 0.42 + (frac - 0.28) * 0.75;
        g.fillRect(x, y, Math.max(4, stepX - 5), Math.max(3, stepY - 5));
      }
    }
  }
  g.globalAlpha = 1.0;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  return tex;
}

function createClassicalGraniteTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c4b39b';
  g.fillRect(0, 0, 256, 256);
  // Classical rusticated stone base & cornice band
  g.fillStyle = '#8c7a62';
  g.fillRect(0, 0, 256, 44);
  g.fillRect(0, 218, 256, 12);
  for (let y = 14; y < 244; y += 22) {
    g.fillStyle = 'rgba(45, 34, 22, 0.38)';
    g.fillRect(0, y, 256, 2);
    for (let x = 12; x < 244; x += 24) {
      g.fillStyle = '#d8cbb8';
      g.fillRect(x - 4, y + 2, 3, 18);
      g.fillStyle = '#291d12';
      g.fillRect(x + 2, y + 4, 11, 13);
      g.fillStyle = '#fbbf24';
      g.globalAlpha = 0.68;
      g.fillRect(x + 3, y + 5, 9, 11);
      g.globalAlpha = 1.0;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createShikumenBrickTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#64748b'; // Qing brick base
  g.fillRect(0, 0, 128, 128);
  // Alternating red-brick horizontal bands (清水青红砖)
  for (let y = 8; y < 128; y += 22) {
    g.fillStyle = '#9a3412';
    g.fillRect(0, y, 128, 7);
    for (let x = 12; x < 116; x += 28) {
      g.fillStyle = '#1e293b';
      g.fillRect(x, y + 8, 12, 11);
      g.fillStyle = '#fef08a';
      g.globalAlpha = 0.65;
      g.fillRect(x + 2, y + 10, 8, 7);
      g.globalAlpha = 1.0;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const GRANITE_TEX = createClassicalGraniteTexture();
const SHIKUMEN_TEX = createShikumenBrickTexture();

const ERA_MATERIALS = {
  'Pre-1843': new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, roughness: 0.72, metalness: 0.12,
    emissive: 0x332414, emissiveIntensity: 0.25
  }),
  '1843-1949': new THREE.MeshStandardMaterial({
    color: 0xe7d8c5, roughness: 0.42, metalness: 0.32,
    map: GRANITE_TEX,
    emissive: 0x5c3a18, emissiveIntensity: 0.28
  }),
  '1949-1978': new THREE.MeshStandardMaterial({
    color: 0x94a3b8, roughness: 0.48, metalness: 0.42,
    map: createWindowFacadeTexture('#334155', '#fde68a', 6, 14),
    emissive: 0x1e293b, emissiveIntensity: 0.25
  }),
  '1978-2000': new THREE.MeshStandardMaterial({
    color: 0x38bdf8, roughness: 0.32, metalness: 0.65,
    map: createWindowFacadeTexture('#164e63', '#bae6fd', 8, 18),
    emissive: 0x0c4a6e, emissiveIntensity: 0.30
  }),
  '1990-2010': new THREE.MeshStandardMaterial({
    color: 0x00e5ff, roughness: 0.22, metalness: 0.80,
    map: createWindowFacadeTexture('#0a3854', '#67e8f9', 8, 22),
    emissive: 0x083344, emissiveIntensity: 0.38
  }),
  'AF2010': new THREE.MeshStandardMaterial({
    color: 0x60a5fa, roughness: 0.16, metalness: 0.88,
    map: createWindowFacadeTexture('#0f2d52', '#bfdbfe', 10, 24),
    emissive: 0x1e3a8a, emissiveIntensity: 0.44
  })
};

// ==================== STAGE 1: COSMIC HIGH-DEFINITION SATELLITE EARTH & ATMOSPHERE ====================
function buildCosmicGlobe() {
  // Deep Space Starfield
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 2600; i++) {
    const r = 4500 + Math.random() * 8500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  globeGroup.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe2e8f0, size: 16, transparent: true, opacity: 0.85 })));

  // High-Definition NASA Blue Marble Satellite Earth with Luminous China & Yangtze River
  const texLoader = new THREE.TextureLoader();
  const earthTex = texLoader.load('images/earth_satellite_hd.jpg');
  earthTex.generateMipmaps = true;
  earthTex.minFilter = THREE.LinearMipmapLinearFilter;

  const globeGeo = new THREE.SphereGeometry(1200, 72, 72);
  const globeMat = new THREE.MeshStandardMaterial({
    map: earthTex,
    roughness: 0.52,
    metalness: 0.16,
    emissive: 0x071e36,
    emissiveIntensity: 0.38
  });
  const globeMesh = new THREE.Mesh(globeGeo, globeMat);

  // In Three.js SphereGeometry, uv.x = 0.5 is at lon=0 (+X axis).
  // For lon=121.5E (China/Shanghai) to face the +Z camera directly, rotate Y by -(90 + 121.5) deg = -211.5 deg!
  globeMesh.rotation.y = -211.5 * (Math.PI / 180);
  globeMesh.rotation.x = 0.18;
  globeGroup.add(globeMesh);

  // Soft Photorealistic Atmosphere Rim Halo
  const haloMesh = new THREE.Mesh(
    new THREE.RingGeometry(1204, 1315, 96),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.32 })
  );
  globeGroup.add(haloMesh);
}

// ==================== STAGE 2: 3D CITY GEOGRAPHY, ANCIENT DELTA & COMPLETE HISTORICAL ARCHITECTURE ====================
function build3DCityScene() {
  // 1. Base Landmass & East China Sea Horizon
  const groundGeo = new THREE.PlaneGeometry(32000, 32000);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d1b2a, roughness: 0.88, metalness: 0.15
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  cityGroup.add(ground);

  // Subtle Urban District Grid
  const grid = new THREE.GridHelper(10000, 100, 0x1e3a5f, 0x13263e);
  grid.position.y = 0.1;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  cityGroup.add(grid);

  // 2. Waterways: Huangpu River & Suzhou Creek (Vivid reflective water)
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x09527a,
    roughness: 0.12,
    metalness: 0.88,
    emissive: 0x063754,
    emissiveIntensity: 0.65
  });
  (cmabData.waterways || []).forEach(w => {
    const coords = w.coordinates;
    if (!coords || coords.length < 3) return;
    const shape = new THREE.Shape();
    shape.moveTo(coords[0][0], coords[0][1]);
    for (let i = 1; i < coords.length; i++) {
      shape.lineTo(coords[i][0], coords[i][1]);
    }
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), waterMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 1.0;
    cityGroup.add(mesh);
  });

  // Continuous Huangpu River S-Bend Main Channel + Glowing Navigation Centerline
  const riverCurvePts = [
    new THREE.Vector3(-580, 1.0, 2400),
    new THREE.Vector3(-640, 1.0, 1200),
    new THREE.Vector3(-730, 1.0, 780),
    new THREE.Vector3(-880, 1.0, 150),
    new THREE.Vector3(-890, 1.0, -350),
    new THREE.Vector3(-680, 1.0, -680),
    new THREE.Vector3(100, 1.0, -880),
    new THREE.Vector3(1400, 1.0, -1150)
  ];
  const riverCurve = new THREE.CatmullRomCurve3(riverCurvePts);
  const riverTube = new THREE.TubeGeometry(riverCurve, 96, 195, 12, false);
  riverTube.scale(1, 0.01, 1);
  const riverRibbon = new THREE.Mesh(riverTube, waterMat);
  riverRibbon.position.y = 0.8;
  cityGroup.add(riverRibbon);

  // Continuous Suzhou Creek (Wusong River) Channel from West into Huangpu River at Waibaidu Bridge (-1075, -675)
  const suzhouPts = [
    new THREE.Vector3(-2800, 1.0, -520),
    new THREE.Vector3(-2100, 1.0, -640),
    new THREE.Vector3(-1550, 1.0, -590),
    new THREE.Vector3(-1250, 1.0, -685),
    new THREE.Vector3(-920, 1.0, -660)
  ];
  const suzhouCurve = new THREE.CatmullRomCurve3(suzhouPts);
  const suzhouTube = new THREE.TubeGeometry(suzhouCurve, 64, 52, 10, false);
  suzhouTube.scale(1, 0.01, 1);
  const suzhouRibbon = new THREE.Mesh(suzhouTube, waterMat);
  suzhouRibbon.position.y = 0.9;
  cityGroup.add(suzhouRibbon);

  // Major Arterial Road Network (Nanjing Rd, Yan'an Rd, Century Ave) for clear spatial orientation
  const roadMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.28 });
  const roads = [
    // Nanjing Road (Bund West at z=-240 into Puxi)
    [new THREE.Vector3(-1210, 1.5, -240), new THREE.Vector3(-2400, 1.5, -180)],
    // Yan'an Road (Bund at z=40 west into Puxi)
    [new THREE.Vector3(-1180, 1.5, 40), new THREE.Vector3(-2400, 1.5, 120)],
    // Huaihai Road (Central Puxi)
    [new THREE.Vector3(-1350, 1.5, 280), new THREE.Vector3(-2400, 1.5, 340)],
    // Century Avenue in Pudong Lujiazui
    [new THREE.Vector3(-220, 1.5, -360), new THREE.Vector3(950, 1.5, 420)]
  ];
  roads.forEach(pair => {
    const rCurve = new THREE.CatmullRomCurve3(pair);
    const rGeo = new THREE.TubeGeometry(rCurve, 24, 9, 6, false);
    rGeo.scale(1, 0.05, 1);
    cityGroup.add(new THREE.Mesh(rGeo, roadMat));
  });

  // 3. Prologue: 6,000-Year Yangtze Delta Alluvial Land Accretion & Ancient Coastlines (ancientDeltaGroup)
  buildAncientDeltaCoastlines();

  // 4. Chapter 1: Ming/Qing Old Walled City (9-Li Wall, Moat, 6 Gate Towers, 220+ Jiangnan Courtyards, Yu Garden, Shiliupu)
  buildMingQingOldCityAndYuGarden();
  buildShiliupuWharfAndSandJunks();

  // 5. Chapter 2: The Bund Classical Granite Facades, Waibaidu Bridge & Puxi Shikumen Neighborhoods
  buildTheBundAndWaibaidu();
  buildShikumenAndXingyeRoad();

  // 6. Chapter 3 & 4: Jiangnan Shipyard, 10,000-Ton Freighter, Cross-River Bridge & Lujiazui Supertalls
  buildShipyardAndCrossRiverBridge();
  buildPudongSupertallLandmarks();

  // 7. Build Remaining CMAB/OSM Background Buildings (Filtering out footprints replaced by our high-detail architectural complexes!)
  const skipLandmarkKeys = new Set(['shanghai_tower', 'swfc', 'jin_mao', 'oriental_pearl']);
  (cmabData.buildings || []).forEach(b => {
    if (skipLandmarkKeys.has(b.landmark_key)) return;
    const poly = b.polygon;
    if (!poly || poly.length < 3) return;
    const cx = poly[0][0], cz = poly[0][1];

    // Suppress crude flat OSM blocks inside Yu Garden (-1266, 851) so the lotus pond & Huxinting are 100% unobstructed!
    const distYuGarden = Math.hypot(cx - (-1266), cz - 851);
    if (distYuGarden < 175) return;

    // Suppress crude OSM blocks overlapping our bespoke Bund landmarks (Peace Hotel, Customs House, HSBC)
    if (cx > -1310 && cx < -1140 && cz > -340 && cz < 40) return;

    // Suppress crude OSM blocks overlapping First CPC Congress site (-1620, 320)
    if (Math.hypot(cx - (-1620), cz - 320) < 95) return;

    const shape = new THREE.Shape();
    shape.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      shape.lineTo(poly[i][0], poly[i][1]);
    }

    // Authentic height calibration: Pre-1843 buildings inside Old City are 1-2 story traditional buildings (7-12m), never tall flat boxes!
    let h = Math.max(8, b.height);
    if (b.age === 'Pre-1843') {
      h = Math.min(11, Math.max(6.5, h * 0.45));
    }

    const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    geom.rotateX(Math.PI / 2);
    geom.translate(0, h, 0);

    const mat = ERA_MATERIALS[b.age] || ERA_MATERIALS['1990-2010'];
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0;
    mesh.userData = b;
    cityGroup.add(mesh);
    dynamicBuildings.push(mesh);

    if (h >= 18) {
      const edges = new THREE.EdgesGeometry(geom, 28);
      const lineMat = new THREE.LineBasicMaterial({
        color: b.age === '1843-1949' ? 0xfde68a : 0x38bdf8,
        transparent: true,
        opacity: 0.28
      });
      mesh.add(new THREE.LineSegments(edges, lineMat));
    }
  });
}

function buildAncientDeltaCoastlines() {
  // Terraced Alluvial Land Slabs showing 6,000 years of coastline progression from West (-1800) to East (+600)
  const strata = [
    { xMin: -2800, xMax: -1450, color: 0x14332a, ribbonColor: 0xf59e0b, label: '公元前4000年 · 冈身古海岸' },
    { xMin: -1450, xMax: -850,  color: 0x163e32, ribbonColor: 0x10b981, label: '秦汉时期 · 沙冈海岸线' },
    { xMin: -850,  xMax: -200,  color: 0x194739, ribbonColor: 0x38bdf8, label: '唐宋时期 · 捍海塘海岸线' },
    { xMin: -200,  xMax: 650,   color: 0x1b4d3e, ribbonColor: 0x00e5ff, label: '明清至近代 · 东海冲积平原' }
  ];
  strata.forEach((st, idx) => {
    const w = st.xMax - st.xMin;
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(w, 3.5, 4200),
      new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.85, transparent: true, opacity: 0.72 })
    );
    slab.position.set((st.xMin + st.xMax) * 0.5, 1.5, 0);
    slab.name = 'landStratum_' + idx;
    ancientDeltaGroup.add(slab);

    // Glowing shoreline ridge curve along st.xMax
    const cPts = [
      new THREE.Vector3(st.xMax - 120, 6, -2000),
      new THREE.Vector3(st.xMax + 80,  6, -600),
      new THREE.Vector3(st.xMax + 140, 6, 700),
      new THREE.Vector3(st.xMax - 60,  6, 2000)
    ];
    const cCurve = new THREE.CatmullRomCurve3(cPts);
    const cMesh = new THREE.Mesh(
      new THREE.TubeGeometry(cCurve, 56, 10, 8, false),
      new THREE.MeshBasicMaterial({ color: st.ribbonColor })
    );
    ancientDeltaGroup.add(cMesh);
  });

  // East China Sea Shimmering Water Plane on the East side (x > 650)
  const seaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3600, 4600),
    new THREE.MeshStandardMaterial({ color: 0x063b5e, roughness: 0.15, metalness: 0.85, emissive: 0x042842, emissiveIntensity: 0.6 })
  );
  seaMesh.rotation.x = -Math.PI / 2;
  seaMesh.position.set(2200, 2.2, 0);
  ancientDeltaGroup.add(seaMesh);
}

// Helper to build a traditional Chinese pitched-roof courtyard house (白墙黛瓦硬山/歇山顶古建 + 金色屋脊)
const RIDGE_GOLD_MAT = new THREE.MeshBasicMaterial({ color: 0xd97706 });
function createJiangnanHouseMesh(w, d, wallH, roofH, wallMat, roofMat) {
  const grp = new THREE.Group();
  // Whitewashed / brick wall body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
  body.position.y = wallH * 0.5;
  grp.add(body);

  // Pitched dark-grey tile roof
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-w * 0.58, 0);
  roofShape.lineTo(w * 0.58, 0);
  roofShape.lineTo(0, roofH);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: d * 1.14, bevelEnabled: false });
  roofGeo.translate(0, 0, -d * 0.57);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = wallH;
  grp.add(roofMesh);

  // Traditional Chinese Roof Ridge Beam (黛瓦屋脊线)
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, d * 1.16), RIDGE_GOLD_MAT);
  ridge.position.y = wallH + roofH;
  grp.add(ridge);

  return grp;
}

function buildMingQingOldCityAndYuGarden() {
  const cx = -1320, cz = 950, wallRadius = 520;

  // 1. Outer Circular Moat (环城护城河)
  const moatGeo = new THREE.RingGeometry(wallRadius + 8, wallRadius + 38, 72);
  const moatMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9, roughness: 0.15, metalness: 0.85, emissive: 0x0369a1, emissiveIntensity: 0.55, side: THREE.DoubleSide
  });
  const moatMesh = new THREE.Mesh(moatGeo, moatMat);
  moatMesh.rotation.x = -Math.PI / 2;
  moatMesh.position.set(cx, 1.6, cz);
  mingOldCityGroup.add(moatMesh);

  // 2. 9-Li Circular Grey-Brick Ming City Wall with Crenellations (九里青砖古城墙与雉堞垛口)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, roughness: 0.65, metalness: 0.25,
    emissive: 0x334155, emissiveIntensity: 0.35, side: THREE.DoubleSide
  });
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(wallRadius, wallRadius + 10, 16, 72, 1, true), wallMat);
  outerWall.position.set(cx, 8, cz);
  mingOldCityGroup.add(outerWall);

  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(wallRadius - 12, wallRadius - 14, 15, 72, 1, true), wallMat);
  innerWall.position.set(cx, 7.5, cz);
  mingOldCityGroup.add(innerWall);

  // Top Walkway & Golden Battlement Rim
  const walkway = new THREE.Mesh(
    new THREE.RingGeometry(wallRadius - 12, wallRadius, 72),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, side: THREE.DoubleSide })
  );
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.set(cx, 15.8, cz);
  mingOldCityGroup.add(walkway);

  const wallRim = new THREE.Mesh(
    new THREE.TorusGeometry(wallRadius, 2.2, 8, 72),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
  );
  wallRim.rotation.x = Math.PI / 2;
  wallRim.position.set(cx, 16.5, cz);
  mingOldCityGroup.add(wallRim);

  // 3. Six Double-Eaved Xieshan Gate Towers (六座重檐歇山顶飞檐城门楼 + 护城河石桥)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, emissive: 0x450a0a, emissiveIntensity: 0.45 });
  const tileRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.35, emissive: 0x0f172a, emissiveIntensity: 0.4 });
  const goldTrimMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  for (let g = 0; g < 6; g++) {
    const ang = (g * Math.PI * 2) / 6; // g=0 is Great East Gate (朝宗门/大东门) at (-800, 950) facing Shiliupu!
    const gx = cx + Math.cos(ang) * wallRadius;
    const gz = cz + Math.sin(ang) * wallRadius;

    const gateGrp = new THREE.Group();
    gateGrp.position.set(gx, 0, gz);
    gateGrp.rotation.y = -ang + Math.PI / 2;

    // Stone Fortress Base (城台)
    const base = new THREE.Mesh(new THREE.BoxGeometry(44, 18, 26), wallMat);
    base.position.y = 9;
    gateGrp.add(base);

    // Arched Gate Tunnel Highlight
    const arch = new THREE.Mesh(new THREE.BoxGeometry(12, 11, 28), new THREE.MeshBasicMaterial({ color: 0xfde68a }));
    arch.position.y = 5.5;
    gateGrp.add(arch);

    // 1st Tier Vermilion Timber Hall
    const hall1 = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 18), pillarMat);
    hall1.position.y = 22.5;
    gateGrp.add(hall1);

    // 1st Tier Upturned Eave Roof
    const eave1 = new THREE.Mesh(new THREE.ConeGeometry(28, 7, 4), tileRoofMat);
    eave1.position.y = 29;
    eave1.rotation.y = Math.PI / 4;
    eave1.scale.set(1.35, 1, 0.85);
    gateGrp.add(eave1);

    // 2nd Tier Hall & Top Xieshan Roof with Golden Ridge
    const hall2 = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 13), pillarMat);
    hall2.position.y = 33;
    gateGrp.add(hall2);

    const eave2 = new THREE.Mesh(new THREE.ConeGeometry(22, 8.5, 4), tileRoofMat);
    eave2.position.y = 39.5;
    eave2.rotation.y = Math.PI / 4;
    eave2.scale.set(1.3, 1, 0.82);
    gateGrp.add(eave2);

    const ridgeBar = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 1.8), goldTrimMat);
    ridgeBar.position.y = 43.2;
    gateGrp.add(ridgeBar);

    // Stone Bridge across the Moat outside each gate
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 36), wallMat);
    bridge.position.set(0, 2.2, 24);
    gateGrp.add(bridge);

    mingOldCityGroup.add(gateGrp);
  }

  // 4. Fill the Old Walled City with 220+ Authentic White-Walled, Dark-Tiled Jiangnan Courtyard Houses (粉墙黛瓦街巷院落群)
  const whiteWallMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, roughness: 0.78, metalness: 0.05, emissive: 0x334155, emissiveIntensity: 0.18
  });
  const darkTileMat = new THREE.MeshStandardMaterial({
    color: 0x18202c, roughness: 0.88, metalness: 0.06, emissive: 0x090d14, emissiveIntensity: 0.25
  });

  let seed = 1337;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  for (let gx = cx - 440; gx <= cx + 440; gx += 46) {
    for (let gz = cz - 440; gz <= cz + 440; gz += 42) {
      const distCenter = Math.hypot(gx - cx, gz - cz);
      if (distCenter > wallRadius - 42) continue;
      // Leave open space for Yu Garden in the Northeast Quadrant (-1266, 851)!
      if (Math.hypot(gx - (-1266), gz - 851) < 135) continue;
      // Leave main cross-axis avenues (大东门-老西门大街 & 大南门-老北门大街)
      if (Math.abs(gz - cz) < 18 || Math.abs(gx - cx) < 18) continue;

      const hw = 18 + rand() * 14;
      const hd = 14 + rand() * 10;
      const wallH = 6.5 + rand() * 4.5;
      const roofH = 4.2 + rand() * 2.5;
      const house = createJiangnanHouseMesh(hw, hd, wallH, roofH, whiteWallMat, darkTileMat);
      house.position.set(gx + (rand() - 0.5) * 8, 0, gz + (rand() - 0.5) * 8);
      house.rotation.y = rand() > 0.25 ? 0 : Math.PI / 2;
      house.userData = { birth_year: 1292 + Math.floor(rand() * 320) };
      cityGroup.add(house);
      dynamicBuildings.push(house);
    }
  }

  // 5. Complete Yu Garden Classical Garden Complex at Northeast Quadrant (-1266, 851), birth_year: 1559
  const yyGroup = new THREE.Group();
  yyGroup.position.set(-1266, 0, 851);

  // 5a. Emerald Lotus Pond with Carved White Stone Balustrade Coping (荷花池与汉白玉池岸)
  const pondRing = new THREE.Mesh(
    new THREE.CylinderGeometry(74, 76, 2.6, 48),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
  );
  pondRing.position.y = 1.3;
  yyGroup.add(pondRing);

  const pondWater = new THREE.Mesh(
    new THREE.CylinderGeometry(71, 71, 2.9, 48),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.85, emissive: 0x0369a1, emissiveIntensity: 0.65 })
  );
  pondWater.position.y = 1.35;
  yyGroup.add(pondWater);

  // 5b. True 9-Segment Vermilion Zigzag Bridge (九曲朱栏桥) across the Lotus Pond
  const bridgePts = [
    [-48, -42], [-34, -26], [-18, -34], [-6, -14], [0, 0],
    [14, 12], [6, 28], [24, 38], [38, 26], [54, 42]
  ];
  const deckStoneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const redRailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const goldPostMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  for (let i = 0; i < bridgePts.length - 1; i++) {
    const [x0, z0] = bridgePts[i];
    const [x1, z1] = bridgePts[i + 1];
    const segLen = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(x1 - x0, z1 - z0);
    const segGrp = new THREE.Group();
    segGrp.position.set((x0 + x1) * 0.5, 4.2, (z0 + z1) * 0.5);
    segGrp.rotation.y = ang;

    // White stone bridge deck
    segGrp.add(new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, segLen + 1.5), deckStoneMat));
    // Left & Right Vermilion Railings (朱红栏杆)
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, segLen + 1.2), redRailMat);
    railL.position.set(-2.3, 1.5, 0);
    segGrp.add(railL);
    const railR = railL.clone();
    railR.position.set(2.3, 1.5, 0);
    segGrp.add(railR);

    // Stone Pier in water
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 4.2, 12), deckStoneMat);
    pier.position.set(0, -1.8, segLen * 0.4);
    segGrp.add(pier);

    // Glowing Golden Lantern Post at each bend
    const post = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), goldPostMat);
    post.position.set(2.3, 3.0, segLen * 0.45);
    segGrp.add(post);

    yyGroup.add(segGrp);
  }

  // 5c. Octagonal Double-Eaved Huxinting Teahouse Pavilion (湖心亭：八角重檐攒尖顶 + 飞檐翘角) at center (0, 0)
  const hxtGrp = new THREE.Group();
  hxtGrp.position.set(0, 3.2, 0);

  // White Marble Platform
  const hxtBase = new THREE.Mesh(new THREE.CylinderGeometry(17, 18.5, 3.2, 8), deckStoneMat);
  hxtBase.position.y = 1.6;
  hxtGrp.add(hxtBase);

  // 8 Vermilion Columns & Carved Wooden Lattice Body
  const hxtBody = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 13.5, 11, 8), pillarMat);
  hxtBody.position.y = 8.5;
  hxtGrp.add(hxtBody);

  // Warm Illuminated Interior Windows
  const hxtWin = new THREE.Mesh(
    new THREE.CylinderGeometry(12.8, 12.8, 5.5, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  hxtWin.position.y = 8.5;
  hxtGrp.add(hxtWin);

  // Lower Octagonal Upturned Eave Roof + 8 Flying Corner Spurs (八角飞檐翘角)
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(23, 7.5, 8), darkTileMat);
  roof1.position.y = 16.5;
  hxtGrp.add(roof1);

  for (let k = 0; k < 8; k++) {
    const ka = (k * Math.PI * 2) / 8 + Math.PI / 8;
    const spur = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 9), goldTrimMat);
    spur.position.set(Math.cos(ka) * 19, 14.5, Math.sin(ka) * 19);
    spur.rotation.y = -ka + Math.PI / 2;
    spur.rotation.x = -0.38; // Upturned flying eave!
    hxtGrp.add(spur);
  }

  // Upper Story & Second Octagonal Eave Roof
  const hxtUpper = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 6.5, 8), pillarMat);
  hxtUpper.position.y = 21.5;
  hxtGrp.add(hxtUpper);

  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(16.5, 7.5, 8), darkTileMat);
  roof2.position.y = 27.5;
  hxtGrp.add(roof2);

  for (let k = 0; k < 8; k++) {
    const ka = (k * Math.PI * 2) / 8 + Math.PI / 8;
    const spur2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 6.5), goldTrimMat);
    spur2.position.set(Math.cos(ka) * 13.5, 25.5, Math.sin(ka) * 13.5);
    spur2.rotation.y = -ka + Math.PI / 2;
    spur2.rotation.x = -0.42;
    hxtGrp.add(spur2);
  }

  // Golden Gourd Finial (攒尖宝顶)
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 2.2, 5.5, 12), goldTrimMat);
  finial.position.y = 33;
  hxtGrp.add(finial);
  yyGroup.add(hxtGrp);

  // 5d. Surrounding Classical Waterside Pavilions, Galleries & Great Rockery (四周白墙黛瓦水榭游廊与黄石大假山)
  const pavConfigs = [
    { x: -82, z: 0,   w: 22, d: 58, h: 11, rh: 7, ry: 0 },          // West Gallery (荷风四面亭游廊)
    { x: 0,   z: -84, w: 64, d: 24, h: 13, rh: 8.5, ry: 0 },        // North Grand Hall (三穗堂/仰山堂)
    { x: 84,  z: -12, w: 24, d: 62, h: 12, rh: 7.5, ry: 0 },        // East Hall (得月楼/绿波廊)
    { x: -64, z: 68,  w: 38, d: 22, h: 10, rh: 6.5, ry: 0.35 }      // South Entrance Pavilion
  ];
  pavConfigs.forEach(pc => {
    const pMesh = createJiangnanHouseMesh(pc.w, pc.d, pc.h, pc.rh, whiteWallMat, darkTileMat);
    pMesh.position.set(pc.x, 0, pc.z);
    pMesh.rotation.y = pc.ry;
    yyGroup.add(pMesh);
  });

  // Yellow-Stone Great Rockery (14m High Yu Garden Great Rockery 大假山 &翠竹林) at Northwest of Pond (-58, -68)
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b6356, roughness: 0.92, metalness: 0.08, emissive: 0x292524, emissiveIntensity: 0.28 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, emissive: 0x064e3b, emissiveIntensity: 0.35 });
  for (let r = 0; r < 9; r++) {
    const rMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(7 + (r % 3) * 3.5, 1), rockMat);
    rMesh.position.set(-64 + (r % 3) * 11, 5 + Math.floor(r / 3) * 4.5, -72 + (r % 2) * 10);
    yyGroup.add(rMesh);
  }
  for (let b = 0; b < 6; b++) {
    const tree = new THREE.Mesh(new THREE.ConeGeometry(5.5, 12, 7), bambooMat);
    tree.position.set(-76 + b * 9, 8, -58 + (b % 2) * 14);
    yyGroup.add(tree);
  }
  const rockPav = createJiangnanHouseMesh(12, 12, 7, 5.5, pillarMat, darkTileMat);
  rockPav.position.set(-55, 16, -68);
  yyGroup.add(rockPav);

  yyGroup.userData = { birth_year: 1559 };
  cityGroup.add(yyGroup);
  landmarkGroups.yuyuan = yyGroup;
}

function buildShiliupuWharfAndSandJunks() {
  // Located just outside the Great East Gate (-800, 950) along the West Bank of the Huangpu River (-720 to -600, z = 650 to 1120)
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3410, roughness: 0.78, metalness: 0.1, emissive: 0x291104, emissiveIntensity: 0.28 });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.65, emissive: 0x78350f, emissiveIntensity: 0.25, side: THREE.DoubleSide });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.75 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.85 });

  // 1. 7 Timber Pier Jetties (十六铺木栈埠头) extending into the Huangpu River + Riverside Guild Warehouses
  for (let i = 0; i < 7; i++) {
    const pz = 680 + i * 68;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(58, 3.2, 12), woodMat);
    pier.position.set(-705, 3.0, pz);
    shiliupuGroup.add(pier);

    // Riverside Merchant Guild Warehouse (临江商行货栈)
    const wh = createJiangnanHouseMesh(28, 38, 10, 6, wallMat, roofMat);
    wh.position.set(-755, 0, pz);
    shiliupuGroup.add(wh);
  }

  // 2. Fleet of 18 Traditional Three-Masted Chinese Sand Junks (三桅平底沙船帆樯群)
  for (let j = 0; j < 18; j++) {
    const junk = new THREE.Group();
    const row = j % 3;
    const col = Math.floor(j / 3);
    const jx = -655 + row * 48 + (col % 2) * 16;
    const jz = 640 + col * 88;
    junk.position.set(jx, 2.0, jz);
    junk.rotation.y = (j % 2 === 0 ? 0.08 : -0.08);

    // Wooden flat-bottomed hull with raised stern
    const hull = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 34), woodMat);
    hull.position.y = 2.2;
    junk.add(hull);
    const stern = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 10), woodMat);
    stern.position.set(0, 5.5, -11);
    junk.add(stern);

    // 3 Masts & Traditional Battened Lug Sails (帆樯如林)
    const mastZ = [-8, 2, 11];
    const mastH = [18, 26, 16];
    for (let m = 0; m < 3; m++) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, mastH[m], 8), woodMat);
      mast.position.set(0, mastH[m] * 0.5 + 3, mastZ[m]);
      junk.add(mast);

      const sail = new THREE.Mesh(new THREE.PlaneGeometry(9.5, mastH[m] * 0.72), sailMat);
      sail.position.set(0.5, mastH[m] * 0.55 + 4, mastZ[m]);
      sail.rotation.y = Math.PI * 0.42;
      junk.add(sail);
    }
    shiliupuGroup.add(junk);
  }
}

function buildTheBundAndWaibaidu() {
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22, emissive: 0x334155, emissiveIntensity: 0.35 });
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0xe7d8c5, map: GRANITE_TEX, roughness: 0.38, metalness: 0.28, emissive: 0x5c3a18, emissiveIntensity: 0.3 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.35, metalness: 0.2, emissive: 0x785028, emissiveIntensity: 0.3 });
  const copperGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.28, metalness: 0.75, emissive: 0x047857, emissiveIntensity: 0.55 });
  const goldGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // 1. Waibaidu Twin-Span Steel Through-Truss Bridge at (-1075, -675), birth_year: 1907
  const wbGroup = new THREE.Group();
  wbGroup.position.set(-1075, 0, -675);
  wbGroup.rotation.y = 0.15;

  // Bridge Deck & Central Stone Pier
  const deck = new THREE.Mesh(new THREE.BoxGeometry(24, 3.2, 116), steelMat);
  deck.position.y = 13;
  wbGroup.add(deck);

  for (let pz of [-54, 0, 54]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(28, 13, 8), pillarMat);
    pier.position.set(0, 6.5, pz);
    wbGroup.add(pier);
  }

  // Twin Parabolic Top-Chord Steel Trusses + Vertical & Diagonal Web Members
  for (let spanZ of [-27, 27]) {
    for (let sideX of [-10.5, 10.5]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(26, 1.6, 8, 24, Math.PI), steelMat);
      arch.position.set(sideX, 13.5, spanZ);
      arch.rotation.y = Math.PI / 2;
      wbGroup.add(arch);

      // Vertical truss posts
      for (let dz = -20; dz <= 20; dz += 8) {
        const postH = Math.max(4, Math.sqrt(Math.max(0, 26 * 26 - dz * dz)));
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, postH, 6), steelMat);
        post.position.set(sideX, 13.5 + postH * 0.5, spanZ + dz);
        wbGroup.add(post);
      }
    }
    // Overhead cross-bracing beams
    for (let dz = -12; dz <= 12; dz += 12) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(21, 1.2, 1.2), steelMat);
      cross.position.set(0, 35, spanZ + dz);
      wbGroup.add(cross);
    }
  }
  wbGroup.userData = { birth_year: 1907 };
  cityGroup.add(wbGroup);
  landmarkGroups.waibaidu = wbGroup;

  // 2. Peace Hotel (Sassoon House, 1929) at (-1258, -292) — Art Deco Stepped Granite Tower + Octagonal Emerald Pyramid Roof
  const phGroup = new THREE.Group();
  phGroup.position.set(-1258, 0, -292);
  const phBase = new THREE.Mesh(new THREE.BoxGeometry(64, 54, 52), graniteMat);
  phBase.position.y = 27;
  phGroup.add(phBase);
  const phMid = new THREE.Mesh(new THREE.BoxGeometry(44, 22, 42), graniteMat);
  phMid.position.y = 65;
  phGroup.add(phMid);
  const phDrum = new THREE.Mesh(new THREE.CylinderGeometry(15, 16, 12, 8), pillarMat);
  phDrum.position.y = 82;
  phGroup.add(phDrum);
  const phPyramid = new THREE.Mesh(new THREE.ConeGeometry(17, 24, 8), copperGreenMat);
  phPyramid.position.y = 100;
  phGroup.add(phPyramid);
  phGroup.userData = { birth_year: 1929 };
  cityGroup.add(phGroup);
  landmarkGroups.peace_hotel = phGroup;

  // 3. Customs House (江海关大楼, 1927) at (-1197, -70) — Greek Doric Portico + Stepped Clock Tower + 4 Glowing Clock Faces
  const chGroup = new THREE.Group();
  chGroup.position.set(-1197, 0, -70);
  const chMain = new THREE.Mesh(new THREE.BoxGeometry(58, 44, 48), graniteMat);
  chMain.position.y = 22;
  chGroup.add(chMain);

  // Greek Doric Entrance Colonnade on East Riverfront Face (+X)
  for (let cz = -16; cz <= 16; cz += 8) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 26, 12), pillarMat);
    col.position.set(30, 14, cz);
    chGroup.add(col);
  }
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(22, 9, 4), pillarMat);
  pediment.position.set(29, 31, 0);
  pediment.rotation.y = Math.PI / 4;
  pediment.scale.set(0.4, 1, 1.2);
  chGroup.add(pediment);

  // Stepped Clock Tower Shaft (y = 44 to 92)
  const chTowerShaft = new THREE.Mesh(new THREE.BoxGeometry(22, 42, 22), pillarMat);
  chTowerShaft.position.set(12, 65, 0);
  chGroup.add(chTowerShaft);

  // 4 Glowing Circular Clock Faces ("Big Ching" 大钟)
  const clockDialGeo = new THREE.CylinderGeometry(7.5, 7.5, 24, 24);
  const clockEW = new THREE.Mesh(clockDialGeo, goldGlowMat);
  clockEW.rotation.z = Math.PI / 2;
  clockEW.position.set(12, 76, 0);
  chGroup.add(clockEW);
  const clockNS = new THREE.Mesh(clockDialGeo, goldGlowMat);
  clockNS.rotation.x = Math.PI / 2;
  clockNS.position.set(12, 76, 0);
  chGroup.add(clockNS);

  // Copper Cupola & Flagpole
  const chCupola = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12), copperGreenMat);
  chCupola.position.set(12, 88, 0);
  chGroup.add(chCupola);
  chGroup.userData = { birth_year: 1927 };
  cityGroup.add(chGroup);
  landmarkGroups.customs_house = chGroup;

  // 4. HSBC Building (汇丰银行大楼, 1923) at (-1190, -15) — Tripartite Granite Facade + 6 Corinthian Columns + Grand Roman Dome
  const hsbcGroup = new THREE.Group();
  hsbcGroup.position.set(-1190, 0, -15);
  const hsbcBody = new THREE.Mesh(new THREE.BoxGeometry(56, 38, 62), graniteMat);
  hsbcBody.position.y = 19;
  hsbcGroup.add(hsbcBody);

  // 6 Corinthian Columns on East Facade
  for (let cz = -20; cz <= 20; cz += 8) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 22, 12), pillarMat);
    col.position.set(29, 22, cz);
    hsbcGroup.add(col);
  }
  // Roman Pantheon Stepped Drum & Hemispherical Dome
  const domeDrum = new THREE.Mesh(new THREE.CylinderGeometry(19, 21, 10, 24), pillarMat);
  domeDrum.position.set(4, 43, 0);
  hsbcGroup.add(domeDrum);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(18, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6, emissive: 0x92400e, emissiveIntensity: 0.5 })
  );
  dome.position.set(4, 47, 0);
  hsbcGroup.add(dome);
  hsbcGroup.userData = { birth_year: 1923 };
  cityGroup.add(hsbcGroup);
  landmarkGroups.hsbc = hsbcGroup;

  // 5. Bund Promenade & 14 Additional Neoclassical Waterfront Edifices along the Bund Arc
  const bundZPositions = [-580, -520, -460, -400, -345, -230, -175, -125, 45, 105, 165, 225, 285, 345];
  bundZPositions.forEach((bz, idx) => {
    const bx = -1180 - Math.sin((bz + 200) * 0.0015) * 45;
    const bh = 34 + (idx % 4) * 8;
    const bw = 38 + (idx % 3) * 6;
    const bGrp = new THREE.Group();
    bGrp.position.set(bx, 0, bz);
    const bMain = new THREE.Mesh(new THREE.BoxGeometry(44, bh, bw), graniteMat);
    bMain.position.y = bh * 0.5;
    bGrp.add(bMain);
    // Classical rooftop cornice & cupola/pediment
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(46, 3, bw + 2), pillarMat);
    cornice.position.y = bh + 1.5;
    bGrp.add(cornice);
    if (idx % 2 === 0) {
      const topDome = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), copperGreenMat);
      topDome.position.set(12, bh + 3, 0);
      bGrp.add(topDome);
    }
    bGrp.userData = { birth_year: 1905 + idx * 2 };
    cityGroup.add(bGrp);
    dynamicBuildings.push(bGrp);
  });
}

function buildShikumenAndXingyeRoad() {
  // 1. 120+ Pitched-Roof Red-and-Grey Brick Shikumen Townhouse Rows across Inland Puxi (x = -1780 to -1420, z = -180 to +460)
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1, map: SHIKUMEN_TEX, roughness: 0.62, metalness: 0.15, emissive: 0x3b1d11, emissiveIntensity: 0.28
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x334155, roughness: 0.55, metalness: 0.25, emissive: 0x0f172a, emissiveIntensity: 0.35
  });
  const archMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, emissive: 0x64748b, emissiveIntensity: 0.3 });

  for (let rx = -1760; rx <= -1420; rx += 54) {
    for (let rz = -160; rz <= 460; rz += 34) {
      if (Math.hypot(rx - (-1620), rz - 320) < 75) continue; // Keep First CPC Congress courtyard clear
      const rowHouse = createJiangnanHouseMesh(42, 16, 11, 5.2, brickMat, roofMat);
      rowHouse.position.set(rx, 0, rz);
      // Add Shikumen Stone Gate Arch (石库门头) on the lane entrance
      const gateArch = new THREE.Mesh(new THREE.BoxGeometry(4.5, 7.5, 18), archMat);
      gateArch.position.set(18, 3.8, 0);
      rowHouse.add(gateArch);
      rowHouse.userData = { birth_year: 1912 + ((Math.abs(rx + rz)) % 22) };
      cityGroup.add(rowHouse);
      dynamicBuildings.push(rowHouse);
    }
  }

  // 2. High-Detail First CPC Congress Site (中共一大会址石库门: 76 Xingye Road at [-1620, 320], birth_year: 1920)
  const cpcGroup = new THREE.Group();
  cpcGroup.position.set(-1620, 0, 320);

  // 3-Bay Shikumen Brick Main Building with Pitched Tile Roof
  const cpcMain = createJiangnanHouseMesh(46, 24, 14, 6.5, brickMat, roofMat);
  cpcGroup.add(cpcMain);

  // Red-Brick Pilasters & 3 Carved Baroque Stone-Gate Arches with Black-Lacquered Doors (三开间雕花石库门头与乌漆铜环大门)
  const redBrickMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0x7f1d1d, emissiveIntensity: 0.55 });
  const blackDoorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.5 });
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  for (let bx of [-14, 0, 14]) {
    // Stone Gate Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(7.2, 8.8, 2.2), archMat);
    frame.position.set(bx, 4.4, 12.2);
    cpcGroup.add(frame);
    // Semicircular Baroque Pediment (半圆雕花山花门楣)
    const tympanum = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 2.4, 16, 1, false, 0, Math.PI), archMat);
    tympanum.rotation.x = Math.PI / 2;
    tympanum.rotation.z = -Math.PI / 2;
    tympanum.position.set(bx, 8.8, 12.2);
    cpcGroup.add(tympanum);
    // Black-lacquered timber double door
    const door = new THREE.Mesh(new THREE.BoxGeometry(5.2, 7.6, 2.5), blackDoorMat);
    door.position.set(bx, 3.8, 12.2);
    cpcGroup.add(door);
    // Brass door knockers
    const knocker = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.18, 8, 16), goldMat);
    knocker.position.set(bx, 4.2, 13.6);
    cpcGroup.add(knocker);
  }
  for (let px of [-21, -7, 7, 21]) {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(2.6, 14, 2.0), redBrickMat);
    pilaster.position.set(px, 7, 12.1);
    cpcGroup.add(pilaster);
  }
  cpcGroup.userData = { birth_year: 1920 };
  cityGroup.add(cpcGroup);
  landmarkGroups.cpc_site = cpcGroup;

  // Expanding Golden-Crimson Dawn Rings at 76 Xingye Road
  for (let r = 0; r < 3; r++) {
    const rMesh = new THREE.Mesh(
      new THREE.RingGeometry(24 + r * 55, 31 + r * 55, 48),
      new THREE.MeshBasicMaterial({ color: r === 0 ? 0xef4444 : 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(-1620, 3.5 + r, 320);
    rMesh.name = 'redRing_' + r;
    redPulseGroup.add(rMesh);
  }
}

function buildShipyardAndCrossRiverBridge() {
  // 1. Jiangnan Shipyard Gantry Cranes, Workshops & 10,000-Ton Ocean Freighter at (-860, 520)
  const craneRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.3, emissive: 0x7f1d1d, emissiveIntensity: 0.5 });
  const craneWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.3 });
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.3, emissive: 0x172554, emissiveIntensity: 0.45 });

  // 2 Giant Shipyard Gantry Cranes (巨型龙门吊)
  for (let cz of [480, 580]) {
    const crane = new THREE.Group();
    crane.position.set(-860, 0, cz);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(5, 82, 8), craneRedMat);
    legL.position.set(-38, 41, 0);
    crane.add(legL);
    const legR = legL.clone();
    legR.position.set(38, 41, 0);
    crane.add(legR);
    const girder = new THREE.Mesh(new THREE.BoxGeometry(92, 9, 10), craneRedMat);
    girder.position.set(0, 84, 0);
    crane.add(girder);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(93, 3, 10.5), craneWhiteMat);
    stripe.position.set(0, 84, 0);
    crane.add(stripe);
    crane.userData = { birth_year: 1958 };
    cityGroup.add(crane);
    landmarkGroups['gantry_' + cz] = crane;
  }

  // 140m 10,000-Ton Ocean Freighter ("风庆轮/东风号" 万吨远洋巨轮) on the Huangpu River
  const ship = new THREE.Group();
  ship.position.set(-760, 2, 420);
  ship.name = 'oceanFreighter';
  const shipHull = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 130), hullMat);
  shipHull.position.y = 7;
  ship.add(shipHull);
  const deckRed = new THREE.Mesh(new THREE.BoxGeometry(23, 2, 128), craneRedMat);
  deckRed.position.y = 14.5;
  ship.add(deckRed);
  const bridgeHouse = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 26), craneWhiteMat);
  bridgeHouse.position.set(0, 23, -32);
  ship.add(bridgeHouse);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.2, 12, 16), craneRedMat);
  funnel.position.set(0, 36, -36);
  ship.add(funnel);
  ship.userData = { birth_year: 1965 };
  cityGroup.add(ship);
  landmarkGroups.freighter = ship;

  // 2. Cross-River Cable-Stayed Bridge (跨江斜拉索大桥, birth_year: 1991) at z = 620 spanning Huangpu River
  const brGroup = new THREE.Group();
  brGroup.position.set(-660, 0, 620);
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.2, emissive: 0x38bdf8, emissiveIntensity: 0.35 });
  const cableMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.75 });

  // Bridge Highway Deck spanning East-West across Huangpu River
  const hwDeck = new THREE.Mesh(new THREE.BoxGeometry(580, 4.5, 26), pylonMat);
  hwDeck.position.set(0, 46, 0);
  brGroup.add(hwDeck);

  // Two H-Shaped Towers at x = -160 and x = +160
  for (let px of [-160, 160]) {
    for (let pz of [-11, 11]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(7, 135, 5), pylonMat);
      col.position.set(px, 67.5, pz);
      brGroup.add(col);
    }
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 24), pylonMat);
    crossBar.position.set(px, 115, 0);
    brGroup.add(crossBar);

    // Fan Stay Cables
    const cablePts = [];
    for (let d = 25; d <= 135; d += 22) {
      cablePts.push(new THREE.Vector3(px, 128, -10), new THREE.Vector3(px - d, 48, -10));
      cablePts.push(new THREE.Vector3(px, 128, -10), new THREE.Vector3(px + d, 48, -10));
      cablePts.push(new THREE.Vector3(px, 128, 10),  new THREE.Vector3(px - d, 48, 10));
      cablePts.push(new THREE.Vector3(px, 128, 10),  new THREE.Vector3(px + d, 48, 10));
    }
    const cGeo = new THREE.BufferGeometry().setFromPoints(cablePts);
    brGroup.add(new THREE.LineSegments(cGeo, cableMat));
  }
  brGroup.userData = { birth_year: 1991 };
  cityGroup.add(brGroup);
  landmarkGroups.cross_bridge = brGroup;

  // Laser Scan Curtain for 1990 Pudong Awakening
  const laserMesh = new THREE.Mesh(
    new THREE.BoxGeometry(18, 720, 2800),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 })
  );
  laserMesh.position.set(0, 360, 0);
  laserMesh.name = 'laserCurtain';
  laserScanGroup.add(laserMesh);
}

function buildPudongSupertallLandmarks() {
  // 1. Oriental Pearl Tower (-260.3, -433.8), height 468m, birth_year: 1994
  const opGroup = new THREE.Group();
  opGroup.position.set(-260.3, 0, -433.8);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, metalness: 0.78, roughness: 0.18, emissive: 0x9f1239, emissiveIntensity: 0.58
  });
  const colMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, metalness: 0.85, roughness: 0.2, emissive: 0x1e293b, emissiveIntensity: 0.35
  });
  const opBase = new THREE.Mesh(new THREE.CylinderGeometry(42, 52, 22, 32), colMat);
  opBase.position.y = 11;
  opGroup.add(opBase);
  for (let a = 0; a < 3; a++) {
    const ang = (a * 2 * Math.PI) / 3;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 340, 16), colMat);
    tube.position.set(Math.cos(ang) * 11, 170, Math.sin(ang) * 11);
    opGroup.add(tube);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5.5, 115, 12), colMat);
    strut.position.set(Math.cos(ang) * 28, 52, Math.sin(ang) * 28);
    strut.rotation.z = Math.cos(ang) * 0.28;
    strut.rotation.x = -Math.sin(ang) * 0.28;
    opGroup.add(strut);
  }
  const sp1 = new THREE.Mesh(new THREE.SphereGeometry(28, 36, 36), sphereMat);
  sp1.position.y = 105;
  opGroup.add(sp1);
  for (let p = 0; p < 5; p++) {
    const sm = new THREE.Mesh(new THREE.SphereGeometry(7.5, 20, 20), sphereMat);
    sm.position.y = 152 + p * 21;
    opGroup.add(sm);
  }
  const sp2 = new THREE.Mesh(new THREE.SphereGeometry(21, 36, 36), sphereMat);
  sp2.position.y = 275;
  opGroup.add(sp2);
  const sp3 = new THREE.Mesh(new THREE.SphereGeometry(10.5, 24, 24), sphereMat);
  sp3.position.y = 350;
  opGroup.add(sp3);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3.8, 118, 16), colMat);
  spire.position.y = 409;
  opGroup.add(spire);
  opGroup.userData = { birth_year: 1994 };
  cityGroup.add(opGroup);
  landmarkGroups.oriental_pearl = opGroup;

  // 2. Jin Mao Tower (323.0, 82.0), height 420.5m, birth_year: 1999
  const jmGroup = new THREE.Group();
  jmGroup.position.set(323.0, 0, 82.0);
  const jmMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, metalness: 0.85, roughness: 0.2,
    map: createWindowFacadeTexture('#452707', '#fef08a', 8, 20),
    emissive: 0x78350f, emissiveIntensity: 0.38
  });
  const tiers = 16;
  for (let k = 0; k < tiers; k++) {
    const w = 48 - k * 2.1;
    const th = 385 / tiers;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, th, w), jmMat);
    seg.position.y = k * th + th / 2;
    jmGroup.add(seg);
  }
  const jmCrown = new THREE.Mesh(new THREE.ConeGeometry(12, 36, 4), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  jmCrown.position.y = 403;
  jmCrown.rotation.y = Math.PI / 4;
  jmGroup.add(jmCrown);
  jmGroup.userData = { birth_year: 1999 };
  cityGroup.add(jmGroup);
  landmarkGroups.jin_mao = jmGroup;

  // 3. SWFC (475.3, 156.8), height 492m, birth_year: 2008
  const swfcGroup = new THREE.Group();
  swfcGroup.position.set(475.3, 0, 156.8);
  const swfcMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, metalness: 0.9, roughness: 0.14,
    map: createWindowFacadeTexture('#0b2948', '#bae6fd', 8, 22),
    emissive: 0x0c4a6e, emissiveIntensity: 0.42
  });
  const swfcBase = new THREE.Mesh(new THREE.BoxGeometry(56, 420, 56), swfcMat);
  swfcBase.position.y = 210;
  swfcGroup.add(swfcBase);
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(14, 72, 54), swfcMat);
  leftPillar.position.set(-21, 456, 0);
  swfcGroup.add(leftPillar);
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(14, 72, 54), swfcMat);
  rightPillar.position.set(21, 456, 0);
  swfcGroup.add(rightPillar);
  const skyBridge = new THREE.Mesh(new THREE.BoxGeometry(56, 12, 56), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
  skyBridge.position.y = 486;
  swfcGroup.add(skyBridge);
  swfcGroup.userData = { birth_year: 2008 };
  cityGroup.add(swfcGroup);
  landmarkGroups.swfc = swfcGroup;

  // 4. Shanghai Tower (311.1, 268.0), height 632m, birth_year: 2015
  const stGroup = new THREE.Group();
  stGroup.position.set(311.1, 0, 268.0);
  const stMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff, metalness: 0.92, roughness: 0.12,
    map: createWindowFacadeTexture('#062c43', '#67e8f9', 10, 24),
    emissive: 0x083344, emissiveIntensity: 0.52
  });
  const stZones = 12;
  for (let i = 0; i < stZones; i++) {
    const r1 = 46 - i * 2.5;
    const r2 = 46 - (i + 1) * 2.5;
    const zh = 632 / stZones;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, zh - 1.5, 9), stMat);
    cyl.position.y = i * zh + zh / 2;
    cyl.rotation.y = (i * (Math.PI * 2 / 3)) / stZones;
    stGroup.add(cyl);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r2 + 0.8, 1.2, 8, 36), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = (i + 1) * zh;
    stGroup.add(ring);
  }
  stGroup.userData = { birth_year: 2015 };
  cityGroup.add(stGroup);
  landmarkGroups.shanghai_tower = stGroup;
}

// ==================== CONTINUOUS SPATIAL CAMERA CHOREOGRAPHY (39 PARENT SHOTS) ====================
// Every transition is spatially continuous: Macro Anchoring -> Smooth Glide -> Micro Complete Architectural Form!
const PARENT_SHOT_CAMERA = {
  // Prologue: Cosmic Globe -> China & Yangtze -> Delta & 6000yr Coastline -> Two Rivers -> 1292 County
  s01_cosmic_globe_china:             { p0: [0, 14320, 4100], t0: [0, 14000, 0],     p1: [40, 14260, 2600], t1: [20, 14120, 1000] },
  s02_china_yangtze_basin:            { p0: [40, 14260, 2600], t0: [20, 14120, 1000], p1: [60, 14210, 1620], t1: [30, 14160, 1180] },
  s03_delta_coastline_6000yr:         { p0: [350, 2400, 2200], t0: [-450, 0, 100],   p1: [-250, 1450, 1550], t1: [-650, 0, 120] },
  s04_chunshen_wusong_origin:         { p0: [-250, 1450, 1550], t0: [-650, 0, 120],  p1: [-520, 560, 180],   t1: [-1075, 15, -520] },
  s05_huangpu_s_bend_capture:         { p0: [-520, 560, 180],   t0: [-1075, 15, -520], p1: [-380, 580, 1180], t1: [-920, 15, 480] },
  s06_yuan_1292_county_seat:          { p0: [-380, 580, 1180],  t0: [-920, 15, 480],  p1: [-780, 320, 1380], t1: [-1320, 18, 950] },
  s07_cotton_port_town_rise:          { p0: [-780, 320, 1380],  t0: [-1320, 18, 950], p1: [-620, 420, 1480], t1: [-1180, 20, 920] },

  // Chapter 1: Old Walled City Macro -> 9-Li Wall & 6 Gates -> Dive into Yu Garden NE -> Huxinting & 9-Turn Bridge -> Fly over East Gate -> Shiliupu Wharf -> Grand Vista
  s08_ch1_oldcity_macro_anchor:       { p0: [-620, 420, 1480],  t0: [-1180, 20, 920], p1: [-580, 620, 1580], t1: [-1150, 22, 920] },
  s09_ming_wall_gates_panorama:       { p0: [-580, 620, 1580],  t0: [-1150, 22, 920], p1: [-820, 340, 1360], t1: [-1320, 24, 950] },
  s10_oldcity_dive_to_yuyuan_ne:      { p0: [-820, 340, 1360],  t0: [-1320, 24, 950], p1: [-1110, 82, 985],  t1: [-1266, 16, 851] },
  s11_yuyuan_bridge_pavilion_detail:  { p0: [-1110, 82, 985],   t0: [-1266, 16, 851], p1: [-1155, 46, 755],  t1: [-1266, 15, 851] },
  s12_fly_over_east_gate_to_shiliupu: { p0: [-1155, 46, 755],   t0: [-1266, 15, 851], p1: [-520, 125, 1040], t1: [-740, 18, 880] },
  s13_shiliupu_wharf_junks_closeup:   { p0: [-520, 125, 1040],  t0: [-740, 18, 880],  p1: [-460, 95, 720],   t1: [-710, 16, 840] },
  s14_oldcity_and_river_grand_vista:  { p0: [-460, 95, 720],    t0: [-710, 16, 840],  p1: [-380, 380, 1180], t1: [-1120, 24, 890] },

  // Chapter 2: North along Huangpu -> Waibaidu Steel Bridge -> Bund Classical Corridor -> Peace Hotel & Customs Clock -> HSBC Dome -> West into Shikumen Lanes -> Nanjing Rd
  s15_ch2_north_along_huangpu_to_bund:{ p0: [-380, 380, 1180],  t0: [-1120, 24, 890], p1: [-640, 230, -320], t1: [-1140, 35, -520] },
  s16_waibaidu_bridge_confluence:     { p0: [-640, 230, -320],  t0: [-1140, 35, -520],p1: [-850, 68, -540],  t1: [-1075, 22, -675] },
  s17_bund_neoclassical_corridor:     { p0: [-850, 68, -540],   t0: [-1075, 22, -675],p1: [-780, 125, -180], t1: [-1210, 46, -200] },
  s18_peace_hotel_and_customs_clock:  { p0: [-780, 125, -180],  t0: [-1210, 46, -200],p1: [-940, 82, -55],   t1: [-1210, 62, -140] },
  s19_hsbc_classical_dome_closeup:    { p0: [-940, 82, -55],    t0: [-1210, 62, -140],p1: [-930, 74, 65],    t1: [-1190, 44, -15] },
  s20_west_into_shikumen_lanes:       { p0: [-930, 74, 65],     t0: [-1190, 44, -15], p1: [-1280, 95, 180],  t1: [-1560, 20, 120] },
  s21_nanjing_road_haipai_vista:      { p0: [-1280, 95, 180],   t0: [-1560, 20, 120], p1: [-1140, 210, -60], t1: [-1480, 28, -180] },

  // Chapter 3: Puxi Shikumen Grid -> 76 Xingye Rd First CPC Congress -> 1949 Dawn -> Jiangnan Shipyard Cranes -> 10,000-Ton Freighter -> Pre-1990 Puxi vs Pudong
  s22_ch3_puxi_shikumen_to_xingye:    { p0: [-1140, 210, -60],  t0: [-1480, 28, -180],p1: [-1360, 135, 480], t1: [-1620, 20, 320] },
  s23_xingye_rd_76_shikumen_closeup:  { p0: [-1360, 135, 480],  t0: [-1620, 20, 320], p1: [-1520, 36, 415],  t1: [-1620, 12, 320] },
  s24_1949_dawn_citywide_rebirth:     { p0: [-1520, 36, 415],   t0: [-1620, 12, 320], p1: [-780, 360, 560],  t1: [-1320, 32, 220] },
  s25_jiangnan_shipyard_gantry_cranes:{ p0: [-780, 360, 560],   t0: [-1320, 32, 220], p1: [-520, 125, 680],  t1: [-860, 38, 530] },
  s26_ocean_freighter_sailing_huangpu:{ p0: [-520, 125, 680],   t0: [-860, 38, 530],  p1: [-520, 95, 340],   t1: [-760, 22, 380] },
  s27_puxi_vs_pudong_pre1990_contrast:{ p0: [-520, 95, 340],    t0: [-760, 22, 380],  p1: [-780, 480, 260],  t1: [-120, 35, 40] },

  // Chapter 4: Cross Huangpu to Pudong -> Cross-River Bridge & Avenues -> Oriental Pearl -> Jin Mao -> SWFC -> Shanghai Tower -> Both Banks Panorama
  s28_ch4_cross_huangpu_to_pudong:    { p0: [-780, 480, 260],   t0: [-120, 35, 40],   p1: [-340, 360, 340],  t1: [260, 90, 80] },
  s29_river_bridges_and_avenues:      { p0: [-340, 360, 340],   t0: [260, 90, 80],    p1: [-280, 240, 840],  t1: [-580, 55, 620] },
  s30_oriental_pearl_1994_rise:       { p0: [-280, 240, 840],   t0: [-580, 55, 620],  p1: [-660, 230, -220], t1: [-260, 250, -434] },
  s31_jin_mao_1999_pagoda_rise:       { p0: [-660, 230, -220],  t0: [-260, 250, -434],p1: [-120, 250, -180], t1: [323, 250, 82] },
  s32_swfc_2008_skybridge_rise:       { p0: [-120, 250, -180],  t0: [323, 250, 82],   p1: [80, 300, -240],   t1: [475, 290, 157] },
  s33_shanghai_tower_2015_spiral:     { p0: [80, 300, -240],    t0: [475, 290, 157],  p1: [-140, 480, 580],  t1: [311, 380, 268] },
  s34_lujiazui_and_bund_panorama:     { p0: [-140, 480, 580],   t0: [311, 380, 268],  p1: [-640, 450, -420], t1: [180, 220, 60] },

  // Epilogue: Golden Overview -> Yu Garden Eaves to Lujiazui Telephoto -> Two Rivers Waterfront -> Sky Ascend -> Return to Cosmic Earth
  s35_epilogue_golden_dusk_overview:  { p0: [-640, 450, -420],  t0: [180, 220, 60],   p1: [-820, 560, 960],  t1: [-180, 140, 120] },
  s36_yuyuan_eaves_to_lujiazui_telephoto: { p0: [-1342, 28, 880], t0: [-420, 88, 540], p1: [-1328, 26, 874], t1: [-380, 96, 525] },
  s37_two_rivers_waterfront_glide:    { p0: [-880, 180, 420],   t0: [-650, 80, -120], p1: [-680, 250, -520], t1: [-850, 60, -120] },
  s38_city_spirit_sky_ascend:         { p0: [-680, 250, -520],  t0: [-850, 60, -120], p1: [-480, 1180, 1380],t1: [-150, 100, 50] },
  s39_finale_pullback_to_cosmic_earth:{ p0: [55, 14210, 1650],  t0: [30, 14160, 1180],p1: [0, 14320, 4250],  t1: [0, 14000, 0] }
};

function init() {
  const container = document.getElementById("canvas-container");
  audioElem = document.getElementById("doc-audio");
  timelineSlider = document.getElementById("timeline-slider");
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(THEMES[currentTheme].bg);
  scene.fog = new THREE.FogExp2(THEMES[currentTheme].fog, 0.00016);

  camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 6, 65000);
  camera.position.set(-850, 900, 1200);
  camCurrentPos.copy(camera.position);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 15;
  controls.maxDistance = 18000;
  controls.target.set(-400, 50, 100);
  camCurrentTarget.copy(controls.target);

  setupLights();

  cityGroup = new THREE.Group();
  scene.add(cityGroup);

  globeGroup = new THREE.Group();
  globeGroup.position.set(0, 14000, 0);
  globeGroup.visible = false;
  scene.add(globeGroup);

  ancientDeltaGroup = new THREE.Group();
  cityGroup.add(ancientDeltaGroup);

  mingOldCityGroup = new THREE.Group();
  cityGroup.add(mingOldCityGroup);

  shiliupuGroup = new THREE.Group();
  cityGroup.add(shiliupuGroup);

  bundClassicalGroup = new THREE.Group();
  cityGroup.add(bundClassicalGroup);

  shikumenGroup = new THREE.Group();
  cityGroup.add(shikumenGroup);

  redPulseGroup = new THREE.Group();
  redPulseGroup.visible = false;
  cityGroup.add(redPulseGroup);

  shipyardGroup = new THREE.Group();
  cityGroup.add(shipyardGroup);

  laserScanGroup = new THREE.Group();
  cityGroup.add(laserScanGroup);

  createGround();
  buildCosmicGlobe();
  loadAllData();
  setupEvents();
  animate();
}

function setupLights() {
  const t = THEMES[currentTheme];
  const ambientLight = new THREE.AmbientLight(t.ambient, 1.45);
  ambientLight.name = "ambientLight";
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.72);
  hemiLight.name = "hemiLight";
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(t.dirLight, 2.3);
  dirLight.name = "dirLight";
  dirLight.position.set(-1800, 2600, 1400);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x00e5ff, 1.1);
  fillLight.name = "fillLight";
  fillLight.position.set(2000, 1400, -1800);
  scene.add(fillLight);
}

function createGround() {
  const groundGeo = new THREE.PlaneGeometry(36000, 36000);
  const groundMat = new THREE.MeshStandardMaterial({
    color: THEMES[currentTheme].ground,
    roughness: 0.92,
    metalness: 0.12
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  cityGroup.add(ground);

  const grid = new THREE.GridHelper(16000, 140, 0x0ea5e9, 0x112236);
  grid.position.y = 0.2;
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  cityGroup.add(grid);
}

function loadAllData() {
  if (window.CMAB_SHANGHAI_DATA && window.SUBTITLES_DATA) {
    buildingsData = window.CMAB_SHANGHAI_DATA.buildings || [];
    subtitlesData = window.SUBTITLES_DATA || [];
    const statEl = document.getElementById("stat-buildings");
    if (statEl) statEl.innerText = buildingsData.length.toLocaleString();

    build3DCityScene();
    // The scene builder already constructs each historical district once.
    buildingMeshes = dynamicBuildings.filter(obj => obj.isMesh && obj.userData.merged_id);
    buildingMeshes.forEach(mesh => { mesh.material = mesh.material.clone(); });
  }
}

function getBuildingColor(b, mode) {
  if (mode === 'age') return CMAB_COLORS.age[b.age] || 0x00e5ff;
  if (mode === 'function') return CMAB_COLORS.function[b.function] || 0x64748b;
  if (mode === 'structure') return CMAB_COLORS.structure[b.structure] || 0x0284c7;
  if (mode === 'height') {
    const h = b.height;
    if (h > 400) return 0xe11d48;
    if (h > 200) return 0xf59e0b;
    if (h > 80) return 0x00e5ff;
    if (h > 30) return 0x10b981;
    return 0x38bdf8;
  }
  return 0x00e5ff;
}

function updateBuildingColors() {
  buildingMeshes.forEach(mesh => {
    mesh.material.color.setHex(getBuildingColor(mesh.userData, currentAttrMode));
  });
}

function applyTheme(themeKey) {
  const t = THEMES[themeKey];
  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.fog);
  const amb = scene.getObjectByName("ambientLight");
  if (amb) amb.color.setHex(t.ambient);
  const dir = scene.getObjectByName("dirLight");
  if (dir) dir.color.setHex(t.dirLight);
}

function setupEvents() {
  window.addEventListener("resize", onWindowResize);

  const cinemaBtn = document.getElementById("btn-cinema-mode");
  if (cinemaBtn) {
    cinemaBtn.addEventListener("click", () => {
      isCinemaMode = !isCinemaMode;
      document.body.classList.toggle("cinema-mode", isCinemaMode);
    });
  }

  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTheme = btn.dataset.theme;
      applyTheme(currentTheme);
    });
  });

  document.querySelectorAll(".attr-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".attr-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentAttrMode = btn.dataset.mode;
      updateBuildingColors();
    });
  });

  document.querySelectorAll(".chapter-item").forEach(item => {
    item.addEventListener("click", () => {
      const targetTime = parseFloat(item.dataset.time);
      audioElem.currentTime = targetTime;
      if (!isPlayingDoc) togglePlayDoc();
    });
  });

  const playBtn = document.getElementById("btn-play-doc");
  if (playBtn) playBtn.addEventListener("click", togglePlayDoc);

  if (timelineSlider) {
    timelineSlider.addEventListener("input", e => {
      audioElem.currentTime = parseFloat(e.target.value);
    });
  }

  // Raycaster for inspecting buildings in free explore mode
  renderer.domElement.addEventListener("click", onSceneClick);
}

function onSceneClick(event) {
  if (isPlayingDoc) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildingMeshes);
  if (intersects.length > 0) {
    const bldg = intersects[0].object.userData;
    if (bldg && bldg.merged_id) {
      document.getElementById("hud-bldg-name").innerText = bldg.name || `历史建筑 (#${bldg.merged_id})`;
      document.getElementById("hud-bldg-id").innerText = bldg.merged_id;
      document.getElementById("hud-bldg-height").innerText = `${bldg.height.toFixed(1)} 米`;
      document.getElementById("hud-bldg-age").innerText = bldg.age || "历史建筑";
      document.getElementById("hud-bldg-func").innerText = bldg.function || "功能用房";
      document.getElementById("hud-bldg-struct").innerText = bldg.structure || "砖木/混合结构";
      if (document.getElementById("hud-bldg-quality")) {
        document.getElementById("hud-bldg-quality").innerText = `${bldg.quality || 0.95} / 1.00`;
      }
    }
  }
}

function togglePlayDoc() {
  const btn = document.getElementById("btn-play-doc");
  if (audioElem.paused) {
    audioElem.play().catch(e => console.warn("Audio autoplay blocked:", e));
    isPlayingDoc = true;
    controls.enabled = false;
    if (btn) {
      btn.classList.add("playing");
      btn.querySelector(".play-icon").innerText = "❚❚";
      btn.querySelector(".btn-text").innerText = "暂停全景纪实 (Documentary Playing)";
    }
  } else {
    audioElem.pause();
    isPlayingDoc = false;
    controls.enabled = true;
    // Restore all buildings and historical landmarks when returning to free explore mode
    dynamicBuildings.forEach(m => { m.visible = true; m.scale.y = 1.0; });
    Object.values(landmarkGroups).forEach(g => { g.visible = true; g.scale.y = 1.0; });
    if (ancientDeltaGroup) ancientDeltaGroup.visible = true;
    if (mingOldCityGroup) mingOldCityGroup.visible = true;
    if (shiliupuGroup) shiliupuGroup.visible = true;
    if (bundClassicalGroup) bundClassicalGroup.visible = true;
    if (shikumenGroup) shikumenGroup.visible = true;
    if (shipyardGroup) shipyardGroup.visible = true;
    globeGroup.visible = false;
    cityGroup.visible = true;
    if (btn) {
      btn.classList.remove("playing");
      btn.querySelector(".play-icon").innerText = "▶";
      btn.querySelector(".btn-text").innerText = "播放全景纪实 (Gemini TTS 导览)";
    }
  }
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function updateDocumentaryState(t) {
  if (!subtitlesData || subtitlesData.length === 0) return;
  let beatIdx = subtitlesData.findIndex(item => t >= item.start && t < item.end);
  if (beatIdx < 0) beatIdx = subtitlesData.length - 1;
  const beat = subtitlesData[beatIdx];

  const dur = Math.max(0.1, beat.end - beat.start);
  const beatProg = Math.min(1.0, Math.max(0.0, (t - beat.start) / dur));

  // Compute progress across the parent shot (macro: 0.0->0.5, micro: 0.5->1.0)
  const parentId = beat.parent_shot_id || beat.shot_id.replace(/_[ab]$/, '');
  let shotProg = beatProg;
  if (beat.sub_phase === 'macro') {
    shotProg = beatProg * 0.5;
  } else if (beat.sub_phase === 'micro') {
    shotProg = 0.5 + beatProg * 0.5;
  }
  const easeShot = easeInOutCubic(shotProg);

  // Chronological historical year simulation
  const prevMaxYear = beatIdx > 0 ? subtitlesData[beatIdx - 1].era_max_year : -4000;
  const targetMaxYear = beat.era_max_year;
  const simYear = prevMaxYear + (targetMaxYear - prevMaxYear) * easeInOutCubic(beatProg);

  const isGlobeShot = (parentId === 's01_cosmic_globe_china' ||
                       parentId === 's02_china_yangtze_basin' ||
                       parentId === 's39_finale_pullback_to_cosmic_earth');

  globeGroup.visible = isGlobeShot;
  cityGroup.visible = !isGlobeShot;

  // Toggle Era-Specific 3D Architectural & Historical Complexes
  if (ancientDeltaGroup) ancientDeltaGroup.visible = (!isGlobeShot && simYear < 1200);
  if (mingOldCityGroup)  mingOldCityGroup.visible  = (!isGlobeShot && simYear >= 1545 && simYear <= 1915);
  if (shiliupuGroup)     shiliupuGroup.visible     = (!isGlobeShot && simYear >= 1400 && simYear <= 1915);
  if (bundClassicalGroup)bundClassicalGroup.visible= (!isGlobeShot && simYear >= 1840);
  if (shikumenGroup)     shikumenGroup.visible     = (!isGlobeShot && simYear >= 1860);
  if (redPulseGroup)     redPulseGroup.visible     = (simYear >= 1920 && simYear <= 1926);
  if (shipyardGroup)     shipyardGroup.visible     = (!isGlobeShot && simYear >= 1948 && parentId !== 's36_yuyuan_eaves_to_lujiazui_telephoto');

  // Chronological OSM/CMAB Building Growth
  let visibleCount = 0;
  dynamicBuildings.forEach(m => {
    const by = m.userData.birth_year || 1990;
    if (simYear < by - 8) {
      m.visible = false;
    } else {
      m.visible = true;
      if (m.userData.merged_id) visibleCount++;
      const span = by < 1840 ? 45.0 : (by < 1949 ? 14.0 : 4.5);
      m.scale.y = Math.min(1.0, Math.max(0.02, (simYear - (by - span * 0.5)) / span));
    }
  });

  // Chronological Pudong Supertall Growth
  Object.values(landmarkGroups).forEach(grp => {
    const by = grp.userData.birth_year || 1990;
    if (simYear < by - 4) {
      grp.visible = false;
    } else {
      grp.visible = true;
      grp.scale.y = Math.min(1.0, Math.max(0.02, (simYear - (by - 3.0)) / 3.5));
    }
  });

  const statBldg = document.getElementById("stat-buildings");
  if (statBldg) statBldg.innerText = visibleCount.toLocaleString();

  // Camera Interpolation via the map exported from the studio.
  const camSpec = PARENT_SHOT_CAMERA[parentId] || PARENT_SHOT_CAMERA.s35_epilogue_golden_dusk_overview;
  const tx = THREE.MathUtils.lerp(camSpec.p0[0], camSpec.p1[0], easeShot);
  const ty = THREE.MathUtils.lerp(camSpec.p0[1], camSpec.p1[1], easeShot);
  const tz = THREE.MathUtils.lerp(camSpec.p0[2], camSpec.p1[2], easeShot);
  const lx = THREE.MathUtils.lerp(camSpec.t0[0], camSpec.t1[0], easeShot);
  const ly = THREE.MathUtils.lerp(camSpec.t0[1], camSpec.t1[1], easeShot);
  const lz = THREE.MathUtils.lerp(camSpec.t0[2], camSpec.t1[2], easeShot);

  camera.position.set(tx, ty, tz);
  camera.lookAt(lx, ly, lz);

  // Subtitles & Keyword Karaoke Highlighting
  const captionBeat = subtitlesData.find(item => t >= (item.display_start ?? item.start) && t < (item.display_end ?? item.end)) || beat;
  const wmEl = document.getElementById("sub-chapter-watermark");
  if (wmEl) wmEl.innerText = `${captionBeat.chapter} | ${captionBeat.chapter_en}`;

  const cn = captionBeat.cn;
  const hl = captionBeat.highlight_cn;
  const subCnEl = document.getElementById("sub-cn");
  if (subCnEl) {
    if (hl && cn.includes(hl)) {
      subCnEl.innerHTML = cn.replace(hl, `<span class="highlight-word">${hl}</span>`);
    } else {
      subCnEl.innerText = cn;
    }
  }
  const subEnEl = document.getElementById("sub-en");
  if (subEnEl) subEnEl.innerText = captionBeat.en;

  // Update Dynamic Archival Card per Beat
  if (beat.art_img) {
    const imgEl = document.getElementById("art-card-img");
    const targetSrc = "images/" + beat.art_img;
    if (imgEl && imgEl.getAttribute("src") !== targetSrc) {
      imgEl.src = targetSrc;
      const bEl = document.getElementById("art-card-badge");
      if (bEl) bEl.innerText = beat.art_badge || "";
      const tEl = document.getElementById("art-card-title");
      if (tEl) tEl.innerText = beat.art_title || "";
      const dEl = document.getElementById("art-card-desc");
      if (dEl) dEl.innerText = beat.art_desc || "";
    }
  }

  // Update HUD Inspector with current Callout target
  if (beat.callout) {
    const bName = document.getElementById("hud-bldg-name");
    if (bName) bName.innerText = beat.callout.title;
    const bFunc = document.getElementById("hud-bldg-func");
    if (bFunc) bFunc.innerText = beat.callout.sub;
    const yrInt = Math.round(simYear);
    const bAge = document.getElementById("hud-bldg-age");
    if (bAge) {
      bAge.innerText = yrInt < 0 ? `公元前 ${Math.abs(yrInt)} 年` : `公元 ${yrInt} 年`;
    }
  }

  updateActiveChapter(t);
}

function updateActiveChapter(t) {
  // 6 Acts Timestamps in V5.0 Master Timeline
  const chapters = [0, 70.7, 148.7, 241.3, 319.0, 410.0];
  let activeIdx = 0;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (t >= chapters[i]) { activeIdx = i; break; }
  }
  document.querySelectorAll(".chapter-item").forEach((item, idx) => {
    item.classList.toggle("active", idx === activeIdx);
  });
  const eraNames = [
    "序幕 · 江海初开 沧海成陆 (前4000-1292)",
    "第一章 · 九里环城 江南名邑 (1553-1840)",
    "第二章 · 十里洋场 海派风华 (1843-1937)",
    "第三章 · 星火觉醒 工业脊梁 (1921-1988)",
    "第四章 · 跨江东进 浦东奇迹 (1990-2026)",
    "终章 · 古今交响 星辰大海 (2026-未来)"
  ];
  const eraBadge = document.getElementById("badge-era-text");
  if (eraBadge) eraBadge.innerText = eraNames[activeIdx];
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (isPlayingDoc) {
    const curTime = audioElem.currentTime;
    if (timelineSlider) timelineSlider.value = curTime;
    const m = Math.floor(curTime / 60);
    const s = Math.floor(curTime % 60);
    const timeCurEl = document.getElementById("time-current");
    if (timeCurEl) timeCurEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    updateDocumentaryState(curTime);
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
}

window.addEventListener("DOMContentLoaded", init);
