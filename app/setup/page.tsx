'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { InterviewMode } from '@/lib/constants/modes';
import { MODE_LABELS } from '@/lib/constants/modes';
import { createClient } from '@/lib/supabase/client';
import createSession from '@/features/interview/server/createSession.server';

export async function getOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('organizations').select('*');
  if (error) throw error;
  return data;
}

const ORG_GROUPS = [
  {
    label: 'A. 금융',
    orgs: [
      { id: 'KAMCO', name: '한국자산관리공사', abbr: '캠코', bg: '#7f1d1d' },
    ],
  },
  {
    label: 'B. 에너지',
    orgs: [
      { id: 'KEPCO', name: '한국전력공사', abbr: 'KEPCO', bg: '#7f1d1d' },
    ],
  },
  {
    label: 'C. 주거, 인프라',
    orgs: [
      { id: 'LH', name: '한국토지주택공사', abbr: 'LH', bg: '#14532d' },
    ],
  },
  {
    label: 'D. 보건',
    orgs: [
      { id: 'HIRA', name: '건강보험심사평가원', abbr: 'HIRA', bg: '#3b0764' },
    ],
  },
];

const MODES: { id: InterviewMode; icon: string }[] = [
  { id: 'realistic', icon: '∿' },
  { id: 'casual',    icon: '◎' },
  { id: 'boss',      icon: '◈' },
  { id: 'cute',      icon: '✦' },
];

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 justify-center mb-10">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              n <= current ? 'bg-orange-500 text-white' : 'bg-neutral-700 text-neutral-400'
            }`}
          >
            {n}
          </div>
          {i < 2 && (
            <div className={`w-12 h-px ${n < current ? 'bg-orange-500' : 'bg-neutral-700'}`} />
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
  const [mode, setMode] = useState<InterviewMode | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canNext =
    (step === 1 && orgId !== null) ||
    (step === 2 && mode !== null) ||
    step === 3;

  async function handleNext() {
    if (step < 3) { setStep(s => s + 1); return; }
    // createSession이 서버에서 redirect()를 호출하므로 별도 라우팅 불필요
    await createSession(orgId!, mode!, questionCount, coverLetterFile);
  }

  function handleBack() {
    if (step === 1) { router.back(); return; }
    setStep(s => s - 1);
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-6">
        <button onClick={handleBack} className="text-sm text-neutral-400 hover:text-white transition-colors">
          ← 뒤로
        </button>
        <span className="text-sm font-medium text-white">면접 시작</span>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 px-8 max-w-4xl mx-auto w-full">
        <StepIndicator current={step} />

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-8">01. 기관 선택</h1>
            <div className="space-y-8">
              {ORG_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-4">
                    <span className="text-sm text-neutral-300">{group.label}</span>
                    <span className="text-xs text-neutral-500">{group.orgs.length} 기관</span>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {group.orgs.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => setOrgId(org.id)}
                        className={`flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${
                          orgId === org.id
                            ? 'ring-2 ring-orange-500'
                            : 'ring-1 ring-transparent hover:ring-neutral-600'
                        }`}
                      >
                        {/* TODO: replace with <Image> from org logo URL */}
                        <div
                          className="w-20 h-20 rounded-xl flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: org.bg }}
                        >
                          {org.abbr}
                        </div>
                        <span className="text-xs text-neutral-300 max-w-[80px] text-center leading-tight">
                          {org.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-8">02. 모드 선택</h1>
            <div className="flex gap-4 flex-wrap">
              {MODES.map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${
                    mode === id
                      ? 'ring-2 ring-orange-500'
                      : 'ring-1 ring-transparent hover:ring-neutral-600'
                  }`}
                >
                  <div className="w-24 h-24 rounded-xl bg-neutral-800 flex items-center justify-center text-3xl">
                    {icon}
                  </div>
                  <span className="text-sm text-neutral-300">{MODE_LABELS[id]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-8">03. 옵션 선택</h1>
            <div className="space-y-8">
              {/* 질문 수 */}
              <div>
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-6">
                  <span className="text-sm text-neutral-300">A. 질문 수</span>
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
              </div>

              {/* 자기소개서 */}
              <div>
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-6">
                  <span className="text-sm text-neutral-300">B. 자기소개서</span>
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
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => setCoverLetterFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 w-24 h-24 rounded-2xl bg-neutral-800 hover:bg-neutral-700 transition-colors justify-center"
                  >
                    {/* TODO: replace with HeartBeat or Microphone icon from components/icons */}
                    <span className="text-2xl">⊕</span>
                    <span className="text-xs text-neutral-400">파일 첨부하기</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-8 py-6 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!canNext}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-full transition-colors"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
