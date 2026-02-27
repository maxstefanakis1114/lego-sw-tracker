const fs = require("fs");
const prices = require("../src/data/prices.json");
const catalog = require("../src/data/catalog.json");

// Updated Feb 2026 - Wampa ~$54 new, ~$40 used; Porgs ~$15-20 new, ~$10-12 used
const fixes = {
  "fig-003838": { valueNew: 53.74, valueUsed: 38.00, bricklinkId: "wampa" },
  "fig-011198": { valueNew: 53.74, valueUsed: 38.00, bricklinkId: "wampa" },
  "fig-014399": { valueNew: 18.00, valueUsed: 12.00, bricklinkId: "porg06" },
  "fig-014402": { valueNew: 15.00, valueUsed: 10.00, bricklinkId: "porg03" },
  "fig-014403": { valueNew: 20.00, valueUsed: 14.00, bricklinkId: "porg02" },
  "fig-014404": { valueNew: 15.00, valueUsed: 10.00, bricklinkId: "porg01" },
};

for (const [id, data] of Object.entries(fixes)) {
  prices[id] = Object.assign({}, prices[id], data);
}

fs.writeFileSync("./src/data/prices.json", JSON.stringify(prices));

// Verify
let withPrices = 0;
let noPrices = 0;
for (const c of catalog) {
  const p = prices[c.id];
  if (p && (p.valueUsed != null || p.valueNew != null)) {
    withPrices++;
  } else {
    noPrices++;
    console.log("Missing: " + c.id + " | " + c.name);
  }
}
console.log("\nPrices: " + withPrices + " / " + catalog.length + " (" + ((withPrices / catalog.length) * 100).toFixed(1) + "%)");
