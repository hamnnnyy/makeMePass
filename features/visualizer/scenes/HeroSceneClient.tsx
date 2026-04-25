'use client';

import dynamic from 'next/dynamic';

const HeroScene = dynamic(
  () => import('./HeroScene').then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => <div className="h-screen bg-[#000000]" />,
  }
);

export { HeroScene as HeroSceneClient };
