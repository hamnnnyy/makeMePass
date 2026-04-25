'use client';

import dynamic from 'next/dynamic';

const InterviewerScene = dynamic(
  () => import('./InterviewerScene').then((m) => m.InterviewerScene),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#050508]" />,
  }
);

export { InterviewerScene as InterviewerSceneClient };
