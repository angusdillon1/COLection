/* The price formula. It is the same as tools/price.py in the program's folder (tests on both sides check the same list of prices),
   and it is used twice: by the pricing page to show the price, and by the server to decide what to charge. The server never trusts
   a price sent from the page: it works the price out again from the number of voters and the term.
   To change a price, change the numbers below AND in tools/pricing.json, then run both test suites. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ColPricing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var CONFIG = {
    currency: "aud",
    anchor_voters: 100,
    anchor_price: 90,
    exponent: 0.6,
    minimum: 60,
    round_to: 5,
    free_voters: 50,
    max_online_voters: 5000,
    tiers: [100, 250, 500, 1000, 2500, 5000],
    year_factors: { "1": 1.0, "2": 0.9, "3": 0.8 },
    pass: { days: 30, factor: 0.4 }
  };

  function check(voters, term) {
    if (typeof voters !== "number" || !Number.isInteger(voters) || voters <= CONFIG.free_voters)
      return "A licence is for more than " + CONFIG.free_voters + " voters (up to that, the free version is enough).";
    if (voters > CONFIG.max_online_voters)
      return "For more than " + CONFIG.max_online_voters + " voters, please ask for a quote.";
    if (term !== "pass" && !Object.prototype.hasOwnProperty.call(CONFIG.year_factors, term))
      return "Choose 1, 2 or 3 years, or a " + CONFIG.pass.days + "-day pass.";
    return "";
  }

  /* The licence size that covers `voters`: the smallest tier that is at least that many (the number itself above the last tier). */
  function tier(voters) {
    for (var i = 0; i < CONFIG.tiers.length; i++) if (voters <= CONFIG.tiers[i]) return CONFIG.tiers[i];
    return voters;
  }

  /* Whole dollars for `voters` voters and a term of "1", "2", "3" (years) or "pass". Throws a plain sentence if not allowed. */
  function price(voters, term) {
    term = String(term);
    var why = check(voters, term);
    if (why) throw new RangeError(why);
    var base = Math.max(CONFIG.minimum, CONFIG.anchor_price * Math.pow(tier(voters) / CONFIG.anchor_voters, CONFIG.exponent));
    var total = term === "pass" ? base * CONFIG.pass.factor : base * Number(term) * CONFIG.year_factors[term];
    var step = CONFIG.round_to;
    return Math.max(step, Math.floor(total / step + 0.5) * step);
  }

  /* The licence's last day, as YYYY-MM-DD, for a licence issued on `issued` (a YYYY-MM-DD string). */
  function expiry(issued, term) {
    var p = issued.split("-").map(Number), d;
    if (String(term) === "pass") {
      d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + CONFIG.pass.days));
    } else {
      d = new Date(Date.UTC(p[0] + Number(term), p[1] - 1, p[2]));
      if (d.getUTCMonth() !== p[1] - 1) d = new Date(Date.UTC(p[0] + Number(term), p[1] - 1, 28));      // (29 February)
    }
    return d.toISOString().slice(0, 10);
  }

  function termName(term) {
    return String(term) === "pass" ? CONFIG.pass.days + "-day pass" : term + " year" + (String(term) === "1" ? "" : "s");
  }

  return { CONFIG: CONFIG, check: check, tier: tier, price: price, expiry: expiry, termName: termName };
});
