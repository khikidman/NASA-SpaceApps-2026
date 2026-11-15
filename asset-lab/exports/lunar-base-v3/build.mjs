import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { SOURCE_FILES, sha256, sealPackage, verifyPackage } from '../../core/package.mjs';

const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../..');
const registration=JSON.parse(await fs.readFile(path.join(root,'src/assets/buildings/lunar-base-modules.json'),'utf8'));
const atlas=JSON.parse(await fs.readFile(path.join(root,'src/assets/characters/astronaut-atlas.json'),'utf8'));
const astronautCode=await fs.readFile(path.join(root,'src/assets/characters/astronaut-settings.ts'),'utf8');
assert(astronautCode.includes('ASTRONAUT_DOOR_HEIGHT_RATIO = .82'));
const opening=registration.airlock.openingHeight*registration.airlock.displayWidth/registration.airlock.pixelWidth;
const actorHeight=opening*.82, wallHeight=60;
const contract={tile:{width:96,height:48},footprint:{width:1,height:1},wallHeight,
  clearOpening:{verticalHeight:opening,projectedWidth:22,widthBasis:'Design choice; height derives from runtime registration'},
  astronaut:{height:actorHeight,doorHeightRatio:.82,source:'src/assets/characters/astronaut-settings.ts'},
  frame:{width:1024,height:1024,logicalWidth:256,logicalHeight:256,anchorX:.5,anchorY:200/256,displayScale:.25},
  palette:{ivory:'#eee2cb',charcoal:'#484953',amber:'#efad26',glass:'#455d7b',indicator:'#83d7df'},
  sourceMeasurements:{airlockOpeningSourcePixels:360,airlockSourceWidth:557,airlockDisplayWidth:48,
    interiorCurrentOpening:45,interiorCurrentFrame:47,interiorProposedOpening:opening},
};
const b64=async p=>(await fs.readFile(path.join(root,p))).toString('base64');
const art={};for(const [id,a] of Object.entries(registration))art[id]={...a,base64:await b64('public'+a.src)};
const astronautData=await b64('public/assets/characters/astronaut-sheet-v1.png');
const definitions=`<defs>
 <linearGradient id="left" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0e3ce"/><stop offset="1" stop-color="#b9aa96"/></linearGradient>
 <linearGradient id="right" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8edd9"/><stop offset="1" stop-color="#cdbfa9"/></linearGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffd46b"/><stop offset=".45" stop-color="#f3b325"/><stop offset="1" stop-color="#bf7d12"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#91b7ce"/><stop offset=".4" stop-color="#566f8b"/><stop offset="1" stop-color="#2e4058"/></linearGradient>
 <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#626470"/><stop offset="1" stop-color="#353640"/></linearGradient>
 <clipPath id="roof"><polygon points="0,-84 48,-60 0,-36 -48,-60"/></clipPath>
</defs>`;
const polygon=(pts,fill,stroke='#8f897f',sw=.5)=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
function prism(c,r,w,d,h,color=['url(#left)','url(#right)','#eee3cd']){
 const p=(c,r)=>[(c-r)*48,(c+r)*24];const [a,b,c1,d1]=[p(c,r),p(c+w,r),p(c+w,r+d),p(c,r+d)];
 return polygon([d1,c1,[c1[0],c1[1]-h],[d1[0],d1[1]-h]],color[0])+polygon([c1,b,[b[0],b[1]-h],[c1[0],c1[1]-h]],color[1])+polygon([a,b,c1,d1].map(([x,y])=>[x,y-h]),color[2]);
}
function component(id,x=0,y=-60){const a=art[id],s=a.displayWidth/a.pixelWidth;return `<image href="data:image/png;base64,${a.base64}" x="${x-a.anchorX*s}" y="${y-a.anchorY*s}" width="${1254*s}" height="${1254*s}"/>`;}
function floor(){return prism(-.5,-.5,1,1,3,['#555660','#696b73','#85838a']);}
function hull({left=true,right=true}={}){
 let out='';if(left)out+=polygon([[-48,0],[0,24],[0,-36],[-48,-60]],'url(#left)');
 if(right)out+=polygon([[0,24],[48,0],[48,-60],[0,-36]],'url(#right)');
 out+=polygon([[0,-84],[48,-60],[0,-36],[-48,-60]],'#eee3cd','#d1c4af');
 if(left)out+=`<path d="M-48 -2 L0 22" stroke="#454750" stroke-width="7"/><path d="M-43 -48 L-5 -29" stroke="url(#gold)" stroke-width="3"/>`;
 if(right)out+=`<path d="M0 22 L48 -2" stroke="#53545c" stroke-width="7"/><path d="M5 -29 L43 -48" stroke="url(#gold)" stroke-width="3"/>`;
 return out+`<g clip-path="url(#roof)">${component('hull')}</g>`;
}
function wallPanel(side='left',type='window'){
 const x=side==='left'?-24:24,y=side==='left'?12:12,k=side==='left'?.5:-.5;
 return `<g transform="matrix(1 ${k} 0 1 ${x} ${y-20})"><rect x="-13" y="-15" width="26" height="18" rx="2" fill="#41454f" stroke="#a29889" stroke-width="1.3"/>`+
 (type==='window'?'<rect x="-10" y="-12" width="20" height="12" rx="1" fill="url(#glass)"/><path d="M-9 -1 L1 -12 L6 -12 L-5 -1Z" fill="#afc9dc" opacity=".3"/>':'<path d="M-10 -9 H8 M-10 -4 H4 M-10 1 H7" stroke="#91d6dd" stroke-width="1.2"/>')+'</g>';
}
function greenhouse(){return `<g transform="translate(0 -62)"><ellipse cy="3" rx="36" ry="17" fill="#c7baa4"/><path d="M-35 2 Q-34 -25 0 -36 Q34 -25 35 2 Q0 24 -35 2Z" fill="url(#glass)" stroke="#e8dec9" stroke-width="2"/>`+
 [[-17,-2],[0,5],[17,-2]].map(([x,y])=>`<g transform="translate(${x} ${y})"><ellipse rx="8" ry="4" fill="#403a36"/><path d="M0 0 Q-13 -14 -1 -10 Q3 -21 6 -11 Q17 -14 0 0" fill="#81a75a" stroke="#4c7845" stroke-width=".8"/></g>`).join('')+
 `<path d="M-35 2 Q-17 -4 0 -36 Q17 -4 35 2 M0 -36 V18 M-29 -14 Q0 0 29 -14" fill="none" stroke="#f2e5cf" stroke-width="2"/><path d="M-24 -3 L-14 2 M14 2 L24 -3" stroke="#dc6aa3" stroke-width="1.5"/></g>`;}
function solar(){let out=floor();for(const [c,r] of [[-.32,-.28],[.03,-.05]]){out+=prism(c,r,.24,.5,14,['#434550','#565965','#696a73']);const x=(c-r)*48+4,y=(c+r)*24-25;out+=`<g transform="translate(${x} ${y})"><path d="M-13 1 L9 -12 L24 -2 L2 12Z" fill="url(#glass)" stroke="#eee0c6" stroke-width="2"/><path d="M-7 4 L15 -9 M0 8 L21 -5 M-2 -6 L13 5" stroke="#7a9dbc" stroke-width=".8"/></g>`;}return out+prism(-.35,.21,.16,.17,8,['#ba851b','#dba326','#fbc84d']);}
function portal(x,y,openness=0,{frame=true,leaves=true,leafSelection='both',light='#8bd3d9'}={}){
 const h=opening,w=11;
 const frameArt=frame?`<path d="M-17 1 V-${h+4} Q-17 -${h+8} -13 -${h+8} H13 Q17 -${h+8} 17 -${h+4} V1 H11 V-${h} H-11 V1Z" fill="url(#right)" stroke="#998f7d" stroke-width=".5"/><path d="M-13 0 V-${h+1} Q-13 -${h+4} -10 -${h+4} H10 Q13 -${h+4} 13 -${h+1} V0" fill="none" stroke="url(#gold)" stroke-width="3"/><rect x="-6" y="-${h+7}" width="12" height="2" rx="1" fill="${light}"/>`:'';
 const leaf=(left)=>`<g data-leaf="${left?'left':'right'}" transform="translate(${(left?-1:1)*w*openness} 0)"><rect x="${left?-w:0}" y="-${h}" width="${w}" height="${h}" fill="url(#steel)" stroke="#777780" stroke-width=".5"/><rect x="${left?-9:2}" y="-${h-6}" width="7" height="7" rx="1" fill="url(#glass)"/><path d="M${left?-9:2} -8 H${left?-2:9}" stroke="#99979a" stroke-width="1"/></g>`;
 return `<g transform="matrix(1 .5 0 1 ${x} ${y})"><defs><clipPath id="ap-${x}-${y}"><rect x="-11" y="-${h}" width="22" height="${h}"/></clipPath></defs>${frameArt}${leaves?`<g clip-path="url(#ap-${x}-${y})">${leafSelection!=='right'?leaf(true):''}${leafSelection!=='left'?leaf(false):''}</g>`:''}${frame?'<path d="M-14 1 H14" stroke="#555760" stroke-width="2"/>':''}</g>`;
}
function chamberFloor(){let out=floor();for(let i=0;i<5;i++){const r=-.4+i*.2;out+=`<path d="M${(-.43-r)*48} ${(-.43+r)*24-3} L${(.43-r)*48} ${(.43+r)*24-3}" stroke="#b1aaa0" stroke-width=".7"/>`;}
return out+polygon([[0,-24],[48,0],[48,-13],[0,-37]],'url(#right)')+polygon([[-48,0],[0,-24],[0,-37],[-48,-13]],'url(#left)');}
function chamber({inner=0,outer=0,pressure=false,actor=false}={}){return chamberFloor()+portal(24,-12,inner,{light:pressure?'#f1bc57':inner?'#90dab3':'#ce9b82'})+(actor?astronaut(0,0):'')+portal(-24,12,outer,{light:pressure?'#f1bc57':outer?'#90dab3':'#ce9b82'});}
function tunnel(axis='row'){
 const half=11/48,h=opening+8,project=(c,r)=>[(c-r)*48,(c+r)*24];
 let body=floor()+(axis==='row'?prism(-half,-.5,half*2,1,h):prism(-.5,-half,1,half*2,h));
 for(let i=0;i<=5;i++){
   const t=-.5+i/5,[a,b]=axis==='row'?[project(-half,t),project(half,t)]:[project(t,-half),project(t,half)];
   body+=`<path d="M${a[0]} ${a[1]} V${a[1]-h} L${b[0]} ${b[1]-h} V${b[1]}" fill="none" stroke="#a89c89" stroke-width="1.1"/>`;
 }
 return body;
}
function astronaut(x,y,scale=1){const f=atlas.frames[0],s=actorHeight/f.referenceHeight*scale;return `<svg x="${x-f.anchorX*s}" y="${y-f.anchorY*s}" width="${f.width*s}" height="${f.height*s}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" overflow="hidden"><image href="data:image/png;base64,${astronautData}" width="1536" height="1024"/></svg>`;}
const assets=[
 ['hull','Hull module',hull()+wallPanel('left')+wallPanel('right')],
 ['entry-hull','Entry hull · open passage',`<defs><mask id="entry-hole"><rect x="-100" y="-200" width="200" height="400" fill="white"/><g transform="matrix(1 .5 0 1 -24 12)"><rect x="-11" y="-${opening}" width="22" height="${opening}" fill="black"/></g></mask></defs><g mask="url(#entry-hole)">${hull()}</g>${wallPanel('right')}`],
 ['research','Research module',hull()+wallPanel('left','instrument')+wallPanel('right','instrument')+component('vent-intake',0,-60)],
 ['greenhouse','Greenhouse module',hull()+wallPanel('left')+wallPanel('right')+greenhouse()],
 ['utilities','Utilities module',hull()+wallPanel('left','instrument')+component('vent-exhaust',0,-60)],
 ['communications','Communications module',hull()+wallPanel('left')+wallPanel('right','instrument')+component('antenna',0,-60)],
 ['solar','Solar rack',solar()],
 ['tunnel-row','Tunnel · row axis',tunnel('row')],['tunnel-col','Tunnel · column axis',tunnel('col')],
 ['airlock-closed','Airlock · sealed',chamber()],
 ['airlock-outer-open','Airlock · outer open',chamber({outer:1})],
 ['airlock-pressure','Airlock · pressure hold',chamber({pressure:true})],
 ['airlock-inner-open','Airlock · inner open',chamber({inner:1})],
];
const svg=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">${definitions}<g transform="translate(128 200)">${body}</g></svg>`;
for(const [id,,body] of assets){await fs.writeFile(path.join(dir,id+'.svg'),svg(body));await sharp(Buffer.from(svg(body))).png().toFile(path.join(dir,id+'.png'));}
const layers=[['airlock-floor',chamberFloor()],['airlock-inner-frame',portal(24,-12,0,{leaves:false})],['airlock-outer-frame',portal(-24,12,0,{leaves:false})],['airlock-inner-doors',portal(24,-12,0,{frame:false})],['airlock-outer-doors',portal(-24,12,0,{frame:false})]];
for(const [label,x,y] of [['inner',24,-12],['outer',-24,12]])for(const side of ['left','right'])layers.push([`airlock-${label}-${side}-leaf`,portal(x,y,0,{frame:false,leafSelection:side})]);
for(const [id,body] of layers)await fs.writeFile(path.join(dir,id+'.svg'),svg(body));
const source={gitCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),files:await Promise.all(SOURCE_FILES.map(async p=>({path:p,sha256:await sha256(await fs.readFile(path.join(root,p)))})))};
const manifest={format:'asset-lab.scaled-modules/v1',contract,assets:[],
 layout:[{id:'utility',asset:'utilities',col:0,row:0},{id:'science',asset:'research',col:1,row:0},{id:'antenna',asset:'communications',col:0,row:1},{id:'living',asset:'entry-hull',col:1,row:1},{id:'airlock',asset:'airlock-inner-open',col:1,row:2},{id:'tunnel',asset:'tunnel-col',col:2,row:0},{id:'garden',asset:'greenhouse',col:3,row:0},{id:'solar',asset:'solar',col:3,row:2}],
 airlock:{footprint:{width:1,height:1},axis:'row',floorCenter:[0,0],innerThreshold:[24,-12],outerThreshold:[-24,12],
   localGridBounds:{col:[-.5,.5],row:[-.5,.5]},path:[{col:0,row:1,label:'outside'},{col:0,row:0,label:'chamber'},{col:0,row:-1,label:'inside'}],
   drawOrder:['airlock-floor','airlock-inner-doors','airlock-inner-frame','astronaut','airlock-outer-doors','airlock-outer-frame'],
   leafMotion:{projectedHalfWidth:11,left:[-11,-5.5],right:[11,5.5],clipToClearOpening:true},
   sequence:['outer opens; inner closed','astronaut boards the full chamber tile','both doors closed; pressure hold','inner opens; outer closed','astronaut walks inside'],
   currentIntegrationMismatch:'Current interior door is 45 world px; exterior-derived scale is 31.0233. Adopt the shared clear height when binding these assets; no runtime code changed.'},
 baselineFiles:[], note:'New lab-only structural modules. Main repository runtime assets are read-only inputs. No gameplay integration applied.'};
for(const p of ['src/assets/characters/astronaut-settings.ts','src/assets/characters/astronaut-atlas.json','src/assets/buildings/lunar-base-modules.json','src/world/base-prefab.ts','src/world/home.ts','src/world/airlock.ts','src/rendering/airlock-visual.ts'])manifest.baselineFiles.push({path:p,sha256:await sha256(await fs.readFile(path.join(root,p)))});
for(const [id,title] of assets){const bytes=await fs.readFile(path.join(dir,id+'.png')),settings={brightness:1,contrast:1,saturation:1,scale:.25,anchorX:.5,anchorY:200/256,frameWidth:1024,frameHeight:1024};const file={mime:'image/png',width:1024,height:1024,base64:bytes.toString('base64'),sha256:await sha256(bytes)};
const pkg=await sealPackage({format:'spaceapps.assetlab/v1',generatorVersion:'image-v1',asset:{id:'lunar-v3-'+id,title:'Lunar v3 · '+title+' · 1×1',kind:'sprite'},revision:{id:randomUUID(),parentId:null,author:'Codex',createdAt:new Date().toISOString(),note:'Character-scaled structural tile. 96×48 footprint, 60 world-pixel wall reference, 31.0233 clear door, 25.4391 astronaut. Native geometry with existing project textures; lab-only.'},lineage:[],source,payload:{original:{name:id+'.png',width:1024,height:1024,inputSha256:file.sha256},settings},files:[{name:'source.png',...file},{name:'sprite.png',...file}],environment:{renderer:'SVG structural geometry + existing runtime textures; Sharp raster export',browser:'Offline asset lab'}});
await verifyPackage(pkg);await fs.writeFile(path.join(dir,id+'.assetlab.json'),JSON.stringify(pkg,null,2)+'\n');manifest.assets.push({id,title,footprint:{width:1,height:1},image:id+'.png',vector:id+'.svg',package:id+'.assetlab.json',settings});}
assert.equal(new Set(manifest.layout.map(p=>p.col+','+p.row)).size,manifest.layout.length);
assert(Math.abs(contract.astronaut.height/contract.clearOpening.verticalHeight-.82)<1e-12);
await fs.writeFile(path.join(dir,'scale-contract.json'),JSON.stringify(manifest,null,2)+'\n');

// Render the exact actor, door and tiles at a common world scale for review.
let proof=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1760" viewBox="0 0 1600 1760">${definitions}<rect width="1600" height="1760" fill="#121c29"/><g font-family="Arial,sans-serif"><text x="64" y="56" font-size="14" fill="#9bc8c5" letter-spacing="3">ASSET LAB / CHARACTER-SCALED MODULES</text><text x="64" y="112" font-size="40" fill="#edf1f4" font-weight="bold">One shared scale. One tile per object.</text><text x="64" y="151" font-size="19" fill="#aebcca">Astronaut 25.44 · clear door 31.02 · wall 60 · tile 96 × 48 world pixels</text>`;
proof+=`<rect x="48" y="184" width="1504" height="416" rx="16" fill="#1b2938"/><text x="78" y="222" font-size="18" fill="#e8e3d8">Scale reference · identical ground baseline and presentation zoom</text>`;
proof+=`<g transform="translate(228 480) scale(3.2)">${portal(0,0,1)}${astronaut(-30,0)}</g>`;
proof+=`<path d="M78 480 H440" stroke="#7ea3a2"/><text x="78" y="578" font-size="16" fill="#b5c4cf">82% of door height · 5.58 px headroom</text>`;
proof+=`<g transform="translate(660 480) scale(3.2)">${hull()+wallPanel('left')+wallPanel('right')}${astronaut(-62,0)}</g><text x="500" y="578" font-size="16" fill="#b5c4cf">Full-size wall tile · project wall height 60</text>`;
proof+=`<g transform="translate(1240 480) scale(3.2)">${chamber({outer:1,actor:true})}</g><text x="1040" y="578" font-size="16" fill="#b5c4cf">One 1×1 chamber · walk-through clearance</text>`;
proof+=`<text x="64" y="640" font-size="25" fill="#edf1f4">Simplified modular layout</text><text x="64" y="670" font-size="17" fill="#aebcca">A compact 2×2 core, one entry chamber, one tunnel and a greenhouse.</text>`;
const z=2.2,org={x:700,y:940};const at=(c,r)=>({x:org.x+(c-r)*48*z,y:org.y+(c+r)*24*z});
for(let d=0;d<=7;d++)for(let r=0;r<4;r++){const c=d-r;if(c<0||c>4)continue;const p=at(c,r);proof+=`<g transform="translate(${p.x} ${p.y}) scale(${z})">${polygon([[0,-24],[48,0],[0,24],[-48,0]],'#616b72','#7c878e',.35)}</g>`;}
for(const p of [...manifest.layout].sort((a,b)=>a.col+a.row-b.col-b.row||a.col-b.col)){const pos=at(p.col,p.row),body=assets.find(a=>a[0]===p.asset)[2];proof+=`<g transform="translate(${pos.x} ${pos.y}) scale(${z})">${body}</g>`;}
const actorPos=at(1,3);proof+=`<g transform="translate(${actorPos.x} ${actorPos.y}) scale(${z})">${astronaut(0,0)}</g>`;
proof+=`<text x="64" y="1440" font-size="25" fill="#edf1f4">Airlock states · same tile, camera, scale and anchor</text>`;
for(const [i,state] of [['airlock-outer-open','Outer open'],['airlock-pressure','Both sealed'],['airlock-inner-open','Inner open']].entries()){const [id,title]=state,body=assets.find(a=>a[0]===id)[2];proof+=`<g transform="translate(${280+i*500} 1655) scale(3)">${body}</g><text x="${280+i*500}" y="1740" text-anchor="middle" font-size="18" fill="#bdcad4">${title}</text>`;}
proof+='</g></svg>';await sharp(Buffer.from(proof)).png().toFile(path.join(dir,'scale-and-layout-preview.png'));
const times='0;.1;.27;.37;.62;.72;.88;1';
function movingDoors(x,y,inner){
 let body=portal(x,y,0,{frame:false});
 for(const side of ['left','right']){const n=side==='left'?-11:11;const values=(inner?[0,0,0,0,0,1,1,1]:[0,1,1,0,0,0,0,0]).map(v=>`${v*n} 0`).join(';');
 body=body.replace(`<g data-leaf="${side}" transform="translate(0 0)">`,`<g data-leaf="${side}"><animateTransform attributeName="transform" type="translate" values="${values}" keyTimes="${times}" dur="2.2s" repeatCount="indefinite"/>`);}
 return body;
}
const actorMotion=`<g><animateTransform attributeName="transform" type="translate" values="-48 24;-48 24;0 0;0 0;0 0;0 0;48 -24;48 -24" keyTimes="${times}" dur="2.2s" repeatCount="indefinite"/>${astronaut(0,0)}</g>`;
const cycle=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 300 233">${definitions}<rect width="300" height="233" fill="#15212f"/><text x="16" y="23" font-family="Arial" font-size="9" fill="#dce9ed">1×1 airlock · 2.2-second entry-cycle prototype</text><g transform="translate(150 145) scale(1.7)">${chamberFloor()}${movingDoors(24,-12,true)}${portal(24,-12,0,{leaves:false})}${actorMotion}${movingDoors(-24,12,false)}${portal(-24,12,0,{leaves:false})}</g><text x="16" y="221" font-family="Arial" font-size="7" fill="#9eb4c2">Outer door → board → seal / pressure → inner door → inside</text></svg>`;
await fs.writeFile(path.join(dir,'airlock-cycle.svg'),cycle);
console.log(JSON.stringify({opening,astronaut:actorHeight,wallHeight,footprint:contract.footprint,packages:assets.length,layoutCells:manifest.layout.length,airlockLayers:layers.length},null,2));
