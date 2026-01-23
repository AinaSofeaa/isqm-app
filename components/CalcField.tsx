
import React from 'react';

interface CalcFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  unit?: string;
  type?: string;
}

const CalcField: React.FC<CalcFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "0.00", 
  unit = "m",
  type = "number" 
}) => {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          type={type}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-lg font-medium outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
        />
        {unit && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md pointer-events-none group-focus-within:text-blue-500 group-focus-within:bg-blue-50 transition-colors">
            {unit}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalcField;
