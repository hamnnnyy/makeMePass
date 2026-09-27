'use server';

import { synthesizeSpeech } from '@/lib/google-tts/client';
import { TTS_VOICES } from '@/lib/google-tts/voices';
import type { InterviewerRole } from '@/lib/constants/roles';

export async function ttsSpeak(text: string, role: InterviewerRole): Promise<string> {
  return synthesizeSpeech(text, TTS_VOICES[role]);
}
