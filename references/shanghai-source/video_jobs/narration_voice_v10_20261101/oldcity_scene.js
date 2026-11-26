/* The revised scene is isolated from the V6 delivery and from demo v01. */
(() => {
  'use strict';
  window.createOldCityRevision = () => {
    const M=window.OLD_CITY_MODELS,T=THREE,center=new T.Vector3(-1320,0,950);
    const parts=[],plots=[],wallParts=[],landAudit=[],gateAudit=[];
    const clamp=v=>Math.max(0,Math.min(1,v));
    const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
    const rise=(t,a,b)=>smooth((t-a)/(b-a));
    M.initMaterials();
    window.CINEMATIC_COMPOSITOR=true;
    renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    scene.background.setHex(0x879797);scene.fog.color.copy(scene.background);scene.fog.density=.000075;
    ambientLight.intensity=.25;hemiLight.intensity=.70;hemiLight.color.setHex(0xd1dee6);hemiLight.groundColor.setHex(0x74634b);
    sunLight.intensity=1.60;sunLight.color.setHex(0xffe4c5);sunLight.position.set(-2200,3200,1900);
    sunLight.target.position.copy(center);scene.add(sunLight.target);sunLight.castShadow=true;
    sunLight.shadow.mapSize.set(4096,4096);
    Object.assign(sunLight.shadow.camera,{left:-1250,right:1250,top:1250,bottom:-1250,near:100,far:7000});
    sunLight.shadow.camera.updateProjectionMatrix();sunLight.shadow.normalBias=.48;sunLight.shadow.bias=-.00012;
    rimLight.intensity=.35;rimLight.color.setHex(0xb0c7d2);warmPointLight.intensity=.05;
    globeGroup.visible=false;
    const originalHouses=dynamicBuildings.filter(o=>o.isGroup&&o.children.length===3&&o.userData.birth_year<1640);
    for(const obj of cityGroup.children)obj.visible=false;
    cityGroup.visible=true;
    const environment=new T.Group();environment.name='Closed-bank terrain';cityGroup.add(environment);
    const modelGroup=new T.Group();modelGroup.name='Refined old-city models';cityGroup.add(modelGroup);
    const gardenGroup=new T.Group();gardenGroup.name='Garden revision';gardenGroup.position.set(-1266,0,851);cityGroup.add(gardenGroup);
    const earth=M.texture('earth');earth.repeat.set(380,380);
    const ground=new T.Mesh(new T.PlaneGeometry(32000,32000),new T.MeshStandardMaterial({color:0xaaa693,map:earth,roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.position.y=-1.4;ground.receiveShadow=true;environment.add(ground);
    // Only closed, bounded OSM water areas are surfaces. Never fill a river centerline.
    const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
    const isClosed=poly=>poly&&poly.length>3&&poly[0][0]===poly[poly.length-1][0]&&poly[0][1]===poly[poly.length-1][1];
    const waterData=cmabData.waterways.filter(w=>isClosed(w.coordinates)&&area(w.coordinates)>30000);
    const waters=waterData.map(w=>w.coordinates);
    const waterMat=new T.ShaderMaterial({
      uniforms:{time:{value:0}},side:T.DoubleSide,
      vertexShader:'varying vec3 wp;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
      fragmentShader:'uniform float time;varying vec3 wp;void main(){float s=sin(wp.x*.14+wp.z*.034-time*.55)*sin(wp.z*.11-time*.37);float n=sin(wp.x*.019-wp.z*.06+time*.24);vec3 c=vec3(.06,.115,.12)+n*.006+pow(max(0.,s),12.)*vec3(.10,.13,.13);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'
    });
    const bankGeometries=[];
    for(const w of waterData){
      const shape=new T.Shape(w.coordinates.map(p=>new T.Vector2(...p)));
      const mesh=new T.Mesh(new T.ShapeGeometry(shape),waterMat);mesh.rotation.x=Math.PI/2;mesh.position.y=.1;
      mesh.name='OSM closed water area '+w.id;environment.add(mesh);
      // A narrow stone bank follows the original coordinates, not a hand-drawn spline.
      for(let i=0;i<w.coordinates.length-1;i++){
        const a=w.coordinates[i],b=w.coordinates[i+1],len=Math.hypot(a[0]-b[0],a[1]-b[1]);
        if(len<.1||len>250)continue;
        if(Math.max(a[0],b[0])<-3200||Math.min(a[0],b[0])>1900||Math.max(a[1],b[1])<-1500||Math.min(a[1],b[1])>2600)continue;
        bankGeometries.push(M.box(2.3,.8,len+.3,(a[0]+b[0])/2,.35,(a[1]+b[1])/2,Math.atan2(b[0]-a[0],b[1]-a[1])));
      }
    }
    environment.add(M.mesh(bankGeometries,M.material('bankStone',0x8d9485),'Banks following OSM water boundaries'));
    const cityFloor=new T.Mesh(new T.CircleGeometry(503,128),new T.MeshStandardMaterial({color:0xb7ad92,roughness:1,map:M.texture('earth')}));
    cityFloor.rotation.x=-Math.PI/2;cityFloor.position.set(center.x,-.09,center.z);cityFloor.receiveShadow=true;environment.add(cityFloor);
    const roads=[];
    roads.push(M.box(18,.15,926,center.x,0,center.z),M.box(926,.15,18,center.x,0,center.z));
    for(let x=-400;x<=400;x+=46){const length=2*Math.sqrt(465*465-x*x);roads.push(M.box(3.5,.12,length,center.x+x,0,center.z));}
    for(let z=-380;z<=380;z+=42){const length=2*Math.sqrt(465*465-z*z);roads.push(M.box(length,.12,3.0,center.x,0,center.z+z));}
    environment.add(M.mesh(roads,M.material('laneStone',0x9a9483,.99,M.texture('stone')),'Paved lanes and main streets'));
    function register(mesh,start,duration,style='rise',category='building'){
      mesh.geometry.computeBoundingBox();mesh.material=mesh.material.clone();mesh.material.transparent=true;
      parts.push({mesh,start,duration,style,category,p:mesh.position.clone(),s:mesh.scale.clone(),min:mesh.geometry.boundingBox.min.y});
    }
    function registerGroup(group,start,category,spacing=.16){
      group.children.forEach((mesh,i)=>register(mesh,start+i*spacing,.85,i<2?'rise':'place',category));
    }
    // Wall spans leave actual openings at the six gates.
    const count=120,step=Math.PI*2/count,wallGeo=[],capGeo=[];
    for(let i=0;i<count;i++){
      const a=i*step,b=(i+1)*step,mid=(a+b)/2;
      const distanceToGate=Math.min(...Array.from({length:6},(_,g)=>Math.abs(Math.atan2(Math.sin(mid-g*Math.PI/3),Math.cos(mid-g*Math.PI/3)))));
      if(distanceToGate<.045)continue;
      const shape=new T.Shape();shape.moveTo(520*Math.cos(a),520*Math.sin(a));
      for(let j=1;j<=4;j++){const v=a+(b-a)*j/4;shape.lineTo(520*Math.cos(v),520*Math.sin(v));}
      for(let j=4;j>=0;j--){const v=a+(b-a)*j/4;shape.lineTo(506*Math.cos(v),506*Math.sin(v));}shape.closePath();
      const geo=new T.ExtrudeGeometry(shape,{depth:19.5,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,19.5,0);
      // Assign metre-scaled UVs rather than stretching one brick across an entire wall.
      const p=geo.attributes.position,u=geo.attributes.uv;
      for(let j=0;j<p.count;j++){const ang=Math.atan2(p.getZ(j),p.getX(j));u.setXY(j,ang*513/17,p.getY(j)/7);}
      const group=new T.Group();group.position.copy(center);modelGroup.add(group);
      group.add(new T.Mesh(geo,M.material('wallBrick',0x9b9d8d,.98,M.texture('brick'))));
      const caps=[];
      for(let j=0;j<2;j++){
        const v=a+step*(j+.5)/2;caps.push(M.box(5.2,3.5,5.5,517*Math.cos(v),21.25,517*Math.sin(v),Math.PI/2-v));
      }
      caps.push(M.box(10,1.1,step*513+.2,513*Math.cos(mid),19.5,513*Math.sin(mid),-mid));
      group.add(M.mesh(caps,M.material('wallCoping',0xb8b6a4),'Stone coping and crenellations'));
      group.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;}});
      wallParts.push({group,start:10.69+i/count*6.7,end:12.14+i/count*6.7});
    }
    const moat=new T.Mesh(new T.RingGeometry(528,550,144),waterMat);moat.rotation.x=-Math.PI/2;moat.position.set(center.x,.1,center.z);environment.add(moat);
    const moatBanks=[];
    for(const radius of [527,551]){
      const pts=Array.from({length:145},(_,i)=>[center.x+radius*Math.cos(i/144*Math.PI*2),.3,center.z+radius*Math.sin(i/144*Math.PI*2)]);
      moatBanks.push(M.tube(pts,.55,288));
    }
    const moatCoping=M.mesh(moatBanks,M.material('moatBank',0x9a9c89),'Moat stone edge');environment.add(moatCoping);
    const gates=[];
    for(let g=0;g<6;g++){
      const angle=g*Math.PI/3,gate=M.gate();gate.position.set(center.x+520*Math.cos(angle),0,center.z+520*Math.sin(angle));
      gate.rotation.y=-angle+Math.PI/2;modelGroup.add(gate);registerGroup(gate,18.4+g*.21,'gate',.075);gates.push(gate);
      const footprint=M.footprint(gate.position.x,gate.position.z,48,119,gate.rotation.y);
      gateAudit.push({gate:g+1,footprint,river_clearance:M.landClearance(footprint,waters)});
    }
    const tracePts=Array.from({length:241},(_,i)=>new T.Vector3(center.x+513*Math.cos(i/240*Math.PI*2),.22,center.z+513*Math.sin(i/240*Math.PI*2)));
    const wallTrace=new T.Line(new T.BufferGeometry().setFromPoints(tracePts),new T.LineBasicMaterial({color:0x796847,transparent:true,opacity:.7}));scene.add(wallTrace);
    originalHouses.sort((a,b)=>a.position.z-b.position.z||a.position.x-b.position.x);
    let rejected=0;
    const allowed=originalHouses.filter(old=>{
      const body=old.children[0],w=body.geometry.parameters.width,d=body.geometry.parameters.depth;
      const footprint=M.footprint(old.position.x,old.position.z,w*1.18+1,d*1.18+1,old.rotation.y);
      const clearance=M.landClearance(footprint,waters);
      const inside=footprint.every(p=>Math.hypot(p[0]-center.x,p[1]-center.z)<499);
      if(clearance<10||!inside){rejected++;return false;}return true;
    });
    for(let i=0;i<allowed.length;i++){
      const old=allowed[i],body=old.children[0],w=body.geometry.parameters.width,d=body.geometry.parameters.depth,h=body.geometry.parameters.height;
      const roofH=old.children[2].position.y-h;
      const group=M.house(w,d,h,roofH,i,true);group.position.copy(old.position);group.rotation.copy(old.rotation);modelGroup.add(group);
      group.userData.parts.walls.material=group.userData.parts.walls.material.clone();
      group.userData.parts.walls.material.color.multiplyScalar(.87+(i%7)*.02);
      const footprint=M.footprint(group.position.x,group.position.z,group.userData.bounds.w,group.userData.bounds.d,group.rotation.y);
      landAudit.push({id:i+1,footprint,river_clearance:M.landClearance(footprint,waters),variant:i%3===0?'courtyard':'gable dwelling'});
      const bounds=group.userData.bounds;
      const floor=new T.Line(new T.BufferGeometry().setFromPoints([
        new T.Vector3(-bounds.w/2,.15,-bounds.d/2),new T.Vector3(bounds.w/2,.15,-bounds.d/2),
        new T.Vector3(bounds.w/2,.15,bounds.d/2),new T.Vector3(-bounds.w/2,.15,bounds.d/2),new T.Vector3(-bounds.w/2,.15,-bounds.d/2)
      ]),new T.LineBasicMaterial({color:0x74674e,transparent:true,opacity:.5}));group.add(floor);
      const f=i/Math.max(1,allowed.length-1),p=group.userData.parts;
      register(p.foundation,6.2+f*7,.9,'rise','house');register(p.walls,7.8+f*12.8,1.4,'rise','house');
      register(p.recesses,17.8+f*3.4,.65,'rise','house');register(p.joinery,18.0+f*3.4,.8,'rise','house');
      register(p.roof,21.1+f*2.0,.85,'place','house');if(p.tileRibs)register(p.tileRibs,21.5+f*2.0,.75,'place','house');register(p.ridge,21.8+f*2,.6,'place','house');
      plots.push({floor,start:3.3+f*5.6,group});
    }
    // Rebuild the garden using open galleries, timber joinery and actual rail posts.
    const pondShape=new T.Shape(),pondHole=new T.Path();
    const pondPoints=[];
    for(let i=0;i<=96;i++){
      const a=i/96*Math.PI*2,r=70+2.4*Math.sin(a*3)+1.5*Math.cos(a*5);
      pondPoints.push([r*Math.cos(a),r*Math.sin(a)]);
    }
    pondShape.setFromPoints(pondPoints.map(p=>new T.Vector2(p[0]*1.045,p[1]*1.045)));
    pondHole.setFromPoints(pondPoints.map(p=>new T.Vector2(...p)).reverse());pondShape.holes.push(pondHole);
    const coping=new T.Mesh(new T.ExtrudeGeometry(pondShape,{depth:1.25,bevelEnabled:false}),M.material('pondStone',0xb4b19b));
    coping.geometry.rotateX(Math.PI/2);coping.geometry.translate(0,1.1,0);coping.castShadow=coping.receiveShadow=true;gardenGroup.add(coping);register(coping,26.1,1.0,'rise','garden');
    const pond=new T.Mesh(new T.ShapeGeometry(new T.Shape(pondPoints.map(p=>new T.Vector2(...p)))),waterMat);pond.rotation.x=Math.PI/2;pond.position.y=.65;gardenGroup.add(pond);
    const bridgePts=[[-48,-42],[-34,-26],[-18,-34],[-6,-14],[0,0],[14,12],[6,28],[24,38],[38,26],[54,42]];
    const bridges=[];
    for(let i=0;i<9;i++){
      // The central platform replaces the bridge spans through its interior.
      if(i===3||i===4)continue;
      const a=bridgePts[i],b=bridgePts[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const bridge=M.bridgeSegment(length);bridge.position.set((a[0]+b[0])/2,5.2,(a[1]+b[1])/2);bridge.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
      gardenGroup.add(bridge);registerGroup(bridge,28.3+i*.12,'garden',.25);bridges.push(bridge);
    }
    const bridgeJoints=[];
    for(let i=1;i<bridgePts.length-1;i++){
      if(i>=3&&i<=5)continue;
      const a=bridgePts[i-1],b=bridgePts[i],c=bridgePts[i+1],la=Math.hypot(b[0]-a[0],b[1]-a[1]),lb=Math.hypot(c[0]-b[0],c[1]-b[1]);
      for(const side of [-1,1]){
        const x1=b[0]+side*2.4*(b[1]-a[1])/la,z1=b[1]-side*2.4*(b[0]-a[0])/la;
        const x2=b[0]+side*2.4*(c[1]-b[1])/lb,z2=b[1]-side*2.4*(c[0]-b[0])/lb;
        for(const y of [6.1,7.3])bridgeJoints.push(M.box(.28,.28,Math.hypot(x2-x1,z2-z1)+.15,(x1+x2)/2,y,(z1+z2)/2,Math.atan2(x2-x1,z2-z1)));
      }
    }
    const jointRails=M.mesh(bridgeJoints,M.material('timber',0x603a2b),'Continuous rails at bridge bends');gardenGroup.add(jointRails);register(jointRails,29.3,.75,'rise','garden');
    const stairs=[];
    for(const [x,z] of [bridgePts[0],bridgePts[bridgePts.length-1]]){
      const distance=Math.hypot(x,z),nx=x/distance,nz=z/distance;
      for(let i=0;i<8;i++){const height=(i+1)*.7;stairs.push(M.box(5.3,height,1.85,x+nx*(14-i*1.8),height/2,z+nz*(14-i*1.8),Math.atan2(nx,nz)));}
    }
    const shoreSteps=M.mesh(stairs,M.material('stone',0xb6b09b),'Steps connecting bridge deck to dry shore');gardenGroup.add(shoreSteps);register(shoreSteps,29.2,.85,'rise','garden');
    const pavilion=M.pavilion();gardenGroup.add(pavilion);
    pavilion.children.forEach((m,i)=>register(m,[28.8,29.6,31.2,31.2,31.8,32.4,32.8][i],.85,i<4?'rise':'place','garden'));
    const galleryConfigs=[{x:-82,z:0,w:13,d:58,h:8,rh:4.4},{x:84,z:-12,w:13,d:62,h:8.5,rh:4.8}];
    galleryConfigs.forEach((c,i)=>{
      const gallery=M.gallery(c.w,c.d,c.h,c.rh);gallery.position.set(c.x,0,c.z);gardenGroup.add(gallery);registerGroup(gallery,27.3+i*.4,'garden',.3);
    });
    for(const c of [{x:0,z:-88,w:56,d:22,h:10,rh:7},{x:-61,z:77,w:34,d:19,h:8,rh:5.5}]){
      const hall=M.house(c.w,c.d,c.h,c.rh,1,true);hall.position.set(c.x,0,c.z);gardenGroup.add(hall);registerGroup(hall,27.8,'garden',.14);
    }
    const rockGeos=[],leafGeos=[],trunks=[];
    let seed=715;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<25;i++){
      const r=2.6+rand()*3.7,g=new T.IcosahedronGeometry(r,2),p=g.attributes.position;
      for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),f=.83+.18*Math.sin(x*1.7+y*.8+z*1.2);p.setXYZ(j,x*f,y*f,z*f);}
      g.scale(1.0,.8+rand()*.5,.7+rand()*.4);g.computeVertexNormals();g.translate(-61+rand()*29,2+rand()*7,-65+rand()*18);rockGeos.push(g);
    }
    for(let i=0;i<14;i++){
      const x=-85+rand()*25,z=-68+rand()*30,h=8+rand()*7;trunks.push(M.box(.3,h,.3,x,h/2,z));
      for(let k=0;k<3;k++){const g=new T.IcosahedronGeometry(2.5+rand()*2.5,1);g.scale(1,.7,1);g.translate(x+rand()*3,h-1+k,z+rand()*3);leafGeos.push(g);}
    }
    const rocks=M.mesh(rockGeos,M.material('rock',0x8b8874),'Weathered garden rockery');gardenGroup.add(rocks);register(rocks,29.5,1.3,'rise','garden');
    const trees=M.mesh(leafGeos,M.material('leaf',0x5b7650),'Garden canopy');gardenGroup.add(trees);register(trees,29.9,1.0,'place','garden');
    const bamboo=M.mesh(trunks,M.material('bamboo',0x727957),'Bamboo stems');gardenGroup.add(bamboo);register(bamboo,29.6,.9,'rise','garden');
    // A planar pond reflection shows the actual pavilion and rails as they form.
    const ReflectionTarget=renderer.capabilities.isWebGL2?T.WebGLMultisampleRenderTarget:T.WebGLRenderTarget;
    const reflectionTarget=new ReflectionTarget(1920,1080,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
    const reflectionBackground=new T.Color(0x1b3737).convertSRGBToLinear();
    const reflectionCamera=new T.PerspectiveCamera(),textureMatrix=new T.Matrix4();
    const pondMaterial=new T.ShaderMaterial({
      uniforms:{time:{value:0},reflection:{value:reflectionTarget.texture},textureMatrix:{value:textureMatrix}},side:T.DoubleSide,
      vertexShader:'uniform mat4 textureMatrix;varying vec4 mirrorCoord;varying vec3 wp;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;mirrorCoord=textureMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}',
      fragmentShader:'uniform float time;uniform sampler2D reflection;varying vec4 mirrorCoord;varying vec3 wp;void main(){float wave=sin(wp.x*.28+time*.6)*sin(wp.z*.21-time*.35);vec2 uv=mirrorCoord.xy/mirrorCoord.w;uv+=vec2(wave*.0018,wave*.001);vec3 reflected=texture2D(reflection,uv).rgb;vec3 water=vec3(.045,.095,.10)+wave*.004;gl_FragColor=vec4(mix(water,reflected,.30),1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'
    });pond.material=pondMaterial;
    const waterPlane=new T.Plane(new T.Vector3(0,1,0),-.66);
    let currentTime=0;
    function reflect(viewCamera){
      if(currentTime<28.2)return;
      pondMaterial.uniforms.time.value=currentTime;
      const direction=viewCamera.getWorldDirection(new T.Vector3()),target=viewCamera.position.clone().add(direction);
      reflectionCamera.copy(viewCamera);reflectionCamera.position.y=1.3-viewCamera.position.y;target.y=1.3-target.y;
      reflectionCamera.up.set(0,-1,0);reflectionCamera.lookAt(target);reflectionCamera.updateMatrixWorld(true);
      textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
      textureMatrix.multiply(reflectionCamera.projectionMatrix).multiply(reflectionCamera.matrixWorldInverse);
      const previousTarget=renderer.getRenderTarget(),previousPlanes=renderer.clippingPlanes;
      const previousShadow=renderer.shadowMap.autoUpdate,visible=pond.visible,previousBackground=scene.background;
      scene.background=reflectionBackground;
      pond.visible=false;renderer.clippingPlanes=[waterPlane];renderer.shadowMap.autoUpdate=false;
      renderer.setRenderTarget(reflectionTarget);renderer.clear();window.V7_NATIVE_RENDER(scene,reflectionCamera);
      renderer.setRenderTarget(previousTarget);renderer.clippingPlanes=previousPlanes;renderer.shadowMap.autoUpdate=previousShadow;pond.visible=visible;scene.background=previousBackground;
    }
    // Convert each source sRGB colour once. Textures already carry sRGB metadata.
    const materials=new Set();
    for(const root of [environment,modelGroup,gardenGroup,wallTrace])root.traverse(o=>{
      if(!o.material)return;for(const mat of Array.isArray(o.material)?o.material:[o.material]){
        if(materials.has(mat))continue;materials.add(mat);if(mat.color)mat.color.convertSRGBToLinear();
      }
    });
    camera.near=1;camera.fov=42;camera.updateProjectionMatrix();
    const geometryReport={source:'Existing OSM closed water polygons in cmab_shanghai_3d.json',
      coordinate_system:'Local metres, X east, Z south; surface Shape rotation +PI/2 preserves Z',
      closed_water_areas:waterData.map(w=>({id:w.id,vertices:w.coordinates.length,area_m2:area(w.coordinates)})),
      open_water_ways_excluded:cmabData.waterways.filter(w=>!isClosed(w.coordinates)).map(w=>w.id),
      houses:landAudit,gates:gateAudit,rejected_house_footprints:rejected,required_river_clearance_m:10,
      min_house_river_clearance_m:Math.min(...landAudit.map(h=>h.river_clearance)),
      river_overlap_house_count:landAudit.filter(h=>h.river_clearance<0).length,
      garden_exception:'Water pavilion piers and zigzag bridge deliberately span the enclosed garden pond; houses are checked against river water only.',
      historical_accuracy:'Procedural spatial illustration; existing round city-wall and parcel layout are not surveyed historical footprints.'};
    function update(t){
      currentTime=t;
      waterMat.uniforms.time.value=t;wallTrace.geometry.setDrawRange(0,Math.floor(241*rise(t,1.4,10.69)));wallTrace.material.opacity=t<10.69?.72:.2;
      for(const p of wallParts){const u=rise(t,p.start,p.end);p.group.visible=u>0;p.group.scale.y=Math.max(.001,u);}
      moat.visible=moatCoping.visible=t>=18.67;moat.geometry.setDrawRange(0,Math.floor(144*rise(t,18.67,19.55))*6);
      for(const plot of plots){plot.floor.visible=t>=plot.start;plot.floor.material.opacity=t>=25.25?.06:.48;}
      pond.visible=t>=26.6;
      for(const p of parts){
        const u=rise(t,p.start,p.start+p.duration),m=p.mesh;m.visible=u>0;m.position.copy(p.p);m.scale.copy(p.s);
        if(p.style==='rise'){m.scale.y=p.s.y*Math.max(.001,u);m.position.y=p.p.y+p.min*p.s.y*(1-u);}
        else{m.scale.multiplyScalar(.97+.03*u);m.position.y+=3*(1-u);}
        m.material.opacity=clamp(u*2);
        const transparent=u<.999;if(m.material.transparent!==transparent){m.material.transparent=transparent;m.material.needsUpdate=true;}
      }
    }
    function audit(){return {houses:plots.length,house_meshes_visible:parts.filter(p=>p.category==='house'&&p.mesh.visible).length,
      walls_visible:wallParts.filter(p=>p.group.visible).length,garden_visible:parts.filter(p=>p.category==='garden'&&p.mesh.visible).length,
      gate_parts_visible:parts.filter(p=>p.category==='gate'&&p.mesh.visible).length,
      river_overlap_house_count:geometryReport.river_overlap_house_count,min_house_river_clearance_m:geometryReport.min_house_river_clearance_m,
      triangles:renderer.info.render.triangles,draw_calls:renderer.info.render.calls};}
    return {update,reflect,audit,geometryReport,environment,modelGroup,gardenGroup,wallTrace,moat,moatCoping,wallParts,gates,waters,originalHouses};
  };
})();
