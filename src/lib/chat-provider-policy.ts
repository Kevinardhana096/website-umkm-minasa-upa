export type ProviderFailureKind = "quota" | "timeout" | "network" | "configuration" | "server" | "invalid_response";

export interface ProviderFailure {
  kind: ProviderFailureKind;
  status?: number;
  detail: string;
}

export type ProviderAttempt<T> =
  | { ok: true; value: T }
  | { ok: false; failure: ProviderFailure };

export function getHttpProviderFailure(status: number): ProviderFailure {
  if (status === 429) return { kind: "quota", status, detail: "quota atau rate limit provider tercapai" };
  if (status === 408) return { kind: "timeout", status, detail: "provider mengembalikan request timeout" };
  if (status >= 500) return { kind: "server", status, detail: "provider mengalami gangguan server" };
  return { kind: "configuration", status, detail: "request, kredensial, izin, atau model tidak valid" };
}

export function getCaughtProviderFailure(error: unknown): ProviderFailure {
  if (error instanceof Error && error.name === "AbortError") {
    return { kind: "timeout", detail: "request melewati batas waktu" };
  }
  const cause = error instanceof Error && error.cause && typeof error.cause === "object"
    ? error.cause as { code?: unknown }
    : undefined;
  const code = typeof cause?.code === "string" ? cause.code : undefined;
  return { kind: "network", detail: code ? `koneksi gagal (${code})` : "koneksi jaringan gagal" };
}

export function shouldFallbackToMistral(
  currentProvider: string,
  nextProvider: string | undefined,
  failure: ProviderFailure,
) {
  return currentProvider === "gemini" && nextProvider === "mistral" && failure.kind === "quota";
}
