export type TemplateColumn = {
  key: string;
  sample: string | number | boolean;
};

export type ParsedTableRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type ParsedTable = {
  headers: string[];
  rows: ParsedTableRow[];
};

const XLSX_EXTENSIONS = new Set(["xlsx", "xls"]);
const CSV_EXTENSIONS = new Set(["csv"]);

export async function parseSpreadsheetFile(file: File): Promise<ParsedTable> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (CSV_EXTENSIONS.has(extension)) {
    return tableFromMatrix(parseCsvRows(await file.text()));
  }

  if (XLSX_EXTENSIONS.has(extension)) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("The workbook does not contain any sheets.");
    }

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
      blankrows: false,
      defval: "",
      header: 1,
      raw: false,
    });

    return tableFromMatrix(matrix);
  }

  throw new Error("Upload a .csv, .xlsx, or .xls file.");
}

export function validateTemplateColumns(headers: string[], templateColumns: TemplateColumn[]) {
  const expected = templateColumns.map((column) => column.key);
  const missing = expected.filter((column) => !headers.includes(column));
  const extra = headers.filter((column) => !expected.includes(column));

  if (missing.length > 0 || extra.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing: ${missing.join(", ")}`);
    if (extra.length > 0) parts.push(`extra: ${extra.join(", ")}`);

    throw new Error(
      `File columns must match the template exactly (${parts.join("; ")}). Expected: ${expected.join(", ")}.`,
    );
  }
}

export function downloadCsvTemplate(filename: string, columns: TemplateColumn[]) {
  const csv = [
    columns.map((column) => csvEscape(column.key)).join(","),
    columns.map((column) => csvEscape(String(column.sample))).join(","),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseBooleanCell(value: string, column: string, rowNumber: number) {
  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;

  throw new Error(`Row ${rowNumber}: ${column} must be true/false, yes/no, or 1/0.`);
}

export function parseNumberCell(value: string, column: string, rowNumber: number) {
  const normalized = value.trim();

  if (normalized === "") {
    throw new Error(`Row ${rowNumber}: ${column} is required.`);
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Row ${rowNumber}: ${column} must be a number.`);
  }

  return parsed;
}

export function readRequiredCell(
  values: Record<string, string>,
  column: string,
  rowNumber: number,
) {
  const value = values[column]?.trim() ?? "";

  if (value === "") {
    throw new Error(`Row ${rowNumber}: ${column} is required.`);
  }

  return value;
}

export function formatTemplateColumns(columns: TemplateColumn[]) {
  return columns.map((column) => column.key).join(", ");
}

function tableFromMatrix(matrix: unknown[][]): ParsedTable {
  const [rawHeaders, ...rawRows] = matrix;

  if (!rawHeaders) {
    throw new Error("The file is empty. Use the downloaded template headers.");
  }

  const headers = rawHeaders.map((header) => normalizeCell(header));
  const hasBlankHeader = headers.some((header) => header === "");

  if (hasBlankHeader) {
    throw new Error("The header row contains a blank column name.");
  }

  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader) {
    throw new Error(`The header row contains duplicate column "${duplicateHeader}".`);
  }

  const rows = rawRows
    .map((rawRow, index) => {
      const cells = rawRow.map((cell) => normalizeCell(cell));
      const rowNumber = index + 2;

      if (cells.length > headers.length && cells.slice(headers.length).some(Boolean)) {
        throw new Error(`Row ${rowNumber}: contains more values than the template columns.`);
      }

      const values = Object.fromEntries(
        headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""]),
      );

      return { rowNumber, values };
    })
    .filter((row) => Object.values(row.values).some((value) => value !== ""));

  if (rows.length === 0) {
    throw new Error("The file does not contain any input rows.");
  }

  return { headers, rows };
}

function normalizeCell(value: unknown) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushCell();
    } else if (char === "\r") {
      if (text[index + 1] === "\n") index += 1;
      pushRow();
    } else if (char === "\n") {
      pushRow();
    } else {
      cell += char;
    }
  }

  if (inQuotes) {
    throw new Error("The CSV file contains an unclosed quoted value.");
  }

  if (cell !== "" || row.length > 0) {
    pushRow();
  }

  return rows;
}

function csvEscape(value: string) {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
