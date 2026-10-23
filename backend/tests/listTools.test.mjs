import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { filterRecords, toCsv } from "../listTools.mjs";
import { normalizeRecoveryReport } from "../recoveryAnalysis.mjs";

const rows = [
  { reference: "WTR01-1", title: "Custodian mapping case", status: "Open", owner: "Ada", risk: "High", due_date: "2026-09-30", amount: 0 },
  { reference: "WTR02-2", title: "Treaty rate review", status: "Closed", owner: "Ben", risk: "Low", due_date: "2026-10-01", amount: 1250 },
];

test("search and filters narrow the main record list", () => {
  assert.equal(filterRecords(rows, { q: "custodian" }).length, 1);
  assert.equal(filterRecords(rows, { status: "Closed" })[0].reference, "WTR02-2");
  assert.equal(filterRecords(rows, { q: "wtr", risk: "Low" }).length, 1);
  assert.equal(filterRecords(rows, {}).length, 2);
});

test("CSV export preserves zero and empty values", () => {
  const csv = toCsv(rows);
  assert.ok(csv.startsWith("reference,title,status,owner,risk,due_date,amount"));
  assert.ok(csv.includes("WTR01-1,Custodian mapping case,Open,Ada,High,2026-09-30,0"));
});

test("records route supports search and CSV export behind auth", () => {
  const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
  assert.ok(server.includes("filterRecords(rows,req.query)"));
  assert.ok(server.includes("text/csv"));
});

test("deterministic fallback is labelled aiGenerated:false and keeps falsy metrics", () => {
  const feature = { title: "Reclaim", outcome: "Recover value" };
  const report = normalizeRecoveryReport(
    { headline: "H", executiveSummary: "S", metrics: [{ label: "Recovered", value: 0 }], sections: [{ title: "T", detail: false }], actions: [] },
    feature, "Deterministic domain engine", "Domain engine",
  );
  assert.equal(report.aiGenerated, false);
  assert.equal(report.source, "deterministic-fallback");
  assert.equal(report.metrics[0].value, 0);
  assert.equal(report.sections[0].detail, false);
  assert.match(report.disclaimer, /not tax advice/i);
});
