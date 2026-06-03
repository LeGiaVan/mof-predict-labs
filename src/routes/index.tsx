import { createFileRoute } from "@tanstack/react-router";
import { Atom } from "lucide-react";
import { useMemo, useState } from "react";

import { FormulationSidebar } from "@/components/FormulationSidebar";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import {
  defaultFormulationValues,
  defaultProblemConfiguration,
  runScreening,
  type FormulationInput,
  type ProblemConfiguration,
} from "@/lib/formulation";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [input, setInput] = useState<FormulationInput>(defaultFormulationValues);
  const [configuration, setConfiguration] = useState<ProblemConfiguration>(
    defaultProblemConfiguration,
  );
  const recommendations = useMemo(() => runScreening(input), [input]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex items-center gap-3 px-5 py-4 lg:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Atom className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">NanoCarrier-AI</h1>
            <p className="text-xs text-muted-foreground">
              Multi-objective MOF formulation recommendation engine
            </p>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[390px_minmax(0,1fr)]">
        <FormulationSidebar onRun={setInput} />
        <ResultsDashboard
          input={input}
          recommendations={recommendations}
          configuration={configuration}
          onConfigurationChange={setConfiguration}
        />
      </div>
    </div>
  );
}
