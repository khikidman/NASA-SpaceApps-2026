import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir=path.dirname(fileURLToPath(import.meta.url));
const reference=await fs.readFile(new URL('../airlock-tunnel-v1/exterior-solid.svg',import.meta.url),'utf8');
const defs=reference.match(/<defs>[\s\S]*?<\/defs>/)[0];
const height=42.02333931777379;
const poly=(pts,fill,stroke='#a89d8b',width=.55)=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const roof=[[0,-24-height],[48,-height],[0,24-height],[-48,-height]];
function hull(){return poly([[-48,0],[0,24],[0,24-height],[-48,-height]],'url(#ivory-shade)')+
 poly([[0,24],[48,0],[48,-height],[0,24-height]],'url(#ivory-light)')+poly(roof,'url(#roof)','#d7c7ad',.7)+
 `<path d="M-48 0 L0 24 L48 0" fill="none" stroke="#4b4d56" stroke-width="5"/>
 <path d="M-42 ${-height+9} L-6 ${-height+27} M6 ${-height+27} L42 ${-height+9}" stroke="url(#gold)" stroke-width="2.8"/>
 <path d="M-48 ${-height} L0 ${24-height} L48 ${-height}" fill="none" stroke="#fff0d5" stroke-width="1.1"/>`;}
function panel(x,y,slope,content){return `<g transform="matrix(1 ${slope} 0 1 ${x} ${y})">${content}</g>`;}
function window(){return '<rect x="-14" y="-13" width="28" height="17" rx="2" fill="#383d49" stroke="#b1a58f" stroke-width="1"/><rect x="-11" y="-10" width="22" height="11" rx="1" fill="url(#glass)"/><path d="M-8 0 L1 -10 H5 L-4 0Z" fill="#c5dfdf" opacity=".3"/><path d="M0 -10 V1" stroke="#d7cab0" stroke-width="1"/>';}
function dome(){
 let out=hull()+panel(-24,-3,.5,window())+panel(24,-3,-.5,window());
 out+=`<ellipse cy="${-height+1}" rx="34" ry="17" fill="#5b5d67" stroke="#89847a" stroke-width=".7"/><ellipse cy="${-height-2}" rx="34" ry="17" fill="#eee2cc" stroke="#c4b59d" stroke-width="1"/>`;
 const at=(band,i)=>{const theta=band*Math.PI/6,a=i*Math.PI/6,s=Math.sin(theta);return [33*Math.cos(a)*s,-height-3+16.5*Math.sin(a)*s-28*Math.cos(theta)];};
 const depth=(band,i)=>Math.sin(band*Math.PI/6)*Math.sin(i*Math.PI/6)*.866+Math.cos(band*Math.PI/6)*.5;
 const colors=['#6f8da8','#4a647e','#40546c','#38506a','#7896ad','#526e88'];
 const faces=[];
 for(let band=0;band<3;band++)for(let i=0;i<12;i++){
  const triangles=band===0?[[at(0,i),at(1,i),at(1,i+1)]]:[[at(band,i),at(band+1,i),at(band+1,i+1)],[at(band,i),at(band+1,i+1),at(band,i+1)]];
  triangles.forEach((points,t)=>faces.push({points,depth:depth(band+.6,i+.5),color:colors[(i+band+t)%colors.length]}));
 }
 faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces)out+=poly(f.points,f.color,'#ded8c9',.85);
 return out+`<path d="M-33 ${-height-3} Q0 ${-height+30} 33 ${-height-3}" fill="none" stroke="#f2e6cf" stroke-width="2"/>`;
}
function tank(x,y){return `<g transform="translate(${x} ${y})"><path d="M-8 -19 V1 A8 4 0 0 0 8 1 V-19Z" fill="url(#ivory-light)" stroke="#a49a89" stroke-width=".6"/><ellipse cy="-19" rx="8" ry="4" fill="#f4ead7" stroke="#afa18b" stroke-width=".5"/><path d="M-8 -13 Q0 -9 8 -13 M-8 -3 Q0 1 8 -3" fill="none" stroke="#50545f" stroke-width="3"/><rect x="-3" y="-25" width="6" height="6" rx="1" fill="#4c515e"/><path d="M-4 -25 H4" stroke="url(#gold)" stroke-width="2.4"/></g>`;}
function oxygen(){return hull()+
 panel(-24,-3,.5,'<rect x="-14" y="-14" width="28" height="20" rx="2" fill="#464b57" stroke="#a69b88" stroke-width="1"/><circle cx="-5" cy="-4" r="6" fill="#e7ddca"/><path d="M-9 -5 A4 4 0 0 1 -2 -7" stroke="#81cbd4" stroke-width="2" fill="none"/><path d="M-5 -4 L-2 -7" stroke="#454b58" stroke-width="1"/><path d="M5 -9 H10 M5 -4 H10 M5 1 H10" stroke="#88c8d3" stroke-width="1.5"/>')+
 panel(24,-3,-.5,'<rect x="-12" y="-13" width="24" height="18" rx="2" fill="#4b4d58" stroke="#aa9f8d" stroke-width="1"/><path d="M-8 -9 H8 M-8 -5 H8 M-8 -1 H8 M-8 3 H8" stroke="#7f8188" stroke-width="1.4"/>')+
 `<path d="M-15 ${-height-2} L14 ${-height+11}" stroke="#424954" stroke-width="4"/>`+
 tank(-12,-height-5)+tank(10,-height+6)+
 `<g transform="translate(21 ${-height-8})"><rect x="-8" y="-7" width="16" height="12" rx="2" fill="#484e5a" stroke="#b1a58f" stroke-width=".8"/><circle cx="-3" cy="-1" r="2" fill="#8bcfd7"/><path d="M1 -3 H5 M1 1 H5" stroke="#a2c6cf" stroke-width="1"/></g>`;}
const settings={brightness:1,contrast:1,saturation:1,scale:.25,anchorX:.5,anchorY:.78125,frameWidth:1024,frameHeight:1024};
const assets=[{id:'habitat-dome-v1',file:'dome',title:'Habitat · geodesic dome',height:height+31,body:dome()},{id:'habitat-oxygen-v1',file:'oxygen',title:'Habitat · oxygen systems',height:height+34,body:oxygen()}];
for(const a of assets){const vector=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">${defs}<g transform="translate(128 200)">${a.body}</g></svg>`;await fs.writeFile(path.join(dir,a.file+'.svg'),vector);await sharp(Buffer.from(vector)).png().toFile(path.join(dir,a.file+'.png'));}
await fs.writeFile(path.join(dir,'modules.json'),JSON.stringify({format:'asset-lab.habitat-modules/v1',reference:'../airlock-tunnel-v1',tile:{width:96,height:48},footprint:{width:1,height:1},shellHeight:height,settings,assets:assets.map(({body,...a})=>a)},null,2)+'\n');
console.log('Created dome and oxygen SVG/PNG assets at the airlock scale.');
