/* The page's scroll moments. Everything here is progress-driven: a section's position sets a few CSS variables or classes.
   Nothing runs when the visitor has "reduce motion" on or the screen is small (the CSS falls back to plain sections). */
(function () {
  "use strict";
  var doc = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var small = window.matchMedia("(max-width: 900px)");
  var vh = window.innerHeight;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }     /* ease in-out cubic */
  function mix(a, b, t) { return a + (b - a) * t; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function blend(a, b, t) { var x = hex(a), y = hex(b); return "rgb(" + x.map(function (v, i) { return Math.round(mix(v, y[i], t)); }).join(",") + ")"; }
  function $(id) { return document.getElementById(id); }
  function motion() { return !still.matches; }
  function pinned() { return motion() && !small.matches; }

  /* how far through a tall "track" section the visitor has scrolled, 0 to 1 */
  function progress(track) {
    var r = track.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
  }

  /* ---------- reveal on the way in ---------- */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && motion()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: .08 });
    reveals.forEach(function (el, i) { el.style.setProperty("--d", ((i % 4) * 0.08) + "s"); io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- the words that light up ---------- */
  var words = $("words"), wordEls = [];
  if (words && motion()) {
    words.setAttribute("aria-label", words.textContent);
    words.innerHTML = words.textContent.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    wordEls = [].slice.call(words.querySelectorAll(".w"));
  }
  function lightWords() {
    if (!wordEls.length) return;
    var r = words.getBoundingClientRect();
    var t = clamp((vh * .82 - r.top) / (r.height + vh * .34), 0, 1);       /* starts when the paragraph is low on the screen, ends near the middle */
    var n = Math.round(t * wordEls.length);
    wordEls.forEach(function (el, i) { el.classList.toggle("lit", i < n); });
  }

  /* ---------- the hero: scroll through the rings ---------- */
  var track = document.querySelector(".hero-track"), stage = $("hero-stage"), copy = $("hero-copy");
  var allRings = $("ring-all"), line = $("hero-line"), ringA = $("ring-a"), ringB = $("ring-b"), ringC = $("ring-c"), dot = $("ring-dot"), rings = $("rings");
  var heroP = 0, idle = 0, lastT = 0, heroOn = true;
  function hero(now) {
    if (!pinned()) { if (rings) { allRings.removeAttribute("transform"); rings.style.removeProperty("--ro"); } return; }
    var p = heroP;
    var q = ease(clamp((p - .12) / .88, 0, 1));
    var scale = 1 + Math.pow(q, 2.4) * 44;
    allRings.setAttribute("transform", "translate(50 50) scale(" + scale.toFixed(3) + ") translate(-50 -50)");
    rings.style.setProperty("--ro", (1 - clamp((p - .8) / .2, 0, 1)).toFixed(3));
    var spin = idle * 6;                                                   /* a slow turn while nothing is happening */
    ringA.setAttribute("transform", "rotate(" + (spin * .5 + p * 150) + " 50 50)");
    ringB.setAttribute("transform", "rotate(" + (-spin * .9 - p * 260) + " 50 50)");
    ringC.setAttribute("transform", "rotate(" + (spin * 1.4 + p * 420) + " 50 50)");
    dot.setAttribute("r", (4.5 + 0.5 * Math.sin(idle * 1.6)).toFixed(2));
    var lp = clamp((p - .14) / .1, 0, 1) * (1 - clamp((p - .42) / .12, 0, 1));
    line.style.opacity = lp.toFixed(3);
    line.style.transform = "translate3d(0," + ((1 - lp) * 30 + (p > .3 ? -(p - .3) * 120 : 0)) + "px,0)";
    copy.style.opacity = String(clamp(1 - p * 5, 0, 1));
    copy.style.transform = "translate3d(0," + (-p * 160) + "px,0) scale(" + (1 - p * .08) + ")";
    copy.style.pointerEvents = p > .12 ? "none" : "";
    stage.style.setProperty("--stage-bg", blend("#0b1424", "#fbfbfd", clamp((p - .62) / .3, 0, 1)));
    stage.style.setProperty("--cue", String(clamp(1 - p * 8, 0, 1)));
  }

  /* ---------- the five steps ---------- */
  var stepsTrack = $("steps"), stepItems = [].slice.call(document.querySelectorAll("#step-list li")), frames = [].slice.call(document.querySelectorAll("#step-shots .frame"));
  var stepNow = -1;
  function steps() {
    if (!pinned()) return;
    var p = progress(stepsTrack);
    var i = clamp(Math.floor(p * stepItems.length * .999), 0, stepItems.length - 1);
    if (i === stepNow) return;
    stepNow = i;
    stepItems.forEach(function (el, k) { el.classList.toggle("on", k === i); });
    frames.forEach(function (el, k) { el.classList.toggle("on", k === i); el.classList.toggle("past", k < i); });
  }

  /* ---------- the rules, sideways ---------- */
  var rulesTrack = $("rules"), rulesRow = $("rules-row");
  var rulesTravel = 0;
  function measureRules() {
    if (!pinned()) { rulesTrack.style.height = ""; rulesTravel = 0; rulesRow.style.removeProperty("--rx"); return; }
    rulesTravel = Math.max(0, rulesRow.scrollWidth - window.innerWidth);
    rulesTrack.style.height = (vh + rulesTravel * 1.1) + "px";
  }
  function rules() {
    if (!pinned()) return;
    rulesRow.style.setProperty("--rx", (-progress(rulesTrack) * rulesTravel).toFixed(1) + "px");
  }

  /* ---------- the report grows ---------- */
  var grow = $("grow"), growImg = grow && grow.querySelector("img");
  function growReport() {
    if (!growImg) return;
    if (!pinned()) { growImg.style.removeProperty("--gs"); growImg.style.removeProperty("--gr"); return; }
    var r = grow.getBoundingClientRect();
    var t = ease(clamp((vh * .95 - r.top) / (vh * .75), 0, 1));
    growImg.style.setProperty("--gs", mix(.64, 1, t).toFixed(4));
    growImg.style.setProperty("--gr", mix(46, 22, t).toFixed(1) + "px");
  }

  /* ---------- a little drift on the voting screenshots ---------- */
  var drifters = [].slice.call(document.querySelectorAll(".parallax"));
  function drift() {
    drifters.forEach(function (el) {
      if (!pinned()) { el.style.removeProperty("--py"); return; }
      var r = el.parentNode.getBoundingClientRect();
      var t = clamp((vh - r.top) / (vh + r.height), 0, 1) - .5;
      el.style.setProperty("--py", (t * parseFloat(el.getAttribute("data-speed") || "0") * 3).toFixed(1) + "px");
    });
  }

  /* ---------- the bar across the top turns light over dark chapters ---------- */
  var bar = $("top-bar"), darks = [].slice.call(document.querySelectorAll("[data-theme='dark']"));
  function barTheme() {
    var y = 26, dark = false;
    darks.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) dark = true;
    });
    if (pinned() && track && heroP > .62) {                                  /* the hero's stage turns white at the end of its scroll */
      var r = track.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) dark = false;
    }
    bar.classList.toggle("dark", dark);
  }

  /* ---------- one loop ---------- */
  var queued = false;
  function frame(now) {
    queued = false;
    vh = window.innerHeight;
    var dt = lastT ? Math.min(.1, (now - lastT) / 1000) : 0;
    lastT = now;
    idle += dt;
    heroP = track ? progress(track) : 0;
    hero(now); lightWords(); steps(); rules(); growReport(); drift(); barTheme();
    var r = track.getBoundingClientRect();
    heroOn = r.bottom > 0 && r.top < vh;
    if (heroOn && pinned()) request();                                       /* keep the rings turning while they are on screen */
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; measureRules(); request(); });
  still.addEventListener && still.addEventListener("change", function () { measureRules(); request(); });
  small.addEventListener && small.addEventListener("change", function () { measureRules(); request(); });
  window.addEventListener("load", function () { measureRules(); request(); });
  measureRules();
  request();
})();
