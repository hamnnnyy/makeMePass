'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateWithFallback } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import { sampleN } from '@/lib/utils/sample';
import { CLOSING_QUESTION, INTRO_QUESTION, SEQUENCE_STEP } from '@/lib/constants/interview';
import { INTERVIEWER_ROLES, type InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';
import { INTERVIEW_TYPES, INTERVIEW_TYPE_INFO, PT_TOPIC_PREFIX, type InterviewType } from '@/lib/constants/interviewTypes';

type Planned = { text: string; role: InterviewerRole; questionId: string | null };

const MAX_PDF_BYTES = 5 * 1024 * 1024;

// 자소서 PDF를 요약하고, 자소서 기반 질문을 만든다
async function readCoverLetter(file: File, orgName: string, count: number) {
  const res = await generateWithFallback(MODELS.evaluation, {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'application/pdf', data: Buffer.from(await file.arrayBuffer()).toString('base64') } },
        { text: `${orgName} 신입 공채 지원자의 자기소개서입니다. 문항별 핵심 내용을 요약하고, 실제 면접관이 이 자소서를 보고 물어볼 질문 ${count}개를 만드세요. 질문은 자소서의 구체적 경험·수치·주장을 검증하는 구어체 한 문장(50자 이내).` },
      ],
    }],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          summary: { type: 'object', additionalProperties: { type: 'string' }, description: '문항 제목 → 요약' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: { role: { type: 'string', enum: [...INTERVIEWER_ROLES] }, text: { type: 'string' } },
              required: ['role', 'text'],
            },
          },
        },
        required: ['summary', 'questions'],
      },
    },
  });
  const out = JSON.parse(res.text ?? '{}') as { summary?: Record<string, string>; questions?: { role: InterviewerRole; text: string }[] };
  return {
    summary: out.summary ?? {},
    questions: (out.questions ?? [])
      .filter((q) => q.text && INTERVIEWER_ROLES.includes(q.role))
      .slice(0, count),
  };
}

// PT면접 주제: 기관 업무와 연결된 실제형 과제
async function makePtTopic(orgName: string, orgDesc: string | null): Promise<string> {
  const res = await generateWithFallback(MODELS.evaluation, {
    contents: `${orgName}${orgDesc ? `(${orgDesc})` : ''} 신입 공채 PT면접 주제를 하나 만드세요. 기관의 실제 사업·공공 이슈와 연결되고, 3분 발표로 해결 방안을 제시할 수 있는 과제여야 합니다.`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '주제 한 줄 (40자 이내)' },
          background: { type: 'string', description: '배경 상황 1~2문장' },
          task: { type: 'string', description: '지원자가 발표할 과제 1문장' },
        },
        required: ['title', 'background', 'task'],
      },
    },
  });
  const t = JSON.parse(res.text ?? '{}') as { title?: string; background?: string; task?: string };
  if (!t.title) throw new Error('PT 주제를 만들지 못했습니다.');
  return `${PT_TOPIC_PREFIX}${t.title}\n배경: ${t.background ?? ''}\n과제: ${t.task ?? ''}`;
}

export default async function createSession(
  orgCode: string,
  mode: InterviewMode,
  interviewType: InterviewType,
  questionCount: number,
  coverLetterFile: File | null,
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name_ko, description')
    .eq('code', orgCode)
    .single();
  if (orgError || !org) throw new Error(`기관을 찾을 수 없습니다: ${orgCode}`);

  const count = Math.max(3, Math.min(10, Math.floor(questionCount)));
  const type: InterviewType = INTERVIEW_TYPES.includes(interviewType) ? interviewType : 'general';
  const categories = INTERVIEW_TYPE_INFO[type].categories;

  // 공통 질문 + question_organizations 로 이 기관에 연결된 질문
  const [{ data: general }, { data: linked }] = await Promise.all([
    supabase.from('questions').select('id, text, target_role, category').eq('is_general', true),
    supabase.from('question_organizations').select('questions(id, text, target_role, category)').eq('organization_id', org.id),
  ]);
  const byId = new Map((general ?? []).map((q) => [q.id, q]));
  for (const row of linked ?? []) if (row.questions) byId.set(row.questions.id, row.questions);
  // 면접 유형에 맞는 카테고리만 (인성/직무/임원)
  const others = [...byId.values()].filter((q) => !categories || categories.includes(q.category));

  // 실제 면접 순서: 1분 자기소개 → (자소서 질문) → 본 질문 → 마지막 한마디
  let coverLetterId: string | null = null;
  let clQuestions: Planned[] = [];
  if (type !== 'pt' && coverLetterFile && coverLetterFile.size > 0) {
    if (coverLetterFile.type !== 'application/pdf') throw new Error('자기소개서는 PDF만 지원합니다.');
    if (coverLetterFile.size > MAX_PDF_BYTES) throw new Error('자기소개서는 5MB 이하만 가능합니다.');
    const cl = await readCoverLetter(coverLetterFile, org.name_ko, Math.min(3, Math.floor((count - 1) / 2)));
    const { data: saved } = await supabase
      .from('cover_letters')
      .insert({ user_id: user.id, organization_id: org.id, position_code: null, items: cl.summary, is_active: true })
      .select('id')
      .single();
    coverLetterId = saved?.id ?? null;
    clQuestions = cl.questions.map((q) => ({ text: q.text, role: q.role, questionId: null }));
  }

  const mainCount = count - 1 - clQuestions.length;
  // PT: 주제 발표 1개 + (발표에 대한 꼬리질문은 답변 평가 때 생성) + 마지막 한마디
  const planned: Planned[] = type === 'pt' ? [
    { text: await makePtTopic(org.name_ko, org.description), role: 'exec', questionId: null },
    { text: CLOSING_QUESTION, role: 'exec', questionId: null },
  ] : [
    { text: INTRO_QUESTION, role: 'hr', questionId: null },
    ...clQuestions,
    ...sampleN(others, mainCount).map((q) => ({ text: q.text, role: q.target_role, questionId: q.id })),
    { text: CLOSING_QUESTION, role: 'exec', questionId: null },
  ];

  const { data: session, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      mode,
      // 종합은 컬럼 기본값 사용 (interview_type 마이그레이션 전에도 동작)
      ...(type !== 'general' ? { interview_type: type } : {}),
      status: 'in_progress' as const,
      result: 'pending' as const,
      total_questions: planned.length,
      cover_letter_id: coverLetterId,
      hr_final_score: null,
      tech_final_score: null,
      exec_final_score: null,
      veto_role: null,
      elimination_question_id: null,
      duration_seconds: null,
      video_url: null,
      ended_at: null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: qError } = await supabase.from('session_questions').insert(
    planned.map((q, i) => ({
      session_id: session.id,
      question_id: q.questionId,
      question_text: q.text,
      asked_by_role: q.role,
      sequence: (i + 1) * SEQUENCE_STEP,
      is_follow_up: false,
      parent_session_question_id: null,
      audio_url: null,
      transcript: null,
      duration_seconds: null,
      filler_count: null,
      score_content: null,
      score_fluency: null,
      score_eye_contact: null,
      score_timing: null,
      score_expression: null,
      hr_delta: 0,
      tech_delta: 0,
      exec_delta: 0,
      hr_after: null,
      tech_after: null,
      exec_after: null,
      claude_feedback: null,
      answered_at: null,
    }))
  );
  if (qError) throw qError;

  redirect(`/session/${session.id}`);
}
