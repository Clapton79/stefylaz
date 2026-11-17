// Static site generator for stefylaz.com — no dependencies.
// Content lives in content/<lang>.json; output goes to dist/.
// Run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { wakeSVG, foamSVG, starsSVG, icon, ornament, sunburst } from "./src/art.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "dist");
const SITE_URL = "https://stefylaz.com"; // used only for social-share preview tags

const LANGS = ["en", "es", "de", "hu"];
const LANG_PREFIX = { en: "", es: "es/", de: "de/", hu: "hu/" };
const PAGES = ["home", "invite", "venue", "menu", "contact", "gifts", "sightseeing", "hotels", "photo-credits"];
const PAGE_SLUG = { home: "" };
const slug = (p) => (p in PAGE_SLUG ? PAGE_SLUG[p] : `${p}/`);
// "Hour" of the evening each page's sky shows (0 = golden afternoon, 1 = deep night)
const PAGE_HOUR = { invite: 0.08, venue: 0.22, menu: 0.5, contact: 0.3, gifts: 0.4, sightseeing: 0.12, hotels: 0.66, "photo-credits": 0.85 };
// Image used on each page's deck tile
const PAGE_IMG = { invite: "TheGreatBodaPestEvent.webp", venue: "EuropaHajo.webp", contact: "StefLazCouch.webp", sightseeing: "parliament.webp", hotels: "hotels-map.webp" };

const content = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(readFileSync(join(ROOT, "content", `${l}.json`), "utf8"))]));

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = esc;
const ext = `target="_blank" rel="noopener noreferrer"`;

function pathFor(lang, page) {
  return `${LANG_PREFIX[lang]}${slug(page)}`;
}
function rel(fromPath, toPath) {
  const depth = fromPath.split("/").filter(Boolean).length;
  const up = depth ? "../".repeat(depth) : "./";
  return up + toPath;
}

// Split "<strong>When:</strong> 25 June 2027 at 17:15" → { label, value }
function splitFact(html) {
  const m = html.match(/^<strong>(.*?):?<\/strong>\s*(.*)$/);
  return m ? { label: m[1].replace(/:$/, ""), value: m[2] } : { label: "", value: html };
}
const isVegan = (s) => /vegan|vegano|vegán/i.test(s);
// Night tone for schedule items: after sunset (Budapest sunset ≈ 20:46 on 25 June)
function tone(time) {
  const h = parseInt(time, 10);
  if (h >= 21 || h < 5) return "night";
  if (h >= 19) return "dusk";
  return "day";
}

// ---------- Shared chrome ----------
function head({ lang, title, here, page, c }) {
  const r = (p) => rel(here, p);
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}/${pathFor(l, page)}">`).join("\n    ");
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#f29a4f">
    <title>${esc(title)}</title>
    <meta property="og:title" content="${attr(title)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${SITE_URL}/assets/img/TheGreatBodaPestEvent.jpg">
    <meta property="og:locale" content="${lang}">
    ${alternates}
    <link rel="icon" href="${r("assets/favicon.svg")}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Poiret+One&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${r("assets/styles.css")}">
    <script>document.documentElement.classList.add("js");try{if(sessionStorage.getItem("stefylaz-nav")==="1")document.documentElement.classList.add("nav-init")}catch(e){}</script>
    <script src="${r("assets/main.js")}" defer></script>
</head>`;
}

function langSwitch({ lang, page, here, c, cls = "" }) {
  return `<nav class="langs ${cls}" aria-label="${attr(c.langLabel)}">
        ${c.languages
          .map(
            (l) =>
              `<a href="${rel(here, pathFor(l.lang, page))}" lang="${l.lang}" hreflang="${l.lang}" title="${attr(l.label)}"${l.lang === lang ? ' aria-current="true"' : ""}><span aria-hidden="true">${l.lang.toUpperCase()}</span><span class="sr-only">${esc(l.label)}</span></a>`
          )
          .join("")}
      </nav>`;
}

function navLinks({ lang, page, here, c }) {
  return c.nav
    .map((n, i) => {
      const p = PAGES[i];
      return `<a href="${rel(here, pathFor(lang, p))}"${p === page ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`;
    })
    .join("");
}

function langPick({ lang, page, here, c }) {
  return `<div class="lang-pick" data-lang-pick>
          <button class="lang-pick__btn" type="button" aria-expanded="false" aria-controls="lang-list" aria-label="${attr(c.langLabel)}">
            <span>${lang.toUpperCase()}</span>${icon("chevron")}
          </button>
          <ul class="lang-pick__list" id="lang-list" hidden>
            ${c.languages
              .map(
                (l) =>
                  `<li><a href="${rel(here, pathFor(l.lang, page))}" lang="${l.lang}" hreflang="${l.lang}"${l.lang === lang ? ' aria-current="true"' : ""}><span class="lang-pick__code" aria-hidden="true">${l.lang.toUpperCase()}</span>${esc(l.label)}</a></li>`
              )
              .join("")}
          </ul>
        </div>`;
}

function header(ctx) {
  const { lang, page, here, c } = ctx;
  return `<header class="bar${page === "home" ? " bar--home" : ""}" data-bar>
    <div class="bar__row">
      <a class="bar__brand" href="${rel(here, pathFor(lang, "home"))}">${esc(c.brand)}</a>
      <div class="bar__tow">
        <nav class="bar__nav" id="tow-nav" aria-label="${attr(c.navLabel)}" style="--n:${c.nav.length}">
          ${navLinks(ctx)
            .split("</a>")
            .filter(Boolean)
            .map((l, i) => l.replace("<a ", `<a style="--i:${i}" `) + "</a>")
            .join("")}
        </nav>
      </div>
      <div class="bar__lang">
        ${langSwitch({ ...ctx, cls: "langs--bar" })}
        ${langPick(ctx)}
      </div>
      <button class="bar__menu" type="button" aria-expanded="false" aria-controls="deck" data-menu-toggle>
        <span class="bar__menu-label">${esc(c.menuLabel)}</span>
        <span class="burger" aria-hidden="true"><i></i><i></i></span>
      </button>
    </div>
  </header>
  <div class="deck" id="deck" hidden data-deck>
    <div class="deck__frame">
      ${sunburst("deck__fan")}
      <p class="deck__brand">${esc(c.brand)}</p>
      <nav class="deck__nav" aria-label="${attr(c.navLabel)}">${navLinks(ctx)}</nav>
      ${langSwitch({ ...ctx, cls: "langs--deck" })}
    </div>
  </div>`;
}

function footer(ctx) {
  const { lang, here, c } = ctx;
  return `<footer class="foot">
    ${ornament("foot__orn")}
    <p class="foot__brand">${esc(c.brand)}</p>
    <p class="foot__date">${esc(c.kicker)}</p>
    <nav class="foot__nav" aria-label="${attr(c.navLabel)}">${navLinks(ctx)}</nav>
    ${langSwitch({ ...ctx, cls: "langs--foot" })}
    <p class="foot__credits"><a href="${rel(here, pathFor(lang, "photo-credits"))}">${esc(c.creditsLabel)}</a></p>
  </footer>`;
}

// The layered poster scene: sky, two cloud depths, the Parliament, the Danube and the boat.
// Each layer moves at its own depth with scroll and pointer (see main.js).
function scene(ctx, { hour = 0, hero = false } = {}) {
  const a = (f) => rel(ctx.here, "assets/img/hero/" + f);
  const cloud = (file, cls, w, h) => `<img class="cloud cloud--${cls}" src="${a("cloud-" + file + ".webp")}" alt="" width="${w}" height="${h}" decoding="async">`;
  const picture = (base, w, h, cls, eager) =>
    `<picture class="${cls}">${hero ? `<source media="(max-aspect-ratio: 5/8)" srcset="${a(base + "-tall.webp")}">` : ""}<img src="${a(base + "-wide.webp")}" alt="" width="${w}" height="${h}"${eager ? ' fetchpriority="high"' : ' decoding="async"'}></picture>`;
  return `<div class="scene" style="--t:${hour}" aria-hidden="true" data-scene>
      <div class="layer layer--sky" style="--dy:.55"><div class="scene__sky"></div><div class="scene__stars">${starsSVG()}</div></div>
      <div class="layer layer--far" style="--dy:.5">${cloud("pale-a", "pa", 720, 217)}${cloud("pale-b", "pb", 1046, 345)}</div>
      <div class="layer layer--mid" style="--dy:.4">${cloud("mid", "m1", 1600, 356)}${cloud("mid", "m2", 1600, 356)}</div>
      <div class="layer layer--near" style="--dy:.3">${cloud("bank", "b1", 1600, 390)}${cloud("bank", "b2", 1600, 390)}</div>
      ${hero ? `<div class="scene__show"></div><canvas class="fireworks" data-fireworks></canvas>` : ""}
      <div class="layer layer--city" style="--dy:.2"><div class="quay"></div>${picture("building", 1800, 762, "city", true)}</div>
      <div class="layer layer--water" style="--dy:.2">${picture("water", 1800, 334, "water", false)}<div class="ripples"></div></div>
      ${
        hero
          ? `<div class="layer layer--boat" style="--dy:.08">
        <div class="boat" data-boat>
          ${wakeSVG()}
          <img class="boat__mirror" src="${a("boat.webp")}" alt="" width="1300" height="373" decoding="async">
          <img class="boat__ship" src="${a("boat.webp")}" alt="" width="1300" height="373" fetchpriority="high">
          ${foamSVG()}
          <button class="boat__couple" type="button" tabindex="-1" aria-label="${attr(ctx.c.brand)}" data-horn></button>
        </div>
      </div>`
          : ""
      }
      <div class="scene__dusk"></div>
    </div>`;
}

function page(ctx, body) {
  const { c, page } = ctx;
  return `${head(ctx)}
<body class="p-${page}${(PAGE_HOUR[page] ?? 0) >= 0.45 ? " sky-night" : ""}">
  ${header(ctx)}
  <main id="main">
${body}
  </main>
  ${footer(ctx)}
</body>
</html>
`;
}

function pageHero(ctx, title) {
  const hour = PAGE_HOUR[ctx.page] ?? 0.3;
  return `<section class="phero${hour >= 0.45 ? " is-night" : ""}" data-hero>
    ${scene(ctx, { hour })}
    <div class="phero__inner">
      <h1 class="phero__title">${esc(title)}</h1>
    </div>
  </section>`;
}

function img(ctx, file, alt, { cls = "", lazy = true, w, h, sizes } = {}) {
  return `<img class="${cls}" src="${rel(ctx.here, "assets/img/" + file)}" alt="${attr(alt)}"${w ? ` width="${w}" height="${h}"` : ""}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;
}

// ---------- Components ----------
function schedule(ctx, { withTitle = true, id = "evening" } = {}) {
  const v = ctx.c.venue;
  return `<section class="evening" id="${id}" data-evening>
    <div class="evening__stars" aria-hidden="true">${starsSVG(70, 1000, 1400)}</div>
    <div class="evening__inner">
      ${withTitle ? `<h2 class="evening__title">${esc(v.scheduleTitle)}</h2>` : ""}
      <ol class="voyage" data-voyage>
        <li class="voyage__rail" aria-hidden="true"><span class="voyage__boat" data-voyage-boat>${icon("boat")}</span></li>
        ${v.schedule
          .map(
            (s) => `<li class="stop stop--${tone(s.time)}" data-stop>
          <time class="stop__time" datetime="${s.time}">${esc(s.time)}</time>
          <p class="stop__text">${s.text}</p>
        </li>`
          )
          .join("\n        ")}
      </ol>
    </div>
  </section>`;
}

function divider(cls = "") {
  return `<div class="zig ${cls}" aria-hidden="true"></div>`;
}

// ---------- Pages ----------
const render = {
  home(ctx) {
    const { c, here, lang } = ctx;
    const h = c.home;
    const words = c.masthead.split(" ");
    const masthead =
      words.length === 4
        ? `<span class="mh__small">${esc(words[0])} ${esc(words[1])}</span><span class="mh__big">${esc(words[2])}</span><span class="mh__small">${esc(words[3])}</span>`
        : `<span class="mh__big">${esc(c.masthead)}</span>`;
    const [n1, n2] = c.brand.split("&").map((s) => s.trim());
    const facts = h.facts.map(splitFact);
    const contact = c.contact.sections[0];
    const email = (contact.paragraphs[0].match(/mailto:([^"]+)/) || [])[1];
    const decks = PAGES.slice(1, 8);
    return `<section class="hero" data-hero>
      ${scene(ctx, { hour: 0, hero: true })}
      <div class="hero__type">
        <p class="mh">${masthead}</p>
        <h1 class="names"><span class="names__a">${esc(n1)}</span> <span class="names__amp">&amp;</span> <span class="names__b">${esc(n2)}</span></h1>
        <p class="hero__date"><span>${esc(c.kicker)}</span></p>
      </div>
      <a class="hero__cue" href="#welcome" aria-label="${attr(h.heading)}">${icon("down")}</a>
    </section>

    <section class="welcome" id="welcome">
      <article class="pass card">
        <div class="pass__main">
          <h2 class="pass__title">${esc(h.heading)}</h2>
          ${h.paragraphs.slice(0, 2).map((p) => `<p>${p}</p>`).join("\n          ")}
          <dl class="pass__facts">
            ${facts
              .map(
                (f, i) => `<div class="pass__fact">
              <dt>${icon(i === 0 ? "clock" : "pin")}${esc(f.label)}</dt>
              <dd>${f.value}</dd>
            </div>`
              )
              .join("")}
          </dl>
        </div>
        <div class="pass__stub">
          <p class="pass__rsvp">${h.paragraphs[2] || ""}</p>
          ${email ? `<a class="btn btn--rose" href="mailto:${attr(email)}">${icon("mail")}<span>${esc(email)}</span></a>` : ""}
          <div class="pass__barcode" aria-hidden="true"></div>
        </div>
      </article>
      <figure class="arch mat arch--home">
        ${img(ctx, "StefLazBE.webp", h.photoAlt, { w: 1600, h: 1200 })}
      </figure>
    </section>

    ${schedule(ctx)}

    <section class="decks" aria-label="${attr(c.navLabel)}">
      ${divider("zig--top")}
      <ul class="decks__grid">
        ${decks
          .map((p, i) => {
            const label = c.nav[PAGES.indexOf(p)].label;
            const im = PAGE_IMG[p];
            return `<li class="tile tile--${p}${im ? "" : " tile--type"}">
          <a href="${rel(here, pathFor(lang, p))}">
            ${im ? `<span class="tile__img">${img(ctx, im, "")}</span>` : `<span class="tile__art" aria-hidden="true">${sunburst("tile__fan")}</span>`}
            <span class="tile__label"><span>${esc(label)}</span>${icon("arrow")}</span>
          </a>
        </li>`;
          })
          .join("\n        ")}
      </ul>
    </section>`;
  },

  invite(ctx) {
    const v = ctx.c.invite;
    return `${pageHero(ctx, v.heading)}
    <section class="velvet">
      <a class="poster" href="${rel(ctx.here, "assets/img/TheGreatBodaPestEvent.jpg")}" ${ext}>
        <span class="poster__card">
          ${img(ctx, "TheGreatBodaPestEvent.webp", v.alt, { lazy: false, w: 848, h: 1264 })}
          <span class="poster__sheen" aria-hidden="true"></span>
        </span>
      </a>
    </section>`;
  },

  venue(ctx) {
    const v = ctx.c.venue;
    return `${pageHero(ctx, v.heading)}
    <section class="prose-block">
      <figure class="porthole mat">
        ${img(ctx, "EuropaHajo.webp", v.photoAlt, { w: 1253, h: 520 })}
      </figure>
      <div class="prose">
        ${v.paragraphs.map((p) => `<p>${p.replace("<a ", `<a ${ext} `)}</p>`).join("\n        ")}
      </div>
    </section>
    ${schedule(ctx, { id: "evening-schedule" })}`;
  },

  menu(ctx) {
    const m = ctx.c.menu;
    let n = 0;
    const sections = [];
    const cards = m.groups
      .map((g, gi) => {
        const secs = g.sections
          .map((s) => {
            const id = `m-${++n}`;
            sections.push({ id, title: s.title });
            const items = s.items.length
              ? `<ul>${s.items.map((it) => `<li${isVegan(it) ? ' class="is-vegan"' : ""}>${isVegan(it) ? icon("leaf") : ""}<span>${it}</span></li>`).join("")}</ul>`
              : "";
            return `<section class="course${s.items.length ? "" : " course--empty"}" id="${id}">
            <h3 class="course__title">${s.title}</h3>
            ${items}
          </section>`;
          })
          .join("\n");
        return `<article class="menu-card card${gi ? " menu-card--drinks" : ""}">
          ${sunburst("menu-card__fan menu-card__fan--l")}${sunburst("menu-card__fan menu-card__fan--r")}
          <h2 class="menu-card__title">${esc(g.title || m.heading)}</h2>
          ${ornament("menu-card__orn")}
          ${secs}
        </article>`;
      })
      .join("\n");
    return `${pageHero(ctx, m.heading)}
    <section class="menu-table">
      ${cards}
    </section>`;
  },

  contact(ctx) {
    const v = ctx.c.contact;
    return `${pageHero(ctx, v.heading)}
    <section class="contact">
      <figure class="arch mat arch--contact">${img(ctx, "StefLazCouch.webp", v.photoAlt, { w: 1000, h: 1331 })}</figure>
      <div class="contact__cards">
        ${v.sections
          .map(
            (s, i) => `<article class="ticket card">
          <h2 class="ticket__title">${icon(i === 0 ? "mail" : "camera")}${esc(s.title)}</h2>
          ${s.paragraphs.map((p) => `<p>${p}</p>`).join("")}
          ${s.pending ? `<p class="pending" role="status">${icon("clock")}<span>${esc(s.pending)}</span></p>` : ""}
        </article>`
          )
          .join("\n        ")}
      </div>
    </section>`;
  },

  gifts(ctx) {
    const v = ctx.c.gifts;
    return `${pageHero(ctx, v.heading)}
    <section class="gift">
      <div class="gift__card card">
        ${sunburst("gift__fan")}
        ${v.paragraphs.map((p) => `<p>${p}</p>`).join("")}
        ${ornament("gift__orn")}
        <p class="gift__sign">${esc(ctx.c.brand)}</p>
      </div>
    </section>`;
  },

  sightseeing(ctx) {
    const s = ctx.c.sightseeing;
    return `${pageHero(ctx, s.heading)}
    <section class="lede"><p>${s.intro}</p></section>
    <section class="sights">
      ${s.attractions
        .map(
          (a, i) => `<article class="sight mat${i === 0 ? " sight--feature" : ""}">
        <div class="sight__img">${img(ctx, a.img.replace(/\.(jpe?g|png)$/, ".webp"), a.alt)}</div>
        <div class="sight__body">
          <h2 class="sight__title">${a.href ? `<a href="${attr(a.href)}" ${ext}>${esc(a.title)}${icon("external")}</a>` : esc(a.title)}</h2>
          <p>${a.text}</p>
        </div>
      </article>`
        )
        .join("\n      ")}
    </section>
    <section class="trip" aria-label="${attr(s.tripLabel)}">
      <p>${s.tripText}</p>
      <a class="trip__logo" href="${attr(s.tripHref)}" ${ext}><img src="${rel(ctx.here, "assets/img/tripadvisor-logo.svg")}" alt="Tripadvisor" width="160" height="34" loading="lazy"></a>
    </section>
    <section class="walks">
      <h2 class="walks__title">${esc(s.walkTitle)}</h2>
      <div class="walks__grid">
        ${s.routes
          .map(
            (r) => `<article class="walk">
          <a class="walk__map" href="${attr(r.href)}" ${ext} aria-label="${attr(r.aria)}">
            <iframe src="${attr(r.embed)}" title="${attr(r.title)}" loading="lazy" tabindex="-1" aria-hidden="true" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </a>
          <div class="walk__body">
            <p class="walk__time">${icon("walk")}<span>${esc(r.duration)}</span></p>
            <h3 class="walk__title">${esc(r.title)}</h3>
            <p>${r.text}</p>
            <a class="btn btn--ghost" href="${attr(r.href)}" ${ext}>${icon("pin")}<span>${esc(r.open)}</span></a>
          </div>
        </article>`
          )
          .join("\n        ")}
      </div>
    </section>`;
  },

  hotels(ctx) {
    const h = ctx.c.hotels;
    return `${pageHero(ctx, h.heading)}
    <section class="lede"><p>${h.intro}</p></section>
    <section class="hotel-map">
      <h2 class="hotel-map__title">${esc(h.mapTitle)}</h2>
      <a class="hotel-map__link mat" href="${attr(h.mapHref)}" ${ext} aria-label="${attr(h.mapAria)}">
        ${img(ctx, "hotels-map.webp", h.mapAlt, { w: 1088, h: 768 })}
        <span class="btn btn--rose hotel-map__btn">${icon("pin")}<span>${esc(h.mapOpen)}</span></span>
      </a>
    </section>
    <section class="sights sights--hotels">
      ${h.list
        .map(
          (o) => `<article class="sight mat">
        <a class="sight__img" href="${attr(o.href)}" ${ext} tabindex="-1" aria-hidden="true">${img(ctx, o.img.replace(/\.(jpe?g|png)$/, ".webp"), o.alt)}</a>
        <div class="sight__body">
          <h2 class="sight__title"><a href="${attr(o.href)}" ${ext}>${esc(o.name)}${icon("external")}</a></h2>
        </div>
      </article>`
        )
        .join("\n      ")}
    </section>`;
  },

  "photo-credits"(ctx) {
    const v = ctx.c.credits;
    return `${pageHero(ctx, v.heading)}
    <section class="credits prose">
      <p>${v.intro}</p>
      <ul>${v.items.map((i) => `<li>${i.replace(/<a /g, `<a ${ext} `)}</li>`).join("")}</ul>
    </section>`;
  },
};

// ---------- Build ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets/img"), { recursive: true });
cpSync(join(ROOT, "src/images"), join(OUT, "assets/img"), { recursive: true });
for (const f of ["styles.css", "main.js", "favicon.svg"]) cpSync(join(ROOT, "src", f), join(OUT, "assets", f));
writeFileSync(join(OUT, ".nojekyll"), "");
if (existsSync(join(ROOT, "src/static"))) cpSync(join(ROOT, "src/static"), OUT, { recursive: true });

let count = 0;
for (const lang of LANGS) {
  const c = content[lang];
  for (const p of PAGES) {
    const here = pathFor(lang, p);
    const title = c.pageTitles[p] || c.title;
    const ctx = { lang, page: p, here, c, title };
    const html = page(ctx, render[p](ctx));
    const dir = join(OUT, here);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    count++;
  }
}
// 404 page falls back to the English home
writeFileSync(join(OUT, "404.html"), readFileSync(join(OUT, "index.html"), "utf8").replaceAll('href="./', 'href="/').replaceAll('src="./', 'src="/'));
console.log(`Built ${count} pages → dist/`);
