/* The pricing calculator. The price comes from js/pricing.js, the same file the server uses to decide what to charge. */
(function () {
  var P = window.ColPricing, cfg = window.COL_SITE || {};
  var form = document.getElementById("buy");
  if (!form || !P) return;

  var $ = function (id) { return document.getElementById(id); };
  var voters = $("voters"), org = $("org"), email = $("email");
  var priceEl = $("price"), detail = $("price-detail"), note = $("price-note"), buy = $("buy-button"), msg = $("buy-message");
  var terms = [].slice.call(form.querySelectorAll('input[name="term"]'));
  var MIN = P.CONFIG.free_voters + 1, MAX = P.CONFIG.max_online_voters;
  var online = !!cfg.API_BASE;

  function term() { var t = terms.filter(function (r) { return r.checked; })[0]; return t ? t.value : "1"; }
  function money(n) { return "A$" + n.toLocaleString("en-AU"); }

  function readVoters() {
    var raw = String(voters.value).trim();
    return /^\d+$/.test(raw) ? Number(raw) : NaN;
  }

  function update(source) {
    var n = readVoters(), t = term(), why = Number.isNaN(n) ? "Enter how many people will be able to vote." : P.check(n, t);
    voters.setAttribute("aria-invalid", why ? "true" : "false");
    var tooMany = !Number.isNaN(n) && n > MAX;
    if (why) {
      priceEl.textContent = "-";
      detail.textContent = "";
      note.textContent = n <= P.CONFIG.free_voters && !Number.isNaN(n)
        ? "Up to " + P.CONFIG.free_voters + " voters, COLection is free: no licence needed."
        : why;
      buy.disabled = true;
      if (tooMany) { buy.disabled = false; buy.textContent = "Ask for a quote"; buy.dataset.mode = "quote"; }
      return;
    }
    buy.dataset.mode = "buy";
    buy.disabled = false;
    var cost = P.price(n, t);
    priceEl.textContent = money(cost);
    var years = t === "pass" ? null : Number(t);
    detail.textContent = (t === "pass" ? P.CONFIG.pass.days + " days, for a single election" : years + (years === 1 ? " year" : " years")) +
      ", up to " + P.tier(n).toLocaleString("en-AU") + " voters" +
      (years > 1 ? " (" + money(Math.round(cost / years)) + " a year)" : "");
    note.textContent = "One payment, no subscription: it simply ends, and the program keeps working in free mode.";
    buy.textContent = online ? "Pay " + money(cost) + " and get my licence" : "Request an invoice for " + money(cost);
  }

  function show(text, bad) { msg.textContent = text; msg.className = "buy-message" + (bad ? " bad" : ""); }

  function mailto(subject, body) {
    return "mailto:" + encodeURIComponent(cfg.CONTACT_EMAIL || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = readVoters(), t = term();
    if (buy.dataset.mode === "quote") {
      window.location.href = mailto("COLection quote", "Organisation: " + org.value + "\nVoters: " + voters.value + "\n");
      return;
    }
    if (P.check(n, t)) return update();
    if (!org.value.trim()) { show("Please enter the name of your organisation: it is written on the licence.", true); org.focus(); return; }
    if (!email.checkValidity() || !email.value.trim()) { show("Please enter an email address to send the licence to.", true); email.focus(); return; }
    if (!$("agree").checked) { show("Please tick the box to say you have read the terms.", true); $("agree").focus(); return; }
    if (!online) {
      window.location.href = mailto("COLection licence: " + org.value.trim(),
        "Please send me an invoice.\n\nOrganisation: " + org.value.trim() + "\nVoters: up to " + P.tier(n) + "\nTerm: " + P.termName(t) +
        "\nPrice: " + money(P.price(n, t)) + "\nSend the licence to: " + email.value.trim() + "\n");
      show("Your email program should have opened with the details filled in. Send it and I'll reply with an invoice.", false);
      return;
    }
    buy.disabled = true;
    show("Taking you to the secure payment page...", false);
    fetch(cfg.API_BASE.replace(/\/$/, "") + "/api/checkout", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ org: org.value, email: email.value, voters: n, term: t })
    }).then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (r.ok && r.data.url) { window.location.href = r.data.url; return; }
        throw new Error(r.data.error || "Something went wrong.");
      })
      .catch(function (err) {
        buy.disabled = false;
        show((err && err.message ? err.message : "Something went wrong.") + " Nothing was charged. You can try again or email " + (cfg.CONTACT_EMAIL || "us") + ".", true);
      });
  });

  voters.addEventListener("change", function () { update(); });
  terms.forEach(function (r) { r.addEventListener("change", function () { update(); }); });
  [org, email].forEach(function (el) { el.addEventListener("input", function () { show("", false); }); });

  var params = new URLSearchParams(window.location.search);
  if (params.get("cancelled")) show("The payment was cancelled and nothing was charged. You can pick up where you left off.", false);
  if (params.get("voters") && /^\d+$/.test(params.get("voters"))) {          // (a link with a size in it: use the size that covers it)
    var asked = Number(params.get("voters"));
    voters.value = asked <= P.CONFIG.free_voters ? "50" : asked > MAX ? "5001" : String(P.tier(asked));
  }
  if (["1", "2", "3", "pass"].indexOf(params.get("term")) >= 0) terms.forEach(function (r) { r.checked = r.value === params.get("term"); });
  update();

  /* the table of examples */
  var table = document.getElementById("examples");
  if (table) {
    P.CONFIG.tiers.forEach(function (v) {
      var row = document.createElement("tr"), th = document.createElement("th");
      th.scope = "row"; th.textContent = "Up to " + v.toLocaleString("en-AU");
      row.appendChild(th);
      ["pass", "1", "2", "3"].forEach(function (t) {
        var td = document.createElement("td"); td.textContent = money(P.price(v, t)); row.appendChild(td);
      });
      table.appendChild(row);
    });
  }
})();
