(() => {
  const container = document.querySelector(".gallery");
  if (!container) return;

  const source = container.dataset.source;
  const folder = container.dataset.folder || "";

  let state = [];

  fetch(source)
    .then(r => r.json())
    .then(data => {
      state = normalize(data);
      state = sortByDate(state);
      render(state);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "Load error";
    });

  // ---------------- NORMALIZE ----------------
  function normalize(data) {
    return data.map((item, i) => ({
      ...item,
      _index: i
    }));
  }

  // ---------------- SORT (DATE FIRST) ----------------
  function sortByDate(data) {
    return data.sort((a, b) => {
      return getTime(b) - getTime(a);
    });
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

  // ---------------- RENDER ----------------
  function render(items) {
    container.innerHTML = "";

    items.forEach(item => {
      const file = item.file;
      const full = folder + file;

      const fig = document.createElement("figure");

      const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file);
      const isPdf = /\.pdf$/i.test(file);

      const thumb = document.createElement("div");
      thumb.className = "thumb";

      // ---------------- IMAGE ----------------
      if (isImg) {
        const img = document.createElement("img");
        img.src = full;
        img.loading = "lazy";

        img.onclick = () => openLightbox(full);

        thumb.appendChild(img);
      }

      // ---------------- PDF ----------------
      else if (isPdf) {
        const pdf = document.createElement("div");
        pdf.className = "pdf-thumb";
        pdf.innerHTML = `
          <div style="font-size:40px">📄</div>
          <div>${item.title}</div>
        `;

        pdf.onclick = () => window.open(full, "_blank");

        thumb.appendChild(pdf);
      }

      fig.appendChild(thumb);

      const cap = document.createElement("figcaption");
      cap.textContent = item.title || "";
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
    if (e.key === "Escape") lightbox.classList.remove("active");
  });
})();