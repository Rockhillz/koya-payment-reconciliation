// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js
import fs from "fs";

function parseAmount(raw) {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return Number(raw.replace(/[,\s]/g, ""));
  return NaN;
}

const latest = new Map();

for (const line of fs.readFileSync("payments.jsonl", "utf8").split("\n")) {
  if (line.trim() === "") continue;
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }
  if (event === null || typeof event !== "object") continue;
  if (typeof event.txn_id !== "string" || event.txn_id === "") continue;

  const prev = latest.get(event.txn_id);
  if (!prev || String(event.ts) >= String(prev.ts)) latest.set(event.txn_id, event);
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
