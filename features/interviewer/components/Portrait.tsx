import Image from 'next/image';
import type { ReactNode } from 'react';
import type { InterviewerRole } from '@/lib/constants/roles';
import type { InterviewMode } from '@/lib/constants/modes';

export type Mood = 'neutral' | 'happy' | 'upset';

export const moodOf = (delta: number | undefined): Mood =>
  !delta ? 'neutral' : delta > 0 ? 'happy' : 'upset';

// public/personas/ 에 있는 일러스트 (2:3 세로, 확장자 .png 제외). 그림을 추가하면 여기에도 적는다.
// 규칙: {mode}-{role} 기본, {mode}-{role}-happy / -upset 표정 (표정 그림은 기본 그림의 얼굴 위치를 따른다)
// 값 = 얼굴 중심 [x%, y%]. 말풍선 아바타에서 얼굴을 확대할 때 쓴다.
const FACES: Record<string, [number, number]> = {
  'cute-hr': [46, 29],
  'cute-tech': [50, 29],
  'cute-exec': [50, 26],
  'casual-hr': [49, 27],
  // AI 지원자 (다대다·토론·토의)
  'peer-p1': [46, 25],
  'peer-p2': [50, 26],
};
// 표정 그림 파일 이름 (예: 'cute-hr-happy', 'cute-hr-upset')
const MOOD_PORTRAITS = new Set<string>([
  'cute-hr-happy', 'cute-hr-upset', 'cute-tech-happy', 'cute-tech-upset', 'cute-exec-happy', 'cute-exec-upset',
]);

// 같은 이름으로 그림을 바꾸면 이미지 최적화·CDN 캐시가 예전 그림을 준다. 그림을 교체할 때 올린다.
const VERSION = 2;

// 그림 파일 주소 (예: 'cute-hr', 'peer-p1', 'cute-hr-happy')
export const personaUrl = (name: string) => `/personas/${name}.png?v=${VERSION}`;

export function portraitSrc(mode: InterviewMode, role: InterviewerRole, mood: Mood = 'neutral') {
  const base = `${mode}-${role}`;
  if (!FACES[base]) return null;
  return `/personas/${mood !== 'neutral' && MOOD_PORTRAITS.has(`${base}-${mood}`) ? `${base}-${mood}` : base}.png?v=${VERSION}`;
}

const ZOOM = 2.0;

interface Props {
  mode: InterviewMode;
  role: InterviewerRole;
  mood?: Mood;
  face?: boolean;         // 얼굴만 확대 (말풍선 아바타)
  silhouette?: boolean;   // 미수집 도감 카드
  sizes: string;
  fallback: ReactNode;    // 그림이 없는 면접관 (구슬)
  children?: ReactNode;   // 그림 위에 겹칠 요소
}

// 정사각 틀에서 얼굴 중심이 가운데 오도록 그림을 ZOOM 배로 키워 옮긴다 (그림 높이 = 너비 x 1.5).
// 부모: relative + overflow-hidden + 크기
function FaceCrop({ src, face: [x, y], sizes }: { src: string; face: [number, number]; sizes: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={1024}
      height={1536}
      sizes={sizes}
      style={{ position: 'absolute', maxWidth: 'none', width: `${ZOOM * 100}%`, height: 'auto', left: `${50 - ZOOM * x}%`, top: `${50 - ZOOM * 1.5 * y}%` }}
    />
  );
}

// AI 지원자 얼굴 (public/personas/peer-{id}.png)
export function PeerFace({ peer, sizes }: { peer: 'p1' | 'p2'; sizes: string }) {
  const key = `peer-${peer}`;
  return <FaceCrop src={`/personas/${key}.png?v=${VERSION}`} face={FACES[key]} sizes={sizes} />;
}

// 면접관 일러스트. 부모가 relative + 크기를 가져야 한다 (next/image fill).
// 표정 그림이 없으면 기본 그림, 기본 그림도 없으면 fallback.
export function Portrait({ mode, role, mood, face, silhouette, sizes, fallback, children }: Props) {
  const src = portraitSrc(mode, role, mood);
  if (!src) return <>{fallback}</>;
  if (face) return <FaceCrop src={src} face={FACES[`${mode}-${role}`]} sizes={sizes} />;
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        // 일러스트에 배경이 있어 실루엣 대신 흐리게 가린다
        className={`object-cover ${silhouette ? 'blur-md brightness-[0.35] grayscale scale-110' : ''}`}
        style={{ objectPosition: '50% 15%' }}
      />
      {children}
    </>
  );
}
