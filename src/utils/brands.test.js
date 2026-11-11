// Run with: npm test
// Sample descriptions are sanitized examples, not real records.

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  BRANDS,
  findBrand,
  logoBox,
} from "./brands.js";


const brandId = (description) =>
  findBrand(description)?.id ?? null;


function expectBrand(cases) {

  for (const [description, expected] of cases) {

    assert.equal(
      brandId(description),
      expected,
      `"${description}" should be ${expected ?? "no brand"}`
    );

  }

}


test("sample descriptions match the right brand", () => {

  expectBrand([
    ["Walmart: quest shake, 2 yogurts (pumpkin)", "walmart"],
    ["Walmart (dessert): strawberries, 4 yogurts", "walmart"],
    ["Hannaford: Fresh broccoli, goodles", "hannaford"],
    ["Haniford: groceries", "hannaford"],
    ["Trader joes: pumpkin bagels", "traderjoes"],
    ["Chik fila: engagement dinner", "chickfila"],
    ["Chik fil a", "chickfila"],
    ["Dominoes (paid friend late w/ tip)", "dominos"],
    ["Domino's Pizza", "dominos"],
    ["Dunks: PSL, wake up wrap", "dunkin"],
    ["Protein Latte Dunks", "dunkin"],
    ["5 below: Tote bag, smoko keychain", "fivebelow"],
    ["Five below: Ghost + liquid death", "fivebelow"],
    ["Tjmaxx (hairbrush, sunscreen, makeup, Nike socks)", "tjmaxx"],
    ["Platoes: Brown pants, bear bag", "platoscloset"],
    ["Hollister demon slayer t shirt", "hollister"],
    ["Claude Code", "claude"],
    ["Gatorade (28 pack)", "gatorade"],
    ["David bars", "david"],
    ["Realgood Chicken meatballs", "realgood"],
    ["V8 cherry lime", "v8"],
    ["Starbucks + Taco bell", "starbucks"],
    ["Target: lamp, magnets", "target"],
    ["Savers: vest, book", "savers"],
    ["Miniso: car freshener", "miniso"],
    ["Olive garden: gnocchi", "olivegarden"],
    ["Wendys: Jr cheeseburger", "wendys"],
    ["Chipotle", "chipotle"],
    ["Texas roadhouse", "texasroadhouse"],
    ["Marshalls: tote, shirt", "marshalls"],
  ]);

});


test("vague descriptions do not invent a merchant", () => {

  expectBrand([
    ["Cafe", null],
    ["Cafe: small latte, banana muffin", null],
    ["Groceries", null],
    ["Groceries: yogurt, sugar free jello", null],
    ["Mall: Brown knit sweater", null],
    ["Running shoes", null],
    ["Cake pop", null],
    ["Birthday present", null],
    ["Ren fair", null],
    ["Ren fair: Turkey Leg", null],
    ["Stickers (dunkie junkie etc)", null],
    ["Seafood boil + Baja blast", null],
    ["Ark coffee", null],
    ["Ark smores coffee", null],
    ["Emmas", null],
    ["Friends Birthday: Board & Brews", null],
    ["", null],
    [undefined, null],
  ]);

});


test("aliases from the request", () => {

  expectBrand([
    ["Trader Joe's", "traderjoes"],
    ["Trader Joe’s", "traderjoes"],
    ["Trader Joes", "traderjoes"],
    ["Hannaford", "hannaford"],
    ["Wendy's", "wendys"],
    ["Wendy’s", "wendys"],
    ["chikfila", "chickfila"],
    ["chickfila", "chickfila"],
    ["Chick fil a", "chickfila"],
    ["Chick-fil-A", "chickfila"],
    ["Dominos", "dominos"],
    ["Domino’s Pizza", "dominos"],
    ["Dunkin", "dunkin"],
    ["Dunkin'", "dunkin"],
    ["Dunkin Donuts", "dunkin"],
    ["Fivebelow", "fivebelow"],
    ["TJ Maxx", "tjmaxx"],
    ["T.J. Maxx", "tjmaxx"],
    ["Plato's Closet", "platoscloset"],
    ["Platos Closet", "platoscloset"],
    ["Claude", "claude"],
    ["Anthropic", "claude"],
  ]);

});


test("case, punctuation and whitespace variations", () => {

  expectBrand([
    ["  hANNAford  : milk", "hannaford"],
    ["WALMART:stuff", "walmart"],
    ["walmart(meals): chicken", "walmart"],
    ["Wal-Mart: socks", "walmart"],
    ["Chick - fil - A: nuggets", "chickfila"],
    ["Stop & Shop: bread", "stopandshop"],
    ["Stop and Shop", "stopandshop"],
    ["H&M: jeans", "hm"],
    ["Disney+", "disneyplus"],
    ["Bath & Body Works: candle", "bathandbodyworks"],
    ["7-Eleven: slurpee", "seveneleven"],
    ["Groceries from Costco", "costco"],
  ]);

});


test("merchant wins over product, first merchant wins, specific wins", () => {

  expectBrand([
    // Merchant at the start beats the product brand later on.
    ["Tjmaxx (Nike socks)", "tjmaxx"],
    ["Target: Gatorade, chips", "target"],
    // A merchant later in the text still beats a product.
    ["Nike socks from Marshalls", "marshalls"],
    // Product only when no merchant.
    ["Nike socks", "nike"],
    ["Scar treatment + v8 (cherry lime)", "v8"],
    ["Goodles", "goodles"],
    ["Hannaford: broccoli, goodles", "hannaford"],
    // Two merchants: the first mentioned.
    ["Taco bell + Starbucks", "tacobell"],
    // Overlapping aliases: the more specific one.
    ["Uber Eats: dinner", "ubereats"],
    ["Uber to airport", "uber"],
    ["Amazon Prime", "amazonprime"],
    ["Amazon: charger", "amazon"],
    ["HBO Max", "hbomax"],
  ]);

});


test("ambiguous names only count as the merchant part", () => {

  expectBrand([
    ["Target", "target"],
    ["Target (birthday): card", "target"],
    ["Target practice arrows", null],
    ["Shell: gas", "shell"],
    ["Shell necklace", null],
    ["Gap: jeans", "gap"],
    ["Gap year savings", null],
    ["Max", "hbomax"],
    ["Max protein bar", null],
    ["Apple pie", null],
    ["Chipotle mayo", null],
    ["Subway: footlong", "subway"],
    ["Subway fare", null],
    ["Staples: printer ink", "staples"],
    ["Pantry staples", null],
    ["Steam: game", "steam"],
    ["Steamed buns", null],
    ["Claude's birthday gift", null],
    ["Michaels: yarn", "michaels"],
    ["Goodwill: jacket", "goodwill"],
    ["David's birthday", null],
    ["Real good day", null],
  ]);

});


test("every brand has a unique id and a bundled logo", () => {

  const ids =
    BRANDS.map((brand) => brand.id);

  assert.equal(new Set(ids).size, ids.length, "duplicate brand id");

  const logoDir =
    new URL("../assets/brands/", import.meta.url);

  const logoIds =
    new Set(
      fs.readdirSync(logoDir)
        .filter((file) => /\.(png|svg)$/.test(file))
        .map((file) => file.replace(/\.(png|svg)$/, ""))
    );

  for (const id of ids) {
    assert.ok(logoIds.has(id), `missing logo for ${id}`);
  }

  for (const id of logoIds) {
    assert.ok(ids.includes(id), `logo ${id} has no registry entry`);
  }

});


test("logo sizing keeps area even and stays inside the chip", () => {

  const pct = (box) => [parseFloat(box.width), parseFloat(box.height)];

  assert.deepEqual(pct(logoBox(1)), [65, 65]);

  // A 3:2 logo gets the same area as a square one.
  const [w2, h2] = pct(logoBox(1.5));
  assert.ok(Math.abs(w2 * h2 - 65 * 65) < 10);

  // Very wide and very tall logos hit the caps, ratio intact.
  const [w10, h10] = pct(logoBox(10));
  assert.equal(w10, 86);
  assert.ok(Math.abs(w10 / h10 - 10) < 0.1);
  assert.equal(pct(logoBox(0.3))[1], 72);

  assert.deepEqual(pct(logoBox(1, 0.9)), [58.5, 58.5]);

});
