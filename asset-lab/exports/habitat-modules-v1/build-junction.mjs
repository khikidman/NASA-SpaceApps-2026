import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
const dir=path.dirname(fileURLToPath(import.meta.url));
const reference=await fs.readFile(new URL('../airlock-tunnel-v1/exterior-solid.svg',import.meta.url),'utf8');
const defs=reference.match(/<defs>[\s\S]*?<\/defs>/)[0];
const h=42.02333931777379,door=31.02333931777379;
const poly=(pts,fill,stroke='#a89d8b',width=.55)=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const portal=(x,slope)=>`<g transform="matrix(1 ${slope} 0 1 ${x} 12)">
 <rect x="-11" y="-${door}" width="22" height="${door}" fill="url(#steel)"/>
 <path d="M-17 0 V-${door+4} Q-17 -${door+8} -13 -${door+8} H13 Q17 -${door+8} 17 -${door+4} V0 H11 V-${door} H-11 V0Z" fill="url(#ivory-light)" stroke="#9f9787" stroke-width=".5"/>
 <path d="M-13 0 V-${door+1} Q-13 -${door+4} -10 -${door+4} H10 Q13 -${door+4} 13 -${door+1} V0" fill="none" stroke="url(#gold)" stroke-width="2.8"/>
 <rect x="-8" y="-${door-6}" width="6" height="8" rx=".8" fill="url(#glass)"/><rect x="2" y="-${door-6}" width="6" height="8" rx=".8" fill="url(#glass)"/>
 <path d="M0 -${door} V0 M-8 -7 H-2 M2 -7 H8" stroke="#92959e" stroke-width=".7"/>
 <rect x="-6" y="-${door+7}" width="12" height="2" rx=".7" fill="#87cdd4"/>
 <path d="M-15 0 H15" stroke="#4b4d56" stroke-width="2"/>
 </g>`;
let body=poly([[-48,0],[0,24],[0,24-h],[-48,-h]],'url(#ivory-shade)')+
 poly([[0,24],[48,0],[48,-h],[0,24-h]],'url(#ivory-light)')+
 poly([[0,-24-h],[48,-h],[0,24-h],[-48,-h]],'url(#roof)','#d7c7ad',.7)+
 `<path d="M-48 0 L0 24 L48 0" stroke="#4b4d56" stroke-width="5" fill="none"/>
 <path d="M-48 -${h} L0 ${24-h} L48 -${h}" stroke="#fff0d5" stroke-width="1.1" fill="none"/>`;
const project=([c,r])=>[(c-r)*48,(c+r)*24-h-1];
const cross=[[-.12,-.38],[.12,-.38],[.12,-.12],[.38,-.12],[.38,.12],[.12,.12],[.12,.38],[-.12,.38],[-.12,.12],[-.38,.12],[-.38,-.12],[-.12,-.12]];
body+=poly(cross.map(project),'url(#glass)','#8d836f',2.1)+poly(cross.map(project),'url(#glass)','#f0cd7d',.85);
body+=`<path d="M0 ${-h-17} V${-h+17} M-34 -${h} H34" stroke="#c6d8de" stroke-opacity=".5" stroke-width=".5"/>`;
body+=portal(-24,.5)+portal(24,-.5);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">${defs}<g transform="translate(128 200)">${body}</g></svg>`;
await fs.writeFile(path.join(dir,'junction.svg'),svg);
await sharp(Buffer.from(svg)).png().toFile(path.join(dir,'junction.png'));
console.log('Created full-volume 1x1 junction with matching doors and a cross skylight.');
