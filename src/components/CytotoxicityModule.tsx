import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { Download, FileSpreadsheet, Loader2, Activity, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  predictCytotoxicity,
  METALS,
  LIGANDS,
  EXPOSURE_TIMES,
  CELL_TYPES,
  type CytotoxicityPayload,
  type CytotoxicityResponse,
} from "@/lib/mock-api";
import {
  downloadCsvTemplate,
  formatTemplateColumns,
  parseNumberCell,
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

const CYTOTOXICITY_TEMPLATE: TemplateColumn[] = [
  { key: "central_metal_atom", sample: "Zn" },
  { key: "organic_ligand", sample: "Bdc" },
  { key: "concentration", sample: 100 },
  { key: "size", sample: 150 },
  { key: "zeta_potential", sample: 0 },
  { key: "exposure_time", sample: 24 },
  { key: "cell_type", sample: "HeLa" },
];

type CytotoxicityBatchInput = {
  rowNumber: number;
  payload: CytotoxicityPayload;
  cellType: string;
};

type CytotoxicityBatchResult = CytotoxicityBatchInput & {
  cellViability: number;
  unit: CytotoxicityResponse["unit"];
};

function viabilityColor(v: number) {
  if (v > 80) return "bg-emerald-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function CytotoxicityModule({ onSaved }: Props) {
  const [metal, setMetal] = useState("Zn");
  const [ligand, setLigand] = useState("Bdc");
  const [concentration, setConcentration] = useState(100);
  const [size, setSize] = useState(150);
  const [zeta, setZeta] = useState(0);
  const [exposure, setExposure] = useState(24);
  const [cellType, setCellType] = useState("HeLa");
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [result, setResult] = useState<CytotoxicityResponse | null>(null);
  const [batchResults, setBatchResults] = useState<CytotoxicityBatchResult[]>([]);
  const busy = loading || batchLoading;

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setBatchResults([]);
    try {
      const res = await predictCytotoxicity({
        central_metal_atom: metal,
        organic_ligand: ligand,
        concentration,
        size,
        zeta_potential: zeta,
        exposure_time: exposure,
      });
      setResult(res);
      const { error } = await supabase.from("cytotoxicity_predictions").insert({
        central_metal_atom: metal,
        organic_ligand: ligand,
        concentration,
        size,
        zeta_potential: zeta,
        exposure_time: exposure,
        cell_type: cellType,
        predicted_cell_viability: res.cell_viability,
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
      const inputs = parseCytotoxicityRows(parsed);
      const predictions = await Promise.all(
        inputs.map(async (input) => {
          const response = await predictCytotoxicity(input.payload);
          return {
            ...input,
            cellViability: response.cell_viability,
            unit: response.unit,
          };
        }),
      );

      const { error } = await supabase.from("cytotoxicity_predictions").insert(
        predictions.map((prediction) => ({
          central_metal_atom: prediction.payload.central_metal_atom,
          organic_ligand: prediction.payload.organic_ligand,
          concentration: prediction.payload.concentration,
          size: prediction.payload.size,
          zeta_potential: prediction.payload.zeta_potential,
          exposure_time: prediction.payload.exposure_time,
          cell_type: prediction.cellType,
          predicted_cell_viability: prediction.cellViability,
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

  const impactData = result
    ? [
        {
          feature: "Concentration",
          impact: -(concentration / 500) * 70 - (concentration > 200 ? 20 : 0),
        },
        { feature: "Metal toxicity", impact: ["Zn", "Cu"].includes(metal) ? -15 : 0 },
        { feature: "Exposure", impact: -(exposure - 24) * 0.3 },
        { feature: "Zeta |V|", impact: -Math.abs(zeta) * 0.1 },
        { feature: "Size", impact: size < 50 ? -5 : 0 },
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Cytotoxicity Prediction
          </CardTitle>
          <CardDescription>
            Estimate cell viability (% of control) after MOF nanoparticle exposure.
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

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Concentration</Label>
              <span className="font-mono text-muted-foreground">{concentration} μg/ml</span>
            </div>
            <Slider
              value={[concentration]}
              min={0}
              max={500}
              step={5}
              onValueChange={(v) => setConcentration(v[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Size</Label>
              <span className="font-mono text-muted-foreground">{size} nm</span>
            </div>
            <Slider
              value={[size]}
              min={0}
              max={500}
              step={5}
              onValueChange={(v) => setSize(v[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Zeta potential</Label>
              <span className="font-mono text-muted-foreground">{zeta} mV</span>
            </div>
            <Slider
              value={[zeta]}
              min={-50}
              max={50}
              step={1}
              onValueChange={(v) => setZeta(v[0])}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Exposure time</Label>
              <Select value={String(exposure)} onValueChange={(v) => setExposure(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPOSURE_TIMES.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      {t}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cell type</Label>
              <Select value={cellType} onValueChange={setCellType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CELL_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Predict Cell Viability
              </>
            )}
          </Button>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <Label htmlFor="cytotoxicity-batch">Batch file</Label>
                <div className="text-xs text-muted-foreground">
                  Template columns: <code>{formatTemplateColumns(CYTOTOXICITY_TEMPLATE)}</code>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsvTemplate("cytotoxicity-template.csv", CYTOTOXICITY_TEMPLATE)
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
            <Input
              id="cytotoxicity-batch"
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
          <CardDescription>Cell viability and feature impact analysis.</CardDescription>
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
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/30 p-6">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Cell viability
                  </div>
                  <div className="text-4xl font-bold text-primary">
                    {result.cell_viability}
                    <span className="text-2xl">%</span>
                  </div>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${viabilityColor(result.cell_viability)}`}
                    style={{ width: `${result.cell_viability}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {result.cell_viability > 80
                    ? "Low toxicity"
                    : result.cell_viability >= 50
                      ? "Moderate toxicity"
                      : "High toxicity"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Feature Impact on Viability (%)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={impactData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {impactData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.impact < -10 ? "#ef4444" : d.impact < 0 ? "#f59e0b" : "#10b981"}
                        />
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
                    <TableHead>Conc.</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Cell</TableHead>
                    <TableHead className="text-right">Viability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchResults.map((prediction) => (
                    <TableRow key={prediction.rowNumber}>
                      <TableCell>{prediction.rowNumber}</TableCell>
                      <TableCell>{prediction.payload.central_metal_atom}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {prediction.payload.concentration} ug/ml
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {prediction.payload.exposure_time}h
                      </TableCell>
                      <TableCell className="text-xs">{prediction.cellType}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {prediction.cellViability.toFixed(1)}%
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

function parseCytotoxicityRows(parsed: ParsedTable): CytotoxicityBatchInput[] {
  validateTemplateColumns(parsed.headers, CYTOTOXICITY_TEMPLATE);

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
    const exposureTime = readNumberOption(
      parseNumberCell(values.exposure_time ?? "", "exposure_time", rowNumber),
      EXPOSURE_TIMES,
      "exposure_time",
      rowNumber,
    );
    const cellType = readOption(
      readRequiredCell(values, "cell_type", rowNumber),
      CELL_TYPES,
      "cell_type",
      rowNumber,
    );

    return {
      rowNumber,
      cellType,
      payload: {
        central_metal_atom: metal,
        organic_ligand: ligand,
        concentration: readBoundedNumber(
          values.concentration ?? "",
          "concentration",
          rowNumber,
          0,
          500,
        ),
        size: readBoundedNumber(values.size ?? "", "size", rowNumber, 0, 500),
        zeta_potential: readBoundedNumber(
          values.zeta_potential ?? "",
          "zeta_potential",
          rowNumber,
          -50,
          50,
        ),
        exposure_time: exposureTime,
      },
    };
  });
}

function readBoundedNumber(
  value: string,
  column: string,
  rowNumber: number,
  min: number,
  max: number,
) {
  const parsed = parseNumberCell(value, column, rowNumber);

  if (parsed < min || parsed > max) {
    throw new Error(`Row ${rowNumber}: ${column} must be between ${min} and ${max}.`);
  }

  return parsed;
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

function readNumberOption<T extends number>(
  value: number,
  options: readonly T[],
  column: string,
  rowNumber: number,
) {
  if (options.includes(value as T)) return value as T;

  throw new Error(`Row ${rowNumber}: ${column} must be one of ${options.join(", ")}.`);
}
