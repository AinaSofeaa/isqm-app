import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import FeedbackModal, { type FeedbackVariant } from '../components/FeedbackModal';

type FeedbackPayload = {
  variant: FeedbackVariant;
  title: string;
  message: string;
};

type FeedbackContextValue = {
  show: (payload: FeedbackPayload) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  close: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payload, setPayload] = useState<FeedbackPayload | null>(null);

  const close = useCallback(() => setPayload(null), []);

  const show = useCallback((next: FeedbackPayload) => {
    setPayload(next);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    show({ variant: 'success', title, message });
  }, [show]);

  const showError = useCallback((title: string, message: string) => {
    show({ variant: 'error', title, message });
  }, [show]);

  const showInfo = useCallback((title: string, message: string) => {
    show({ variant: 'info', title, message });
  }, [show]);

  const value = useMemo<FeedbackContextValue>(() => ({
    show,
    showSuccess,
    showError,
    showInfo,
    close,
  }), [show, showSuccess, showError, showInfo, close]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackModal
        open={Boolean(payload)}
        variant={payload?.variant ?? 'info'}
        title={payload?.title ?? ''}
        message={payload?.message ?? ''}
        onClose={close}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
};
