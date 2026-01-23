
import React, { useState, useEffect } from 'react';
import CalcField from '../components/CalcField';
import { RotateCcw, Save, Calculator } from 'lucide-react';
import { saveResultRemote } from '../services/historyService';

const ConcreteCalc: React.FC = () => {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [volume, setVolume] = useState<number>(0);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    setVolume(l * w * h);
  }, [length, width, height]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setHeight('');
  };

  const handleSave = async () => {
    if (volume <= 0) return;
    try {
      await saveResultRemote({
        type: 'concrete',
        label: 'Concrete Slab/Beam',
        inputs: { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) },
        result: volume,
        unit: 'm³'
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
          <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">New Measurement</h2>
            <p className="text-xs text-slate-400">Formula: L × W × H</p>
          </div>
        </header>

        <CalcField label="Length" value={length} onChange={setLength} placeholder="0.00" />
        <CalcField label="Width" value={width} onChange={setWidth} placeholder="0.00" />
        <CalcField label="Height / Depth" value={height} onChange={setHeight} placeholder="0.00" />

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-medium">Total Volume</span>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-700">{volume.toFixed(3)}</span>
              <span className="text-lg font-bold text-blue-400 ml-1">m³</span>
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
              disabled={volume === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                volume > 0 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              {showSaved ? 'Saved!' : <><Save size={18} /> Save</>}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
           Learning Note
        </h3>
        <p className="text-blue-700/70 text-sm leading-relaxed">
          The result is expressed in <strong>cubic meters (m³)</strong>. 1 m³ is equal to approximately 35.31 cubic feet. This volume is crucial for ordering concrete ready-mix.
        </p>
      </div>
    </div>
  );
};

export default ConcreteCalc;
