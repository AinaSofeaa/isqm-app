export type FieldStateArgs = {
  value: string;
  validator: (value: string) => string | null;
  touched: boolean;
  submitted: boolean;
};

export type FieldState = {
  showError: boolean;
  showSuccess: boolean;
};

export const getFieldState = ({
  value,
  validator,
  touched,
  submitted,
}: FieldStateArgs): FieldState => {
  const error = validator(value);
  const hasValue = value.trim().length > 0;
  const shouldShow = touched || submitted;
  return {
    showError: shouldShow && !!error,
    showSuccess: shouldShow && !error && hasValue,
  };
};
