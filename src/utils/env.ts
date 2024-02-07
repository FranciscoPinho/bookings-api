export const PORT = getEnvVar<number>('PORT', 'number');
export const CORS_ORIGIN = getEnvVar<string>('CORS_ORIGIN', 'string');
export const PG_HOST = getEnvVar<string>('PG_HOST', 'string');
export const PG_PORT = getEnvVar<number>('PG_PORT', 'number');
export const PG_USER = getEnvVar<string>('PG_USER', 'string');
export const PG_PASS = getEnvVar<string>('PG_PASS', 'string');
export const PG_DATABASE = getEnvVar<string>('PG_DATABASE', 'string');

export function getEnvVar<T extends string | number>(key: string, type: 'string' | 'number'): T {
  const value = process.env[key];
  if (value == null) {
    throw new Error(`Unknown process.env.${key}: ${value}. Is your .env file setup?`);
  }

  if (type === 'number') {
    const numValue = parseInt(value);
    if (Number.isNaN(numValue)) {
      throw new Error(`process.env.${key} must be a number. Got ${value}`);
    }
    return numValue as T;
  }

  return value as T;
}
