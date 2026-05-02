const fs = require("fs");
const path = require("path");

// 📁 KATEGÓRIÁK
const config = {
  photo: {
    input: "assets/photo",
    output: "data/photo.json"
  },
  cad: {
    input: "assets/cad",
    output: "data/cad.json"
  },
  drawings: {
    input: "assets/drawings",
    output: "data/drawings.json"
  },
  writings: {
    input: "assets/writings",
    output: "data/writings.json"
  }
};

// 📌 engedett fájltípusok
function isValid(file) {
  return /\.(jpg|jpeg|png|webp|gif|pdf|html)$/i.test(file);
}

// 📌 title szépítés
function makeTitle(fileName) {
  return fileName
    .replace(/[-_]/g, " ")
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 📦 generálás
function generateCategory(name, cfg) {
  const folder = path.join(__dirname, cfg.input);

  if (!fs.existsSync(folder)) {
    console.log(`⚠️ mappa nem létezik: ${folder}`);
    return;
  }

  const files = fs.readdirSync(folder).filter(isValid);

  const items = files.map(file => ({
    title: makeTitle(file),
    file: file,
    cover: file
  }));

  fs.writeFileSync(
    cfg.output,
    JSON.stringify(items, null, 2),
    "utf-8"
  );

  console.log(`✔ ${name}: ${items.length} fájl`);
}

// 🚀 FUTTATÁS
Object.entries(config).forEach(([name, cfg]) => {
  generateCategory(name, cfg);
});

console.log("🎉 minden kategória kész");