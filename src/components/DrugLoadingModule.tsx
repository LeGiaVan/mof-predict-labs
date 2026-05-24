import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2, FlaskConical, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  predictDrugLoading,
  METALS,
  LIGANDS,
  type DrugLoadingPayload,
  type DrugLoadingResponse,
} from "@/lib/mock-api";
import {
  downloadCsvTemplate,
  formatTemplateColumns,
  parseBooleanCell,
  parseSpreadsheetFile,
  readRequiredCell,
  validateTemplateColumns,
  type ParsedTable,
  type TemplateColumn,
} from "@/lib/batch-input";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface Props {
  onSaved?: () => void;
}

const DRUG_LOADING_TEMPLATE: TemplateColumn[] = [
  { key: "central_metal_atom", sample: "Zn" },
  { key: "organic_ligand", sample: "Bdc" },
  { key: "bit148", sample: false },
  { key: "bit223", sample: false },
  { key: "bit657", sample: true },
];

type DrugLoadingBatchInput = {
  rowNumber: number;
  payload: DrugLoadingPayload;
};

type DrugLoadingBatchResult = DrugLoadingBatchInput & {
  loadingCapacity: number;
  unit: DrugLoadingResponse["unit"];
};

export function DrugLoadingModule({ onSaved }: Props) {
  const [metal, setMetal] = useState<string>("Zn");
  const [ligand, setLigand] = useState<string>("Bdc");
  const [bit148, setBit148] = useState(false);
  const [bit223, setBit223] = useState(false);
  const [bit657, setBit657] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [result, setResult] = useState<DrugLoadingResponse | null>(null);
  const [batchResults, setBatchResults] = useState<DrugLoadingBatchResult[]>([]);
  const busy = loading || batchLoading;

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setBatchResults([]);
    try {
      const res = await predictDrugLoading({
        central_metal_atom: metal,
        organic_ligand: ligand,
        bit148,
        bit223,
        bit657,
      });
      setResult(res);
      const { error } = await supabase.from("drug_loading_predictions").insert({
        central_metal_atom: metal,
        organic_ligand: ligand,
        bit148,
        bit223,
        bit657,
        predicted_loading_capacity: res.loading_capacity,
      });
      if (error) throw error;
      toast.success("Prediction saved to history");
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPredict = async () => {
    if (!batchFile) {
      toast.error("Choose a CSV or Excel file first");
      return;
    }

    setBatchLoading(true);
    setResult(null);
    setBatchResults([]);

    try {
      const parsed = await parseSpreadsheetFile(batchFile);
      const inputs = parseDrugLoadingRows(parsed);
      const predictions = await Promise.all(
        inputs.map(async (input) => {
          const response = await predictDrugLoading(input.payload);
          return {
            ...input,
            loadingCapacity: response.loading_capacity,
            unit: response.unit,
          };
        }),
      );

      const { error } = await supabase.from("drug_loading_predictions").insert(
        predictions.map((prediction) => ({
          central_metal_atom: prediction.payload.central_metal_atom,
          organic_ligand: prediction.payload.organic_ligand,
          bit148: prediction.payload.bit148,
          bit223: prediction.payload.bit223,
          bit657: prediction.payload.bit657,
          predicted_loading_capacity: prediction.loadingCapacity,
        })),
      );

      if (error) throw error;

      setBatchResults(predictions);
      toast.success(`${predictions.length} prediction(s) saved to history`);
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Batch prediction failed");
    } finally {
      setBatchLoading(false);
    }
  };

  // Feature impact (mock SHAP)
  const featureData = result
    ? [
        { feature: "Metal", impact: ["Cr", "Mg"].includes(metal) ? 0.1 : 0.02 },
        { feature: "Ligand", impact: ligand === "Dio" ? 0.08 : 0.03 },
        { feature: "Bit 148", impact: bit148 ? 0.04 : 0 },
        { feature: "Bit 223", impact: bit223 ? 0.03 : 0 },
        { feature: "Bit 657", impact: bit657 ? 0.02 : 0 },
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Drug Loading Capacity
          </CardTitle>
          <CardDescription>
            Predict the drug loading (g/g) of a MOF based on its composition and Morgan fingerprint
            features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Central metal atom</Label>
              <Select value={metal} onValueChange={setMetal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METALS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organic ligand</Label>
              <Select value={ligand} onValueChange={setLigand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIGANDS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Morgan Fingerprints</Label>
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={bit148} onCheckedChange={(c) => setBit148(!!c)} />
                Contains Amino group (Bit 148)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={bit223} onCheckedChange={(c) => setBit223(!!c)} />
                Contains Hydroxyl group (Bit 223)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={bit657} onCheckedChange={(c) => setBit657(!!c)} />
                Bit 657
              </label>
            </div>
          </div>

          <Button onClick={handlePredict} disabled={busy} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Predicting…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Predict Loading Capacity
              </>
            )}
          </Button>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <Label htmlFor="drug-loading-batch">Batch file</Label>
                <div className="text-xs text-muted-foreground">
                  Template columns: <code>{formatTemplateColumns(DRUG_LOADING_TEMPLATE)}</code>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsvTemplate("drug-loading-template.csv", DRUG_LOADING_TEMPLATE)
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
            <Input
              id="drug-loading-batch"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setBatchFile(event.target.files?.[0] ?? null)}
            />
            <Button onClick={handleBatchPredict} disabled={busy || !batchFile} className="w-full">
              {batchLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting batch...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Predict Batch File
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Result</CardTitle>
          <CardDescription>Loading capacity and feature impact analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          {!result && batchResults.length === 0 && !busy && (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Run a prediction to see results.
            </div>
          )}
          {busy && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {result && !busy && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/30 p-6 text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Predicted Loading Capacity
                </div>
                <div className="mt-2 text-5xl font-bold text-primary">
                  {result.loading_capacity}
                </div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{result.unit}</div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Feature Impact (mock SHAP)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={featureData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={70}
                    />
                    <Tooltip />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {featureData.map((_, i) => (
                        <Cell key={i} fill="var(--color-primary)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {batchResults.length > 0 && !busy && (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Batch results</div>
                <div className="text-xs text-muted-foreground">
                  {batchResults.length} prediction(s) from the uploaded file.
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>Ligand</TableHead>
                    <TableHead>Bits</TableHead>
                    <TableHead className="text-right">Loading (g/g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchResults.map((prediction) => (
                    <TableRow key={prediction.rowNumber}>
                      <TableCell>{prediction.rowNumber}</TableCell>
                      <TableCell>{prediction.payload.central_metal_atom}</TableCell>
                      <TableCell>{prediction.payload.organic_ligand}</TableCell>
                      <TableCell className="text-xs">
                        {[
                          prediction.payload.bit148 && "148",
                          prediction.payload.bit223 && "223",
                          prediction.payload.bit657 && "657",
                        ]
                          .filter(Boolean)
                          .join(", ") || "none"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {prediction.loadingCapacity.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function parseDrugLoadingRows(parsed: ParsedTable): DrugLoadingBatchInput[] {
  validateTemplateColumns(parsed.headers, DRUG_LOADING_TEMPLATE);

  return parsed.rows.map(({ rowNumber, values }) => {
    const metal = readOption(
      readRequiredCell(values, "central_metal_atom", rowNumber),
      METALS,
      "central_metal_atom",
      rowNumber,
    );
    const ligand = readOption(
      readRequiredCell(values, "organic_ligand", rowNumber),
      LIGANDS,
      "organic_ligand",
      rowNumber,
    );

    return {
      rowNumber,
      payload: {
        central_metal_atom: metal,
        organic_ligand: ligand,
        bit148: parseBooleanCell(values.bit148 ?? "", "bit148", rowNumber),
        bit223: parseBooleanCell(values.bit223 ?? "", "bit223", rowNumber),
        bit657: parseBooleanCell(values.bit657 ?? "", "bit657", rowNumber),
      },
    };
  });
}

function readOption<T extends string>(
  value: string,
  options: readonly T[],
  column: string,
  rowNumber: number,
) {
  if (options.includes(value as T)) return value as T;

  throw new Error(`Row ${rowNumber}: ${column} must be one of ${options.join(", ")}.`);
}
