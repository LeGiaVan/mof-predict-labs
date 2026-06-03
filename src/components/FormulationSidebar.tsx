import { zodResolver } from "@hookform/resolvers/zod";
import { Beaker, FlaskConical, Play, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  defaultFormulationValues,
  formulationSchema,
  pkObjectives,
  therapeuticPayloads,
  type FormulationInput,
} from "@/lib/formulation";

type FormulationSidebarProps = {
  onRun: (values: FormulationInput) => void;
};

function NumberField({
  control,
  name,
  label,
  step = "1",
}: {
  control: ReturnType<typeof useForm<FormulationInput>>["control"];
  name: keyof FormulationInput;
  label: string;
  step?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              value={field.value as number}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SliderField({
  control,
  name,
  label,
  min,
  max,
  step,
  suffix = "%",
}: {
  control: ReturnType<typeof useForm<FormulationInput>>["control"];
  name: keyof FormulationInput;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between gap-3">
            <FormLabel>{label}</FormLabel>
            <span className="text-xs font-medium text-muted-foreground">
              {Number(field.value).toFixed(step < 1 ? 1 : 0)}
              {suffix}
            </span>
          </div>
          <FormControl>
            <Slider
              min={min}
              max={max}
              step={step}
              value={[Number(field.value)]}
              onValueChange={([value]) => field.onChange(value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormulationSidebar({ onRun }: FormulationSidebarProps) {
  const form = useForm<FormulationInput>({
    resolver: zodResolver(formulationSchema),
    defaultValues: defaultFormulationValues,
    mode: "onSubmit",
  });
  const payloadId = form.watch("payloadId");
  const payload = useMemo(
    () => therapeuticPayloads.find((item) => item.id === payloadId) ?? therapeuticPayloads[0],
    [payloadId],
  );

  return (
    <aside className="h-fit border-b bg-card/95 p-5 shadow-sm lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Input Design Space</h2>
            <p className="text-xs text-muted-foreground">Single formulation screening</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onRun)}>
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Beaker className="h-4 w-4 text-primary" />
              Cargo Identification
            </div>
            <FormField
              control={form.control}
              name="payloadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Therapeutic Payload</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payload" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {therapeuticPayloads.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">LogP</Label>
                <p className="text-sm font-semibold">{payload.logP}</p>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Mol Wt</Label>
                <p className="text-sm font-semibold">{payload.molecularWeight}</p>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">TPSA</Label>
                <p className="text-sm font-semibold">{payload.tpsa}</p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Clinical Context Restraints
            </div>
            <SliderField
              control={form.control}
              name="targetPh"
              label="Target pH"
              min={4.5}
              max={7.8}
              step={0.1}
              suffix=""
            />
            <FormField
              control={form.control}
              name="pkObjective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pharmacokinetic Objective</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select objective" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pkObjectives.map((objective) => (
                        <SelectItem key={objective} value={objective}>
                          {objective}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cellLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cell Line</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MCF-7" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <NumberField control={form.control} name="concentration" label="Conc. (uM)" />
              <NumberField control={form.control} name="exposureTime" label="Time (h)" />
              <NumberField control={form.control} name="burstThreshold" label="Burst limit (%)" />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="text-sm font-semibold">MOF Material Properties</div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="metalNode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metal Ion Node</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Zr4+" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linker</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="terephthalate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField control={form.control} name="minSurfaceArea" label="Min SA" />
              <NumberField control={form.control} name="maxSurfaceArea" label="Max SA" />
              <NumberField
                control={form.control}
                name="minPoreVolume"
                label="Min Vol."
                step="0.01"
              />
              <NumberField
                control={form.control}
                name="maxPoreVolume"
                label="Max Vol."
                step="0.01"
              />
              <NumberField control={form.control} name="minPoreSize" label="Min Pore" step="0.1" />
              <NumberField control={form.control} name="maxPoreSize" label="Max Pore" step="0.1" />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="text-sm font-semibold">ML Model Ranking Filters</div>
            <SliderField
              control={form.control}
              name="weightLoading"
              label="Maximize Loading"
              min={0}
              max={100}
              step={1}
            />
            <SliderField
              control={form.control}
              name="weightRelease"
              label="Target Release"
              min={0}
              max={100}
              step={1}
            />
            <SliderField
              control={form.control}
              name="weightIc50"
              label="IC50"
              min={0}
              max={100}
              step={1}
            />
          </section>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <Play className="h-4 w-4" />
              Run Screening
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Reset form"
              onClick={() => form.reset(defaultFormulationValues)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </aside>
  );
}
