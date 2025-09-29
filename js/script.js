/* --------------------------------------------------------------
   script.js – közös szkript a writings.html és drawings.html
   -------------------------------------------------------------- */

(() => {
  // -----------------------------------------------------------------
  // 1️⃣  Melyik oldalról futunk? (pl. "writings.html" vagy "drawings.html")
  // -----------------------------------------------------------------
  const page = window.location.pathname.split('/').pop();   // pl. "drawings.html"

  // Konfiguráció: oldal → JSON‑útvonal + handler függvény
  const cfg = {
    'writings.html': {
      json: '../data/writings.json',
      handler: handleWritings          // később definiálva
    },
    'drawings.html': {
      json: '../data/drawings.json',
      handler: handleDrawings          // később definiálva
    }
  };

  // Ha nincs beállítva a page, ne csináljunk semmit
  if (!cfg[page]) {
    console.warn(`script.js: Nincs konfiguráció a(z) "${page}" oldalhoz.`);
    return;
  }

  const { json, handler } = cfg[page];

  // -----------------------------------------------------------------
  // 2️⃣  Általános fetch‑logika (ugyanaz, mint a korábbi szkripted)
  // -----------------------------------------------------------------
  fetch(json)
    .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
    .then(data => {
      console.log(`JSON betöltve (${page}):`, data);

      // Formázott JSON megjelenítése <pre>-ben
      const pretty = JSON.stringify(data, null, 2);
      document.body.insertAdjacentHTML(
        'beforeend',
        `<pre style="
                background:#f8f8f8;
                padding:1rem;
                border:1px solid #ddd;
                max-width:90%;
                margin:2rem auto;
                overflow:auto;">${pretty}</pre>`
      );

      // -------------------- oldal‑specifikus feldolgozás ----------
      if (typeof handler === 'function') handler(data);
    })
    .catch(err => {
      console.error('Hiba a JSON betöltésekor:', err);
      document.body.insertAdjacentHTML(
        'beforeend',
        `<p style="color:red;margin:2rem;">
           A JSON betöltése sikertelen: ${err}
         </p>`
      );
    });

  // -----------------------------------------------------------------
  // 3️⃣  Oldal‑specifikus handler‑függvények
  // -----------------------------------------------------------------

  /** writings.html‑hez */
  function handleWritings(data) {
    // Példa: listázzuk ki a cikkcímeket <ul>-ben
    // (ha nincs szükség, egyszerűen hagyjuk üresen)
    /*
    const ul = document.createElement('ul');
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.title ?? 'Névtelen';
      ul.appendChild(li);
    });
    document.body.appendChild(ul);
    */
  }

  /** drawings.html‑hez */
  function handleDrawings(data) {
    // Feltételezzük, hogy minden elemnek van {src, caption} mezője.
    // Ha más struktúrája van, igazítsd a kódot ennek megfelelően.

    const container = document.createElement('section');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    container.style.gap = '1rem';
    container.style.margin = '2rem';

    data.forEach(item => {
      const figure = document.createElement('figure');

      const img = document.createElement('img');
      img.src = item.src;                 // kép útvonala
      img.alt = item.caption ?? '';
      img.style.width = '100%';
      img.style.border = '1px solid #ccc';
      figure.appendChild(img);

      if (item.caption) {
        const cap = document.createElement('figcaption');
        cap.textContent = item.caption;
        cap.style.textAlign = 'center';
        cap.style.fontSize = '0.9rem';
        figure.appendChild(cap);
      }

      container.appendChild(figure);
    });

    document.body.appendChild(container);
  }
})();