import Navbar from '@/components/layout/Navbar';
import { InterviewerCard } from '@/features/interviewer/components/InterviewerCard';


export default function LandingPage() {
  return (
    <main>
      <section className="h-screen relative">
        <Navbar />
        <InterviewerCard />
      </section>
    </main>
  );
}