import type { InterviewMode } from './modes';
import type { InterviewerRole } from './roles';

export const INTRO_QUESTION = '1분 동안 자기소개 부탁드립니다.';
export const CLOSING_QUESTION = '마지막으로 하고 싶은 말씀이 있으면 해주세요.';

// session_questions.sequence 는 정수라 10 간격으로 두고 꼬리질문을 +5 에 끼운다
export const SEQUENCE_STEP = 10;
export const FOLLOW_UP_OFFSET = 5;

// 답변 제한 시간(초). 넘기면 녹음이 자동으로 끝난다.
// turn = 토론·토의 발언 차례
export const ANSWER_LIMIT_SEC = { intro: 90, main: 120, followUp: 60, closing: 60, pt: 180, turn: 90 } as const;
export type AnswerKind = keyof typeof ANSWER_LIMIT_SEC;

// 면접관 반응·꼬리질문 말투 (Gemini 프롬프트용)
export const MODE_TONE: Record<InterviewMode, string> = {
  realistic: '실제 공기업 면접관처럼 정중하고 중립적인 존댓말. 감정을 드러내지 않는다.',
  casual: '부드럽고 편안한 존댓말. 지원자를 격려하는 분위기.',
  boss: '압박 면접관. 짧고 냉정한 존댓말로 허점을 날카롭게 파고든다.',
  cute: '애니메이션 캐릭터 같은 발랄한 말투의 존댓말. 내용 평가는 실제 면접과 똑같이 엄격하다.',
};

export const greetingLine = (orgName: string) =>
  `안녕하세요. ${orgName} 면접에 오신 것을 환영합니다. 긴장하지 마시고, 편하게 답변해 주세요.`;
export const CLOSING_LINE = '수고하셨습니다. 결과는 추후 안내해 드리겠습니다.';
export const ELIMINATED_LINE = '이번 면접은 여기까지 하겠습니다.';
export const PASS_LINE = '수고하셨습니다. 나가보셔도 됩니다.';

// 불합격·결렬 시 가장 낮게 평가한 면접관의 한마디
export const OBJECTION_LINE: Record<InterviewerRole, string> = {
  hr: '조직에 함께할 모습을 조금 더 보고 싶었습니다.',
  tech: '아직 직무 역량의 깊이가 부족해 보입니다.',
  exec: '우리 기관에 대한 이해가 조금 아쉽습니다.',
};
