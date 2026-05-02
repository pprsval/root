const fs = require("fs");
const path = require("path");

// -------- CONFIG --------
const CONFIG = [
  {
    folder: "./assets/photo",
    output: "./data/photo.json",
    tag: "photo"
  },
  {
    folder: "./assets/cad",
    output: "./data/cad.json",
    tag: "cad"
  },
  {
    folder: "./assets/drawings",
    output: "./data/drawings.json",
    tag: "drawing"
  },
  {
    folder: "./assets/writings",
    output: "./data/writings.json",
    tag: "writing"
  }
];

// -------- HELPERS --------
function getDateFromFilename(name) {
  const match = name.match(/\d{8}/); // pl 20260314
  if (!match) return null;

  const raw = match[0];
  return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
}

function generate(folder, tag) {
  const files = fs.readdirSync(folder);

  return files
    .filter(f => !f.startsWith(".")) // ignore hidden
    .map(file => {
      const title = file
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");

      return {
        title,
        file,
        date: getDateFromFilename(file) || "2026-01-01",
        tags: [tag]
      };
    });
}

// -------- MAIN --------
CONFIG.forEach(cfg => {
  const data = generate(cfg.folder, cfg.tag);

  fs.writeFileSync(
    cfg.output,
    JSON.stringify(data, null, 2),
    "utf-8"
  );

  console.log(`✔ Generated: ${cfg.output}`);
});

console.log("\n🔥 ALL DONE");