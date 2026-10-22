/* =========================================================
   Groomsmen invite: Bristol to Xàtiva
   Gate, parallax hero, score bug, sticker packs, half-time
   oranges, vidiprinter, hold-to-shoot penalty, sign the contract.
   ========================================================= */

// SHA-256 of the passcode. Default passcode is "dayone". Change it before sharing:
//   terminal:  echo -n 'yourpasscode' | shasum -a 256
//   browser:   getHash('yourpasscode')   (in the dev-tools console)
const TARGET_HASH = "6979ce2825cb3f440f987bbc487d62087c333abb99b56062c561ca557392d960";
const SESSION_KEY = "inner-circle-unlocked";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* not supported */ } };
const later = (fn, ms) => setTimeout(fn, reduceMotion ? 0 : ms);
const scrollTo = (el, block = "nearest") => el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block });

/* ---------- Hashing ---------- */
async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
window.getHash = async function getHash(pw) {
  const hash = await sha256(String(pw).trim().toLowerCase());
  console.log(`TARGET_HASH for "${pw}":\n${hash}`);
  return hash;
};

/* ---------- Session storage (guarded) ---------- */
function isUnlocked() { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; } }
function rememberUnlock() { try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* private mode */ } }

/* ---------- Gate ---------- */
const gate = $("#gate");
const form = $("#gate-form");
const input = $("#passcode");
const errorEl = $("#gate-error");
const site = $("#site");

function unlock({ instant = false } = {}) {
  document.body.classList.remove("is-locked");
  site.setAttribute("aria-hidden", "false");
  if (instant) { gate.remove(); return; }
  gate.classList.add("is-leaving");
  gate.addEventListener("transitionend", () => gate.remove(), { once: true });
  setTimeout(() => gate.isConnected && gate.remove(), 1200);
}

function rejectAttempt(message) {
  errorEl.textContent = message;
  input.classList.add("is-invalid");
  form.classList.remove("is-shaking");
  void form.offsetWidth;
  form.classList.add("is-shaking");
  input.select();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const attempt = input.value.trim().toLowerCase();
  if (!attempt) { rejectAttempt("Type the passcode first."); return; }
  if (!window.crypto || !crypto.subtle) { rejectAttempt("This browser can’t check the passcode. Open the link over https."); return; }
  if ((await sha256(attempt)) === TARGET_HASH) {
    errorEl.textContent = "";
    rememberUnlock();
    unlock();
  } else {
    rejectAttempt("Not quite. Think harder about that night.");
  }
});
input.addEventListener("input", () => { input.classList.remove("is-invalid"); errorEl.textContent = ""; });

if (isUnlocked()) unlock({ instant: true }); else input.focus();

/* ---------- Score bug: balls fill in, clock follows the furthest chapter ---------- */
const topbar = $("#topbar");
const hero = $(".hero");
const clock = $("#clock");
let fullTime = false;
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    topbar.classList.toggle("is-shown", !entry.isIntersecting);
  }, { threshold: 0.15 }).observe(hero);

  const links = $$("[data-chapter]");
  const ids = links.map((a) => a.dataset.chapter);
  let reached = -1;
  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const current = ids.indexOf(entry.target.id);
      reached = Math.max(reached, current);
      links.forEach((a, i) => {
        a.classList.toggle("is-reached", i <= reached);
        a.classList.toggle("is-current", i === current);
        if (i === current) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      if (!fullTime) clock.textContent = $("span", links[reached]).textContent;
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  ids.forEach((id) => { const el = document.getElementById(id); if (el) chapterObserver.observe(el); });
}

/* ---------- Hero parallax (pointer, tilt and scroll) ---------- */
const layers = $$(".scene [data-depth]").map((g) => ({ g, d: parseFloat(g.dataset.depth) }));
if (!reduceMotion && layers.length) {
  const target = { x: 0, y: 0 };
  const now = { x: 0, y: 0 };
  let running = false;

  const apply = () => {
    const s = Math.min(window.scrollY, window.innerHeight);
    layers.forEach(({ g, d }) => {
      const x = -now.x * d * 46;
      const y = -now.y * d * 18 + s * (1 - d) * 0.35;
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    });
  };
  const loop = () => {
    now.x += (target.x - now.x) * 0.07;
    now.y += (target.y - now.y) * 0.07;
    apply();
    if (Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001) {
      requestAnimationFrame(loop);
    } else { running = false; }
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = hero.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width - 0.5;
    target.y = (e.clientY - r.top) / r.height - 0.5;
    kick();
  });
  hero.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; kick(); });

  // Phone tilt where the browser allows it without a permission prompt (Android)
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== "function") {
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null) return;
      target.x = Math.max(-0.5, Math.min(0.5, e.gamma / 50));
      target.y = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 80));
      kick();
    });
  }
  window.addEventListener("scroll", () => { if (window.scrollY < window.innerHeight * 1.2) kick(); }, { passive: true });
}

/* ---------- Confetti ---------- */
const PALETTE = ["#1d3a9e", "#3f63d6", "#f28c28", "#ffb35c", "#f6f0e1", "#ffffff"];
const EMOJI = typeof window.confetti?.shapeFromText === "function"
  ? [confetti.shapeFromText({ text: "⚽", scalar: 2 }), confetti.shapeFromText({ text: "🍊", scalar: 2 })]
  : null;

function puff(originY = 0.6, colors = ["#f28c28", "#f6f0e1", "#3f63d6"]) {
  if (typeof window.confetti !== "function") return;
  confetti({ particleCount: 70, spread: 75, startVelocity: 38, origin: { y: originY }, colors, disableForReducedMotion: true });
}

function celebrate() {
  if (typeof window.confetti !== "function") return;
  if (reduceMotion) {
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors: PALETTE, disableForReducedMotion: false });
    return;
  }
  confetti({ particleCount: 160, spread: 100, startVelocity: 55, origin: { y: 0.7 }, colors: PALETTE });
  if (EMOJI) confetti({ particleCount: 30, spread: 110, startVelocity: 45, origin: { y: 0.7 }, shapes: EMOJI, scalar: 2, flat: true });

  const end = Date.now() + 4000;
  (function cannons() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: PALETTE });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: PALETTE });
    if (Date.now() < end) requestAnimationFrame(cannons);
  })();

  let bursts = 0;
  const timer = setInterval(() => {
    confetti({
      particleCount: 70, spread: 360, startVelocity: 30, ticks: 90, gravity: 0.8,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.3 },
      colors: PALETTE,
    });
    if (++bursts >= 6) clearInterval(timer);
  }, 550);
}

/* ---------- 12′ Bristol: sticker packs ---------- */
const ICONS = {
  bridge: `<svg viewBox="0 0 100 70" aria-hidden="true"><path fill="#1d3a9e" d="M0,40 L14,38 L20,48 L22,70 L0,70Z M100,40 L86,38 L80,48 L78,70 L100,70Z"/><g fill="none" stroke="#14245e" stroke-linecap="round"><path d="M16,40 H84" stroke-width="3"/><path d="M22,40 V18 M78,40 V18" stroke-width="5"/><path d="M22,20 Q50,50 78,20" stroke-width="2"/><path d="M32,29 V40 M41,34 V40 M50,35.5 V40 M59,34 V40 M68,29 V40" stroke-width="1"/></g><circle cx="50" cy="16" r="6" fill="#f28c28"/></svg>`,
  balloon: `<svg viewBox="0 0 100 130" aria-hidden="true"><use href="#balloon" width="100" height="130"/></svg>`,
  gull: `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M78,50 L96,44 L90,58Z" fill="#9aa3b5"/><ellipse cx="54" cy="52" rx="28" ry="14" fill="#fbfaf6" stroke="#14245e" stroke-width="1.5"/><circle cx="28" cy="40" r="10" fill="#fbfaf6" stroke="#14245e" stroke-width="1.5"/><path d="M19,40 L6,44 L19,45Z" fill="#f2b632"/><rect x="0" y="42" width="12" height="4" rx="1" fill="#f7d36b" transform="rotate(-18 6 44)"/><circle cx="26" cy="38" r="1.6" fill="#14245e"/><path d="M42,50 Q62,36 86,46 Q66,56 46,58Z" fill="#9aa3b5"/><path d="M48,66 L46,76 M58,66 L58,76" stroke="#e08a3a" stroke-width="2"/></svg>`,
};
const playerArt = (num) =>
  `<svg class="sticker-art" viewBox="0 0 100 120" aria-hidden="true"><use href="#player" width="100" height="120"/><text x="50" y="108" text-anchor="middle">${num}</text></svg>`;
const ballBack = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ball" width="24" height="24"/></svg>`;

const packsEl = $("#packs");
const packFeedback = $("#pack-feedback");
const stuckEl = $("#stuck");
const albumDone = $("#album-done");
const slots = $$("#album .slot");
let stuck = 0;
let swaps = 0;

// Shuffle so nobody learns the order
const packItems = [...packsEl.children];
for (let i = packItems.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [packItems[i], packItems[j]] = [packItems[j], packItems[i]];
}
packItems.forEach((li) => packsEl.appendChild(li));

$$(".pack", packsEl).forEach((pack, i) => {
  const { role, name, tag, number, icon } = pack.dataset;
  const isLad = role === "lad";
  pack.classList.add(isLad ? "is-lad" : "is-got");
  pack.setAttribute("aria-label", `Open pack ${i + 1}`);
  const front = isLad
    ? `${playerArt(number)}<span class="sticker-band"><strong></strong><em></em></span>`
    : `<span class="got-stamp">Got</span>${ICONS[icon] || ""}<strong></strong>`;
  pack.innerHTML = `<span class="pack-inner"><span class="face face-back">${ballBack}<span>Open</span></span><span class="face face-front">${front}</span></span>`;
  $(".face-front strong", pack).textContent = name;
  if (isLad) $(".face-front em", pack).textContent = tag;

  pack.addEventListener("click", () => {
    if (pack.classList.contains("is-open")) return;
    pack.classList.add("is-open");
    pack.setAttribute("aria-disabled", "true");

    if (!isLad) {
      pack.setAttribute("aria-label", `${name}. Got it already.`);
      packFeedback.textContent = tag;
      swaps += 1;
      buzz(15);
      return;
    }

    pack.setAttribute("aria-label", `${name}, ${tag}. Shiny.`);
    buzz([20, 40, 20]);
    stuck += 1;
    stuckEl.textContent = String(stuck);
    const slot = slots.find((s) => s.dataset.for === name) || slots.find((s) => !s.classList.contains("is-stuck"));
    later(() => {
      slot.classList.add("is-stuck");
      $(".slot-sticker", slot).innerHTML = playerArt(number);
      $(".slot-copy", slot).hidden = false;
    }, 650);

    if (stuck === 3) {
      packFeedback.textContent = swaps === 0
        ? "Three packs, three shinies. Never happened in the history of stickers."
        : "Album complete. Got, got, need, done.";
      later(() => { albumDone.hidden = false; puff(0.55); }, 900);
    } else {
      packFeedback.textContent = `${name}. Shiny. Need ${3 - stuck} more.`;
    }
  });
});

/* ---------- 45′ Half-time: oranges ---------- */
const SLICE = `<svg viewBox="0 0 100 56" aria-hidden="true">
  <g class="flesh">
    <path d="M8,54 A42,42 0 0 1 92,54 Z" fill="#f7a335"/>
    <path d="M50,54 L14,32 M50,54 L29,17 M50,54 L50,12 M50,54 L71,17 M50,54 L86,32" stroke="#ffd59a" stroke-width="1.6" fill="none"/>
    <path d="M8,53.5 H92" stroke="#fff3df" stroke-width="3"/>
  </g>
  <path class="rind" d="M5,54 A45,45 0 0 1 95,54" fill="none" stroke="#e8731c" stroke-width="6" stroke-linecap="round"/>
</svg>`;
const SLICE_LINES = ["Good slice.", "Pith and all.", "Nearly there.", "Plate cleared."];
const slices = $$("#plate .slice");
const talk = $$("#team-talk li");
const sliceFeedback = $("#slice-feedback");
const halftimeNext = $("#halftime-next");
let eaten = 0;

slices.forEach((slice) => {
  slice.innerHTML = SLICE;
  slice.addEventListener("click", () => {
    if (slice.classList.contains("is-eaten")) return;
    slice.classList.add("is-eaten");
    slice.setAttribute("aria-disabled", "true");
    slice.setAttribute("aria-label", "Eaten");
    const line = talk[eaten];
    if (line) { line.hidden = false; sliceFeedback.textContent = line.textContent; }
    eaten += 1;
    buzz(12);
    if (eaten === slices.length) {
      later(() => {
        sliceFeedback.textContent = SLICE_LINES[3];
        halftimeNext.hidden = false;
        puff(0.6, ["#f28c28", "#ffb35c", "#f7a335"]);
      }, 500);
    } else {
      const next = slices.find((s) => !s.classList.contains("is-eaten"));
      next && next.focus({ preventScroll: true });
    }
  });
});

/* ---------- 67′ Xàtiva: vidiprinter ---------- */
const prints = $$(".print");
const vidiNext = $("#vidi-next");
const vidiLive = document.createElement("p");
vidiLive.className = "sr-only";
vidiLive.setAttribute("role", "status");
$(".vidi").appendChild(vidiLive);
let printed = 0;

prints.forEach((btn) => {
  btn.addEventListener("click", () => {
    const dd = btn.closest("dd");
    const out = $(".vidi-text", dd);
    const note = $(".vidi-note", dd);
    const text = out.dataset.text;
    dd.setAttribute("tabindex", "-1");
    btn.remove();
    dd.focus({ preventScroll: true });
    out.setAttribute("aria-hidden", "true");
    vidiLive.textContent = `${text}. ${note ? note.textContent : ""}`;
    buzz(8);

    const finish = () => {
      out.textContent = text;
      out.classList.remove("is-typing");
      if (note) note.hidden = false;
      printed += 1;
      if (printed === prints.length) later(() => { vidiNext.hidden = false; }, 300);
    };
    if (reduceMotion) { finish(); return; }
    out.classList.add("is-typing");
    let i = 0;
    const tick = setInterval(() => {
      i += 1;
      out.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(tick); setTimeout(finish, 350); }
    }, 38);
  });
});

/* ---------- 90′ Penalty: hold to shoot ---------- */
const goal = $("#goal");
const strike = $("#strike");
const ring = $(".strike-ring circle", strike);
const strikeHint = $("#strike-hint");
const spot = $("#spot");
const contract = $("#contract");
const HOLD_MS = 900;
let power = 0;
let holding = false;
let struck = false;
let holdStart = 0;

const setPower = (p) => { power = p; ring.style.strokeDashoffset = String(1 - p); };

function holdStep(t) {
  if (!holding || struck) return;
  const p = Math.min((t - holdStart) / HOLD_MS, 1);
  setPower(p);
  if (p >= 1) { shoot(); return; }
  requestAnimationFrame(holdStep);
}

function releaseHold() {
  if (!holding || struck) return;
  holding = false;
  goal.classList.remove("is-pressing");
  if (power > 0.05) strikeHint.textContent = "More power. Keep holding.";
  const from = power;
  const t0 = performance.now();
  (function drain(t) {
    if (holding || struck) return;
    const p = Math.max(from - ((t - t0) / 350) * from, 0);
    setPower(p);
    if (p > 0) requestAnimationFrame(drain);
  })(t0);
}

strike.addEventListener("pointerdown", (e) => {
  if (struck || e.button > 0) return;
  e.preventDefault();
  try { strike.setPointerCapture(e.pointerId); } catch { /* fine */ }
  holding = true;
  goal.classList.add("is-pressing");
  holdStart = performance.now() - power * HOLD_MS;
  buzz(10);
  requestAnimationFrame(holdStep);
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => strike.addEventListener(type, releaseHold));
strike.addEventListener("contextmenu", (e) => e.preventDefault());
// Keyboard (Enter / Space) shoots straight away
strike.addEventListener("click", (e) => { if (e.detail === 0) shoot(); });

function shoot() {
  if (struck) return;
  struck = true;
  holding = false;
  setPower(1);
  goal.classList.remove("is-pressing");
  goal.classList.add("is-struck");
  strike.setAttribute("aria-disabled", "true");
  strikeHint.textContent = "Top bins.";
  buzz([30, 30, 60]);

  later(() => { goal.classList.add("is-goal"); puff(0.45); }, 520);

  const showContract = () => {
    spot.hidden = true;
    contract.hidden = false;
    sizeCanvas();
    $("#contract-title").focus({ preventScroll: true });
    scrollTo(contract, "start");
  };
  if (reduceMotion) { showContract(); return; }
  setTimeout(() => spot.classList.add("is-gone"), 1900);
  setTimeout(showContract, 2400);
}

/* ---------- Sign the contract ---------- */
const accept = $("#accept");
const canvas = $("#sign-canvas");
const ctx = canvas.getContext("2d");
const nameInput = $("#sign-name");
const clearBtn = $("#sign-clear");
const signAnswer = $("#sign-answer");
const noChoice = $("#no-choice");
const noChoiceReply = $("#no-choice-reply");
const yellow = $("#yellow");
const stampSlot = $("#stamp-slot");
const confirmation = $("#confirmation");
const INK = "#14245e";
const HAND_FONT = `"Homemade Apple", "Bradley Hand", "Segoe Script", cursive`;
let handInk = false;
let drawing = false;
let last = null;

function sizeCanvas() {
  const r = canvas.getBoundingClientRect();
  if (!r.width) return;
  const keep = handInk ? canvas.toDataURL() : null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  if (keep) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, r.width, r.height);
    img.src = keep;
  } else if (nameInput.value.trim()) {
    writeTypedName();
  }
}
window.addEventListener("resize", () => { if (!contract.hidden) sizeCanvas(); });

function clearPad() {
  const r = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
}

function writeTypedName() {
  clearPad();
  const name = nameInput.value.trim();
  if (!name) return;
  const r = canvas.getBoundingClientRect();
  let size = 32;
  ctx.font = `400 ${size}px ${HAND_FONT}`;
  while (ctx.measureText(name).width > r.width - 48 && size > 14) {
    size -= 2;
    ctx.font = `400 ${size}px ${HAND_FONT}`;
  }
  ctx.fillText(name, 24, r.height - 50);
}
// Redraw once the handwriting font arrives
if (document.fonts) document.fonts.load(`32px "Homemade Apple"`).then(() => { if (!handInk && nameInput.value.trim()) writeTypedName(); }).catch(() => {});

function updateSignButton() {
  signAnswer.disabled = !(handInk || nameInput.value.trim());
}

const pos = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
};

canvas.addEventListener("pointerdown", (e) => {
  if (accept.classList.contains("is-signed")) return;
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch { /* fine */ }
  if (!handInk && nameInput.value.trim()) { nameInput.value = ""; clearPad(); }
  drawing = true;
  last = pos(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const p = pos(e);
  const dist = Math.hypot(p.x - last.x, p.y - last.y);
  const speed = dist / Math.max(p.t - last.t, 1);
  ctx.lineWidth = Math.max(1.3, Math.min(3.4, 3.6 - speed * 1.4));
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  if (!handInk) { handInk = true; updateSignButton(); }
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
  canvas.addEventListener(type, () => { drawing = false; })
);

clearBtn.addEventListener("click", () => {
  clearPad();
  handInk = false;
  nameInput.value = "";
  updateSignButton();
});

nameInput.addEventListener("input", () => {
  if (handInk) handInk = false;
  writeTypedName();
  updateSignButton();
});

noChoice.addEventListener("click", () => {
  yellow.hidden = false;
  noChoiceReply.textContent = "You don’t. That’s a booking for dissent. Pen’s on the table.";
  noChoice.hidden = true;
  buzz([15, 60, 15]);
  scrollTo($(".sign-pad"), "center");
});

signAnswer.addEventListener("click", () => {
  if (signAnswer.disabled) return;
  accept.classList.add("is-signed");
  nameInput.disabled = true;
  signAnswer.disabled = true;
  stampSlot.innerHTML = '<div class="stamp"><svg viewBox="0 0 120 120"><use href="#crest"/></svg><span>Registered<small>Xàtiva 2027</small></span></div>';
  fullTime = true;
  clock.textContent = "FT";
  later(() => {
    buzz([40, 30, 80]);
    confirmation.hidden = false;
    celebrate();
  }, 420);
});
