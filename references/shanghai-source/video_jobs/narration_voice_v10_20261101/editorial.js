/* Full V7 editorial state: deterministic, isolated, no modifications to V6. */
(() => {
'use strict';
const T=THREE,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const timeline=window.EDITORIAL_TIMELINE;
let revision,hero,original=[],hidden=new Set(),bounds={},towerParts={},geometryAudit=[],contextBounds=new Map(),ready=false;
const towerStarts={oriental_pearl:345.86,jin_mao:358.98,swfc:373.28,shanghai_tower:384.58};
const towerDurations={oriental_pearl:7.4,jin_mao:8.3,swfc:6.0,shanghai_tower:7.4};
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
function at(t){return timeline.find(s=>t>=s.start&&t<s.end)||timeline[timeline.length-1];}
function fullBounds(group){group.updateMatrixWorld(true);return new T.Box3().setFromObject(group);}
function setup(){
 if(ready)return;ready=true;
 original=cityGroup.children.map(o=>({o,visible:o.visible}));
 revision=window.createOldCityRevision();
 for(const {o,visible} of original)o.visible=visible;
 // Original terrain and incorrectly filled river centre-lines are never rendered.
 for(const {o} of original){
   if(o.isGridHelper||o.geometry?.type==='PlaneGeometry'||o.material?.uniforms?.warm||o.geometry?.type==='TubeGeometry'&&o.material?.uniforms?.time)hidden.add(o);
 }
 hidden.add(mingOldCityGroup);for(const h of revision.originalHouses)hidden.add(h);
 // Cull source polygon buildings with any actual footprint overlap, not just centroids.
 for(const o of dynamicBuildings){
   const poly=o.userData.polygon;
   if(!poly||poly.length<3)continue;
   const clearance=OLD_CITY_MODELS.landClearance(poly,revision.waters);
   if(clearance<0){hidden.add(o);geometryAudit.push({type:'source_building',id:o.userData.id,action:'hidden',clearance});}
 }
 hero=V7_HERO.build(revision,hidden,geometryAudit);
 for(const [key,group] of Object.entries(landmarkGroups)){
  group.scale.copy(group.userData.v7Scale||new T.Vector3(1,1,1));bounds[key]=fullBounds(group);
 }
 // Check all remaining generated, land-based complexes conservatively using their full X/Z box.
 // Bridges, wharves and vessels deliberately span water; they are not houses.
 for(const o of dynamicBuildings){
  if(hidden.has(o)||o.userData.polygon)continue;
  const b=fullBounds(o);if(b.isEmpty())continue;
  const poly=[[b.min.x,b.min.z],[b.max.x,b.min.z],[b.max.x,b.max.z],[b.min.x,b.max.z]];
  if(OLD_CITY_MODELS.landClearance(poly,revision.waters)<0){hidden.add(o);geometryAudit.push({type:'procedural_building',action:'hidden',box:[b.min.toArray(),b.max.toArray()]});}
 }
 for(const [key,start] of Object.entries(towerStarts)){
  const g=landmarkGroups[key];towerParts[key]=[];
  g.traverse(m=>{if(!m.isMesh)return;m.geometry.computeBoundingBox();const b=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);towerParts[key].push({m,p:m.position.clone(),s:m.scale.clone(),bottom:b.min.y,top:b.max.y});});
 }
 // Shipyard and port source locations followed the discarded hand-drawn river.
 // Reposition these schematic complexes onto the actual closed-water bank used in V7.
 const M=OLD_CITY_MODELS;
 for(const key of Object.keys(landmarkGroups).filter(k=>k.startsWith('gantry_'))){
  const g=landmarkGroups[key],b=bounds[key];let dx=0;
  const poly=d=>[[b.min.x+d,b.min.z],[b.max.x+d,b.min.z],[b.max.x+d,b.max.z],[b.min.x+d,b.max.z]];
  while(M.landClearance(poly(dx),revision.waters)<8&&dx>-1200)dx-=10;
  g.position.x+=dx;bounds[key]=fullBounds(g);geometryAudit.push({type:'gantry',key,shift_x:dx,clearance:M.landClearance(poly(dx),revision.waters)});
 }
 for(const o of dynamicBuildings)if(o.userData.polygon)contextBounds.set(o,fullBounds(o));
 // Store fixed complete bounds. Camera framing never chases the growing model.
 bounds.garden=fullBounds(revision.gardenGroup);bounds.oldcity=new T.Box3(new T.Vector3(-1880,0,390),new T.Vector3(-760,60,1510));
 bounds.shikumen=new T.Box3(new T.Vector3(-1770,0,-160),new T.Vector3(-1400,20,460));bounds.shiliupu=fullBounds(shiliupuGroup);bounds.junks=fullBounds(hero.ships[2]);
 bounds.bund=new T.Box3(new T.Vector3(-1360,0,-530),new T.Vector3(-1100,100,180));
 bounds.skyline=new T.Box3(new T.Vector3(-320,0,-490),new T.Vector3(550,632,330));
 bounds.puxi=new T.Box3(new T.Vector3(-2050,0,-700),new T.Vector3(-1080,130,600));
 bounds.pudong_before=new T.Box3(new T.Vector3(-430,0,-550),new T.Vector3(700,15,530));bounds.avenue=bounds.pudong_before;
 bounds.gantry=new T.Box3();for(const k of Object.keys(bounds).filter(k=>k.startsWith('gantry_')))bounds.gantry.union(bounds[k]);
 bounds.shipyard=bounds.gantry.clone();
 camera.near=1;camera.fov=42;camera.updateProjectionMatrix();
 // Use larger shadow coverage on the full-city edition, avoiding camera-dependent popping.
 sunLight.shadow.mapSize.set(2048,2048);Object.assign(sunLight.shadow.camera,{left:-3400,right:3400,top:3400,bottom:-3400,near:10,far:14000});sunLight.shadow.camera.updateProjectionMatrix();
}
function apply(t,stage){
 const old=t>=70.68&&t<117.64,cosmic=stage.kind==='cosmic';
 cityGroup.visible=!cosmic;globeGroup.visible=cosmic;
 for(const {o,visible} of original){if(!dynamicBuildings.includes(o)&&!Object.values(landmarkGroups).includes(o))o.visible=visible;}
 for(const o of hidden)o.visible=false;
 ancientDeltaGroup.visible=false;redPulseGroup.visible=false;laserScanGroup.visible=false;
 revision.environment.visible=!cosmic;
 revision.update(old?t-70.68:47);
 revision.modelGroup.visible=t>=70.68&&t<149.56;
 revision.gardenGroup.visible=t>=95.93;
 revision.wallTrace.visible=old;
 revision.moat.visible=revision.moatCoping.visible=t>=89.35&&t<149.56;
 if(old){for(const {o} of original)o.visible=false;}
 else {
  // Narrative time, rather than each subtitle's birth-year interpolation, determines completed state.
  let year=-4000;
  for(const b of beats){if(b.start>t)break;const previous=year;year=Math.max(year,previous+(b.era_max_year-previous)*smooth((t-b.start)/(b.end-b.start)));}
  for(const o of dynamicBuildings){if(hidden.has(o))continue;const birth=o.userData.birth_year||1990;o.visible=year>=birth;o.scale.y=1;}
  for(const [key,g] of Object.entries(landmarkGroups)){
   if(key==='yuyuan'){g.visible=false;continue;}
   if(key in towerStarts)continue;
   const birth=g.userData.birth_year||1990;g.visible=year>=birth;g.scale.copy(g.userData.v7Scale||new T.Vector3(1,1,1));
  }
  shiliupuGroup.visible=t>=60&&t<166;
  // A named observation task must have its object visible even if its estimated birth year differs.
  if(landmarkGroups[stage.target]&&!towerStarts[stage.target])landmarkGroups[stage.target].visible=true;
  if(['gantry','shipyard'].includes(stage.target))for(const k of Object.keys(landmarkGroups).filter(k=>k.startsWith('gantry_')))landmarkGroups[k].visible=true;
 }
 // Reserve the foreground for the named tower: source background blocks are estimated context,
 // not a second set of competing landmark models. Context outside the local footprint remains.
 if(stage.target in towerStarts){
  const center=bounds[stage.target].getCenter(new T.Vector3());
  for(const [o,b] of contextBounds){const c=b.getCenter(new T.Vector3());if(Math.hypot(c.x-center.x,c.z-center.z)<1200)o.visible=false;}
 }
 // Structural parts appear from low to high, then remain complete across subsequent cuts.
 for(const [key,start] of Object.entries(towerStarts)){
  const g=landmarkGroups[key],u=smooth((t-start+.8)/towerDurations[key]),height=bounds[key].max.y;
  g.visible=t>=start;g.scale.set(1,1,1);
  for(const p of towerParts[key]){
   const fraction=clamp((u*height-p.bottom)/Math.max(10,p.top-p.bottom));
   p.m.visible=u>=1||fraction>0;p.m.position.copy(p.p);p.m.scale.copy(p.s);
   // Child-local Y scaling anchored to the original lower face where axes are upright.
   if(fraction<1&&Math.abs(p.m.rotation.x)<.001&&Math.abs(p.m.rotation.z)<.001){
    const f=Math.max(.001,fraction);p.m.scale.y=p.s.y*f;p.m.position.y=p.p.y+p.m.geometry.boundingBox.min.y*p.s.y*(1-f);
   }
  }
 }
 // Solo structural studies suppress neighbouring towers without resetting their completed geometry.
 if(stage.target in towerStarts)for(const key of Object.keys(towerStarts))if(key!==stage.target)landmarkGroups[key].visible=false;
 const ship=landmarkGroups.freighter;
 if(ship){
  const z=420-160*clamp((t-295.5)/10.95),x=hero.bankAt(z)+170;
  ship.position.set(x,1,z);bounds.freighter=fullBounds(ship);
 }
 // Context fills the chapter's overview, without forcing later skyscrapers into earlier years.
 if(stage.target==='bund')for(const key of ['peace_hotel','customs_house','hsbc'])landmarkGroups[key].visible=true;
 const warm=t<319||t>=410;
 scene.background.setHex(cosmic?0x03080f:warm?0x73868d:0x648196);scene.fog.color.copy(scene.background);scene.fog.density=cosmic?0:.000095;
 ambientLight.intensity=.28;hemiLight.intensity=.65;hemiLight.groundColor.setHex(0x556069);sunLight.intensity=1.45;
 sunLight.color.setHex(warm?0xffe1ba:0xe1f0ff);sunLight.position.set(-2200,4200,2200);sunLight.target.position.set(-500,0,200);renderer.toneMappingExposure=1.05;
 if(old){renderer.toneMappingExposure=1.07;scene.fog.density=.000075;}
}
function cameraAt(t,s){
 if(s.p0){const u=smooth((t-s.start)/(s.end-s.start));camera.position.lerpVectors(new T.Vector3(...s.p0),new T.Vector3(...s.p1),u);camera.lookAt(new T.Vector3(...s.t0).lerp(new T.Vector3(...s.t1),u));}
 else{
  const b=(bounds[s.target]||bounds.skyline).clone(),center=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3());
  const u=clamp((t-s.start)/(s.end-s.start));const tower=s.target in towerStarts;
  let angle=.7+(u-.5)*.14,height=Math.max(size.y,22),wide=Math.max(size.x,size.z);
  if(['hsbc','peace_hotel','customs_house'].includes(s.target)){angle=1.25;wide=Math.max(size.x,size.z)*.8;}
  let dist=Math.max(height*1.82,wide*1.15,80);
  if(['oldcity','bund','puxi','pudong_before','avenue','skyline'].includes(s.target)){dist=Math.max(wide*1.4,height*2.1);}
  let elevation=['oldcity','puxi','pudong_before','avenue'].includes(s.target)?.75:.30;
  if(s.target==='garden'){dist=255;elevation=.34;center.set(-1266,12,851);}
  if(s.target==='shikumen'){dist=s.detail?140:590;elevation=s.detail?.18:.66;center.set(s.detail?-1733:-1600,9,s.detail?459:180);angle=s.detail?.12:.6;}
  if(s.target==='junks'){dist=s.detail?155:275;elevation=.30;angle=1.0;}
  if(s.target==='shiliupu'){dist=850;elevation=.64;angle=1.3;}
  if(s.target==='cpc_site'){dist=135;elevation=.24;angle=.18;}
  if(['gantry','shipyard'].includes(s.target)){dist=s.detail?280:400;elevation=.30;angle=.9;if(s.detail)center.copy(bounds.gantry_480.getCenter(new T.Vector3()));}
  if(s.target==='freighter'){dist=s.detail?205:275;elevation=.58;angle=1.15;}
  if(s.target==='cross_bridge'){dist=s.detail?780:1240;elevation=.5;angle=.45;}
  if(s.detail&&tower){dist=height*1.48;center.y=height*.60;}
  if(tower){angle=s.target==='jin_mao'?-.7:s.target==='swfc'?.24:1.7;elevation=.14;if(!s.detail){const growth=smooth((t-towerStarts[s.target]+.8)/towerDurations[s.target]);center.y=Math.max(height*.25,height*growth*.50);dist=height*(1.3+.62*growth);}}
  const swing=(u-.5)*.075,dir=new T.Vector3(Math.sin(angle+swing),elevation,Math.cos(angle+swing)).normalize();
  camera.position.copy(center).addScaledVector(dir,dist*(1-.035*u));camera.lookAt(center);
 }
 camera.updateMatrixWorld(true);
 // Reflection is expensive and meaningful only at pond scale.
 if(s.target==='garden'||s.kind==='oldcity'&&t>95.5)revision.reflect(camera);
}
function credit(s){
 if(s.target==='nasa_yangtze_2020.jpg')return 'NASA Ocean Color / Landsat 8 · 2020-08-16 · 现代卫星参照';
 if(s.target.startsWith('map_'))return '项目既有舆图 · 后世位置参照，不作为建筑近景';
 if(s.target.startsWith('ma_yuan')||s.target.startsWith('scroll_'))return '项目既有绘画 / 意象素材 · 非同期实景';
 if(/vintage|1930/.test(s.target))return '项目既有历史影像 · 动态裁切演绎';
 return '当代实景参照 · 不代表旁白年代的现场';
}
function photo(ctx,t,s){
 const im=artImages[s.target];if(!im?.naturalWidth)throw new Error('Missing editorial asset '+s.target);
 const u=clamp((t-s.start)/(s.end-s.start)),x=0,y=58,w=1920,h=866;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#17232c';ctx.fillRect(x,y,w,h);
 let sx=0,sy=0,sw=im.naturalWidth,sh=im.naturalHeight;
 if(s.detail){sw*=.73;sh*=.73;sx=(im.naturalWidth-sw)*(.45+u*.1);sy=(im.naturalHeight-sh)*.25;}
 // Full architecture is contained, never stretched or cover-cropped out of the frame.
 const portrait=sw/sh<1.35;
 if(portrait){
  const blur=Math.max(w/sw,h/sh);ctx.save();ctx.filter='blur(28px) brightness(.30)';ctx.drawImage(im,sx,sy,sw,sh,(w-sw*blur)/2,y+(h-sh*blur)/2,sw*blur,sh*blur);ctx.restore();
 }
 const scale=(portrait?Math.min((w-120)/sw,(h-30)/sh):Math.max(w/sw,h/sh))*(1+u*.025);
 ctx.drawImage(im,sx,sy,sw,sh,(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);ctx.restore();
}
function marineAudit(){
 const ship=landmarkGroups.freighter,p=ship.position.clone(),rows=[];
 for(let i=0;i<=120;i++){const t=295.5+i*10.95/120,z=420-160*i/120;ship.position.set(hero.bankAt(z)+170,1,z);rows.push({t,inside:hero.waterFootprint(hero.polyBox(ship))});}
 ship.position.copy(p);return {samples:rows.length,outside_count:rows.filter(r=>!r.inside).length,method:'13 points on each AABB edge, 121 positions along the complete 10.95-second sail'};
}
function audit(){
 return {oldcity:revision.geometryReport,excluded:geometryAudit,old_city_counts:revision.audit(),stage_count:timeline.length,
  source_water_area_count:revision.waters.length,hidden_object_count:hidden.size,
  marine_path_samples:marineAudit(),
  source_building_overlap_remaining:dynamicBuildings.filter(o=>o.userData.polygon&&!hidden.has(o)&&OLD_CITY_MODELS.landClearance(o.userData.polygon,revision.waters)<0).length,
  tower_parts:Object.fromEntries(Object.entries(towerParts).map(([k,v])=>[k,v.length])),
  caveat:'Procedural spatial illustration. OSM/current river boundaries are not historical surveying; bridges, piers and vessels intentionally span water.'};
}
window.EDITORIAL={setup,apply,at,camera:cameraAt,photo,credit,audit};
window.V7_AUDIT=()=>({geometry:audit(),stages:timeline.map(s=>({start:s.start,end:s.end,label:s.label,kind:s.kind,target:s.target}))});
})();
