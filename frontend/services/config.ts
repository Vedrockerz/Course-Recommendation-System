const FALLBACK_API_BASE_URL = "http://api.learn-wise.me:8000";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_BASE_URL).trim();

const config = {
  apiBaseUrl: API_BASE_URL,
};

export default config;
