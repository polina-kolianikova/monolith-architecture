import * as THREE from './assets/vendor/three.module.js';

const $ = s => document.querySelector(s);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a,b,x) => {const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let floor='all', daylight=14, progress=0, targetProgress=0, dragAngle=0, dragTarget=0, activeChapter=-1;
const levelNames={all:'Whole house',living:'Living floor',roof:'Roof plane'};
const levelDescriptions={all:'The full composition brings living, terrace and roof together.',living:'A 156 m² open living floor, framed by deep glazing and a sheltered terrace.',roof:'The overhanging stone roof shades the glazing and carries the upper garden.'};
const dialog=$('#project-dialog');
function openDialog(){updateSpec();dialog.showModal();}
$('#open-project').addEventListener('click',openDialog);$('#open-spec').addEventListener('click',openDialog);
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function formatTime(value){let h=Math.floor(value),m=Math.round((value-h)*60);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
function updateSpec(){$('#selected-floor').textContent=levelNames[floor];$('#selected-time').textContent=formatTime(daylight);$('#floor-description').textContent=levelDescriptions[floor];}
document.querySelectorAll('[data-floor]').forEach(button=>button.addEventListener('click',()=>{floor=button.dataset.floor;document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateSpec();}));
$('#daylight').addEventListener('input',e=>{daylight=Number(e.target.value);$('#time-output').textContent=formatTime(daylight);updateSpec();});
$('#save-spec').addEventListener('click',()=>{const text=`MONOLITH\nStone House No. 01\nIndependent architectural concept, 2026\n\nBuilt area: 318 m², design study\nStructure: stone, concrete, glass\nSelected view: ${levelNames[floor]}\nSun study: ${formatTime(daylight)}\n${levelDescriptions[floor]}\n\nNo property is offered for sale.\nIndependent concept by BlackStack Studio.\n`;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='monolith-stone-house-notes.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#save-feedback').textContent='Your project notes have been saved.';});
$('#orbit-turn').addEventListener('click',()=>{dragTarget=dragTarget>.55?-.5:dragTarget+.35});
const chapters=[...document.querySelectorAll('.chapter')],links=[...document.querySelectorAll('.chapter-nav a')];
function scrollProgress(){let index=0;while(index<chapters.length-1&&scrollY>=chapters[index+1].offsetTop)index++;const start=chapters[index].offsetTop,end=chapters[index+1]?.offsetTop??start+innerHeight;targetProgress=index+clamp((scrollY-start)/(end-start),0,1);const current=Math.min(3,Math.round(targetProgress));if(current!==activeChapter){activeChapter=current;links.forEach((a,i)=>{a.classList.toggle('active',i===current);if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});}}
addEventListener('scroll',scrollProgress,{passive:true});scrollProgress();

let renderer,scene,camera,sun,ambient,house,roofGroup,livingGroup,groundGroup,pool,glassMaterial;
const host=$('#scene');
try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#e9e5da');scene.fog=new THREE.Fog('#e9e5da',26,65);
  camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,120);
  ambient=new THREE.HemisphereLight('#f7f9f0','#7e8773',2.4);scene.add(ambient);
  sun=new THREE.DirectionalLight('#fff1d4',3.8);sun.position.set(-7,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.normalBias=.045;sun.shadow.bias=-.00025;sun.shadow.radius=3;scene.add(sun);
  const bounce=new THREE.DirectionalLight('#b9d3df',1.2);bounce.position.set(9,5,-7);scene.add(bounce);
  const textureCanvas=document.createElement('canvas');textureCanvas.width=256;textureCanvas.height=256;const tc=textureCanvas.getContext('2d');tc.fillStyle='#cdc7b7';tc.fillRect(0,0,256,256);let seed=17;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};for(let i=0;i<18000;i++){const v=150+Math.floor(rnd()*60);tc.fillStyle=`rgba(${v},${v},${v-10},.12)`;tc.fillRect(rnd()*256,rnd()*256,rnd()*2+.3,rnd()*1+.3)}const texture=new THREE.CanvasTexture(textureCanvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);
  const stone=new THREE.MeshStandardMaterial({color:'#d4cdba',roughness:.84,map:texture,bumpMap:texture,bumpScale:.025});
  const darkStone=new THREE.MeshStandardMaterial({color:'#95937f',roughness:.88,map:texture});
  const wood=new THREE.MeshStandardMaterial({color:'#866d4c',roughness:.78});
  const metal=new THREE.MeshStandardMaterial({color:'#343c34',metalness:.65,roughness:.4});
  const leaf=new THREE.MeshStandardMaterial({color:'#748267',roughness:.95});
  const leafLight=new THREE.MeshStandardMaterial({color:'#87916b',roughness:1});
  const cushion=new THREE.MeshStandardMaterial({color:'#e6ddc7',roughness:1});
  glassMaterial=new THREE.MeshPhysicalMaterial({color:'#a9bcb1',roughness:.12,metalness:.2,transparent:true,opacity:.4,side:THREE.DoubleSide,depthWrite:false});
  function box(w,h,d,material,x,y,z,parent=house){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  function cylinder(radius,height,material,x,y,z,parent=house){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,16),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  house=new THREE.Group();scene.add(house);
  groundGroup=new THREE.Group();house.add(groundGroup);livingGroup=new THREE.Group();house.add(livingGroup);roofGroup=new THREE.Group();house.add(roofGroup);
  const terrain=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#dfdccf',roughness:1}));terrain.rotation.x=-Math.PI/2;terrain.position.y=-.11;terrain.receiveShadow=true;scene.add(terrain);
  box(13,.2,9,darkStone,0,0,0,groundGroup);box(12.4,.28,8.4,stone,0,.2,0,groundGroup);
  // Lower terrace, pool, stair and shadow gaps.
  box(9,.12,2.3,wood,1.05,.38,3.6,groundGroup);for(let i=0;i<32;i++)box(.018,.009,2.25,darkStone,-3.25+i*.275,.447,3.6,groundGroup);
  box(4.6,.2,2.2,stone,-3.1,.29,-3.15,groundGroup);
  pool=box(4.25,.035,1.85,new THREE.MeshPhysicalMaterial({color:'#8ab6b1',roughness:.18,metalness:.3,transparent:true,opacity:.78}),-3.1,.405,-3.15,groundGroup);pool.castShadow=false;
  for(let i=0;i<5;i++)box(1.65,.15,1,stone,-6.2-i*.4,.17-i*.045,2.4,groundGroup);
  // Ground floor enclosure, genuinely thick walls and independently layered roof.
  box(2.9,2.7,5.25,stone,-3.8,1.71,-.45,groundGroup);box(.22,2.7,5.8,stone,4.15,1.71,-.1,groundGroup);box(7.1,2.6,.12,glassMaterial,.85,1.7,2.45,groundGroup);box(7.1,2.6,.12,glassMaterial,.85,1.7,-2.65,groundGroup);
  for(let x=-2.7;x<4.3;x+=1.38){box(.05,2.64,.11,metal,x,1.72,2.48,groundGroup);box(.05,2.64,.11,metal,x,1.72,-2.68,groundGroup)}
  // Living furniture is readable when the planes separate.
  box(2.8,.36,.95,cushion,.7,.69,.8,groundGroup);box(2.8,.8,.24,cushion,.7,1,.35,groundGroup);box(.22,.52,1.1,cushion,-.75,.75,.82,groundGroup);box(.22,.52,1.1,cushion,2.15,.75,.82,groundGroup);box(1.7,.12,.8,wood,.6,.59,2,groundGroup);
  box(11,.24,7.2,stone,0,3.17,-.35,livingGroup);box(1.95,2.45,4.65,stone,-3.65,4.51,-.6,livingGroup);box(6.8,2.4,.11,glassMaterial,.8,4.52,2.05,livingGroup);box(6.8,2.4,.11,glassMaterial,.8,4.52,-2.55,livingGroup);box(.1,2.4,4.6,glassMaterial,4.15,4.52,-.25,livingGroup);
  for(let x=-2.4;x<4.2;x+=1.32){box(.045,2.45,.10,metal,x,4.53,2.07,livingGroup);box(.045,2.45,.10,metal,x,4.53,-2.58,livingGroup)}
  for(let i=0;i<14;i++)box(.075,2.48,.22,wood,-4.83+i*.19,4.53,1.89,livingGroup);
  for(const [x,z] of [[4.35,2.65],[4.35,-3.1],[-4.75,2.65],[-4.75,-3.1]])cylinder(.085,2.75,metal,x,4.63,z,livingGroup);
  box(2.7,.25,1.25,wood,.25,3.55,-.6,livingGroup);box(2.55,.13,1.2,cushion,.25,3.74,-.6,livingGroup);box(.2,.55,1.28,cushion,-1.15,3.85,-.6,livingGroup);box(.2,.55,1.28,cushion,1.65,3.85,-.6,livingGroup);box(2.8,.7,.18,cushion,.25,4,-1.2,livingGroup);
  box(12,.3,8.5,stone,0,5.95,-.35,roofGroup);box(10.9,.05,7.4,darkStone,0,6.125,-.35,roofGroup);box(3.8,.12,4.7,new THREE.MeshStandardMaterial({color:'#8d9671',roughness:1}),-3,6.2,-.55,roofGroup);
  // Roof gravel, garden shrubs and tree trunks ground the building.
  for(let i=0;i<80;i++){const pebble=new THREE.Mesh(new THREE.IcosahedronGeometry(.04+rnd()*.05,0),stone);pebble.position.set(-.8+rnd()*5.8,6.17,-3.5+rnd()*6.3);pebble.scale.y=.4;roofGroup.add(pebble)}
  function tree(x,z,s=1){cylinder(.09*s,2.2*s,wood,x,1.1*s,z,groundGroup);for(let j=0;j<5;j++){const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry((.55+rnd()*.25)*s,2),j%2?leaf:leafLight);foliage.position.set(x+(rnd()-.5)*1.1*s,(2.2+rnd()*.7)*s,z+(rnd()-.5)*.9*s);foliage.castShadow=true;foliage.scale.set(1,.75,1);groundGroup.add(foliage)}}
  tree(-7.2,-4.3,1.25);tree(6.1,-3.7,.95);tree(7,2.9,.85);
  for(let i=0;i<32;i++){const x=-5.4+rnd()*1.5,z=-4.3+rnd()*7.5;const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.18+rnd()*.18,1),leaf);shrub.position.set(x,.49,z);shrub.scale.y=.6;shrub.castShadow=true;groundGroup.add(shrub)}
  const gardenBeds=[[-7,-1.4],[-6.8,-2.2],[6.9,-1.3],[6.4,-.4]];gardenBeds.forEach(([x,z])=>{box(1.3,.16,1.3,darkStone,x,.02,z,groundGroup);for(let i=0;i<7;i++){const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.18+rnd()*.22,1),leafLight);shrub.position.set(x+(rnd()-.5),.22,z+(rnd()-.5));shrub.castShadow=true;groundGroup.add(shrub)}});
  // Deliberate construction grid, only on the study plinth.
  const grid=new THREE.GridHelper(34,34,'#aeb4a1','#c4c9ba');grid.position.y=-.092;grid.material.transparent=true;grid.material.opacity=.25;scene.add(grid);
  let pointer=null;
  host.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;pointer={x:e.clientX,angle:dragTarget};host.setPointerCapture(e.pointerId);host.style.cursor='grabbing'});
  host.addEventListener('pointermove',e=>{if(pointer)dragTarget=clamp(pointer.angle+(e.clientX-pointer.x)*.003,-.75,.75)});
  function release(){pointer=null;host.style.cursor='grab'}host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.style.cursor='grab';
  const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<800?1.4:1.7));scrollProgress()};addEventListener('resize',resize);
  let previous=performance.now();
  function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=now;return}const dt=Math.min((now-previous)/1000,.05);previous=now;const damping=1-Math.exp(-7*dt);progress=reduced.matches?targetProgress:mix(progress,targetProgress,damping);dragAngle=mix(dragAngle,dragTarget,damping);
    const mobile=innerWidth<800;
    const sceneProgress=reduced.matches?Math.round(progress):progress;
    const explode=smooth(.65,1.08,sceneProgress)*(1-smooth(1.45,1.9,sceneProgress));
    const manualLiving=floor==='living'?1:0,manualRoof=floor==='roof'?1:0;
    const spread=Math.max(explode,manualLiving*.75,manualRoof);
    livingGroup.position.y=mix(livingGroup.position.y,spread*1.55,damping);roofGroup.position.y=mix(roofGroup.position.y,spread*3.25,damping);
    const lightChapter=smooth(1.65,2.05,sceneProgress)*(1-smooth(2.5,2.95,sceneProgress));
    const orbitBase=mix(.65,1.05,lightChapter)+dragAngle;
    const distance=mobile?28.3:26.8;
    let cameraX=Math.sin(orbitBase)*distance,cameraZ=Math.cos(orbitBase)*distance;
    const cameraHeight=mix(14.5,8.7,lightChapter)+spread*3.4;
    camera.position.set(cameraX,cameraHeight,cameraZ);
    const contentRight=progress>.7&&progress<1.5||progress>2.6;
    const targetX=mobile?0:contentRight?3.65:-4.35;
    camera.lookAt(targetX,mobile?6.0:2.7,0);
    house.rotation.y=reduced.matches?.04:mix(.04,-.12,lightChapter);
    const sunT=(daylight-7)/12;sun.position.set(mix(-12,12,sunT),3+Math.sin(sunT*Math.PI)*13,7);
    sun.color.set(sunT>.78?'#ffbb77':sunT<.18?'#ffd3a0':'#fff2da');sun.intensity=2+Math.sin(sunT*Math.PI)*2;ambient.intensity=1.7+Math.sin(sunT*Math.PI)*.7;
    const bg=new THREE.Color().lerpColors(new THREE.Color('#ded6c6'),new THREE.Color('#e9e5da'),Math.sin(sunT*Math.PI));scene.background.copy(bg);scene.fog.color.copy(bg);
    renderer.render(scene,camera);
  }requestAnimationFrame(frame);$('#loading').classList.add('done');
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.classList.add('no-webgl');$('#loading').classList.add('done')});
}catch(error){document.body.classList.add('no-webgl');$('#loading').classList.add('done');$('#daylight').disabled=true;console.warn('Static architectural view enabled.',error.message)}
