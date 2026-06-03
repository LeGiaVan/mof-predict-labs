import { Download, FileSpreadsheet, Settings2 } from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { BatchUploadView } from "@/components/BatchUploadView";
import { ProblemConfigurationModal } from "@/components/ProblemConfigurationModal";
import { ResultCard } from "@/components/ResultCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FormulationInput, ProblemConfiguration, Recommendation } from "@/lib/formulation";

type ResultsDashboardProps = {
  input: FormulationInput;
  recommendations: Recommendation[];
  configuration: ProblemConfiguration;
  onConfigurationChange: (configuration: ProblemConfiguration) => void;
};

function exportJson(recommendations: Recommendation[]) {
  const blob = new Blob([JSON.stringify(recommendations, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "formulation-recommendations.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResultsDashboard({
  input,
  recommendations,
  configuration,
  onConfigurationChange,
}: ResultsDashboardProps) {
  const chartData = recommendations.map((item) => ({
    ...item,
    z: item.match,
  }));

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 xl:p-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">NanoCarrier-AI</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Formulation Discovery Studio
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Multi-objective recommendation engine for MOF-based therapeutic payload delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProblemConfigurationModal
            configuration={configuration}
            onChange={onConfigurationChange}
            trigger={
              <Button variant="outline">
                <Settings2 className="h-4 w-4" />
                Configure
              </Button>
            }
          />
          <Button variant="outline" onClick={() => exportJson(recommendations)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="single" className="space-y-5">
        <TabsList>
          <TabsTrigger value="single">Single Input</TabsTrigger>
          <TabsTrigger value="batch">
            <FileSpreadsheet className="h-4 w-4" />
            Batch Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle>Multi-Objective Pareto Frontier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 18, bottom: 12, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="predictedLoading"
                        name="Loading"
                        unit="%"
                        tickLine={false}
                      />
                      <YAxis
                        type="number"
                        dataKey="bioavailability"
                        name="Bioavailability"
                        unit="%"
                        tickLine={false}
                      />
                      <ZAxis type="number" dataKey="z" range={[90, 360]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0].payload as Recommendation;
                          return (
                            <div className="rounded-md border bg-background p-3 text-xs shadow">
                              <p className="font-semibold">{item.mof}</p>
                              <p>Loading: {item.predictedLoading}%</p>
                              <p>Bioavail.: {item.bioavailability}%</p>
                              <p>Match: {item.match}%</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        name="Candidates"
                        data={chartData.filter((item) => !item.pareto)}
                        fill="var(--color-chart-2)"
                      />
                      <Scatter
                        name="Pareto"
                        data={chartData.filter((item) => item.pareto)}
                        fill="var(--color-chart-1)"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader>
                <CardTitle>Formulation Laboratory Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>Screening context</AlertTitle>
                  <AlertDescription>
                    Target pH {input.targetPh.toFixed(1)}, {input.cellLine}, {input.concentration}{" "}
                    uM for {input.exposureTime}h. Burst warning threshold is {input.burstThreshold}%
                    early release.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-semibold">{recommendations.length}</p>
                    <p className="text-xs text-muted-foreground">Candidates</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-semibold">
                      {recommendations.filter((item) => item.pareto).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pareto</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-semibold">
                      {recommendations.filter((item) => item.burstRelease).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Master Recommendations</h2>
              <p className="text-sm text-muted-foreground">
                Ranked by loading, release-fit, and IC50 weights from the sidebar.
              </p>
            </div>
            <div className="grid gap-4">
              {recommendations.map((result) => (
                <ResultCard key={result.id} result={result} targetPh={input.targetPh} />
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="batch">
          <BatchUploadView input={input} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
