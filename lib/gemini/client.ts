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

// 모델 과부하(503)가 잦아서, 같은 모델로 한 번 더 시도한 뒤 다음 모델로 넘어간다
export async function generateWithFallback(models: readonly string[], params: Omit<Params, 'model'>) {
  let lastError: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // 과부하 때 응답 없이 오래 붙잡히는 경우가 있어 시도마다 45초 제한
        return await getGeminiClient().models.generateContent({
          ...params,
          model,
          config: { ...params.config, httpOptions: { timeout: 45_000, ...params.config?.httpOptions } },
        });
      } catch (e) {
        lastError = e;
        const status = (e as { status?: number }).status;
        if (status !== undefined && !RETRYABLE.has(status)) throw e; // 타임아웃(status 없음)은 재시도
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
