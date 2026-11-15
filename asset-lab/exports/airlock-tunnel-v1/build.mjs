import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { SOURCE_FILES, sha256, sealPackage, verifyPackage } from '../../core/package.mjs';

const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../..');
const registrations=JSON.parse(await fs.readFile(path.join(root,'src/assets/buildings/lunar-base-modules.json'),'utf8'));
const atlas=JSON.parse(await fs.readFile(path.join(root,'src/assets/characters/astronaut-atlas.json'),'utf8'));
const doorHeight=registrations.airlock.openingHeight*registrations.airlock.displayWidth/registrations.airlock.pixelWidth;
const actorHeight=doorHeight*.82,height=doorHeight+11;
const atlasData=(await fs.readFile(path.join(root,'public/assets/characters/astronaut-sheet-v1.png'))).toString('base64');
const corner=[[0,-24],[48,0],[0,24],[-48,0]];
const polygon=(p,fill,stroke='#9c9589',width=.45)=>`<polygon points="${p.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const definitions=`<defs>
 <linearGradient id="ivory-light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff2db"/><stop offset="1" stop-color="#d1c2a9"/></linearGradient>
 <linearGradient id="ivory-shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4d8c1"/><stop offset="1" stop-color="#b6a991"/></linearGradient>
 <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#faf0dd"/><stop offset="1" stop-color="#daccb4"/></linearGradient>
 <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#62636d"/><stop offset="1" stop-color="#363841"/></linearGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffdb7c"/><stop offset=".5" stop-color="#efb42d"/><stop offset="1" stop-color="#ba7e1a"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9fcddc"/><stop offset=".5" stop-color="#5f88a6"/><stop offset="1" stop-color="#33495f"/></linearGradient>
 <mask id="outer-aperture"><rect x="-100" y="-150" width="200" height="250" fill="white"/><g transform="matrix(1 .5 0 1 -24 12)"><rect x="-11" y="-${doorHeight}" width="22" height="${doorHeight}" fill="black"/></g></mask>
 <mask id="inner-aperture"><rect x="-100" y="-150" width="200" height="250" fill="white"/><g transform="matrix(1 .5 0 1 24 -12)"><rect x="-11" y="-${doorHeight}" width="22" height="${doorHeight}" fill="black"/></g></mask>
 <clipPath id="door-clip"><rect x="-11" y="-${doorHeight}" width="22" height="${doorHeight}"/></clipPath>
</defs>`;
function wall(a,b,fill){return polygon([a,b,[b[0],b[1]-height],[a[0],a[1]-height]],fill)+`<path d="M${a[0]} ${a[1]-height} L${b[0]} ${b[1]-height}" stroke="#fff0d5" stroke-width="1.1"/>`;}
function floor(){let out=polygon(corner,'#777984','#52545d',.8);for(let i=0;i<5;i++){const r=-.4+i*.2;out+=`<path d="M${(-.43-r)*48} ${(-.43+r)*24} L${(.43-r)*48} ${(.43+r)*24}" stroke="#c1c0b7" stroke-width=".6"/>`;}
return out+`<path d="M-48 0 L0 24 L48 0" fill="none" stroke="#4b4d56" stroke-width="2"/>`;}
const farSide=wall(corner[3],corner[0],'url(#ivory-shade)');
const farEnd=`<g mask="url(#inner-aperture)">${wall(corner[0],corner[1],'url(#ivory-light)')}</g>`;
const nearSide=wall(corner[1],corner[2],'url(#ivory-light)')+`<path d="M42 -4 L6 14" stroke="#51535d" stroke-width="3"/>`+
 `<path d="M42 ${-height+6} L6 ${-height+24}" stroke="url(#gold)" stroke-width="2"/>`;
const nearEnd=`<g mask="url(#outer-aperture)">${wall(corner[3],corner[2],'url(#ivory-shade)')}</g>`;
let ceiling=polygon(corner.map(([x,y])=>[x,y-height]),'url(#roof)','#d7c7ad',.7);
for(const row of [-.3,0,.3]){const a=[(-.46-row)*48,(-.46+row)*24-height],b=[(.46-row)*48,(.46+row)*24-height];ceiling+=`<path d="M${a.join(' ')} L${b.join(' ')}" stroke="#c6b99f" stroke-width=".7"/>`;}
ceiling+=`<g transform="matrix(1 .5 -1 .5 0 ${-height})"><rect x="-6" y="-5" width="12" height="10" rx="1.2" fill="#51535b" stroke="#8f8e86" stroke-width=".6"/><path d="M-4 -2 H4 M-4 1 H4" stroke="#a9a79e" stroke-width=".7"/></g>`;
function frame(x,y,color){return `<g transform="matrix(1 .5 0 1 ${x} ${y})"><path d="M-17 0 V-${doorHeight+4} Q-17 -${doorHeight+8} -13 -${doorHeight+8} H13 Q17 -${doorHeight+8} 17 -${doorHeight+4} V0 H11 V-${doorHeight} H-11 V0Z" fill="url(#ivory-light)" stroke="#9f9787" stroke-width=".5"/><path d="M-13 0 V-${doorHeight+1} Q-13 -${doorHeight+4} -10 -${doorHeight+4} H10 Q13 -${doorHeight+4} 13 -${doorHeight+1} V0" fill="none" stroke="url(#gold)" stroke-width="2.8"/><rect x="-6" y="-${doorHeight+7}" width="12" height="2" rx=".7" fill="${color}"/><path d="M-14 0 H14" stroke="#51535c" stroke-width="2"/></g>`;}
function leaves(x,y,open=0){const leaf=(left)=>`<g data-leaf="${left?'left':'right'}" transform="translate(${(left?-11:11)*open} 0)"><rect x="${left?-11:0}" y="-${doorHeight}" width="11" height="${doorHeight}" fill="url(#steel)" stroke="#797b86" stroke-width=".5"/><rect x="${left?-9:2}" y="-${doorHeight-6}" width="7" height="7" rx=".8" fill="url(#glass)"/><path d="M${left?-9:2} -8 H${left?-2:9}" stroke="#9a9ca3" stroke-width="1"/></g>`;
return `<g transform="matrix(1 .5 0 1 ${x} ${y})"><g clip-path="url(#door-clip)">${leaf(true)}${leaf(false)}</g></g>`;}
function actor(x=0,y=0){const f=atlas.frames[0],s=actorHeight/f.referenceHeight;return `<svg x="${x-f.anchorX*s}" y="${y-f.anchorY*s}" width="${f.width*s}" height="${f.height*s}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" overflow="hidden"><image href="data:image/png;base64,${atlasData}" width="1536" height="1024"/></svg>`;}
const configs=[
 {id:'exterior-solid',title:'1 · Exterior / solid',floor:1,far:1,near:1,ceiling:1,innerFrame:1,outerFrame:1,innerDoor:1,outerDoor:1,innerOpen:0,outerOpen:0,light:'#87cdd4'},
 {id:'interior-phase-1',title:'2 · Inside / phase 1 of 2',floor:1,far:1,near:.06,ceiling:.06,innerFrame:1,outerFrame:.16,innerDoor:1,outerDoor:.06,innerOpen:0,outerOpen:0,light:'#edbe63'},
 {id:'interior-phase-2',title:'3 · Inside / phase 2 of 2',floor:.25,far:.035,near:0,ceiling:0,innerFrame:.08,outerFrame:.06,innerDoor:0,outerDoor:0,innerOpen:1,outerOpen:0,light:'#88d5af'},
];
const opacity=(part,n,body)=>`<g data-part="${part}" opacity="${n}">${body}</g>`;
function body(c,withActor=false){return opacity('floor',c.floor,floor())+opacity('far-enclosure',c.far,farSide+farEnd)+
 opacity('inner-door',c.innerDoor,leaves(24,-12,c.innerOpen))+opacity('inner-frame',c.innerFrame,frame(24,-12,c.light))+
 (withActor?actor(c.id==='interior-phase-2'?32:0,c.id==='interior-phase-2'?-16:0):'')+
 opacity('near-enclosure',c.near,nearSide+nearEnd)+opacity('outer-door',c.outerDoor,leaves(-24,12,c.outerOpen))+
 opacity('outer-frame',c.outerFrame,frame(-24,12,c.light))+opacity('ceiling',c.ceiling,ceiling);}
const wrap=b=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">${definitions}<g transform="translate(128 200)">${b}</g></svg>`;
const settings={brightness:1,contrast:1,saturation:1,scale:.25,anchorX:.5,anchorY:200/256,frameWidth:1024,frameHeight:1024};
const source={gitCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),files:await Promise.all(SOURCE_FILES.map(async p=>({path:p,sha256:await sha256(await fs.readFile(path.join(root,p)))})))};
const manifest={format:'asset-lab.airlock-visibility-states/v1',id:'airlock-tunnel-v1',footprint:{width:1,height:1},tile:{width:96,height:48},shellHeight:height,
 clearDoor:{height:doorHeight,projectedWidth:22},astronautHeight:actorHeight,settings,
 thresholds:{inner:[24,-12],outer:[-24,12]},axis:'row',
 states:configs,packages:[],
 visibilityOnly:'Transparency changes rendering only. The enclosure remains physically sealed and collision occupancy remains 1x1. In phase 2 the outer door is still closed but visually hidden; inner door is open.',
 layerOrder:['floor','far-enclosure','inner-door','inner-frame','astronaut / base-interior','near-enclosure','outer-door','outer-frame','ceiling'],
 transition:'Crossfade part opacities in the layered SVG or renderer; do not crossfade the entire actor/interior with the shell. Source geometry and anchor are invariant.',
 integration:'Lab handoff only; no main code modifications. Existing interior door height 45 must be reconciled with the exterior-derived 31.0233 when binding.',
};
for(const c of configs){const vector=wrap(body(c));await fs.writeFile(path.join(dir,c.id+'.svg'),vector);const bytes=await sharp(Buffer.from(vector)).png().toBuffer();await fs.writeFile(path.join(dir,c.id+'.png'),bytes);
 const file={mime:'image/png',width:1024,height:1024,base64:bytes.toString('base64'),sha256:await sha256(bytes)};
 const pkg=await sealPackage({format:'spaceapps.assetlab/v1',generatorVersion:'image-v1',asset:{id:'airlock-tunnel-'+c.id,title:c.title+' · 1×1 airlock',kind:'sprite'},revision:{id:randomUUID(),parentId:null,createdAt:new Date().toISOString(),author:'Codex',note:'Enclosed 1x1 airlock at existing character scale. One shared geometry; graded shell visibility for outside, chamber and base-interior views. Visibility is independent of physical door interlock.'},lineage:[],source,payload:{original:{name:c.id+'.png',width:1024,height:1024,inputSha256:file.sha256},settings},files:[{name:'source.png',...file},{name:'sprite.png',...file}],environment:{renderer:'Native SVG module geometry; Sharp RGBA export',browser:'Offline asset lab'}});
 await verifyPackage(pkg);await fs.writeFile(path.join(dir,c.id+'.assetlab.json'),JSON.stringify(pkg,null,2)+'\n');manifest.packages.push(c.id+'.assetlab.json');
 assert(c.innerOpen+c.outerOpen<=1,'Door interlock');
}
const layers={floor:floor(),'far-enclosure':farSide+farEnd,'near-enclosure':nearSide+nearEnd,ceiling,
 'inner-frame':frame(24,-12,'#87cdd4'),'outer-frame':frame(-24,12,'#87cdd4'),
 'inner-doors-closed':leaves(24,-12),'outer-doors-closed':leaves(-24,12)};
for(const [id,b] of Object.entries(layers))await fs.writeFile(path.join(dir,'layer-'+id+'.svg'),wrap(b));
await fs.writeFile(path.join(dir,'airlock-tunnel.states.json'),JSON.stringify(manifest,null,2)+'\n');

// Context proof uses the actual astronaut atlas. No character is baked into asset PNGs.
let proof=`<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="1000" viewBox="0 0 1680 1000">${definitions}<rect width="1680" height="1000" fill="#121d2a"/><g font-family="Arial,sans-serif"><text x="64" y="56" font-size="14" fill="#9dc7c5" letter-spacing="3">ASSET LAB / ENCLOSED AIRLOCK</text><text x="64" y="112" font-size="39" fill="#eef2f5" font-weight="bold">One chamber. Three visibility states.</text><text x="64" y="151" font-size="19" fill="#a9bdcb">1×1 footprint · 96×48 world pixels · astronaut 25.44 high · door clearance 31.02 high</text>`;
for(const [i,c] of configs.entries()){
 const cx=280+i*560;
 proof+=`<rect x="${cx-252}" y="196" width="504" height="580" rx="16" fill="#1a2938"/><text x="${cx-220}" y="240" fill="#e5ecef" font-size="23">${c.title}</text><g transform="translate(${cx} 590) scale(3.6)">`;
 if(i===2){proof+=`<g opacity=".65">${polygon([[-12,-54],[48,-24],[0,0],[-60,-30]],'#467075','#638e91',.7)}<path d="M-12 -54 L48 -24 M-36 -42 L24 -12 M-60 -30 L0 0" stroke="#719d9e" stroke-width=".6"/></g>`;}
 proof+=body(c,i>0);
 if(i===0)proof+=actor(-55,22);
 proof+='</g>';
 const lines=i===0?['Solid roof and four walls','Sealed exterior door','Full physical enclosure']:i===1?['Near walls + roof: 6% opacity','Far enclosure remains solid','Astronaut stays fully opaque']:['Upper shell hidden or ≤8% opacity','Floor fades to 25%','Base interior stays readable'];
 for(const [j,line] of lines.entries())proof+=`<text x="${cx-220}" y="${690+j*27}" fill="#b7c9d3" font-size="17">${line.replaceAll('&','&amp;')}</text>`;
}
proof+=`<text x="64" y="842" font-size="24" fill="#e3ecef">Shared geometry, anchor and character scale in every state.</text><text x="64" y="883" font-size="18" fill="#a6bac9">Transparency is a camera cutaway, not a physical opening. The door interlock remains independent.</text><text x="64" y="923" font-size="18" fill="#a6bac9">The colored floor in phase 2 represents the base interior behind the fading airlock.</text><text x="64" y="971" font-size="15" fill="#7d99ab">Lab-only SVG + transparent PNG assets · separate shell layers · validated import packages</text></g></svg>`;
await sharp(Buffer.from(proof)).png().toFile(path.join(dir,'three-state-preview.png'));
console.log(JSON.stringify({states:configs.length,footprint:manifest.footprint,doorHeight,actorHeight,height,layerCount:Object.keys(layers).length,validated:true},null,2));
