// Development-only parity check; no npm packages required.
const assert = require('assert').strict;
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const site = path.resolve(__dirname, '..');
const shell = process.argv[2] || (process.platform === 'win32' ? 'powershell.exe' : 'pwsh');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-parity-'));
const names = ['cad', 'photo', 'drawings', 'writings'];
function compare(root, categories = names) {
  execFileSync(process.execPath, [path.join(__dirname, 'generate.js'), root]);
  const expected = Object.fromEntries(categories.map(name => [name,
    JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))]));
  execFileSync(shell, ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    path.join(__dirname, 'generate.ps1'), '-Root', root]);
  for (const name of categories) {
    const bytes = fs.readFileSync(path.join(root, 'data', name + '.json'));
    assert.notEqual(bytes[0], 0xef, 'JSON must not have a UTF-8 BOM');
    assert.deepStrictEqual(JSON.parse(bytes.toString('utf8')), expected[name], name);
    assert(Array.isArray(expected[name]));
  }
  return expected;
}
// Images/PDFs need only names and mtimes; copy HTML for metadata, avoiding large media copies.
function mirror(source, dest) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(source)) mirror(path.join(source, entry), path.join(dest, entry));
  } else {
    fs.writeFileSync(dest, /\.html$/i.test(source) ? fs.readFileSync(source) : '');
  }
  fs.utimesSync(dest, stat.atime, stat.mtime);
}
try {
  const actual = path.join(temp, 'actual content');
  fs.mkdirSync(actual);
  mirror(path.join(site, 'assets'), path.join(actual, 'assets'));
  const present = names.filter(name => fs.existsSync(path.join(actual, 'assets', name)));
  const real = compare(actual, present);
  console.log('Site content matches:', present.map(n => `${n}=${real[n].length}`).join(', '));
  const fixture = path.join(temp, 'unicode fixtures');
  for (const name of names) fs.mkdirSync(path.join(fixture, 'assets', name), { recursive: true });
  function file(relative, contents = '') {
    const target = path.join(fixture, 'assets', relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
    fs.utimesSync(target, new Date('2025-01-02T23:59:59Z'), new Date('2025-01-02T23:59:59Z'));
  }
  file('photo/árvíz__test.JPG'); file('photo/A.PDF'); file('photo/a.webp');
  file('photo/.hidden.jpg'); file('photo/ignored.txt');
  file('drawings/single.png');
  file('cad/post/index.html', `<META name='post-title' content='  Árvíz &amp; test  '>
<meta name="post-date" content="2026.06.14">
<meta name="post-type" content="Notes"><meta name="post-description" content="Description">
<meta name="post-thumb" content="images/cover.png">`);
  file('cad/default_post/index.html', '<html>No metadata</html>');
  const defaultDir = path.join(fixture, 'assets/cad/default_post');
  fs.utimesSync(defaultDir, new Date('2025-01-02T23:59:59Z'), new Date('2025-01-02T23:59:59Z'));
  file('cad/no-index/skip.png');
  const result = compare(fixture);
  assert.deepStrictEqual(result.writings, []);
  assert.equal(result.drawings.length, 1);
  assert.deepStrictEqual(result.photo.map(x => x.file), ['A.PDF', 'a.webp', 'árvíz__test.JPG']);
  assert.equal(result.photo[0].date, '2025-01-02');
  assert.deepStrictEqual(result.cad[0], {
    title: 'Árvíz &amp; test', file: 'post/index.html', date: '2026-06-14',
    type: 'Notes', description: 'Description', cover: 'post/images/cover.png', tags: ['cad', 'blog']
  });
  assert.deepStrictEqual(result.cad[1], {
    title: 'default post', file: 'default_post/index.html', date: '2025-01-02',
    type: 'Műhelynapló', description: '', cover: null, tags: ['cad', 'blog']
  });
  // Missing folders must leave any previously generated file untouched.
  fs.rmSync(path.join(fixture, 'assets/writings'), { recursive: true });
  const old = fs.readFileSync(path.join(fixture, 'data/writings.json'), 'utf8');
  compare(fixture, names.filter(n => n !== 'writings'));
  assert.equal(fs.readFileSync(path.join(fixture, 'data/writings.json'), 'utf8'), old);
  console.log(`PASS: real content and fixtures match using ${shell}.`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}