import { searchOSM } from "./geocode";

declare const jest: {
  useFakeTimers: () => void;
  useRealTimers: () => void;
  setSystemTime: (time: number) => void;
  advanceTimersByTime: (milliseconds: number) => void;
};

const { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } =
  globalThis as typeof globalThis & {
    describe: (name: string, run: () => void) => void;
    it: (name: string, run: () => void | Promise<void>) => void;
    expect: (actual: unknown) => {
      toEqual: (expected: unknown) => void;
      toHaveLength: (expected: number) => void;
      toHaveBeenCalledTimes: (expected: number) => void;
      rejects: { toThrow: (message: string) => Promise<void> };
    };
    beforeAll: (run: () => void) => void;
    beforeEach: (run: () => void) => void;
    afterEach: (run: () => void) => void;
    afterAll: (run: () => void) => void;
  };
const originalFetch = globalThis.fetch;
const calls: Array<{
  url: string;
  options?: RequestInit;
  startedAt: number;
}> = [];
let responseBody: unknown[] = [];
let responseStatus = 200;

const mockFetch: typeof fetch = async (input, options) => {
  calls.push({ url: input.toString(), options, startedAt: Date.now() });
  return {
    ok: responseStatus >= 200 && responseStatus < 300,
    status: responseStatus,
    json: async () => responseBody,
  } as Response;
};

describe("searchOSM", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    calls.length = 0;
    responseBody = [
      {
        display_name: "Hampi, Karnataka, India",
        lat: "15.3350",
        lon: "76.4600",
        type: "city",
        boundingbox: ["15.2", "15.4", "76.3", "76.6"],
      },
    ];
    responseStatus = 200;
    jest.advanceTimersByTime(1200);
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("sends India-only search parameters and parses results", async () => {
    const results = await searchOSM("Hampi test params");
    const requestUrl = new URL(calls[0].url);

    expect(requestUrl.searchParams.get("q")).toEqual("Hampi test params");
    expect(requestUrl.searchParams.get("format")).toEqual("jsonv2");
    expect(requestUrl.searchParams.get("countrycodes")).toEqual("in");
    expect(requestUrl.searchParams.get("limit")).toEqual("5");
    expect(results).toEqual([
      {
        displayName: "Hampi, Karnataka, India",
        lat: 15.335,
        lng: 76.46,
        type: "city",
        boundingBox: [15.2, 15.4, 76.3, 76.6],
      },
    ]);
  });

  it("caches repeated normalized queries", async () => {
    await searchOSM("Hampi test cache");
    await searchOSM("  hampi test cache  ");

    expect(calls).toHaveLength(1);
  });

  it("does not request queries shorter than three characters", async () => {
    expect(await searchOSM("Hi")).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("throttles requests to at most one per second", async () => {
    const firstRequest = searchOSM("Hampi throttle first");
    await firstRequest;
    const secondRequest = searchOSM("Hampi throttle second");

    expect(calls).toHaveLength(1);
    jest.advanceTimersByTime(1100);
    await secondRequest;

    expect(calls).toHaveLength(2);
    expect(calls[1].startedAt - calls[0].startedAt).toEqual(1100);
  });

  it("returns a friendly error for non-200 responses", async () => {
    responseStatus = 429;

    await expect(searchOSM("Hampi rate limited")).rejects.toThrow(
      "OpenStreetMap is receiving too many requests",
    );
  });

  it("supports aborting a request", async () => {
    const controller = new AbortController();
    const pendingSearch = searchOSM("Hampi abort request", controller.signal);
    controller.abort();

    await expect(pendingSearch).rejects.toThrow("cancelled");
    expect(calls).toHaveLength(0);
  });
});
