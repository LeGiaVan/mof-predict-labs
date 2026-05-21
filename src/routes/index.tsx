import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DrugLoadingModule } from "@/components/DrugLoadingModule";
import { CytotoxicityModule } from "@/components/CytotoxicityModule";
import { HistoryModule } from "@/components/HistoryModule";
import { Atom } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Atom className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">MOFs Predictor</h1>
            <p className="text-xs text-muted-foreground">
              Drug loading capacity & cytotoxicity prediction for Metal-Organic Frameworks
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="loading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="loading">Drug Loading</TabsTrigger>
            <TabsTrigger value="cyto">Cytotoxicity</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="loading">
            <DrugLoadingModule onSaved={bump} />
          </TabsContent>
          <TabsContent value="cyto">
            <CytotoxicityModule onSaved={bump} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryModule refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
