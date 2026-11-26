/* Shanghai cinematic edition. Deterministic composition on the existing studio. */
(() => {
  'use strict';
  const legacyRender = window.renderAt;
  window.CINEMATIC_COMPOSITOR = true;
  const nativeRender = renderer.render.bind(renderer); window.V7_NATIVE_RENDER=nativeRender;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const serif = '"STSong", "SimSun", "Songti SC", serif';
  const sans = '"Microsoft YaHei", "Segoe UI", sans-serif';
  const chapters = [
    ['序幕', '江海初开', 'WHERE THE RIVER MEETS THE SEA'],
    ['第一章', '九里环城', 'A CITY TAKES SHAPE'],
    ['第二章', '十里洋场', 'THE AGE OF THE BUND'],
    ['第三章', '星火觉醒', 'THE MAKING OF A METROPOLIS'],
    ['第四章', '浦东奇迹', 'A SKYLINE REIMAGINED'],
    ['终章', '古今交响', 'ONE RIVER. COUNTLESS POSSIBILITIES.']
  ];
  const shots = [];
  for (const b of beats) {
    const id = b.parent_shot_id || b.shot_id.replace(/_[ab]$/, '');
    let s = shots[shots.length - 1];
    if (!s || s.id !== id) {
      s = { id, start: b.start, end: b.end, beat: b, index: shots.length };
      shots.push(s);
    } else s.end = b.end;
  }
  const chapterStarts = shots.filter((s, i) => !i || s.beat.chapter !== shots[i - 1].beat.chapter);
  const curated = {
    s02_china_yangtze_basin: ['ma_yuan_water.jpg', '长江万顷', '南宋 · 马远《水图》'],
    s03_delta_coastline_6000yr: ['ma_yuan_sea.jpg', '沧海成陆', '长江口 · 地理演进示意'],
    s04_chunshen_wusong_origin: ['ma_yuan_water.jpg', '因水而生', '江海交汇 · 城市起源'],
    s05_huangpu_s_bend_capture: ['ma_yuan_sea.jpg', '沪', '水脉之上 · 城市的名字'],
    s06_yuan_1292_county_seat: ['map_1884_oldcity.jpg', '上海立县', '1292 · 建制起点 / 后世舆图参照'],
    s07_cotton_port_town_rise: ['ma_yuan_water.jpg', '江南港邑', '水乡聚落 · 渔盐与商贸'],
    s08_ch1_oldcity_macro_anchor: ['map_1884_oldcity.jpg', '九里环城', '老城厢 · 历史舆图'],
    s09_ming_wall_gates_panorama: ['map_1884_oldcity.jpg', '一城六门', '明清老城厢 · 后世舆图参照'],
    s10_oldcity_dive_to_yuyuan_ne: ['huxinting_vintage.jpg', '豫园', '江南园林 · 历史影像'],
    s11_yuyuan_bridge_pavilion_detail: ['zigzag_bridge_vintage.jpg', '九曲回廊', '湖心亭与九曲桥 · 历史影像'],
    s12_fly_over_east_gate_to_shiliupu: ['map_1884_full.jpg', '由城入江', '老城厢与黄浦江 · 历史舆图'],
    s13_shiliupu_wharf_junks_closeup: ['map_1854_muddy_flat.jpg', '十六铺', '黄浦江商港 · 历史舆图参照'],
    s14_oldcity_and_river_grand_vista: ['vintage_bund_map_1932.jpg', '帆樯之间', '城市与航道 · 历史舆图'],
    s15_ch2_north_along_huangpu_to_bund: ['bund_1930.jpg', '外滩', '1930年代 · 历史影像'],
    s16_waibaidu_bridge_confluence: ['waibaidu_vintage.jpg', '外白渡桥', '苏州河口 · 历史影像'],
    s17_bund_neoclassical_corridor: ['bund_1930.jpg', '万国建筑', '外滩 · 历史影像'],
    s18_peace_hotel_and_customs_clock: ['customs_house_vintage.jpg', '江海关', '外滩钟声 · 历史影像'],
    s19_hsbc_classical_dome_closeup: ['hsbc_building.jpg', '石筑的时代', '外滩建筑 · 当代实景参照'],
    s20_west_into_shikumen_lanes: ['shikumen_heritage.jpg', '石库门', '海派生活 · 博物馆实景'],
    s21_nanjing_road_haipai_vista: ['nanjing_rd_1930.jpg', '夜上海', '1930年代 · 历史影像'],
    s22_ch3_puxi_shikumen_to_xingye: ['cpc_first_congress.jpg', '兴业路', '历史建筑 · 当代实景参照'],
    s23_xingye_rd_76_shikumen_closeup: ['cpc_first_congress.jpg', '星火觉醒', '中共一大会址 · 当代实景参照'],
    s24_1949_dawn_citywide_rebirth: ['jiangnan_shipyard.jpg', '上海制造', '工业建设 · 实景参照'],
    s25_jiangnan_shipyard_gantry_cranes: ['jiangnan_shipyard.jpg', '工业脊梁', '江南造船 · 实景参照'],
    s26_ocean_freighter_sailing_huangpu: ['jiangnan_shipyard.jpg', '驶向深蓝', '造船工业 · 实景参照'],
    s27_puxi_vs_pudong_pre1990_contrast: ['bund_1930.jpg', '一江两岸', '浦东开发前 · 历史回望'],
    s28_ch4_cross_huangpu_to_pudong: ['bund_from_swfc_bluehour.jpg', '跨江东进', '浦东开发开放 · 当代实景参照'],
    s29_river_bridges_and_avenues: ['bund_from_swfc_bluehour.jpg', '连接未来', '黄浦江两岸 · 当代实景参照'],
    s30_oriental_pearl_1994_rise: ['oriental_pearl.jpg', '东方明珠', '468 m', '1994'],
    s31_jin_mao_1999_pagoda_rise: ['jin_mao_tower.jpg', '金茂大厦', '420.5 m', '1999'],
    s32_swfc_2008_skybridge_rise: ['swfc_tower.jpg', '环球金融中心', '492 m', '2008'],
    s33_shanghai_tower_2015_spiral: ['shanghai_tower.jpg', '上海中心', '632 m', '2015'],
    s34_lujiazui_and_bund_panorama: ['bund_from_swfc_bluehour.jpg', '一江两岸', '当代上海 · 蓝调时刻'],
    s35_epilogue_golden_dusk_overview: ['bund_from_swfc_bluehour.jpg', '万家灯火', '当代上海 · 蓝调时刻'],
    s36_yuyuan_eaves_to_lujiazui_telephoto: ['yuyuan_classical.jpg', '古今交响', '豫园 · 当代实景'],
    s37_two_rivers_waterfront_glide: ['bund_from_swfc_bluehour.jpg', '一江一河', '当代上海 · 滨水风景'],
    s38_city_spirit_sky_ascend: ['bund_from_swfc_bluehour.jpg', '海纳百川', '追求卓越 · 开明睿智 · 大气谦和']
  };
  let activeTime = 0, activeShot = shots[0], activeChapter = 0;
  let configured = false;
  let waterMaterial;
  const seenMaterials = new Set();

  function configure() {
    if (configured) return;
    configured = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, { left: -3000, right: 3000, top: 3000, bottom: -3000, near: 10, far: 14000 });
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 1.4;
    sunLight.shadow.camera.updateProjectionMatrix();
    sunLight.position.set(-3000, 5500, 2800);
    sunLight.target.position.set(-600, 0, 300);
    scene.add(sunLight.target);
    ambientLight.intensity = 0.42;
    hemiLight.intensity = 0.72;
    hemiLight.color.setHex(0xb0c7de);
    hemiLight.groundColor.setHex(0x283139);
    sunLight.intensity = 1.95;
    rimLight.intensity = 0.24;
    warmPointLight.intensity = 0.18;
    scene.fog.density = 0.00012;
    cityGroup.traverse(obj => {
      if (obj.isGridHelper) obj.visible = false;
      if (obj.isLineSegments && obj.material) obj.material.opacity *= 0.22;
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        if (seenMaterials.has(mat)) continue;
        seenMaterials.add(mat);
        if (mat.color) {
          const hsl = {};
          mat.color.getHSL(hsl);
          mat.color.setHSL(hsl.h, hsl.s * 0.48, hsl.l * 0.84);
        }
        if (mat.emissiveIntensity) mat.emissiveIntensity *= 0.12;
        if (mat.map) { mat.map.encoding = THREE.sRGBEncoding; mat.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); }
        if (mat.isMeshStandardMaterial) { mat.roughness = Math.max(0.35, mat.roughness); mat.metalness = Math.min(0.35, mat.metalness); }
        mat.needsUpdate = true;
      }
    });
    // Calm, continuous surface shimmer in world coordinates; no screen-space flashing.
    waterMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, warm: { value: 0 } },
      vertexShader: 'varying vec3 wp; void main(){vec4 p=modelMatrix*vec4(position,1.0);wp=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
      fragmentShader: `uniform float time; uniform float warm; varying vec3 wp;
        void main(){float r=sin(wp.z*.11+wp.x*.023-time*.6)*sin(wp.x*.036-wp.z*.052+time*.3);
        float glint=pow(max(0.,r),14.); vec3 c=mix(vec3(.032,.105,.14),vec3(.09,.125,.15),warm);
        c+=glint*mix(vec3(.12,.19,.23),vec3(.27,.19,.105),warm)*.48; gl_FragColor=vec4(c,1.);}`,
      side: THREE.DoubleSide
    });
    // All the original river meshes share this material.
    const riverObjects = cityGroup.children.filter(o => o.isMesh && o.material && o.material.emissive && o.material.emissive.getHex() === 0x063754);
    for (const obj of riverObjects) { obj.material = waterMaterial; obj.castShadow = false; }
    globeGroup.traverse(obj => {
      if (obj.geometry && obj.geometry.type === 'RingGeometry') obj.visible = false;
      if (obj.isPoints) { obj.material.size = 6; obj.material.opacity = 0.48; }
      if (obj.isMesh && obj.material.map) {
        obj.material.map.encoding = THREE.sRGBEncoding;
        obj.material.metalness = 0;
        obj.material.roughness = 1;
        obj.material.emissiveIntensity = 0.08;
      }
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1236, 72, 48), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader: 'varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),3.5);gl_FragColor=vec4(.12,.38,.66,f*.45);}'
    }));
    globeGroup.add(atmosphere);
    window.EDITORIAL.setup();
  }

  function cameraPath(s, key) {
    const spec = PARENT_SHOT_CAMERA[s.id];
    const a = new THREE.Vector3(...spec[key + '0']), b = new THREE.Vector3(...spec[key + '1']);
    const dur = s.end - s.start;
    const u = clamp((activeTime - s.start) / dur);
    const velocity = b.clone().sub(a).divideScalar(dur);
    const prev = shots[s.index - 1], next = shots[s.index + 1];
    const tangent = (neighbor, start) => {
      if (!neighbor) return velocity.clone();
      const n = PARENT_SHOT_CAMERA[neighbor.id];
      const join = new THREE.Vector3(...n[key + (start ? '1' : '0')]);
      if (join.distanceTo(start ? a : b) > 4) return velocity.clone();
      const nv = new THREE.Vector3(...n[key + '1']).sub(new THREE.Vector3(...n[key + '0'])).divideScalar(neighbor.end - neighbor.start);
      return nv.add(velocity).multiplyScalar(0.5).clampLength(0, velocity.length() * 1.6);
    };
    const m0 = tangent(prev, true).multiplyScalar(dur), m1 = tangent(next, false).multiplyScalar(dur);
    return a.multiplyScalar(2*u*u*u-3*u*u+1).addScaledVector(m0,u*u*u-2*u*u+u).addScaledVector(b,-2*u*u*u+3*u*u).addScaledVector(m1,u*u*u-u*u);
  }

  renderer.render = function(targetScene,targetCamera){
    if(configured && targetScene===scene){
      const stage=window.EDITORIAL.at(activeTime);
    if(window.V8_FRAME_STATE)Object.assign(window.V8_FRAME_STATE,{stageStart:stage.start,kind:stage.kind,target:stage.target});
      window.EDITORIAL.apply(activeTime,stage);
      if(!['model','oldcity','cosmic'].includes(stage.kind))return;
      if(stage.kind==='cosmic'){
        camera.position.copy(cameraPath(activeShot,'p'));camera.lookAt(cameraPath(activeShot,'t'));camera.updateMatrixWorld(true);
      }else window.EDITORIAL.camera(activeTime,stage);
    }
    nativeRender(targetScene,targetCamera);
  };
  function tracking(text, x, y, spacing, font, color = '#eee7dc') {
    ctx.font = font; ctx.fillStyle = color;
    for (const letter of text) { ctx.fillText(letter, x, y); x += ctx.measureText(letter).width + spacing; }
  }
  function cover(img, x, y, w, h, progress, zoom = 0.055) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * (1.025 + zoom * progress);
    const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x + (w-iw)*(0.46+progress*.08), y + (h-ih)*.42, iw, ih); ctx.restore();
  }
  function gradient(x, y, w, h, from, to, horizontal = false) {
    const g = ctx.createLinearGradient(x, y, horizontal ? x+w : x, horizontal ? y : y+h);
    g.addColorStop(0, from); g.addColorStop(1, to); ctx.fillStyle = g; ctx.fillRect(x,y,w,h);
  }
  function drawPhoto(s, progress, labels = true) {
    const item = curated[s.id];
    if (!item) return;
    const img = artImages[item[0]];
    if (!img || !img.naturalWidth) return;
    const portrait = img.naturalWidth / img.naturalHeight < 1.05;
    const map = item[0].startsWith('map_') || item[0].startsWith('vintage_bund_map');
    const painting = item[0].startsWith('ma_yuan');
    const split = portrait || map;
    ctx.fillStyle = '#101922'; ctx.fillRect(0,0,W,H);
    if (split) {
      const x = 840, y = 58, w = 990, h = 866;
      const scale = Math.min(w/img.naturalWidth, h/img.naturalHeight) * (1 + progress*.018);
      const iw=img.naturalWidth*scale, ih=img.naturalHeight*scale;
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
      ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);ctx.restore();
      if(!labels)return;
      tracking('SHANGHAI / CITY CHRONICLES',110,240,4,`15px ${sans}`,'#9caab2');
      ctx.fillStyle='#d3af78';ctx.fillRect(110,280,48,2);
      ctx.font=`66px ${serif}`;ctx.fillStyle='#f1e9dc';ctx.fillText(item[1],110,390,680);
      if(item[3]) {
        ctx.font=`120px "Segoe UI", sans-serif`;ctx.fillText(item[2],103,570);
        tracking(item[3]+' / PUDONG',112,630,5,`18px ${sans}`,'#d3af78');
        ctx.font=`17px ${sans}`;ctx.fillStyle='#82939f';ctx.fillText('当代实景 · 建筑参照',110,680);
      } else {
        ctx.font=`23px ${sans}`;ctx.fillStyle='#aeb9bf';wrapText(ctx,item[2],110,472,640,38);
        ctx.font=`18px ${sans}`;ctx.fillStyle='#84949e';ctx.fillText(map?'HISTORICAL CARTOGRAPHY':'SHANGHAI / ARCHITECTURE & MEMORY',110,585);
      }
    } else {
      cover(img,0,58,W,866,progress,painting?.035:.055);
      ctx.fillStyle=painting?'rgba(45,25,9,.07)':'rgba(7,17,29,.14)';ctx.fillRect(0,58,W,866);
      gradient(0,58,W,866,'rgba(3,8,14,0)','rgba(3,8,14,.61)');
      gradient(0,58,950,866,'rgba(3,8,14,.38)','rgba(3,8,14,0)',true);
      if(!labels)return;
      tracking(painting?'RIVER / ORIGINS':'SHANGHAI / MEMORY & METROPOLIS',110,641,4,`15px ${sans}`,'#d7c5a9');
      ctx.font=`72px ${serif}`;ctx.fillStyle='#f5ecdf';ctx.fillText(item[1],106,753);
      ctx.font=`21px ${sans}`;ctx.fillStyle='#c7c9c9';ctx.fillText(item[2],111,803);
    }
  }
  function subtitles(beat) {
    ctx.save(); ctx.textAlign='center';
    let size=32;ctx.font=`${size}px ${sans}`;
    while(ctx.measureText(beat.cn).width>1690 && size>23)ctx.font=`${--size}px ${sans}`;
    ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=10;ctx.shadowOffsetY=2;
    window.V8_FRAME_STATE.caption={cnWidth:ctx.measureText(beat.cn).width,cnSize:size,cnY:974};
    ctx.fillStyle='#f1ede7';ctx.fillText(beat.cn,W/2,974);
    size=18;ctx.font=`${size}px "Segoe UI", sans-serif`;
    while(ctx.measureText(beat.en).width>1650 && size>13)ctx.font=`${--size}px "Segoe UI", sans-serif`;
    Object.assign(window.V8_FRAME_STATE.caption,{enWidth:ctx.measureText(beat.en).width,enSize:size,enY:1008});
    ctx.fillStyle='#a9b4bf';ctx.fillText(beat.en,W/2,1008);
    ctx.restore();
  }
  function chapterTitle(ci, alpha) {
    ctx.save();ctx.globalAlpha=alpha;
    gradient(0,58,1400,866,'rgba(4,10,17,.86)','rgba(4,10,17,0)',true);
    const c=chapters[ci];
    tracking(`0${ci} / ${c[0]}`,112,336,5,`19px ${sans}`,'#d3af78');
    ctx.fillStyle='#d3af78';ctx.fillRect(112,380,62,2);
    tracking(c[1],106,527,15,`100px ${serif}`);
    tracking(c[2],114,594,4,`17px "Segoe UI", sans-serif`,'#aebbc5');
    ctx.restore();
  }
  function cosmic(s, progress) {
    ctx.fillStyle='#03080f';ctx.fillRect(0,0,W,H);
    ctx.drawImage(webglCanvas,310,0);
    gradient(0,58,1100,866,'rgba(3,8,15,1)','rgba(3,8,15,0)',true);
    const closing=s.index===38, basin=s.index===1;
    tracking(closing?'THE STORY CONTINUES':basin?'THE YANGTZE / A JOURNEY TO THE SEA':'A CITY WRITTEN BY WATER',112,286,5,`18px "Segoe UI", sans-serif`,'#bda27b');
    const fade=smooth((activeTime-s.start)/1.5);
    ctx.save();ctx.globalAlpha=fade;
    tracking(basin?'长江':'上海',100,501,34,`152px ${serif}`);
    tracking(basin?'T H E   Y A N G T Z E':'S H A N G H A I',116,575,7,`27px "Segoe UI", sans-serif`,'#d5d7d9');
    ctx.fillStyle='#c4a273';ctx.fillRect(114,631,70,2);
    ctx.font=`25px ${serif}`;ctx.fillStyle='#bbc6ce';ctx.fillText(closing?'一江奔流，万象新生。':basin?'由大陆腹地，奔赴江海之际。':'从江海交汇，到世界都会。',114,694);
    tracking(closing?'31°14′ N   121°29′ E':'31° N / THE YANGTZE ESTUARY',114,755,3,`15px "Segoe UI", sans-serif`,'#778b9d');
    ctx.restore();
  }
  function coastline(progress) {
    const img=artImages['ma_yuan_sea.jpg'];
    if(img)cover(img,0,58,W,866,progress,.025);
    ctx.fillStyle='rgba(7,18,27,.84)';ctx.fillRect(0,58,W,866);
    tracking('THE LAND EMERGES / 长江口',110,224,4,`17px ${sans}`,'#b59e7f');
    ctx.font=`82px ${serif}`;ctx.fillStyle='#ede6da';ctx.fillText('沧海，渐成陆地。',104,340);
    ctx.font=`20px ${sans}`;ctx.fillStyle='#9eafb9';ctx.fillText('六千年地理演进 · 海岸线东移示意',110,403);
    const colors=['#c29d68','#97b4ab','#80aabc'];
    const labels=['早期冈身','秦汉沙冈','唐宋海塘'];
    for(let j=0;j<3;j++){
      const reveal=smooth((progress-j*.15)/.44);
      ctx.save();ctx.beginPath();ctx.rect(0,475,W,355*reveal);ctx.clip();
      ctx.strokeStyle=colors[j];ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(980+j*200,490);
      ctx.bezierCurveTo(830+j*200,590,1230+j*200,665,1050+j*200,810);ctx.stroke();
      ctx.restore();
      ctx.globalAlpha=clamp(reveal);ctx.fillStyle=colors[j];ctx.font=`20px ${sans}`;ctx.fillText(labels[j],960+j*200,862);ctx.globalAlpha=1;
    }
    ctx.strokeStyle='rgba(138,177,189,.30)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(130,595);ctx.bezierCurveTo(590,510,560,745,1050,694);ctx.stroke();
    const pathProgress=clamp(progress/.8);
    ctx.save();ctx.beginPath();ctx.rect(130,470,1200*pathProgress,370);ctx.clip();
    ctx.strokeStyle='#d5b47d';ctx.lineWidth=3;ctx.shadowColor='#be915c';ctx.shadowBlur=12;
    ctx.beginPath();ctx.moveTo(130,595);ctx.bezierCurveTo(590,510,560,745,1190,694);ctx.stroke();ctx.restore();
    ctx.font=`17px ${sans}`;ctx.fillStyle='#a7bac3';ctx.fillText('长江来沙',130,650);ctx.fillText('海岸线向东推进 →',1360,458);
  }

  function editorialGraphic(stage) {
    const u=clamp((activeTime-stage.start)/(stage.end-stage.start)),r=smooth(u/.50);
    const im=artImages[stage.kind==='rivers'?'ma_yuan_sea.jpg':'ma_yuan_water.jpg'];
    if(im)cover(im,0,58,W,866,u,.045);
    ctx.fillStyle='rgba(6,17,26,.83)';ctx.fillRect(0,58,W,866);
    tracking('WATER / THE ORIGINS OF A CITY',112,167,4,`16px "Segoe UI", sans-serif`,'#b89b72');
    const headings={journey:['6,300','公里 · 从长江到东海','沉积与潮汐，塑造长江口。'],origin:['申','春申君 · 黄歇','疏治水脉的传说，与城市之名相连。'],hu:['沪','列竹捕鱼 · 水乡古称','江河生活，留下了城市的名字。'],rivers:['一江一河','黄浦江 × 吴淞江','水系主次变化 · 关系示意'],year:['1292','上海设县','元代 · 从江南聚落到县城']};
    const h=headings[stage.kind];
    ctx.fillStyle='#eee7dc';ctx.font=`${stage.kind==='rivers'?100:stage.kind==='journey'?158:190}px ${serif}`;ctx.fillText(h[0],106,466);
    ctx.fillStyle='#c1a378';ctx.fillRect(112,522,90,2);ctx.font=`31px ${serif}`;ctx.fillStyle='#e3d8c6';ctx.fillText(h[1],112,590);
    ctx.font=`22px ${sans}`;ctx.fillStyle='#a7b5bd';ctx.fillText(h[2],112,650);
    ctx.font=`16px ${sans}`;ctx.fillStyle='#7b939f';ctx.fillText('历史主题图解 · 非实测地理复原',112,824);
    ctx.save();ctx.beginPath();ctx.rect(920,240,820,560);ctx.clip();
    ctx.lineCap='round';ctx.lineJoin='round';
    if(stage.kind==='hu') {
      for(let i=0;i<18;i++){
        let x=1060+i*31,y=374+Math.sin(i*.25)*70;ctx.strokeStyle=i%2?'#ac9170':'#dfc19a';ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(x,y-26*r);ctx.lineTo(x,680);ctx.stroke();
      }
      for(let y=580;y<765;y+=35){ctx.strokeStyle='rgba(107,161,180,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(960,y);ctx.bezierCurveTo(1160,y-25,1430,y+24,1710,y-10);ctx.stroke();}
      ctx.font=`19px ${sans}`;ctx.fillStyle='#adbbc3';ctx.fillText('竹栅捕鱼 · 形制意象',1135,785);
    } else if(stage.kind==='year') {
      const labels=['江南聚落','上海县','城市沿革'];
      for(let i=0;i<3;i++){const x=1020+i*225,y=480;ctx.strokeStyle=i===1?'#c5ac83':'#607983';ctx.lineWidth=i===1?3:1;ctx.strokeRect(x,y-65,170,130);ctx.font=`29px ${serif}`;ctx.fillStyle=i===1?'#eee1c8':'#9aafb9';ctx.fillText(labels[i],x+25,y+10);if(i<2){ctx.strokeStyle='#7f9ca5';ctx.beginPath();ctx.moveTo(x+180,y);ctx.lineTo(x+215,y);ctx.stroke();}}
      ctx.font=`18px ${sans}`;ctx.fillStyle='#91a6ad';ctx.fillText('建置节点 · 非空间复原',1200,706);
    } else {
      ctx.strokeStyle='rgba(77,131,150,.25)';ctx.lineWidth=55;ctx.beginPath();ctx.moveTo(1000,660);ctx.bezierCurveTo(1120,410,1410,702,1620,356);ctx.stroke();
      ctx.strokeStyle='#91b6bf';ctx.lineWidth=stage.kind==='rivers'?12:6;ctx.setLineDash([1300*r,1400]);ctx.beginPath();ctx.moveTo(1000,660);ctx.bezierCurveTo(1120,410,1410,702,1620,356);ctx.stroke();ctx.setLineDash([]);
      if(stage.kind==='rivers'){ctx.strokeStyle='#c3ac85';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(990,350);ctx.bezierCurveTo(1110,410,1160,530,1260,560);ctx.stroke();ctx.font=`23px ${sans}`;ctx.fillStyle='#c3ac85';ctx.fillText('吴淞江',1010,320);ctx.fillStyle='#91b6bf';ctx.fillText('黄浦江',1440,651);}
      else {ctx.fillStyle='#d2b284';ctx.beginPath();ctx.arc(1620,356,7+3*Math.sin(u*Math.PI),0,Math.PI*2);ctx.fill();ctx.font=`22px ${sans}`;ctx.fillStyle='#cfb790';ctx.fillText('江海交汇',1500,308);}
    }
    ctx.restore();
  }

  function erasReveal(s,progress) {
    const old=artImages['bund_1930.jpg'], today=artImages['bund_from_swfc_bluehour.jpg'];
    if(!old || !today)return;
    cover(today,0,58,W,866,progress);
    const edge=W*(1-smooth((progress-.14)/.70));
    ctx.save();ctx.beginPath();ctx.rect(0,58,edge,866);ctx.clip();cover(old,0,58,W,866,progress);ctx.restore();
    if(edge>2 && edge<W-2){ctx.fillStyle='#d7c4a0';ctx.fillRect(edge,58,1,866);}
    gradient(0,620,W,304,'rgba(3,8,14,0)','rgba(3,8,14,.75)');
    tracking('THEN / NOW · 历史与当代视角对照',110,677,4,`15px ${sans}`,'#c9b48f');
    ctx.fillStyle='#eee7db';ctx.font=`78px ${serif}`;ctx.fillText('同一条江，新的天际线。',104,786);
    ctx.font=`19px ${sans}`;ctx.fillStyle='#b1bdc4';ctx.fillText('外滩历史影像 / 当代黄浦江实景',110,843);
  }
  window.renderAt = function(t) {
    configure();
    activeTime=clamp(t,0,beats[beats.length-1].end);
    activeShot=shots.find(s=>activeTime>=s.start && activeTime<s.end)||shots[shots.length-1];
    activeChapter=Math.max(0,chapterStarts.findLastIndex(s=>activeTime>=s.start));
    const s=activeShot, progress=clamp((activeTime-s.start)/(s.end-s.start));
    legacyRender(activeTime);
    // Subtitle corrections follow speech without moving the approved camera path.
    const audioTime=window.V8_AUDIO_TIME??activeTime;
    const audioBeats=window.V8_SUBTITLES||beats;
    const b=audioBeats.find(beat=>audioTime>=beat.display_start && audioTime<beat.display_end);
    window.V8_FRAME_STATE={audioTime,visualTime:activeTime,subtitleId:b?.id??null};
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#080e15';ctx.fillRect(0,0,W,H);
    const isCosmic=window.EDITORIAL.at(activeTime).kind==='cosmic';
    const stage=window.EDITORIAL.at(activeTime);
    if(window.V8_FRAME_STATE)Object.assign(window.V8_FRAME_STATE,{stageStart:stage.start,kind:stage.kind,target:stage.target});
    if(stage.kind==='cosmic')cosmic(s,progress);
    else if(stage.kind==='coastline')coastline(clamp((activeTime-stage.start)/(stage.end-stage.start)));
    else if(['journey','origin','hu','rivers','year'].includes(stage.kind))editorialGraphic(stage);
    else if(stage.kind==='eras')erasReveal(s,progress);
    else if(stage.kind==='photo')window.EDITORIAL.photo(ctx,activeTime,stage);
    else ctx.drawImage(webglCanvas,0,0);
    if(!['cosmic','coastline','eras','journey','origin','hu','rivers','year'].includes(stage.kind)){
      gradient(0,58,W,140,'rgba(5,11,19,.54)','rgba(5,11,19,0)');
      ctx.save();ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=8;
      ctx.font=`26px ${serif}`;ctx.fillStyle='#eee7da';ctx.fillText(stage.label,110,112);
      ctx.font=`15px ${sans}`;ctx.fillStyle='#c1c8c8';ctx.fillText(stage.kind==='photo'?window.EDITORIAL.credit(stage):'空间与形制生成示意 · 非历史实测复原',112,143);ctx.restore();
    }
    const introElapsed=activeTime-chapterStarts[activeChapter].start;
    if(activeChapter>0&&introElapsed<4.2)chapterTitle(activeChapter,smooth(introElapsed/.6)*(1-smooth((introElapsed-2.8)/1.4)));
    // Wide cinema aperture with shared bilingual subtitle baseline.
    ctx.fillStyle='#080e15';ctx.fillRect(0,0,W,58);ctx.fillRect(0,924,W,H-924);
    tracking('上 海 / 城 市 纪 事',110,36,2,`14px ${sans}`,'#9ba8af');
    ctx.save();ctx.textAlign='right';ctx.font=`13px "Segoe UI", sans-serif`;ctx.fillStyle='#788994';
    ctx.fillText(isCosmic?'31°14′ N / 121°29′ E':`0${activeChapter} / ${chapters[activeChapter][2]}`,W-110,36);ctx.restore();
    if(b)subtitles(b);
    // A quiet chapter progress mark replaces the animated karaoke box.
    ctx.fillStyle='#303b46';ctx.fillRect(110,1044,W-220,1);
    ctx.fillStyle='#b6996a';ctx.fillRect(110,1044,(W-220)*activeTime/beats[beats.length-1].end,1);
    for(const c of chapterStarts){const x=110+(W-220)*c.start/beats[beats.length-1].end;ctx.fillStyle='#56616c';ctx.fillRect(x,1041,1,7);}
    const tail=beats[beats.length-1].end-activeTime;
    if(activeTime<.55 || tail<1){ctx.fillStyle=`rgba(3,8,15,${activeTime<.55?1-smooth(activeTime/.55):1-smooth(tail)})`;ctx.fillRect(0,0,W,H);}
  };
  // Also load curated assets that were absent from the legacy beat list.
  window.CINEMATIC_READY = false;
  const preload=[...Object.values(curated).map(item=>item[0]),...window.EDITORIAL_TIMELINE.filter(s=>s.kind==='photo').map(s=>s.target)];
  Promise.all([...new Set(preload)].map(name=>new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>{artImages[name]=img;resolve();};img.onerror=()=>reject(new Error('Missing cinematic asset: '+name));img.src=name.startsWith('nasa_')?'/video_jobs/narration_voice_v10_20261101/images/'+name:'images/'+name;
  }))).then(async()=>{
    while(!window.STUDIO_READY)await new Promise(r=>setTimeout(r,30));
    await document.fonts.ready;
    window.CINEMATIC_READY=true;
  }).catch(error=>{window.CINEMATIC_ERROR=String(error);console.error(error);});
})();
