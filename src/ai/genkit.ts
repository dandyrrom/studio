import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Prefer GOOGLE_API_KEY, fallback to GEMINI_API_KEY
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!GOOGLE_GENAI_API_KEY) {
  // Provide a clear error early to avoid noisy runtime stack traces
  throw new Error(
    'Missing GOOGLE_API_KEY or GEMINI_API_KEY. Set one in your environment (e.g., .env.local).'
  );
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_GENAI_API_KEY })],
  model: 'googleai/gemini-2.5-flash',
});
