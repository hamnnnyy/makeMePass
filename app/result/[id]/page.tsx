import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { INTERVIEWER_ROLES, ROLE_LABELS, type InterviewerRole } from '@/lib/constants/roles';
import { ELIMINATED_LINE, OBJECTION_LINE, PASS_LINE } from '@/lib/constants/interview';
import { PageHeader } from '@/components/layout/PageHeader';
import { DialogueBox } from '@/features/interviewer/components/DialogueBox';
import { InterviewerPanel } from '@/features/interviewer/components/InterviewerPanel';
import { PersonaCard } from '@/features/interviewer/components/PersonaCard';
import { unlockAchievements } from '@/features/gamification/server/unlockAchievements.server';
import { getPersonaNames } from '@/features/interviewer/personaNames';
import { getPlayerStats } from '@/features/gamification/server/playerStats';
import { levelInfo, rankName, sessionXp, ORB_COLORS } from '@/features/gamification/logic/level';
import { LevelBar } from '@/features/gamification/components/LevelBar';
import { INTERVIEW_TYPE_INFO } from '@/lib/constants/interviewTypes';

const TITLE = {
  pass: '최종 합격',
  fail_veto: '합의 결렬',
  fail_eliminate: '면접 종료',
  pending: '집계 중',
} as const;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(iso)).replaceAll('-', '.');

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session }, { data: questions }, gamification] = await Promise.all([
    supabase
      .from('interview_sessions')
      .select('*, organizations(code, name_ko, pass_threshold, veto_threshold, eliminate_threshold)')
      .eq('id', id)
      .single(),
    supabase
      .from('session_questions')
      .select('id, question_text, asked_by_role, duration_seconds, answered_at')
      .eq('session_id', id)
      .not('answered_at', 'is', null)
      .order('answered_at'),
    unlockAchievements(id),
  ]);

  if (!session) return (
    <div className="min-h-screen bg-night text-white flex items-center justify-center">
      <p className="text-neutral-400">세션을 찾을 수 없습니다.</p>
    </div>
  );

  const org = session.organizations;
  const abandoned = session.status === 'aborted';
  const [names, player] = await Promise.all([
    getPersonaNames(supabase, session.mode),
    getPlayerStats(supabase, session.user_id),
  ]);
  const result = session.result;
  const favor: Record<InterviewerRole, number> = {
    hr: session.hr_final_score ?? 50,
    tech: session.tech_final_score ?? 50,
    exec: session.exec_final_score ?? 50,
  };
  const who = (r: InterviewerRole) => `${ROLE_LABELS[r]} ${names[r]} (${favor[r]}%)`;

  // 탈락·결렬이면 결정적인 면접관을 가운데에 크게
  const focus = result === 'fail_eliminate' || result === 'fail_veto' ? session.veto_role : null;
  const lowest = INTERVIEWER_ROLES.reduce((a, b) => (favor[b] < favor[a] ? b : a));
  const order: InterviewerRole[] = focus
    ? [...INTERVIEWER_ROLES.filter((r) => r !== focus).slice(0, 1), focus, ...INTERVIEWER_ROLES.filter((r) => r !== focus).slice(1)]
    : [...INTERVIEWER_ROLES];

  const line: [InterviewerRole, string] | null =
    abandoned ? null
    : result === 'pass' ? ['hr', PASS_LINE]
    : result === 'fail_eliminate' ? [focus ?? lowest, ELIMINATED_LINE]
    : [focus ?? lowest, OBJECTION_LINE[focus ?? lowest]];

  const answered = questions ?? [];
  const durations = answered.map((q) => q.duration_seconds).filter((v): v is number => v !== null);
  const stats = [
    `답변 ${answered.length}개`,
    session.duration_seconds ? `소요 ${Math.max(1, Math.round(session.duration_seconds / 60))}분` : null,
    durations.length ? `평균 ${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)}초` : null,
  ].filter(Boolean).join(' · ');

  // 이번 면접으로 얻은 경험치와 레벨업
  const gained = sessionXp(answered.length, !abandoned, result === 'pass');
  const before = levelInfo(Math.max(0, player.xp - gained));
  const leveledUp = player.level > before.level;
  const newColors = ORB_COLORS.filter((c) => c.level > before.level && c.level <= player.level);

  const pass = org?.pass_threshold ?? 60;
  const pro = INTERVIEWER_ROLES.filter((r) => favor[r] >= pass);
  const con = INTERVIEWER_ROLES.filter((r) => favor[r] < pass);
  // 탈락하면 면접이 바로 끝나므로 마지막 답변이 탈락 문항
  const elimIdx = answered.length - 1;
  const elimQ = answered[elimIdx];

  return (
    <div className="min-h-screen bg-night text-white flex flex-col">
      <PageHeader
        title={abandoned ? '면접 중단' : TITLE[result]}
        back={{ href: '/', label: '홈' }}
        right={
          <span className="text-xs md:text-sm text-neutral-400 text-right">
            {org?.code} · {INTERVIEW_TYPE_INFO[session.interview_type ?? 'general'].label} · {formatDate(session.started_at)}
          </span>
        }
      />
    <div className="flex flex-col px-6 md:px-8 py-8 gap-8">

      {/* 면접관 */}
      <div className="grid grid-cols-3 gap-4 items-center max-w-4xl mx-auto w-full">
        {order.map((r) => (
          <InterviewerPanel
            key={r}
            mode={session.mode}
            role={r}
            mood={result === 'pass' ? 'happy' : r === focus ? 'upset' : 'neutral'}
            name={names[r]}
            favor={favor[r]}
            passLine={pass}
            large={r === focus}
            danger={r === focus}
          />
        ))}
      </div>

      {line && (
        <div className="max-w-4xl mx-auto w-full">
          <DialogueBox role={line[0]} name={names[line[0]]}>{line[1]}</DialogueBox>
        </div>
      )}

      {/* 요약 */}
      <div className="max-w-md mx-auto w-full rounded-2xl bg-gradient-to-b from-neutral-800/60 to-neutral-900 border border-neutral-800 px-6 py-5 flex flex-col items-center gap-1 text-center">
        {abandoned ? (
          <>
            <h2 className="text-lg font-semibold">평가 없음</h2>
            <p className="text-xs text-neutral-500">답변한 문항이 없어 결과를 내지 않았습니다.</p>
          </>
        ) : result === 'fail_eliminate' ? (
          <>
            <h2 className="text-lg font-semibold">호감도 임계값 미달</h2>
            <p className="text-xs text-neutral-500">({favor[focus ?? lowest]}% / {org?.eliminate_threshold}%)</p>
            {elimQ && (
              <>
                <hr className="w-full border-neutral-700 my-3" />
                <p className="text-xs text-neutral-500">{elimIdx + 1}번째 답변 이후 발생</p>
                <p className="text-sm">[{ROLE_LABELS[elimQ.asked_by_role]}] {elimQ.question_text}</p>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">
              {result === 'pass' ? '만장일치 합격' : pro.length ? `${pro.length} 대 ${con.length} 결렬` : '전원 불합격 판정'}
            </h2>
            <p className="text-xs text-neutral-500">{stats}</p>
            {result !== 'pass' && (
              <>
                <hr className="w-full border-neutral-700 my-3" />
                <p className="text-xs text-neutral-500">결과 (합격선 {pass}%)</p>
                {pro.length > 0 && <p className="text-sm">찬성. {pro.map(who).join(' · ')}</p>}
                <p className="text-sm">반대. {con.map(who).join(' · ')}</p>
              </>
            )}
          </>
        )}

        {(gamification.newAchievements.length > 0 || gamification.newStreak > 1) && (
          <>
            <hr className="w-full border-neutral-700 my-3" />
            {gamification.newAchievements.length > 0 && (
              <>
                <p className="text-xs text-neutral-500">신규 칭호 획득</p>
                <p className="text-sm font-semibold">
                  {gamification.newAchievements.map((a) => `${a.icon ?? ''} ${a.name_ko}`.trim()).join(' · ')}
                </p>
              </>
            )}
            {gamification.newStreak > 1 && (
              <p className="text-xs text-pink-400 mt-1">
                {gamification.newStreak}일 연속 연습{gamification.isNewRecord && ' · 최고 기록'}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!abandoned && (
          <Link
            href={`/result/${id}/review`}
            className="px-7 py-3 rounded-full bg-pink-500 hover:bg-pink-400 transition-colors font-medium shadow-[0_8px_30px_-8px_#ff4f8b]"
          >
            복기하기
          </Link>
        )}
        <Link
          href="/setup"
          className="px-7 py-3 rounded-full border border-neutral-600 hover:border-neutral-400 text-neutral-200 transition-colors font-medium"
        >
          {result === 'fail_eliminate' ? '재도전' : '한 번 더'}
        </Link>
      </div>

      {/* 경험치 */}
      {gained > 0 && (
        <div className="max-w-md mx-auto w-full rounded-2xl bg-neutral-900 border border-neutral-800 px-5 py-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-amber-300">+{gained} XP</span>
            {leveledUp && <span className="text-xs font-bold text-pink-400 animate-pulse">LEVEL UP! Lv.{player.level} {rankName(player.level)}</span>}
          </div>
          <LevelBar level={player.level} into={player.into} need={player.need} />
          {newColors.length > 0 && (
            <Link href="/settings" className="text-xs text-neutral-400 hover:text-white">
              새 구슬 색 해금: {newColors.map((c) => c.label).join(', ')} → 꾸미기
            </Link>
          )}
        </div>
      )}

      {/* 도감: 합격하면 이 모드의 면접관 3명 수집 */}
      {gamification.collected.length > 0 && (
        <div className="max-w-md mx-auto w-full flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-neutral-500">
              {gamification.collected.some((c) => c.isNew) ? '면접관 도감에 추가되었습니다' : '이미 수집한 면접관입니다'}
            </p>
            <Link href="/collection" className="text-xs text-pink-400 hover:text-pink-300">도감 보기 →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {gamification.collected.map((c) => (
              <PersonaCard key={c.role} mode={session.mode} role={c.role} name={c.label_ko} collected isNew={c.isNew} />
            ))}
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
