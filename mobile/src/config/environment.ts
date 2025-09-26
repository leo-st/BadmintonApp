// Environment configuration for Badminton App Mobile
// This file manages different environment settings

export interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Default configuration (can be overridden by environment variables)
const defaultConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://badmintonapp-production.up.railway.app',
  API_TIMEOUT: 10000,
  NODE_ENV: 'development',
};

// Environment-specific configurations
const environments: Record<string, Partial<EnvironmentConfig>> = {
  development: {
    API_BASE_URL: 'http://192.168.1.114:8000',
    NODE_ENV: 'development',
  },
  production: {
    API_BASE_URL: 'https://badmintonapp-production.up.railway.app',
    NODE_ENV: 'production',
  },
  localhost: {
    API_BASE_URL: 'http://localhost:8000',
    NODE_ENV: 'development',
  },
};

// Get current environment from process.env or default to 'development'
const currentEnv = process.env.EXPO_PUBLIC_ENV || 'development';

// Merge default config with environment-specific config
const config: EnvironmentConfig = {
  ...defaultConfig,
  ...environments[currentEnv],
};

// Override with environment variables if they exist
if (process.env.EXPO_PUBLIC_API_BASE_URL) {
  config.API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
}

if (process.env.EXPO_PUBLIC_API_TIMEOUT) {
  config.API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT, 10);
}

export default config;

// Helper function to switch environments
export const switchEnvironment = (env: string) => {
  if (environments[env]) {
    return {
      ...defaultConfig,
      ...environments[env],
    };
  }
  return config;
};

// Log current configuration (only in development)
if (config.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration:', {
    environment: currentEnv,
    apiBaseUrl: config.API_BASE_URL,
    nodeEnv: config.NODE_ENV,
  });
}
