import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fetchWithTimeout } from "../../utils/fetch";

describe("fetchWithTimeout", () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        jest.useRealTimers();
    });

    test("aborts when timeout elapses", async () => {
        jest.useFakeTimers();

        const fetchMock = jest.fn((_: string, init?: RequestInit) => {
            return new Promise<Response>((_, reject) => {
                init?.signal?.addEventListener("abort", () => {
                    const err = new Error("Aborted");
                    err.name = "AbortError";
                    reject(err);
                });
            });
        });

        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const promise = fetchWithTimeout("https://example.com", { timeoutMs: 10 });
        jest.advanceTimersByTime(10);

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("aborts when external signal aborts", async () => {
        const controller = new AbortController();

        const fetchMock = jest.fn((_: string, init?: RequestInit) => {
            return new Promise<Response>((_, reject) => {
                init?.signal?.addEventListener("abort", () => {
                    const err = new Error("Aborted");
                    err.name = "AbortError";
                    reject(err);
                });
            });
        });

        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const promise = fetchWithTimeout("https://example.com", {
            signal: controller.signal,
            timeoutMs: 1000,
        });

        controller.abort();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    });
});
