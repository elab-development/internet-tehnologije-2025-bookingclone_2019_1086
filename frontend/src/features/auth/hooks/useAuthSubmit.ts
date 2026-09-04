import { useState } from "react";

/**
 * Shared submit handling for the login and register forms: keeps the error and
 * pending flags, and turns a thrown Error into a message the form can render.
 */
export function useAuthSubmit(fallbackMessage: string) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(action: () => Promise<void>) {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await action();
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
        return;
      }

      setError(fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    error,
    isSubmitting,
    submit,
  };
}
