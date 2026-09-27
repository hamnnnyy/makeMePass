import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { assertEnv } from '@/lib/utils/assertEnv';

let _client: GoogleGenAI | undefined;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: assertEnv('GEMINI_API_KEY') });
  }
  return _client;
}
