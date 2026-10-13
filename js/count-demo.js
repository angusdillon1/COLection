/* The count on the home page.
   It counts a small set of made-up ballots with the same idea the program uses for one seat:
   every ballot counts for its highest choice still in the count, the lowest candidate is excluded,
   and their ballots move to the next choice, until someone has more than half of the votes still counting.

   To change the example, edit CANDIDATES and BALLOTS below. Each BALLOTS line is: [how many ballots, [choices, best first]]. */
(function () {
  "use strict";

  var CANDIDATES = {
    M: "Maya Chen", T: "Tom Okafor", P: "Priya Nair", J: "Jack Dunne", S: "Sofia Reyes"
  };

  var BALLOTS = [
    [30, ["M", "P", "T"]], [12, ["M", "T"]], [20, ["M"]],
    [25, ["T", "P"]], [15, ["T", "M"]], [15, ["T"]],
    [24, ["P", "T"]], [14, ["P", "M"]], [8, ["P"]],
    [12, ["J", "T"]], [9, ["J", "P"]], [3, ["J", "M"]],
    [8, ["S", "P", "T"]], [3, ["S", "J", "M"]], [2, ["S", "M"]]
  ];

  var TOTAL = BALLOTS.reduce(function (n, b) { return n + b[0]; }, 0);
  var ids = Object.keys(CANDIDATES);

  /* ---------- count it, round by round ---------- */
  function first(choices, active) {
    for (var i = 0; i < choices.length; i++) if (active[choices[i]]) return choices[i];
    return null;
  }

  function count() {
    var active = {}; ids.forEach(function (c) { active[c] = true; });
    var rounds = [], previous = null;
    for (var guard = 0; guard < 20; guard++) {
      var tally = {}; ids.forEach(function (c) { tally[c] = 0; });
      var counting = 0;
      BALLOTS.forEach(function (b) {
        var c = first(b[1], active);
        if (c) { tally[c] += b[0]; counting += b[0]; }
      });
      var need = Math.floor(counting / 2) + 1;
      var live = ids.filter(function (c) { return active[c]; });
      live.sort(function (a, b) { return tally[b] - tally[a]; });
      var round = { tally: tally, active: JSON.parse(JSON.stringify(active)), counting: counting, need: need,
                    exhausted: TOTAL - counting, transfers: previous, winner: null, out: null };
      if (tally[live[0]] >= need || live.length === 1) {
        round.winner = live[0]; rounds.push(round); break;
      }
      var lowest = live[live.length - 1];
      round.out = lowest;
      rounds.push(round);

      /* where the excluded candidate's ballots go next */
      var moved = {}, gone = 0, size = 0;
      var after = JSON.parse(JSON.stringify(active)); delete after[lowest];
      BALLOTS.forEach(function (b) {
        if (first(b[1], active) !== lowest) return;
        size += b[0];
        var to = first(b[1], after);
        if (to) moved[to] = (moved[to] || 0) + b[0]; else gone += b[0];
      });
      previous = { from: lowest, size: size, moved: moved, gone: gone };
      delete active[lowest];
    }
    return rounds;
  }

  var rounds = count();

  /* ---------- words ---------- */
  function list(parts) {
    if (parts.length < 2) return parts.join("");
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }
  function votes(n) { return n + (n === 1 ? " vote" : " votes"); }

  function story(i) {
    var r = rounds[i], parts = [], t = r.transfers;
    if (t) {
      var bits = Object.keys(t.moved).sort(function (a, b) { return t.moved[b] - t.moved[a]; })
        .map(function (c) { return t.moved[c] + " to " + CANDIDATES[c]; });
      if (t.gone) bits.push(t.gone + " had no further choice");
      parts.push(CANDIDATES[t.from] + "'s " + t.size + " ballots go to each voter's next choice: " + list(bits) + ".");
    } else {
      parts.push("Every ballot counts for its first choice.");
    }
    if (r.winner) {
      var w = CANDIDATES[r.winner], lead = leader(0);
      parts.push(w + " has " + r.tally[r.winner] + " of the " + r.counting + " votes still counting, which is more than half.");
      if (lead !== r.winner) parts.push(CANDIDATES[lead] + " had the most first choices, but " + w + " won once the other ballots were passed on.");
    } else {
      parts.push("Nobody has more than half of the votes still counting, so " + CANDIDATES[r.out] + ", with the fewest, is excluded.");
    }
    return parts.join(" ");
  }

  function leader(i) {
    var r = rounds[i];
    return Object.keys(r.tally).sort(function (a, b) { return r.tally[b] - r.tally[a]; })[0];
  }

  /* ---------- draw ---------- */
  var barsEl = document.getElementById("demo-bars");
  if (!barsEl) return;
  var storyEl = document.getElementById("demo-story");
  var roundEl = document.getElementById("demo-round");
  var needEl = document.getElementById("demo-need");
  var prevBtn = document.getElementById("demo-prev");
  var nextBtn = document.getElementById("demo-next");
  var subEl = document.getElementById("demo-sub");
  subEl.textContent = TOTAL + " ballots, " + ids.length + " candidates";

  var rows = {};
  var order = ids.slice().sort(function (a, b) { return rounds[0].tally[b] - rounds[0].tally[a]; });   /* the same order throughout, so the bars do not jump */
  order.forEach(function (c) {
    var li = document.createElement("li"); li.className = "bar-row";
    li.innerHTML = '<span class="bar-name"></span><span class="bar-track"><span class="bar-fill"></span></span><span class="bar-num"></span>';
    li.querySelector(".bar-name").textContent = CANDIDATES[c];
    barsEl.appendChild(li); rows[c] = li;
  });
  var line = document.createElement("span"); line.className = "threshold"; line.setAttribute("aria-hidden", "true");
  barsEl.appendChild(line);

  var scale = Math.max.apply(null, rounds.map(function (r) { return r.counting; }));
  var current = -1, timer = null;

  function show(i) {
    current = i;
    var r = rounds[i];
    roundEl.textContent = "Round " + (i + 1);
    needEl.textContent = "Needs " + r.need + " of the " + r.counting + " votes still counting (more than half)";
    storyEl.textContent = story(i);
    order.forEach(function (c) {
      var row = rows[c], fill = row.querySelector(".bar-fill"), name = row.querySelector(".bar-name");
      var out = !r.active[c], won = r.winner === c, nxt = r.out === c;
      row.className = "bar-row" + (out ? " out" : "") + (won ? " won" : "") + (nxt ? " next" : "");
      fill.style.width = (out ? 0 : (r.tally[c] / scale) * 100) + "%";
      row.querySelector(".bar-num").textContent = out ? "" : r.tally[c];
      var tag = won ? "elected" : out ? "excluded" : nxt ? "excluded next" : "";
      name.innerHTML = "";
      name.appendChild(document.createTextNode(CANDIDATES[c]));
      if (tag) { var s = document.createElement("small"); s.textContent = tag; name.appendChild(s); }
    });
    place(r);
    prevBtn.disabled = i === 0;
    nextBtn.textContent = i === rounds.length - 1 ? "Play again" : "Next round";
  }

  function place(r) {                      /* the dashed line sits where "more than half" is on the bars' scale */
    var track = barsEl.querySelector(".bar-track");
    var first = barsEl.getBoundingClientRect().left, t = track.getBoundingClientRect();
    line.style.left = (t.left - first + (r.need / scale) * t.width) + "px";
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function go(i) { stop(); show(Math.max(0, Math.min(rounds.length - 1, i))); }
  prevBtn.addEventListener("click", function () { go(current - 1); });
  nextBtn.addEventListener("click", function () { go(current === rounds.length - 1 ? 0 : current + 1); });   /* after the last round the button starts again */

  /* keep the box the same height for every round, so the page does not jump as the words change */
  function reserve() {
    var keep = current;
    storyEl.style.minHeight = "0";
    var tallest = 0;
    rounds.forEach(function (r, i) { storyEl.textContent = story(i); tallest = Math.max(tallest, storyEl.offsetHeight); });
    storyEl.style.minHeight = tallest + "px";
    if (keep >= 0) storyEl.textContent = story(keep);
  }
  window.addEventListener("resize", function () { reserve(); if (current >= 0) place(rounds[current]); });

  /* the one moment of motion: the count plays through once, then it is yours to step through */
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  show(0);
  reserve();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { reserve(); if (current >= 0) place(rounds[current]); });
  if (!calm) {
    var i = 0;
    timer = setInterval(function () {
      i++;
      if (i >= rounds.length) { stop(); return; }
      show(i);
    }, 3800);
  }
})();
