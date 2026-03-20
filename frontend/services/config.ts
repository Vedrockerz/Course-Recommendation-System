const API_BASE_URL = "/api";
const API_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff
const HEALTH_CHECK_INTERVAL_MS = 1000; // Health check interval
const MAX_HEALTH_RETRIES = 30; // Max health check retries (30 seconds total)

const config = {
  apiBaseUrl: API_BASE_URL,
  apiTimeout: API_TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
  retryDelayMs: RETRY_DELAY_MS,
  healthCheckInterval: HEALTH_CHECK_INTERVAL_MS,
  maxHealthRetries: MAX_HEALTH_RETRIES,
};

export default config;
