import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, FlaskConical, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  predictDrugLoading, METALS, LIGANDS,
  type DrugLoadingResponse,
} from "@/lib/mock-api";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

interface Props {
  onSaved?: () => void;
}

export function DrugLoadingModule({ onSaved }: Props) {
  const [metal, setMetal] = useState<string>("Zn");
  const [ligand, setLigand] = useState<string>("Bdc");
  const [bit148, setBit148] = useState(false);
  const [bit223, setBit223] = useState(false);
  const [bit657, setBit657] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrugLoadingResponse | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await predictDrugLoading({
        central_metal_atom: metal, organic_ligand: ligand,
        bit148, bit223, bit657,
      });
      setResult(res);
      const { error } = await supabase
        .from("drug_loading_predictions")
        .insert({
          central_metal_atom: metal,
          organic_ligand: ligand,
          bit148, bit223, bit657,
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

  // Feature impact (mock SHAP)
  const featureData = result
    ? [
        { feature: "Metal", impact: ["Cr", "Mg"].includes(metal) ? 0.10 : 0.02 },
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
            Predict the drug loading (g/g) of a MOF based on its composition and Morgan
            fingerprint features.
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

          <Button onClick={handlePredict} disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Predicting…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Predict Loading Capacity</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Result</CardTitle>
          <CardDescription>Loading capacity and feature impact analysis.</CardDescription>
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
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/30 p-6 text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Predicted Loading Capacity
                </div>
                <div className="mt-2 text-5xl font-bold text-primary">
                  {result.loading_capacity}
                </div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">
                  {result.unit}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Feature Impact (mock SHAP)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={featureData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
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
        </CardContent>
      </Card>
    </div>
  );
}