import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html':'text/html', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.md':'text/plain' };
http.createServer(async (req,res)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'}).end(bytes);}
  catch{res.writeHead(404).end('Not found');}
}).listen(3134,'127.0.0.1',()=>console.log('Lunar asset lab preview: http://127.0.0.1:3134/preview.html'));
