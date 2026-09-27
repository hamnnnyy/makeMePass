'use client';

import { useState, useEffect, useCallback } from 'react';
import { InterviewerScene } from '@/features/visualizer/scenes/InterviewerScene';
import { INTERVIEWER_ROLES, ROLE_LABELS, ROLE_COLORS, ROLE_ACCENT_HEX } from '@/lib/constants/roles';
import type { InterviewerRole } from '@/lib/constants/roles';
import { useMediaStream } from '@/features/interview/hooks/useMediaStream';
import { useRecorder } from '@/features/interview/hooks/useRecorder';
import { useTTS } from '@/features/interviewer/tts/useTTS';
import { useFaceLandmarker } from '@/features/mediapipe/hooks/useFaceLandmarker';
import { useExpressionMetrics } from '@/features/mediapipe/hooks/useExpressionMetrics';
import { SelfCam } from '@/features/interview/components/SelfCam';
import { endSession } from '@/features/interview/server/endSession.server';
import { evaluateAnswer } from '@/features/interview/server/evaluateAnswer.server';
import type { FavorState } from '@/features/interview/server/evaluateAnswer.server';
import type { Database } from '@/types/supabase';

type Session = Database['public']['Tables']['interview_sessions']['Row'];
type SessionQuestion = Database['public']['Tables']['session_questions']['Row'];

const MOCK_PERSONAS: Record<InterviewerRole, string> = {
  hr:   '최원희',
  tech: '강희원',
  exec: '하 연',
};

const INITIAL_FAVOR: FavorState = { hr: 50, tech: 50, exec: 50 };

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function FavorBar({ role, value }: { role: InterviewerRole; value: number }) {
  return (
    <div className="h-[3px] w-full bg-neutral-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: ROLE_COLORS[role] }}
      />
    </div>
  );
}

export function SessionView({ session, questions: initialQuestions }: { session: Session; questions: SessionQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [favor, setFavor] = useState<FavorState>(INITIAL_FAVOR);
  const [paused, setPaused] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const timerFmt = useTimer(!paused && !evaluating);
  const { videoRef } = useMediaStream();
  const { state: recState, audioBlob, start: startRec, stop: stopRec, reset: resetRec } = useRecorder();
  const { speak, speaking: ttsSpeaking } = useTTS();
  const { resultRef } = useFaceLandmarker(videoRef);
  const metrics = useExpressionMetrics(resultRef, !evaluating && !ttsSpeaking);

  const micActive = recState === 'recording';
  const currentQuestion = questions[currentIdx] ?? null;

  const handleEvaluate = useCallback(async (blob: Blob) => {
    if (!currentQuestion) return;
    setEvaluating(true);

    try {
      const fd = new FormData();
      fd.append('audio', blob, 'answer.webm');
      const result = await evaluateAnswer(currentQuestion.id, favor, fd);

      setFavor(result.favor);
      setFeedback(result.feedback);

      // 꼬리질문이 있으면 목록에 삽입
      if (result.followUpQuestion && result.followUpId && result.followUpRole) {
        setQuestions((prev) => {
          const next = [...prev];
          next.splice(currentIdx + 1, 0, {
            id: result.followUpId!,
            session_id: session.id,
            question_id: null,
            question_text: result.followUpQuestion!,
            asked_by_role: result.followUpRole!,
            sequence: prev[currentIdx]?.sequence + 0.5,
            is_follow_up: true,
            parent_session_question_id: currentQuestion?.id ?? null,
            audio_url: null, transcript: null, duration_seconds: null,
            filler_count: null, score_content: null, score_fluency: null,
            score_eye_contact: null, score_timing: null, score_expression: null,
            hr_delta: 0, tech_delta: 0, exec_delta: 0,
            hr_after: null, tech_after: null, exec_after: null,
            claude_feedback: null, answered_at: null,
            asked_at: new Date().toISOString(),
          });
          return next;
        });
      }

      setTimeout(async () => {
        setFeedback(null);
        resetRec();

        if (currentIdx + 1 >= questions.length) {
          await endSession(session.id);
        } else {
          setCurrentIdx((i) => i + 1);
        }
        setEvaluating(false);
      }, 2000);
    } catch {
      resetRec();
      setEvaluating(false);
    }
  }, [currentQuestion, currentIdx, favor, questions.length, session.id, resetRec]);

  useEffect(() => {
    if (audioBlob && recState === 'stopped') {
      handleEvaluate(audioBlob);
    }
  }, [audioBlob, recState, handleEvaluate]);

  // 질문이 바뀌면 TTS로 읽어줌
  useEffect(() => {
    if (currentQuestion) {
      speak(currentQuestion.question_text, currentQuestion.asked_by_role as InterviewerRole);
    }
  }, [currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMic() {
    if (micActive) stopRec();
    else startRec();
  }

  async function handleEnd() {
    await endSession(session.id);
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col px-6 py-4 gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-lg">◆</span>
          <span className="text-sm font-medium">{currentIdx + 1}/{session.total_questions}</span>
        </div>
        <span className="text-sm font-medium text-neutral-300">
          {evaluating ? '평가 중...' : ttsSpeaking ? '질문 읽는 중...' : '답변 대기'}
        </span>
        <span className="text-sm font-mono">{timerFmt}</span>
      </div>

      {/* Interviewer panels */}
      <div className="grid grid-cols-3 gap-4">
        {INTERVIEWER_ROLES.map((role) => (
          <div key={role} className="rounded-2xl overflow-hidden bg-neutral-900">
            <div className="h-[220px]">
              <InterviewerScene color={ROLE_ACCENT_HEX[role]} />
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">
                  <span style={{ color: ROLE_COLORS[role] }}>{ROLE_LABELS[role]}</span>
                  <span className="text-neutral-300"> | {MOCK_PERSONAS[role]}</span>
                </span>
                <span className="text-xs text-neutral-400">{Math.round(favor[role])}%</span>
              </div>
              <FavorBar role={role} value={favor[role]} />
            </div>
          </div>
        ))}
      </div>

      {/* Question / Feedback display */}
      <div className="bg-neutral-800/60 rounded-xl px-5 py-3 text-sm text-neutral-200 text-center leading-relaxed min-h-[56px] flex items-center justify-center">
        {feedback ? (
          <span className="text-orange-400">{feedback}</span>
        ) : currentQuestion ? (
          <span>
            <span className="text-neutral-500 mr-2">
              [{currentQuestion.asked_by_role.toUpperCase()}]
            </span>
            {currentQuestion.question_text}
          </span>
        ) : (
          <span className="text-neutral-500">질문을 불러오는 중...</span>
        )}
      </div>

      {/* Self-cam */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="rounded-2xl overflow-hidden bg-neutral-900 w-full max-w-xl aspect-video">
          <SelfCam videoRef={videoRef} resultRef={resultRef} metrics={metrics} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleMic}
            disabled={evaluating || ttsSpeaking}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
              micActive ? 'bg-orange-500' : 'bg-white'
            }`}
          >
            <MicIcon className={micActive ? 'text-white' : 'text-neutral-900'} />
          </button>
          <button
            onClick={() => setPaused((v) => !v)}
            disabled={evaluating}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center disabled:opacity-40"
          >
            {paused
              ? <PlayIcon className="text-neutral-900" />
              : <PauseIcon className="text-neutral-900" />
            }
          </button>
          <button
            onClick={handleEnd}
            disabled={evaluating}
            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center disabled:opacity-40"
          >
            <PhoneIcon className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 15.93A7.001 7.001 0 0 1 5 11H3a9 9 0 0 0 8 8.94V22h2v-2.06A9 9 0 0 0 21 11h-2a7 7 0 0 1-5.5 6.93V17h-3v-.07z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}
