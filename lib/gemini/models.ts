// 음성·PDF 입력 + JSON 스키마 출력을 지원하는 모델. 앞 모델이 과부하(503)면 다음 모델로 넘어간다.
export const MODELS = {
  evaluation: ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'],
  tts: 'gemini-3.8-flash-tts',
} as const;
