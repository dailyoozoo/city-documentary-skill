/* V7 hero geometry. All shapes are interpretive, not surveyed reconstructions. */
(() => {
'use strict';
const T=THREE,M=()=>OLD_CITY_MODELS;
const col=h=>new T.Color(h).convertSRGBToLinear();
const mats={};
function mat(n,h,metal=0,rough=.78){return mats[n]||(mats[n]=new T.MeshStandardMaterial({color:col(h),metalness:metal,roughness:rough}));}
function add(g,geo,material,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function box(g,w,h,d,x,y,z,m){return add(g,new T.BoxGeometry(w,h,d),m,x,y,z);}
function beam(g,a,b,r,material){const av=new T.Vector3(...a),bv=new T.Vector3(...b),dir=bv.clone().sub(av);const m=add(g,new T.CylinderGeometry(r,r,dir.length(),8),material,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return m;}
function empty(g){while(g.children.length)g.remove(g.children[0]);}
function polyBox(g){g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g);return [[b.min.x,b.min.z],[b.max.x,b.min.z],[b.max.x,b.max.z],[b.min.x,b.max.z]];}
function pointInside(p,waters){return waters.some(w=>M().pointInPolygon(p,w));}
function waterFootprint(poly,waters){return poly.every((p,i)=>Array.from({length:13},(_,j)=>{const q=poly[(i+1)%poly.length];return pointInside([p[0]+(q[0]-p[0])*j/12,p[1]+(q[1]-p[1])*j/12],waters);}).every(Boolean));}
function bankAt(z,waters){const xs=[];for(const w of waters)for(let i=0;i<w.length-1;i++){const a=w[i],b=w[i+1];if((a[1]>z)!=(b[1]>z)){const x=a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]);if(x>-1800&&x<1400)xs.push(x);}}return Math.min(...xs);}
function hull(g,w,l,h,material){const s=new T.Shape();s.moveTo(0,-l/2);s.bezierCurveTo(-w*.40,-l*.47,-w*.51,-l*.30,-w/2,-l*.12);s.lineTo(-w*.45,l*.38);s.quadraticCurveTo(0,l*.49,w*.45,l*.38);s.lineTo(w/2,-l*.12);s.bezierCurveTo(w*.51,-l*.30,w*.40,-l*.47,0,-l/2);const geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.5,bevelThickness:.5,curveSegments:18});geo.rotateX(-Math.PI/2);return add(g,geo,material,0,1,0);}
function junk(){const g=new T.Group(),wood=mat('wood',0x654c37),dark=mat('dark',0x292c29),sail=mat('sail',0xc1ac84),rope=mat('rope',0x706353);
 hull(g,11,35,3.6,wood);box(g,9.5,.5,29,0,4.8,0,mat('deck',0x99866a));box(g,8,4,7,0,6.6,-10,wood);box(g,8.6,.55,8,0,8.7,-10,dark);
 for(const [z,h,w] of [[-7,20,10],[3,26,14],[12,16,8]]){beam(g,[0,4,z],[0,h+5,z],.23,wood);const positions=[],indices=[];for(let iy=0;iy<=8;iy++)for(let ix=0;ix<=6;ix++){const u=iy/8,v=ix/6;positions.push((v-.5)*w*(1-.4*u),7+u*(h-2),z+Math.sin(v*Math.PI)*1.6);}
 for(let y=0;y<8;y++)for(let x=0;x<6;x++){const a=y*7+x;indices.push(a,a+1,a+8,a,a+8,a+7);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();sail.side=T.DoubleSide;add(g,geo,sail);for(let r=0;r<9;r++){const u=r/8,yy=7+u*(h-2),ww=w*(1-.4*u);beam(g,[-ww/2,yy,z],[ww/2,yy,z],.08,wood);}beam(g,[0,h+5,z],[4.7,5,14],.06,rope);beam(g,[0,h+5,z],[-4.7,5,-14],.06,rope);}
 for(const x of [-4.8,4.8]){beam(g,[x,5.8,-13],[x,5.8,13],.10,dark);for(let z=-12;z<=12;z+=4)beam(g,[x,4.8,z],[x,5.8,z],.08,dark);}return g;}
function freighter(g){empty(g);const steel=mat('hull',0x344a54,.38,.53),red=mat('rust',0x80503d,.22,.72),ivory=mat('ivory',0xb6b9ac,.18,.65),dark=mat('glassDark',0x233941,.4,.35);
 hull(g,25,136,12,steel);box(g,22,1,113,0,13.5,0,red);
 for(let z=-8;z<48;z+=19){box(g,16,1.7,14,0,15,z,ivory);for(let x=-7;x<=7;x+=2)box(g,.17,.15,13,x,15.95,z,steel);}
 for(let i=0;i<3;i++){const w=21-i*1.6,d=25-i*1.8,y=17+i*4.4;box(g,w,4.2,d,0,y,-35,ivory);for(let x=-8;x<=8;x+=3.2)box(g,1.8,1.1,.14,x,y+.5,-35+d/2+.1,dark);for(let z=-43;z<=-27;z+=3.2)for(const x of [-1,1])box(g,.14,1.1,1.8,x*(w/2+.1),y+.5,z,dark);box(g,w+1,.3,d+1,0,y+2.25,-35,steel);}
 add(g,new T.CylinderGeometry(3.1,3.6,11,18),red,0,35,-40);add(g,new T.CylinderGeometry(3.2,3.2,1.5,18),dark,0,40.5,-40);
 for(const z of [-13,29]){beam(g,[0,14,z],[0,34,z],.5,ivory);beam(g,[0,31,z],[7,23,z+13],.4,ivory);beam(g,[0,34,z],[7,23,z+13],.065,dark);beam(g,[7,23,z+13],[7,15,z+13],.06,dark);}
 for(const x of [-10.7,10.7]){beam(g,[x,15,-54],[x,15,49],.13,ivory);for(let z=-53;z<50;z+=4)beam(g,[x,13.7,z],[x,15,z],.10,ivory);}
 beam(g,[0,28,-27],[0,40,-27],.18,steel);beam(g,[-5,35,-27],[5,35,-27],.14,steel);
}
function terrace(g,w=42,d=16,h=14){empty(g);const brick=mat('terraceBrick',0x77614f),stone=mat('terraceStone',0xb9b4a5),roof=mat('terraceRoof',0x454c47),glass=mat('terraceGlass',0x283b3c),timber=mat('terraceTimber',0x3d3d34);
 box(g,w+1,.6,d+1,0,.3,0,stone);box(g,w,h,d,0,h/2+.6,0,brick);
 const joints=[];for(let y=1;y<h;y+=.65)joints.push(M().box(w,.035,.07,0,y,d/2+.04));for(let x=-w/2+.6;x<w/2;x+=1.2)joints.push(M().box(.022,h,.07,x,h/2,d/2+.04));g.add(M().mesh(joints,mat('mortar',0x9c9380),'Brick courses'));
 for(const x of [-w*.32,w*.32])for(const y of [4.0,10.1]){box(g,4.3,4.4,.25,x,y,d/2+.15,stone);box(g,3.5,3.7,.28,x,y+.05,d/2+.3,glass);box(g,.15,3.8,.25,x,y,d/2+.5,timber);box(g,3.5,.15,.25,x,y,d/2+.5,timber);box(g,4.7,.4,.75,x,y-2.25,d/2+.3,stone);}
 // Recessed dark double door with raised, contrasting stone portal and lintel.
 box(g,4.7,6.3,.3,0,3.6,d/2+.17,timber);for(const x of [-2.7,2.7])box(g,.65,6.6,.8,x,3.8,d/2+.35,stone);box(g,6.5,.85,1.0,0,7.4,d/2+.4,stone);box(g,7.1,.3,1.35,0,8.0,d/2+.4,stone);box(g,.08,6.1,.2,0,3.6,d/2+.42,stone);
 box(g,8.5,.35,2.8,0,.18,d/2+1,stone);box(g,7.1,.3,1.8,0,.51,d/2+.65,stone);box(g,6.1,.45,.5,0,8.5,d/2+.4,brick);box(g,3.2,.55,.35,0,9,d/2+.36,stone);for(const x of [-2.1,2.1])box(g,.45,.5,.5,x,8.4,d/2+.4,stone);
 for(const y of [1.8,4.4])for(const x of [-1.25,1.25])box(g,1.7,1.7,.14,x,y,d/2+.38,mat('doorPanel',0x525446));
 box(g,w+.5,.35,d+.5,0,h+.65,0,stone);box(g,w,.18,.4,0,7.9,d/2+.18,stone);
 const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,4);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:d+1,bevelEnabled:false});add(g,geo,roof,0,h+.9,-d/2-.5);beam(g,[-w/2,h+.9,0],[0,h+4.9,0],.17,roof);beam(g,[0,h+4.9,-d/2-.6],[0,h+4.9,d/2+.6],.20,stone);
 for(const x of [-w/2,w/2])box(g,.4,3.8,d,x,h+2.1,0,brick);
}
function twistTower(g){empty(g);const glass=mat('towerGlass',0x65818b,.55,.37),edge=mat('towerEdge',0x9eaeb1,.42,.42);const N=72,K=48,H=632;
 function point(u,v,rOffset=0){const r=(46-24*u)*(1+.095*Math.cos(3*v))+rOffset,a=v+u*Math.PI*2/3;return [r*Math.cos(a),H*u,r*Math.sin(a)];}
 for(let k=0;k<K;k++){const pos=[],uv=[],idx=[];for(let j=0;j<=3;j++)for(let i=0;i<=N;i++){const u=(k+j/3)/K,v=i/N*Math.PI*2;pos.push(...point(u,v));uv.push(i/N,u);}for(let j=0;j<3;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+N+1,a+1,a+1,a+N+1,a+N+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();add(g,geo,glass);
 const details=[];for(let level=1;level<=3;level++){const u=(k+level/3)/K;details.push(M().tube(Array.from({length:N+1},(_,i)=>point(u,i/N*Math.PI*2,.18)),.18,N));}
 for(let i=0;i<24;i++)details.push(M().tube([point(k/K,i/24*Math.PI*2,.2),point((k+.5)/K,i/24*Math.PI*2,.2),point((k+1)/K,i/24*Math.PI*2,.2)],.21,4));g.add(M().mesh(details,edge,'Continuous spiral mullions '+k));}
 const cap=add(g,new T.CylinderGeometry(22,22,.9,72),edge,0,H-.45,0);g.userData.reveal='segmented-continuous-envelope';
}
function swfc(g){empty(g);const metal=mat('swfcGlass',0x64808c,.58,.35),edge=mat('swfcEdge',0xa3b3b7,.48,.35);const outline=new T.Shape();outline.moveTo(-31,0);outline.lineTo(31,0);outline.lineTo(25,492);outline.lineTo(-25,492);outline.closePath();const hole=new T.Path();hole.moveTo(-17,437);hole.lineTo(-13,477);hole.lineTo(13,477);hole.lineTo(17,437);hole.closePath();outline.holes.push(hole);const geo=new T.ExtrudeGeometry(outline,{depth:47,bevelEnabled:false});add(g,geo,metal,0,0,-23.5);
 const bars=[];for(let y=4;y<492;y+=5){const w=62-12*y/492;for(const z of [-23.65,23.65]){if(y>437&&y<478){for(const x of [-1,1])bars.push(M().box(6,.20,.24,x*(w/2-3),y,z));}else bars.push(M().box(w,.20,.24,0,y,z));}}
 for(const z of [-23.8,23.8])for(const x of [-1,1])bars.push(M().tube([[x*31,0,z],[x*25,492,z]],.42,3));g.add(M().mesh(bars,edge,'Facade mullions'));g.userData.reveal='whole-height';
}
function build(revision,hidden,audit){const waters=revision.waters;
 // Calm background, no emissive candy colours. Separate materials remain distinct.
 for(const o of dynamicBuildings)if(o.userData.polygon){o.material=new T.MeshStandardMaterial({color:new T.Color(o.userData.birth_year<1949?0x989990:0x617581),roughness:.94,metalness:.02});}
 const seen=new Set();for(const o of cityGroup.children){if(o===revision.environment||o===revision.modelGroup||o===revision.gardenGroup||o===revision.wallTrace)continue;o.traverse(m=>{if(!m.isMesh)return;for(const material of Array.isArray(m.material)?m.material:[m.material]){if(!material||seen.has(material)||material.isShaderMaterial)continue;seen.add(material);if(material.color)material.color.convertSRGBToLinear();if(material.emissive)material.emissive.setHex(0);material.emissiveIntensity=0;}});}
 // Replace source port with individually placed warehouses, wooden piers, and complete sailboats.
 empty(shiliupuGroup);const ships=[],warehouses=[];
 for(let i=0;i<7;i++){const z=655+i*65,x=bankAt(z,waters);const warehouse=M().house(25,31,9,4,i,true);warehouse.position.set(x-65,0,z);while(M().landClearance(polyBox(warehouse),waters)<6)warehouse.position.x-=5;shiliupuGroup.add(warehouse);warehouses.push(warehouse);
 box(shiliupuGroup,70,1.3,10,x-10,2,z,mat('pierWood',0x716350));for(let q=-36;q<=20;q+=14)for(const dz of [-4,4])box(shiliupuGroup,1.0,4,1.0,x+q,0,z+dz,mat('pierPile',0x454b43));}
 for(let i=0;i<18;i++){const z=638+(i%6)*77,x=bankAt(z,waters)+80+Math.floor(i/6)*67,g=junk();g.position.set(x,0,z);if(!waterFootprint(polyBox(g),waters))throw new Error('Junk outside closed river '+i);shiliupuGroup.add(g);ships.push(g);}
 const vessel=landmarkGroups.freighter;freighter(vessel);
 for(const [key,g] of Object.entries(landmarkGroups)){if(!key.startsWith('gantry_'))continue;empty(g);const red=mat('gantryPaint',0x9f654d,.28,.65),steel=mat('gantrySteel',0x5a6466,.45,.53);for(const x of [-38,38]){box(g,5,82,8,x,41,0,red);box(g,10,3,24,x,1.5,0,steel);for(const z of [-9,9])beam(g,[x,2,z],[x,50,0],1.0,red);}box(g,94,8,12,0,84,0,red);box(g,96,.65,14,0,88.3,0,steel);for(let x=-44;x<44;x+=11){beam(g,[x,81,6.3],[x+11,87,6.3],.5,steel);beam(g,[x,87,6.3],[x+11,81,6.3],.5,steel);}box(g,12,3,10,8,79,0,steel);for(const x of [6,10])beam(g,[x,78,0],[x,42,0],.19,steel);box(g,6,2.5,4,8,41,0,red);}
 // Row-house geometry now includes stone portals, brick courses, windows and doors.
 for(const g of dynamicBuildings){if(g.isGroup&&g.userData.birth_year>=1912&&g.userData.birth_year<=1934&&g.position.x<-1400&&g.position.x>-1790&&g.position.z>-170&&g.position.z<470)terrace(g);}
 terrace(landmarkGroups.cpc_site,46,24,14);
 // Remove estimated source blocks wherever they collide with the featured architectural sites.
 const zones=[[-1835,-1360,-200,515],[-1340,-1090,-380,90],[-400,-140,-555,-310],[235,550,-5,375],[-1040,-750,425,650]];
 for(const o of dynamicBuildings){if(!o.userData.polygon)continue;const b=new T.Box3().setFromObject(o);if(zones.some(([x0,x1,z0,z1])=>b.min.x<x1&&b.max.x>x0&&b.min.z<z1&&b.max.z>z0)){hidden.add(o);audit.push({type:'context_occlusion',id:o.userData.id,action:'hidden'});}}
 // Bridge geometry is visibly cable-stayed and actually spans both banks of this river surface.
 const bridge=landmarkGroups.cross_bridge;bridge.position.x=-305;bridge.scale.x=1.4;
 const bridgeSteel=mat('bridgeSteel',0xb4b8ad,.3,.7),cables=mat('bridgeCables',0x718087,.45,.5);bridge.traverse(m=>{if(m.isMesh)m.material=bridgeSteel;if(m.isLineSegments)m.visible=false;});
 const cableGeo=[];for(const px of [-160,160])for(const d of [25,47,69,91,113,135])for(const sign of [-1,1])for(const z of [-10,10])cableGeo.push(M().tube([[px,128,z],[px+sign*d,48,z]],.34,2));bridge.add(M().mesh(cableGeo,cables,'Visible steel stay cables'));
 for(const key of ['peace_hotel','customs_house','hsbc']){const g=landmarkGroups[key];g.traverse(m=>{if(!m.isMesh)return;if(m.material.color&&m.geometry.type==='BoxGeometry'){m.material=m.material.clone();m.material.color.copy(col(0xaba58d));m.material.emissiveIntensity=0;}});}
 // Neutral silver/gold-grey Jin Mao and dark-rose Pearl instead of emissive colors.
 landmarkGroups.jin_mao.traverse(m=>{if(m.isMesh)m.material=mat('jinmaoSilver',0xa6a398,.5,.48);});
 const ribs=[];for(let k=0;k<16;k++){const w=48-k*2.1,y=k*385/16;for(let floor=1;floor<=6;floor++)ribs.push(M().box(w+.35,.30,w+.35,0,y+floor*385/16/6,0));}landmarkGroups.jin_mao.add(M().mesh(ribs,mat('jinmaoTrim',0x646f73,.48,.45),'Setback floor bands'));
 landmarkGroups.oriental_pearl.traverse(m=>{if(m.isMesh)m.material=mat(m.geometry.type==='SphereGeometry'?'pearlRose':'pearlSilver',m.geometry.type==='SphereGeometry'?0x9b7376:0xb7bbb5,.48,.42);});
 twistTower(landmarkGroups.shanghai_tower);swfc(landmarkGroups.swfc);
 for(const [key,g] of Object.entries(landmarkGroups))g.userData.v7Scale=g.scale.clone();
 audit.push({type:'port_placement',warehouse_count:warehouses.length,warehouse_water_overlap:warehouses.filter(g=>M().landClearance(polyBox(g),waters)<0).length,junk_count:ships.length,junks_outside_water:ships.filter(g=>!waterFootprint(polyBox(g),waters)).length});
 return {ships,warehouses,bankAt:z=>bankAt(z,waters),waterFootprint:p=>waterFootprint(p,waters),polyBox,mat};
}
window.V7_HERO={build};
})();
