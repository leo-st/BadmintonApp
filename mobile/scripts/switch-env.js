#!/usr/bin/env node

/**
 * Environment Switcher Script
 * Usage: node scripts/switch-env.js [development|production|localhost]
 */

const fs = require('fs');
const path = require('path');

const environments = {
  development: {
    EXPO_PUBLIC_ENV: 'development',
    EXPO_PUBLIC_API_BASE_URL: 'http://192.168.1.114:8000',
    EXPO_PUBLIC_API_TIMEOUT: '10000'
  },
  production: {
    EXPO_PUBLIC_ENV: 'production',
    EXPO_PUBLIC_API_BASE_URL: 'https://web-production-d1979.up.railway.app',
    EXPO_PUBLIC_API_TIMEOUT: '10000'
  },
  localhost: {
    EXPO_PUBLIC_ENV: 'localhost',
    EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8000',
    EXPO_PUBLIC_API_TIMEOUT: '10000'
  }
};

function switchEnvironment(env) {
  if (!environments[env]) {
    console.error(`❌ Invalid environment: ${env}`);
    console.log('Available environments:', Object.keys(environments).join(', '));
    process.exit(1);
  }

  const envFile = path.join(__dirname, '..', '.env.local');
  const config = environments[env];
  
  // Create .env.local content
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';

  try {
    fs.writeFileSync(envFile, envContent);
    console.log(`✅ Switched to ${env} environment`);
    console.log(`📝 Created ${envFile}`);
    console.log(`🌐 API Base URL: ${config.EXPO_PUBLIC_API_BASE_URL}`);
    console.log('\n🔄 Please restart your Expo development server for changes to take effect.');
  } catch (error) {
    console.error('❌ Failed to write environment file:', error.message);
    process.exit(1);
  }
}

// Get environment from command line argument
const targetEnv = process.argv[2];

if (!targetEnv) {
  console.log('🏸 Badminton App - Environment Switcher');
  console.log('\nUsage: node scripts/switch-env.js [environment]');
  console.log('\nAvailable environments:');
  Object.entries(environments).forEach(([name, config]) => {
    console.log(`  ${name.padEnd(12)} - ${config.EXPO_PUBLIC_API_BASE_URL}`);
  });
  console.log('\nExample: node scripts/switch-env.js development');
  process.exit(0);
}

switchEnvironment(targetEnv);
