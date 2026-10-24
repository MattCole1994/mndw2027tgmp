/* =========================================================
   Groomsmen invite: Mitch, Brad and Liam
   Gate, parallax beach bar, pints per round, postcards,
   the quiz, the board, pop the cava, sign & souvenir bib.
   ========================================================= */

// SHA-256 of the passcode. Default passcode is "ashtongate".
const TARGET_HASH = "be29d4bafe90de2b44d64e5c71562656fbcb350822b14a29ad01577728e77b0f";
const SESSION_KEY = "lads-only-unlocked";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* not supported */ } };
const later = (fn, ms) => setTimeout(fn, reduceMotion ? 0 : ms);
const scrollTo = (el, block = "nearest") => el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block });

/* ---------- Optional URL personalisation (?lad=mitch) ---------- */
const LADS_MAP = {
  mitch: { name: "Mitch", bib: "01" },
  brad: { name: "Brad", bib: "02" },
  liam: { name: "Liam", bib: "03" }
};
let selectedLad = null;
let selectedBib = "01";

const urlLad = new URLSearchParams(window.location.search).get("lad")?.toLowerCase();
if (urlLad && LADS_MAP[urlLad]) {
  selectedLad = LADS_MAP[urlLad].name;
  selectedBib = LADS_MAP[urlLad].bib;
  const heroTurn = $("#hero-turn");
  if (heroTurn) heroTurn.textContent = `Your turn, ${selectedLad}.`;
}

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
    rejectAttempt("Not that. Think every other Saturday in BS3.");
  }
});
input.addEventListener("input", () => { input.classList.remove("is-invalid"); errorEl.textContent = ""; });

if (isUnlocked()) unlock({ instant: true }); else input.focus();

/* ---------- Top bar: a pint poured for each round reached ---------- */
const topbar = $("#topbar");
const hero = $(".hero");
const roundLinks = $$("[data-round]");

function unlockRoundNav(roundId) {
  const link = $(`[data-round="${roundId}"]`);
  if (link) link.classList.remove("is-locked-round");
}

if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    topbar.classList.toggle("is-shown", !entry.isIntersecting);
  }, { threshold: 0.15 }).observe(hero);

  const ids = roundLinks.map((a) => a.dataset.round);
  let reached = -1;
  const roundObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const current = ids.indexOf(entry.target.id);
      reached = Math.max(reached, current);
      roundLinks.forEach((a, i) => {
        a.classList.toggle("is-poured", i <= reached);
        a.classList.toggle("is-current", i === current);
        if (i === current) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  ids.forEach((id) => { const el = document.getElementById(id); if (el) roundObserver.observe(el); });
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
      const x = -now.x * d * 40;
      const y = -now.y * d * 16 + s * (1 - d) * 0.35;
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
const PALETTE = ["#e8622c", "#f2a03d", "#e9b949", "#1f6b70", "#fbf1dc", "#5b3424"];

function celebrate() {
  if (typeof window.confetti !== "function") return;
  if (reduceMotion) {
    confetti({ particleCount: 70, spread: 90, origin: { y: 0.6 }, colors: PALETTE, disableForReducedMotion: false });
    return;
  }
  confetti({ particleCount: 130, spread: 95, startVelocity: 50, origin: { y: 0.7 }, colors: PALETTE, scalar: 0.9 });
  const end = Date.now() + 2600;
  (function sides() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: PALETTE, scalar: 0.8 });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: PALETTE, scalar: 0.8 });
    if (Date.now() < end) requestAnimationFrame(sides);
  })();
}

/* ---------- Round 1: postcards ---------- */
const cards = $$("#cards .card");
const cardStatus = $("#card-status");
const ladsDone = $("#lads-done");
let turned = 0;

cards.forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains("is-turned")) return;
    card.classList.add("is-turned");
    card.setAttribute("aria-disabled", "true");
    const msg = $(".card-msg", card).textContent;
    const name = $(".card-name", card).textContent;
    const memory = card.parentElement.querySelector(".card-memory");
    card.setAttribute("aria-label", `${name}: ${msg}`);
    cardStatus.textContent = msg;
    later(() => { if (memory) memory.hidden = false; }, 600);
    buzz(12);
    turned += 1;
    if (turned === cards.length) {
      unlockRoundNav("quiz-round");
      later(() => { ladsDone.hidden = false; }, 1100);
    } else {
      const next = cards.find((c) => !c.classList.contains("is-turned"));
      next && next.focus({ preventScroll: true });
    }
  });
});

/* ---------- Round 2: the quiz ---------- */
const PEN = '<svg class="pen" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M10,14 C20,4 62,2 84,6 C98,9 99,22 90,30 C78,38 40,39 20,35 C6,32 2,22 12,13"/></svg>';
const TICK = '<svg class="q-mark" viewBox="0 0 30 30" aria-hidden="true"><path pathLength="1" d="M4,16 L12,24 L27,4"/></svg>';
const CROSS = '<svg class="q-mark" viewBox="0 0 30 30" aria-hidden="true"><path pathLength="1" d="M6,6 L24,24 M24,6 L6,24"/></svg>';
const questions = $$("#quiz .q");
const verdict = $("#verdict");
const verdictText = $("#verdict-text");
const scoreEl = $("#score");
let score = 0;

questions.forEach((q, i) => {
  const answers = $$(".ans", q);
  answers.forEach((btn) => {
    btn.addEventListener("click", () => {
      answers.forEach((b) => (b.disabled = true));
      btn.classList.add("is-chosen");
      btn.insertAdjacentHTML("beforeend", PEN);
      const right = btn.hasAttribute("data-correct");
      if (right) score += 1;
      q.insertAdjacentHTML("beforeend", right ? TICK : CROSS);
      $(".q-reply", q).textContent = btn.dataset.reply || (right ? "Correct." : "Not quite.");
      scoreEl.textContent = `${score} / ${i + 1}`;
      buzz(10);
      q.classList.remove("is-current");
      q.classList.add("is-done");
      const next = questions[i + 1];
      setTimeout(() => {
        if (next) {
          next.classList.add("is-current");
          scrollTo(next);
          $(".ans", next).focus({ preventScroll: true });
        } else {
          unlockRoundNav("board");
          if (score === questions.length) {
            verdictText.textContent = `${score} out of ${questions.length}. Sub-9 hour pace. First pint in Xàtiva is on me.`;
          } else if (score >= 3) {
            verdictText.textContent = `${score} out of ${questions.length}. Solid Zone 2 effort. Fit for duty.`;
          } else {
            verdictText.textContent = `${score} out of ${questions.length}. Shocking splits, you’re on baggage duty — but you’re still in.`;
          }
          verdict.hidden = false;
          scrollTo(verdict);
          $(".next-link", verdict).focus({ preventScroll: true });
        }
      }, reduceMotion ? 0 : 1100);
    });
  });
});

/* ---------- Round 3: wipe the board ---------- */
const wipes = $$(".wipe");
const boardNext = $("#board-next");
let wiped = 0;
wipes.forEach((btn) => {
  btn.addEventListener("click", () => {
    const dd = btn.closest("dd");
    const text = $(".chalk-text", dd);
    dd.classList.add("is-wiped");
    text.removeAttribute("aria-hidden");
    text.setAttribute("tabindex", "-1");
    text.focus({ preventScroll: true });
    buzz(8);
    setTimeout(() => btn.remove(), reduceMotion ? 0 : 750);
    wiped += 1;
    if (wiped === wipes.length) {
      unlockRoundNav("last-call");
      later(() => { boardNext.hidden = false; }, 600);
    }
  });
});

/* ---------- Round 4: hold to pop the cava ---------- */
const pop = $("#pop");
const stage = $("#bottle-stage");
const ring = $(".pop-ring circle");
const popHint = $("#pop-hint");
const bottleWrap = $("#bottle-wrap");
const letter = $("#letter");
const HOLD_MS = 1000;
let progress = 0;
let holding = false;
let popped = false;
let holdStart = 0;

const setProgress = (p) => { progress = p; ring.style.strokeDashoffset = String(1 - p); };

function popSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    const t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * 0.25);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const band = ac.createBiquadFilter();
    band.type = "bandpass"; band.frequency.value = 900; band.Q.value = 0.8;
    const g = ac.createGain(); g.gain.value = 0.5;
    noise.connect(band); band.connect(g); g.connect(ac.destination);
    const o = ac.createOscillator(); const og = ac.createGain();
    o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(og); og.connect(ac.destination);
    noise.start(t); o.start(t); o.stop(t + 0.2);
    setTimeout(() => ac.close(), 800);
  } catch { /* no audio, no problem */ }
}

function spray() {
  if (typeof window.confetti !== "function") return;
  const r = stage.getBoundingClientRect();
  const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: Math.max(0.05, (r.top + r.height * 0.22) / window.innerHeight) };
  confetti({ particleCount: 90, angle: 80, spread: 35, startVelocity: 48, gravity: 1.1, ticks: 140, origin, colors: ["#fbf1dc", "#fff8e6", "#f6e7b8", "#e9b949"], scalar: 0.8, disableForReducedMotion: true });
}

function holdStep(t) {
  if (!holding || popped) return;
  const p = Math.min((t - holdStart) / HOLD_MS, 1);
  setProgress(p);
  if (p >= 1) { popCork(); return; }
  requestAnimationFrame(holdStep);
}

function releaseHold() {
  if (!holding || popped) return;
  holding = false;
  stage.classList.remove("is-pressing");
  if (progress > 0.05) popHint.textContent = "Keep going, it’s nearly out";
  const from = progress;
  const t0 = performance.now();
  (function drain(t) {
    if (holding || popped) return;
    const p = Math.max(from - ((t - t0) / 350) * from, 0);
    setProgress(p);
    if (p > 0) requestAnimationFrame(drain);
  })(t0);
}

pop.addEventListener("pointerdown", (e) => {
  if (popped || e.button > 0) return;
  e.preventDefault();
  try { pop.setPointerCapture(e.pointerId); } catch { /* fine */ }
  holding = true;
  stage.classList.add("is-pressing");
  holdStart = performance.now() - progress * HOLD_MS;
  buzz(10);
  requestAnimationFrame(holdStep);
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => pop.addEventListener(type, releaseHold));
pop.addEventListener("contextmenu", (e) => e.preventDefault());
pop.addEventListener("click", (e) => { if (e.detail === 0) popCork(); });

function popCork() {
  if (popped) return;
  popped = true;
  holding = false;
  setProgress(1);
  stage.classList.remove("is-pressing");
  stage.classList.add("is-popped");
  pop.setAttribute("aria-disabled", "true");
  popHint.textContent = "Salud.";
  popSound();
  spray();
  buzz([20, 40, 60]);

  const showLetter = () => {
    bottleWrap.hidden = true;
    letter.hidden = false;
    sizeCanvas();
    $("#letter-title").focus({ preventScroll: true });
    scrollTo(letter, "start");
  };
  if (reduceMotion) { showLetter(); return; }
  setTimeout(() => bottleWrap.classList.add("is-gone"), 1500);
  setTimeout(showLetter, 2100);
}

/* ---------- Sign, Lad Picker, and Souvenir Generator ---------- */
const accept = $("#accept");
const canvas = $("#sign-canvas");
const ctx = canvas.getContext("2d");
const nameInput = $("#sign-name");
const clearBtn = $("#sign-clear");
const signAnswer = $("#sign-answer");
const noChoice = $("#no-choice");
const noChoiceReply = $("#no-choice-reply");
const markSlot = $("#mark-slot");
const confirmation = $("#confirmation");
const confirmationIronman = $("#confirmation-ironman");
const souvenirCanvas = $("#souvenir-canvas");
const shareSouvenirBtn = $("#share-souvenir");
const whatsappLink = $("#whatsapp-link");
const ladPills = $$(".lad-pill");

const INK = "#233552";
const HAND = `Yellowtail, "Brush Script MT", cursive`;
let handInk = false;
let drawing = false;
let last = null;

// Pre-select pill if URL had ?lad=
ladPills.forEach((pill) => {
  if (selectedLad && pill.dataset.lad === selectedLad) {
    pill.classList.add("is-active");
    nameInput.value = selectedLad;
  }
  pill.addEventListener("click", () => {
    ladPills.forEach((p) => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    selectedLad = pill.dataset.lad;
    selectedBib = pill.dataset.bib;
    if (!handInk) {
      nameInput.value = selectedLad;
      writeTypedName();
      updateSignButton();
    }
  });
});

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
    updateSignButton();
  }
}
window.addEventListener("resize", () => { if (!letter.hidden) sizeCanvas(); });

function clearPad() {
  const r = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
}

function writeTypedName() {
  clearPad();
  const name = nameInput.value.trim();
  if (!name) return;
  const r = canvas.getBoundingClientRect();
  let size = 46;
  ctx.font = `400 ${size}px ${HAND}`;
  while (ctx.measureText(name).width > r.width - 60 && size > 20) {
    size -= 2;
    ctx.font = `400 ${size}px ${HAND}`;
  }
  ctx.fillText(name, 24, r.height - 46);
}
if (document.fonts) document.fonts.load(`52px Yellowtail`).then(() => { if (!handInk && nameInput.value.trim()) writeTypedName(); }).catch(() => {});

function updateSignButton() { signAnswer.disabled = !(handInk || nameInput.value.trim()); }

const pos = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
};

canvas.addEventListener("pointerdown", (e) => {
  if (accept.classList.contains("is-signed")) return;
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch { /* fine */ }
  if (!handInk && nameInput.value.trim()) { clearPad(); }
  drawing = true;
  last = pos(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const p = pos(e);
  const dist = Math.hypot(p.x - last.x, p.y - last.y);
  const speed = dist / Math.max(p.t - last.t, 1);
  ctx.lineWidth = Math.max(1.2, Math.min(3.2, 3.4 - speed * 1.4));
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
  const typed = nameInput.value.trim().toLowerCase();
  if (LADS_MAP[typed]) {
    selectedLad = LADS_MAP[typed].name;
    selectedBib = LADS_MAP[typed].bib;
    ladPills.forEach((p) => p.classList.toggle("is-active", p.dataset.lad === selectedLad));
  }
  writeTypedName();
  updateSignButton();
});

noChoice.addEventListener("click", () => {
  noChoiceReply.textContent = "No. Mandatory race entry. And it’s your round anyway.";
  noChoice.hidden = true;
  scrollTo($(".sign-pad"), "center");
});

/* ---------- Render Souvenir Race Bib onto #souvenir-canvas ---------- */
function renderSouvenirBib() {
  const sctx = souvenirCanvas.getContext("2d");
  const W = souvenirCanvas.width;
  const H = souvenirCanvas.height;
  const ladName = selectedLad || nameInput.value.trim() || "Official Lad";
  const bibNo = selectedBib || "01";
  const finalScore = `${score} / ${questions.length}`;

  // Background cream card
  sctx.fillStyle = "#fbf1dc";
  sctx.fillRect(0, 0, W, H);

  // Retro 70s triple top & bottom stripes
  const stripeColors = ["#e9b949", "#e8622c", "#5b3424"];
  stripeColors.forEach((c, idx) => {
    sctx.fillStyle = c;
    sctx.fillRect(0, idx * 10, W, 10);
    sctx.fillRect(0, H - (3 - idx) * 10, W, 10);
  });

  // Corner punch holes (like a real race bib)
  sctx.fillStyle = "#ecd4a8";
  sctx.strokeStyle = "#5b3424";
  sctx.lineWidth = 3;
  [[38, 56], [W - 38, 56], [38, H - 56], [W - 38, H - 56]].forEach(([cx, cy]) => {
    sctx.beginPath();
    sctx.arc(cx, cy, 12, 0, Math.PI * 2);
    sctx.fill();
    sctx.stroke();
  });

  // Top header banner
  sctx.fillStyle = "#134a50";
  sctx.font = "700 20px Jost, sans-serif";
  sctx.textAlign = "center";
  sctx.fillText("IRONMAN® 70.3 XÀTIVA • OFFICIAL GROOMSMAN RACE BIB", W / 2, 72);

  // Giant Bib Number & Name
  sctx.fillStyle = "#e8622c";
  sctx.font = "400 32px Yellowtail, cursive";
  sctx.fillText("Matt & Dasha • 21 August 2027", W / 2, 114);

  sctx.fillStyle = "#3a2418";
  sctx.font = "400 105px Shrikhand, Georgia, serif";
  sctx.fillText(`#${bibNo} ${ladName.toUpperCase()}`, W / 2, 220);

  // Stats bar
  sctx.fillStyle = "#1f6b70";
  sctx.fillRect(70, 250, W - 140, 44);
  sctx.fillStyle = "#fbf1dc";
  sctx.font = "600 18px Jost, sans-serif";
  sctx.fillText(`VENUE: HOTEL MONTSANT   |   QUIZ SPLIT: ${finalScore}   |   DUTY: STAG & SPEECHES`, W / 2, 278);

  // Copy user's drawn signature from #sign-canvas
  sctx.strokeStyle = "rgba(58, 36, 24, 0.4)";
  sctx.lineWidth = 2;
  sctx.beginPath();
  sctx.moveTo(140, 445);
  sctx.lineTo(560, 445);
  sctx.stroke();

  sctx.fillStyle = "#6b4a36";
  sctx.font = "500 15px Jost, sans-serif";
  sctx.textAlign = "left";
  sctx.fillText("ATHLETE WAIVER SIGNATURE (BINDING + 1 DANCE WITH NAN):", 140, 470);

  // Draw signature canvas scaled into the bib
  sctx.drawImage(canvas, 140, 315, 420, 125);

  // Stamp seal on the right
  sctx.save();
  sctx.translate(715, 390);
  sctx.rotate(-0.14);
  sctx.strokeStyle = "#c8352a";
  sctx.lineWidth = 4;
  sctx.beginPath();
  sctx.arc(0, 0, 64, 0, Math.PI * 2);
  sctx.stroke();
  sctx.beginPath();
  sctx.arc(0, 0, 54, 0, Math.PI * 2);
  sctx.stroke();
  sctx.fillStyle = "#c8352a";
  sctx.textAlign = "center";
  sctx.font = "700 16px Jost, sans-serif";
  sctx.fillText("XÀTIVA 2027", 0, -16);
  sctx.font = "700 22px Jost, sans-serif";
  sctx.fillText("QUALIFIED", 0, 8);
  sctx.font = "600 13px Jost, sans-serif";
  sctx.fillText("NO DNF ALLOWED", 0, 28);
  sctx.restore();

  // Set WhatsApp status deep link
  const waText = encodeURIComponent(
    `Bib #${bibNo} (${ladName}) signed and locked in for Xàtiva 2027 🍻🇪🇸 Quiz score: ${finalScore}. First job: the stag.`
  );
  whatsappLink.href = `https://wa.me/?text=${waText}`;
}

shareSouvenirBtn.addEventListener("click", async () => {
  souvenirCanvas.toBlob(async (blob) => {
    if (!blob) return;
    const ladSlug = (selectedLad || "groomsman").toLowerCase();
    const file = new File([blob], `xativa-2027-bib-${ladSlug}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Official Groomsman Race Bib — Xàtiva 2027",
          text: "Signed and qualified for Xàtiva 2027 🍻"
        });
        return;
      } catch { /* user cancelled or share failed, fall back to download */ }
    }

    // Fallback: direct image download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xativa-2027-bib-${ladSlug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
});

signAnswer.addEventListener("click", () => {
  if (signAnswer.disabled) return;
  accept.classList.add("is-signed");
  nameInput.disabled = true;
  signAnswer.disabled = true;
  markSlot.innerHTML = '<svg viewBox="0 0 170 90"><use href="#postmark"/></svg>';

  const displayLad = selectedLad || nameInput.value.trim();
  if (displayLad) {
    confirmationIronman.textContent = `${displayLad.toUpperCase()}, YOU ARE A GROOMSMAN!`;
  }

  renderSouvenirBib();

  later(() => {
    buzz([40, 30, 80]);
    confirmation.hidden = false;
    celebrate();
    scrollTo(confirmation, "center");
  }, 450);
});
