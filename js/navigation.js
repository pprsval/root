// Shared shell; all paths derive from this script, including nested articles.
const siteBase = new URL('../', document.currentScript.src);
const shell = "<header class=\"mobile-header\"><a href=\"/index.html\">Peres Valentin</a><button type=\"button\" class=\"menu-toggle\" aria-controls=\"site-sidebar\" aria-expanded=\"false\">Menu <span aria-hidden=\"true\">☰</span></button></header>\n<div class=\"menu-backdrop\" hidden></div>\n<aside class=\"sidebar\" id=\"site-sidebar\" aria-label=\"Portfolio navigation\"><div class=\"sidebar-top\"><a class=\"wordmark\" href=\"/index.html\">Peres<br>Valentin<span>Personal portfolio</span></a><button class=\"menu-close\" type=\"button\" aria-label=\"Close menu\">×</button></div>\n<nav aria-label=\"Main navigation\"><a href=\"/index.html\" aria-current=\"page\"><span>Home</span><span class=\"nav-mark\" aria-hidden=\"true\">↗</span></a><a href=\"/pages/cad.html\"><span>CAD</span><span class=\"nav-mark\" aria-hidden=\"true\">↗</span></a><a href=\"/pages/drawings.html\"><span>Drawings</span><span class=\"nav-mark\" aria-hidden=\"true\">↗</span></a><a href=\"/pages/photo.html\"><span>Photography</span><span class=\"nav-mark\" aria-hidden=\"true\">↗</span></a><a href=\"/pages/writings.html\"><span>Writings</span><span class=\"nav-mark\" aria-hidden=\"true\">↗</span></a></nav>\n<div class=\"sidebar-footer\"><span>Get in touch</span><a href=\"mailto:p.valentyin@protonmail.com\">p.valentyin@protonmail.com</a></div></aside>";
const shellTemplate = document.createElement('template');
shellTemplate.innerHTML = shell;
shellTemplate.content.querySelectorAll('a[href^="/"]').forEach(a => a.href = new URL(a.getAttribute('href').slice(1), siteBase));
shellTemplate.content.querySelectorAll('nav a').forEach(a => {
 a.removeAttribute('aria-current');
 const name = a.pathname.split('/').pop().replace('.html','');
 if(name === (document.body.dataset.section === 'home' ? 'index' : document.body.dataset.section)) a.setAttribute('aria-current','page');
});
document.body.insertBefore(shellTemplate.content, document.querySelector('.skip-link')?.nextSibling || document.body.firstChild);
(() => {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.menu-toggle');
  const close = document.querySelector('.menu-close');
  const backdrop = document.querySelector('.menu-backdrop');
  const main = document.querySelector('main');
  const header = document.querySelector('.mobile-header');
  const mobile = matchMedia('(max-width: 1000px)');
  let open = false;
  function setOpen(value, restore = true) {
    open = value && mobile.matches;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    backdrop.hidden = !open;
    sidebar.inert = mobile.matches && !open;
    main.inert = open;
    header.inert = open;
    if (open) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      close.focus();
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      if (restore && mobile.matches) toggle.focus();
    }
  }
  toggle.addEventListener('click', () => setOpen(!open));
  close.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false, false)));
  document.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    if (e.key === 'Tab') {
      const links = [...sidebar.querySelectorAll('a, button')].filter(e => e.getClientRects().length);
      const first = links[0], last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  mobile.addEventListener('change', () => setOpen(false, false));
  addEventListener('pageshow', () => setOpen(false, false));
  setOpen(false, false);
})();
