'use server';

import { getGeminiClient } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import { createClient } from '@/lib/supabase/server';
import type { InterviewerRole } from '@/lib/constants/roles';

export type FavorState = Record<InterviewerRole, number>;

export interface EvaluateResult {
  favor: FavorState;
  feedback: string;
  followUpQuestion: string | null;  // null이면 꼬리질문 없음
  followUpRole: InterviewerRole | null;
  followUpId: string | null;        // 삽입된 session_questions.id
}

export async function evaluateAnswer(
  sessionQuestionId: string,
  currentFavor: FavorState,
  formData: FormData,
): Promise<EvaluateResult> {
  const supabase = await createClient();

  const { data: sq } = await supabase
    .from('session_questions')
    .select('question_text, asked_by_role, session_id, sequence')
    .eq('id', sessionQuestionId)
    .single();

  if (!sq) throw new Error('질문을 찾을 수 없습니다.');

  // Upload audio (skip if storage not configured)
  let audioUrl: string | null = null;
  const audioFile = formData.get('audio') as File | null;
  if (audioFile && audioFile.size > 0) {
    try {
      const { uploadSessionAudio } = await import('@/lib/storage/uploadBlob');
      audioUrl = await uploadSessionAudio(audioFile, sq.session_id, sessionQuestionId);
    } catch {
      // Storage bucket not configured — skip
    }
  }

  const gemini = getGeminiClient();
  const response = await gemini.models.generateContent({
    model: MODELS.evaluation,
    contents: `당신은 한국 공기업 면접 평가위원입니다. JSON만 반환하세요.

질문 (${sq.asked_by_role} 담당): ${sq.question_text}

지원자의 구술 답변을 평가해주세요. 다음 JSON 형식으로만 응답하세요:
{
  "score_content": 0~100,
  "score_fluency": 0~100,
  "hr_delta": -10~10,
  "tech_delta": -10~10,
  "exec_delta": -10~10,
  "feedback": "한 줄 피드백 (30자 이내)"
}`,
  });

  const raw = response.text ?? '{}';
  const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');

  const favor: FavorState = {
    hr:   Math.max(0, Math.min(100, currentFavor.hr   + (result.hr_delta   ?? 0))),
    tech: Math.max(0, Math.min(100, currentFavor.tech + (result.tech_delta ?? 0))),
    exec: Math.max(0, Math.min(100, currentFavor.exec + (result.exec_delta ?? 0))),
  };

  await supabase.from('session_questions').update({
    audio_url: audioUrl,
    score_content: result.score_content ?? null,
    score_fluency: result.score_fluency ?? null,
    hr_delta: result.hr_delta ?? 0,
    tech_delta: result.tech_delta ?? 0,
    exec_delta: result.exec_delta ?? 0,
    hr_after: favor.hr,
    tech_after: favor.tech,
    exec_after: favor.exec,
    claude_feedback: { feedback: result.feedback ?? '' },
    answered_at: new Date().toISOString(),
  }).eq('id', sessionQuestionId);

  // 꼬리질문 생성 (내용 점수 낮을 때)
  let followUpQuestion: string | null = null;
  let followUpRole: InterviewerRole | null = null;
  let followUpId: string | null = null;

  const scoreContent = result.score_content ?? 100;
  if (scoreContent < 60) {
    try {
      const { generateFollowUp } = await import('../logic/followUpGenerator');
      const fu = await generateFollowUp(
        sq.question_text,
        null, // transcript 미지원
        sq.asked_by_role as InterviewerRole,
        scoreContent,
      );

      if (fu.shouldAsk) {
        const { data: inserted } = await supabase
          .from('session_questions')
          .insert({
            session_id: sq.session_id,
            question_id: null,
            question_text: fu.question,
            asked_by_role: fu.role,
            sequence: sq.sequence + 0.5, // 원 질문 바로 뒤에 삽입
            is_follow_up: true,
            parent_session_question_id: sessionQuestionId,
            audio_url: null, transcript: null, duration_seconds: null,
            filler_count: null, score_content: null, score_fluency: null,
            score_eye_contact: null, score_timing: null, score_expression: null,
            hr_delta: 0, tech_delta: 0, exec_delta: 0,
            hr_after: null, tech_after: null, exec_after: null,
            claude_feedback: null, answered_at: null,
          })
          .select('id')
          .single();

        if (inserted) {
          followUpQuestion = fu.question;
          followUpRole = fu.role;
          followUpId = inserted.id;
        }
      }
    } catch {
      // 꼬리질문 실패해도 면접 계속
    }
  }

  return { favor, feedback: result.feedback ?? '', followUpQuestion, followUpRole, followUpId };
}
