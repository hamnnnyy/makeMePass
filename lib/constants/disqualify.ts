// 실격 규정. 위반하면 호감도와 관계없이 그 자리에서 면접이 끝난다.
export const VIOLATIONS = {
  blind: {
    label: '블라인드 위반',
    rule: '본인 이름, 출신 학교 이름, 가족 관계·부모 직업, 출신 지역·거주지, 나이·생년, 신체 조건(키·몸무게 등)을 말하는 것',
  },
  conduct: {
    label: '부적절한 발언',
    rule: '욕설·비속어, 특정 집단 비하·차별 발언, 면접관 모욕',
  },
} as const;
export type ViolationType = keyof typeof VIOLATIONS;

export const DISQUALIFY_LINE_EN: Record<ViolationType, string> = {
  blind: 'You mentioned personal information, which is not allowed in a blind interview. We will end the interview here.',
  conduct: 'That remark was not appropriate for an interview. We will end the interview here.',
};

export const DISQUALIFY_LINE: Record<ViolationType, string> = {
  blind: '블라인드 면접에서 인적사항을 말씀하셨습니다. 규정에 따라 여기서 면접을 마치겠습니다.',
  conduct: '면접에 적절하지 않은 발언이 있었습니다. 여기서 면접을 마치겠습니다.',
};

// 면접 시작 전에 보여주는 안내
export const BLIND_NOTICE = '블라인드 면접입니다. 이름·출신 학교·가족·출신 지역·나이를 말하면 실격입니다. 욕설·비하 발언도 실격입니다.';
