import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Columns, Layers } from 'lucide-react';
import { useI18n } from '../src/i18n/I18nContext';

const ColumnMenuView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const items = [
    {
      title: t('calc.concrete'),
      icon: <Columns size={28} className="text-emerald-600" />,
      path: '/column/konkrit',
      color: 'bg-emerald-50',
    },
    {
      title: t('calc.formwork'),
      icon: <Layers size={28} className="text-blue-600" />,
      path: '/column/kotak-acuan',
      color: 'bg-blue-50',
    },
  ];

  return (
    <div className="p-4">
      <div className="grid gap-4">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center text-left p-4 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
          >
            <div className={`${item.color} p-4 rounded-xl mr-4`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColumnMenuView;
