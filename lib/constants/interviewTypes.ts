import type { QuestionCategory } from '@/types/supabase';
import { INTERVIEWER_ROLES, type InterviewerRole } from './roles';

export const INTERVIEW_TYPES = ['general', 'personality', 'job', 'executive', 'pt', 'debate', 'discussion'] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_TYPE_INFO: Record<InterviewType, {
  label: string;
  desc: string;
  categories: QuestionCategory[] | null;  // null = 전체
  focus: string;                          // 평가 프롬프트에 넣는 유형별 관점
}> = {
  general: {
    label: '종합',
    desc: '인성·직무·가치관 질문을 고루 섞은 기본 면접',
    categories: null,
    focus: '인성, 직무역량, 가치관을 고르게 본다.',
  },
  personality: {
    label: '인성면접',
    desc: '태도·협업·경험 중심, 인사 면접관 주도',
    categories: ['personality', 'experience', 'motivation'],
    focus: '인성면접: 태도, 협업, 갈등 해결, 경험의 진정성과 일관성을 중점적으로 본다.',
  },
  job: {
    label: '직무면접',
    desc: 'NCS 직무역량과 실무 경험 검증',
    categories: ['job_competency', 'experience'],
    focus: '직무면접: 직무 이해도, 전문 지식, 문제 해결 과정, 경험의 구체성(수치·역할)을 중점적으로 본다.',
  },
  executive: {
    label: '임원면접',
    desc: '가치관·윤리·기관 이해와 장기 비전',
    categories: ['values_ethics', 'motivation'],
    focus: '임원면접: 공직 가치관, 윤리 의식, 기관의 역할 이해, 장기 비전과 조직 적합성을 중점적으로 본다.',
  },
  pt: {
    label: 'PT면접',
    desc: '주제 준비 2분 → 발표 3분 → 발표 내용 꼬리질문',
    categories: null,
    focus: 'PT면접: 문제 정의, 논리 구조(서론-본론-결론), 근거와 실현 가능성, 시간 배분과 발표 전달력을 본다. 꼬리질문은 발표의 허점·근거·실행 방안을 파고든다.',
  },
  debate: {
    label: '토론면접',
    desc: '찬반 주제로 AI 지원자와 입론·반론·최종 발언',
    categories: null,
    focus: '토론면접: 주장의 논리와 근거, 상대 주장을 정확히 짚은 반론, 감정적이지 않은 태도, 상대 발언 경청을 본다. 이기는 것보다 설득 과정과 태도가 중요하다.',
  },
  discussion: {
    label: '토의면접',
    desc: '과제를 두고 AI 지원자와 합의안 도출',
    categories: null,
    focus: '토의면접: 문제 정의, 실현 가능한 아이디어, 다른 의견 경청과 조율, 논의를 정리해 합의로 이끄는 역할을 본다. 자기 주장만 고집하면 감점한다.',
  },
};

// 면접 형식은 유형과 따로 고른다: AI 지원자 참여, 면접관 수, 언어
// AI 지원자와 함께 볼 수 있는 유형 / 항상 함께하는 유형 (PT 는 혼자 발표)
export const PEER_OPTIONAL: readonly InterviewType[] = ['general', 'personality', 'job', 'executive'];
export const PEER_REQUIRED: readonly InterviewType[] = ['debate', 'discussion'];
// 면접관 1명일 때 들어오는 면접관
export const SOLO_ROLE: Record<InterviewType, InterviewerRole> = {
  general: 'exec', personality: 'hr', job: 'tech', executive: 'exec', pt: 'exec', debate: 'exec', discussion: 'exec',
};
export const panelRoles = (s: { panel_size: number; interview_type: InterviewType }): InterviewerRole[] =>
  s.panel_size === 1 ? [SOLO_ROLE[s.interview_type]] : [...INTERVIEWER_ROLES];
// 첫인사·마무리처럼 면접을 이끄는 면접관
export const leadRole = (roles: InterviewerRole[]): InterviewerRole => (roles.includes('exec') ? 'exec' : roles[0]);

// 전산(IT) 직무 지원자에게 주는 평가·질문 관점
export const IT_TRACK_NOTE = '지원자는 전산(IT) 직무 지원자다. 기술 질문은 기능 나열이 아니라 원리·특징·트레이드오프(왜 빠른지, 언제 쓰면 안 되는지)까지 설명하는지, 업무 문제를 IT로 해결하는 관점이 있는지 본다.';

// '임원면접 · 전산 · 다대다 · 면접관 1명 · 영어' 처럼 유형과 형식을 한 줄로
export function formatLabel(s: { interview_type: InterviewType; with_peers: boolean; panel_size: number; language: string; track?: string }) {
  return [
    INTERVIEW_TYPE_INFO[s.interview_type]?.label ?? s.interview_type,
    s.track === 'it' && '전산',
    s.with_peers && !PEER_REQUIRED.includes(s.interview_type) && '다대다',
    s.panel_size === 1 && '면접관 1명',
    s.language === 'en' && '영어',
  ].filter(Boolean).join(' · ');
}

// 차례가 정해진 유형 (질문 수·자소서·꼬리질문 없음)
export const TURN_TYPES: readonly InterviewType[] = ['debate', 'discussion', 'pt'];

// PT면접 진행 시간과 꼬리질문 수
export const PT_PREP_SEC = 120;
export const PT_FOLLOW_UPS = 3;
// PT 주제 문항은 question_text 가 이 접두어로 시작한다
export const PT_TOPIC_PREFIX = '[PT 주제] ';
export const PT_INTRO_LINE = 'PT 면접을 시작하겠습니다. 화면의 주제를 확인하시고, 준비가 끝나면 발표를 시작해 주세요.';
export const PT_INTRO_LINE_EN = 'Let us begin the presentation interview. Please review the topic on the screen and start your presentation when you are ready.';

// 토론 편은 한국어로 저장하고, 영어로 진행할 때만 영어로 부른다
export const SIDE_EN: Record<string, string> = { 찬성: 'affirmative', 반대: 'negative' };
