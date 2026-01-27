const toNumber = (value: number) => (Number.isFinite(value) ? value : 0);
const mmToM = (valueMm: number) => toNumber(valueMm) / 1000;

const barWeightKg = (diameterMm: number, lengthM: number, quantity: number) => {
  return (toNumber(diameterMm) ** 2 / 162) * toNumber(lengthM) * toNumber(quantity);
};

export type BeamInputs = {
  b: number;
  h: number;
  L: number;
  barDiameterMm: number;
  barLengthM: number;
  barQuantity: number;
};

export type BeamQMResult = {
  concrete_m3: number;
  formwork_m2: number;
  steel_kg: number;
};

export type ColumnInputs = {
  b: number;
  l: number;
  H: number;
  mainBarDiameterMm: number;
  mainBarLengthM: number;
  mainBarQuantity: number;
  linkBarDiameterMm: number;
  spacingMm: number;
  allowanceMm: number;
};

export type ColumnQMResult = {
  concrete_m3: number;
  formwork_m2: number;
  steel_main_kg: number;
  steel_links_kg: number;
  steel_total_kg: number;
  links_qty: number;
  link_length_m: number;
};

export type SlabInputs = {
  length: number;
  width: number;
  thickness: number;
  barDiameterMm: number;
  spacingMm: number;
  barLengthM: number;
};

export type SlabQMResult = {
  concrete_m3: number;
  formwork_m2: number;
  steel_kg: number;
  bars_qty: number;
};

export const calcBeamQM = (input: BeamInputs): BeamQMResult => {
  const b = toNumber(input.b);
  const h = toNumber(input.h);
  const L = toNumber(input.L);
  const concrete_m3 = b * h * L;
  const formwork_m2 = (2 * h * L) + (b * L);
  const steel_kg = barWeightKg(input.barDiameterMm, input.barLengthM, input.barQuantity);
  return { concrete_m3, formwork_m2, steel_kg };
};

export const calcColumnQM = (input: ColumnInputs): ColumnQMResult => {
  const b = toNumber(input.b);
  const l = toNumber(input.l);
  const H = toNumber(input.H);
  const concrete_m3 = b * l * H;
  const formwork_m2 = 2 * (b + l) * H;

  const steel_main_kg = barWeightKg(input.mainBarDiameterMm, input.mainBarLengthM, input.mainBarQuantity);

  const spacing_m = mmToM(input.spacingMm);
  const allowance_m = mmToM(input.allowanceMm);
  const link_length_m = (2 * (b + l)) + allowance_m;
  const links_qty = spacing_m > 0 ? H / spacing_m : 0;
  const steel_links_kg = barWeightKg(input.linkBarDiameterMm, link_length_m, links_qty);
  const steel_total_kg = steel_main_kg + steel_links_kg;

  return {
    concrete_m3,
    formwork_m2,
    steel_main_kg,
    steel_links_kg,
    steel_total_kg,
    links_qty,
    link_length_m,
  };
};

export const calcSlabQM = (input: SlabInputs): SlabQMResult => {
  const length = toNumber(input.length);
  const width = toNumber(input.width);
  const thickness = toNumber(input.thickness);
  const concrete_m3 = length * width * thickness;
  const formwork_m2 = length * width;

  const spacing_m = mmToM(input.spacingMm);
  const bars_qty = spacing_m > 0 ? width / spacing_m : 0;
  const steel_kg = barWeightKg(input.barDiameterMm, input.barLengthM, bars_qty);

  return {
    concrete_m3,
    formwork_m2,
    steel_kg,
    bars_qty,
  };
};
