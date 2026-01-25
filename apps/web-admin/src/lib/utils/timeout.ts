/**
 * Timeout utility for API calls to prevent infinite loading
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Creates a promise that rejects after the specified timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Creates a timeout promise that can be cancelled
 */
export function createTimeout(timeoutMs: number): {
  promise: Promise<never>;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError('Operation timeout'));
    }, timeoutMs);
  });

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { promise, cancel };
}
