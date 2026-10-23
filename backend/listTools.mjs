// Pure list helpers for feature records: search/filter + export.
// No I/O here so the offline tests never touch the database or a provider.

export const RECORD_EXPORT_COLUMNS = ["reference", "title", "status", "owner", "risk", "due_date", "amount"];

export function filterRecords(rows, { q = "", status = "", risk = "" } = {}) {
  const needle = String(q || "").trim().toLowerCase();
  return (rows || []).filter((row) => {
    if (status && row.status !== status) return false;
    if (risk && row.risk !== risk) return false;
    if (!needle) return true;
    return [row.reference, row.title, row.status, row.owner, row.risk]
      .some((value) => String(value ?? "").toLowerCase().includes(needle));
  });
}

export function toCsv(rows, columns = RECORD_EXPORT_COLUMNS) {
  const esc = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.join(","), ...(rows || []).map((row) => columns.map((col) => esc(row[col])).join(","))].join("\n");
}
