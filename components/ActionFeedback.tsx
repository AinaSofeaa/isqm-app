import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

type ActionFeedbackProps = {
  variant: 'success' | 'error';
  message: string;
  className?: string;
};

const ActionFeedback: React.FC<ActionFeedbackProps> = ({ variant, message, className }) => {
  if (!message) return null;

  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;
  const styles = isSuccess
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-red-200 bg-red-50 text-red-700';

  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${styles} ${className ?? ''}`}
      role="status"
    >
      <Icon size={18} className="mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};

export default ActionFeedback;
