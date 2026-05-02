(() => {
  const container = document.querySelector(".gallery");
  if (!container) return;

  const source = container.dataset.source;
  const folder = container.dataset.folder || "";

  let items = [];
  let images = [];

  fetch(source)
    .then(r => r.json())
    .then(data => {
      items = sortByDate(normalize(data));
      render(items);
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

  // ---------------- RENDER ----------------
  function render(items) {
    container.innerHTML = "";
    images = [];

    items.forEach((item, index) => {
      const file = item.file;
      const full = folder + file;

      const fig = document.createElement("figure");

      const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file);
      const isPdf = /\.pdf$/i.test(file);

      // ---------------- IMAGE ----------------
      if (isImg) {
        const img = document.createElement("img");
        img.src = full;
        img.loading = "lazy";

        images.push(full);

        const imgIndex = images.length - 1;

        img.onclick = () => openLightbox(imgIndex);

        fig.appendChild(img);
      }

      // ---------------- PDF ----------------
      else if (isPdf) {
        const pdf = document.createElement("div");
        pdf.className = "pdf-thumb";

        pdf.innerHTML = `
          <div style="font-size:40px">📄</div>
          <div>${item.title || file}</div>
        `;

        pdf.onclick = () => window.open(full, "_blank");

        fig.appendChild(pdf);
      }

      // ---------------- CAPTION ----------------
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

  let current = 0;

  function openLightbox(index) {
    current = index;
    img.src = images[current];
    lightbox.classList.add("active");
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.classList.remove("active");
  });
})();