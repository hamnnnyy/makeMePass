// features/interviewer/components/InterviewerCard.tsx
import { InterviewerScene } from '@/features/visualizer/scenes/InterviewerScene';
import { createClient } from '@/lib/supabase/server';
import COLOR_PRESETS from '@/lib/constants/color';
import type { Database } from '@/types/supabase';

type InterviewerPersona = Database['public']['Tables']['interviewer_personas']['Row'];

export async function InterviewerCard() {
  const supabase = await createClient();
  const { data: personaHR } = await supabase.from('interviewer_personas').select('*').eq('role','hr').limit(1);
  const { data: personaTech } = await supabase.from('interviewer_personas').select('*').eq('role','tech').limit(1);
  const { data: personaExec } = await supabase.from('interviewer_personas').select('*').eq('role','exec').limit(1);
  const personas: InterviewerPersona[] = [...(personaHR ?? []), ...(personaTech ?? []), ...(personaExec ?? [])];

  function get3UniqueRandoms(): number[] {
    const result: number[] = [];
    while (result.length < 3) {
      const n = Math.floor(Math.random() * 6);
      if (!result.includes(n)) result.push(n);
    }
    return result;
  }

  const colorSelector = get3UniqueRandoms();


  console.log('personaHR', personaHR);
  console.log('personaTech', personaTech);
  console.log('personaExec', personaExec);

  return (
    (personas.map((persona, index) => (
    <div key={index} className="card">
      <div className="h-[240px]">
        <InterviewerScene
        color={COLOR_PRESETS[colorSelector[index]].hex}
        />
      </div>
      <div className="relative bottom-0 left-0 w-full px-4 py-4 gap-2 flex items-center ">
        <div className='flex justify-between items-center'>
          <div className='flex gap-0.5 justify-between'>
            <span className='font-bold'>{persona.role.toUpperCase()}</span>
            <span>|</span>
            <span>{persona.label_ko}</span>
          </div>
          <span className='text-red-500'>{colorSelector[index]}%</span>
        </div>
      </div>
    </div>
    ))))}
