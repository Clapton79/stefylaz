// Stef & Laz — interactions. Plain JS, no dependencies.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Bar: solid once you leave the sky ---------- */
  const bar = document.querySelector("[data-bar]");
  const hero = document.querySelector("[data-hero]");

  /* ---------- Deck menu ---------- */
  const toggle = document.querySelector("[data-menu-toggle]");
  const deck = document.querySelector("[data-deck]");
  if (toggle && deck) {
    deck.querySelectorAll(".deck__fan, .deck__brand, .deck__nav a, .langs--deck").forEach((el, i) => el.style.setProperty("--n", i));
    const open = () => {
      deck.hidden = false;
      requestAnimationFrame(() => deck.classList.add("is-open"));
      toggle.setAttribute("aria-expanded", "true");
      root.classList.add("menu-open");
      document.body.style.overflow = "hidden";
      (deck.querySelector("[aria-current]") || deck.querySelector("a"))?.focus({ preventScroll: true });
    };
    const close = (focus = true) => {
      deck.classList.remove("is-open");
      deck.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      root.classList.remove("menu-open");
      document.body.style.overflow = "";
      if (focus) toggle.focus({ preventScroll: true });
    };
    // Desktop: the button lets the little boat tow the links into the bar (remembered across pages)
    const desktop = window.matchMedia("(min-width: 1200px)");
    const towNav = document.getElementById("tow-nav");
    const store = (v) => { try { sessionStorage.setItem("stefylaz-nav", v ? "1" : "0"); } catch (e) {} };
    const setTow = (on) => {
      bar.classList.toggle("nav-open", on);
      towNav?.toggleAttribute("inert", !on);
      if (desktop.matches) toggle.setAttribute("aria-expanded", String(on));
      store(on);
    };
    const syncMode = () => {
      toggle.setAttribute("aria-controls", desktop.matches ? "tow-nav" : "deck");
      toggle.setAttribute("aria-expanded", String(desktop.matches ? bar.classList.contains("nav-open") : !deck.hidden));
    };
    if (root.classList.contains("nav-init")) {
      setTow(true);
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("nav-init")));
    } else {
      towNav?.setAttribute("inert", "");
    }
    syncMode();
    desktop.addEventListener("change", syncMode);

    toggle.addEventListener("click", () => {
      if (desktop.matches) return setTow(!bar.classList.contains("nav-open"));
      deck.hidden ? open() : close();
    });
    document.addEventListener("keydown", (e) => {
      if (deck.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        // keep focus inside the bar toggle + deck
        const items = [toggle, ...deck.querySelectorAll("a")];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    deck.addEventListener("click", (e) => { if (e.target.closest("a")) close(false); });
    desktop.addEventListener("change", (m) => m.matches && !deck.hidden && close(false));
  }

  /* ---------- Schedule: the boat sails down the evening ---------- */
  const voyage = document.querySelector("[data-voyage]");
  const rail = voyage?.querySelector(".voyage__rail");
  const stops = voyage ? [...voyage.querySelectorAll("[data-stop]")] : [];

  /* ---------- Language picker (the folded language list) ---------- */
  const pick = document.querySelector("[data-lang-pick]");
  if (pick) {
    const btn = pick.querySelector("button");
    const list = pick.querySelector("ul");
    const set = (open) => { list.hidden = !open; btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); set(list.hidden); if (!list.hidden) list.querySelector("a")?.focus({ preventScroll: true }); });
    document.addEventListener("click", (e) => { if (!pick.contains(e.target)) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !list.hidden) { set(false); btn.focus(); } });
  }

  /* ---------- The poster scene: layers move with scroll ---------- */
  const scene = hero?.querySelector("[data-scene]");
  const isHome = hero?.matches(".hero");

  /* ---------- Easter egg: tap the bride and groom on the boat ---------- */
  const couple = document.querySelector("[data-horn]");
  const canvas = document.querySelector("[data-fireworks]");
  if (couple && canvas && scene) {
    const boat = couple.closest(".boat");

    // A two-tone ship's horn, synthesised: no sound file to download.
    let audio, lastToot = 0;
    const toot = () => {
      const now = performance.now();
      if (now - lastToot < 1600) return;
      lastToot = now;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === "suspended") audio.resume();
        const t0 = audio.currentTime + 0.02;
        const out = audio.createGain();
        out.gain.value = 0.2;
        const tone = audio.createBiquadFilter();
        tone.type = "lowpass";
        tone.frequency.value = 850;
        tone.connect(out);
        out.connect(audio.destination);
        [[0, 0.5], [0.72, 0.95]].forEach(([start, len]) => {
          const env = audio.createGain();
          env.gain.setValueAtTime(0.0001, t0 + start);
          env.gain.exponentialRampToValueAtTime(1, t0 + start + 0.07);
          env.gain.setValueAtTime(1, t0 + start + len - 0.1);
          env.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len + 0.3);
          env.connect(tone);
          // A2 + C#3 (the classic horn third) and a soft octave on top
          [[110, "sawtooth", 0.5], [138.6, "sawtooth", 0.42], [220, "triangle", 0.22]].forEach(([f, type, vol]) => {
            const osc = audio.createOscillator();
            const v = audio.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f * 0.96, t0 + start);
            osc.frequency.exponentialRampToValueAtTime(f, t0 + start + 0.14);
            v.gain.value = vol;
            osc.connect(v);
            v.connect(env);
            osc.start(t0 + start);
            osc.stop(t0 + start + len + 0.35);
          });
        });
      } catch (e) { /* no audio: the fireworks still go off */ }
      boat.classList.remove("is-tooting");
      void boat.offsetWidth;
      boat.classList.add("is-tooting");
    };

    // Fireworks over the Parliament, in the invitation's colours.
    const ctx = canvas.getContext("2d");
    const COLORS = ["#ffd98a", "#fff4dc", "#ff9478", "#ffc35c", "#ffb3c1", "#8fe3d2", "#f2d38f"];
    let W = 0, H = 0, raf = 0, rockets = [], sparks = [], endTimer = 0;
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const rand = (a, b) => a + Math.random() * (b - a);
    const burst = (x, y, color, heart) => {
      const scale = Math.min(W, 1100) / 1000;
      const n = heart ? 90 : Math.round(rand(55, 85));
      for (let i = 0; i < n; i++) {
        let vx, vy;
        if (heart) {
          const t = (i / n) * Math.PI * 2;
          vx = 16 * Math.sin(t) ** 3 * 0.24;
          vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.24;
        } else {
          const a = Math.random() * Math.PI * 2, s = rand(1.2, 4.6);
          vx = Math.cos(a) * s;
          vy = Math.sin(a) * s;
        }
        sparks.push({ x, y, vx: vx * scale, vy: vy * scale, life: 1, decay: rand(0.010, 0.018), color: heart ? "#ff9d8f" : (Math.random() < 0.25 ? "#fff4dc" : color), r: rand(1.3, 2.3) });
      }
    };
    const launch = (delay, heart = false) => setTimeout(() => {
      rockets.push({ x: W * rand(0.2, 0.8), y: H * 0.72, vy: -H * rand(0.013, 0.016), top: H * (heart ? 0.24 : rand(0.12, 0.38)), color: COLORS[(Math.random() * COLORS.length) | 0], heart });
      if (!raf) raf = requestAnimationFrame(tick);
    }, delay);
    const tick = () => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      rockets = rockets.filter((r) => {
        r.y += r.vy;
        r.vy *= 0.985;
        ctx.fillStyle = "#fff1cf";
        ctx.beginPath(); ctx.arc(r.x, r.y, 1.8, 0, Math.PI * 2); ctx.fill();
        if (r.y <= r.top || r.vy > -1) { burst(r.x, r.y, r.color, r.heart); return false; }
        return true;
      });
      sparks = sparks.filter((p) => {
        p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.045;
        p.x += p.vx; p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) return false;
        ctx.globalAlpha = Math.max(0, p.life) * (Math.random() < 0.15 ? 0.4 : 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;
      if (rockets.length || sparks.length) raf = requestAnimationFrame(tick);
      else { raf = 0; ctx.clearRect(0, 0, W, H); }
    };
    const show = () => {
      size();
      scene.classList.add("is-show");
      root.classList.add("fireworks-on");
      [250, 650, 1000, 1450, 1800, 2250, 2600, 3000].forEach((d) => launch(d));
      launch(3600, true);
      clearTimeout(endTimer);
      endTimer = setTimeout(() => { scene.classList.remove("is-show"); root.classList.remove("fireworks-on"); }, 6200);
    };

    couple.addEventListener("click", () => {
      toot();
      if (!reduce) show();
    });
  }

  /* ---------- Scroll loop ---------- */
  let ticking = false;
  function frame() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    if (bar) bar.classList.toggle("is-solid", y > 24);

    if (hero && !reduce) {
      const h = hero.offsetHeight;
      if (y <= h) {
        hero.style.setProperty("--sy", y.toFixed(1));
        if (isHome && scene) {
          const t = clamp(y / h);
          scene.style.setProperty("--t", (t * 0.8).toFixed(3));
          hero.style.setProperty("--p", t.toFixed(3));
        }
      }
    }

    if (voyage && rail) {
      const r = rail.getBoundingClientRect();
      const mid = vh * 0.55;
      const p = clamp((mid - r.top) / r.height);
      voyage.style.setProperty("--boat-y", `${(p * r.height).toFixed(1)}px`);
      let active = -1;
      stops.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) active = i; });
      stops.forEach((s, i) => {
        s.classList.toggle("is-active", i === active);
        s.classList.toggle("is-past", i < active);
      });
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();

  /* ---------- Reveal on scroll (only when JS runs; content is visible otherwise) ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(
      ".pass, .arch, .evening__title, .tile, .menu-card, .ticket, .gift__card, .sight, .trip, .walk, .hotel-map__link, .porthole, .prose, .lede, .walks__title, .hotel-map__title"
    );
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach((el) => {
      const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains(el.classList[0])) : [];
      const idx = Math.max(0, sib.indexOf(el));
      el.style.setProperty("--d", `${Math.min(idx, 5) * 70}ms`);
      // already on screen at load: show immediately
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add("reveal");
      io.observe(el);
    });
  }

})();
