export interface AudioStats {
  durationSec: number;
  leadingSilenceSec: number;  // 질문 후 말을 시작하기까지 걸린 시간
  speechSpanSec: number;      // 첫 발화 ~ 마지막 발화
  longestPauseSec: number;    // 발화 중 가장 긴 침묵
}

const FRAME_SEC = 0.05;

export function analyzeSamples(samples: Float32Array, rate: number): AudioStats {
  const frameLen = Math.max(1, Math.round(rate * FRAME_SEC));
  const rms: number[] = [];
  for (let i = 0; i + frameLen <= samples.length; i += frameLen) {
    let sum = 0;
    for (let j = i; j < i + frameLen; j++) sum += samples[j] * samples[j];
    rms.push(Math.sqrt(sum / frameLen));
  }
  const durationSec = samples.length / rate;
  if (rms.length === 0) return { durationSec, leadingSilenceSec: durationSec, speechSpanSec: 0, longestPauseSec: 0 };

  // 마이크마다 잡음 크기가 달라서 하위 10% 에너지를 바닥 잡음으로 보고 임계값을 정한다
  const floor = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.1)];
  const threshold = Math.max(0.01, floor * 3);
  const speech = rms.map((v) => v > threshold);

  const first = speech.indexOf(true);
  if (first === -1) return { durationSec, leadingSilenceSec: durationSec, speechSpanSec: 0, longestPauseSec: 0 };
  const last = speech.lastIndexOf(true);

  let longest = 0, run = 0;
  for (let i = first; i <= last; i++) {
    run = speech[i] ? 0 : run + 1;
    longest = Math.max(longest, run);
  }

  return {
    durationSec,
    leadingSilenceSec: first * FRAME_SEC,
    speechSpanSec: (last - first + 1) * FRAME_SEC,
    longestPauseSec: longest * FRAME_SEC,
  };
}

// 녹음(webm/opus)을 16kHz 모노로 디코드한다. Gemini가 webm을 공식 지원하지 않아 WAV로 보낸다.
export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buf).finally(() => ctx.close());
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  return (await offline.startRendering()).getChannelData(0);
}

export function encodeWav(samples: Float32Array, rate: number): Blob {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return new Blob([view], { type: 'audio/wav' });
}
