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

type Params = Parameters<GoogleGenAI['models']['generateContent']>[0];
const RETRYABLE = new Set([429, 500, 503, 504]);

// 과부하(503)·한도(429)·타임아웃이면 기다리지 않고 바로 다음 모델로 넘어간다
export async function generateWithFallback(models: readonly string[], params: Omit<Params, 'model'>) {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await getGeminiClient().models.generateContent({
        ...params,
        model,
        config: { ...params.config, httpOptions: { timeout: 20_000, ...params.config?.httpOptions } },
      });
    } catch (e) {
      lastError = e;
      const status = (e as { status?: number }).status;
      if (status !== undefined && !RETRYABLE.has(status)) throw e; // 요청 자체가 잘못된 경우
      console.warn(`Gemini ${model} failed (${status ?? 'timeout'}), trying next model`);
    }
  }
  throw lastError;
}
