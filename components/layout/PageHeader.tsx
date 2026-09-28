import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface Props {
  title: string;
  back?: { href: string; label: string } | { onClick: () => void; label: string };
  right?: ReactNode;
}

const backClass = 'inline-flex items-center gap-1 rounded-full pl-1.5 pr-3 py-1.5 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors';

// 모든 하위 화면의 상단 바: 왼쪽 돌아가기 · 가운데 화면 이름 · 오른쪽 보조 동작
export function PageHeader({ title, back, right }: Props) {
  return (
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8 h-16 bg-night/85 backdrop-blur border-b border-neutral-800/60">
      <div>
        {back && ('href' in back
          ? <Link href={back.href} className={backClass}><ChevronLeft className="size-4" aria-hidden />{back.label}</Link>
          : <button onClick={back.onClick} className={backClass}><ChevronLeft className="size-4" aria-hidden />{back.label}</button>)}
      </div>
      <h1 className="text-xl">{title}</h1>
      <div className="flex justify-end">{right}</div>
    </header>
  );
}
