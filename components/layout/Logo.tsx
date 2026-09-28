import Link from 'next/link';

// 로고 마크: 말풍선(면접) 안의 하트(호감도)
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7ba9" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M16 3C8.8 3 3 8 3 14.3c0 3.6 1.9 6.8 4.9 8.9L6.6 29l6.3-3.6c1 .2 2 .3 3.1.3 7.2 0 13-5 13-11.4S23.2 3 16 3Z" fill="url(#logo-g)" />
      <path d="M16 20.5s-5.5-3.3-5.5-7a3 3 0 0 1 5.5-1.7 3 3 0 0 1 5.5 1.7c0 3.7-5.5 7-5.5 7Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-pink-400" aria-label="합사카 홈">
      <LogoMark size={size} />
      <span className="font-display text-2xl leading-none">합사카</span>
    </Link>
  );
}
