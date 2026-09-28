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

// 모델이 전부 과부하(503 등)면 잠깐 쉬었다가 목록을 다시 돈다. 무료 등급은 과부하가 수십 초씩 이어지기도 한다.
const ROUND_DELAYS_MS = [0, 1500, 4000];

// 과부하(503)·한도(429)·타임아웃이면 기다리지 않고 바로 다음 모델로 넘어간다
export async function generateWithFallback(models: readonly string[], params: Omit<Params, 'model'>) {
  let lastError: unknown;
  const started = Date.now();
  for (const delay of ROUND_DELAYS_MS) {
    // 응답 없이 멈추는 경우(타임아웃)가 겹치면 사용자가 너무 오래 기다리므로 45초가 넘으면 더 돌지 않는다
    if (delay && Date.now() - started > 45_000) break;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    let onlyQuota = true;  // 전부 한도 초과(429)면 기다려도 풀리지 않으니 다시 돌지 않는다
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
        if (status !== 429) onlyQuota = false;
        console.warn(`Gemini ${model} failed (${status ?? 'timeout'}), trying next model`);
      }
    }
    if (onlyQuota) break;
  }
  throw lastError;
}
