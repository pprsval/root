# Gallery content generation

The site is static HTML/CSS/JavaScript. `js/gallery-engine.js` runs in the browser
on Windows 11 and Debian Linux without Node.js, PowerShell, or added dependencies.
Only the offline content-generation step needs a runtime. Publish `data/*.json`
along with the existing site files and assets; no server-side generator is needed.

## Windows 11 (no Node.js required)

Prerequisite: Windows PowerShell 5.1, included with Windows 11.
Double-click `Generate JSON.cmd`, or run it from a terminal:

```powershell
.\'Generate JSON.cmd'
```

Alternatively, from the site root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\generate.ps1
```

The launcher uses a process-only execution-policy override, leaving saved policy
settings unchanged. Organization-enforced PowerShell restrictions still apply.
PowerShell 7 can also run `tools/generate.ps1`.

## Debian Linux

Prerequisites: a POSIX shell and Node.js (Node 18 or newer recommended).
No npm install is needed. If Node is not installed:

```sh
sudo apt update
sudo apt install nodejs
```

From the site root:

```sh
sh ./generate.sh
# Existing command remains supported:
node tools/generate.js
```

Optionally use `chmod +x generate.sh` and then `./generate.sh`.
Both launchers locate the site relative to themselves, so invoking them by an
absolute path works from any working directory, including paths containing spaces.
The generators also default to their script's parent directory. For a separate
content root, use `node tools/generate.js /path/to/root` or
`powershell.exe -File tools/generate.ps1 -Root 'C:\path\to\root'`.

## Shared content rules

Both generators scan `assets/cad`, `assets/photo`, `assets/drawings`, and
`assets/writings`, writing the corresponding `data/<category>.json` files.
They ignore dot-prefixed entries and unsupported files. Image/PDF extensions
are PNG, JPG, JPEG, WEBP and PDF (case-insensitive). A child directory becomes a
blog entry when it contains `index.html`; deeper files are not separate entries.
Use the exact lowercase `index.html` spelling for compatibility with Linux.

The existing schemas are unchanged:

- Image/PDF: `title`, `file`, `date`, `tags`.
- Blog: `title`, `file`, `date`, `type`, `description`, `cover`, `tags`.

Blog metadata uses the existing `<meta name="post-title" content="...">` form,
with `name` before `content`; also supported are `post-date`, `post-type`,
`post-description`, and `post-thumb`. Single or double quotes are accepted.
Values are trimmed and HTML entities are preserved, as in the original generator.
Absent metadata keeps the filename-derived title, `Műhelynapló` type, empty
description, null cover, and category/blog tags. Cover paths are relative to the
post directory; use forward slashes in `post-thumb` on both operating systems.

Use `YYYY-MM-DD` for post dates; `YYYY.MM.DD` is normalized to that form.
Other date text is retained verbatim for compatibility, but only the documented
formats have chronological ordering. Missing dates use the file or directory's
last-modified date in UTC. To reproduce identical dates on another machine,
preserve asset modification times when copying: Git checkout timestamps alone
are not stable content dates. Explicit blog dates avoid that dependency.

Ordering is descending date text, then ascending ordinal (case-sensitive) file
path for ties, independent of system locale and directory enumeration order.
For the documented dates this is newest first. Same-date ordering is now explicit.
Paths use forward slashes. Outputs are UTF-8 without a BOM and always arrays,
even when empty or containing one item. JSON indentation/escaping can differ
between runtimes; parsed schemas, values, property order and item order agree.
A missing asset directory warns and leaves its existing JSON untouched.

## Checking generator parity

Development checks require Node.js plus PowerShell. Windows PowerShell 5.1 is
the default on Windows; on Linux install PowerShell 7 separately for this check
only (it is not required for normal Linux generation).

```sh
node tools/test-generators.js
# Explicitly test PowerShell 7:
node tools/test-generators.js pwsh
```

The check compares parsed JSON for the site's current content and controlled
fixtures: Unicode, uppercase extensions, UTC dates, date ties, metadata, nested
cover paths, ignored files, empty/single-item arrays, and missing directories.
It works in temporary copies, preserves timestamps, and leaves site data intact.

Validation performed on Windows: both Windows PowerShell 5.1 and PowerShell 7
matched Node output for 48 current entries and all fixtures. Native Debian
execution was not available in the development environment; run the same check
there to verify that environment.