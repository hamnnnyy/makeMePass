import type { QuestionCategory } from '@/types/supabase';

export const INTERVIEW_TYPES = ['general', 'personality', 'job', 'executive', 'pt'] as const;
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
};

// PT면접 진행 시간과 꼬리질문 수
export const PT_PREP_SEC = 120;
export const PT_FOLLOW_UPS = 3;
// PT 주제 문항은 question_text 가 이 접두어로 시작한다
export const PT_TOPIC_PREFIX = '[PT 주제] ';
export const PT_INTRO_LINE = 'PT 면접을 시작하겠습니다. 화면의 주제를 확인하시고, 준비가 끝나면 발표를 시작해 주세요.';
