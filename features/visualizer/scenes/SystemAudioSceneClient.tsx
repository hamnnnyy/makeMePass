'use client';

import dynamic from 'next/dynamic';

const SystemAudioScene = dynamic(
  () => import('./SystemAudioScene').then((m) => m.SystemAudioScene),
  {
    ssr: false,
    loading: () => <div className="h-screen bg-[#04040a]" />,
  }
);

export { SystemAudioScene as SystemAudioSceneClient };
