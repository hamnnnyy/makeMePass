import Navbar from '@/components/layout/Navbar';
import { InterviewerCard } from '@/features/interviewer/components/InterviewerCard';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main>
      <section className="h-screen relative">
        <Navbar />
        <InterviewerCard />
        <Link href="/session/123123" className='absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 text-sm tracking-[0.25em] text-white/50 border border-white/15 rounded-full hover:text-white/80 hover:border-white/35 transition-all duration-300'>
          
          세션 시작하기
        </Link>
      </section>
    </main>
  );
}