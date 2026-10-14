import { test } from "node:test";
import assert from "node:assert/strict";
import { applyQuery, ANY, type Query, type Rules } from "./list-query.ts";
import { buildExportTable } from "./list-export.ts";

type Row = {
  id: string;
  name: string;
  phone?: string;
  owed: number;
  date: string;
  kind: "a" | "b";
};

const rows: Row[] = [
  {
    id: "1",
    name: "Ahmad",
    phone: "012-336 9054",
    owed: 500,
    date: "2026-10-01",
    kind: "a",
  },
  { id: "2", name: "Siti", owed: 0, date: "2026-09-10", kind: "b" },
  {
    id: "3",
    name: "Zul",
    phone: "019 111 2222",
    owed: 1500,
    date: "2026-10-05",
    kind: "a",
  },
  { id: "4", name: "Ben", owed: 1500, date: "2026-08-01", kind: "b" },
];

const rules: Rules<Row> = {
  search: {
    fields: (r) => [r.name],
    phoneFields: (r) => [r.phone],
  },
  filters: [
    { id: "date", kind: "dateRange", value: (r) => r.date },
    { id: "owed", kind: "numberRange", value: (r) => r.owed },
    {
      id: "kind",
      kind: "select",
      options: { a: (r) => r.kind === "a", b: (r) => r.kind === "b" },
    },
  ],
  tabs: [
    { id: "all", match: () => true },
    { id: "owing", match: (r) => r.owed > 0 },
  ],
  compares: {
    name: (a, b) => a.name.localeCompare(b.name),
    owed: (a, b) => a.owed - b.owed,
  },
  tiebreak: (a, b) => a.name.localeCompare(b.name),
};

const base: Query = {
  q: "",
  tab: "all",
  sort: { key: "name", dir: "asc" },
  page: 1,
  pageSize: 10,
  filters: {},
};

const names = (rs: Row[]) => rs.map((r) => r.name);

test("no filters: everything, sorted", () => {
  const r = applyQuery(rows, rules, base);
  assert.deepEqual(names(r.filtered), ["Ahmad", "Ben", "Siti", "Zul"]);
});

test("search is plain text, and phone search ignores punctuation", () => {
  assert.deepEqual(
    names(applyQuery(rows, rules, { ...base, q: "ahm" }).filtered),
    ["Ahmad"],
  );
  assert.deepEqual(
    names(applyQuery(rows, rules, { ...base, q: "0123369054" }).filtered),
    ["Ahmad"],
  );
  assert.deepEqual(
    names(applyQuery(rows, rules, { ...base, q: "019 111" }).filtered),
    ["Zul"],
  );
  assert.deepEqual(
    applyQuery(rows, rules, { ...base, q: "nobody" }).filtered,
    [],
  );
});

test("date range is inclusive on both ends", () => {
  const r = applyQuery(rows, rules, {
    ...base,
    filters: {
      date: {
        kind: "dateRange",
        range: { from: "2026-10-01", to: "2026-10-05" },
      },
    },
  });
  assert.deepEqual(names(r.filtered), ["Ahmad", "Zul"]);
});

test("number range accepts one open end", () => {
  const r = applyQuery(rows, rules, {
    ...base,
    filters: { owed: { kind: "numberRange", min: 1000, max: null } },
  });
  assert.deepEqual(names(r.filtered), ["Ben", "Zul"]);
});

test("select: 'any' and unknown values match everything", () => {
  const any = applyQuery(rows, rules, {
    ...base,
    filters: { kind: { kind: "select", value: ANY } },
  });
  assert.equal(any.filtered.length, 4);
  const odd = applyQuery(rows, rules, {
    ...base,
    filters: { kind: { kind: "select", value: "zzz" } },
  });
  assert.equal(odd.filtered.length, 4);
  const a = applyQuery(rows, rules, {
    ...base,
    filters: { kind: { kind: "select", value: "a" } },
  });
  assert.deepEqual(names(a.filtered), ["Ahmad", "Zul"]);
});

test("tab counts follow search and filters; the tab picks one slice", () => {
  const r = applyQuery(rows, rules, { ...base, tab: "owing" });
  assert.equal(r.counts.all, 4);
  assert.equal(r.counts.owing, 3);
  assert.deepEqual(names(r.filtered), ["Ahmad", "Ben", "Zul"]);
  const narrowed = applyQuery(rows, rules, {
    ...base,
    filters: { kind: { kind: "select", value: "b" } },
  });
  assert.equal(narrowed.counts.all, 2);
  assert.equal(narrowed.counts.owing, 1);
});

test("sort uses the tiebreak on equal values", () => {
  const r = applyQuery(rows, rules, {
    ...base,
    sort: { key: "owed", dir: "desc" },
  });
  assert.deepEqual(names(r.filtered), ["Ben", "Zul", "Ahmad", "Siti"]);
});

test("paging clamps to the last page", () => {
  const r = applyQuery(rows, rules, { ...base, pageSize: 3, page: 9 });
  assert.equal(r.pages, 2);
  assert.equal(r.current, 2);
  assert.deepEqual(names(r.pageRows), ["Zul"]);
});

test("export table: one column list, totals add up", () => {
  const table = buildExportTable<Row>({
    columns: [
      {
        header: "Name",
        export: { kind: "text", value: (r) => r.name, width: 10 },
      },
      { header: "Actions" },
      {
        header: "Owed",
        export: {
          label: "Balance",
          kind: "money",
          value: (r) => r.owed,
          width: 8,
          total: "sum",
        },
      },
    ],
    rows,
    title: "Customers",
    subtitle: "x",
    footer: "f",
    totalLabel: "Total · 4",
  });
  assert.deepEqual(
    table.columns.map((c) => c.label),
    ["Name", "Balance"],
  );
  assert.deepEqual(table.rows[0], ["Ahmad", 500]);
  assert.deepEqual(table.totals, ["Total · 4", 3500]);
});

test("export table: no totals row when no column asks for one", () => {
  const table = buildExportTable<Row>({
    columns: [
      {
        header: "Name",
        export: { kind: "text", value: (r) => r.name, width: 10 },
      },
    ],
    rows,
    title: "t",
    subtitle: "s",
    footer: "f",
    totalLabel: "x",
  });
  assert.equal(table.totals, undefined);
});
