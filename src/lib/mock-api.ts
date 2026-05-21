// Mock RESTful API simulating ML inference for MOFs research.

export interface DrugLoadingPayload {
  central_metal_atom: string;
  organic_ligand: string;
  bit148: boolean;
  bit223: boolean;
  bit657: boolean;
}

export interface DrugLoadingResponse {
  loading_capacity: number;
  unit: "g/g";
}

export interface CytotoxicityPayload {
  central_metal_atom: string;
  organic_ligand: string;
  concentration: number;
  size: number;
  zeta_potential: number;
  exposure_time: number;
}

export interface CytotoxicityResponse {
  cell_viability: number;
  unit: "%";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function predictDrugLoading(
  payload: DrugLoadingPayload,
): Promise<DrugLoadingResponse> {
  await delay(1500);
  let base = 0.15 + Math.random() * 0.1; // 0.15 - 0.25
  if (["Cr", "Mg"].includes(payload.central_metal_atom)) base += 0.1;
  if (payload.organic_ligand === "Dio") base += 0.08;
  if (payload.bit148) base += 0.04;
  if (payload.bit223) base += 0.03;
  if (payload.bit657) base += 0.02;
  const capacity = Math.min(0.5, Math.max(0.1, base));
  return { loading_capacity: Number(capacity.toFixed(3)), unit: "g/g" };
}

export async function predictCytotoxicity(
  payload: CytotoxicityPayload,
): Promise<CytotoxicityResponse> {
  await delay(1500);
  let viability = 100;
  // Concentration is the dominant negative factor
  viability -= (payload.concentration / 500) * 70;
  if (payload.concentration > 200) viability -= 20;
  // Toxic metals
  if (["Zn", "Cu"].includes(payload.central_metal_atom)) viability -= 15;
  // Longer exposure reduces viability
  viability -= (payload.exposure_time - 24) * 0.3;
  // Extreme zeta potential is destabilizing
  viability -= Math.abs(payload.zeta_potential) * 0.1;
  // Very small particles slightly more toxic
  if (payload.size < 50) viability -= 5;
  // Random noise
  viability += (Math.random() - 0.5) * 6;
  viability = Math.min(100, Math.max(10, viability));
  return { cell_viability: Number(viability.toFixed(1)), unit: "%" };
}

export const METALS = ["Zn", "Cr", "Fe", "Cu", "Zr", "Mg"] as const;
export const LIGANDS = ["Dio", "Bdc", "Isa", "Meim"] as const;
export const EXPOSURE_TIMES = [24, 48, 72] as const;
export const CELL_TYPES = ["HeLa", "MCF-7", "A549", "HEK293"] as const;