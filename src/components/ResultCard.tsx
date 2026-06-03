import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Recommendation } from "@/lib/formulation";

type ResultCardProps = {
  result: Recommendation;
  targetPh: number;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function ResultCard({ result, targetPh }: ResultCardProps) {
  return (
    <Card className="rounded-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Rank #{result.rank}</Badge>
              {result.pareto && <Badge className="bg-emerald-600 text-white">Pareto</Badge>}
              {result.burstRelease && (
                <Badge className="border-orange-200 bg-orange-100 text-orange-800">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Burst Release
                </Badge>
              )}
            </div>
            <CardTitle className="mt-3 text-lg">{result.mof}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {result.metalNode} node / {result.linker}
            </p>
          </div>
          <div className="min-w-20 text-right">
            <p className="text-2xl font-bold text-primary">{result.match}%</p>
            <p className="text-xs text-muted-foreground">Match</p>
          </div>
        </div>
        <Progress value={result.match} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric label="Pred. Loading" value={`${result.predictedLoading}%`} />
          <Metric
            label={`Release pH ${targetPh.toFixed(1)}`}
            value={`${result.releaseAtTargetPh}%`}
          />
          <Metric label="Cell Viability" value={`${result.targetCellViability}%`} />
          <Metric label="Bioavail." value={`${result.bioavailability}%`} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>SA {result.surfaceArea} m2/g</span>
          <span>Pore vol. {result.poreVolume} cm3/g</span>
          <span>Pore {result.poreSize} nm</span>
          <span>Early release {result.earlyRelease}%</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {result.notes}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
