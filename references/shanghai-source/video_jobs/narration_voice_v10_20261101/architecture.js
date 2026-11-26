/* Meter-scale procedural models for the isolated old-city revision.
 * Footprints are spatial illustrations, not a surveyed historical reconstruction.
 * Geometry is merged by construction phase to keep the film render practical.
 */
(() => {
  'use strict';
  const T = THREE;
  const palette = {};
  function material(name, color, roughness=.9, map=null) {
    return palette[name] || (palette[name]=new T.MeshStandardMaterial({color,roughness,map,metalness:0}));
  }
  function texture(kind) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    const c=canvas.getContext('2d');let seed=317;
    const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    c.fillStyle=kind==='earth'?'#807967':kind==='stone'?'#aaa38f':'#66716d';
    c.fillRect(0,0,512,512);
    for(let i=0;i<16000;i++){
      c.fillStyle=rand()>.5?'rgba(30,27,20,.035)':'rgba(255,249,218,.04)';
      c.fillRect(rand()*512,rand()*512,2+rand()*5,2+rand()*5);
    }
    if(kind!=='earth'){
      const dx=kind==='stone'?64:48,dy=kind==='stone'?48:20;
      for(let row=0;row<512/dy;row++)for(let col=-1;col<512/dx+1;col++){
        const x=col*dx+(row%2)*dx/2,y=row*dy;
        c.strokeStyle='rgba(30,35,32,.30)';c.lineWidth=1.3;c.strokeRect(x,y,dx,dy);
        c.fillStyle=`rgba(255,253,226,${rand()*.13})`;c.fillRect(x+2,y+2,dx-4,dy-4);
      }
    }
    const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;
    tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
    return tex;
  }
  function merge(geometries) {
    const positions=[],normals=[],uvs=[];
    for(const source of geometries){
      const g=source.index?source.toNonIndexed():source;
      if(!g.attributes.normal)g.computeVertexNormals();
      const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;
      for(let i=0;i<p.count;i++){
        positions.push(p.getX(i),p.getY(i),p.getZ(i));
        normals.push(n.getX(i),n.getY(i),n.getZ(i));
        uvs.push(u?u.getX(i):0,u?u.getY(i):0);
      }
      if(g!==source)g.dispose();source.dispose();
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    g.computeBoundingBox();g.computeBoundingSphere();return g;
  }
  function box(w,h,d,x=0,y=0,z=0,angle=0){
    const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);return g;
  }
  function tube(points,r=.15,segments=12){
    return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,5,false);
  }
  function cylinder(r,h,x,y,z){const g=new T.CylinderGeometry(r,r*1.06,h,10);g.translate(x,y,z);return g;}
  function mesh(geometries,mat,name){
    const m=new T.Mesh(merge(geometries),mat);m.name=name;m.castShadow=m.receiveShadow=true;return m;
  }
  function initMaterials(){
    material('plaster',0xd9d0b8);material('timber',0x603a2b);
    material('window',0x1e2928);material('tile',0x35413e,.93);
    material('tileRib',0x485149,.9);material('stone',0xb6b09b,.96,texture('stone'));
    material('brick',0x9b9e90,.96,texture('brick'));material('leaf',0x5b7650);
  }
  // A curved gable roof with real barrel-tile ribs and upturned eave ends.
  function gableRoof(w,d,h,rh,x=0,z=0,detail=true){
    const surface=[],ribs=[],trim=[];
    const half=w*.58,length=d*.57;
    const point=(sign,u,v)=>new T.Vector3(x+sign*half*u,h+rh*Math.pow(1-u,1.45)+.65*Math.pow(u,8),z+v*length);
    const positions=[],uv=[];
    for(const side of [-1,1])for(let i=0;i<12;i++){
      const a=point(side,i/12,-1),b=point(side,(i+1)/12,-1),c=point(side,(i+1)/12,1),e=point(side,i/12,1);
      const verts=side===1?[a,c,b,a,e,c]:[a,b,c,a,c,e];
      for(const p of verts){positions.push(p.x,p.y,p.z);uv.push((p.x-x)/w,(p.z-z)/d);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();surface.push(g);
    if(detail){
      const count=Math.max(9,Math.min(40,Math.round(d/1.1)));
      for(const side of [-1,1])for(let j=0;j<=count;j++){
        const points=[];for(let i=0;i<=8;i++){const p=point(side,i/8,-1+2*j/count);p.y+=.14;points.push(p.toArray());}
        ribs.push(tube(points,.12,10));
      }
    }
    trim.push(box(.72,.7,d*1.17,x,h+rh+.22,z));
    for(const side of [-1,1])for(const end of [-1,1]){
      const pts=[];for(let i=0;i<=10;i++){const p=point(side,i/10,end);p.y+=.18;pts.push(p.toArray());}
      trim.push(tube(pts,.25,12));
    }
    return {surface,ribs,trim};
  }
  function lattice(x,y,z,w,h,wood,dark,angle=0){
    dark.push(box(w,h,.2,x,y,z,angle));
    for(const sx of [-1,1])wood.push(box(.23,h+.3,.35,x+sx*w/2*Math.cos(angle),y,z-sx*w/2*Math.sin(angle),angle));
    for(const sy of [-1,1])wood.push(box(w,.23,.35,x,y+sy*h/2,z,angle));
    for(let i=1;i<5;i++)wood.push(box(.12,h,.32,x+(-w/2+w*i/5)*Math.cos(angle),y,z-(-w/2+w*i/5)*Math.sin(angle),angle));
    for(let i=1;i<3;i++)wood.push(box(w,.12,.32,x,y-h/2+h*i/3,z,angle));
  }
  function house(w,d,h,rh,variant=0,detail=true){
    initMaterials();const group=new T.Group();group.name='Courtyard dwelling';
    const plaster=[],stone=[],wood=[],dark=[],roof=[],ribs=[],ridge=[];
    stone.push(box(w+1,1.1,d+1,0,.4,0));
    const volumes=variant%3===0?[
      {x:0,z:-d*.27,w:w*.9,d:d*.38,h},
      {x:-w*.36,z:d*.10,w:w*.22,d:d*.48,h:h*.78},
      {x:w*.36,z:d*.10,w:w*.22,d:d*.48,h:h*.78}
    ]:[{x:0,z:0,w:w*.94,d:d*.88,h}];
    for(const v of volumes){
      const base=1.0,top=base+v.h,front=v.z+v.d/2;
      // Front wall is assembled around the door, so the doorway is recessed.
      const doorW=Math.min(3.2,v.w*.18),doorH=Math.min(4.7,v.h*.72);
      plaster.push(box(v.w,.65,v.d,v.x,top-.325,v.z));
      plaster.push(box(v.w,v.h,.65,v.x,base+v.h/2,v.z-v.d/2));
      for(const s of [-1,1]){
        plaster.push(box(.65,v.h,v.d,v.x+s*v.w/2,base+v.h/2,v.z));
        const bw=(v.w-doorW)/2;
        plaster.push(box(bw,v.h,.65,v.x+s*(doorW/2+bw/2),base+v.h/2,front));
      }
      plaster.push(box(doorW,v.h-doorH,.65,v.x,base+doorH+(v.h-doorH)/2,front));
      dark.push(box(doorW,doorH,.35,v.x,base+doorH/2,front-.35));
      wood.push(box(doorW+.7,.4,.85,v.x,base+doorH,front+.2));
      for(const s of [-1,1])wood.push(box(.28,doorH,.4,v.x+s*doorW/2,base+doorH/2,front+.15));
      if(v.w>12)for(const s of [-1,1])lattice(v.x+s*v.w*.29,base+v.h*.51,front+.4,Math.min(3.8,v.w*.18),Math.min(3.5,v.h*.48),wood,dark);
      stone.push(box(v.w,.9,.9,v.x,base+.3,front+.1));
      // Return wall windows read in the oblique camera, not just in elevation.
      if(v.d>12)for(const s of [-1,1])lattice(v.x+s*(v.w/2+.36),base+v.h*.5,v.z,3,3,wood,dark,Math.PI/2);
      wood.push(box(v.w+1,.35,.55,v.x,top-.2,front+.3));
      const r=gableRoof(v.w,v.d,top,rh*(v.h/h),v.x,v.z,detail);
      roof.push(...r.surface);ribs.push(...r.ribs);ridge.push(...r.trim);
      // Solid gable ends under the pitched roof.
      const shape=new T.Shape();shape.moveTo(-v.w/2,0);shape.lineTo(v.w/2,0);shape.lineTo(0,rh*(v.h/h));shape.closePath();
      for(const end of [-1,1]){const g=new T.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:false});g.translate(v.x,top,v.z+end*v.d/2-.2);plaster.push(g);}
      if(variant%4===0)for(const end of [-1,1]){
        for(let step=-2;step<=2;step++){
          const height=rh*(1-Math.abs(step)/3)+.7;
          plaster.push(box(v.w/5+.15,height,.68,v.x+step*v.w/5,top+height/2,v.z+end*v.d/2));
          ridge.push(box(v.w/5+.4,.4,.9,v.x+step*v.w/5,top+height+.15,v.z+end*v.d/2));
        }
      }
    }
    if(variant%3===0){
      for(const s of [-1,1])plaster.push(box(w*.32,h*.6,.65,s*w*.34,1+h*.3,d*.44));
      const entry=gableRoof(5,2.5,1+h*.6,1.8,0,d*.44,detail);
      roof.push(...entry.surface);ribs.push(...entry.ribs);ridge.push(...entry.trim);
      for(const s of [-1,1])wood.push(box(.4,h*.6,.45,s*2,1+h*.3,d*.44));
    }
    const parts={
      foundation:mesh(stone,palette.stone,'Stone plinth and thresholds'),
      walls:mesh(plaster,palette.plaster,'Walls, gables and courtyard'),
      joinery:mesh(wood,palette.timber,'Doors, lattice windows and exposed beams'),
      recesses:mesh(dark,palette.window,'Recessed openings'),
      roof:mesh(roof,palette.tile,'Curved tiled roof'),
      tileRibs:ribs.length?mesh(ribs,palette.tileRib,'Barrel tile courses'):null,
      ridge:mesh(ridge,palette.tileRib,'Ridge and eave coping')
    };
    for(const part of Object.values(parts))if(part)group.add(part);
    group.userData.parts=parts;group.userData.bounds={w:w*1.18+1,d:d*1.18+1};return group;
  }
  function gate(){
    initMaterials();const group=new T.Group();group.name='Arched masonry gate tower';
    const shape=new T.Shape();shape.moveTo(-22,0);shape.lineTo(-6,0);shape.lineTo(-6,8);
    shape.absarc(0,8,6,Math.PI,0,true);shape.lineTo(6,0);shape.lineTo(22,0);shape.lineTo(22,18);shape.lineTo(-22,18);shape.closePath();
    const base=new T.ExtrudeGeometry(shape,{depth:26,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.15,bevelThickness:.15});base.translate(0,0,-13);
    const masonry=[base,box(46,1.4,28,0,18,0)],archStones=[];
    for(let i=0;i<13;i++){
      const a=(i+.5)/13*Math.PI,g=box(1.48,1.6,1.1,7.05*Math.cos(a),8+7.05*Math.sin(a),13.6);
      g.rotateZ(0); // The voussoir transform is applied about its own center below.
      const mid=new T.Vector3(7.05*Math.cos(a),8+7.05*Math.sin(a),13.6);
      g.translate(-mid.x,-mid.y,-mid.z);g.rotateZ(a-Math.PI/2);g.translate(mid.x,mid.y,mid.z);archStones.push(g);
    }
    const wood=[],dark=[],roof=[],ribs=[],ridge=[];
    for(const tier of [{w:34,d:19,base:19,h:8,rh:6},{w:25,d:14,base:30,h:7,rh:7}]){
      for(const x of [-tier.w/2,0,tier.w/2])for(const z of [-tier.d/2,tier.d/2])wood.push(cylinder(.52,tier.h,x,tier.base+tier.h/2,z));
      for(const z of [-tier.d/2,tier.d/2]){
        wood.push(box(tier.w+1,.75,.9,0,tier.base+tier.h,z));
        for(const x of [-tier.w*.32,0,tier.w*.32])lattice(x,tier.base+tier.h*.5,z,tier.w*.25,tier.h*.62,wood,dark);
      }
      const r=gableRoof(tier.w,tier.d,tier.base+tier.h,tier.rh,0,0,true);roof.push(...r.surface);ribs.push(...r.ribs);ridge.push(...r.trim);
    }
    group.add(mesh(masonry,palette.brick,'Masonry with open arch'),mesh(archStones,palette.stone,'Arch voussoirs'),
      mesh(wood,palette.timber,'Gate timber frame and window lattice'),mesh(dark,palette.window,'Gate window recesses'),
      mesh(roof,palette.tile,'Gate double eaves'),mesh(ribs,palette.tileRib,'Gate roof tile courses'),mesh(ridge,palette.tileRib,'Gate ridge'));
    const bridgeStone=[],balustrade=[];
    bridgeStone.push(box(14,2,47,0,1.2,35));
    for(const x of [-6.3,6.3]){
      balustrade.push(box(.55,.55,46,x,3.9,35));
      for(let z=15;z<=56;z+=5)balustrade.push(box(.65,2.8,.65,x,2.75,z));
    }
    group.add(mesh(bridgeStone,palette.stone,'Gate causeway'),mesh(balustrade,palette.stone,'Causeway railings'));
    return group;
  }
  function octagonalRoof(radius,height,base){
    const surface=[],ribs=[],trim=[];
    const pos=[],uv=[];
    const pt=(face,v,u)=>{
      const a=face*Math.PI/4+Math.PI/8,b=a+Math.PI/4;
      const x=(Math.cos(a)*(1-v)+Math.cos(b)*v)*radius*u,z=(Math.sin(a)*(1-v)+Math.sin(b)*v)*radius*u;
      const corner=Math.pow(Math.abs(v-.5)*2,4);
      return new T.Vector3(x,base+height*Math.pow(1-u,1.45)+1.2*Math.pow(u,8)*corner,z);
    };
    for(let face=0;face<8;face++){
      for(let i=0;i<12;i++)for(let j=0;j<6;j++){
        const a=pt(face,j/6,i/12),b=pt(face,(j+1)/6,i/12),c=pt(face,(j+1)/6,(i+1)/12),d=pt(face,j/6,(i+1)/12);
        for(const p of [a,b,c,a,c,d]){pos.push(p.x,p.y,p.z);uv.push(p.x/radius,p.z/radius);}
      }
      for(let j=0;j<=9;j++){
        const pts=[];for(let i=0;i<=12;i++){const p=pt(face,j/9,i/12);p.y+=.15;pts.push(p.toArray());}
        ribs.push(tube(pts,.13,12));
      }
      const cornerPts=[];for(let i=0;i<=12;i++){const p=pt(face,0,i/12);p.y+=.2;cornerPts.push(p.toArray());}
      trim.push(tube(cornerPts,.28,12));
      const eave=[];for(let j=0;j<=8;j++)eave.push(pt(face,j/8,1).toArray());trim.push(tube(eave,.26,10));
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();surface.push(g);
    return {surface,ribs,trim};
  }
  function pavilion(){
    initMaterials();const group=new T.Group();group.name='Double-eaved waterside pavilion';
    const stone=[],frame=[],windows=[],upper=[],roof=[],tile=[],trim=[];
    const platform=new T.CylinderGeometry(17.2,18.1,2.4,8);platform.translate(0,4.5,0);stone.push(platform);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+Math.PI/8,x=Math.cos(a)*12.2,z=Math.sin(a)*12.2;
      stone.push(cylinder(.85,4,x,2,z));frame.push(cylinder(.52,10.4,x,10.8,z));
      const b=a+Math.PI/4,m=(a+b)/2,cx=Math.cos(m)*11.25,cz=Math.sin(m)*11.25,angle=Math.PI/2-m;
      frame.push(box(9.6,.65,.7,cx,15.5,cz,angle),box(9.6,.6,.7,cx,6.6,cz,angle));
      // Low rails and sparse vertical lattice retain the open ground storey.
      if(i!==0&&i!==5){
        frame.push(box(9.3,.4,.45,cx,8.1,cz,angle));
        for(let j=0;j<6;j++)frame.push(box(.15,1.5,.25,cx+(j-2.5)*1.4*Math.cos(angle),7.4,cz-(j-2.5)*1.4*Math.sin(angle),angle));
      }
      const ux=Math.cos(a)*8.5,uz=Math.sin(a)*8.5;upper.push(cylinder(.42,6.9,ux,23,uz));
      lattice(Math.cos(m)*7.9,23.4,Math.sin(m)*7.9,5.4,4.6,upper,windows,angle);
      upper.push(box(6.4,.55,.6,Math.cos(m)*7.9,26.5,Math.sin(m)*7.9,angle));
      // Projecting brackets under each flying corner.
      for(let k=0;k<3;k++)frame.push(box(1.0,.4,1.7+k*.6,Math.cos(a)*(12.1+k*.7),15+k*.42,Math.sin(a)*(12.1+k*.7),Math.PI/2-a));
    }
    for(const config of [{r:22.8,h:6.6,y:16.3},{r:16.2,h:7.1,y:27.1}]){
      const r=octagonalRoof(config.r,config.h,config.y);roof.push(...r.surface);tile.push(...r.ribs);trim.push(...r.trim);
    }
    const finial=new T.LatheGeometry([new T.Vector2(.3,0),new T.Vector2(.9,.6),new T.Vector2(.8,1.5),new T.Vector2(.35,2.3),new T.Vector2(.5,2.8),new T.Vector2(0,3.7)],12);finial.translate(0,34.2,0);trim.push(finial);
    group.add(mesh(stone,palette.stone,'Pavilion platform and water piers'),mesh(frame,palette.timber,'Open lower frame, rails and brackets'),
      mesh(upper,palette.timber,'Upper timber frame and lattice'),mesh(windows,palette.window,'Upper window recesses'),
      mesh(roof,palette.tile,'Pavilion curved double eaves'),mesh(tile,palette.tileRib,'Pavilion barrel tile courses'),mesh(trim,palette.tileRib,'Flying corner ridges and finial'));
    return group;
  }
  function bridgeSegment(length){
    initMaterials();const group=new T.Group();const stone=[box(5.2,1.0,length+.3,0,0,0)],rails=[];
    for(const x of [-2.4,2.4]){
      rails.push(box(.28,.28,length+.3,x,2.1,0),box(.25,.25,length+.3,x,.9,0));
      for(let z=-length/2;z<=length/2+.1;z+=Math.min(3.8,length/4)){
        rails.push(box(.38,2.4,.38,x,1.2,z));
        rails.push(box(.15,.9,.15,x,1.4,z+1.3));
      }
    }
    for(const x of [-1.6,1.6])stone.push(cylinder(.7,4.3,x,-2.4,0));
    group.add(mesh(stone,palette.stone,'Bridge stone deck and piers'),mesh(rails,palette.timber,'Bridge posts and open rails'));return group;
  }
  function gallery(w,d,h,rh){
    initMaterials();const group=new T.Group(),stone=[box(w,.9,d,0,.7,0)],wood=[];
    for(const x of [-w/2,w/2])for(let z=-d/2;z<=d/2+.1;z+=d/8){wood.push(cylinder(.35,h,x,h/2+1,z));}
    for(const x of [-w/2,w/2])wood.push(box(.7,.6,d+1,x,h+1,0),box(.4,.4,d,x,3.2,0));
    const r=gableRoof(w,d,h+1,rh,0,0,true);
    group.add(mesh(stone,palette.stone,'Gallery platform'),mesh(wood,palette.timber,'Open gallery frame'),
      mesh(r.surface,palette.tile,'Gallery tiled roof'),mesh(r.ribs.concat(r.trim),palette.tileRib,'Gallery tile courses and ridge'));return group;
  }
  function pointInPolygon(point,poly){
    let inside=false;const[x,z]=point;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
    return inside;
  }
  function distanceToSegment(p,a,b){
    const x=b[0]-a[0],z=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/(x*x+z*z||1)));
    return Math.hypot(p[0]-a[0]-u*x,p[1]-a[1]-u*z);
  }
  function intersects(a,b,c,d){
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
  }
  function landClearance(poly,waters){
    let clearance=Infinity;
    for(const w of waters){
      if(poly.some(p=>pointInPolygon(p,w))||w.some(p=>pointInPolygon(p,poly)))return -1;
      for(let i=0;i<poly.length;i++)for(let j=0;j<w.length-1;j++){
        const a=poly[i],b=poly[(i+1)%poly.length],c=w[j],d=w[j+1];
        if(intersects(a,b,c,d))return -1;
        clearance=Math.min(clearance,distanceToSegment(a,c,d),distanceToSegment(c,a,b));
      }
    }
    return clearance;
  }
  function footprint(x,z,w,d,angle){
    return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([a,b])=>[x+a*Math.cos(angle)+b*Math.sin(angle),z-a*Math.sin(angle)+b*Math.cos(angle)]);
  }
  window.OLD_CITY_MODELS={house,gate,pavilion,gallery,bridgeSegment,texture,merge,box,tube,mesh,material,initMaterials,
    pointInPolygon,landClearance,footprint};
})();
