# Peres Valentin — static public portfolio

## Daily publishing

1. Copy public content into **assets/cad**, **assets/drawings**, **assets/photo**, or **assets/writings**.
2. Optionally add a same-stem raster cover or custom metadata under **content/public-content.json → overrides**.
3. Run **Update Website Content.cmd**.
4. Run **Preview Website.cmd**, then open http://127.0.0.1:8766/.
5. Review Git Changes in Visual Studio; commit, push and deploy manually.

Ordinary public files need no approval list or JSON entry. The category directory determines the subject, not the extension. PDF/image/document/archive/CAD and unknown non-active formats are detected. Custom metadata is optional. PDF/cover pairs produce one visible card. There are no explicit Download buttons by default; browsers may save formats they cannot display.

Read **WEBSITE_CONTENT_GUIDE_HU.md** for practical Hungarian examples.

## Dependencies

System Node.js 18+ and ImageMagick 7 on PATH for updating; Node.js alone for preview. Verified with system Node.js v26.13.0. No Codex paths, npm packages, frontend framework, external fonts, or build step are required.

Windows: Update Website Content.cmd / Preview Website.cmd.
Linux: node tools/update-content.js / node tools/preview.js.
Direct: node tools/update-content.js.

## Organization

- **index.html, pages/**: public pages; pages/gallery.html preserves the legacy URL by redirecting Home.
- **assets/**: original public portfolio content, article media, optimized previews, explicitly published copies of optional private files.
- **css/warm.css**: the single active design implementation. Older CSS paths remain tiny compatibility imports to preserve their public URLs.
- **js/navigation.js, gallery-engine.js, analytics.js**: shared navigation, galleries/lightbox, production-only analytics.
- **data/**: generated public gallery/preview data; commit these files.
- **content/public-content.json**: optional metadata overrides, optional private-folder location and deliberately authored article paths. There is no per-file public approval inventory.
- **tools/**: update orchestration, low-level generators, article helper/template, preview and regression tests.
- **.content-cache.json**: ignored local incremental cache and article-metadata provenance.
- **.content-generated.json**: tracked inventory of managed derivatives/public copies.

The retained Node and PowerShell low-level generators remain equivalent. The complete update pipeline runs the Node generator on a temporary mirror, merges curated metadata, discovers additional formats and nested ordinary content, checks references and produces cached previews. Article support files stay grouped with their article. Use the complete update command for daily work.

## Optional private sources

**../portfolio-private** is optional and outside the public website. Its absence does not block public publishing. If used, it retains the previous private-original/preview workflow and items.json metadata. No private source is copied to the public root without explicit permission. Back up this folder separately; never deploy it.

Public folders are inherently public: no link or a failed update does not conceal a file already placed there. Active/executable extensions and detected active payloads are rejected before updating public data. Use tools/create-article.js for deliberately authored HTML articles; arbitrary uploaded HTML/SVG/scripts are not embedded. This validation is not an antivirus scanner or a replacement for the hosting platform's MIME policy.

## Maintenance and tests

```text
node tools/test-generators.js
node tools/test-content-workflow.js
```

The first checks Node/PowerShell parity. The second uses isolated fixtures for public PDF/image/other-format discovery, cover associations, private options, attachments, active-file/path validation, metadata, article creation, caching, repeated runs and cleanup. Original media is never altered by updating.

The existing Git and deploy.sh/rsync workflows are retained. A push is not assumed to deploy the site. Nothing in the update or preview tools commits, pushes, or deploys.
