import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const dir=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(await fs.readFile(path.join(dir,'layout.json'),'utf8'));
const zoom=1.65, origin={x:750,y:170};
const point=(c,r)=>({x:origin.x+(c-r)*48*zoom,y:origin.y+(c+r+1)*24*zoom});
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1050"><rect width="1500" height="1050" fill="#111b28"/><g font-family="Arial,sans-serif"><text x="64" y="58" fill="#a8c9cd" font-size="14" letter-spacing="3">ASSET LAB / MODULAR LUNAR BASE</text><text x="64" y="112" fill="#eef2f6" font-size="40" font-weight="bold">Lunar commons</text><text x="64" y="143" fill="#aab8c9" font-size="17">Six facility types. Three pressure-tunnel tiles. Every object occupies one 1×1 cell.</text>';
for(let d=0;d<=16;d++)for(let r=0;r<9;r++){const c=d-r;if(c<0||c>=9)continue;const p=point(c,r);svg+=`<polygon points="${p.x},${p.y-24*zoom} ${p.x+48*zoom},${p.y} ${p.x},${p.y+24*zoom} ${p.x-48*zoom},${p.y}" fill="${(c+r)%2?'#73777b':'#797d80'}" stroke="#8a9096" stroke-width="0.6"/>`;}
for(const p of [...data.placements].sort((a,b)=>a.col+a.row-b.col-b.row||a.col-b.col)){
 const a=data.assets.find(a=>a.id===p.asset),s=a.settings,pos=point(p.col,p.row),w=s.frameWidth*s.scale*zoom,h=s.frameHeight*s.scale*zoom;
 const image=(await fs.readFile(path.join(dir,a.image))).toString('base64');
 svg+=`<image href="data:image/png;base64,${image}" x="${pos.x-w*s.anchorX}" y="${pos.y-h*s.anchorY}" width="${w}" height="${h}"/>`;
}
for(const p of data.placements.filter(p=>!p.asset.startsWith('tunnel')&&p.id!=='solar-b'&&p.id!=='solar-c')){
 const a=data.assets.find(a=>a.id===p.asset),pos=point(p.col,p.row),y=pos.y-110;
 const title=p.asset==='base-solar'?'Solar field':a.title;
 svg+=`<rect x="${pos.x-90}" y="${y-22}" width="180" height="30" rx="5" fill="#111b28"/><text x="${pos.x}" y="${y}" fill="#edf3f8" text-anchor="middle" font-size="15">${title}</text>`;
}
svg+='<text x="64" y="934" fill="#dce8ec" font-size="21">A shared pressure spine links living, research, growing and airlock modules.</text><text x="64" y="969" fill="#a8b8c9" font-size="16">Solar and communications utilities sit outside the connected habitat cluster.</text><text x="64" y="1007" fill="#8194a9" font-size="14">Inspired by ESA Moon Village and NASA habitat concepts · game-scale interpretation · lab-only asset set</text></g></svg>';
await sharp(Buffer.from(svg)).png().toFile(path.join(dir,'layout-preview.png'));
console.log('Rendered layout-preview.png from exact placement manifest and unmodified sprite assets.');
