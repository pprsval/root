(() => {
  const container = document.querySelector(".gallery");
  if (!container) return;

  const source = container.dataset.source;
  const folder = container.dataset.folder || "";

  let items = [];

  // ---------------- LOAD ----------------
  fetch(source)
    .then(r => {
      if (!r.ok) throw new Error(`JSON load error: ${r.status}`);
      return r.json();
    })
    .then(data => {
      items = normalizeData(data);
      items = sortByDate(items);
      items = attachCovers(items);
      items = removeDuplicateCovers(items);
      render(items);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "Hiba a tartalom betöltésekor.";
    });

  // ---------------- NORMALIZE ----------------
  const normalize = (p) => (p || "").split("/").pop().trim();
  const stripExt = (f) => (f || "").replace(/\.[^/.]+$/, "");

  function normalizeData(data) {
    return data.map(i => ({
      ...i,
      file: normalize(i.file),
      cover: i.cover ? normalize(i.cover) : null
    }));
  }

  // ---------------- SORT ----------------
  function sortByDate(data) {
    return data.sort((a, b) => getTime(b) - getTime(a));
  }

  function getTime(item) {
    if (item.date) {
      const t = Date.parse(item.date);
      if (!isNaN(t)) return t;
    }

    const match = item.file?.match(/\d{8}/);
    if (match) {
      const d = match[0];
      return Date.parse(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
    }

    return 0;
  }

  // ---------------- AUTO PAIRING ----------------
  function attachCovers(data) {
    const images = data.filter(i =>
      /\.(png|jpg|jpeg|webp)$/i.test(i.file)
    );

    const pdfs = data.filter(i =>
      /\.pdf$/i.test(i.file)
    );

    pdfs.forEach(pdf => {
      const base = stripExt(pdf.file);

      const match = images.find(img =>
        stripExt(img.file) === base
      );

      if (match) {
        pdf.cover = match.file;
      }
    });

    return data;
  }

  // ---------------- REMOVE DUPLICATES ----------------
  function removeDuplicateCovers(data) {
    const coverSet = new Set(
      data
        .filter(i => i.cover)
        .map(i => i.cover)
    );

    return data.filter(i => !coverSet.has(i.file));
  }

  // ---------------- RENDER ----------------
  function render(items) {
    container.innerHTML = "";

    items.forEach(item => {
      const file = item.file;
      const full = folder + file;

      const fig = document.createElement("figure");
      const thumb = document.createElement("div");
      thumb.className = "thumb";

      const isPdf = /\.pdf$/i.test(file);
      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file);

      // ---------------- IMAGE ----------------
      if (isImage && !item._isCover) {
        const img = document.createElement("img");
        img.src = full;
        img.alt = item.title || "";
        img.loading = "lazy";

        img.onclick = () => openLightbox(full);

        thumb.appendChild(img);
      }

      // ---------------- PDF ----------------
      else if (isPdf) {
        const pdfCard = document.createElement("div");
        pdfCard.className = "pdf-thumb";

        if (item.cover) {
          const img = document.createElement("img");
          img.src = folder + item.cover;
          img.alt = item.title || "";
          img.loading = "lazy";

          pdfCard.appendChild(img);
        } else {
          const fallback = document.createElement("div");
          fallback.style.cssText = `
            aspect-ratio: 3/4;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            background:#eaeaea;
            border-radius:8px;
            font-family:'Instrument Serif', serif;
          `;

          fallback.innerHTML = `
            <div style="font-size:2.5rem;">📄</div>
            <div style="font-size:0.9rem;">${item.title || "PDF"}</div>
          `;

          pdfCard.appendChild(fallback);
        }

        pdfCard.onclick = () => window.open(full, "_blank");

        thumb.appendChild(pdfCard);
      }

      // ---------------- CAPTION ----------------
      const cap = document.createElement("figcaption");
      cap.textContent = item.title || "";

      fig.appendChild(thumb);
      fig.appendChild(cap);
      container.appendChild(fig);
    });
  }

  // ---------------- LIGHTBOX ----------------
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";

  const img = document.createElement("img");
  lightbox.appendChild(img);

  lightbox.onclick = () => lightbox.classList.remove("active");

  document.body.appendChild(lightbox);

  function openLightbox(src) {
    img.src = src;
    lightbox.classList.add("active");
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      lightbox.classList.remove("active");
    }
  });
})();