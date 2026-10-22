// Run with:  node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pricing = require("../js/pricing.js");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "price_vectors.json"), "utf8"));

test("the website's prices equal the program's price tool, for every shared example", () => {
  for (const v of data.vectors) assert.equal(pricing.price(v.voters, v.term), v.price, JSON.stringify(v));
});
test("the website's settings equal tools/pricing.json", () => {
  assert.deepEqual(pricing.CONFIG, data.config);
});
test("limits are explained in plain words", () => {
  assert.throws(() => pricing.price(50, "1"), /free version/);
  assert.equal(pricing.tier(51), 100); assert.equal(pricing.tier(251), 500); assert.equal(pricing.tier(5000), 5000);
  assert.throws(() => pricing.price(5001, "1"), /quote/);
  assert.throws(() => pricing.price(100, "9"), /Choose/);
  assert.throws(() => pricing.price(100.5, "1"), /free version|more than/);
});
test("expiry dates", () => {
  assert.equal(pricing.expiry("2026-10-15", "1"), "2027-10-15");
  assert.equal(pricing.expiry("2026-10-15", "3"), "2029-10-15");
  assert.equal(pricing.expiry("2028-02-29", "1"), "2029-02-28");
  assert.equal(pricing.expiry("2026-10-15", "pass"), "2026-11-14");
});
