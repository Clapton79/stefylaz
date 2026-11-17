// Authored SVG artwork: travel-poster clouds, the boat's wake and foam, stars,
// Art Deco ornaments and a single-stroke icon set.
// Colours come from CSS classes so the scene can move from sunset to night.

const r1 = (n) => Math.round(n * 10) / 10;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- The boat on the water ----------
// Coordinates follow the boat cut-out (1847 × 530). Its waterline runs from the
// stern at the left (y≈425) down to the bow on the right (y≈523).
export function wakeSVG() {
  return `<svg class="wake" viewBox="0 0 1847 530" preserveAspectRatio="none" focusable="false" aria-hidden="true">
  <defs><filter id="wake-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
  <path class="wk-shadow" filter="url(#wake-blur)" d="M30 430L1200 528L1820 528L1820 560L1200 566L30 470Z"/>
  <path class="wk-wedge" filter="url(#wake-blur)" d="M30 424L-820 360L-860 420L-780 560L60 462Z"/>
  <ellipse class="wk-churn" filter="url(#wake-blur)" cx="-60" cy="436" rx="190" ry="20"/>
</svg>`;
}
export function foamSVG() {
  return `<svg class="foam" viewBox="0 0 1847 530" preserveAspectRatio="none" focusable="false" aria-hidden="true">
  <path class="fm-bow" d="M1660 527Q1780 504 1872 518Q1806 540 1660 536Z"/>
  <g class="fm-spray"><circle cx="1874" cy="508" r="5"/><circle cx="1892" cy="520" r="3.5"/><circle cx="1860" cy="498" r="3"/></g>
</svg>`;
}

// ---------- Stars ----------
export function starsSVG(n = 90, w = 1600, h = 700) {
  const rand = rng(n * 7 + w);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r1(rand() * w), y = r1(rand() * h), r = r1(0.6 + rand() * 1.5);
    s += `<circle cx="${x}" cy="${y}" r="${r}" style="--i:${i % 9}"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">${s}</svg>`;
}

// ---------- Ornaments ----------
export function ornament(cls = "") {
  return `<svg class="orn ${cls}" viewBox="0 0 240 24" aria-hidden="true" focusable="false"><path d="M0 12H92M148 12H240M100 12L120 2L140 12L120 22Z M110 12L120 7L130 12L120 17Z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="84" cy="12" r="2" fill="currentColor"/><circle cx="156" cy="12" r="2" fill="currentColor"/></svg>`;
}
export function sunburst(cls = "") {
  let rays = "";
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    rays += `M${r1(60 + Math.cos(a) * 14)} ${r1(60 + Math.sin(a) * 14)}L${r1(60 + Math.cos(a) * 58)} ${r1(60 + Math.sin(a) * 58)}`;
  }
  return `<svg class="fan ${cls}" viewBox="0 0 120 62" aria-hidden="true" focusable="false"><path d="${rays}" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M50 60A10 10 0 0 1 70 60" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M2 60A58 58 0 0 1 118 60" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`;
}

// ---------- Icons (24px grid, 1.6 stroke) ----------
const ICONS = {
  down: `<path d="M12 4v15M6 13l6 6 6-6"/>`,
  chevron: `<path d="M7 10l5 5 5-5"/>`,
  arrow: `<path d="M4 12h15M13 6l6 6-6 6"/>`,
  external: `<path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`,
  pin: `<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>`,
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 7l8 6 8-6"/>`,
  leaf: `<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>`,
  camera: `<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13" r="3.4"/>`,
  walk: `<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2.5-6.5L15 17v4M12.5 14.5L13.5 9 9 11v3M13.5 9l2.5 3 2.5 1"/>`,
  boat: `<path d="M3 15h18l-2.5 4.5h-13z"/><path d="M6 15v-4h12v4M9 11V8h6v3"/>`,
};
export function icon(name) {
  return `<svg class="i i-${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}
