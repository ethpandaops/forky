/**
 * Runtime configuration for the generated API client (hey-api).
 *
 * Wired in via `openapi-ts.config.ts` (`runtimeConfigPath`). The generated
 * client imports `createClientConfig` from here and calls it with its default
 * config. Forky's API is unauthenticated and served from the same origin, so
 * the base URL defaults to a relative path.
 */

export const BASE_URL = import.meta.env.VITEST
  ? 'http://localhost:5555'
  : import.meta.env.VITE_API_URL || '';

interface ClientConfig {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export const createClientConfig = <T extends ClientConfig>(config: T): T & { baseUrl: string } => ({
  ...config,
  baseUrl: BASE_URL,
});
