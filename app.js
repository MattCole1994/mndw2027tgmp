/* =========================================================
   IRONMAN 140.6 XÀTIVA | Groomsmen World Championship
   Gate, 3.8km Swim, 180km Bike, 42.2km Run, 140.6 Finisher
   Medal Ceremony, and Official WTC Race Bib Souvenir.
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
  mitch: { name: "Mitch", bib: "001" },
  brad: { name: "Brad", bib: "002" },
  liam: { name: "Liam", bib: "003" }
};
let selectedLad = null;
let selectedBib = "001";

const urlLad = new URLSearchParams(window.location.search).get("lad")?.toLowerCase();
if (urlLad && LADS_MAP[urlLad]) {
  selectedLad = LADS_MAP[urlLad].name;
  selectedBib = LADS_MAP[urlLad].bib;
  const heroTurn = $("#hero-turn");
  if (heroTurn) heroTurn.textContent = `ZIP UP YOUR WETSUIT, ${selectedLad.toUpperCase()}.`;
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
  if (!attempt) { rejectAttempt("Enter the security code to rack your bike."); return; }
  if (!window.crypto || !crypto.subtle) { rejectAttempt("This browser cannot check the code. Open the link over https."); return; }
  if ((await sha256(attempt)) === TARGET_HASH) {
    errorEl.textContent = "";
    rememberUnlock();
    unlock();
  } else {
    rejectAttempt("Doping Control Failure! Think every other Saturday in BS3.");
  }
});
input.addEventListener("input", () => { input.classList.remove("is-invalid"); errorEl.textContent = ""; });

if (isUnlocked()) unlock({ instant: true }); else input.focus();

/* ---------- Top bar: Triathlon Legs ---------- */
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

/* ---------- Hero parallax ---------- */
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
  window.addEventListener("scroll", () => { if (window.scrollY < window.innerHeight * 1.2) kick(); }, { passive: true });
}

/* ---------- Confetti ---------- */
const PALETTE = ["#e31837", "#ffb800", "#ffffff", "#d49a2a", "#14161d"];

function celebrate() {
  if (typeof window.confetti !== "function") return;
  if (reduceMotion) {
    confetti({ particleCount: 70, spread: 90, origin: { y: 0.6 }, colors: PALETTE, disableForReducedMotion: false });
    return;
  }
  confetti({ particleCount: 140, spread: 95, startVelocity: 52, origin: { y: 0.7 }, colors: PALETTE, scalar: 0.95 });
  const end = Date.now() + 2600;
  (function sides() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: PALETTE, scalar: 0.85 });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: PALETTE, scalar: 0.85 });
    if (Date.now() < end) requestAnimationFrame(sides);
  })();
}

/* ---------- Leg 1: Swim (Athlete Dossiers) ---------- */
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
    later(() => { if (memory) memory.hidden = false; }, 500);
    buzz(12);
    turned += 1;
    if (turned === cards.length) {
      unlockRoundNav("quiz-round");
      later(() => { ladsDone.hidden = false; }, 950);
    } else {
      const next = cards.find((c) => !c.classList.contains("is-turned"));
      next && next.focus({ preventScroll: true });
    }
  });
});

/* ---------- Leg 2: Bike (Anti-Drafting Tribunal) ---------- */
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
      $(".q-reply", q).textContent = btn.dataset.reply || (right ? "Green Card." : "Penalty!");
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
            verdictText.textContent = `${score} OUT OF ${questions.length} SPLITS. KONA WORLD CHAMPIONSHIP STANDARD. FIRST PINT IN XÀTIVA IS ON ME.`;
          } else if (score >= 3) {
            verdictText.textContent = `${score} OUT OF ${questions.length} SPLITS. RESPECTABLE ZONE 2 GRIND. RACK YOUR BIKE IN T2.`;
          } else {
            verdictText.textContent = `${score} OUT OF ${questions.length} SPLITS. SHOCKING WATTAGE, YOU SPENT HALF THE RACE IN THE PENALTY TENT, BUT YOU STILL QUALIFY.`;
          }
          verdict.hidden = false;
          scrollTo(verdict);
          $(".next-link", verdict).focus({ preventScroll: true });
        }
      }, reduceMotion ? 0 : 1050);
    });
  });
});

/* ---------- Leg 3: Marathon (Course Telemetry Board) ---------- */
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
    setTimeout(() => btn.remove(), reduceMotion ? 0 : 650);
    wiped += 1;
    if (wiped === wipes.length) {
      unlockRoundNav("last-call");
      later(() => { boardNext.hidden = false; }, 500);
    }
  });
});

/* ---------- Leg 4: 140.6 Finisher Medal Ceremony ---------- */
const pop = $("#pop");
const stage = $("#bottle-stage");
const ring = $(".pop-ring circle");
const popHint = $("#pop-hint");
const bottleWrap = $("#bottle-wrap");
const letter = $("#letter");
const HOLD_MS = 600;
let progress = 0;
let holding = false;
let popped = false;
let holdStart = 0;
let rafId = null;

const setProgress = (p) => {
  progress = Math.max(0, Math.min(1, p));
  if (ring) ring.style.strokeDashoffset = String(1 - progress);
};

// Triumphal Finisher Chord / Bell Chime
function medalSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    const t = ac.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.18, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.65);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.7);
    });
    setTimeout(() => ac.close(), 1200);
  } catch { /* audio optional */ }
}

function goldBurst() {
  if (typeof window.confetti !== "function") return;
  const r = stage.getBoundingClientRect();
  const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: Math.max(0.1, (r.top + r.height * 0.6) / window.innerHeight) };
  confetti({ particleCount: 110, spread: 80, startVelocity: 45, origin, colors: ["#ffb800", "#e31837", "#ffffff", "#d49a2a"], scalar: 0.9, disableForReducedMotion: true });
}

function holdStep(t) {
  if (!holding || popped) return;
  const p = Math.min((t - holdStart) / HOLD_MS, 1);
  setProgress(p);
  if (p >= 1) {
    awardMedal();
    return;
  }
  rafId = requestAnimationFrame(holdStep);
}

function startHold(e) {
  if (popped) return;
  if (e.type === "mousedown" && e.button !== 0) return;
  if (e.cancelable) e.preventDefault();
  holding = true;
  stage.classList.add("is-pressing");
  holdStart = performance.now() - progress * HOLD_MS;
  buzz(12);
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(holdStep);
}

function endHold() {
  if (!holding || popped) return;
  holding = false;
  stage.classList.remove("is-pressing");
  if (rafId) cancelAnimationFrame(rafId);

  // Instant +0.4 boost on every tap so 3 quick taps or 1 short hold awards the medal reliably
  const boosted = Math.min(1, progress + 0.4);
  setProgress(boosted);
  if (boosted >= 1) {
    awardMedal();
    return;
  }
  popHint.textContent = "ALMOST AT THE LINE! TAP OR HOLD AGAIN TO CLAIM YOUR MEDAL";
}

pop.addEventListener("pointerdown", startHold);
window.addEventListener("pointerup", endHold);
pop.addEventListener("contextmenu", (e) => e.preventDefault());
pop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    awardMedal();
  }
});

function awardMedal() {
  if (popped) return;
  popped = true;
  holding = false;
  if (rafId) cancelAnimationFrame(rafId);
  setProgress(1);
  stage.classList.remove("is-pressing");
  stage.classList.add("is-popped");
  pop.setAttribute("aria-disabled", "true");
  popHint.textContent = "140.6 FINISHER MEDAL AWARDED!";
  medalSound();
  goldBurst();
  buzz([30, 40, 80]);

  const showLetter = () => {
    bottleWrap.hidden = true;
    letter.hidden = false;
    sizeCanvas();
    $("#letter-title").focus({ preventScroll: true });
    scrollTo(letter, "start");
  };
  if (reduceMotion) { showLetter(); return; }
  setTimeout(() => bottleWrap.classList.add("is-gone"), 1200);
  setTimeout(showLetter, 1750);
}

/* ---------- Sign, Lad Picker, and 140.6 Souvenir Bib Generator ---------- */
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

const INK = "#12141a";
const HAND = `Yellowtail, "Brush Script MT", cursive`;
let handInk = false;
let drawing = false;
let last = null;

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
  ctx.lineWidth = Math.max(1.4, Math.min(3.4, 3.6 - speed * 1.4));
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
  noChoiceReply.textContent = "Zero chance of a DNF. Sign the waiver, and it is your round at the bar anyway.";
  noChoice.hidden = true;
  scrollTo($(".sign-pad"), "center");
});

/* ---------- Render Official 140.6 Souvenir Race Bib ---------- */
function renderSouvenirBib() {
  const sctx = souvenirCanvas.getContext("2d");
  const W = souvenirCanvas.width;
  const H = souvenirCanvas.height;
  const ladName = selectedLad || nameInput.value.trim() || "Official Lad";
  const bibNo = selectedBib || "001";
  const finalScore = `${score} / ${questions.length}`;

  // Off-white official Tyvek race bib base
  sctx.fillStyle = "#f6f4ee";
  sctx.fillRect(0, 0, W, H);

  // Top & Bottom WTC Red & Black Championship Bars
  sctx.fillStyle = "#111318";
  sctx.fillRect(0, 0, W, 68);
  sctx.fillStyle = "#e31837";
  sctx.fillRect(0, 68, W, 14);

  sctx.fillStyle = "#e31837";
  sctx.fillRect(0, H - 40, W, 12);
  sctx.fillStyle = "#111318";
  sctx.fillRect(0, H - 28, W, 28);

  // Corner bib eyelets
  sctx.fillStyle = "#0b0c10";
  [[34, 34], [W - 34, 34], [34, H - 54], [W - 34, H - 54]].forEach(([cx, cy]) => {
    sctx.beginPath();
    sctx.arc(cx, cy, 10, 0, Math.PI * 2);
    sctx.fill();
  });

  // Top Championship Header Text
  sctx.fillStyle = "#ffffff";
  sctx.font = "700 28px 'Barlow Condensed', sans-serif";
  sctx.textAlign = "center";
  sctx.fillText("IRONMAN 140.6 XÀTIVA • GROOMSMAN WORLD CHAMPIONSHIP", W / 2, 44);

  // Sub-banner
  sctx.fillStyle = "#e31837";
  sctx.font = "700 22px 'Barlow Condensed', sans-serif";
  sctx.fillText("MATT & DASHA • HOTEL MONTSANT • 21 AUGUST 2027", W / 2, 114);

  // Giant Race Bib Number & Name
  sctx.fillStyle = "#111318";
  sctx.font = "700 120px 'Teko', Impact, sans-serif";
  sctx.fillText(`#${bibNo}  ${ladName.toUpperCase()}`, W / 2, 224);

  // Telemetry Split Bar
  sctx.fillStyle = "#111318";
  sctx.fillRect(50, 248, W - 100, 48);
  sctx.fillStyle = "#ffb800";
  sctx.font = "700 17px 'JetBrains Mono', monospace";
  sctx.fillText(`DISTANCE: 140.6 MILES   |   TRIBUNAL SPLITS: ${finalScore}   |   STATUS: FINISHER`, W / 2, 278);

  // Signature box & line
  sctx.strokeStyle = "#111318";
  sctx.lineWidth = 2;
  sctx.beginPath();
  sctx.moveTo(90, 465);
  sctx.lineTo(540, 465);
  sctx.stroke();

  sctx.fillStyle = "#333333";
  sctx.font = "700 14px 'JetBrains Mono', monospace";
  sctx.textAlign = "left";
  sctx.fillText("ATHLETE WAIVER SIGNATURE (BINDING + 1 DANCE WITH NAN):", 90, 490);

  // Composite drawn signature onto the bib
  sctx.drawImage(canvas, 90, 325, 450, 135);

  // Official 140.6 Finisher Stamp on the right
  sctx.save();
  sctx.translate(725, 405);
  sctx.rotate(-0.12);
  sctx.strokeStyle = "#e31837";
  sctx.lineWidth = 5;
  sctx.beginPath();
  sctx.arc(0, 0, 72, 0, Math.PI * 2);
  sctx.stroke();
  sctx.beginPath();
  sctx.arc(0, 0, 60, 0, Math.PI * 2);
  sctx.stroke();
  sctx.fillStyle = "#e31837";
  sctx.textAlign = "center";
  sctx.font = "800 16px 'Barlow Condensed', sans-serif";
  sctx.fillText("IRONMAN 140.6", 0, -20);
  sctx.font = "800 26px 'Barlow Condensed', sans-serif";
  sctx.fillText("FINISHER", 0, 8);
  sctx.font = "700 14px 'JetBrains Mono', monospace";
  sctx.fillText("XÀTIVA 2027", 0, 30);
  sctx.restore();

  // WhatsApp pre-filled message (zero hyphens)
  const waText = encodeURIComponent(
    `Bib #${bibNo} (${ladName}) officially qualified for IRONMAN 140.6 Xàtiva 2027! Tribunal score: ${finalScore}. First job: the stag 🍻🇪🇸`
  );
  whatsappLink.href = `https://wa.me/?text=${waText}`;
}

shareSouvenirBtn.addEventListener("click", async () => {
  souvenirCanvas.toBlob(async (blob) => {
    if (!blob) return;
    const ladSlug = (selectedLad || "groomsman").toLowerCase();
    const file = new File([blob], `ironman-1406-xativa-bib-${ladSlug}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "IRONMAN 140.6 Xàtiva | Official Finisher Bib",
          text: "Signed the waiver and qualified for Xàtiva 2027 🍻"
        });
        return;
      } catch { /* fallback to download */ }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ironman-1406-xativa-bib-${ladSlug}.png`;
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
    confirmationIronman.textContent = `${displayLad.toUpperCase()}, YOU ARE AN IRONMAN GROOMSMAN!`;
  }

  renderSouvenirBib();

  later(() => {
    buzz([40, 30, 80]);
    confirmation.hidden = false;
    celebrate();
    scrollTo(confirmation, "center");
  }, 450);
});
