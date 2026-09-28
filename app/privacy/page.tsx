import { PageHeader } from '@/components/layout/PageHeader';

export const metadata = { title: '개인정보처리방침 | 합사카' };

const CONTACT = 'haminni.dev@gmail.com';
const EFFECTIVE = '2026.09.28';

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. 수집하는 정보',
    body: (
      <ul className="list-disc pl-4 flex flex-col gap-1">
        <li>회원가입: 이름, 이메일, 비밀번호(암호화 저장)</li>
        <li>면접 연습: 답변 음성 녹음, 녹취 텍스트, 텍스트로 입력한 답변, 점수와 피드백</li>
        <li>자기소개서(선택): 업로드한 PDF의 문항별 요약. 원본 파일은 저장하지 않습니다.</li>
        <li>비언어 지표: 시선·표정·자세를 수치로 요약한 값. 카메라 영상은 기기(브라우저) 안에서만 분석하며 서버로 보내거나 저장하지 않습니다.</li>
      </ul>
    ),
  },
  {
    title: '2. 이용 목적',
    body: '면접 답변 평가와 피드백 제공, 복기 화면의 녹음 재생, 레벨·도감 등 기록 관리에만 사용합니다. 광고나 마케팅에 쓰지 않습니다.',
  },
  {
    title: '3. 처리 위탁 및 국외 이전',
    body: (
      <ul className="list-disc pl-4 flex flex-col gap-1">
        <li>Google (Gemini API): 답변 음성·텍스트, 자기소개서 PDF를 평가·요약하기 위해 전송</li>
        <li>Google Cloud Text-to-Speech: 면접관 음성 생성 (개인정보 전송 없음)</li>
        <li>Supabase: 계정·기록·녹음 파일 저장</li>
        <li>Vercel: 서비스 호스팅</li>
      </ul>
    ),
  },
  {
    title: '4. 보관 및 파기',
    body: '회원 탈퇴 전까지 보관하며, 설정 > 회원 탈퇴 시 녹음 파일을 포함한 모든 기록을 즉시 삭제합니다.',
  },
  {
    title: '5. 이용자의 권리',
    body: '언제든지 자신의 기록을 열람하고 설정에서 이름·비밀번호를 수정하거나 탈퇴할 수 있습니다.',
  },
  {
    title: '6. 문의',
    body: `개인정보 관련 문의: ${CONTACT}`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-night text-white">
      <PageHeader title="개인정보처리방침" back={{ href: '/', label: '홈' }} />
      <div className="max-w-xl mx-auto flex flex-col gap-6 px-5 py-8">
        <p className="text-xs text-neutral-500">시행일 {EFFECTIVE}</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">{s.title}</h2>
            <div className="text-sm text-neutral-400 leading-relaxed">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
