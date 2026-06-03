import { ArrowLeft, ArrowRight } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { defaultProblemConfiguration, type ProblemConfiguration } from "@/lib/formulation";

type ProblemConfigurationModalProps = {
  configuration: ProblemConfiguration;
  onChange: (configuration: ProblemConfiguration) => void;
  trigger: ReactNode;
};

const allVariables = Array.from(
  new Set([
    ...defaultProblemConfiguration.inputVariables,
    ...defaultProblemConfiguration.targetVariables,
    "cellLine",
    "concentration",
    "exposureTime",
    "earlyRelease",
    "targetCellViability",
  ]),
);

export function ProblemConfigurationModal({
  configuration,
  onChange,
  trigger,
}: ProblemConfigurationModalProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ProblemConfiguration>(configuration);
  const available = useMemo(
    () =>
      allVariables.filter(
        (variable) =>
          !draft.inputVariables.includes(variable) && !draft.targetVariables.includes(variable),
      ),
    [draft],
  );

  function move(variable: string, target: keyof ProblemConfiguration) {
    setDraft((current) => ({
      inputVariables: current.inputVariables.filter((item) => item !== variable),
      targetVariables: current.targetVariables.filter((item) => item !== variable),
      [target]: [...current[target], variable],
    }));
  }

  function remove(variable: string) {
    setDraft((current) => ({
      inputVariables: current.inputVariables.filter((item) => item !== variable),
      targetVariables: current.targetVariables.filter((item) => item !== variable),
    }));
  }

  function save() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Problem Configuration</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <VariableList
            title="Available Columns"
            variables={available}
            actions={(variable) => (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Use ${variable} as input`}
                  onClick={() => move(variable, "inputVariables")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Use ${variable} as target`}
                  onClick={() => move(variable, "targetVariables")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
          <VariableList
            title="Input Variables"
            variables={draft.inputVariables}
            actions={(variable) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${variable}`}
                onClick={() => remove(variable)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          />
          <VariableList
            title="Target Variables"
            variables={draft.targetVariables}
            actions={(variable) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${variable}`}
                onClick={() => remove(variable)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          />
        </div>

        <Separator />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft(defaultProblemConfiguration)}
          >
            Reset Defaults
          </Button>
          <Button type="button" onClick={save}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VariableList({
  title,
  variables,
  actions,
}: {
  title: string;
  variables: string[];
  actions: (variable: string) => ReactNode;
}) {
  return (
    <div className="rounded-md border">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ScrollArea className="h-72">
        <div className="space-y-2 p-3">
          {variables.map((variable) => (
            <div
              key={variable}
              className="flex min-h-10 items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate">{variable}</span>
              {actions(variable)}
            </div>
          ))}
          {variables.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">No variables</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
