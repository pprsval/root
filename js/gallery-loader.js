document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("gallery");
  const jsonFile = document.body.dataset.json;

  if (!jsonFile) {
    console.error("Hiányzik a data-json attribútum a <body>-n!");
    return;
  }

  fetch(jsonFile)
    .then(r => {
      if (!r.ok) throw new Error("JSON betöltési hiba: " + r.status);
      return r.json();
    })
    .then(items => buildGallery(items))
    .catch(err => {
      console.error(err);
      container.textContent = "Hiba történt a galéria betöltésekor.";
    });

  let imageList = [];
  let currentIndex = 0;

  function buildGallery(items) {
    container.innerHTML = "";

    items.forEach((item, index) => {
      const figure = document.createElement("figure");
      const file = item.kep || item.pdf;
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      const isPdf = /\.pdf$/i.test(file);

      if (isImage) {
        const img = document.createElement("img");
        img.src = file;
        img.alt = item.cim || "";
        img.addEventListener("click", () => openLightbox(index));
        figure.appendChild(img);
        imageList.push(file);
      } else if (isPdf) {
        const pdfDiv = document.createElement("div");
        pdfDiv.className = "pdf-thumb";
        pdfDiv.innerHTML = `<span>📄</span><div>${item.cim}</div>`;
        pdfDiv.addEventListener("click", () => window.open(file, "_blank"));
        figure.appendChild(pdfDiv);
      }

      const caption = document.createElement("figcaption");
      caption.textContent = item.cim || "";
      figure.appendChild(caption);

      container.appendChild(figure);
    });
  }

  // -------- Lightbox --------
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = imageList[currentIndex];
    lightbox.classList.add("active");
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % imageList.length;
    lightboxImg.src = imageList[currentIndex];
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    lightboxImg.src = imageList[currentIndex];
  }

  document.querySelector(".next").addEventListener("click", e => { e.stopPropagation(); nextImage(); });
  document.querySelector(".prev").addEventListener("click", e => { e.stopPropagation(); prevImage(); });
  document.querySelector(".close").addEventListener("click", e => { e.stopPropagation(); closeLightbox(); });
  lightbox.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });
});
