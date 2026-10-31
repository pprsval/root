// Explicitly create a public, authored article using the common static layout.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const [slug, title] = process.argv.slice(2);
if (!slug || !title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: node tools/create-article.js new-project "Article title"');
  process.exit(1);
}
const file = 'assets/cad/' + slug + '/index.html';
if (fs.existsSync(path.join(root, file))) {
  console.error('Article already exists. Nothing changed.');
  process.exit(1);
}
const configPath = path.join(root, 'content/public-content.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.authoredArticles ||= [];
if (!Array.isArray(config.authoredArticles)) throw Error('Invalid public-content.json');
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html = fs.readFileSync(path.join(__dirname, 'article-template.html'), 'utf8').replaceAll('ARTICLE_TITLE', escape(title));
fs.mkdirSync(path.dirname(path.join(root, file)), {recursive:true});
fs.writeFileSync(path.join(root, file), html, {flag:'wx'});
config.authoredArticles.push(file);
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('Created public article: ' + file + '. Edit its article content, then run Update Website Content.cmd.');
