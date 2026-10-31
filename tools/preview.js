// Read-only local preview of the actual static source, with no private-directory fallback.
const http=require('http'),fs=require('fs'),path=require('path');
const config={port:Number(process.env.PORT||8766)};
const dist=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf'};
function resolveFile(url){
 let pathname;try{pathname=decodeURIComponent(new URL(url,'http://localhost').pathname);}catch{return null;}
 if(pathname.split('/').some(p=>p.startsWith('.')) || !/^\/(?:index\.html$|pages\/|assets\/|css\/|js\/|data\/)/.test(pathname) && pathname!=='/') return null;
 if(pathname==='/') pathname='/index.html';
 const local=path.resolve(dist,'.'+pathname);
 if(!local.startsWith(dist+path.sep))return null;
 if(fs.existsSync(local)&&fs.statSync(local).isFile()&&fs.realpathSync(local).startsWith(fs.realpathSync(dist)+path.sep))return local;
 return null;
}
function start(){
 const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const file=resolveFile(req.url);if(!file){res.writeHead(404).end('File not found');return;}
  const size=fs.statSync(file).size;let start=0,end=size-1,status=200;
  if(req.headers.range){const m=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);if(!m){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
  if(file.includes(path.sep+'published'+path.sep)&&!/\.(pdf|png|jpe?g|webp|mp4|webm|mp3|wav|ogg)$/i.test(file)) res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(path.basename(file)));
  res.writeHead(status,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache'});
  if(req.method==='HEAD'){res.end();return;}
  fs.createReadStream(file,{start,end}).pipe(res);
 });
 server.on('error',e=>{console.error('Preview could not start:',e.message);process.exitCode=1;});
 server.listen(config.port,'127.0.0.1',()=>console.log(`Website preview: http://127.0.0.1:${config.port}\nLocal analytics are disabled. Press Ctrl+C to stop.`));
 return server;
}
if(require.main===module)start();
module.exports={resolveFile,mime,start};
