import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BatchRankingTable } from "@/components/BatchRankingTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseBatchFile } from "@/lib/batch-parser";
import {
  batchRequiredColumns,
  buildBatchRanking,
  type BatchParseResult,
  type BatchRankingRow,
  type FormulationInput,
} from "@/lib/formulation";

type BatchUploadViewProps = {
  input: FormulationInput;
};

const templateRows = [
  {
    payload: "Doxorubicin",
    targetPh: 6.5,
    metalNode: "Zr4+",
    linker: "2-aminoterephthalate",
    surfaceArea: 1120,
    poreVolume: 0.46,
    poreSize: 0.8,
  },
  {
    payload: "Curcumin",
    targetPh: 6.2,
    metalNode: "Fe3+",
    linker: "terephthalate",
    surfaceArea: 2850,
    poreVolume: 1.25,
    poreSize: 2.9,
  },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadCsvTemplate() {
  const rows = [
    batchRequiredColumns.join(","),
    ...templateRows.map((row) =>
      batchRequiredColumns.map((column) => String(row[column as keyof typeof row])).join(","),
    ),
  ];

  downloadBlob(
    new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
    "batch-template.csv",
  );
}

function downloadXlsxTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(templateRows, { header: batchRequiredColumns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Input");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "batch-template.xlsx",
  );
}

export function BatchUploadView({ input }: BatchUploadViewProps) {
  const [parseResult, setParseResult] = useState<BatchParseResult | null>(null);
  const [rankedRows, setRankedRows] = useState<BatchRankingRow[]>([]);
  const previewRows = useMemo(() => parseResult?.rows.slice(0, 8) ?? [], [parseResult]);

  async function handleFile(file: File) {
    try {
      const result = await parseBatchFile(file);
      setParseResult(result);
      setRankedRows([]);
      toast.success(`Loaded ${result.rows.length} rows from ${file.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to parse file.";
      toast.error(message);
    }
  }

  function runBatch() {
    if (!parseResult?.rows.length) return;
    setRankedRows(buildBatchRanking(input, parseResult.rows));
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-md">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Batch Processing</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadCsvTemplate}>
                <Download className="h-4 w-4" />
                CSV Template
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadXlsxTemplate}>
                <Download className="h-4 w-4" />
                XLSX Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 p-6 text-center transition hover:bg-muted/50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
          >
            <UploadCloud className="mb-3 h-8 w-8 text-primary" />
            <span className="text-sm font-medium">Drop CSV/XLSX file or select from disk</span>
            <span className="mt-1 text-xs text-muted-foreground">
              Expected columns: {batchRequiredColumns.join(", ")}
            </span>
            <input
              className="sr-only"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          {parseResult?.missingColumns.length ? (
            <Alert variant="destructive">
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>Column mapping needs review</AlertTitle>
              <AlertDescription>
                Missing columns: {parseResult.missingColumns.join(", ")}. Preview still loads, but
                batch ranking will fall back to sidebar defaults for missing values.
              </AlertDescription>
            </Alert>
          ) : null}

          {parseResult && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Parsed {parseResult.rows.length} rows and {parseResult.columns.length} columns.
              </p>
              <Button type="button" onClick={runBatch} disabled={!parseResult.rows.length}>
                Run Batch Ranking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {previewRows.length > 0 && parseResult && (
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {parseResult.columns.slice(0, 8).map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    {parseResult.columns.slice(0, 8).map((column) => (
                      <TableCell key={column}>{String(row[column] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {rankedRows.length > 0 && (
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Batch Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <BatchRankingTable rows={rankedRows} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
