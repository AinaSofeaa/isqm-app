import React, { useMemo, useState } from 'react';
import { Calculator, Columns, Grid3X3, Layers, Save } from 'lucide-react';
import { calcColumnQM, type ColumnInputs, type ColumnQMResult } from '../src/lib/qm';
import { saveResultRemote } from '../services/historyService';
import { getFieldState } from '../lib/fieldState';
import QMField from '../components/QMField';
import { useI18n } from '../src/i18n/I18nContext';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { useFeedback } from '../contexts/FeedbackContext';

type ColumnForm = {
  b: string;
  l: string;
  H: string;
  mainDiameter: string;
  mainLength: string;
  mainQty: string;
  linkDiameter: string;
  spacing: string;
  allowance: string;
};

const initialForm: ColumnForm = {
  b: '',
  l: '',
  H: '',
  mainDiameter: '',
  mainLength: '',
  mainQty: '',
  linkDiameter: '',
  spacing: '',
  allowance: '',
};

const formatNumber = (value: number | null | undefined, decimals: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const parseNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const ColumnView: React.FC = () => {
  const { t } = useI18n();
  const [form, setForm] = useState<ColumnForm>(initialForm);
  const [touched, setTouched] = useState({
    b: false,
    l: false,
    H: false,
    mainDiameter: false,
    mainLength: false,
    mainQty: false,
    linkDiameter: false,
    spacing: false,
    allowance: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ColumnQMResult | null>(null);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useFeedback();

  const validatePositive = (value: string) => {
    if (!value.trim()) return t('calc.validationRequired');
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return t('calc.validationPositive');
    return null;
  };

  const validateNonNegative = (value: string) => {
    if (!value.trim()) return t('calc.validationRequired');
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return t('calc.validationNonNegative');
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
    l: validatePositive(form.l),
    H: validatePositive(form.H),
    mainDiameter: validatePositive(form.mainDiameter),
    mainLength: validatePositive(form.mainLength),
    mainQty: validateNonNegativeInt(form.mainQty),
    linkDiameter: validatePositive(form.linkDiameter),
    spacing: validatePositive(form.spacing),
    allowance: validateNonNegative(form.allowance),
  }), [form, t]);

  const states = {
    b: getFieldState({ value: form.b, validator: validatePositive, touched: touched.b, submitted }),
    l: getFieldState({ value: form.l, validator: validatePositive, touched: touched.l, submitted }),
    H: getFieldState({ value: form.H, validator: validatePositive, touched: touched.H, submitted }),
    mainDiameter: getFieldState({ value: form.mainDiameter, validator: validatePositive, touched: touched.mainDiameter, submitted }),
    mainLength: getFieldState({ value: form.mainLength, validator: validatePositive, touched: touched.mainLength, submitted }),
    mainQty: getFieldState({ value: form.mainQty, validator: validateNonNegativeInt, touched: touched.mainQty, submitted }),
    linkDiameter: getFieldState({ value: form.linkDiameter, validator: validatePositive, touched: touched.linkDiameter, submitted }),
    spacing: getFieldState({ value: form.spacing, validator: validatePositive, touched: touched.spacing, submitted }),
    allowance: getFieldState({ value: form.allowance, validator: validateNonNegative, touched: touched.allowance, submitted }),
  };

  const hasErrors = Object.values(errors).some((err) => !!err);

  const showValidation = () => {
    showError(t('modal.validationTitle'), t('modal.validationMsg'));
  };

  const buildInputs = (): ColumnInputs => ({
    b: parseNumber(form.b),
    l: parseNumber(form.l),
    H: parseNumber(form.H),
    mainBarDiameterMm: parseNumber(form.mainDiameter),
    mainBarLengthM: parseNumber(form.mainLength),
    mainBarQuantity: parseNumber(form.mainQty),
    linkBarDiameterMm: parseNumber(form.linkDiameter),
    spacingMm: parseNumber(form.spacing),
    allowanceMm: parseNumber(form.allowance),
  });

  const computeResult = () => {
    setSubmitted(true);
    if (hasErrors) {
      setResult(null);
      return null;
    }
    const inputs = buildInputs();
    const next = calcColumnQM(inputs);
    setResult(next);
    return { inputs, result: next };
  };

  const handleCalculate = () => {
    const computed = computeResult();
    if (!computed) {
      showValidation();
    }
  };

  const handleSave = async () => {
    const computed = computeResult();
    if (!computed) {
      showValidation();
      return;
    }

    setSaving(true);
    try {
      const { inputs, result: output } = computed;
      await saveResultRemote({
        type: 'column',
        label: 'Column QM',
        inputs: {
          b_m: inputs.b,
          l_m: inputs.l,
          H_m: inputs.H,
          main_d_mm: inputs.mainBarDiameterMm,
          main_length_m: inputs.mainBarLengthM,
          main_qty: inputs.mainBarQuantity,
          link_d_mm: inputs.linkBarDiameterMm,
          spacing_mm: inputs.spacingMm,
          allowance_mm: inputs.allowanceMm,
        },
        outputs: {
          concrete_m3: output.concrete_m3,
          formwork_m2: output.formwork_m2,
          steel_main_kg: output.steel_main_kg,
          steel_links_kg: output.steel_links_kg,
          steel_total_kg: output.steel_total_kg,
          links_qty: output.links_qty,
        },
        result: output.steel_total_kg,
        unit: 'kg',
      });
      showSuccess(t('modal.saveSuccessTitle'), t('modal.saveSuccessMsg'));
    } catch (err: any) {
      const reason = formatSupabaseError(err, t('common.errorTryAgain'));
      showError(t('modal.saveFailTitle'), t('modal.saveFailMsg', { error: reason }));
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
            <h2 className="font-bold text-slate-800">{t('calc.column.title')}</h2>
            <p className="text-xs text-slate-400">{t('calc.column.subtitle')}</p>
          </div>
        </header>

        <div className="space-y-4">
          <QMField
            label={t('calc.column.widthLabel')}
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
            label={t('calc.column.lengthLabel')}
            value={form.l}
            onChange={(value) => setForm((prev) => ({ ...prev, l: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, l: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.l}
            showError={states.l.showError}
            showSuccess={states.l.showSuccess}
          />
          <QMField
            label={t('calc.column.heightLabel')}
            value={form.H}
            onChange={(value) => setForm((prev) => ({ ...prev, H: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, H: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.H}
            showError={states.H.showError}
            showSuccess={states.H.showSuccess}
          />
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('calc.mainBars')}</h3>
          <QMField
            label={t('calc.barDiameter')}
            value={form.mainDiameter}
            onChange={(value) => setForm((prev) => ({ ...prev, mainDiameter: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, mainDiameter: true }))}
            unit="mm"
            helperText={t('common.requiredHint')}
            errorMessage={errors.mainDiameter}
            showError={states.mainDiameter.showError}
            showSuccess={states.mainDiameter.showSuccess}
          />
          <QMField
            label={t('calc.barLength')}
            value={form.mainLength}
            onChange={(value) => setForm((prev) => ({ ...prev, mainLength: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, mainLength: true }))}
            unit="m"
            helperText={t('common.requiredHint')}
            errorMessage={errors.mainLength}
            showError={states.mainLength.showError}
            showSuccess={states.mainLength.showSuccess}
          />
          <QMField
            label={t('calc.quantityBars')}
            value={form.mainQty}
            onChange={(value) => setForm((prev) => ({ ...prev, mainQty: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, mainQty: true }))}
            unit={t('common.barsUnit')}
            helperText={t('common.requiredHint')}
            errorMessage={errors.mainQty}
            showError={states.mainQty.showError}
            showSuccess={states.mainQty.showSuccess}
            step="1"
            inputMode="numeric"
          />
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('calc.links')}</h3>
          <QMField
            label={t('calc.barDiameter')}
            value={form.linkDiameter}
            onChange={(value) => setForm((prev) => ({ ...prev, linkDiameter: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, linkDiameter: true }))}
            unit="mm"
            helperText={t('common.requiredHint')}
            errorMessage={errors.linkDiameter}
            showError={states.linkDiameter.showError}
            showSuccess={states.linkDiameter.showSuccess}
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
            label={t('calc.allowance')}
            value={form.allowance}
            onChange={(value) => setForm((prev) => ({ ...prev, allowance: value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, allowance: true }))}
            unit="mm"
            helperText={t('common.requiredHint')}
            errorMessage={errors.allowance}
            showError={states.allowance.showError}
            showSuccess={states.allowance.showSuccess}
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
        <p className="text-xs text-slate-400">{t('calc.formulaColumnConcrete')}</p>

        <div className="pt-4 border-t border-slate-100" />

        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Layers size={16} className="text-blue-500" />
          {t('calc.formworkTitle')}
        </div>
        <div className="text-2xl font-black text-blue-700">
          {formatNumber(result?.formwork_m2 ?? null, 3)} m2
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaColumnFormwork')}</p>

        <div className="pt-4 border-t border-slate-100" />

        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Grid3X3 size={16} className="text-orange-500" />
          {t('calc.reinforcementTitle')}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.mainBarsLabel')}</span>
            <span className="text-base font-black text-orange-600">
              {formatNumber(result?.steel_main_kg ?? null, 2)} kg
            </span>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnSteelMain')}</p>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.linksLabel')}</span>
            <span className="text-base font-black text-orange-600">
              {formatNumber(result?.steel_links_kg ?? null, 2)} kg
            </span>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnSteelLinks')}</p>
          <div className="text-xs font-semibold text-slate-500">
            {t('calc.linksQtyLabel')}: {formatNumber(result?.links_qty ?? null, 2)} | {t('calc.linkLengthLabel')}: {formatNumber(result?.link_length_m ?? null, 2)} m
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-700">
            <span>{t('calc.totalSteelLabel')}</span>
            <span className="text-lg font-black text-orange-700">
              {formatNumber(result?.steel_total_kg ?? null, 2)} kg
            </span>
          </div>
        </div>


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
          <span className="inline-flex items-center gap-2"><Save size={18} /> {t('common.save')}</span>
        </button>
      </section>
    </div>
  );
};

export default ColumnView;
