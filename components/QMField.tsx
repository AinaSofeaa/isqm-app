import React, { useId } from 'react';
import { Check } from 'lucide-react';

type QMFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  unit?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string | null;
  showError?: boolean;
  showSuccess?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  step?: string;
  type?: string;
  disabled?: boolean;
};

const QMField: React.FC<QMFieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  unit,
  placeholder = '0.00',
  helperText,
  errorMessage,
  showError,
  showSuccess,
  inputMode = 'decimal',
  step = 'any',
  type = 'number',
  disabled,
}) => {
  const errorId = useId();
  const wrapperClass = showError
    ? 'mt-2 flex items-center gap-2 bg-slate-50 border border-red-300 rounded-2xl px-4 py-3 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-100'
    : showSuccess
      ? 'mt-2 flex items-center gap-2 bg-slate-50 border border-emerald-200 rounded-2xl px-4 py-3 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100'
      : 'mt-2 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10';

  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      {helperText && !showError && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}
      <div className={wrapperClass}>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          type={type}
          step={step}
          inputMode={inputMode}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError && errorMessage ? errorId : undefined}
          className="flex-1 bg-transparent outline-none text-sm font-semibold text-slate-700"
        />
        {unit && (
          <span className="text-[11px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md">
            {unit}
          </span>
        )}
        {showSuccess && !disabled && (
          <Check size={16} className="text-emerald-500" aria-hidden="true" />
        )}
      </div>
      {showError && errorMessage && (
        <p id={errorId} className="text-[11px] font-semibold text-red-500 mt-2">
          {errorMessage}
        </p>
      )}
    </label>
  );
};

export default QMField;
