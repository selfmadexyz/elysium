process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/elysium_test';

if (process.env.RUN_DATABASE_TESTS === '1') {
  const databaseName = decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1));
  if (databaseName !== 'elysium_test') {
    throw new Error('Database integration tests require a database named exactly "elysium_test"');
  }
}

process.env.PORT = '3001';
process.env.BETTER_AUTH_SECRET = '0123456789abcdef0123456789abcdef';
process.env.BETTER_AUTH_URL = 'http://localhost:3001';
process.env.GOOGLE_CLIENT_ID = 'test-client';
process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
process.env.APP_URL = 'http://localhost:3000';
