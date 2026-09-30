export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  boundingBox?: [number, number, number, number];
}

export class GeocodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodeError";
  }
}

const cache = new Map<string, GeocodeResult[]>();
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

const createAbortError = (): Error => {
  const error = new Error("OpenStreetMap search was cancelled.");
  error.name = "AbortError";
  return error;
};

const waitForDelay = (delay: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delay);
    const onAbort = (): void => {
      window.clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      reject(createAbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

const acquireRequestSlot = (signal?: AbortSignal): Promise<void> => {
  const slot = requestQueue.then(async () => {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const delay = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (delay > 0) {
      await waitForDelay(delay, signal);
    }

    if (signal?.aborted) {
      throw createAbortError();
    }
    lastRequestAt = Date.now();
  });

  requestQueue = slot.then(
    () => undefined,
    () => undefined,
  );
  return slot;
};

const getFriendlyError = (status?: number): GeocodeError => {
  if (status === 429) {
    return new GeocodeError(
      "OpenStreetMap is receiving too many requests. Please try again shortly.",
    );
  }
  if (status) {
    return new GeocodeError(
      "OpenStreetMap could not complete the search. Please try again.",
    );
  }
  return new GeocodeError(
    "Could not reach OpenStreetMap. Check your connection and try again.",
  );
};

/** Searches OpenStreetMap on demand, caching and throttling requests per browser. */
export async function searchOSM(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) return [];

  const key = trimmedQuery
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const cachedResults = cache.get(key);
  if (cachedResults) return cachedResults;

  try {
    await acquireRequestSlot(signal);
    if (signal?.aborted) {
      throw createAbortError();
    }

    const queuedResults = cache.get(key);
    if (queuedResults) return queuedResults;

    const params = new URLSearchParams({
      q: trimmedQuery,
      format: "jsonv2",
      limit: "5",
      countrycodes: "in",
      addressdetails: "0",
    });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: { Accept: "application/json" },
        signal,
      },
    );

    if (!response.ok) {
      throw getFriendlyError(response.status);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw getFriendlyError();
    }

    const results = data
      .map((result: Record<string, unknown>): GeocodeResult | null => {
        const lat = Number(result.lat);
        const lng = Number(result.lon);
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          typeof result.display_name !== "string"
        ) {
          return null;
        }

        const boundingBox = Array.isArray(result.boundingbox)
          ? result.boundingbox.map(Number)
          : undefined;

        return {
          displayName: result.display_name,
          lat,
          lng,
          type: typeof result.type === "string" ? result.type : "",
          ...(boundingBox?.length === 4
            ? { boundingBox: boundingBox as GeocodeResult["boundingBox"] }
            : {}),
        };
      })
      .filter((result): result is GeocodeResult => result !== null)
      .slice(0, 5);

    cache.set(key, results);
    return results;
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw error;
    }
    if (error instanceof GeocodeError) {
      throw error;
    }
    throw getFriendlyError();
  }
}
