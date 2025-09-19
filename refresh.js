/* --------------------------------------------------------------
 * refresh.js – cache‑busting a PDF‑hez
 * -------------------------------------------------------------- */

/* 1️⃣  A PDF relatív URL-je a weboldal gyökérhez képest.
 *     Ha a PDF a repóban a public/pdf/ könyvtárban van,
 *     akkor a publikus URL így néz ki:
 *         https://<felhasználó>.github.io/<repo>/pdf/mybook.pdf
 *     A "/" eleje a gyökérre mutat, ezért csak a relatív útvonal
 *     elegendő.
 */
const basePdfUrl = "./tartalom/002-iras/02.02_mybook";

/* 2️⃣  Egyedi URL generálása timestamp‑kel.
 *     A "?v=" paraméter minden alkalommal más értékkel jelenik meg,
 *     így a böngésző nem használja a korábbi cache‑t.
 */
function freshPdfUrl() {
  const ts = Date.now();               // ms‑precíz időbélyeg
  return `${basePdfUrl}?v=${ts}`;      // pl. /pdf/mybook.pdf?v=1726739201234
}

/* 3️⃣  PDF betöltése az <iframe>-be (az index.html‑ben kell legyen egy
 *     <iframe id="pdfViewer"> elem). */
function loadPdf() {
  const iframe = document.getElementById("pdfViewer");
  if (!iframe) {
    console.error("PDF iframe nem található – ellenőrizd az index.html‑t!");
    return;
  }
  iframe.src = freshPdfUrl();
}

/* 4️⃣  Automatikus újratöltés.
 *     Állítsd be a kívánt gyakoriságot milliszekundumban.
 *     - 5 perc =  * 60 * 1000 = 300 000 ms
 *     - Ha csak az oldal betöltésekor akarod frissíteni, állítsd 0-ra,
 *       vagy vedd ki a setInterval‑t.
 */
const RELOAD_INTERVAL_MS = 0 * 60 * 1000;   // 5 perc

// Időzítő, ami periodikusan meghívja a loadPdf‑t
setInterval(loadPdf, RELOAD_INTERVAL_MS);

// Azonnali betöltés, amikor a felhasználó megnyitja az oldalt
loadPdf();
