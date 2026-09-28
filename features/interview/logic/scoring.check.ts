// 실행: bun features/interview/logic/scoring.check.ts
import assert from 'node:assert/strict';
import { analyzeSamples } from './audio';
import { scoreNonVerbal, scoreTiming, finalDeltas, applyDeltas, judge } from './scoring';

// 오디오: 1초 침묵 + 2초 발화 + 5초 침묵 + 1초 발화
const rate = 16000;
const seg = (sec: number, amp: number) => Float32Array.from({ length: sec * rate }, (_, i) => amp * Math.sin(i / 5));
const audio = new Float32Array([...seg(1, 0.001), ...seg(2, 0.3), ...seg(5, 0.001), ...seg(1, 0.3)]);
const a = analyzeSamples(audio, rate);
assert.ok(Math.abs(a.leadingSilenceSec - 1) < 0.1, `leading ${a.leadingSilenceSec}`);
assert.ok(Math.abs(a.longestPauseSec - 5) < 0.1, `pause ${a.longestPauseSec}`);
assert.ok(Math.abs(a.speechSpanSec - 8) < 0.1, `span ${a.speechSpanSec}`);
assert.equal(analyzeSamples(seg(2, 0), rate).speechSpanSec, 0);

// 시간: 이상 구간이면 만점, 침묵만 있으면 0, 너무 짧으면 비례 감점
const ok = { durationSec: 60, leadingSilenceSec: 1, speechSpanSec: 60, longestPauseSec: 1 };
assert.equal(scoreTiming(ok, 'main'), 100);
assert.equal(scoreTiming({ ...ok, speechSpanSec: 0 }, 'main'), 0);
assert.equal(scoreTiming({ ...ok, speechSpanSec: 15 }, 'main'), 50);
assert.equal(scoreTiming({ ...ok, leadingSilenceSec: 7 }, 'main'), 80);

// 비언어: 정면 응시 + 미소 자주 = 높음, 무표정 = 기본점, 찌푸리고 굳으면 감점, 얼굴 없음 = 0
const face = { presence: 1, gazeOnRatio: 0.9, smileAvg: 0.2, smileRatio: 0.2, frownAvg: 0.05, tensionAvg: 0.1, stabilityAvg: 0.95, blinkPerMin: 18 };
const good = scoreNonVerbal(face);
assert.deepEqual(good, { eyeContact: 90, expression: 100, posture: 95 });
const neutral = scoreNonVerbal({ ...face, smileAvg: 0, smileRatio: 0 }).expression;
const tense = scoreNonVerbal({ ...face, smileAvg: 0, smileRatio: 0, frownAvg: 0.4, tensionAvg: 0.4 }).expression;
assert.equal(neutral, 70);
assert.equal(tense, 35);
const away = scoreNonVerbal({ presence: 0, gazeOnRatio: 0, smileAvg: 0, smileRatio: 0, frownAvg: 0, tensionAvg: 0, stabilityAvg: 0, blinkPerMin: 0 });
assert.deepEqual(away, { eyeContact: 0, expression: 0, posture: 0 });

// 호감도: 태도 나쁘면 기술 면접관보다 인사/임원이 더 깎인다
const d = finalDeltas({ hr: 0, tech: 0, exec: 0 }, away, 0);
assert.ok(d.hr < d.tech && d.exec === d.hr, JSON.stringify(d));
// 텍스트 답변: 시선·시간 없이 표정·자세만 반영
const t1 = finalDeltas({ hr: 2, tech: 2, exec: 2 }, { eyeContact: null, expression: 100, posture: 100 }, null);
assert.deepEqual(t1, { hr: 6, tech: 4, exec: 6 });
assert.deepEqual(applyDeltas({ hr: 95, tech: 3, exec: 50 }, { hr: 10, tech: -10, exec: 0 }), { hr: 100, tech: 0, exec: 50 });

// 판정
const t = { pass_threshold: 60, eliminate_threshold: 25 };
assert.deepEqual(judge({ hr: 70, tech: 65, exec: 61 }, t), { result: 'pass', lowRole: null });
assert.deepEqual(judge({ hr: 70, tech: 55, exec: 61 }, t), { result: 'fail_veto', lowRole: 'tech' });
assert.deepEqual(judge({ hr: 20, tech: 30, exec: 61 }, t), { result: 'fail_eliminate', lowRole: 'hr' });

console.log('scoring ok');
