# 파일 구조 책임 문서

## 분석 범위
- 기준 시점: 2026-04-23
- 포함: 저장소 내 소스/설정/자산 파일
- 제외: `.git/`, `node_modules/`, `.next/`
- 주의: 코드가 비어 있는 파일도 파일명/모듈 위치를 기준으로 담당 작업(의도된 책임)을 명시

## 폴더 책임
| 폴더 | 책임 |
|---|---|
| `./` | 프로젝트 루트 |
| `./app/` | Next.js App Router 진입점(전역 레이아웃/페이지) |
| `./components/` | 공용 UI 컴포넌트 레이어 |
| `./components/hapsaca/` | 브랜드 전용(Hapsaca) UI 컴포넌트 |
| `./components/icons/` | 아이콘 컴포넌트 집합 |
| `./components/icons/custom/` | 프로젝트 전용 커스텀 아이콘 |
| `./components/layout/` | 전역 레이아웃 UI 컴포넌트 |
| `./core/` | 도메인 공통 비즈니스 코어 계층 |
| `./core/evaluation/` | 평가 도메인 코어 로직 |
| `./core/interviewer/` | 면접관 도메인 코어 로직/타입 |
| `./core/preferences/` | 사용자 환경설정 코어 로직 |
| `./core/session/` | 세션 상태 및 상태머신 코어 로직 |
| `./core/user/` | 사용자 도메인 코어 로직 |
| `./docs/` | 프로젝트 내부 기술 문서 |
| `./features/` | 기능 단위(Feature-sliced) 모듈 집합 |
| `./features/auth/` | 인증 기능 모듈 |
| `./features/auth/hooks/` | 인증 관련 React 훅 |
| `./features/auth/server/` | 인증 관련 서버 유틸/가드 |
| `./features/cover-letter/` | 자소서(커버레터) 기능 모듈 |
| `./features/cover-letter/components/` | 자소서 UI 컴포넌트 |
| `./features/cover-letter/hooks/` | 자소서 상태/행동 훅 |
| `./features/cover-letter/logic/` | 자소서 분석/가공 로직 |
| `./features/evaluation/` | 답변 평가 기능 모듈 |
| `./features/evaluation/components/` | 평가 결과 시각 UI |
| `./features/evaluation/hooks/` | 평가 애니메이션/상태 훅 |
| `./features/evaluation/logic/` | 평가 점수/규칙 계산 로직 |
| `./features/evaluation/server/` | 평가 서버 액션/서비스 |
| `./features/evaluation/server/prompts/` | 평가용 LLM 프롬프트 |
| `./features/gamification/` | 게이미피케이션 기능 모듈 |
| `./features/gamification/components/` | 게이미피케이션 UI |
| `./features/gamification/logic/` | 도전과제/업적 계산 로직 |
| `./features/gamification/server/` | 게이미피케이션 서버 처리 |
| `./features/interview/` | 면접 진행 기능 모듈 |
| `./features/interview/components/` | 면접 세션 UI 컴포넌트 |
| `./features/interview/hooks/` | 면접 세션/미디어 훅 |
| `./features/interview/logic/` | 질문 라우팅/세션 상태 로직 |
| `./features/interview/server/` | 면접 서버 액션 |
| `./features/interviewer/` | 면접관 페르소나/카드 기능 모듈 |
| `./features/interviewer/components/` | 면접관 시각 컴포넌트 |
| `./features/interviewer/personas/` | 면접관 페르소나 데이터 |
| `./features/interviewer/tts/` | 면접관 TTS 처리 |
| `./features/mediapipe/` | MediaPipe 기반 표정/시선 분석 모듈 |
| `./features/mediapipe/hooks/` | MediaPipe 훅 |
| `./features/mediapipe/logic/` | MediaPipe 신호 해석 로직 |
| `./features/organization/` | 기관/조직 선택 기능 모듈 |
| `./features/organization/components/` | 조직 선택 UI |
| `./features/organization/data/` | 조직별 정적 데이터 |
| `./features/visualizer/` | 3D 오디오 반응 시각화 기능 모듈 |
| `./features/visualizer/components/` | 시각화용 Three.js/R3F 컴포넌트 |
| `./features/visualizer/engine/` | 오디오 분석/파티클 엔진 레이어 |
| `./features/visualizer/engine/shaders/` | GLSL 셰이더 리소스 |
| `./features/visualizer/hooks/` | 시각화 제어 훅 |
| `./features/visualizer/scenes/` | 장면(Scene) 조합 및 캔버스 진입점 |
| `./hooks/` | 공용 React 훅 |
| `./lib/` | 외부 서비스/유틸/상수 라이브러리 |
| `./lib/claude/` | Claude API 연동 레이어 |
| `./lib/constants/` | 전역 상수 정의 |
| `./lib/google-tts/` | Google TTS 연동 레이어 |
| `./lib/storage/` | 파일 업로드/스토리지 연동 |
| `./lib/supabase/` | Supabase 클라이언트/서버 연동 |
| `./lib/utils/` | 범용 유틸리티 함수 |
| `./processes/` | 여러 feature를 묶는 상위 비즈니스 프로세스 |
| `./processes/interview-session/` | 면접 세션 프로세스 오케스트레이션 |
| `./public/` | 정적 에셋 제공 폴더 |
| `./public/fonts/` | 커스텀 폰트 에셋 위치 |
| `./public/icons/` | 정적 아이콘 에셋 위치 |
| `./public/mediapipe/` | MediaPipe 모델/리소스 에셋 위치 |
| `./public/og/` | Open Graph 이미지 에셋 위치 |
| `./public/tts-cache/` | TTS 캐시 오디오 정적 파일 위치 |
| `./scripts/` | 개발/운영 자동화 스크립트 |
| `./shared/` | feature 간 공유 리소스 |
| `./shared/ui/` | 공유 UI 상태/유틸 |
| `./styles/` | 레거시 전역 스타일 리소스 |
| `./supabase/` | Supabase 스키마/시드 리소스 |
| `./supabase/migrations/` | DB 마이그레이션 SQL 저장 위치 |
| `./supabase/seed/` | 초기 데이터 시드 SQL |
| `./types/` | 전역/도메인 타입 선언 |

## 파일 책임
| 파일 | 담당 작업 | 구현 상태 |
|---|---|---|
| `./.env.local` | 로컬 개발용 환경변수를 보관한다(개인/민감 값). | 코드 구현됨 |
| `./.gitignore` | Git에서 추적하지 않을 파일/폴더를 정의한다. | 코드 구현됨 |
| `./AGENTS.md` | 에이전트 작업 규칙과 Next.js 버전 주의사항을 정의한다. | 코드 구현됨 |
| `./CLAUDE.md` | 에이전트 규칙 파일 연결 포인터 역할을 한다. | 코드 구현됨 |
| `./README.md` | 프로젝트 실행/학습용 기본 안내를 제공한다. | 코드 구현됨 |
| `./app/favicon.ico` | 브라우저 탭 파비콘을 제공한다. | 코드 구현됨 |
| `./app/globals.css` | Tailwind 로드와 전역 색상/폰트 토큰을 정의한다. | 코드 구현됨 |
| `./app/layout.tsx` | 루트 HTML 구조, 전역 폰트, 메타데이터를 설정한다. | 코드 구현됨 |
| `./app/page.tsx` | 랜딩 페이지에서 기본 장면(InterviewerSceneClient)을 렌더링한다. | 코드 구현됨 |
| `./bun.lock` | Bun 의존성 버전을 고정한다. | 코드 구현됨 |
| `./components/hapsaca/HeartParticle.tsx` | 브랜드 연출용 하트 파티클 효과를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./components/hapsaca/KeyboardKey.tsx` | 키보드 키 캡 형태의 입력 힌트 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./components/hapsaca/ModeTag.tsx` | 현재 동작 모드를 태그(배지) 형태로 표시한다. | 코드 없음(파일 구조만 생성) |
| `./components/hapsaca/OrgBadge.tsx` | 선택 조직/기관 정보를 배지 형태로 표시한다. | 코드 없음(파일 구조만 생성) |
| `./components/hapsaca/TsundereButton.tsx` | 브랜드 톤의 커스텀 인터랙션 버튼을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./components/icons/custom/HeartBeat.tsx` | 심박/활력 상태를 표현하는 커스텀 아이콘을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./components/icons/custom/Microphone.tsx` | 마이크 상태를 표현하는 커스텀 아이콘을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./components/icons/index.tsx` | 아이콘 컴포넌트 export를 한곳에서 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./components/layout/AppShell.tsx` | 앱 공통 레이아웃 골격(헤더/본문/푸터)을 구성한다. | 코드 없음(파일 구조만 생성) |
| `./components/layout/Footer.tsx` | 공통 페이지 하단 푸터를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./components/layout/Navbar.tsx` | 공통 상단 내비게이션 바를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./core/evaluation/calculateDelta.ts` | 이전 대비 평가 점수 증감량(delta)을 계산한다. | 코드 없음(파일 구조만 생성) |
| `./core/evaluation/checkVeto.ts` | 치명적 감점/실격(veto) 규칙을 판정한다. | 코드 없음(파일 구조만 생성) |
| `./core/evaluation/index.ts` | 평가 코어 로직을 외부에 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./core/evaluation/scoreAxes.ts` | 다축(예: 전달력/논리성 등) 점수를 산정한다. | 코드 없음(파일 구조만 생성) |
| `./core/interviewer/index.ts` | 면접관 코어 유틸/도메인 API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./core/interviewer/types.ts` | 면접관 도메인 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./core/preferences/index.ts` | 사용자 선호 설정 읽기/쓰기 규칙을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./core/session/index.ts` | 세션 코어 API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./core/session/stateMachine.ts` | 면접 세션 상태 전이 규칙(상태머신)을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./core/user/index.ts` | 사용자 코어 로직/API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./docs/FILE_STRUCTURE.md` | 프로젝트 파일·폴더 책임 문서(본 문서) | 코드 구현됨 |
| `./eslint.config.mjs` | ESLint 규칙과 검사 제외 경로를 설정한다. | 코드 구현됨 |
| `./features/auth/hooks/useUser.ts` | 로그인 사용자 정보와 인증 상태를 구독/제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/auth/index.ts` | 인증 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/auth/server/requireUser.server.ts` | 서버 요청에서 인증 사용자를 강제 검증한다. | 코드 없음(파일 구조만 생성) |
| `./features/cover-letter/components/ActiveCoverLetterBadge.tsx` | 현재 활성 자소서를 배지 형태로 표시한다. | 코드 없음(파일 구조만 생성) |
| `./features/cover-letter/components/CoverLetterEditor.tsx` | 자소서 본문을 작성/수정하는 에디터 UI를 제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/cover-letter/hooks/useActiveCoverLetter.ts` | 활성 자소서 선택 상태를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./features/cover-letter/index.ts` | 커버레터 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/cover-letter/logic/extractKeyPoints.ts` | 자소서 텍스트에서 핵심 포인트를 추출한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/components/EvaluationBreakdown.tsx` | 평가 항목별 점수/근거를 분해해 보여준다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/components/FavorGauge.tsx` | 호감도/평가 지표를 게이지 UI로 시각화한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/components/FloatingDelta.tsx` | 점수 증감량을 부유 애니메이션으로 표시한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/hooks/useFavorAnimation.ts` | 호감도 변화 애니메이션 상태를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/index.ts` | 평가 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/logic/{applyCascade.ts}` | 연쇄 규칙(cascade)을 반영해 최종 점수를 보정한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/server/evaluateAnswer.server.ts` | 답변 평가 서버 액션(채점/저장 호출)을 수행한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/server/prompts/evaluationPrompt.ts` | 답변 평가용 LLM 프롬프트 템플릿을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/server/prompts/followUpPrompt.ts` | 추가질문 생성용 LLM 프롬프트 템플릿을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/evaluation/types.ts` | 평가 도메인 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/components/AchievementGallery.tsx` | 획득/미획득 업적 목록을 갤러리 형태로 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/components/AchievementToast.tsx` | 업적 달성 토스트 알림 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/components/DailyChallengeCard.tsx` | 일일 도전과제 카드 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/components/StreakCounter.tsx` | 연속 수행(streak) 카운터 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/index.ts` | 게이미피케이션 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/logic/achievementCheck.ts` | 조건 충족 여부를 검사해 업적 달성을 판정한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/logic/challengeGenerator.ts` | 일일/주간 도전과제를 생성한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/logic/streakUpdater.ts` | 활동 기록을 기준으로 streak를 갱신한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/server/rotateDailyChallenge.server.ts` | 일일 도전과제를 교체(로테이션)하는 서버 작업을 수행한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/server/unlockAchievements.server.ts` | 달성 조건을 평가해 업적 해제를 처리한다. | 코드 없음(파일 구조만 생성) |
| `./features/gamification/types.ts` | 게이미피케이션 도메인 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/components/AnswerRecorder.tsx` | 답변 음성 녹음/제어 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/components/InterviewerCard.tsx` | 면접관 카드 형태의 발화/상태 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/components/InterviewerGrid.tsx` | 복수 면접관 카드를 그리드로 배치한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/components/QuestionDisplay.tsx` | 현재 질문과 메타 정보를 화면에 표시한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/components/SelfCam.tsx` | 사용자 셀프캠(웹캠 프리뷰) 화면을 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/components/SessionLayout.tsx` | 면접 세션 화면 레이아웃을 조립한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/hooks/useMediaStream.ts` | 카메라/마이크 MediaStream 획득과 정리를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/hooks/useQuestionQueue.ts` | 질문 큐 로딩/소비/다음 질문 선택 상태를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/hooks/useRecorder.ts` | 녹음 시작/중지/Blob 생성 등 레코더 상태를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/hooks/useSession.ts` | 면접 세션 전체 상태와 액션을 통합 관리한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/index.ts` | 면접 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/logic/followUpGenerator.ts` | 답변 맥락 기반 후속 질문 생성 규칙을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/logic/questionRouter.ts` | 세션 상황에 맞는 다음 질문 라우팅을 결정한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/logic/sessionStateMachine.ts` | 면접 세션 상태 전이 규칙을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/server/createSession.server.ts` | 새 면접 세션을 생성하는 서버 액션을 수행한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/server/endSession.server.ts` | 면접 세션 종료 및 정산 처리를 수행한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/server/sampleQuestions.server.ts` | 샘플 질문 조회/제공 서버 액션을 수행한다. | 코드 없음(파일 구조만 생성) |
| `./features/interview/types.ts` | 면접 도메인 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/components/InterviewerAvatar.tsx` | 면접관 아바타 비주얼을 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/components/InterviewerCard.tsx` | InterviewerScene을 카드 UI로 감싸 보여주는 컴포넌트 초안을 담는다. | 코드 구현됨 |
| `./features/interviewer/components/NameplateCard.tsx` | 면접관 이름/직책 네임플레이트 카드를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/index.ts` | 면접관 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/personas/boss.ts` | 강압형/엄격형 면접관 페르소나 설정을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/personas/casual.ts` | 캐주얼/친화형 면접관 페르소나 설정을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/personas/cute.ts` | 부드러운 톤의 면접관 페르소나 설정을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/personas/realistic.ts` | 현실형 기본 면접관 페르소나 설정을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/personas/types.ts` | 페르소나 데이터 구조 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/tts/audioCache.ts` | TTS 음성 캐시 조회/저장 규칙을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/interviewer/tts/useTTS.ts` | 면접관 TTS 재생 훅(생성/재생/상태)을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/hooks/useExpressionMetrics.ts` | 표정 지표(웃음/집중도 등) 계산 훅을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/hooks/useFaceLandmarker.ts` | FaceLandmarker 로딩과 랜드마크 추론 훅을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/index.ts` | MediaPipe feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/logic/gazeTracker.ts` | 시선 방향 추적 로직을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/logic/headMovement.ts` | 고개 움직임(노드/흔들림) 분석 로직을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/logic/smileDetector.ts` | 미소/입꼬리 변화 감지 로직을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/mediapipe/types.ts` | MediaPipe 분석 결과 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/components/OrgSelector.tsx` | 지원 기관/조직 선택 UI를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/data/hira.ts` | HIRA 기관 맞춤 질문/메타 정적 데이터를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/data/kamco.ts` | KAMCO 기관 맞춤 질문/메타 정적 데이터를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/data/kepco.ts` | KEPCO 기관 맞춤 질문/메타 정적 데이터를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/data/lh.ts` | LH 기관 맞춤 질문/메타 정적 데이터를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/index.ts` | 조직 feature의 public API를 재수출한다. | 코드 없음(파일 구조만 생성) |
| `./features/organization/types.ts` | 기관/조직 도메인 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/components/BackgroundVisualizer.tsx` | 장면 배경 효과(그라데이션/입자/광원)를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/components/CircularMatrix.tsx` | 주파수 대역을 3개 링의 인스턴스 바로 시각화한다. | 코드 구현됨 |
| `./features/visualizer/components/HeroVisualizer.tsx` | 오디오 반응형 포인트 클라우드를 렌더링한다. | 코드 구현됨 |
| `./features/visualizer/components/InterviewerOrb.tsx` | 노이즈 셰이더로 변형되는 면접관 오브를 렌더링한다. | 코드 구현됨 |
| `./features/visualizer/components/ResultVisualizer.tsx` | 평가 결과 전용 3D 시각화 컴포넌트를 렌더링한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/components/WireframeSphere.tsx` | 피치/말속도/음량 반응형 와이어프레임 구체를 렌더링한다. | 코드 구현됨 |
| `./features/visualizer/engine/AudioAnalyser.ts` | HTMLAudioElement를 FFT로 분석해 강도/저역 에너지를 계산한다. | 코드 구현됨 |
| `./features/visualizer/engine/MicAnalyser.ts` | 마이크 입력에서 음량·피치·말속도 지표를 추출한다. | 코드 구현됨 |
| `./features/visualizer/engine/ParticleSystem.ts` | 웨이브 파티클 위치/색상 버퍼를 생성·업데이트한다. | 코드 구현됨 |
| `./features/visualizer/engine/SystemAudioAnalyser.ts` | 화면공유 오디오를 캡처하고 주파수/진폭 데이터를 제공한다. | 코드 구현됨 |
| `./features/visualizer/engine/WavaField.ts` | 헬릭스 기반 웨이브 파티클 좌표를 계산한다. | 코드 구현됨 |
| `./features/visualizer/engine/shaders/loadShader.ts` | 셰이더 소스를 로딩/정규화하는 유틸을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/engine/shaders/particle.frag.ts` | 파티클 렌더링용 fragment shader 소스를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/engine/shaders/particle.vert.ts` | 파티클 렌더링용 vertex shader 소스를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/hooks/useAudioAnalyser.ts` | AudioAnalyser 생성/해제를 React 생명주기에 맞춰 관리한다. | 코드 구현됨 |
| `./features/visualizer/hooks/useAudioReactive.ts` | 오디오 강도 접근 함수를 컴포넌트에 제공한다. | 코드 구현됨 |
| `./features/visualizer/hooks/useMicReactive.ts` | MicAnalyser 시작/상태/측정값 인터페이스를 제공한다. | 코드 구현됨 |
| `./features/visualizer/hooks/useParticleSystem.ts` | 프리셋 기반 ParticleSystem 인스턴스를 메모이즈한다. | 코드 구현됨 |
| `./features/visualizer/hooks/useSystemAudioReactive.ts` | SystemAudioAnalyser의 시작/중지/오류/데이터 접근을 관리한다. | 코드 구현됨 |
| `./features/visualizer/hooks/useVisualizerPerformance.ts` | FPS/기기 성능에 맞춘 시각화 품질 조절 로직을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/index.ts` | visualizer 모듈의 public API를 재수출한다. | 코드 구현됨 |
| `./features/visualizer/scenes/HeroScene.tsx` | 마이크 기반 Hero 장면(Canvas, Bloom, 상태 UI)을 구성한다. | 코드 구현됨 |
| `./features/visualizer/scenes/HeroSceneClient.tsx` | HeroScene을 CSR 전용으로 동적 로딩한다. | 코드 구현됨 |
| `./features/visualizer/scenes/InterviewerScene.tsx` | 면접관 오브 장면과 색상 컨트롤 UI를 구성한다. | 코드 구현됨 |
| `./features/visualizer/scenes/InterviewerSceneClient.tsx` | InterviewerScene을 CSR 전용으로 동적 로딩한다. | 코드 구현됨 |
| `./features/visualizer/scenes/ResultScene.tsx` | 면접 결과 화면용 시각화 장면을 구성한다. | 코드 없음(파일 구조만 생성) |
| `./features/visualizer/scenes/SystemAudioScene.tsx` | 시스템 오디오 기반 원형 매트릭스 장면을 구성한다. | 코드 구현됨 |
| `./features/visualizer/scenes/SystemAudioSceneClient.tsx` | SystemAudioScene을 CSR 전용으로 동적 로딩한다. | 코드 구현됨 |
| `./hooks/useClientOnly.ts` | 클라이언트에서만 실행해야 하는 로직을 안전하게 감싼다. | 코드 없음(파일 구조만 생성) |
| `./hooks/useDebounce.ts` | 입력/값 변경을 디바운싱해 반응 빈도를 제어한다. | 코드 없음(파일 구조만 생성) |
| `./hooks/useInterval.ts` | React 생명주기와 연동된 interval 실행을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./hooks/useLocalStorage.ts` | 상태와 localStorage를 동기화한다. | 코드 없음(파일 구조만 생성) |
| `./hooks/useMediaDevices.ts` | 사용 가능한 미디어 장치 목록/권한 상태를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./lib/claude/client.ts` | Claude API 호출 클라이언트를 초기화/실행한다. | 코드 없음(파일 구조만 생성) |
| `./lib/claude/models.ts` | 사용 가능한 Claude 모델 식별자/설정을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./lib/constants/modes.ts` | 앱 동작 모드 상수를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./lib/constants/paths.ts` | 라우트/스토리지 경로 상수를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./lib/constants/roles.ts` | 면접 역할/권한 상수를 정의한다. | 코드 없음(파일 구조만 생성) |
| `./lib/google-tts/client.ts` | Google TTS API 클라이언트를 초기화/호출한다. | 코드 없음(파일 구조만 생성) |
| `./lib/google-tts/voices.ts` | 사용할 TTS 음성 목록과 매핑을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./lib/storage/uploadBlob.ts` | Blob 파일 업로드 공통 함수를 제공한다. | 코드 없음(파일 구조만 생성) |
| `./lib/supabase/client.ts` | 브라우저용 Supabase 클라이언트를 생성한다. | 코드 없음(파일 구조만 생성) |
| `./lib/supabase/middleware.ts` | 요청 시 Supabase 세션 동기화 미들웨어를 구성한다. | 코드 없음(파일 구조만 생성) |
| `./lib/supabase/server.ts` | 서버 컴포넌트/액션용 Supabase 클라이언트를 생성한다. | 코드 없음(파일 구조만 생성) |
| `./lib/supabase/service-role.ts` | 서비스 롤 키 기반 Supabase 클라이언트를 생성한다. | 코드 없음(파일 구조만 생성) |
| `./lib/utils/assertEnv.ts` | 필수 환경변수 존재 여부를 검증한다. | 코드 없음(파일 구조만 생성) |
| `./lib/utils/cn.ts` | className 문자열을 병합/정규화한다. | 코드 없음(파일 구조만 생성) |
| `./lib/utils/formatTime.ts` | 시간/소요시간 값을 UI 표시용 문자열로 포맷한다. | 코드 없음(파일 구조만 생성) |
| `./lib/utils/sample.ts` | 배열/데이터에서 샘플링하는 유틸을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./next-env.d.ts` | Next.js 타입 참조를 TypeScript에 주입한다. | 코드 구현됨 |
| `./next.config.ts` | 셰이더 로더/three transpile 등 Next 빌드 옵션을 설정한다. | 코드 구현됨 |
| `./package.json` | 실행 스크립트, 의존성, 프로젝트 메타 정보를 정의한다. | 코드 구현됨 |
| `./postcss.config.mjs` | PostCSS에서 Tailwind v4 플러그인을 활성화한다. | 코드 구현됨 |
| `./processes/interview-session/runAnswerPipeline.ts` | 답변 처리 파이프라인(수집→평가→저장)을 오케스트레이션한다. | 코드 없음(파일 구조만 생성) |
| `./public/file.svg` | 파일 아이콘 SVG 자산을 제공한다. | 코드 구현됨 |
| `./public/globe.svg` | 지구본 아이콘 SVG 자산을 제공한다. | 코드 구현됨 |
| `./public/next.svg` | Next.js 로고 SVG 자산을 제공한다. | 코드 구현됨 |
| `./public/vercel.svg` | Vercel 로고 SVG 자산을 제공한다. | 코드 구현됨 |
| `./public/window.svg` | 창/브라우저 아이콘 SVG 자산을 제공한다. | 코드 구현됨 |
| `./scripts/check-schema.ts` | DB/타입 스키마 일치 여부를 점검한다. | 코드 없음(파일 구조만 생성) |
| `./scripts/generate-tts-cache.ts` | 면접관 발화 TTS 오디오 캐시를 생성한다. | 코드 없음(파일 구조만 생성) |
| `./scripts/generate-types.sh` | 스키마 기반 타입 생성 스크립트를 실행한다. | 코드 없음(파일 구조만 생성) |
| `./scripts/seed-questions.ts` | 질문 시드 데이터를 DB에 적재한다. | 코드 없음(파일 구조만 생성) |
| `./shared/ui/store.ts` | 여러 화면에서 공유되는 UI 상태 스토어를 관리한다. | 코드 없음(파일 구조만 생성) |
| `./styles/fonts.css` | 커스텀 폰트-face 정의와 폰트 관련 전역 스타일을 관리한다. | 코드 없음(파일 구조만 생성) |
| `./styles/globals.css` | 프로젝트 공통 글로벌 스타일을 관리한다. | 코드 없음(파일 구조만 생성) |
| `./supabase/seed/personas_mentions.sql` | 페르소나/멘션 관련 초기 데이터를 삽입한다. | 코드 없음(파일 구조만 생성) |
| `./supabase/seed/question_organizations.sql` | 질문-기관 매핑 초기 데이터를 삽입한다. | 코드 없음(파일 구조만 생성) |
| `./supabase/seed/questions.sql` | 질문 마스터 초기 데이터를 삽입한다. | 코드 없음(파일 구조만 생성) |
| `./tsconfig.json` | TypeScript 컴파일 옵션과 경로 별칭(@/*)을 정의한다. | 코드 구현됨 |
| `./tsconfig.tsbuildinfo` | TypeScript 증분 빌드 캐시를 저장한다. | 코드 구현됨 |
| `./types/database.ts` | DB 스키마 기반 타입을 정의한다. | 코드 없음(파일 구조만 생성) |
| `./types/env.d.ts` | 환경변수 타입 보강 선언을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./types/global.d.ts` | 전역 타입/전역 네임스페이스 선언을 제공한다. | 코드 없음(파일 구조만 생성) |
| `./types/supabase.ts` | Supabase 응답/테이블 타입 별칭을 정의한다. | 코드 없음(파일 구조만 생성) |

## 현재 구조 요약
- 실구현 로직은 현재 `features/visualizer`에 가장 밀집되어 있음
- 나머지 feature/core/lib 다수 파일은 책임 정의 후 구현을 기다리는 상태
- 이 문서는 구현 우선순위를 정할 때 체크리스트로 활용 가능
