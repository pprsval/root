// Offline orchestration. Existing Node/PowerShell legacy generators remain unchanged.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {execFileSync} = require('child_process');
const categories = ['cad', 'drawings', 'photo', 'writings'];
const raster = /\.(png|jpe?g|webp)$/i;
const viewable = /\.(png|jpe?g|webp|pdf|mp4|webm|mp3|wav|ogg)$/i;
function hash(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
function read(file, fallback) { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')) : fallback; }
function write(file, value) { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, value); }
function safe(base, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes(':') || relative.startsWith('/') || relative.split('/').some(p=>p==='..'||p==='.'||!p)) throw Error('Invalid relative path: '+relative);
  const file = path.resolve(base, relative);
  if (!file.startsWith(path.resolve(base)+path.sep)) throw Error('Path outside content directory: '+relative);
  if(fs.existsSync(file) && !fs.realpathSync(file).startsWith(fs.realpathSync(base)+path.sep)) throw Error('Link outside content directory: '+relative);
  return file;
}
function walk(dir, prefix='') {
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!e.name.startsWith('.')).flatMap(e=>{
    const rel=prefix+e.name; const p=safe(dir,e.name);
    if(e.isSymbolicLink()) throw Error('Symbolic links are not supported: '+p);
    return e.isDirectory()?walk(p,rel+'/'):[rel];
  });
}
function run(root=path.resolve(__dirname,'..')) {
  if(Number(process.versions.node.split('.')[0])<18) throw Error('Node.js 18 or newer is required.');
  root=path.resolve(root);
  const config=read(path.join(root,'content/public-content.json'),{});
  const privateRoot=path.resolve(root,config.privateRoot||'../portfolio-private');
  if(privateRoot===root || privateRoot.startsWith(root+path.sep)) throw Error('Private content MUST be outside the public website root.');
  if(fs.existsSync(privateRoot)) { const realPrivate=fs.realpathSync(privateRoot), realRoot=fs.realpathSync(root); if(realPrivate===realRoot||realPrivate.startsWith(realRoot+path.sep)) throw Error('Private content resolves inside public root.'); }
  for(const c of categories) {
    if(!fs.existsSync(path.join(root,'assets',c)))throw Error('Missing public category: '+c);
  }
  execFileSync('magick',['-version'],{stdio:'pipe'}); // Fail before writing if tooling is missing.
  const warnings=[]; const warn=m=>warnings.push(m);
  for(const entry of fs.existsSync(privateRoot)?fs.readdirSync(privateRoot):[]){if(!entry.startsWith('.') && entry!=='items.json' && !categories.includes(entry)) throw Error('No category assigned to private entry: '+entry+'; use cad/drawings/photo/writings.');}
  const records=read(path.join(privateRoot,'items.json'),{});
  if(Array.isArray(records)||typeof records!=='object'||records===null)throw Error('items.json must be a JSON object.');
  const authored=new Set(config.authoredArticles||[]);
  const active=/\.(?:html?|xhtml|shtml|svgz?|js|mjs|cjs|jsx|ts|tsx|php\d*|phtml|asp|aspx|jsp|cgi|exe|dll|com|scr|msi|msix|bat|cmd|ps1|vbs|vbe|wsf|wsh|hta|lnk|url|sh|bash|py|pl|rb|jar|class|wasm|reg|desktop)$/i;
  for(const c of categories) for(const f of walk(path.join(root,'assets',c))) {
    const relative='assets/'+c+'/'+f;
    const file=safe(root,relative);
    if(authored.has(relative)&&f.endsWith('/index.html')) continue;
    if(active.test(f)) throw Error('Active/executable file in public assets: '+relative+'. Keep source files outside the public root; create authored articles with tools/create-article.js.');
    // Catch executable/active content disguised with an innocuous extension.
    const fd=fs.openSync(file,'r'),head=Buffer.alloc(512);let length;try{length=fs.readSync(fd,head,0,512,0);}finally{fs.closeSync(fd);}
    const text=head.subarray(0,length).toString('utf8').trimStart();
    if(head.subarray(0,2).toString()==='MZ'||head.subarray(0,4).equals(Buffer.from([127,69,76,70]))||/^(?:#!|<\?php|<(?:!doctype\s+html|html|script|svg)\b)/i.test(text)||/<svg\b/i.test(text)) throw Error('Active/executable content detected: '+relative);
    if(raster.test(f)) {
      const png=head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpeg=head[0]===255&&head[1]===216&&head[2]===255;
      const webp=head.subarray(0,4).toString()==='RIFF'&&head.subarray(8,12).toString()==='WEBP';
      if(!png&&!jpeg&&!webp)throw Error('Invalid raster image: '+relative);
    }
  }
  const inventory=categories.flatMap(c=>walk(path.join(privateRoot,c)).map(f=>c+'/'+f));
  const consumed=new Set();
  function privateFile(ref) {const p=safe(privateRoot,ref);if(!categories.includes(ref.split('/')[0]))throw Error('Unknown category in '+ref);if(!fs.existsSync(p)||!fs.statSync(p).isFile())throw Error('Missing private file: '+ref);return p;}
  for(const [file,m] of Object.entries(records)) {
    privateFile(file); if(typeof m!=='object'||m===null||Array.isArray(m))throw Error('Invalid metadata: '+file);
    if(m.category && m.category!==file.split('/')[0])throw Error('Ambiguous category: '+file);
    if(m.date && !/^\d{4}-\d{2}-\d{2}$/.test(m.date))throw Error('Use YYYY-MM-DD for '+file);
    if(m.order!==undefined&&!Number.isFinite(m.order))throw Error('order must be numeric: '+file);
    for(const key of ['publishOriginal','download','hidden','standalone'])if(m[key]!==undefined&&typeof m[key]!=='boolean')throw Error(key+' must be boolean: '+file);
    if(m.cover){privateFile(m.cover);if(!raster.test(m.cover))throw Error('Cover must be PNG/JPG/WebP: '+m.cover);consumed.add(m.cover);}
    if(m.attachments!==undefined&&!Array.isArray(m.attachments))throw Error('attachments must be an array: '+file);
    for(const a of m.attachments||[]){if(!a||typeof a!=='object')throw Error('Invalid attachment: '+file);privateFile(a.file);consumed.add(a.file);for(const k of ['publish','download'])if(a[k]!==undefined&&typeof a[k]!=='boolean')throw Error('Attachment '+k+' must be boolean: '+file);}
  }
  // Deterministic same-stem pairing; ambiguous matches are errors, absent covers get a visible placeholder.
  const autoCovers={};
  for(const file of inventory.filter(f=>!raster.test(f)&&!consumed.has(f))) {
    if(records[file]?.cover)continue;
    const stem=file.replace(/\.[^/.]+$/,'');const matches=inventory.filter(f=>raster.test(f)&&f.replace(/\.[^/.]+$/,'')===stem);
    if(matches.length>1)throw Error('Ambiguous covers for '+file+': '+matches.join(', '));
    if(matches[0]){autoCovers[file]=matches[0];consumed.add(matches[0]);}
  }
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-update-'));
  const staged=new Map();const generated=new Set();const nextCache={};const oldCache=read(path.join(root,'.content-cache.json'),{});
  const previewMap={};let previewWrites=0, previewReuse=0;
  function stage(rel,data){safe(root,rel);const file=safe(temp,rel);write(file,data);staged.set(rel,file);}
  function outputJson(rel,data){stage(rel,JSON.stringify(data,null,2)+'\n');}
  function publicCopy(source,rel){generated.add(rel);if(fs.existsSync(path.join(root,rel))&&hash(fs.readFileSync(source))===hash(fs.readFileSync(path.join(root,rel))))return;stage(rel,fs.readFileSync(source));}
  function previews(source,key,category,outputPrefix) {
    if(nextCache[key]) return nextCache[key].preview;
    const digest=hash(fs.readFileSync(source));const signature='v2-q84-orient-240-480-960-1440:'+digest;
    const cached=oldCache[key];
    if(cached?.signature===signature && cached.preview.variants.every(v=>fs.existsSync(path.join(root,'assets',v.file)))){
      nextCache[key]=cached;previewMap[key]=cached.preview;cached.preview.variants.forEach(v=>generated.add('assets/'+v.file));previewReuse++;return cached.preview;
    }
    const dims=execFileSync('magick',[source,'-auto-orient','-format','%w %h','info:'],{encoding:'utf8'}).trim().split(/\s+/).map(Number);
    if(dims.length!==2||!dims.every(Number.isFinite))throw Error('Cannot read image dimensions: '+source);
    const widths=[...new Set([240,480,960,...(category==='cad'?[1440]:[])].map(w=>Math.min(w,dims[0])))];const variants=[];
    for(const width of widths){const file=outputPrefix+'.'+width+'.webp';const rel='assets/'+file;const dest=safe(temp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});execFileSync('magick',[source,'-auto-orient','-resize',width+'x>','-strip','-quality','84',dest]);staged.set(rel,dest);generated.add(rel);variants.push({file,width});}
    const preview={width:dims[0],height:dims[1],variants};nextCache[key]={signature,preview};previewMap[key]=preview;previewWrites++;return preview;
  }
  try {
    // Run the existing generator against a lightweight mirror, never over curated production JSON.
    for(const c of categories){const dest=path.join(temp,'assets',c);fs.mkdirSync(dest,{recursive:true});
      for(const f of walk(path.join(root,'assets',c))){const src=path.join(root,'assets',c,f);const target=path.join(dest,f);write(target,/\.html$/i.test(f)?fs.readFileSync(src):'');const stat=fs.statSync(src);fs.utimesSync(target,stat.atime,stat.mtime);}
      for(const entry of fs.readdirSync(path.join(root,'assets',c),{withFileTypes:true}).filter(d=>d.isDirectory())){const stat=fs.statSync(path.join(root,'assets',c,entry.name));fs.mkdirSync(path.join(dest,entry.name),{recursive:true});fs.utimesSync(path.join(dest,entry.name),stat.atime,stat.mtime);}
    }
    execFileSync(process.execPath,[path.join(root,'tools/generate.js'),temp],{stdio:'pipe'});
    const outputs={};
    for(const c of categories){
      const old=read(path.join(root,'data',c+'.json'),[]).filter(i=>!i.managed);
      const fresh=read(path.join(temp,'data',c+'.json'),[]);
      const originals=fresh.map(i=>{
        const key=c+'/'+i.file;
        const prior=old.find(o=>o.file===i.file);
        const result={...i,...prior};
        // Refresh authored HTML metadata only when the generated field was not manually curated.
        if(i.file.endsWith('/index.html')) {
          for(const field of ['title','description','type']) if(typeof i[field]==='string') i[field]=i[field].replace(/&(amp|lt|gt|quot|#39);/g,(_,entity)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[entity]));
          const previous=oldCache.__articleMetadata?.[key];
          for(const field of ['title','description','type','date','cover']) if(!prior || previous && JSON.stringify(prior[field])===JSON.stringify(previous[field])) result[field]=i[field];
          nextCache.__articleMetadata ||= {}; nextCache.__articleMetadata[key]=i;
        }
        return {...result,...((config.overrides||{})[key]||{})};
      });
      // Any ordinary public file type is discovered; unsafe active types were rejected above.
      for(const f of walk(path.join(root,'assets',c)).filter(name=>![...authored].some(a=>a.startsWith('assets/'+c+'/')&&name.startsWith(a.slice(('assets/'+c+'/').length).replace(/index\.html$/,'')))).map(name=>({name}))){if(!originals.some(i=>i.file===f.name))originals.push({file:f.name,title:f.name,date:fs.statSync(path.join(root,'assets',c,f.name)).mtime.toISOString().slice(0,10),tags:[c],...old.find(o=>o.file===f.name),...((config.overrides||{})[c+'/'+f.name]||{})});}
      const covers=new Set();
      for(const i of originals){
        if(!fs.existsSync(safe(path.join(root,'assets',c),i.file))) throw Error('Missing public item: '+c+'/'+i.file);
        const explicitCover=(config.overrides||{})[c+'/'+i.file]?.cover;
        if(!raster.test(i.file)&&!explicitCover&&!/\.html$/i.test(i.file)){const candidates=originals.filter(o=>raster.test(o.file)&&o.file.replace(/\.[^/.]+$/,'')===i.file.replace(/\.[^/.]+$/,''));if(candidates.length>1)throw Error('Ambiguous public covers: '+i.file);}
        if(!raster.test(i.file)&&!i.cover){const matches=originals.filter(o=>raster.test(o.file)&&o.file.replace(/\.[^/.]+$/,'')===i.file.replace(/\.[^/.]+$/,''));if(matches.length>1)throw Error('Ambiguous public covers: '+i.file);if(matches[0])i.cover=matches[0].file;}
        if(i.cover){const cover=safe(path.join(root,'assets',c),i.cover);if(!fs.existsSync(cover)||!raster.test(cover))throw Error('Invalid public cover: '+i.cover);covers.add(i.cover);}
        i.category=c;i.fileType=path.extname(i.file).slice(1).toLowerCase();
        if(!raster.test(i.file)&&!i.cover&&!/\.html$/i.test(i.file))warn('No cover, placeholder used: '+c+'/'+i.file);
      }
      for(const i of originals){const image=raster.test(i.file)?i.file:i.cover;if(image)previews(path.join(root,'assets',c,image),c+'/'+image,c,'previews/'+c+'/'+image);}
      outputs[c]=originals;
    }
    const attached=new Set();
    for(const c of categories) for(const item of outputs[c]) for(const attachment of item.attachments||[]) {
      if(!attachment||typeof attachment.file!=='string'||!categories.includes(attachment.file.split('/')[0]))throw Error('Invalid public attachment: '+item.file);
      if(!fs.existsSync(safe(path.join(root,'assets'),attachment.file)))throw Error('Missing public attachment: '+attachment.file);
      attached.add(attachment.file);
    }
    for(const c of categories) outputs[c]=outputs[c].filter(i=>!attached.has(c+'/'+i.file)||i.standalone);
    for(const file of inventory){const m=records[file]||{};if(consumed.has(file)&&!m.standalone)continue;if(m.hidden)continue;
      const category=file.split('/')[0],source=privateFile(file),id=hash(file).slice(0,20),extension=path.extname(file).slice(1).toLowerCase();
      const item={file:'@private/'+id,managed:true,category,fileType:extension,title:m.title||path.basename(file),description:m.description||'',date:m.date||'',order:m.order??null,tags:[category]};
      if(!m.title)warn('Filename used as title; add metadata if needed: '+file);
      const cover=m.cover||autoCovers[file]||(raster.test(file)?file:null);
      if(cover){const key=category+'/'+item.file;item.preview=previews(privateFile(cover),key,category,'previews/managed/'+id);}
      else warn('No preview; visible file-type placeholder: '+file);
      if(m.publishOriginal===true){if(!viewable.test(file)&&m.download!==true)throw Error('Non-viewable original requires explicit download:true as well as publishOriginal:true: '+file);const rel='assets/published/'+id+'/'+path.basename(file);publicCopy(source,rel);item.publicFile=rel.slice(7);item.download=m.download===true;}
      else if(m.download===true)throw Error('download:true requires publishOriginal:true: '+file);
      item.attachments=[];
      for(const a of m.attachments||[]){if(!a.publish){if(a.download)throw Error('Attachment download requires publish:true: '+a.file);continue;}if(!viewable.test(a.file)&&!a.download)throw Error('Non-viewable attachment requires download:true: '+a.file);const aid=hash(a.file).slice(0,20);const rel='assets/published/'+aid+'/'+path.basename(a.file);publicCopy(privateFile(a.file),rel);item.attachments.push({file:rel.slice(7),label:a.label||path.basename(a.file),download:a.download===true});}
      if(fs.statSync(source).size>100*1024*1024)warn('File exceeds 100 MiB; check actual host limits before publication: '+file);
      outputs[category].push(item);
    }
    for(const c of categories){const arr=outputs[c];arr.sort((a,b)=>(a.order??Infinity)-(b.order??Infinity)||(b.date||'').localeCompare(a.date||'') );outputJson('data/'+c+'.json',arr);}
    outputJson('data/previews.json',previewMap);
    // Validate references in all public HTML before committing generated data.
    for(const rel of walk(root).filter(f=>f.endsWith('.html')&&(f==='index.html'||f.startsWith('pages/')||f.startsWith('assets/')&&!f.startsWith('assets/published/')))){const html=fs.readFileSync(path.join(root,rel),'utf8');for(const [,link] of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(/^(?:#|https?:|mailto:|data:)/.test(link))continue;const clean=decodeURIComponent(link.split('#')[0].split('?')[0]);const target=path.resolve(root,path.dirname(rel),clean);if(!target.startsWith(root+path.sep)||(!fs.existsSync(target)&&!staged.has(path.relative(root,target).replaceAll('\\','/'))))throw Error('Broken HTML reference: '+rel+' -> '+link);}}
    // All validation passed. Only managed derivatives/public copies may be removed on revocation.
    const previous=read(path.join(root,'.content-generated.json'),[]);
    for(const [rel,file] of staged){const dest=safe(root,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);}
    for(const rel of previous.filter(f=>!generated.has(f))){if(!/^assets\/(?:previews\/managed|published)\//.test(rel))continue;const dest=safe(root,rel);if(fs.existsSync(dest))fs.unlinkSync(dest);}
    write(path.join(root,'.content-cache.json'),JSON.stringify(nextCache,null,2));
    write(path.join(root,'.content-generated.json'),JSON.stringify([...generated],null,2));
    warnings.forEach(m=>console.warn('WARNING: '+m));
    console.log('SUCCESS: '+categories.map(c=>c+'='+outputs[c].length).join(', ')+`; preview sources generated=${previewWrites}, reused=${previewReuse}; warnings=${warnings.length}. No originals deleted.`);
    return {outputs,warnings,previewWrites,previewReuse};
  } finally {if(path.dirname(temp)===os.tmpdir()&&path.basename(temp).startsWith('portfolio-update-'))fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module){try{run(process.argv[2]?path.resolve(process.argv[2]):undefined);}catch(e){console.error('ERROR: '+e.message);process.exitCode=1;}}
module.exports={run,safe};
