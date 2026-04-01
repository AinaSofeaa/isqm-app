const toNumber = (value: number) => (Number.isFinite(value) ? value : 0);
const clampNonNegative = (value: number) => Math.max(0, toNumber(value));
const mmToM = (valueMm: number) => clampNonNegative(valueMm) / 1000;

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
  a: number;
  b: number;
  H: number;
  n: number;
  C: number;
  c: number;
  d: number;
  spacing: number;
};

export type ColumnQMResult = {
  concrete_m3: number;
  formwork_m2: number;
  main_bars_m: number;
  link_length_m: number;
  links_qty: number;
  links_total_m: number;
  column_total_m: number;
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
  soffit_m2: number;
  form_to_side_m2: number;
};

export const calcBeamQM = (input: BeamInputs): BeamQMResult => {
  const b = toNumber(input.b);
  const h = toNumber(input.h);
  const L = toNumber(input.L);
  const concrete_m3 = b * h * L;
  const formwork_m2 = (2 * h + b) * L;
  const steel_kg = barWeightKg(input.barDiameterMm, input.barLengthM, input.barQuantity);
  return { concrete_m3, formwork_m2, steel_kg };
};

export const calcColumnQM = (input: ColumnInputs): ColumnQMResult => {
  const a = clampNonNegative(input.a);
  const b = clampNonNegative(input.b);
  const H = clampNonNegative(input.H);
  const n = clampNonNegative(input.n);
  const C = clampNonNegative(input.C);
  const c = clampNonNegative(input.c);
  const d_m = mmToM(input.d);
  const spacing = clampNonNegative(input.spacing);

  const concrete_m3 = a * b * H;
  const formwork_m2 = 2 * (a + b) * H;
  const main_bars_m = Math.max(0, n * Math.max(H - C, 0));
  const link_length_m = Math.max(0, (2 * a + 2 * b) - (4 * c) + (24 * d_m));
  const links_qty = spacing > 0 ? Math.max(0, H / spacing) : 0;
  const links_total_m = Math.max(0, link_length_m * links_qty);
  const column_total_m = main_bars_m + links_total_m;

  return {
    concrete_m3,
    formwork_m2,
    main_bars_m,
    link_length_m,
    links_qty,
    links_total_m,
    column_total_m,
  };
};

export const calcSlabQM = (input: SlabInputs): SlabQMResult => {
  const length = toNumber(input.length);
  const width = toNumber(input.width);
  const thickness = toNumber(input.thickness);
  const concrete_m3 = length * width * thickness;
  const formwork_m2 = length * width;
  const soffit_m2 = 2 * (length + width) * thickness;
  const form_to_side_m2 = 2 * length * thickness;

  return {
    concrete_m3,
    formwork_m2,
    soffit_m2,
    form_to_side_m2,
  };
};
