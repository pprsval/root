(() => {
  const container = document.querySelector('.gallery');
  if (!container) return;
  const folder = new URL(container.dataset.folder, document.baseURI);
  const assetRoot = new URL('../', folder);
  const category = folder.pathname.split('/').filter(Boolean).pop();
  const source = new URL(container.dataset.source, document.baseURI);
  const imageType = /^(png|jpe?g|webp)$/i;
  const safeView = /^(png|jpe?g|webp|pdf|mp4|webm|mp3|wav|ogg)$/i;
  const pathUrl = (file, base) => {
    if (!file || file.split('/').some(p => p === '..' || p === '.' || !p) || /[\\:]/.test(file)) throw Error('Invalid content path');
    return new URL(file.split('/').map(encodeURIComponent).join('/'), base).href;
  };
  const lightbox = document.createElement('dialog');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('aria-label', 'Image viewer');
  const close = document.createElement('button'); close.className = 'lightbox-close'; close.type = 'button'; close.textContent = 'Close ×';
  const fullImage = document.createElement('img'); lightbox.append(close, fullImage); document.body.append(lightbox);
  let opener;
  close.onclick = () => lightbox.close();
  lightbox.onclick = event => { if (event.target === lightbox) lightbox.close(); };
  lightbox.addEventListener('close', () => { document.body.classList.remove('viewing-image'); opener?.focus(); });
  function enlarge(url, title, trigger) {
    opener = trigger; fullImage.src = url; fullImage.alt = title || ''; lightbox.showModal(); document.body.classList.add('viewing-image'); close.focus();
  }
  function link(url, label, download) {
    const a = document.createElement('a'); a.href = url; a.textContent = label;
    if (download) a.download = ''; else { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  Promise.all([
    fetch(source).then(r => { if (!r.ok) throw Error('Content load failed'); return r.json(); }),
    fetch(new URL('previews.json', source)).then(r => r.ok ? r.json() : {}).catch(() => ({}))
  ]).then(([items, previews]) => {
    // Backward compatibility with the original JSON arrays and same-stem PDF covers.
    items = items.map(i => ({ ...i }));
    for (const item of items) if (!item.managed && /\.pdf$/i.test(item.file) && !item.cover) {
      const stem = item.file.replace(/\.[^/.]+$/, '');
      item.cover = items.find(i => /\.(png|jpe?g|webp)$/i.test(i.file) && i.file.replace(/\.[^/.]+$/, '') === stem)?.file;
    }
    const covers = new Set(items.filter(i => i.cover).map(i => i.cover));
    items = items.filter(i => !covers.has(i.file));
    items.sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    container.replaceChildren();
    for (const item of items) {
      const type = item.fileType || item.file.split('.').pop().toLowerCase();
      const isImage = imageType.test(type);
      const article = !item.managed && /\/index\.html$/i.test(item.file);
      const original = item.managed ? (item.publicFile ? pathUrl(item.publicFile, assetRoot) : null) : pathUrl(item.file, folder);
      const imageFile = isImage ? item.file : item.cover;
      const preview = item.preview || previews[category + '/' + imageFile];
      const figure = document.createElement('figure'); figure.className = 'gallery-card';
      const thumb = document.createElement('div'); thumb.className = 'thumb';
      let visual;
      if (preview || imageFile) {
        visual = document.createElement('img'); visual.alt = item.title || ''; visual.loading = 'lazy'; visual.decoding = 'async';
        if (preview) {
          visual.width = preview.width; visual.height = preview.height; visual.sizes = 'auto, 100vw';
          visual.srcset = preview.variants.map(v => pathUrl(v.file, assetRoot) + ' ' + v.width + 'w').join(', ');
          visual.src = pathUrl(preview.variants[Math.min(1, preview.variants.length - 1)].file, assetRoot);
        } else visual.src = pathUrl(imageFile, folder);
        visual.onerror = () => { visual.onerror = null; visual.removeAttribute('srcset'); if (!item.managed && imageFile) visual.src = pathUrl(imageFile, folder); else visual.replaceWith(placeholder(type)); };
      } else visual = placeholder(type);
      if (isImage && (original || preview)) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'image-button'; button.setAttribute('aria-label', item.title || 'View image');
        button.onclick = () => enlarge(original || pathUrl(preview.variants.at(-1).file, assetRoot), item.title, button);
        button.append(visual); thumb.append(button);
      } else if (original && (!item.managed || safeView.test(type) || article || item.download)) {
        const a = link(original, '', item.download); a.className = 'pdf-thumb' + (article ? ' blog-thumb' : ''); a.setAttribute('aria-label', item.title || type);
        if (article) { a.removeAttribute('target'); a.removeAttribute('rel'); }
        a.append(visual); thumb.append(a);
      } else { thumb.append(visual); }
      const caption = document.createElement('figcaption'); const title = document.createElement('span'); title.className = 'item-title'; title.textContent = item.title || ''; caption.append(title);
      if (article && item.date) { const date = document.createElement('span'); date.className = 'item-meta'; date.textContent = item.date + (item.type ? ' · ' + item.type : ''); caption.append(date); }
      if (item.description) { const text = document.createElement('p'); text.className = 'item-description'; text.textContent = item.description; caption.append(text); }
      if (item.download && original) caption.append(link(original, 'Download', true));
      if (item.attachments?.length) {
        const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Additional files (' + item.attachments.length + ')'; details.append(summary);
        for (const attachment of item.attachments) details.append(link(pathUrl(attachment.file, assetRoot), attachment.label, attachment.download));
        caption.append(details);
      }
      figure.append(thumb, caption); container.append(figure);
    }
    if (!items.length) { const p = document.createElement('p'); p.textContent = 'Nincs megjeleníthető tartalom.'; container.append(p); }
  }).catch(error => { console.error(error); container.textContent = 'Hiba a tartalom betöltésekor.'; });
  function placeholder(type) {
    const box = document.createElement('div'); box.className = 'file-placeholder';
    const icon = document.createElement('span'); icon.className = 'file-symbol'; icon.setAttribute('aria-hidden','true'); icon.textContent = '▤';
    const label = document.createElement('span'); label.textContent = (type || 'FILE').toUpperCase(); box.append(icon,label); return box;
  }
})();
