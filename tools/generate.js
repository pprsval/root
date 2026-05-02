const fs = require("fs");
const path = require("path");

// ---------------- CONFIG ----------------
const CONFIG = {
  cad: "../assets/cad",
  photo: "../assets/photo",
  drawings: "../assets/drawings",
  writings: "../assets/writings"
};

// ---------------- RUN ----------------
Object.entries(CONFIG).forEach(([name, folder]) => {
  const dir = path.resolve(__dirname, folder);

  const files = fs.readdirSync(dir);

  const items = files
    .filter(f => !f.startsWith("."))
    .map(file => {
      const fullPath = path.join(dir, file);

      const stat = fs.statSync(fullPath);

      return {
        title: formatTitle(file),
        file: file,
        date: stat.mtime.toISOString().split("T")[0],
        tags: [name]
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const outPath = path.resolve(__dirname, `../data/${name}.json`);

  fs.writeFileSync(outPath, JSON.stringify(items, null, 2));

  console.log(`✔ ${name}.json updated (${items.length} items)`);
});

// ---------------- TITLE CLEANER ----------------
function formatTitle(file) {
  return file
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}