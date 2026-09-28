'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type OrgOption = { code: string; name_ko: string; category: string | null; description: string | null };

// public/orgs/{code}.{확장자} 로고. 없으면 글자 타일로 보여준다.
// 새 로고는 위키미디어 공용·기관 공식 홈페이지에서 받았다 (2026-09). KORAIL 은 워드마크 부분만 잘라 쓴다.
const LOGOS: Record<string, string> = {
  BOK: 'png', HF: 'png', HIRA: 'png', HUG: 'png', KAMCO: 'png', KEPCO: 'png', LH: 'png',
  KDB: 'png', IBK: 'gif', KIBO: 'svg', KIC: 'png', KSURE: 'jpg', KOGAS: 'svg', KEA: 'svg', KDN: 'png',
  EX: 'svg', KR: 'png', KAC: 'svg', BPA: 'svg', KWATER: 'png', NHIS: 'png', HRDK: 'svg', KTO: 'svg',
  KOTRA: 'jpg', KOMSCO: 'svg',
  KODIT: 'png', KDIC: 'png', KEXIM: 'png', KOEN: 'png', KOSPO: 'png', EWP: 'png', KOWEPO: 'png', KNOC: 'png',
  KHNP: 'png', KPX: 'png', KOMIPO: 'png', SEOULMETRO: 'png', IIAC: 'png', REB: 'png', KORAIL: 'png', KEIS: 'png',
  KRC: 'png', KECO: 'png', KISA: 'png', NIA: 'png', KINFA: 'png', NPS: 'png', COMWEL: 'png',
};
// 흔히 부르는 줄임말로도 찾게 한다
const ALIASES: Record<string, string> = {
  KAMCO: '캠코', KEPCO: '한전', KHNP: '한수원', KOGAS: '가스공사', KORAIL: '코레일', IIAC: '인국공 인천공항',
  KAC: '공항공사', KWATER: '수공 케이워터', EX: '도공', NHIS: '건보 건강보험', NPS: '국민연금', HIRA: '심평원',
  KDB: '산은 산업은행', IBK: '기업은행', KEXIM: '수은 수출입은행', KODIT: '신보', KIBO: '기보', KDIC: '예보',
  KSURE: '무보', HRDK: '산인공', KOTRA: '코트라', SEOULMETRO: '서교공 지하철', LH: '토지주택', HUG: '허그', HF: '주금공',
};
const CATEGORY_ORDER = ['금융', '에너지', 'SOC·교통', '보건·복지', '고용·교육', '농림·환경', '산업·무역'];
const rank = (c: string) => { const i = CATEGORY_ORDER.indexOf(c); return i < 0 ? 99 : i; };

// 로고 대신 쓰는 글자 타일: 널리 쓰는 약칭, 없으면 '한국' 을 떼고 앞 네 글자
const SHORT: Record<string, string> = {
  KHNP: '한수원', KEXIM: '수은', KDN: 'KDN', IIAC: '인천공항', KEA: '에너지공단', KWATER: 'K-water',
  KPX: '전력거래소', KIC: 'KIC', KINFA: '서민금융', NHIS: '건보공단', NPS: '국민연금', KOTRA: 'KOTRA',
};
const shortName = (code: string, name: string) => SHORT[code] ?? name.replace(/^한국|^국가|^국민/, '').slice(0, 4);

export function OrgPicker({ value, onChange }: { value: string | null; onChange: (org: OrgOption) => void }) {
  const [orgs, setOrgs] = useState<OrgOption[] | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from('organizations')
      .select('code, name_ko, category, description')
      .eq('is_active', true)
      .order('name_ko')
      .then(({ data }) => setOrgs(data ?? []));
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s/g, '');
    const hit = (o: OrgOption) =>
      !q || [o.name_ko, o.code, o.category ?? '', o.description ?? '', ALIASES[o.code] ?? '']
        .some((s) => s.toLowerCase().replace(/\s/g, '').includes(q));
    const list = (orgs ?? []).filter((o) => (!category || o.category === category) && hit(o));
    const cats = [...new Set(list.map((o) => o.category ?? '기타'))]
      .sort((a, b) => rank(a) - rank(b));
    return cats.map((c) => ({ label: c, orgs: list.filter((o) => (o.category ?? '기타') === c) }));
  }, [orgs, query, category]);

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c) => orgs?.some((o) => o.category === c)),
    [orgs],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="relative">
          <span className="sr-only">기관 검색</span>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-500" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기관 이름이나 줄임말로 검색 (예: 한전, 코레일, 신보)"
            className="w-full rounded-full bg-neutral-800 border border-neutral-700 focus:border-pink-500 outline-none pl-11 pr-4 py-3 text-sm placeholder:text-neutral-500"
          />
        </label>
        <div className="flex gap-2 flex-wrap">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? 'all'}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                category === c ? 'bg-pink-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {c ?? '전체'}
            </button>
          ))}
        </div>
      </div>

      {orgs === null && <p className="text-sm text-neutral-500">기관 목록을 불러오는 중…</p>}
      {orgs !== null && groups.length === 0 && (
        <p className="text-sm text-neutral-400">
          &lsquo;{query}&rsquo;에 맞는 기관이 없습니다. 기관 이름 일부나 줄임말로 다시 검색해 보세요.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-4">
            <span className="text-sm text-neutral-300">{group.label}</span>
            <span className="text-xs text-neutral-500">{group.orgs.length} 기관</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {group.orgs.map((org) => (
              <button
                key={org.code}
                onClick={() => onChange(org)}
                aria-pressed={value === org.code}
                title={org.description ?? undefined}
                className={`aspect-[4/3] flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-800/80 px-2 transition-all ${
                  value === org.code ? 'ring-2 ring-pink-500 bg-pink-500/10' : 'hover:bg-neutral-700/80'
                }`}
              >
                {LOGOS[org.code] ? (
                  // 남색·검정 글자 로고가 어두운 배경에 묻히지 않게 흰 칩 위에 둔다
                  <span className="h-[72px] w-full max-w-36 rounded-xl bg-white flex items-center justify-center px-3">
                    <Image src={`/orgs/${org.code}.${LOGOS[org.code]}`} alt="" width={120} height={56} unoptimized className="max-h-12 w-auto object-contain" />
                  </span>
                ) : (
                  <span className="h-[72px] flex items-center font-display text-2xl text-neutral-200">{shortName(org.code, org.name_ko)}</span>
                )}
                <span className="text-xs text-neutral-300 text-center">{org.name_ko}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
