import * as XLSX from "xlsx";

import { batchRequiredColumns, type BatchPreview } from "@/lib/formulation";

export type BatchParseResult = BatchPreview & {
  missingColumns: string[];
};

export async function parseBatchFile(file: File): Promise<BatchParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["csv", "xlsx", "xls"].includes(extension)) {
    throw new Error("Upload a .csv, .xlsx, or .xls file.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error("The file does not contain any sheets.");
  }

  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const normalizedColumns = new Set(columns.map((column) => column.trim().toLowerCase()));
  const missingColumns = batchRequiredColumns.filter(
    (column) => !normalizedColumns.has(column.toLowerCase()),
  );

  return {
    columns,
    rows,
    missingColumns,
  };
}
