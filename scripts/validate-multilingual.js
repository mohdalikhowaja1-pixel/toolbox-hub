const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = process.cwd();
const BASE = 'https://mytoolx.org';
const errors = [];
const stats = { urls: 0, en: 0, es: 0, fr: 0, blogArticles: 0, identifierTriplets: 0 };
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const fail = message => errors.push(message);
function attr(tag, name) {
  const match = tag.match(new RegExp('(?:^|\\s)' + name + '=["\\x27]([^"\\x27]*)["\\x27]', 'i'));
  return match ? match[1] : null;
}
function langOf(p) { return p === '/es' || p.startsWith('/es/') ? 'es' : p === '/fr' || p.startsWith('/fr/') ? 'fr' : 'en'; }
function relativeOf(p) { const lang = langOf(p); return p === '/' || p === '/es/' || p === '/fr/' ? '' : lang === 'en' ? p.slice(1) : p.replace(/^\/(es|fr)\//, ''); }
function localized(relative, lang) { return BASE + (!relative ? (lang === 'en' ? '/' : '/' + lang + '/') : (lang === 'en' ? '/' + relative : '/' + lang + '/' + relative)); }
function htmlFile(p) { return p === '/' ? 'index.html' : p === '/es/' || p === '/fr/' ? p.slice(1) + 'index.html' : p.slice(1); }
function sequence(s, re) { return [...s.matchAll(re)].map(m => m[1]); }
function walkJson(v, visit) {
  if (Array.isArray(v)) return v.forEach(x => walkJson(x, visit));
  if (!v || typeof v !== 'object') return;
  visit(v); Object.values(v).forEach(x => walkJson(x, visit));
}
function compareTriplet(relative) {
  const files = [relative, 'es/' + relative, 'fr/' + relative];
  const sources = files.map(read);
  const checks = [
    ['id', /\bid=["\x27]([^"\x27]+)["\x27]/g],
    ['name', /\bname=["\x27]([^"\x27]+)["\x27]/g],
    ['function', /\bfunction\s*\*?\s+([\p{ID_Start}_$][\p{ID_Continue}$]*)\s*\(/gu],
    ['handler', /\b(on(?:click|input|change|submit|keyup|keydown|load|error))=/gi]
  ];
  for (const [label, re] of checks) {
    const base = sequence(sources[0], re);
    for (let i = 1; i < 3; i++) if (JSON.stringify(base) !== JSON.stringify(sequence(sources[i], re))) fail(files[i] + ': ' + label + ' sequence differs from English');
  }
  stats.identifierTriplets++;
}
const sitemap = read('sitemap.xml');
const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)];
const locs = [];
const pageRows = [];
for (const m of blocks) {
  const block = m[1], lm = block.match(/<loc>([^<]+)<\/loc>/);
  if (!lm) { fail('Sitemap URL block missing loc'); continue; }
  const loc = lm[1].trim(), u = new URL(loc), p = u.pathname, lang = langOf(p), relative = relativeOf(p), file = htmlFile(p);
  locs.push(loc); stats[lang]++;
  if (!fs.existsSync(path.join(ROOT, file))) fail('Missing sitemap page ' + file);
  const alts = [...block.matchAll(/<xhtml:link\b([^>]*)\/?\s*>/g)].map(x => ({lang: attr(x[1], 'hreflang'), href: attr(x[1], 'href')}));
  const expected = { en: localized(relative, 'en'), es: localized(relative, 'es'), fr: localized(relative, 'fr'), 'x-default': localized(relative, 'en') };
  if (alts.length !== 4) fail(loc + ': expected 4 sitemap hreflang links');
  for (const code of Object.keys(expected)) if (!alts.some(a => a.lang === code && a.href === expected[code])) fail(loc + ': incorrect sitemap hreflang ' + code);
  pageRows.push({loc, file, lang, relative});
}
stats.urls = locs.length;
if (new Set(locs).size !== locs.length) fail('Duplicate sitemap loc URL');
if (stats.urls !== 168 || stats.en !== 56 || stats.es !== 56 || stats.fr !== 56) fail('Sitemap must contain 56 URLs per language (168 total)');
for (const row of pageRows) {
  if (!fs.existsSync(path.join(ROOT, row.file))) continue;
  const source = read(row.file);
  const scriptTags = [...source.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
  scriptTags.forEach((match, index) => {
    const tag = '<script ' + match[1] + '>';
    const type = (attr(tag, 'type') || '').toLowerCase();
    const src = attr(tag, 'src');
    if (type === 'module' || /json|template/.test(type)) return;
    if (type && !/(java|ecma)script/.test(type)) return;
    if (!src) {
      try { new vm.Script(match[2], { filename: row.file + ':inline-' + index }); }
      catch (error) { fail(row.file + ': inline JavaScript syntax error: ' + error.message); }
    } else if (!/^https?:|^\\/\\//i.test(src)) {
      const local = src.startsWith('/') ? src.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(row.file), src));
      if (fs.existsSync(path.join(ROOT, local))) {
        try { new vm.Script(read(local), { filename: local }); }
        catch (error) { fail(local + ': JavaScript syntax error: ' + error.message); }
      }
    }
  });
  const html = source.match(/<html\b[^>]*>/i);
  if (!html || attr(html[0], 'lang') !== row.lang) fail(row.file + ': wrong html lang');
  const links = [...source.matchAll(/<link\b[^>]*>/gi)].map(x => x[0]);
  const canonical = links.find(x => attr(x, 'rel') === 'canonical');
  if (!canonical || attr(canonical, 'href') !== row.loc) fail(row.file + ': canonical mismatch');
  if ((source.match(/href=["\x27]\/lang-switcher\.css["\x27]/g) || []).length !== 1) fail(row.file + ': switcher CSS must be linked exactly once');
  if ((source.match(/src=["\x27]\/lang-switcher\.js["\x27]/g) || []).length !== 1) fail(row.file + ': switcher JS must be linked exactly once');
  const alternates = links.filter(x => attr(x, 'rel') === 'alternate' && attr(x, 'hreflang'));
  if (alternates.length !== 4) fail(row.file + ': expected 4 HTML hreflang links');
  const expected = { en: localized(row.relative, 'en'), es: localized(row.relative, 'es'), fr: localized(row.relative, 'fr'), 'x-default': localized(row.relative, 'en') };
  for (const code of Object.keys(expected)) if (!alternates.some(x => attr(x, 'hreflang') === code && attr(x, 'href') === expected[code])) fail(row.file + ': incorrect HTML hreflang ' + code);
}
const blogPages = fs.readdirSync(ROOT).filter(x => /^blog-[^/]+\.html$/.test(x)).sort();
stats.blogArticles = blogPages.length;
if (blogPages.length !== 24) fail('Expected 24 blog article pages');
for (const relative of blogPages) {
  for (const lang of ['en', 'es', 'fr']) {
    const file = lang === 'en' ? relative : lang + '/' + relative, source = read(file);
    const links = [...source.matchAll(/<link\b[^>]*>/gi)].map(x => x[0]);
    const canonicalTag = links.find(x => attr(x, 'rel') === 'canonical');
    const canonical = canonicalTag && attr(canonicalTag, 'href');
    let article = false, breadcrumb = false;
    const jsonBlocks = [...source.matchAll(/<script\b[^>]*type=["\x27]application\/ld\+json["\x27][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const block of jsonBlocks) {
      try {
        walkJson(JSON.parse(block[1]), object => {
          const types = Array.isArray(object['@type']) ? object['@type'] : [object['@type']];
          if (types.includes('Article') || types.includes('BlogPosting')) article = object.url === canonical && object.inLanguage === lang;
          if (types.includes('BreadcrumbList')) breadcrumb = true;
        });
      } catch (e) { fail(file + ': invalid JSON-LD ' + e.message); }
    }
    if (!article) fail(file + ': Article schema url/inLanguage mismatch');
    if (!breadcrumb) fail(file + ': BreadcrumbList missing');
  }
}
for (const row of pageRows) if (row.lang === 'en') compareTriplet(row.relative || 'index.html');
if (errors.length) {
  console.error('FAILED: ' + errors.length + ' issue(s)');
  errors.forEach(x => console.error(' - ' + x));
  process.exit(1);
}
console.log('PASSED: multilingual static validation');
console.log(JSON.stringify(stats, null, 2));
