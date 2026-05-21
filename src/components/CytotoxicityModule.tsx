import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Activity, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  predictCytotoxicity, METALS, LIGANDS, EXPOSURE_TIMES, CELL_TYPES,
  type CytotoxicityResponse,
} from "@/lib/mock-api";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

interface Props {
  onSaved?: () => void;
}

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
  const [result, setResult] = useState<CytotoxicityResponse | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await predictCytotoxicity({
        central_metal_atom: metal,
        organic_ligand: ligand,
        concentration, size, zeta_potential: zeta, exposure_time: exposure,
      });
      setResult(res);
      const { error } = await supabase
        .from("cytotoxicity_predictions")
        .insert({
          central_metal_atom: metal,
          organic_ligand: ligand,
          concentration, size, zeta_potential: zeta,
          exposure_time: exposure, cell_type: cellType,
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

  const impactData = result
    ? [
        { feature: "Concentration", impact: -(concentration / 500) * 70 - (concentration > 200 ? 20 : 0) },
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organic ligand</Label>
              <Select value={ligand} onValueChange={setLigand}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIGANDS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Concentration</Label>
              <span className="font-mono text-muted-foreground">{concentration} μg/ml</span>
            </div>
            <Slider value={[concentration]} min={0} max={500} step={5}
              onValueChange={(v) => setConcentration(v[0])} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Size</Label>
              <span className="font-mono text-muted-foreground">{size} nm</span>
            </div>
            <Slider value={[size]} min={0} max={500} step={5}
              onValueChange={(v) => setSize(v[0])} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Zeta potential</Label>
              <span className="font-mono text-muted-foreground">{zeta} mV</span>
            </div>
            <Slider value={[zeta]} min={-50} max={50} step={1}
              onValueChange={(v) => setZeta(v[0])} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Exposure time</Label>
              <Select value={String(exposure)} onValueChange={(v) => setExposure(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPOSURE_TIMES.map((t) => <SelectItem key={t} value={String(t)}>{t}h</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cell type</Label>
              <Select value={cellType} onValueChange={setCellType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CELL_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handlePredict} disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Predicting…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Predict Cell Viability</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Result</CardTitle>
          <CardDescription>Cell viability and feature impact analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          {!result && !loading && (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Run a prediction to see results.
            </div>
          )}
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {result && !loading && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/30 p-6">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Cell viability
                  </div>
                  <div className="text-4xl font-bold text-primary">
                    {result.cell_viability}<span className="text-2xl">%</span>
                  </div>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${viabilityColor(result.cell_viability)}`}
                    style={{ width: `${result.cell_viability}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {result.cell_viability > 80 ? "Low toxicity" :
                   result.cell_viability >= 50 ? "Moderate toxicity" : "High toxicity"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Feature Impact on Viability (%)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={impactData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                    <Tooltip />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {impactData.map((d, i) => (
                        <Cell key={i} fill={d.impact < -10 ? "#ef4444" : d.impact < 0 ? "#f59e0b" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}