const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const source=path.resolve(__dirname,'..');
const os=require('os');
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-test-')),root=path.join(fixture,'site'),priv=path.join(fixture,'private');
function put(p,text){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}
for(const c of ['cad','drawings','photo','writings']){fs.mkdirSync(path.join(root,'assets',c),{recursive:true});fs.mkdirSync(path.join(priv,c),{recursive:true});put(path.join(root,'data',c+'.json'),'[]');}
put(path.join(root,'content/public-content.json'),JSON.stringify({privateRoot:'../private',authoredArticles:[],overrides:{}}));
for(const f of ['generate.js','update-content.js'])put(path.join(root,'tools',f),fs.readFileSync(path.join(source,'tools',f)));
const pdf=fs.readFileSync(path.join(source,'assets/drawings/Sketchbook-2.pdf'));
const cover=fs.readFileSync(path.join(source,'assets/previews/drawings/Sketchbook-2.png.240.webp'));
const jpg=fs.readFileSync(path.join(source,'assets/cad/Personal CAD & Workshop Projects.jpg'));
const payloads={'photo/collection.pdf':pdf,'photo/collection.webp':cover,'writings/Árvíz #50%.jpg':jpg,'drawings/archive.zip':Buffer.from('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==','base64'),'cad/project.pdf':pdf,'cad/project.webp':cover,'cad/model.dwg':'CAD PRIVATE','cad/model.step':'ISO-10303-21;','writings/unknown.custom':'PRIVATE UNKNOWN','writings/source.html':'<script>throw new Error("unsafe")</script>'};
for(const [f,data] of Object.entries(payloads))put(path.join(priv,f),data);
const metadata={'photo/collection.pdf':{title:'Photo collection',publishOriginal:true,description:'A public PDF in Photography'},'cad/project.pdf':{title:'CAD project',cover:'cad/project.webp',attachments:[{file:'cad/model.dwg'},{file:'cad/model.step'}]},'writings/Árvíz #50%.jpg':{title:'Curated photograph',date:'2026-01-01',order:1},'drawings/archive.zip':{title:'Archive preview'},'writings/unknown.custom':{title:'Unknown format'},'writings/source.html':{title:'Untrusted HTML source'}};
const save=()=>put(path.join(priv,'items.json'),JSON.stringify(metadata,null,2));save();
const {run}=require(path.join(root,'tools/update-content.js'));
const first=run(root);assert.equal(first.outputs.photo.length,1);assert.equal(first.outputs.cad.length,1);assert.equal(first.outputs.drawings.length,1);assert.equal(first.outputs.writings.length,3);
assert.equal(first.outputs.cad[0].attachments.length,0);assert(!first.outputs.cad[0].publicFile);assert(first.outputs.photo[0].publicFile);assert(!first.outputs.photo[0].download);
assert(first.outputs.writings.find(i=>i.title==='Curated photograph').preview);
const browserFixture=path.join(fixture,'browser');
for(const [c,items] of Object.entries(first.outputs))put(path.join(browserFixture,'data',c+'.json'),JSON.stringify(items));
for(const f of JSON.parse(fs.readFileSync(path.join(root,'.content-generated.json'))))put(path.join(browserFixture,f),fs.readFileSync(path.join(root,f)));
const managedFiles=JSON.parse(fs.readFileSync(path.join(root,'.content-generated.json')));const times=Object.fromEntries(managedFiles.map(f=>[f,fs.statSync(path.join(root,f)).mtimeMs]));
const second=run(root);assert.equal(second.previewWrites,0);for(const [f,time] of Object.entries(times))assert.equal(fs.statSync(path.join(root,f)).mtimeMs,time);
for(const c of Object.keys(first.outputs))assert.deepEqual(first.outputs[c],second.outputs[c]);
// Explicit optional publication of an attachment, then revocation cleanup.
metadata['cad/project.pdf'].attachments[0].publish=true;metadata['cad/project.pdf'].attachments[0].download=true;save();
const published=run(root);const publicAttachment=published.outputs.cad[0].attachments[0].file;assert(fs.existsSync(path.join(root,'assets',publicAttachment)));
put(path.join(browserFixture,'data/cad-with-download.json'),JSON.stringify(published.outputs.cad));
metadata['cad/project.pdf'].attachments[0].publish=false;metadata['cad/project.pdf'].attachments[0].download=false;save();run(root);assert(!fs.existsSync(path.join(root,'assets',publicAttachment)));assert(fs.existsSync(path.join(priv,'cad/model.dwg')));
const before=fs.readFileSync(path.join(root,'data/cad.json'),'utf8');metadata['cad/project.pdf'].cover='../outside.png';save();assert.throws(()=>run(root),/Invalid relative path/);assert.equal(fs.readFileSync(path.join(root,'data/cad.json'),'utf8'),before);
metadata['cad/project.pdf'].cover='cad/project.webp';save();put(path.join(priv,'photo/collection.jpg'),jpg);assert.throws(()=>run(root),/Ambiguous covers/);fs.unlinkSync(path.join(priv,'photo/collection.jpg'));
// Missing cover metadata is a critical error, and unknown extensions remain visible.
metadata['cad/project.pdf'].cover='cad/missing.webp';save();assert.throws(()=>run(root),/Missing private file/);metadata['cad/project.pdf'].cover='cad/project.webp';save();
// Normal public publishing needs no per-file approvals or private folders.
const publicConfig=JSON.parse(fs.readFileSync(path.join(root,'content/public-content.json')));
publicConfig.privateRoot='../optional-folder-not-present';put(path.join(root,'content/public-content.json'),JSON.stringify(publicConfig));
put(path.join(root,'assets/writings/Ránézésre másolata.pdf'),pdf);
let publicResult=run(root);assert.equal(publicResult.outputs.writings.length,1);assert.equal(publicResult.outputs.writings[0].file,'Ránézésre másolata.pdf');
put(path.join(root,'assets/writings/Ránézésre másolata.jpg'),jpg);
put(path.join(root,'assets/photo/public fénykép #50%.jpg'),jpg);
put(path.join(root,'assets/drawings/archive.zip'),Buffer.from('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==','base64'));
put(path.join(root,'assets/cad/models/model.step'),'ISO-10303-21;');
put(path.join(root,'assets/cad/unknown.extension'),'ordinary data');
publicResult=run(root);assert.equal(publicResult.outputs.writings.find(i=>i.file.endsWith('.pdf')).cover,'Ránézésre másolata.jpg');
const covered=new Set(publicResult.outputs.writings.filter(i=>i.cover).map(i=>i.cover));assert.equal(publicResult.outputs.writings.filter(i=>!covered.has(i.file)).length,1);
assert(publicResult.outputs.cad.some(i=>i.file==='models/model.step'));assert(publicResult.outputs.cad.some(i=>i.file==='unknown.extension'));
assert(publicResult.outputs.drawings.some(i=>i.file==='archive.zip'));assert(publicResult.outputs.photo.some(i=>i.file==='public fénykép #50%.jpg'));
assert(Object.keys(JSON.parse(fs.readFileSync(path.join(root,'data/previews.json')))).includes('photo/public fénykép #50%.jpg'));
const repeatedPublic=run(root);assert.equal(repeatedPublic.previewWrites,0);assert.deepEqual(repeatedPublic.outputs,publicResult.outputs);
put(path.join(root,'assets/writings/Ránézésre másolata.webp'),cover);assert.throws(()=>run(root),/Ambiguous public covers/);
publicConfig.overrides={'writings/Ránézésre másolata.pdf':{title:'Saját cím',description:'Saját leírás',order:1,cover:'Ránézésre másolata.jpg'}};put(path.join(root,'content/public-content.json'),JSON.stringify(publicConfig));assert.equal(run(root).outputs.writings.find(i=>i.file.endsWith('.pdf')).title,'Saját cím');
for(const [name,bytes] of [['bad.exe','MZdata'],['bad.html','<html>active</html>'],['bad.svg','<svg/>'],['disguised.dat','<script>alert(1)</script>'],['bad.png','<svg/>']]){put(path.join(root,'assets/cad',name),bytes);assert.throws(()=>run(root),/Active\/executable|Invalid raster/);fs.unlinkSync(path.join(root,'assets/cad',name));}
// Clean only files explicitly created by this fixture; keep user originals outside it untouched.
for(const name of ['writings/Ránézésre másolata.pdf','writings/Ránézésre másolata.jpg','writings/Ránézésre másolata.webp','photo/public fénykép #50%.jpg','drawings/archive.zip','cad/models/model.step','cad/unknown.extension'])fs.unlinkSync(path.join(root,'assets',name));
publicConfig.privateRoot='../private';publicConfig.overrides={};put(path.join(root,'content/public-content.json'),JSON.stringify(publicConfig));
console.log('PASS: public PDF/image/ZIP/STEP/unknown detection, optional private folder, cover deduplication, metadata, repeat updates, active-file rejection and public fixture cleanup.');
for(const f of Object.keys(payloads))fs.unlinkSync(path.join(priv,f));put(path.join(priv,'items.json'),'{}');const cleaned=run(root);for(const arr of Object.values(cleaned.outputs))assert.equal(arr.length,0);
for(const f of managedFiles)assert(!fs.existsSync(path.join(root,f)),'Managed derivative not cleaned: '+f);

// New authored articles use the shared shell; repeated creation cannot overwrite them.
const {execFileSync}=require('child_process');
for(const file of ['tools/create-article.js','tools/article-template.html','css/warm.css','js/navigation.js','js/analytics.js']) put(path.join(root,file),fs.readFileSync(path.join(source,file)));
put(path.join(root,'pages/cad.html'),'<!doctype html><title>CAD</title>');
execFileSync(process.execPath,[path.join(root,'tools/create-article.js'),'test-article','Próba & cikk']);
const articleFile=path.join(root,'assets/cad/test-article/index.html');
const articleText=fs.readFileSync(articleFile,'utf8');
assert(articleText.includes('js/navigation.js'));assert(articleText.includes('css/warm.css'));
assert(JSON.parse(fs.readFileSync(path.join(root,'content/public-content.json'))).authoredArticles.includes('assets/cad/test-article/index.html'));
assert.throws(()=>execFileSync(process.execPath,[path.join(root,'tools/create-article.js'),'test-article','Overwrite'],{stdio:'pipe'}));
assert.equal(fs.readFileSync(articleFile,'utf8'),articleText);
let articleResult=run(root);assert.equal(articleResult.outputs.cad[0].title,'Próba & cikk');
put(articleFile,articleText.replaceAll('Próba &amp; cikk','Frissített cím'));
articleResult=run(root);assert.equal(articleResult.outputs.cad[0].title,'Frissített cím');
const curated=JSON.parse(fs.readFileSync(path.join(root,'data/cad.json')));curated[0].title='Kézzel szerkesztett cím';put(path.join(root,'data/cad.json'),JSON.stringify(curated));
put(articleFile,articleText.replaceAll('Próba &amp; cikk','Új fejléc'));
articleResult=run(root);assert.equal(articleResult.outputs.cad[0].title,'Kézzel szerkesztett cím');
console.log('PASS: new article template, valid authored-article registration, overwrite prevention, metadata refresh and curated-title preservation.');
console.log('PASS: universal formats, optional private-source protection, covers, attachments, publication/revocation, missing/traversal errors, repeat cache, duplicate prevention and cleanup.');

if(path.dirname(fixture)===os.tmpdir()&&path.basename(fixture).startsWith('portfolio-test-'))fs.rmSync(fixture,{recursive:true,force:true});
