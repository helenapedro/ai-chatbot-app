import 'dotenv/config';
import z from 'zod';

const emptyStringToUndefined = (value: unknown) => {
   if (typeof value === 'string' && value.trim() === '') {
      return undefined;
   }

   return value;
};

const envSchema = z.object({
   NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
   OPEN_API_KEY: z.string().trim().min(1, 'OPEN_API_KEY is required'),
   HELENA_EXPLORA_SITE_URL: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().url('HELENA_EXPLORA_SITE_URL must be a valid URL')
   ),
   PORT: z.coerce.number().int().min(1).max(65535).default(3000),
   CLIENT_ORIGIN: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().default('http://localhost:5173')
   ),
   JSON_BODY_LIMIT: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().default('16kb')
   ),
   RATE_LIMIT_WINDOW_MS: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().default(60_000)
   ),
   RATE_LIMIT_MAX_REQUESTS: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().default(30)
   ),
   TRUST_PROXY: z.preprocess(
      emptyStringToUndefined,
      z
         .union([z.literal('true'), z.literal('false')])
         .default('false')
         .transform((value) => value === 'true')
   ),
   CHATBOT_ENCRYPTION_KEY: z.preprocess(
      emptyStringToUndefined,
      z
         .string()
         .trim()
         .regex(
            /^[a-f0-9]{64}$/i,
            'CHATBOT_ENCRYPTION_KEY must be a 64-character hex string'
         )
   ),
   CHATBOT_DB_HOST: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, 'CHATBOT_DB_HOST is required')
   ),
   CHATBOT_DB_PORT: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().min(1).max(65535).default(3306)
   ),
   CHATBOT_DB_NAME: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, 'CHATBOT_DB_NAME is required')
   ),
   CHATBOT_DB_USER: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, 'CHATBOT_DB_USER is required')
   ),
   CHATBOT_DB_PASSWORD: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1, 'CHATBOT_DB_PASSWORD is required')
   ),
   CHATBOT_DB_CONNECTION_LIMIT: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().default(10)
   ),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
   console.error('Invalid server environment configuration.');
   console.error(
      JSON.stringify(parsedEnv.error.flatten().fieldErrors, null, 2)
   );
   process.exit(1);
}

export const env = parsedEnv.data;
