// 회원가입·비밀번호 변경 공통 규칙
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return '특수문자를 포함해야 합니다.';
  return null;
}
