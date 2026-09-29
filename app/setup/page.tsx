'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Paperclip } from 'lucide-react';
import type { InterviewMode } from '@/lib/constants/modes';
import { MODE_LABELS } from '@/lib/constants/modes';
import { PageHeader } from '@/components/layout/PageHeader';
import { BLIND_NOTICE } from '@/lib/constants/disqualify';
import { OrgPicker } from '@/features/interview/components/OrgPicker';
import createSession from '@/features/interview/server/createSession.server';
import { INTERVIEW_TYPES, INTERVIEW_TYPE_INFO, PEER_OPTIONAL, PEER_REQUIRED, SOLO_ROLE, TURN_TYPES, formatLabel, type InterviewType } from '@/lib/constants/interviewTypes';
import { ROLE_LABELS } from '@/lib/constants/roles';

const MODES: InterviewMode[] = ['realistic', 'casual', 'boss', 'cute'];

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;

// 면접 형식 한 줄: 제목 + 두 가지 중 하나 고르기. 유형에 따라 한쪽으로 고정되면 이유를 보여준다.
function Choice<T extends string | number | boolean>({ title, value, options, onChange, locked }: {
  title: string; value: T; options: [T, string][]; onChange: (v: T) => void; locked?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-sm text-neutral-300">{title}</span>
        {locked && <span className="text-[11px] text-neutral-500">{locked}</span>}
      </div>
      <div role="radiogroup" aria-label={title} className="grid grid-cols-2 gap-2">
        {options.map(([v, label]) => (
          <button
            key={String(v)}
            role="radio"
            aria-checked={value === v}
            disabled={!!locked}
            onClick={() => onChange(v)}
            className={`rounded-xl px-3 py-2.5 text-sm transition-all disabled:cursor-not-allowed ${
              value === v ? 'ring-2 ring-pink-500 bg-pink-500/10 text-white' : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700/80 disabled:opacity-40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 justify-center mb-10">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              n <= current ? 'bg-pink-500 text-white' : 'bg-neutral-700 text-neutral-400'
            }`}
          >
            {n}
          </div>
          {i < 2 && (
            <div className={`w-12 h-px ${n < current ? 'bg-pink-500' : 'bg-neutral-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [mode, setMode] = useState<InterviewMode | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>('general');
  const [questionCount, setQuestionCount] = useState(5);
  // 면접 형식 (유형과 따로 고른다)
  const [peerChoice, setPeerChoice] = useState(false);
  const [panelSize, setPanelSize] = useState<1 | 3>(3);
  const [inEnglish, setInEnglish] = useState(false);
  const [track, setTrack] = useState<'general' | 'it'>('general');
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [starting, setStarting] = useState(false);

  // 꾸미기에서 정한 기본 모드를 미리 선택
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('preferred_mode').eq('id', user.id).maybeSingle();
      if (data?.preferred_mode) setMode((m) => m ?? data.preferred_mode);
    });
  }, []);
  const [error, setError] = useState<string | null>(null);

  // 토론·토의는 늘 AI 지원자와 함께, PT 는 혼자 발표
  const withPeers = PEER_REQUIRED.includes(interviewType) || (peerChoice && PEER_OPTIONAL.includes(interviewType));
  const format = { withPeers, panelSize, english: inEnglish, track };

  const canNext =
    (step === 1 && orgId !== null) ||
    (step === 2 && mode !== null) ||
    step === 3;

  async function handleNext() {
    if (step < 3) { setStep(s => s + 1); return; }
    // createSession이 서버에서 redirect()를 호출하므로 성공하면 여기로 돌아오지 않는다
    setStarting(true);
    setError(null);
    try {
      const res = await createSession(orgId!, mode!, interviewType, questionCount, coverLetterFile, format);
      if (res?.error) { setError(res.error); setStarting(false); }
    } catch {
      setError('면접을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setStarting(false);
    }
  }

  function handleBack() {
    if (step === 1) { router.back(); return; }
    setStep(s => s - 1);
  }

  return (
    <div className="min-h-screen bg-night text-white flex flex-col">
      <PageHeader title="면접 준비" back={{ onClick: handleBack, label: step === 1 ? '나가기' : '이전' }} />

      {/* Content */}
      <div className="flex-1 px-6 md:px-8 pt-8 pb-32 max-w-4xl mx-auto w-full">
        <StepIndicator current={step} />

        {step === 1 && (
          <div>
            <h2 className="text-3xl mb-8">어느 기관에 지원하나요?</h2>
            <OrgPicker value={orgId} onChange={(o) => { setOrgId(o.code); setOrgName(o.name_ko); }} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-3xl mb-8">어떤 면접관을 만날까요?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MODES.map((id) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  aria-pressed={mode === id}
                  className={`aspect-square flex flex-col items-center justify-center gap-4 rounded-2xl bg-neutral-800/80 transition-all ${
                    mode === id ? 'ring-2 ring-pink-500 bg-pink-500/10' : 'hover:bg-neutral-700/80'
                  }`}
                >
                  <Image src={`/modes/${id}.png`} alt="" width={56} height={56} />
                  <span className="font-display text-lg">{MODE_LABELS[id]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-3xl mb-3">면접 방식을 정해 주세요</h2>
            <p className="text-sm text-red-300 mb-8">{BLIND_NOTICE}</p>
            <div className="space-y-8">
              {/* 면접 유형 */}
              <div>
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-6">
                  <span className="text-sm text-neutral-300">면접 유형</span>
                  <span className="text-xs text-neutral-500">{INTERVIEW_TYPE_INFO[interviewType].label}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {INTERVIEW_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setInterviewType(t)}
                      aria-pressed={interviewType === t}
                      className={`rounded-2xl bg-neutral-800/80 px-4 py-3 text-left transition-all ${
                        interviewType === t ? 'ring-2 ring-pink-500 bg-pink-500/10' : 'hover:bg-neutral-700/80'
                      }`}
                    >
                      <p className="text-sm font-semibold">{INTERVIEW_TYPE_INFO[t].label}</p>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{INTERVIEW_TYPE_INFO[t].desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 면접 형식 */}
              <div className="grid md:grid-cols-2 gap-5">
                <Choice
                  title="지원 직무"
                  value={track}
                  options={[['general', '사무·일반'], ['it', '전산(IT)']]}
                  onChange={setTrack}
                />
                <Choice
                  title="지원자"
                  value={withPeers}
                  options={[[false, '나 혼자'], [true, 'AI 지원자 2명과']]}
                  onChange={setPeerChoice}
                  locked={PEER_REQUIRED.includes(interviewType) ? '토론·토의는 함께 진행' : !PEER_OPTIONAL.includes(interviewType) ? 'PT는 혼자 발표' : undefined}
                />
                <Choice
                  title="면접관"
                  value={panelSize}
                  options={[[3, '3명'], [1, `1명 (${ROLE_LABELS[SOLO_ROLE[interviewType]]})`]]}
                  onChange={setPanelSize}
                />
                <Choice
                  title="언어"
                  value={inEnglish}
                  options={[[false, '한국어'], [true, '영어']]}
                  onChange={setInEnglish}
                />
              </div>
              {inEnglish && <p className="-mt-4 text-[11px] text-neutral-500">영어로 묻고 영어 답변을 평가해요. 피드백은 한국어로 나와요.</p>}

              {/* 질문 수 — PT·토론·토의는 정해진 차례로 진행 */}
              {!TURN_TYPES.includes(interviewType) && <div>
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-6">
                  <span className="text-sm text-neutral-300">질문 수</span>
                  <span className="text-xs text-neutral-500">{questionCount}개</span>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setQuestionCount(n => Math.max(MIN_QUESTIONS, n - 1))}
                    className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors text-lg"
                    disabled={questionCount <= MIN_QUESTIONS}
                  >
                    −
                  </button>
                  <span className="text-5xl font-bold underline underline-offset-4 w-16 text-center">
                    {questionCount}
                  </span>
                  <button
                    onClick={() => setQuestionCount(n => Math.min(MAX_QUESTIONS, n + 1))}
                    className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors text-lg"
                    disabled={questionCount >= MAX_QUESTIONS}
                  >
                    +
                  </button>
                </div>
              </div>}

              {/* 자기소개서 — PT·토론·토의는 주제 과제라 사용하지 않음 */}
              {!TURN_TYPES.includes(interviewType) && <div>
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-6">
                  <span className="text-sm text-neutral-300">자기소개서 <span className="text-neutral-500">(선택 · PDF 5MB 이하 · 첨부 시 자소서 기반 질문 출제)</span></span>
                  {coverLetterFile && (
                    <span className="text-xs text-neutral-500 truncate max-w-[200px]">
                      {coverLetterFile.name}
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setCoverLetterFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 w-24 h-24 rounded-2xl bg-neutral-800 hover:bg-neutral-700 transition-colors justify-center"
                  >
                    <Paperclip className="w-6 h-6" aria-hidden />
                    <span className="text-xs text-neutral-400">{coverLetterFile ? '파일 변경' : '파일 첨부하기'}</span>
                  </button>
                </div>
              </div>}
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 바: 지금까지 고른 것 + 다음 */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-night/90 backdrop-blur border-t border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-4 flex items-center gap-4">
          <p className="text-sm text-neutral-400 truncate flex-1">
            {[orgName, mode && `${MODE_LABELS[mode]} 모드`, step === 3 && formatLabel({ interview_type: interviewType, with_peers: withPeers, panel_size: panelSize, language: inEnglish ? 'en' : 'ko', track })]
              .filter(Boolean).join(' · ') || '기관을 골라 주세요'}
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleNext}
            disabled={!canNext || starting}
            className="shrink-0 px-7 py-3 bg-pink-500 hover:bg-pink-400 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:shadow-none text-white font-medium rounded-full transition-colors shadow-[0_8px_30px_-8px_#ff4f8b]"
          >
            {step < 3 ? '다음' : starting ? (TURN_TYPES.includes(interviewType) ? '주제 준비 중...' : coverLetterFile ? '자소서 분석 중...' : '준비 중...') : '면접 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
