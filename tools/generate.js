const fs = require("fs");
const path = require("path");

// AltumDesk egyszerű JSON generátor
// Futtatás a weboldal gyökeréből:
// node tools/generate.js

const ROOT = process.cwd();

const CONFIG = {
  cad: "assets/cad",
  photo: "assets/photo",
  drawings: "assets/drawings",
  writings: "assets/writings"
};

const ALLOWED_FILES = /\.(png|jpg|jpeg|webp|pdf)$/i;

Object.entries(CONFIG).forEach(([name, folder]) => {
  const dir = path.join(ROOT, folder);

  if (!fs.existsSync(dir)) {
    console.warn(`Mappa nem található: ${folder}`);
    return;
  }

  const items = fs.readdirSync(dir)
    .filter(entry => !entry.startsWith("."))
    .map(entry => {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const indexPath = path.join(fullPath, "index.html");

        if (!fs.existsSync(indexPath)) {
          return null;
        }

        const html = fs.readFileSync(indexPath, "utf8");

        const title = getMeta(html, "post-title") || cleanTitle(entry);
        const date = normalizeDate(getMeta(html, "post-date")) || stat.mtime.toISOString().slice(0, 10);
        const type = getMeta(html, "post-type") || "Műhelynapló";
        const description = getMeta(html, "post-description") || "";
        const thumb = getMeta(html, "post-thumb");

        return {
          title,
          file: `${entry}/index.html`,
          date,
          type,
          description,
          cover: thumb ? `${entry}/${thumb}` : null,
          tags: [name, "blog"]
        };
      }

      if (!ALLOWED_FILES.test(entry)) {
        return null;
      }

      return {
        title: cleanTitle(entry),
        file: entry,
        date: stat.mtime.toISOString().slice(0, 10),
        tags: [name]
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const outPath = path.join(ROOT, "data", `${name}.json`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), "utf8");

  console.log(`✔ ${name}.json updated (${items.length} items)`);
});

function cleanTitle(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMeta(html, name) {
  const regex = new RegExp(
    `<meta\\s+[^>]*name=["']${escapeRegex(name)}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  );

  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

function normalizeDate(date) {
  if (!date) return "";

  const dot = date.match(/^(\\d{4})\\.(\\d{2})\\.(\\d{2})$/);
  if (dot) {
    return `${dot[1]}-${dot[2]}-${dot[3]}`;
  }

  return date;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
