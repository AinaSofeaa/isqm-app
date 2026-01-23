
import React, { useState, useEffect } from 'react';
import CalcField from '../components/CalcField';
import { RotateCcw, Save, LayoutTemplate } from 'lucide-react';
import { saveResultRemote } from '../services/historyService';

const FormworkCalc: React.FC = () => {
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [sides, setSides] = useState('1');
  const [area, setArea] = useState<number>(0);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const l = parseFloat(length) || 0;
    const h = parseFloat(height) || 0;
    const s = parseFloat(sides) || 0;
    setArea(l * h * s);
  }, [length, height, sides]);

  const handleReset = () => {
    setLength('');
    setHeight('');
    setSides('1');
  };

  const handleSave = async () => {
    if (area <= 0) return;
    try {
      await saveResultRemote({
        type: 'formwork',
        label: 'Formwork Shuttering',
        inputs: { length: parseFloat(length), height: parseFloat(height), sides: parseFloat(sides) },
        result: area,
        unit: 'm²'
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to save');
    }
  };

  return (
    <div className="p-5">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <header className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Formwork Area</h2>
            <p className="text-xs text-slate-400">Formula: L × H × No. of Sides</p>
          </div>
        </header>

        <CalcField label="Length" value={length} onChange={setLength} placeholder="0.00" />
        <CalcField label="Height" value={height} onChange={setHeight} placeholder="0.00" />
        <CalcField label="Number of Sides" value={sides} onChange={setSides} placeholder="1" unit="ea" />

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-medium">Total Area</span>
            <div className="text-right">
              <span className="text-4xl font-black text-orange-600">{area.toFixed(2)}</span>
              <span className="text-lg font-bold text-orange-400 ml-1">m²</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-95 transition-transform"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={area === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                area > 0 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              {showSaved ? 'Saved!' : <><Save size={18} /> Save</>}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-orange-50/50 rounded-2xl p-5 border border-orange-100">
        <h3 className="font-bold text-orange-800 text-sm mb-2">Did You Know?</h3>
        <p className="text-orange-700/70 text-sm leading-relaxed">
          Formwork area helps in estimating the amount of plywood, timber, or steel shuttering needed. For a simple beam, you usually calculate 3 sides (bottom and 2 sides).
        </p>
      </div>
    </div>
  );
};

export default FormworkCalc;
