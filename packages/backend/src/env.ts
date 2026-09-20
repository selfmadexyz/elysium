import { Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Value } from '@sinclair/typebox/value';

const envSchema = Type.Object({
  DATABASE_URL: Type.String(),
  PORT: Type.String({ default: '3001' }),
  BETTER_AUTH_SECRET: Type.String(),
  BETTER_AUTH_URL: Type.String(),
  GOOGLE_CLIENT_ID: Type.String(),
  GOOGLE_CLIENT_SECRET: Type.String(),
  APP_URL: Type.String(),
});

export const env = (() => {
  const compiled = TypeCompiler.Compile(envSchema);

  const envSource = structuredClone(process.env);
  Value.Clean(envSchema, envSource);
  Value.Default(envSchema, envSource);

  const errors = Array.from(compiled.Errors(envSource));

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`❌ Invalid env: ${error.path} ${error.message}`);
    }
    process.exit(1);
  }

  return compiled.Decode(envSource);
})();

export type Env = typeof env;
