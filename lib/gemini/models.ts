// 음성·PDF 입력 + JSON 스키마 출력을 지원하는 모델. 앞 모델이 실패하면 다음 모델로 넘어간다.
// 2026-09 실측(답변 음성 평가): 3.5-flash-lite 2.5~2.9초·안정 / flash-latest 3~4초·가끔 503 /
// 2.5-flash 과부하(503)·무료 한도(429) 잦음. 3.5-flash 는 13~40초라 제외.
// 3.1-flash-lite 는 3.5-flash-lite 가 멈출 때 받아 주는 예비 (응답 5초 안팎).
export const MODELS = {
  evaluation: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'],
} as const;
