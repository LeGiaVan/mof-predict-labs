import { z } from "zod";

export const therapeuticPayloads = [
  {
    id: "doxorubicin",
    name: "Doxorubicin",
    logP: -0.2,
    molecularWeight: 543.5,
    tpsa: 206.1,
    targetRelease: 42,
  },
  {
    id: "curcumin",
    name: "Curcumin",
    logP: 3.2,
    molecularWeight: 368.4,
    tpsa: 93.1,
    targetRelease: 58,
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    logP: 3.5,
    molecularWeight: 206.3,
    tpsa: 37.3,
    targetRelease: 64,
  },
  {
    id: "paclitaxel",
    name: "Paclitaxel",
    logP: 4.7,
    molecularWeight: 853.9,
    tpsa: 221.3,
    targetRelease: 34,
  },
] as const;

export const pkObjectives = [
  "Sustained release",
  "Tumor acidic release",
  "Maximize retention",
  "Fast intracellular release",
] as const;

export const formulationSchema = z
  .object({
    payloadId: z.string().min(1, "Select a therapeutic payload."),
    targetPh: z.number().min(4.5).max(7.8),
    pkObjective: z.string().min(1, "Select a pharmacokinetic objective."),
    cellLine: z.string().min(2, "Cell line is required."),
    concentration: z.coerce.number().min(0.1, "Concentration must be positive."),
    exposureTime: z.coerce.number().min(1, "Exposure time must be positive."),
    metalNode: z.string().min(1, "Metal ion node is required."),
    linker: z.string().min(1, "Linker structure is required."),
    minSurfaceArea: z.coerce.number().min(100),
    maxSurfaceArea: z.coerce.number().min(100),
    minPoreVolume: z.coerce.number().min(0.1),
    maxPoreVolume: z.coerce.number().min(0.1),
    minPoreSize: z.coerce.number().min(0.3),
    maxPoreSize: z.coerce.number().min(0.3),
    weightLoading: z.number().min(0).max(100),
    weightRelease: z.number().min(0).max(100),
    weightIc50: z.number().min(0).max(100),
    burstThreshold: z.coerce.number().min(1).max(100),
  })
  .refine((values) => values.maxSurfaceArea >= values.minSurfaceArea, {
    message: "Max surface area must be greater than min.",
    path: ["maxSurfaceArea"],
  })
  .refine((values) => values.maxPoreVolume >= values.minPoreVolume, {
    message: "Max pore volume must be greater than min.",
    path: ["maxPoreVolume"],
  })
  .refine((values) => values.maxPoreSize >= values.minPoreSize, {
    message: "Max pore size must be greater than min.",
    path: ["maxPoreSize"],
  });

export type FormulationInput = z.infer<typeof formulationSchema>;

export type Recommendation = {
  id: string;
  rank: number;
  mof: string;
  metalNode: string;
  linker: string;
  surfaceArea: number;
  poreVolume: number;
  poreSize: number;
  predictedLoading: number;
  releaseAtTargetPh: number;
  earlyRelease: number;
  targetCellViability: number;
  ic50: number;
  bioavailability: number;
  match: number;
  pareto: boolean;
  burstRelease: boolean;
  notes: string;
};

export type BatchPreview = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type BatchRankingRow = Recommendation & {
  sourceIndex: number;
  payload: string;
};

export type ProblemConfiguration = {
  inputVariables: string[];
  targetVariables: string[];
};

type CandidateMof = {
  id: string;
  mof: string;
  metalNode: string;
  linker: string;
  surfaceArea: number;
  poreVolume: number;
  poreSize: number;
  stability: number;
};

const candidates: CandidateMof[] = [
  {
    id: "uio-66-nh2",
    mof: "UiO-66-NH2",
    metalNode: "Zr4+",
    linker: "2-aminoterephthalate",
    surfaceArea: 1120,
    poreVolume: 0.46,
    poreSize: 0.8,
    stability: 93,
  },
  {
    id: "mil-101-fe",
    mof: "MIL-101(Fe)",
    metalNode: "Fe3+",
    linker: "terephthalate",
    surfaceArea: 2850,
    poreVolume: 1.25,
    poreSize: 2.9,
    stability: 86,
  },
  {
    id: "zif-8",
    mof: "ZIF-8",
    metalNode: "Zn2+",
    linker: "2-methylimidazole",
    surfaceArea: 1650,
    poreVolume: 0.62,
    poreSize: 1.2,
    stability: 78,
  },
  {
    id: "pcn-224",
    mof: "PCN-224",
    metalNode: "Zr4+",
    linker: "TCPP porphyrin",
    surfaceArea: 2600,
    poreVolume: 1.4,
    poreSize: 1.9,
    stability: 89,
  },
  {
    id: "hkust-1",
    mof: "HKUST-1",
    metalNode: "Cu2+",
    linker: "benzene-1,3,5-tricarboxylate",
    surfaceArea: 1500,
    poreVolume: 0.7,
    poreSize: 0.9,
    stability: 71,
  },
  {
    id: "mil-100-fe",
    mof: "MIL-100(Fe)",
    metalNode: "Fe3+",
    linker: "trimesate",
    surfaceArea: 2100,
    poreVolume: 1.1,
    poreSize: 2.5,
    stability: 84,
  },
];

export const defaultFormulationValues: FormulationInput = {
  payloadId: "doxorubicin",
  targetPh: 6.5,
  pkObjective: "Tumor acidic release",
  cellLine: "MCF-7",
  concentration: 25,
  exposureTime: 24,
  metalNode: "Zr4+",
  linker: "terephthalate",
  minSurfaceArea: 700,
  maxSurfaceArea: 3200,
  minPoreVolume: 0.35,
  maxPoreVolume: 1.6,
  minPoreSize: 0.6,
  maxPoreSize: 3.2,
  weightLoading: 40,
  weightRelease: 35,
  weightIc50: 25,
  burstThreshold: 60,
};

export const defaultProblemConfiguration: ProblemConfiguration = {
  inputVariables: [
    "payload",
    "logP",
    "molecularWeight",
    "tpsa",
    "targetPh",
    "metalNode",
    "linker",
    "surfaceArea",
    "poreVolume",
    "poreSize",
  ],
  targetVariables: ["loading", "releaseAtTargetPh", "ic50", "bioavailability"],
};

export const batchRequiredColumns = [
  "payload",
  "targetPh",
  "metalNode",
  "linker",
  "surfaceArea",
  "poreVolume",
  "poreSize",
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function selectedPayload(input: FormulationInput) {
  return (
    therapeuticPayloads.find((payload) => payload.id === input.payloadId) ?? therapeuticPayloads[0]
  );
}

function normalizedPreference(value: string, candidate: string) {
  if (!value.trim()) return 0.5;
  return candidate.toLowerCase().includes(value.toLowerCase()) ? 1 : 0.65;
}

function inRangeScore(value: number, min: number, max: number) {
  if (value >= min && value <= max) return 1;
  const distance = value < min ? min - value : value - max;
  return clamp(1 - distance / Math.max(max - min, 1), 0.25, 1);
}

function isDominated(candidate: Recommendation, all: Recommendation[]) {
  return all.some(
    (other) =>
      other.id !== candidate.id &&
      other.predictedLoading >= candidate.predictedLoading &&
      other.bioavailability >= candidate.bioavailability &&
      other.targetCellViability >= candidate.targetCellViability &&
      (other.predictedLoading > candidate.predictedLoading ||
        other.bioavailability > candidate.bioavailability ||
        other.targetCellViability > candidate.targetCellViability),
  );
}

export function runScreening(input: FormulationInput): Recommendation[] {
  const payload = selectedPayload(input);
  const totalWeight = input.weightLoading + input.weightRelease + input.weightIc50 || 1;
  const filtered = candidates.filter((candidate) => {
    const nodeMatch =
      !input.metalNode.trim() ||
      candidate.metalNode.toLowerCase().includes(input.metalNode.toLowerCase()) ||
      normalizedPreference(input.metalNode, candidate.metalNode) > 0.6;
    return nodeMatch;
  });

  const ranked = (filtered.length ? filtered : candidates).map((candidate) => {
    const areaScore = inRangeScore(
      candidate.surfaceArea,
      input.minSurfaceArea,
      input.maxSurfaceArea,
    );
    const volumeScore = inRangeScore(
      candidate.poreVolume,
      input.minPoreVolume,
      input.maxPoreVolume,
    );
    const poreScore = inRangeScore(candidate.poreSize, input.minPoreSize, input.maxPoreSize);
    const nodeScore = normalizedPreference(input.metalNode, candidate.metalNode);
    const linkerScore = normalizedPreference(input.linker, candidate.linker);
    const payloadSizePenalty = clamp(payload.molecularWeight / 900, 0.2, 1);
    const hydrophobicFit = clamp(100 - Math.abs(payload.logP - candidate.poreVolume * 2.6) * 13);
    const predictedLoading = clamp(
      18 +
        areaScore * 24 +
        volumeScore * 17 +
        poreScore * 14 +
        linkerScore * 9 +
        hydrophobicFit * 0.16 -
        payloadSizePenalty * 7,
      8,
      92,
    );
    const releaseAtTargetPh = clamp(
      payload.targetRelease +
        (7.4 - input.targetPh) * 8 +
        (candidate.poreSize - 1.2) * 6 +
        (1 - candidate.stability / 100) * 18,
      12,
      95,
    );
    const earlyRelease = clamp(releaseAtTargetPh * (0.55 + (candidate.poreSize > 2 ? 0.18 : 0.04)));
    const ic50 = clamp(
      12 +
        candidate.stability * 0.45 +
        nodeScore * 16 -
        input.concentration * 0.12 -
        input.exposureTime * 0.08,
      5,
      90,
    );
    const targetCellViability = clamp(
      100 - input.concentration * 0.7 + ic50 * 0.35 + candidate.stability * 0.08,
    );
    const bioavailability = clamp(
      38 +
        predictedLoading * 0.22 +
        releaseAtTargetPh * 0.18 +
        hydrophobicFit * 0.15 -
        payload.tpsa * 0.045 +
        poreScore * 7,
      10,
      96,
    );
    const releaseFit = clamp(100 - Math.abs(releaseAtTargetPh - payload.targetRelease) * 1.3);
    const ic50Score = clamp(ic50 * 1.2);
    const match = clamp(
      (predictedLoading * input.weightLoading +
        releaseFit * input.weightRelease +
        ic50Score * input.weightIc50) /
        totalWeight,
      0,
      99,
    );

    return {
      id: candidate.id,
      rank: 0,
      mof: candidate.mof,
      metalNode: candidate.metalNode,
      linker: candidate.linker,
      surfaceArea: candidate.surfaceArea,
      poreVolume: candidate.poreVolume,
      poreSize: candidate.poreSize,
      predictedLoading: Math.round(predictedLoading * 10) / 10,
      releaseAtTargetPh: Math.round(releaseAtTargetPh * 10) / 10,
      earlyRelease: Math.round(earlyRelease * 10) / 10,
      targetCellViability: Math.round(targetCellViability * 10) / 10,
      ic50: Math.round(ic50 * 10) / 10,
      bioavailability: Math.round(bioavailability * 10) / 10,
      match: Math.round(match),
      pareto: false,
      burstRelease: earlyRelease > input.burstThreshold,
      notes:
        candidate.stability >= 85
          ? "High aqueous stability candidate"
          : "Review stability constraints",
    };
  });

  const withPareto = ranked.map((item) => ({ ...item, pareto: !isDominated(item, ranked) }));

  return withPareto
    .sort((a, b) => b.match - a.match)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function buildBatchRanking(
  input: FormulationInput,
  rows: Record<string, unknown>[],
): BatchRankingRow[] {
  const base = runScreening(input);

  return rows
    .map((row, index) => {
      const source = base[index % base.length];
      const payload = String(row.payload ?? row.Payload ?? selectedPayload(input).name);
      const loadingBoost = Number(row.loading ?? row.Loading ?? 0) || 0;
      const releaseOverride = Number(row.releaseAtTargetPh ?? row.release ?? row.Release);
      const bioOverride = Number(row.bioavailability ?? row.Bioavail);

      return {
        ...source,
        id: `${source.id}-${index}`,
        sourceIndex: index + 1,
        payload,
        mof: String(row.mof ?? row.MOF ?? source.mof),
        metalNode: String(row.metalNode ?? row.MetalNode ?? source.metalNode),
        linker: String(row.linker ?? row.Linker ?? source.linker),
        predictedLoading: Math.round(clamp(source.predictedLoading + loadingBoost) * 10) / 10,
        releaseAtTargetPh: Number.isFinite(releaseOverride)
          ? Math.round(clamp(releaseOverride) * 10) / 10
          : source.releaseAtTargetPh,
        bioavailability: Number.isFinite(bioOverride)
          ? Math.round(clamp(bioOverride) * 10) / 10
          : source.bioavailability,
      };
    })
    .map((row) => ({
      ...row,
      burstRelease: row.earlyRelease > input.burstThreshold,
      match: Math.round(
        clamp((row.predictedLoading + row.bioavailability + row.targetCellViability) / 3),
      ),
    }))
    .sort((a, b) => b.match - a.match)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
