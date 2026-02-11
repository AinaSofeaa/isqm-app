import React, { useEffect } from 'react';
import { Check, Info, X } from 'lucide-react';
import { useI18n } from '../src/i18n/I18nContext';

type FeedbackVariant = 'success' | 'error' | 'info';

type FeedbackModalProps = {
  open: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  onClose: () => void;
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, variant, title, message, onClose }) => {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = variant === 'success';
  const isError = variant === 'error';
  const iconBg = isSuccess ? 'bg-emerald-500' : isError ? 'bg-red-500' : 'bg-blue-500';
  const Icon = isSuccess ? Check : isError ? X : Info;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-message"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-100">
        <div className="flex items-center justify-center pt-6">
          <div className={`h-12 w-12 rounded-full ${iconBg} flex items-center justify-center`}>
            <Icon size={24} className="text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="px-6 pt-4 text-center">
          <h3 id="feedback-modal-title" className="text-base font-bold text-slate-800">
            {title}
          </h3>
          <p id="feedback-modal-message" className="mt-1 text-sm text-slate-500">
            {message}
          </p>
        </div>
        <div className="mt-6 border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export type { FeedbackVariant };
export default FeedbackModal;
