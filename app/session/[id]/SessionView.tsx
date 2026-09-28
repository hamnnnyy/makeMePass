'use client';

import { useState, useEffect, useRef } from 'react';
import { InterviewerPanel } from '@/features/interviewer/components/InterviewerPanel';
import { moodOf } from '@/features/interviewer/components/Portrait';
import { INTERVIEWER_ROLES } from '@/lib/constants/roles';
import type { InterviewerRole } from '@/lib/constants/roles';
import {
  ANSWER_LIMIT_SEC, CLOSING_QUESTION, CLOSING_LINE, ELIMINATED_LINE, FOLLOW_UP_OFFSET, INTRO_QUESTION,
  greetingLine, type AnswerKind,
} from '@/lib/constants/interview';
import { useMediaStream } from '@/features/interview/hooks/useMediaStream';
import { useRecorder } from '@/features/interview/hooks/useRecorder';
import { useTTS } from '@/features/interviewer/tts/useTTS';
import { useFaceLandmarker } from '@/features/mediapipe/hooks/useFaceLandmarker';
import { useExpressionMetrics } from '@/features/mediapipe/hooks/useExpressionMetrics';
import { createTracker, addFrame, summarize } from '@/features/mediapipe/logic/nonVerbal';
import { analyzeSamples, decodeToMono16k, encodeWav } from '@/features/interview/logic/audio';
import { SelfCam } from '@/features/interview/components/SelfCam';
import { endSession } from '@/features/interview/server/endSession.server';
import { evaluateAnswer } from '@/features/interview/server/evaluateAnswer.server';
import type { FavorState } from '@/features/interview/server/evaluateAnswer.server';
import { PT_INTRO_LINE, PT_PREP_SEC, PT_TOPIC_PREFIX } from '@/lib/constants/interviewTypes';
import type { Database } from '@/types/supabase';

type Session = Database['public']['Tables']['interview_sessions']['Row'];
type SessionQuestion = Database['public']['Tables']['session_questions']['Row'];
type Phase = 'lobby' | 'speaking' | 'preparing' | 'answering' | 'evaluating' | 'error' | 'ending';

const PHASE_LABEL: Record<Phase, string> = {
  lobby: '입장 대기',
  speaking: '면접관 질문 중',
  preparing: 'PT 준비 중',
  answering: '답변 중',
  evaluating: '면접관이 메모하는 중...',
  error: '오류',
  ending: '면접 종료',
};

function answerKind(q: SessionQuestion): AnswerKind {
  if (q.question_text === CLOSING_QUESTION) return 'closing';
  if (q.question_text.startsWith(PT_TOPIC_PREFIX)) return 'pt';
  if (q.is_follow_up) return 'followUp';
  return q.question_text === INTRO_QUESTION ? 'intro' : 'main';
}

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function SessionView({
  session, orgName, passLine, names, questions: initialQuestions,
}: {
  session: Session; orgName: string; passLine: number;
  names: Record<InterviewerRole, string>; questions: SessionQuestion[];
}) {
  // 새로고침해도 답하지 않은 첫 질문부터 이어서 진행
  const answered = initialQuestions.filter((q) => q.answered_at)
    .sort((a, b) => a.answered_at!.localeCompare(b.answered_at!));
  const lastAnswered = answered.at(-1);
  const startIdx = Math.max(0, initialQuestions.findIndex((q) => !q.answered_at));

  const [questions, setQuestions] = useState(initialQuestions);
  const questionsRef = useRef(initialQuestions);
  const [idx, setIdx] = useState(startIdx);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [favor, setFavor] = useState<FavorState>({
    hr: lastAnswered?.hr_after ?? 50,
    tech: lastAnswered?.tech_after ?? 50,
    exec: lastAnswered?.exec_after ?? 50,
  });
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<{ values: FavorState; key: number } | null>(null);
  const [textMode, setTextMode] = useState(false);  // 말하기 어려울 때 텍스트로 답변
  const [answerText, setAnswerText] = useState('');
  const [ptMemo, setPtMemo] = useState('');  // PT 준비 메모 (평가에 쓰지 않음, 발표 중 참고용)
  const trackerRef = useRef(createTracker());
  const busyRef = useRef(false);
  const beginningRef = useRef(false);

  const timerFmt = useTimer(phase !== 'lobby' && phase !== 'ending');
  const { videoRef, error: camError } = useMediaStream();
  const recorder = useRecorder();
  const { speak, prefetch } = useTTS();
  const [speaker, setSpeaker] = useState<InterviewerRole | null>(null);
  const { ready: faceReady, resultRef } = useFaceLandmarker(videoRef);
  const metrics = useExpressionMetrics(resultRef, phase !== 'lobby');

  const currentQuestion = questions[idx] ?? null;

  // 말하는 면접관 카드에 테두리를 켠다
  async function say(text: string, role: InterviewerRole) {
    setSpeaker(role);
    await speak(text, role);
    setSpeaker(null);
  }

  async function finishInterview(line: string, role: InterviewerRole = 'exec') {
    setPhase('ending');
    await say(line, role);
    await endSession(session.id);
  }

  async function ask(i: number) {
    const q = questionsRef.current[i];
    if (!q) return finishInterview(CLOSING_LINE);
    setIdx(i);
    setTextMode(false);
    setAnswerText('');
    setPhase('speaking');
    // PT 주제는 길어서 읽지 않고 화면에 띄운 뒤 준비 시간을 준다
    if (answerKind(q) === 'pt') {
      await say(PT_INTRO_LINE, q.asked_by_role as InterviewerRole);
      setRemaining(PT_PREP_SEC);
      setPhase('preparing');
      return;
    }
    await say(q.question_text, q.asked_by_role as InterviewerRole);
    await beginAnswer(i);
  }

  async function beginAnswer(i: number) {
    // PT: '발표 시작' 버튼과 준비 시간 종료가 겹쳐도 한 번만 시작
    if (beginningRef.current) return;
    beginningRef.current = true;
    const q = questionsRef.current[i];
    try {
      await recorder.start();
    } catch {
      setError('마이크 권한이 필요합니다.');
      setPhase('error');
      beginningRef.current = false;
      return;
    }
    // 질문이 끝나자마자 녹음 시작. 말을 시작하기까지 걸린 시간도 평가에 들어간다.
    trackerRef.current = createTracker();
    setRemaining(ANSWER_LIMIT_SEC[answerKind(q)]);
    setPhase('answering');
    beginningRef.current = false;
    const next = questionsRef.current[i + 1];
    if (next) prefetch(next.question_text, next.asked_by_role as InterviewerRole);
  }

  async function start() {
    if (startIdx === 0) {
      setPhase('speaking');
      await say(greetingLine(orgName), 'exec');
    }
    await ask(startIdx);
  }

  async function finishAnswer() {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase('evaluating');
    const q = questionsRef.current[idx];

    try {
      const blob = await recorder.stop();
      const fd = new FormData();
      const text = answerText.trim();
      if (textMode && text) {
        fd.append('answerText', text);  // 녹음은 버리고 표정·자세만 보낸다
        fd.append('meta', JSON.stringify({ nonVerbal: summarize(trackerRef.current) }));
      } else {
        const samples = await decodeToMono16k(blob);
        fd.append('audio', encodeWav(samples, 16000), 'answer.wav');
        fd.append('meta', JSON.stringify({
          nonVerbal: summarize(trackerRef.current),
          audio: analyzeSamples(samples, 16000),
        }));
      }

      const r = await evaluateAnswer(q.id, fd);
      setDeltas({
        values: { hr: r.favor.hr - favor.hr, tech: r.favor.tech - favor.tech, exec: r.favor.exec - favor.exec },
        key: Date.now(),
      });
      setFavor(r.favor);

      if (r.eliminatedBy) return finishInterview(ELIMINATED_LINE, r.eliminatedBy);

      if (r.followUp) {
        const fu: SessionQuestion = {
          ...q,
          id: r.followUp.id,
          question_id: null,
          question_text: r.followUp.text,
          asked_by_role: r.followUp.role,
          sequence: q.sequence + FOLLOW_UP_OFFSET,
          is_follow_up: true,
          parent_session_question_id: q.id,
          answered_at: null,
          asked_at: new Date().toISOString(),
        };
        questionsRef.current = questionsRef.current.toSpliced(idx + 1, 0, fu);
        setQuestions(questionsRef.current);
      }

      if (r.reaction) await say(r.reaction, r.reactionRole);
      await ask(idx + 1);
    } catch (e) {
      console.error(e);
      setError('답변 평가에 실패했습니다. 같은 질문에 다시 답변해 주세요.');
      setPhase('error');
    } finally {
      busyRef.current = false;
    }
  }

  // 답변 중: 비언어 지표를 10fps로 누적하고 제한 시간을 센다. PT 준비 중에는 시간만 센다.
  useEffect(() => {
    if (phase !== 'answering' && phase !== 'preparing') return;
    const sample = phase === 'answering'
      ? setInterval(() => addFrame(trackerRef.current, resultRef.current, performance.now()), 100)
      : undefined;
    const tick = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => { clearInterval(sample); clearInterval(tick); };
  }, [phase, resultRef]);

  useEffect(() => {
    if (remaining > 0) return;
    if (phase === 'answering') finishAnswer();
    if (phase === 'preparing') beginAnswer(idx);
  }, [phase, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEnd() {
    if (!confirm('면접을 중단할까요? 지금까지 답변한 내용으로 결과가 나옵니다.')) return;
    await recorder.stop();
    setPhase('ending');
    await endSession(session.id);
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col px-6 py-4 gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-lg">◆</span>
          <span className="text-sm font-medium">{Math.min(idx + 1, questions.length)}/{questions.length}</span>
        </div>
        <span className="text-sm font-medium text-neutral-300">
          {PHASE_LABEL[phase]}
          {(phase === 'answering' || phase === 'preparing') && (
            <span className={`ml-2 font-mono ${remaining <= 10 ? 'text-red-400' : 'text-neutral-500'}`}>
              {remaining}s
            </span>
          )}
        </span>
        <span className="text-sm font-mono">{timerFmt}</span>
      </div>

      {/* Interviewer panels */}
      <div className="grid grid-cols-3 gap-4">
        {INTERVIEWER_ROLES.map((role) => (
          <InterviewerPanel key={role} mode={session.mode} role={role} mood={moodOf(deltas?.values[role])}
            name={names[role]} favor={favor[role]} passLine={passLine}
            delta={deltas ? { value: deltas.values[role], key: deltas.key } : undefined} speaking={speaker === role} />
        ))}
      </div>

      {/* Question display */}
      <div className="bg-neutral-800/60 rounded-xl px-5 py-3 text-sm text-neutral-200 text-center leading-relaxed min-h-[56px] flex items-center justify-center">
        {phase === 'error' ? (
          <span className="text-red-400">{error}</span>
        ) : phase === 'lobby' ? (
          <span className="text-neutral-400">
            카메라를 정면에 두고, 면접관(화면)을 바라보며 답변하세요. 질문이 끝나면 바로 녹음이 시작됩니다.
          </span>
        ) : currentQuestion && answerKind(currentQuestion) === 'pt' ? (
          <div className="text-left w-full whitespace-pre-line">
            <p className="text-xs text-orange-400 mb-1">PT 주제 · 준비 {PT_PREP_SEC / 60}분 · 발표 최대 3분</p>
            {currentQuestion.question_text.slice(PT_TOPIC_PREFIX.length)}
          </div>
        ) : currentQuestion ? (
          <span>
            <span className="text-neutral-500 mr-2">
              [{currentQuestion.asked_by_role.toUpperCase()}{currentQuestion.is_follow_up ? ' · 꼬리질문' : ''}]
            </span>
            {currentQuestion.question_text}
          </span>
        ) : null}
      </div>

      {/* Self-cam */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="rounded-2xl overflow-hidden bg-neutral-900 w-full max-w-xl aspect-video relative">
          <SelfCam videoRef={videoRef} resultRef={resultRef} metrics={metrics} />
          {phase === 'answering' && !metrics.detected && (
            <div className="absolute inset-x-0 top-0 bg-red-600/80 text-xs text-center py-1.5">
              얼굴이 화면에 보이지 않습니다. 시선·표정 점수가 0점 처리됩니다.
            </div>
          )}
          {phase === 'answering' && (
            <span className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-black/60 rounded-full px-2 py-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC
            </span>
          )}
        </div>
        {camError && <p className="text-xs text-red-400">{camError}</p>}

        {currentQuestion && answerKind(currentQuestion) === 'pt' && (phase === 'preparing' || phase === 'answering') && (
          <textarea
            value={ptMemo}
            onChange={(e) => setPtMemo(e.target.value)}
            readOnly={phase === 'answering'}
            rows={4}
            placeholder="발표 메모 (평가에 쓰이지 않습니다)"
            className="w-full max-w-xl rounded-xl bg-neutral-900 border border-neutral-700 focus:border-orange-500 outline-none px-4 py-3 text-sm leading-relaxed resize-none"
          />
        )}

        {phase === 'answering' && textMode && (
          <div className="w-full max-w-xl flex flex-col gap-1">
            <textarea
              autoFocus
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="답변을 입력하세요. 텍스트 답변은 내용과 표정·자세를 평가합니다 (시선·말하기·시간 제외)."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 focus:border-orange-500 outline-none px-4 py-3 text-sm leading-relaxed resize-none"
            />
            <span className="text-[11px] text-neutral-500 text-right">{answerText.length} / 2000</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {phase === 'lobby' ? (
            <button
              onClick={start}
              disabled={!faceReady}
              className="px-6 h-12 rounded-full bg-orange-500 hover:bg-orange-400 text-sm font-medium disabled:opacity-40"
            >
              {!faceReady ? '카메라 준비 중...' : startIdx === 0 ? '면접 입장' : '이어서 진행'}
            </button>
          ) : phase === 'preparing' ? (
            <button
              onClick={() => beginAnswer(idx)}
              className="px-6 h-12 rounded-full bg-orange-500 hover:bg-orange-400 text-sm font-medium"
            >
              발표 시작
            </button>
          ) : phase === 'error' ? (
            <button
              onClick={() => { setError(null); ask(idx); }}
              className="px-6 h-12 rounded-full bg-white text-neutral-900 text-sm font-medium"
            >
              다시 답변
            </button>
          ) : (
            <>
              <button
                onClick={() => setTextMode((v) => !v)}
                disabled={phase !== 'answering'}
                className="px-4 h-12 rounded-full border border-neutral-600 hover:border-neutral-400 text-sm disabled:opacity-40"
              >
                {textMode ? '음성으로 답변' : '텍스트로 답변'}
              </button>
              <button
                onClick={finishAnswer}
                disabled={phase !== 'answering' || (textMode && !answerText.trim())}
                className="px-6 h-12 rounded-full flex items-center gap-2 bg-orange-500 text-sm font-medium transition-colors disabled:bg-neutral-700 disabled:text-neutral-400"
              >
                {!textMode && <MicIcon className="text-white" />} 답변 완료
              </button>
            </>
          )}
          <button
            onClick={handleEnd}
            disabled={phase === 'ending' || phase === 'evaluating'}
            aria-label="면접 중단"
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

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}
