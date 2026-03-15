const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim();

const config = {
  apiBaseUrl: API_BASE_URL,
};

export default config;
