const catalog = require("../src/data/catalog.json");
const prices = require("../src/data/prices.json");
const brickset = require("../.cache/brickset-prices.json");

const unmatched = catalog.filter(c => !(c.id in prices));
console.log("Unmatched:", unmatched.length, "/", catalog.length);
console.log();

console.log("=== SAMPLE UNMATCHED CATALOG NAMES ===");
unmatched.slice(0, 20).forEach(c => console.log(c.id, "|", c.name));
console.log();

// For 10 samples, find best Brickset match
console.log("=== CLOSEST BRICKSET MATCHES ===");
for (const s of unmatched.slice(0, 15)) {
  const words = s.name.toLowerCase().split(/[\s,()/-]+/).filter(w => w.length > 2);
  let bestMatch = "";
  let bestScore = 0;
  for (const b of brickset) {
    const bwords = b.name.toLowerCase().split(/[\s,()/-]+/).filter(w => w.length > 2);
    let shared = 0;
    for (const w of words) { if (bwords.includes(w)) shared++; }
    const score = words.length > 0 ? shared / Math.max(words.length, bwords.length) : 0;
    if (score > bestScore) { bestScore = score; bestMatch = b.bricklinkId + " | " + b.name; }
  }
  console.log("CATALOG:", s.name);
  console.log("BEST   :", bestMatch, "(score:", bestScore.toFixed(2), ")");
  console.log();
}

// Also check: are there brickset entries with NO catalog match?
const matchedBricksetIds = new Set(Object.values(prices).map(p => p.bricklinkId));
const unmatchedBrickset = brickset.filter(b => !matchedBricksetIds.has(b.bricklinkId));
console.log("Brickset entries not matched to catalog:", unmatchedBrickset.length, "/", brickset.length);
