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
  // Fontos: nem vágjuk le a mappaútvonalat.
  // Kell, hogy működjön ez is:
  // 2026_06_14_dxf_to_inventor/index.html
  // 2026_06_14_dxf_to_inventor/images/01-dxf-contur.png
  const normalize = (p) => (p || "").replace(/\\/g, "/").trim();

  const fileName = (p) => (p || "").split("/").pop().trim();

  const stripExt = (f) => fileName(f).replace(/\.[^/.]+$/, "");

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

    const match = item.file?.match(/\d{4}[_-]\d{2}[_-]\d{2}|\d{8}/);

    if (match) {
      const raw = match[0].replace(/_/g, "-");

      if (/^\d{8}$/.test(raw)) {
        return Date.parse(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`);
      }

      return Date.parse(raw);
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
      const isHtml = /\.html$/i.test(file);

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

      // ---------------- HTML / BLOG POST ----------------
      else if (isHtml) {
        const postCard = document.createElement("div");
        postCard.className = "pdf-thumb blog-thumb";

        if (item.cover) {
          const img = document.createElement("img");
          img.src = folder + item.cover;
          img.alt = item.title || "";
          img.loading = "lazy";

          postCard.appendChild(img);
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
            padding:20px;
            text-align:center;
          `;

          fallback.innerHTML = `
            <div style="font-size:2.5rem;">✎</div>
            <div style="font-size:0.9rem;">${item.type || "Műhelynapló"}</div>
          `;

          postCard.appendChild(fallback);
        }

        postCard.onclick = () => {
          window.location.href = full;
        };

        thumb.appendChild(postCard);
      }

      // ---------------- UNKNOWN FILE ----------------
      else {
        return;
      }

      // ---------------- CAPTION ----------------
      const cap = document.createElement("figcaption");

      if (isHtml && item.date) {
        cap.innerHTML = `
          <strong>${item.title || ""}</strong><br>
          <span>${item.date} · ${item.type || "Műhelynapló"}</span>
        `;
      } else {
        cap.textContent = item.title || "";
      }

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