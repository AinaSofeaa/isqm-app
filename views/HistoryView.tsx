
import React, { useState, useEffect } from 'react';
import { getHistoryRemote, clearHistoryRemote, deleteHistoryRemote } from '../services/historyService';
import { SavedResult } from '../types';
import { Trash2, Trash, History as HistoryIcon, Layers, Maximize, Grid } from 'lucide-react';

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await getHistoryRemote();
        setHistory(rows);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleClearAll = () => {
    if (window.confirm('Clear all calculation history?')) {
      (async () => {
        try {
          await clearHistoryRemote();
          setHistory([]);
        } catch (e: any) {
          alert(e?.message ?? 'Failed to clear');
        }
      })();
    }
  };

  const handleDeleteItem = (id: string) => {
    (async () => {
      try {
        await deleteHistoryRemote(id);
        setHistory((prev) => prev.filter((x) => x.id !== id));
      } catch (e: any) {
        alert(e?.message ?? 'Failed to delete');
      }
    })();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'concrete': return <Layers size={18} className="text-blue-500" />;
      case 'formwork': return <Maximize size={18} className="text-orange-500" />;
      case 'rebar': return <Grid size={18} className="text-emerald-500" />;
      default: return <HistoryIcon size={18} />;
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-MY', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Recent Records</h3>
        {history.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:bg-red-100 transition-colors"
          >
            <Trash size={14} /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <HistoryIcon size={64} strokeWidth={1} />
          <p className="mt-4 font-medium">Loading…</p>
          <p className="text-xs text-slate-400">Fetching your records.</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <HistoryIcon size={64} strokeWidth={1} />
          <p className="mt-4 font-medium">Can't load history</p>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <HistoryIcon size={64} strokeWidth={1} />
          <p className="mt-4 font-medium">No history found</p>
          <p className="text-xs text-slate-400">Save your calculations to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative group overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-800">
                    {item.result.toFixed(item.type === 'rebar' ? 0 : 2)}
                    <span className="text-xs font-bold text-slate-400 ml-1">{item.unit}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2 flex-wrap">
                {Object.entries(item.inputs).map(([k, v]) => (
                  <span key={k} className="bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">
                    {k}: {v}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => handleDeleteItem(item.id)}
                className="absolute right-0 top-0 h-full bg-red-50 text-red-500 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:bg-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
