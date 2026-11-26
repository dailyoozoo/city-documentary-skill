# -*- coding: utf-8 -*-
"""
Generates web/js/main.js by extracting the procedural architectural models,
textures, and camera tracks from web/render_studio.html, and fusing them with
the interactive UI controls (theme switcher, attribute coloring, raycaster,
chapter navigation, timeline scrubbing, audio player).
"""

with open("web/render_studio.html", "r", encoding="utf-8") as f:
    studio_code = f.read()

# Extract textures and builders section
start_token = "// ==================== PROCEDURAL ARCHITECTURAL TEXTURES ===================="
end_token = "// 3D In-World Geographic Signposts"

idx_start = studio_code.find(start_token)
idx_end = studio_code.find(end_token)

if idx_start == -1 or idx_end == -1:
    raise ValueError("Failed to find tokens in render_studio.html")

procedural_block = studio_code[idx_start:idx_end].strip()

main_js_content = f"""/**
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
const cmabData = window.CMAB_SHANGHAI_DATA || {{ buildings: [], waterways: [] }};
let landmarkGroups = {{}};
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

const THEMES = {{
  'cyan-gold':   {{ bg: 0x091628, fog: 0x091628, ambient: 0x4a6282, dirLight: 0xffeacc, water: 0x063452, ground: 0x08101d }},
  'night-cyber': {{ bg: 0x04070f, fog: 0x04070f, ambient: 0x1e293b, dirLight: 0x00e5ff, water: 0x041628, ground: 0x050912 }},
  'golden-hour': {{ bg: 0x181018, fog: 0x181018, ambient: 0x52382c, dirLight: 0xffb74d, water: 0x24151c, ground: 0x120c10 }},
  'ink-wash':    {{ bg: 0x16191e, fog: 0x16191e, ambient: 0x3f444c, dirLight: 0xe2e8f0, water: 0x222831, ground: 0x111317 }}
}};

const CMAB_COLORS = {{
  age: {{
    'Pre-1843':  0xd97706,
    '1843-1949': 0xf59e0b,
    '1949-1978': 0x38bdf8,
    '1978-2000': 0x2dd4bf,
    '1990-2010': 0x00e5ff,
    'AF2010':    0x60a5fa
  }},
  function: {{
    'Office': 0x0284c7,
    'Commercial': 0xf59e0b,
    'Public Service': 0x8b5cf6,
    'Residential': 0x10b981,
    'Heritage/Cultural': 0xe11d48,
    'Other': 0x64748b
  }},
  structure: {{
    'Timber-Earth': 0xd97706,
    'Masonry-Stone': 0xf59e0b,
    'Steel-Concrete': 0x38bdf8,
    'Megastructure-Glass': 0x00e5ff
  }}
}};

{procedural_block}

function init() {{
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

  renderer = new THREE.WebGLRenderer({{ antialias: true, powerPreference: "high-performance" }});
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
}}

function setupLights() {{
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
}}

function createGround() {{
  const groundGeo = new THREE.PlaneGeometry(36000, 36000);
  const groundMat = new THREE.MeshStandardMaterial({{
    color: THEMES[currentTheme].ground,
    roughness: 0.92,
    metalness: 0.12
  }});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  cityGroup.add(ground);

  const grid = new THREE.GridHelper(16000, 140, 0x0ea5e9, 0x112236);
  grid.position.y = 0.2;
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  cityGroup.add(grid);
}}

function loadAllData() {{
  if (window.CMAB_SHANGHAI_DATA && window.SUBTITLES_DATA) {{
    buildingsData = window.CMAB_SHANGHAI_DATA.buildings || [];
    subtitlesData = window.SUBTITLES_DATA || [];
    const statEl = document.getElementById("stat-buildings");
    if (statEl) statEl.innerText = buildingsData.length.toLocaleString();

    build3DCityScene();
    // The scene builder already constructs each historical district once.
    buildingMeshes = dynamicBuildings.filter(obj => obj.isMesh && obj.userData.merged_id);
    buildingMeshes.forEach(mesh => {{ mesh.material = mesh.material.clone(); }});
  }}
}}

function getBuildingColor(b, mode) {{
  if (mode === 'age') return CMAB_COLORS.age[b.age] || 0x00e5ff;
  if (mode === 'function') return CMAB_COLORS.function[b.function] || 0x64748b;
  if (mode === 'structure') return CMAB_COLORS.structure[b.structure] || 0x0284c7;
  if (mode === 'height') {{
    const h = b.height;
    if (h > 400) return 0xe11d48;
    if (h > 200) return 0xf59e0b;
    if (h > 80) return 0x00e5ff;
    if (h > 30) return 0x10b981;
    return 0x38bdf8;
  }}
  return 0x00e5ff;
}}

function updateBuildingColors() {{
  buildingMeshes.forEach(mesh => {{
    mesh.material.color.setHex(getBuildingColor(mesh.userData, currentAttrMode));
  }});
}}

function applyTheme(themeKey) {{
  const t = THEMES[themeKey];
  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.fog);
  const amb = scene.getObjectByName("ambientLight");
  if (amb) amb.color.setHex(t.ambient);
  const dir = scene.getObjectByName("dirLight");
  if (dir) dir.color.setHex(t.dirLight);
}}

function setupEvents() {{
  window.addEventListener("resize", onWindowResize);

  const cinemaBtn = document.getElementById("btn-cinema-mode");
  if (cinemaBtn) {{
    cinemaBtn.addEventListener("click", () => {{
      isCinemaMode = !isCinemaMode;
      document.body.classList.toggle("cinema-mode", isCinemaMode);
    }});
  }}

  document.querySelectorAll(".theme-btn").forEach(btn => {{
    btn.addEventListener("click", () => {{
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTheme = btn.dataset.theme;
      applyTheme(currentTheme);
    }});
  }});

  document.querySelectorAll(".attr-btn").forEach(btn => {{
    btn.addEventListener("click", () => {{
      document.querySelectorAll(".attr-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentAttrMode = btn.dataset.mode;
      updateBuildingColors();
    }});
  }});

  document.querySelectorAll(".chapter-item").forEach(item => {{
    item.addEventListener("click", () => {{
      const targetTime = parseFloat(item.dataset.time);
      audioElem.currentTime = targetTime;
      if (!isPlayingDoc) togglePlayDoc();
    }});
  }});

  const playBtn = document.getElementById("btn-play-doc");
  if (playBtn) playBtn.addEventListener("click", togglePlayDoc);

  if (timelineSlider) {{
    timelineSlider.addEventListener("input", e => {{
      audioElem.currentTime = parseFloat(e.target.value);
    }});
  }}

  // Raycaster for inspecting buildings in free explore mode
  renderer.domElement.addEventListener("click", onSceneClick);
}}

function onSceneClick(event) {{
  if (isPlayingDoc) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildingMeshes);
  if (intersects.length > 0) {{
    const bldg = intersects[0].object.userData;
    if (bldg && bldg.merged_id) {{
      document.getElementById("hud-bldg-name").innerText = bldg.name || `历史建筑 (#${{bldg.merged_id}})`;
      document.getElementById("hud-bldg-id").innerText = bldg.merged_id;
      document.getElementById("hud-bldg-height").innerText = `${{bldg.height.toFixed(1)}} 米`;
      document.getElementById("hud-bldg-age").innerText = bldg.age || "历史建筑";
      document.getElementById("hud-bldg-func").innerText = bldg.function || "功能用房";
      document.getElementById("hud-bldg-struct").innerText = bldg.structure || "砖木/混合结构";
      if (document.getElementById("hud-bldg-quality")) {{
        document.getElementById("hud-bldg-quality").innerText = `${{bldg.quality || 0.95}} / 1.00`;
      }}
    }}
  }}
}}

function togglePlayDoc() {{
  const btn = document.getElementById("btn-play-doc");
  if (audioElem.paused) {{
    audioElem.play().catch(e => console.warn("Audio autoplay blocked:", e));
    isPlayingDoc = true;
    controls.enabled = false;
    if (btn) {{
      btn.classList.add("playing");
      btn.querySelector(".play-icon").innerText = "❚❚";
      btn.querySelector(".btn-text").innerText = "暂停全景纪实 (Documentary Playing)";
    }}
  }} else {{
    audioElem.pause();
    isPlayingDoc = false;
    controls.enabled = true;
    // Restore all buildings and historical landmarks when returning to free explore mode
    dynamicBuildings.forEach(m => {{ m.visible = true; m.scale.y = 1.0; }});
    Object.values(landmarkGroups).forEach(g => {{ g.visible = true; g.scale.y = 1.0; }});
    if (ancientDeltaGroup) ancientDeltaGroup.visible = true;
    if (mingOldCityGroup) mingOldCityGroup.visible = true;
    if (shiliupuGroup) shiliupuGroup.visible = true;
    if (bundClassicalGroup) bundClassicalGroup.visible = true;
    if (shikumenGroup) shikumenGroup.visible = true;
    if (shipyardGroup) shipyardGroup.visible = true;
    globeGroup.visible = false;
    cityGroup.visible = true;
    if (btn) {{
      btn.classList.remove("playing");
      btn.querySelector(".play-icon").innerText = "▶";
      btn.querySelector(".btn-text").innerText = "播放全景纪实 (Gemini TTS 导览)";
    }}
  }}
}}

function easeInOutCubic(x) {{
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}}

function updateDocumentaryState(t) {{
  if (!subtitlesData || subtitlesData.length === 0) return;
  let beatIdx = subtitlesData.findIndex(item => t >= item.start && t < item.end);
  if (beatIdx < 0) beatIdx = subtitlesData.length - 1;
  const beat = subtitlesData[beatIdx];

  const dur = Math.max(0.1, beat.end - beat.start);
  const beatProg = Math.min(1.0, Math.max(0.0, (t - beat.start) / dur));

  // Compute progress across the parent shot (macro: 0.0->0.5, micro: 0.5->1.0)
  const parentId = beat.parent_shot_id || beat.shot_id.replace(/_[ab]$/, '');
  let shotProg = beatProg;
  if (beat.sub_phase === 'macro') {{
    shotProg = beatProg * 0.5;
  }} else if (beat.sub_phase === 'micro') {{
    shotProg = 0.5 + beatProg * 0.5;
  }}
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
  dynamicBuildings.forEach(m => {{
    const by = m.userData.birth_year || 1990;
    if (simYear < by - 8) {{
      m.visible = false;
    }} else {{
      m.visible = true;
      if (m.userData.merged_id) visibleCount++;
      const span = by < 1840 ? 45.0 : (by < 1949 ? 14.0 : 4.5);
      m.scale.y = Math.min(1.0, Math.max(0.02, (simYear - (by - span * 0.5)) / span));
    }}
  }});

  // Chronological Pudong Supertall Growth
  Object.values(landmarkGroups).forEach(grp => {{
    const by = grp.userData.birth_year || 1990;
    if (simYear < by - 4) {{
      grp.visible = false;
    }} else {{
      grp.visible = true;
      grp.scale.y = Math.min(1.0, Math.max(0.02, (simYear - (by - 3.0)) / 3.5));
    }}
  }});

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
  if (wmEl) wmEl.innerText = `${{captionBeat.chapter}} | ${{captionBeat.chapter_en}}`;

  const cn = captionBeat.cn;
  const hl = captionBeat.highlight_cn;
  const subCnEl = document.getElementById("sub-cn");
  if (subCnEl) {{
    if (hl && cn.includes(hl)) {{
      subCnEl.innerHTML = cn.replace(hl, `<span class="highlight-word">${{hl}}</span>`);
    }} else {{
      subCnEl.innerText = cn;
    }}
  }}
  const subEnEl = document.getElementById("sub-en");
  if (subEnEl) subEnEl.innerText = captionBeat.en;

  // Update Dynamic Archival Card per Beat
  if (beat.art_img) {{
    const imgEl = document.getElementById("art-card-img");
    const targetSrc = "images/" + beat.art_img;
    if (imgEl && imgEl.getAttribute("src") !== targetSrc) {{
      imgEl.src = targetSrc;
      const bEl = document.getElementById("art-card-badge");
      if (bEl) bEl.innerText = beat.art_badge || "";
      const tEl = document.getElementById("art-card-title");
      if (tEl) tEl.innerText = beat.art_title || "";
      const dEl = document.getElementById("art-card-desc");
      if (dEl) dEl.innerText = beat.art_desc || "";
    }}
  }}

  // Update HUD Inspector with current Callout target
  if (beat.callout) {{
    const bName = document.getElementById("hud-bldg-name");
    if (bName) bName.innerText = beat.callout.title;
    const bFunc = document.getElementById("hud-bldg-func");
    if (bFunc) bFunc.innerText = beat.callout.sub;
    const yrInt = Math.round(simYear);
    const bAge = document.getElementById("hud-bldg-age");
    if (bAge) {{
      bAge.innerText = yrInt < 0 ? `公元前 ${{Math.abs(yrInt)}} 年` : `公元 ${{yrInt}} 年`;
    }}
  }}

  updateActiveChapter(t);
}}

function updateActiveChapter(t) {{
  // 6 Acts Timestamps in V5.0 Master Timeline
  const chapters = [0, 70.7, 148.7, 241.3, 319.0, 410.0];
  let activeIdx = 0;
  for (let i = chapters.length - 1; i >= 0; i--) {{
    if (t >= chapters[i]) {{ activeIdx = i; break; }}
  }}
  document.querySelectorAll(".chapter-item").forEach((item, idx) => {{
    item.classList.toggle("active", idx === activeIdx);
  }});
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
}}

function onWindowResize() {{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}}

function animate() {{
  requestAnimationFrame(animate);
  if (isPlayingDoc) {{
    const curTime = audioElem.currentTime;
    if (timelineSlider) timelineSlider.value = curTime;
    const m = Math.floor(curTime / 60);
    const s = Math.floor(curTime % 60);
    const timeCurEl = document.getElementById("time-current");
    if (timeCurEl) timeCurEl.innerText = `${{m.toString().padStart(2, '0')}}:${{s.toString().padStart(2, '0')}}`;
    updateDocumentaryState(curTime);
  }} else {{
    controls.update();
  }}
  renderer.render(scene, camera);
}}

window.addEventListener("DOMContentLoaded", init);
"""

with open("web/js/main.js", "w", encoding="utf-8") as f:
    f.write(main_js_content)

print(f"web/js/main.js successfully generated! Total length: {len(main_js_content)} characters.")
