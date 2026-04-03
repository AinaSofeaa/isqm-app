import React from 'react';
import CalcField from './CalcField';
import QMField from './QMField';
import { useI18n } from '../src/i18n/I18nContext';

type SaveMetaFieldsProps = {
  projectLocation: string;
  referenceRemark: string;
  onProjectLocationChange: (value: string) => void;
  onReferenceRemarkChange: (value: string) => void;
  variant?: 'calc' | 'qm';
};

const SaveMetaFields: React.FC<SaveMetaFieldsProps> = ({
  projectLocation,
  referenceRemark,
  onProjectLocationChange,
  onReferenceRemarkChange,
  variant = 'calc',
}) => {
  const { t } = useI18n();

  if (variant === 'qm') {
    return (
      <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('history.savedDetailsTitle')}</h3>
        <QMField
          label={t('history.projectLocationLabel')}
          value={projectLocation}
          onChange={onProjectLocationChange}
          placeholder={t('history.projectLocationPlaceholder')}
          helperText={t('common.optional')}
          inputMode="text"
          type="text"
        />
        <QMField
          label={t('history.referenceRemarkLabel')}
          value={referenceRemark}
          onChange={onReferenceRemarkChange}
          placeholder={t('history.referenceRemarkPlaceholder')}
          helperText={t('common.optional')}
          inputMode="text"
          type="text"
        />
      </div>
    );
  }

  return (
    <div className="mt-6 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t('history.savedDetailsTitle')}</h3>
      <CalcField
        label={t('history.projectLocationLabel')}
        value={projectLocation}
        onChange={onProjectLocationChange}
        placeholder={t('history.projectLocationPlaceholder')}
        unit=""
        type="text"
        inputMode="text"
      />
      <CalcField
        label={t('history.referenceRemarkLabel')}
        value={referenceRemark}
        onChange={onReferenceRemarkChange}
        placeholder={t('history.referenceRemarkPlaceholder')}
        unit=""
        type="text"
        inputMode="text"
      />
    </div>
  );
};

export default SaveMetaFields;
