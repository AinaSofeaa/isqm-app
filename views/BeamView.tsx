import React, { useMemo, useState } from 'react';
import { Calculator, Columns, Grid3X3, Layers, Save } from 'lucide-react';
import { calcBeamQM, type BeamInputs, type BeamQMResult } from '../src/lib/qm';
import { saveResultRemote } from '../services/historyService';
import { getFieldState } from '../lib/fieldState';
import QMField from '../components/QMField';
import { useI18n } from '../src/i18n/I18nContext';

type BeamForm = {
  b: string;
  h: string;
  L: string;
  barDiameter: string;
  barLength: string;
  barQty: string;
};

const initialForm: BeamForm = {
  b: '',
  h: '',
  L: '',
  barDiameter: '',
  barLength: '',
  barQty: '',
};

const formatNumber = (value: number | null | undefined, decimals: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const parseNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const BeamView: React.FC = () => {
  const { t } = useI18n();
  const [form, setForm] = useState<BeamForm>(initialForm);
  const [touched, setTouched] = useState({
    b: false,
    h: false,
    L: false,
    barDiameter: false,
    barLength: false,
    barQty: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<BeamQMResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ key: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const validatePositive = (value: string) => {
    if (!value.trim()) return t('calc.validationRequired');
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return t('calc.validationPositive');
    return null;
  };

  const validateNonNegativeInt = (value: string) => {
    if (!value.trim()) return t('calc.validationRequired');
    const num = Number(value);
    if (!Number.isFinite(num) || !Number.isInteger(num)) return t('calc.validationInteger');
    if (num < 0) return t('calc.validationNonNegative');
    return null;
  };

  const errors = useMemo(() => ({
    b: validatePositive(form.b),
    h: validatePositive(form.h),
    L: validatePositive(form.L),
    barDiameter: validatePositive(form.barDiameter),
    barLength: validatePositive(form.barLength),
    barQty: validateNonNegativeInt(form.barQty),
  }), [form, t]);

  const states = {
    b: getFieldState({ value: form.b, validator: validatePositive, touched: touched.b, submitted }),
    h: getFieldState({ value: form.h, validator: validatePositive, touched: touched.h, submitted }),
    L: getFieldState({ value: form.L, validator: validatePositive, touched: touched.L, submitted }),
    barDiameter: getFieldState({ value: form.barDiameter, validator: validatePositive, touched: touched.barDiameter, submitted }),
    barLength: getFieldState({ value: form.barLength, validator: validatePositive, touched: touched.barLength, submitted }),
    barQty: getFieldState({ value: form.barQty, validator: validateNonNegativeInt, touched: touched.barQty, submitted }),
  };

  const hasErrors = Object.values(errors).some((err) => !!err);

  const buildInputs = (): BeamInputs => ({
    b: parseNumber(form.b),
    h: parseNumber(form.h),
    L: parseNumber(form.L),
    barDiameterMm: parseNumber(form.barDiameter),
    barLengthM: parseNumber(form.barLength),
    barQuantity: parseNumber(form.barQty),
  });

  const computeResult = () => {
    setSubmitted(true);
    if (hasErrors) {
      setResult(null);
      return null;
    }
    const inputs = buildInputs();
    const next = calcBeamQM(inputs);
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
        type: 'beam',
        label: 'Beam QM',
        inputs: {
          b_m: inputs.b,
          h_m: inputs.h,
          L_m: inputs.L,
          bar_d_mm: inputs.barDiameterMm,
          bar_length_m: inputs.barLengthM,
          bar_qty: inputs.barQuantity,
        },
        outputs: {
          concrete_m3: output.concrete_m3,
          formwork_m2: output.formwork_m2,
          steel_kg: output.steel_kg,
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
            <h2 className="font-bold text-slate-800">{t('calc.beam.title')}</h2>
            <p className="text-xs text-slate-400">{t('calc.beam.subtitle')}</p>
          </div>
        </header>

        <div className="space-y-4">
          <QMField
            label={t('calc.beam.widthLabel')}
            value={form.b}
            onChange={(value) => setForm((prev) => ({ ...prev, b: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, b: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.b}
            showError={states.b.showError}
            showSuccess={states.b.showSuccess}
          />
          <QMField
            label={t('calc.beam.depthLabel')}
            value={form.h}
            onChange={(value) => setForm((prev) => ({ ...prev, h: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, h: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.h}
            showError={states.h.showError}
            showSuccess={states.h.showSuccess}
          />
          <QMField
            label={t('calc.beam.lengthLabel')}
            value={form.L}
            onChange={(value) => setForm((prev) => ({ ...prev, L: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, L: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.L}
            showError={states.L.showError}
            showSuccess={states.L.showSuccess}
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
            label={t('calc.barLength')}
            value={form.barLength}
            onChange={(value) => setForm((prev) => ({ ...prev, barLength: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, barLength: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.barLength}
            showError={states.barLength.showError}
            showSuccess={states.barLength.showSuccess}
          />
          <QMField
            label={t('calc.quantityBars')}
            value={form.barQty}
            onChange={(value) => setForm((prev) => ({ ...prev, barQty: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, barQty: true }))}
            unit={t('common.barsUnit')}
            helperText={t('common.requiredHint')}
            errorMessage={errors.barQty}
            showError={states.barQty.showError}
            showSuccess={states.barQty.showSuccess}
            step="1"
            inputMode="numeric"
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
        <p className="text-xs text-slate-400">{t('calc.formulaBeamConcrete')}</p>

        <div className="pt-4 border-t border-slate-100" />

        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Layers size={16} className="text-blue-500" />
          {t('calc.formworkTitle')}
        </div>
        <div className="text-2xl font-black text-blue-700">
          {formatNumber(result?.formwork_m2 ?? null, 3)} m2
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaBeamFormwork')}</p>

        <div className="pt-4 border-t border-slate-100" />

        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Grid3X3 size={16} className="text-orange-500" />
          {t('calc.reinforcementTitle')}
        </div>
        <div className="text-2xl font-black text-orange-600">
          {formatNumber(result?.steel_kg ?? null, 2)} kg
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaBeamSteel')}</p>

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

export default BeamView;
