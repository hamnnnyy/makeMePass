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

// 목소리 지표. 말하기 습관(공백·절음)과 목소리(크기·톤·떨림)를 숫자로 본다.
export interface VoiceStats {
  pausesPerMin: number;       // 말하는 도중 0.4초 넘게 끊긴 횟수 (분당) — 단어 사이 공백
  avgPauseSec: number;        // 그 공백의 평균 길이
  shortBurstsPerMin: number;  // 0.3초도 안 되는 짧은 발화 조각 (분당) — 말이 뚝뚝 끊기는 절음
  volumeDb: number;           // 발화 구간 평균 크기 (dBFS, 0 이 최대)
  volumeVarDb: number;        // 크기 변화 폭 (표준편차 dB)
  endDropDb: number;          // 앞부분 대비 마지막 1/4 구간 크기 감소 (말끝 흐림)
  pitchHz: number;            // 평균 음높이 (0 = 측정 불가)
  pitchRangeSt: number;       // 음높이 변화 폭 (반음 표준편차) — 작으면 단조로운 톤
  tremorPct: number;          // 짧은 시간 음높이 흔들림 (%) — 목소리 떨림
}

// ponytail: 판정 기준은 일반 성인 발화 기준 추정치. 실제 녹음이 쌓이면 claude_feedback.voice 로 보정.
export const VOICE_LIMITS = { pausesPerMin: 12, shortBurstsPerMin: 15, quietDb: -35, endDropDb: 6, monotoneSt: 1.5, tremorPct: 3.5 };

const VFRAME = 512;   // 32ms (16kHz)
const VHOP = 400;     // 25ms
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
// 떨림: 끊기지 않고 이어진 발성 구간에서 7칸(175ms) 이동평균과의 차이 비율. 느린 억양은 평균에 흡수되고 빠른 흔들림만 남는다.
function tremor(f0: { i: number; hz: number }[]) {
  const devs: number[] = [];
  let start = 0;
  for (let k = 1; k <= f0.length; k++) {
    if (k < f0.length && f0[k].i === f0[k - 1].i + 1) continue;
    const run = f0.slice(start, k).map((p) => p.hz);
    for (let j = 3; j < run.length - 3; j++) {
      const m = mean(run.slice(j - 3, j + 4));
      devs.push(Math.abs(run[j] - m) / m);
    }
    start = k;
  }
  return devs.length >= 10 ? median(devs) * 100 : 0;
}

export function analyzeVoice(samples: Float32Array, rate: number): VoiceStats {
  const empty: VoiceStats = { pausesPerMin: 0, avgPauseSec: 0, shortBurstsPerMin: 0, volumeDb: -90, volumeVarDb: 0, endDropDb: 0, pitchHz: 0, pitchRangeSt: 0, tremorPct: 0 };
  const hopSec = VHOP / rate;
  const rms: number[] = [];
  for (let i = 0; i + VFRAME <= samples.length; i += VHOP) {
    let sum = 0;
    for (let j = i; j < i + VFRAME; j++) sum += samples[j] * samples[j];
    rms.push(Math.sqrt(sum / VFRAME));
  }
  if (rms.length < 4) return empty;
  const floor = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.1)];
  // 쉬지 않고 말한 녹음은 바닥 잡음이 곧 말소리라서, 임계값이 최대 크기의 1/4 을 넘지 않게 한다
  const threshold = Math.max(0.01, Math.min(floor * 3, Math.max(...rms) / 4));
  const speech = rms.map((v) => v > threshold);
  const first = speech.indexOf(true), last = speech.lastIndexOf(true);
  if (first === -1) return empty;

  // 발화 구간 안의 말·침묵 덩어리. 음절 사이 0.15초 미만 틈은 말의 일부로 본다.
  const runs: { talk: boolean; sec: number }[] = [];
  for (let i = first; i <= last; i++) {
    if (runs.length && runs.at(-1)!.talk === speech[i]) runs.at(-1)!.sec += hopSec;
    else runs.push({ talk: speech[i], sec: hopSec });
  }
  for (let k = runs.length - 2; k > 0; k--) {
    if (!runs[k].talk && runs[k].sec < 0.15) {
      runs[k - 1].sec += runs[k].sec + runs[k + 1].sec;
      runs.splice(k, 2);
    }
  }
  const minutes = Math.max((last - first + 1) * hopSec, 1) / 60;
  const pauses = runs.filter((r) => !r.talk && r.sec >= 0.4).map((r) => r.sec);
  const bursts = runs.filter((r) => r.talk && r.sec < 0.3).length;

  // 크기 (dBFS)
  const talkIdx = speech.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
  const db = talkIdx.map((i) => 20 * Math.log10(Math.max(rms[i], 1e-5)));
  const cut = Math.floor(db.length * 0.75);
  const endDrop = db.length >= 8 ? mean(db.slice(0, cut)) - mean(db.slice(cut)) : 0;

  // 음높이: 정규화 자기상관으로 75~400Hz 에서 가장 닮은 주기를 찾는다.
  // 속도를 위해 절반 샘플링(8kHz)으로 계산한다 (2분 답변 1초 안팎).
  const half = new Float32Array(samples.length >> 1);
  for (let i = 0; i < half.length; i++) half[i] = (samples[2 * i] + samples[2 * i + 1]) / 2;
  const hr = rate / 2, frame = VFRAME >> 1, hop = VHOP >> 1;
  const f0: { i: number; hz: number }[] = [];
  const minLag = Math.floor(hr / 400), maxLag = Math.ceil(hr / 75);
  for (const i of talkIdx) {
    const start = i * hop;
    if (start + frame + maxLag > half.length) break;
    let energy = 0;
    for (let j = 0; j < frame; j++) energy += half[start + j] ** 2;
    const corr: number[] = [];
    // 비교 구간 에너지는 한 칸씩 밀면서 빼고 더한다
    let e2 = 0;
    for (let j = 0; j < frame; j++) e2 += half[start + minLag + j] ** 2;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0;
      for (let j = 0; j < frame; j++) c += half[start + j] * half[start + j + lag];
      corr.push(c / Math.sqrt(energy * e2 || 1));
      e2 += half[start + lag + frame] ** 2 - half[start + lag] ** 2;
    }
    // 주기의 배수(한 옥타브 아래)도 똑같이 닮으므로, 최댓값의 90% 를 넘는 첫 봉우리를 주기로 본다
    const best = Math.max(...corr);
    const k = corr.findIndex((r, j) => r >= best * 0.9 && r >= (corr[j - 1] ?? -1) && r >= (corr[j + 1] ?? -1));
    if (best > 0.6 && k > 0 && k < corr.length - 1) {
      // 정수 주기만 쓰면 높은 목소리에서 3~4% 씩 계단이 생겨 떨림처럼 보인다 → 봉우리를 포물선으로 보간
      const [a, b, c] = [corr[k - 1], corr[k], corr[k + 1]];
      const d = a - 2 * b + c ? (0.5 * (a - c)) / (a - 2 * b + c) : 0;
      f0.push({ i, hz: hr / (minLag + k + d) });
    }
  }
  const pitchHz = median(f0.map((p) => p.hz));
  const st = f0.map((p) => 12 * Math.log2(p.hz / (pitchHz || 1)));
  const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

  return {
    pausesPerMin: round(pauses.length / minutes),
    avgPauseSec: round(mean(pauses), 2),
    shortBurstsPerMin: round(bursts / minutes),
    volumeDb: round(mean(db)),
    volumeVarDb: round(std(db)),
    endDropDb: round(endDrop),
    pitchHz: f0.length >= 10 ? Math.round(pitchHz) : 0,
    pitchRangeSt: f0.length >= 10 ? round(std(st)) : 0,
    tremorPct: round(tremor(f0)),
  };
}

// 사람이 읽는 목소리 진단 (복기·평가 프롬프트용)
export function voiceNotes(v: VoiceStats): string[] {
  const L = VOICE_LIMITS;
  return [
    v.pausesPerMin > L.pausesPerMin && `말 사이 공백이 잦음 (분당 ${v.pausesPerMin}회)`,
    v.shortBurstsPerMin > L.shortBurstsPerMin && `말이 뚝뚝 끊김 (짧은 조각 분당 ${v.shortBurstsPerMin}개)`,
    v.volumeDb < L.quietDb && `목소리가 작음 (${v.volumeDb}dB)`,
    v.endDropDb > L.endDropDb && `말끝이 흐려짐 (${v.endDropDb}dB 작아짐)`,
    v.pitchHz > 0 && v.pitchRangeSt < L.monotoneSt && `톤이 단조로움 (변화 ${v.pitchRangeSt}반음)`,
    v.pitchHz > 0 && v.tremorPct > L.tremorPct && `목소리가 떨림 (${v.tremorPct}%)`,
  ].filter((x): x is string => !!x);
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
