/**
 * Environment Variable Validation
 * 
 * This module validates all required environment variables at startup.
 * Following production best practice: "Better to fail at startup than fail in production"
 */

export interface EnvironmentVariables {
  // Database
  DATABASE_URL: string;

  // JWT Authentication
  JWT_SECRET: string;
  JWT_EXPIRATION?: string;

  // Server Configuration
  NODE_ENV: string;
  API_PORT?: string;

  // CORS
  CORS_ORIGIN?: string;

  // Frontend
  FRONTEND_URL: string;

  // Optional but recommended
  GEMINI_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
  
  // Email (optional)
  MAIL_SMTP_HOST?: string;
  MAIL_SMTP_PORT?: string;
  MAIL_SMTP_USER?: string;
  MAIL_SMTP_PASS?: string;
  MAIL_FROM?: string;

  // GraphQL
  GRAPHQL_PLAYGROUND?: string;
  GRAPHQL_DEBUG?: string;
}

/**
 * Validates environment variables at startup
 * Throws an error with clear message if any required variable is missing
 */
export function validateEnvironment(): EnvironmentVariables {
  const errors: string[] = [];
  
  // Check required variables
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
    'FRONTEND_URL',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`  ❌ ${varName} is required but not set`);
    }
  }

  // Validate JWT_SECRET length (minimum 32 characters for production)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push(`  ⚠️  JWT_SECRET should be at least 32 characters long (current: ${process.env.JWT_SECRET.length})`);
  }

  // Warn about missing optional but important variables
  const warnings: string[] = [];
  
  if (!process.env.GEMINI_API_KEY) {
    warnings.push('  ⚠️  GEMINI_API_KEY not set - AI features will not work');
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    warnings.push('  ⚠️  GOOGLE_MAPS_API_KEY not set - Geocoding features will not work');
  }

  // If there are errors, throw with detailed message
  if (errors.length > 0) {
    const errorMessage = [
      '',
      '╔════════════════════════════════════════════════════════════╗',
      '║  ❌ ENVIRONMENT VALIDATION FAILED                          ║',
      '╚════════════════════════════════════════════════════════════╝',
      '',
      'Missing or invalid required environment variables:',
      '',
      ...errors,
      '',
      'Please set these variables in your .env file.',
      'See .env.example for reference.',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Show warnings if any
  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.log(w));
    console.log('');
  }

  return process.env as EnvironmentVariables;
}
