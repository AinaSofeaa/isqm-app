
import React, { useState, useEffect } from 'react';
import CalcField from '../components/CalcField';
import { RotateCcw, Save, Grid } from 'lucide-react';
import { saveResultRemote } from '../services/historyService';

const RebarCalc: React.FC = () => {
  const [areaLength, setAreaLength] = useState('');
  const [spacing, setSpacing] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [roundedQuantity, setRoundedQuantity] = useState<number>(0);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const l = parseFloat(areaLength) || 0;
    const s = parseFloat(spacing) || 0;
    
    if (s > 0) {
      const q = l / s;
      setQuantity(q);
      setRoundedQuantity(Math.ceil(q) + 1); // Typical site practice is (L/S) + 1
    } else {
      setQuantity(0);
      setRoundedQuantity(0);
    }
  }, [areaLength, spacing]);

  const handleReset = () => {
    setAreaLength('');
    setSpacing('');
  };

  const handleSave = async () => {
    if (quantity <= 0) return;
    try {
      await saveResultRemote({
        type: 'rebar',
        label: 'Reinforcement Bars',
        inputs: { length: parseFloat(areaLength), spacing: parseFloat(spacing) },
        result: roundedQuantity,
        unit: 'pcs'
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
          <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-600">
            <Grid size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Rebar Estimator</h2>
            <p className="text-xs text-slate-400">Formula: Area Length ÷ Spacing</p>
          </div>
        </header>

        <CalcField label="Total Area Length" value={areaLength} onChange={setAreaLength} placeholder="0.00" />
        <CalcField label="Bar Spacing (Center-to-Center)" value={spacing} onChange={setSpacing} placeholder="0.15" />

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-medium">Mathematical Result</span>
              <span className="text-slate-600 font-bold">{quantity.toFixed(2)} bars</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-400 font-medium">Site Recommended <br/><span className="text-[10px] text-slate-300">(Ceil + 1)</span></span>
              <div className="text-right">
                <span className="text-4xl font-black text-emerald-600">{roundedQuantity}</span>
                <span className="text-lg font-bold text-emerald-400 ml-1">pcs</span>
              </div>
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
              disabled={roundedQuantity === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                roundedQuantity > 0 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              {showSaved ? 'Saved!' : <><Save size={18} /> Save</>}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
        <h3 className="font-bold text-emerald-800 text-sm mb-2">Construction Rule</h3>
        <p className="text-emerald-700/70 text-sm leading-relaxed">
          In actual construction, we always round up the division and <strong>add one additional starter bar</strong> to ensure the full area is covered correctly.
        </p>
      </div>
    </div>
  );
};

export default RebarCalc;
