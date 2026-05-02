(() => {
  const container = document.querySelector(".gallery");
  if (!container) return;

  const source = container.dataset.source;
  const folder = container.dataset.folder || "";

  let items = [];
  let draggedIndex = null;

  fetch(source)
    .then(r => {
      if (!r.ok) throw new Error(`JSON load error: ${r.status}`);
      return r.json();
    })
    .then(data => {
      items = data;

      // 🔥 SORT (legfrissebb elöl)
      items.sort((a, b) => getTime(b) - getTime(a));

      render(items);
      enableDrag();
      showExportButton();
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "Hiba a tartalom betöltésekor.";
    });

  // ---------------- DATE ----------------
  function getTime(item) {
    if (item.date) {
      const t = Date.parse(item.date);
      if (!isNaN(t)) return t;
    }

    if (item.file) {
      const match = item.file.match(/\d{4}[-]?\d{2}[-]?\d{2}/);
      if (match) {
        const n = match[0].replace(/-/g, "");
        return Date.parse(`${n.slice(0,4)}-${n.slice(4,6)}-${n.slice(6,8)}`);
      }
    }

    return 0;
  }

  // ---------------- RENDER ----------------
  function render(list) {
    container.innerHTML = "";

    list.forEach(item => {
      const fullPath = folder + item.file;
      const figure = document.createElement("figure");

      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(item.file);
      const isPdf = /\.pdf$/i.test(item.file);

      if (isImage) {
        const img = document.createElement("img");
        img.src = fullPath;
        img.alt = item.title || "";
        img.loading = "lazy";
        img.onclick = () => openLightbox(fullPath);
        figure.appendChild(img);
      }

      else if (isPdf) {
        const pdf = document.createElement("div");
        pdf.className = "pdf-thumb";
        pdf.innerHTML = `
          <span>📄</span>
          <div>${item.title || ""}</div>
        `;
        pdf.onclick = () => window.open(fullPath, "_blank");
        figure.appendChild(pdf);
      }

      const cap = document.createElement("figcaption");
      cap.textContent = item.title || "";
      figure.appendChild(cap);

      container.appendChild(figure);
    });
  }

  // ---------------- DRAG & DROP ----------------
  function enableDrag() {
    const figures = container.querySelectorAll("figure");

    figures.forEach((fig, index) => {
      fig.draggable = true;

      fig.addEventListener("dragstart", () => {
        draggedIndex = index;
        fig.classList.add("dragging");
      });

      fig.addEventListener("dragend", () => {
        fig.classList.remove("dragging");
      });

      fig.addEventListener("dragover", e => e.preventDefault());

      fig.addEventListener("drop", () => {
        if (draggedIndex === null) return;

        const moved = items.splice(draggedIndex, 1)[0];
        items.splice(index, 0, moved);

        draggedIndex = null;

        render(items);
        enableDrag();
      });
    });
  }

  // ---------------- EXPORT JSON ----------------
  function showExportButton() {
    const btn = document.createElement("button");
    btn.innerText = "💾 JSON mentése";

    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.padding = "10px 15px";
    btn.style.zIndex = "999";

    btn.onclick = () => {
      const blob = new Blob(
        [JSON.stringify(items, null, 2)],
        { type: "application/json" }
      );

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "updated.json";
      a.click();
    };

    document.body.appendChild(btn);
  }

  // ---------------- LIGHTBOX ----------------
  const lightbox = createLightbox();

  function openLightbox(src) {
    lightbox.img.src = src;
    lightbox.el.classList.add("active");
  }

  function createLightbox() {
    const el = document.createElement("div");
    el.className = "lightbox";

    const img = document.createElement("img");
    el.appendChild(img);

    el.onclick = (e) => {
      if (e.target === el) el.classList.remove("active");
    };

    document.body.appendChild(el);

    return { el, img };
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelector(".lightbox")?.classList.remove("active");
    }
  });
})();