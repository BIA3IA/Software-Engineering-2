type FetchWithTimeoutOptions = RequestInit & {
    timeoutMs?: number;
};

export const DEFAULT_EXTERNAL_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(
    url: string,
    options: FetchWithTimeoutOptions = {}
): Promise<Response> {
    const { timeoutMs = DEFAULT_EXTERNAL_TIMEOUT_MS, signal, ...init } = options;
    const controller = new AbortController();

    if (signal) {
        if (signal.aborted) {
            controller.abort();
        } else {
            signal.addEventListener("abort", () => controller.abort(), { once: true });
        }
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}
