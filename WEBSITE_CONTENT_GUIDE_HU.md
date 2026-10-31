# Weboldal-frissítés — nyilvános portfólió alapértelmezésben

## A szokásos munkamenet

**Másold be a fájlt → szükség esetén adj saját címet/borítót → Update Website Content.cmd → Preview Website.cmd → kézi Git-ellenőrzés és publikálás.**

Nem kell minden új PDF-et, képet vagy dokumentumot JSON-ban engedélyezni. A weboldal a meglévő nyilvános kategóriamappákba tett tartalmakat automatikusan felismeri:

| Oldal | Mappa a projekt root mappájához képest |
|---|---|
| CAD | `assets/cad/` |
| Drawings | `assets/drawings/` |
| Photography | `assets/photo/` |
| Writings | `assets/writings/` |

A kategóriát a választott mappa határozza meg, nem a fájl kiterjesztése. PDF lehet Photography alatt, JPG Writings alatt, ZIP Drawings alatt, STEP vagy DWG CAD alatt. Az egyszerű almappák tartalma is felismerhető. A saját cikkek mappájában lévő illusztrációkból nem készülnek külön galériatételek.

**A root/assets nyilvános terület.** Amit ide másolsz, azt publikálásra szánod. Egy fájl akkor is közvetlenül elérhető lehet a szerveren, ha nincs rá galérialink. Privát eredetit a root mappán kívül tarts.

## 1. Új könyv vagy PDF feltöltése

1. Másold a PDF-et az `assets/writings/` mappába, például `Ránézésre másolata.pdf` néven.
2. Ha van borító, másold mellé azonos alapnévvel: `Ránézésre másolata.jpg`.
3. Futtasd az **Update Website Content.cmd** fájlt a root mappában.
4. Indítsd a **Preview Website.cmd** fájlt, és ellenőrizd a Writings oldalt.

Az új PDF borítóval együtt egyetlen portfóliókártya lesz. A borítókép nem jelenik meg még egyszer külön kártyán. Borító nélkül is megjelenik a PDF, fájltípus-jelöléssel; a program figyelmeztetést ír, de nem igényel külön jóváhagyást.

A PDF a böngészőben megnyitható. **Nincs alapértelmezett Download gomb.** A megtekinthető dokumentum természetesen elmenthető a böngészőből.

### Borító és optimalizálás

- Automatikus képfeldolgozás: PNG, JPG/JPEG és WebP.
- Azonos alapnevű kép automatikusan a PDF vagy más dokumentum borítója lesz.
- Két azonos alapnevű kép esetén a program hibát jelez. Válaszd ki a borítót az opcionális `cover` mezővel, vagy rendezd a kétértelmű fájlneveket.
- A program WebP-előnézeteket készít. Az eredeti kép vagy PDF tartalmát nem módosítja.
- A változatlan képek előnézeteit újra felhasználja; nem generál újra mindent minden futáskor.
- Videóhoz, CAD-fájlhoz, e-könyvhöz és más formátumhoz saját képes borító adható. Automatikus PDF-oldal-renderelés és videóképkocka-kivágás nincs; borító nélkül látható típusjelölés kerül a kártyára.

## 2. Új CAD-projekt

Másold a PDF-et, képet vagy más projektfájlt az `assets/cad/` mappába. Például:

```text
assets/cad/tartokonzol.pdf
assets/cad/tartokonzol.jpg
```

Frissítés után automatikusan megjelenik a CAD oldal fekvő kártyáján. A teljes borítót mutatjuk, torzítás és szükségtelen vágás nélkül.

Több kapcsolódó fájl egy projekthez rendelhető opcionális metaadattal. Például a `content/public-content.json` **overrides** részében:

```json
"cad/tartokonzol.pdf": {
  "title": "Tartókonzol",
  "description": "A projekt saját rövid ismertetése.",
  "attachments": [
    { "file": "cad/szereles.dwg", "label": "Összeállítás" },
    { "file": "cad/modell.step", "label": "3D modell" }
  ]
}
```

A mellékletek a projekten belüli lenyitható listában jelennek meg, nem külön kártyákon. A melléklet útvonala az **assets** mappához viszonyított. Mivel a fájlokat eleve a nyilvános mappába tetted, nincs további `publish` engedély. Külön kártyához az adott melléklet saját felülírásában `standalone: true` használható.

## 3. Új rajz vagy sketchbook

Másold a rajzot vagy PDF-et az `assets/drawings/` mappába. PDF mellé tehetsz azonos alapnevű borítóképet. Futtasd a frissítést; a tartalom automatikusan megkapja az A4 arányú keretet. A meglévő Sketchbook-1/2/3 fájlok és URL-ek megmaradnak.

## 4. Új fénykép

Másold a képet az `assets/photo/` mappába és futtasd a frissítést. Nem kell HTML-t vagy JSON-t írnod az egyszerű feltöltéshez. A weboldal optimalizált előnézetet használ, nagyításkor a meglévő nyilvános eredeti kép nyílik meg. A kép arányai megmaradnak.

Fényképalbum PDF is tehető ide, saját borítóval. Egy `.docx`, `.epub`, `.zip`, `.dwg`, `.step` vagy ismeretlen, nem aktív formátum is szerepelhet bármelyik kategóriában. Képes előnézet nélkül típusjelölést kap. Kattintáskor a böngésző a fájlt megnyitja vagy saját támogatásától függően elmenti; ettől még nincs külön Download gomb.

## 5. Opcionális címek, leírások, dátum és sorrend

A `content/public-content.json` fájl **overrides** objektumát szerkeszd. Ne töröld a fájl többi beállítását. Példa:

```json
"overrides": {
  "writings/Ránézésre másolata.pdf": {
    "title": "Ránézésre — második példány",
    "description": "A saját, jóváhagyott leírásom.",
    "date": "2026-11-01",
    "order": 1,
    "cover": "Ránézésre másolata.jpg"
  }
}
```

- A kulcs: kategória és fájl útvonala, például `writings/konyv.pdf`.
- `cover`: a kategóriamappához viszonyított képfájl, nem teljes Windows-útvonal.
- Kisebb `order` előrébb kerül; ezt dátum szerint csökkenő sorrend követi.
- Metaadat nélkül a cím a fájlnévből, a dátum az eredeti fájl UTC módosítási idejéből származik. Nem készül kitalált leírás.
- A meglévő, kézzel szerkesztett adatokat a frissítő megőrzi. Tartós módosításra az `overrides` javasolt, nem a generált `data/*.json` kézi szerkesztése.
- Kifejezett letöltési linket csak az opcionális `download: true` kapcsoló ad. Általában nincs rá szükség.

Az ékezetes és szóközös fájlnevek használhatók. JSON-ban figyelj az idézőjelekre és vesszőkre, útvonalban `/` jelet használj. A `../`, az abszolút Windows-útvonal és a kategórián kívülre mutató hivatkozás hibát eredményez.

## 6. Új saját CAD-cikk

A root mappában nyiss terminált:

```text
node tools/create-article.js uj-cad-projekt "Az új CAD-projekt címe"
```

A parancs létrehozza az `assets/cad/uj-cad-projekt/index.html` fájlt. A saját szöveget az `<article>...</article>` részbe írd. A közös navigáció és Warm Minimal megjelenés automatikus. A fejléc `post-title`, `post-description`, opcionális `post-date` és `post-thumb` mezői használhatók. A borító útvonala a cikk mappájához relatív, például `images/borito.jpg`.

A cikkhez tartozó normál illusztrációkat egyszerűen másolhatod az `images` mappába; nem kell képenként JSON-engedély. Frissítés után az új cikk megjelenik a CAD-galériában. A cikk illusztrációi nem lesznek külön kártyák.

A saját cikk tudatosan létrehozott HTML-oldal. A helper rögzíti az **authoredArticles** listában, így megkülönböztethető egy véletlenül bemásolt aktív HTML-forrástól. Meglévő cikket nem ír felül. Ne másolj ide ismeretlen HTML/SVG/script/futtatható fájlt: az aktív formátumokra és az álruhás aktív fájlokra továbbra is hibát jelez a frissítő.

## 7. Opcionális privát eredetik

A `portfolio-private` mappa **nem szükséges** a normál nyilvános frissítéshez. Ha nincs ilyen mappa, a public-first munkamenet ugyanúgy működik. A program nem hozza létre és nem igényli automatikusan.

Ha egy eredetit nem szeretnél publikálni, tartsd a root mellett:

```text
04_peresvalentin.xyz/
  root/                         ← nyilvános weboldal
  portfolio-private/            ← opcionális, nem telepítendő
    items.json
    cad/
    drawings/
    photo/
    writings/
```

A meglévő privát munkamenet megmaradt: a megfelelő mappába tett fájlhoz a privát `items.json` tartalmazhat címet, borítót és mellékleteket. Az eredeti privát marad; csak az előnézet és a leírás kerül a weboldalra. A `hidden: true` a teljes tételt elrejti.

```json
{
  "cad/munkamodell.step": {
    "title": "Munkamodell",
    "cover": "cad/munkamodell.jpg",
    "description": "Csak képes bemutató, az eredeti nem nyilvános."
  }
}
```

Kifejezett nyilvános eredetihez a privát munkamenetben továbbra is `publishOriginal: true` szükséges. Nem böngészőben megjeleníthető formátumhoz ezen felül `download: true` kell. Privát mellékletnél külön `publish` és `download` kapcsolók vannak. A privát mappát ne telepítsd és ne mozgasd a root alá; külön mentést igényel.

## 8. Frissítés, hibaellenőrzés, helyi megtekintés

Szükséges: rendszerre telepített **Node.js 18+** és **ImageMagick 7**, mindkettő a Windows PATH-on. Ellenőrizve Node.js v26.13.0-val. Nincs Codex-függő elérési út vagy npm/build követelmény.

1. Dupla kattintás: **Update Website Content.cmd**.
2. Olvasd el az eredményt. `SUCCESS` esetén az adatok és előnézetek frissültek. `WARNING` például hiányzó borítót jelent; a tétel ilyenkor is látható. `ERROR` esetén javítsd a hibát, és ne publikálj addig.
3. Dupla kattintás: **Preview Website.cmd**.
4. Nyisd meg: **http://127.0.0.1:8766/**. A terminál maradjon nyitva; Ctrl+C állítja le.
5. Ellenőrizd a kategóriákat, PDF-eket, képnagyítást és a mobilmenüt.

A helyi működéshez nem kell internet, és a helyi látogatás nem kerül az analitikába. Linuxon vagy terminálból a `node tools/update-content.js`, illetve a `node tools/preview.js` parancs használható. A felesleges régi indítókat eltávolítottuk; Windows alatt a két napi indító az **Update Website Content.cmd** és a **Preview Website.cmd**. A nyers `tools/generate.js`/`generate.ps1` alacsony szintű részeszköz; napi használatra a teljes frissítőt válaszd.

A program ellenőrzi a hiányzó hivatkozásokat, a kétértelmű borítókat, az útvonalakat és az aktív/futtatható tartalmat. Az aktív fájlra kapott hiba nem teszi automatikusan priváttá a public root alá már bemásolt fájlt: azt a publikálás előtt tedd megfelelő, nem nyilvános helyre. Archívumok és dokumentumok tartalmát nem futtatja, de teljes vírusellenőrzést sem helyettesít.

## 9. Kézi Git-ellenőrzés és publikálás

- Visual Studióban nyisd meg a root repository **Git Changes** paneljét.
- Nézd át az új eredetiket, `assets/previews`, `data`, konfiguráció- és kódváltozásokat. A public mappákba csak valóban publikálható tartalom kerüljön.
- A működéshez szükséges generált JSON/WebP fájlok nincsenek Gitből kizárva. A `.content-cache.json` helyi gyorsítótár; a `.content-generated.json` követett származék-nyilvántartás.
- Saját döntésed alapján készíts commitot és push-t. Ezeket a parancsaink nem végzik el.
- A Git push nem feltétlenül telepítés. A repository külön `deploy.sh`/rsync munkamenetet is tartalmaz; a meglévő telepítési módot kézzel alkalmazd, majd ellenőrizd a publikus oldalt.

A régi `pages/gallery.html` cím továbbra is Home-ra irányít. A régi CSS-URL-ek megmaradtak kompatibilitási belépőként; az aktív megjelenést egyetlen `css/warm.css` határozza meg.

Regressziós ellenőrzés:

```text
node tools/test-generators.js
node tools/test-content-workflow.js
```

A tesztek külön ideiglenes mappában próbálják ki a nyilvános PDF/kép és egyéb formátumok felismerését, a borítópárosítást, ismételt frissítést, privát opciót, aktív tartalom elutasítását és takarítást. Valódi portfóliótartalmat nem törölnek és nem publikálnak tesztfájlokat.
