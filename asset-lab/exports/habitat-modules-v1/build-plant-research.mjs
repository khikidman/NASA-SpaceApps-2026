import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
const dir=path.dirname(fileURLToPath(import.meta.url));
const reference=await fs.readFile(new URL('../airlock-tunnel-v1/exterior-solid.svg',import.meta.url),'utf8');
const defs=reference.match(/<defs>[\s\S]*?<\/defs>/)[0];
const h=42.02333931777379;
const poly=(pts,fill,stroke='#a89d8b',width=.55)=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
function hull(){return poly([[-48,0],[0,24],[0,24-h],[-48,-h]],'url(#ivory-shade)')+
 poly([[0,24],[48,0],[48,-h],[0,24-h]],'url(#ivory-light)')+
 poly([[0,-24-h],[48,-h],[0,24-h],[-48,-h]],'url(#roof)','#d7c7ad',.7)+
 `<path d="M-48 0 L0 24 L48 0" fill="none" stroke="#4b4d56" stroke-width="5"/>
 <path d="M-42 ${-h+9} L-6 ${-h+27} M6 ${-h+27} L42 ${-h+9}" stroke="url(#gold)" stroke-width="2.8"/>
 <path d="M-48 -${h} L0 ${24-h} L48 -${h}" fill="none" stroke="#fff0d5" stroke-width="1.1"/>`;}
const panel=(x,slope,body)=>`<g transform="matrix(1 ${slope} 0 1 ${x} -3)">${body}</g>`;
function leaf(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 1 V-11" stroke="#76a85c" stroke-width="1.4"/><path d="M0 -3 Q-11 -14 -9 -7 Q-7 -1 0 -3Z" fill="#78b466" stroke="#456e45" stroke-width=".4"/><path d="M0 -6 Q9 -18 10 -11 Q10 -4 0 -6Z" fill="#a6cb7b" stroke="#5f8a50" stroke-width=".4"/></g>`;}
function growWindow(){return '<rect x="-15" y="-14" width="30" height="20" rx="2" fill="#364a50" stroke="#ada18b" stroke-width="1"/><rect x="-12" y="-11" width="24" height="14" rx="1" fill="#638e9c"/>'+leaf(-6,1,.55)+leaf(6,1,.55)+'<path d="M-12 3 H12" stroke="#dbd3b9" stroke-width="2"/><path d="M0 -11 V3" stroke="#e0d5be" stroke-width="1"/>';}
function plant(){
 let out=hull()+panel(-24,.5,growWindow())+panel(24,-.5,growWindow());
 out+=`<g transform="translate(0 ${-h-2})"><ellipse cy="2" rx="34" ry="17" fill="#646873" stroke="#8a877c" stroke-width=".7"/><ellipse rx="34" ry="17" fill="#ded3bb" stroke="#b4a68e" stroke-width="1"/>
 <path d="M-33 0 Q-34 -27 0 -32 Q34 -27 33 0 Q0 30 -33 0Z" fill="#6e9dad" stroke="#c9dfdc" stroke-width=".7"/>`;
 for(const [x,y] of [[-17,-3],[0,5],[17,-3]])out+=`<g transform="translate(${x} ${y})"><ellipse cy="2" rx="9" ry="5" fill="#b8a78a"/><ellipse rx="8" ry="4" fill="#564b40"/>${leaf(0,0,.85)}</g>`;
 out+=`<path d="M-33 0 Q-34 -27 0 -32 Q34 -27 33 0 Q0 30 -33 0Z" fill="#b6d8de" fill-opacity=".16"/>
 <path d="M-33 0 Q-13 -3 0 -32 Q13 -3 33 0 M0 -32 V16 M-28 -14 Q0 -1 28 -14" fill="none" stroke="#eee4cf" stroke-width="1.8"/>
 <path d="M-33 0 Q0 30 33 0" fill="none" stroke="#e5d8be" stroke-width="2.4"/>
 <path d="M-23 -16 Q-16 -22 -8 -23" fill="none" stroke="#d7eeee" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`;
 return out;
}
function instrumentWindow(){return '<rect x="-15" y="-14" width="30" height="20" rx="2" fill="#3c424f" stroke="#ada18b" stroke-width="1"/><rect x="-12" y="-11" width="24" height="14" rx="1" fill="url(#glass)"/><path d="M-8 -5 H-5 M-8 -1 H-3 M4 -8 V-1 M8 -6 V-1" stroke="#8bd2da" stroke-width="1.3"/><path d="M0 -11 V3" stroke="#d5cbb6" stroke-width="1"/>';}
function vial(x,y,color){return `<g transform="translate(${x} ${y})"><path d="M-3 -10 V0 Q0 3 3 0 V-10" fill="#b0d2db" stroke="#ded8c6" stroke-width=".7"/><path d="M-2 -4 V0 Q0 1 2 0 V-4Z" fill="${color}"/><rect x="-3.5" y="-12" width="7" height="3" rx=".8" fill="#505461"/></g>`;}
function research(){
 let out=hull()+panel(-24,.5,instrumentWindow())+panel(24,-.5,instrumentWindow());
 out+=`<g transform="matrix(1 .5 -1 .5 0 ${-h-1})"><rect x="-16" y="-14" width="32" height="28" rx="2" fill="#4b5260" stroke="#a79a80" stroke-width="1.7"/><rect x="-13" y="-11" width="26" height="22" rx="1" fill="url(#glass)" stroke="#e2c275" stroke-width=".7"/>
 <path d="M-3 -8 H3 M-2 -8 V-2 L-8 7 Q-8 8 -6 8 H6 Q8 8 8 7 L2 -2 V-8 M-5 3 H5" stroke="#deece5" stroke-width="1.2" fill="#8cbbc2" fill-opacity=".2"/>
 <circle cx="2" cy="5" r=".9" fill="#d8eae5"/></g>`;
 out+=`<g transform="translate(-19 ${-h+1})">${poly([[-10,0],[0,-5],[10,0],[0,5]],'#4b505c','#8f928c',.6)}${vial(-4,-1,'#87cdd4')}${vial(4,3,'#edbe63')}</g>`;
 return out;
}
const settings={brightness:1,contrast:1,saturation:1,scale:.25,anchorX:.5,anchorY:.78125,frameWidth:1024,frameHeight:1024};
const assets=[{id:'habitat-plant-v1',file:'plant',title:'Habitat · plant bay',height:h+35,body:plant()},{id:'habitat-research-v1',file:'research',title:'Habitat · research bay',height:h+26,body:research()}];
for(const a of assets){const vector=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">${defs}<g transform="translate(128 200)">${a.body}</g></svg>`;await fs.writeFile(path.join(dir,a.file+'.svg'),vector);await sharp(Buffer.from(vector)).png().toFile(path.join(dir,a.file+'.png'));}
await fs.writeFile(path.join(dir,'plant-research.json'),JSON.stringify({format:'asset-lab.habitat-modules/v1',reference:'../airlock-tunnel-v1',tile:{width:96,height:48},footprint:{width:1,height:1},shellHeight:h,settings,assets:assets.map(({body,...a})=>a)},null,2)+'\n');
console.log('Created matching 1x1 plant and southeast research bays.');
