import React, { useMemo, useState } from 'react';
import { Calculator, Columns, Grid3X3, Layers, Save } from 'lucide-react';
import { calcSlabQM, type SlabInputs, type SlabQMResult } from '../src/lib/qm';
import { saveResultRemote } from '../services/historyService';
import { getFieldState } from '../lib/fieldState';
import QMField from '../components/QMField';
import { useI18n } from '../src/i18n/I18nContext';

type SlabForm = {
  length: string;
  width: string;
  thickness: string;
  barDiameter: string;
  spacing: string;
  barLength: string;
};

const initialForm: SlabForm = {
  length: '',
  width: '',
  thickness: '',
  barDiameter: '',
  spacing: '',
  barLength: '',
};

const formatNumber = (value: number | null | undefined, decimals: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const parseNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const SlabView: React.FC = () => {
  const { t } = useI18n();
  const [form, setForm] = useState<SlabForm>(initialForm);
  const [touched, setTouched] = useState({
    length: false,
    width: false,
    thickness: false,
    barDiameter: false,
    spacing: false,
    barLength: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SlabQMResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ key: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const validatePositive = (value: string) => {
    if (!value.trim()) return t('calc.validationRequired');
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return t('calc.validationPositive');
    return null;
  };

  const validateOptionalPositive = (value: string) => {
    if (!value.trim()) return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return t('calc.validationPositive');
    return null;
  };
  const errors = useMemo(() => ({
    length: validatePositive(form.length),
    width: validatePositive(form.width),
    thickness: validatePositive(form.thickness),
    barDiameter: validatePositive(form.barDiameter),
    spacing: validatePositive(form.spacing),
    barLength: validateOptionalPositive(form.barLength),
  }), [form, t]);

  const states = {
    length: getFieldState({ value: form.length, validator: validatePositive, touched: touched.length, submitted }),
    width: getFieldState({ value: form.width, validator: validatePositive, touched: touched.width, submitted }),
    thickness: getFieldState({ value: form.thickness, validator: validatePositive, touched: touched.thickness, submitted }),
    barDiameter: getFieldState({ value: form.barDiameter, validator: validatePositive, touched: touched.barDiameter, submitted }),
    spacing: getFieldState({ value: form.spacing, validator: validatePositive, touched: touched.spacing, submitted }),
    barLength: getFieldState({ value: form.barLength, validator: validateOptionalPositive, touched: touched.barLength, submitted }),
  };

  const hasErrors = Object.values(errors).some((err) => !!err);

  const buildInputs = (): SlabInputs => {
    const length = parseNumber(form.length);
    const barLength = form.barLength.trim() ? parseNumber(form.barLength) : length;
    return {
      length,
      width: parseNumber(form.width),
      thickness: parseNumber(form.thickness),
      barDiameterMm: parseNumber(form.barDiameter),
      spacingMm: parseNumber(form.spacing),
      barLengthM: barLength,
    };
  };

  const computeResult = () => {
    setSubmitted(true);
    if (hasErrors) {
      setResult(null);
      return null;
    }
    const inputs = buildInputs();
    const next = calcSlabQM(inputs);
    setResult(next);
    return { inputs, result: next };
  };

  const handleCalculate = () => {
    setSaveError(null);
    computeResult();
  };

  const handleSave = async () => {
    setSaveError(null);
    const computed = computeResult();
    if (!computed) return;

    setSaving(true);
    try {
      const { inputs, result: output } = computed;
      await saveResultRemote({
        type: 'slab',
        label: 'Slab QM',
        inputs: {
          length_m: inputs.length,
          width_m: inputs.width,
          thickness_m: inputs.thickness,
          bar_d_mm: inputs.barDiameterMm,
          spacing_mm: inputs.spacingMm,
          bar_length_m: inputs.barLengthM,
        },
        outputs: {
          concrete_m3: output.concrete_m3,
          formwork_m2: output.formwork_m2,
          steel_kg: output.steel_kg,
          bars_qty: output.bars_qty,
        },
        result: output.steel_kg,
        unit: 'kg',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      const message = String(err?.message ?? '');
      setSaveError({
        key: message.includes('outputs jsonb') ? 'common.dbMigrationRequired' : 'common.saveFailed',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <header className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{t('calc.slab.title')}</h2>
            <p className="text-xs text-slate-400">{t('calc.slab.subtitle')}</p>
          </div>
        </header>

        <div className="space-y-4">
          <QMField
            label={t('calc.slab.lengthLabel')}
            value={form.length}
            onChange={(value) => setForm((prev) => ({ ...prev, length: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, length: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.length}
            showError={states.length.showError}
            showSuccess={states.length.showSuccess}
          />
          <QMField
            label={t('calc.slab.widthLabel')}
            value={form.width}
            onChange={(value) => setForm((prev) => ({ ...prev, width: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, width: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.width}
            showError={states.width.showError}
            showSuccess={states.width.showSuccess}
          />
          <QMField
            label={t('calc.slab.thicknessLabel')}
            value={form.thickness}
            onChange={(value) => setForm((prev) => ({ ...prev, thickness: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, thickness: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.thickness}
            showError={states.thickness.showError}
            showSuccess={states.thickness.showSuccess}
          />
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('calc.reinforcement')}</h3>
          <QMField
            label={t('calc.barDiameter')}
            value={form.barDiameter}
            onChange={(value) => setForm((prev) => ({ ...prev, barDiameter: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, barDiameter: true }))}
            unit="mm"
            helperText={t('common.requiredHint')}
            errorMessage={errors.barDiameter}
            showError={states.barDiameter.showError}
            showSuccess={states.barDiameter.showSuccess}
          />
          <QMField
            label={t('calc.spacing')}
            value={form.spacing}
            onChange={(value) => setForm((prev) => ({ ...prev, spacing: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, spacing: true }))}
            unit="mm"
            helperText={t('common.requiredHint')}
            errorMessage={errors.spacing}
            showError={states.spacing.showError}
            showSuccess={states.spacing.showSuccess}
          />
          <QMField
            label={t('calc.barLengthOptional')}
            value={form.barLength}
            onChange={(value) => setForm((prev) => ({ ...prev, barLength: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, barLength: true }))}
            unit="m"
            helperText={t('common.optional')}
            errorMessage={errors.barLength}
            showError={states.barLength.showError}
            showSuccess={states.barLength.showSuccess}
          />
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-6 w-full py-4 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform"
        >
          {t('common.calculate')}
        </button>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Columns size={16} className="text-emerald-500" />
          {t('calc.concreteTitle')}
        </div>
        <div className="text-2xl font-black text-emerald-600">
          {formatNumber(result?.concrete_m3 ?? null, 3)} m3
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaSlabConcrete')}</p>

        <div className="pt-4 border-t border-slate-100" />

        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Layers size={16} className="text-blue-500" />
          {t('calc.formworkTitle')}
        </div>
        <div className="text-2xl font-black text-blue-700">
          {formatNumber(result?.formwork_m2 ?? null, 3)} m2
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaSlabFormwork')}</p>

        <div className="pt-4 border-t border-slate-100" />

        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Grid3X3 size={16} className="text-orange-500" />
          {t('calc.reinforcementTitle')}
        </div>
        <div className="text-2xl font-black text-orange-600">
          {formatNumber(result?.steel_kg ?? null, 2)} kg
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaSlabSteel')}</p>
        <div className="text-xs font-semibold text-slate-500">
          {t('calc.barsQtyLabel')}: {formatNumber(result?.bars_qty ?? null, 2)}
        </div>

        {saveError && (
          <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded-2xl">
            {t(saveError.key)}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!result || saving}
          className={`w-full py-4 rounded-2xl font-black active:scale-95 transition-transform ${
            result && !saving
              ? 'bg-slate-900 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {saved ? (
            <span className="inline-flex items-center gap-2"><Save size={18} /> {t('common.saved')}</span>
          ) : (
            <span className="inline-flex items-center gap-2"><Save size={18} /> {t('common.save')}</span>
          )}
        </button>
      </section>
    </div>
  );
};

export default SlabView;
