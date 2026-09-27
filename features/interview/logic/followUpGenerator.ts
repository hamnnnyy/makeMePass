'use server';

import { getGeminiClient } from '@/lib/gemini/client';
import { MODELS } from '@/lib/gemini/models';
import type { InterviewerRole } from '@/lib/constants/roles';

export interface FollowUpResult {
  shouldAsk: boolean;
  question: string;
  role: InterviewerRole;
}

export async function generateFollowUp(
  originalQuestion: string,
  transcript: string | null,
  askedByRole: InterviewerRole,
  scoreContent: number | null,
): Promise<FollowUpResult> {
  // 내용 점수가 낮거나 답변이 짧으면 꼬리질문 생성
  const needsFollowUp = !scoreContent || scoreContent < 60;
  if (!needsFollowUp || !transcript) {
    return { shouldAsk: false, question: '', role: askedByRole };
  }

  const gemini = getGeminiClient();
  const response = await gemini.models.generateContent({
    model: MODELS.evaluation,
    contents: `당신은 공기업 면접관입니다. 지원자의 답변이 불충분합니다. 꼬리질문을 하나 생성하세요.

원래 질문: ${originalQuestion}
지원자 답변: ${transcript}

규칙:
- 답변의 구체적 내용을 파고드는 질문
- 30자 이내
- 질문만 출력 (다른 설명 없이)`,
  });

  const question = response.text?.trim() ?? '';
  if (!question) return { shouldAsk: false, question: '', role: askedByRole };

  return { shouldAsk: true, question, role: askedByRole };
}
