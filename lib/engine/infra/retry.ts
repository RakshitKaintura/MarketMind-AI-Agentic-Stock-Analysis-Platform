// Exponential backoff retry with jitter

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    retryableStatuses?: number[];
  } = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 1000, retryableStatuses = [429, 500, 503] } = options;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      const status = error?.status || error?.response?.status;
      if (status && !retryableStatuses.includes(status)) throw error;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}
