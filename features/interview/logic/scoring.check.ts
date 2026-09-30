// 실행: bun features/interview/logic/scoring.check.ts
import assert from 'node:assert/strict';
import { analyzeSamples, analyzeVoice, voiceNotes, VOICE_LIMITS } from './audio';
import { scoreNonVerbal, scoreTiming, finalDeltas, applyDeltas, judge, onlyRoles, withOrgFit } from './scoring';

// 오디오: 1초 침묵 + 2초 발화 + 5초 침묵 + 1초 발화
const rate = 16000;
const seg = (sec: number, amp: number) => Float32Array.from({ length: sec * rate }, (_, i) => amp * Math.sin(i / 5));
const audio = new Float32Array([...seg(1, 0.001), ...seg(2, 0.3), ...seg(5, 0.001), ...seg(1, 0.3)]);
const a = analyzeSamples(audio, rate);
assert.ok(Math.abs(a.leadingSilenceSec - 1) < 0.1, `leading ${a.leadingSilenceSec}`);
assert.ok(Math.abs(a.longestPauseSec - 5) < 0.1, `pause ${a.longestPauseSec}`);
assert.ok(Math.abs(a.speechSpanSec - 8) < 0.1, `span ${a.speechSpanSec}`);
assert.equal(analyzeSamples(seg(2, 0), rate).speechSpanSec, 0);

// 목소리: 150Hz 톤 (반음 흔들림 없음), 0.6초 말 / 0.6초 쉼 반복, 마지막 1/4은 작게
const tone = (sec: number, amp: number, hz = 150) => Float32Array.from({ length: sec * rate }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));
const pattern: number[] = [];
for (let k = 0; k < 12; k++) pattern.push(...tone(0.6, k < 9 ? 0.3 : 0.05), ...seg(0.6, 0));
const v = analyzeVoice(Float32Array.from(pattern), rate);
assert.ok(Math.abs(v.pitchHz - 150) <= 3, `pitch ${v.pitchHz}`);
assert.ok(v.pitchRangeSt < 0.5 && v.tremorPct < 1, `steady tone ${v.pitchRangeSt} ${v.tremorPct}`);
assert.ok(v.pausesPerMin > 40, `pauses ${v.pausesPerMin}`);
assert.ok(v.endDropDb > 10, `end drop ${v.endDropDb}`);
assert.ok(voiceNotes(v).some((n) => n.includes('공백')) && voiceNotes(v).some((n) => n.includes('단조')));
// 떨림: 150Hz 를 초당 6번 ±6% 로 흔든다 (위상은 이어지게)
let phase = 0;
const shaky = Float32Array.from({ length: 3 * rate }, (_, i) => { phase += (2 * Math.PI * 150 * (1 + 0.06 * Math.sin((2 * Math.PI * 6 * i) / rate))) / rate; return 0.3 * Math.sin(phase); });
assert.ok(analyzeVoice(shaky, rate).tremorPct > VOICE_LIMITS.tremorPct, `tremor ${analyzeVoice(shaky, rate).tremorPct}`);

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

// 기관 적합도: 보통(50)이면 그대로, 높으면 임원이 가장 크게 오른다
assert.deepEqual(withOrgFit({ hr: 1, tech: 1, exec: 1 }, 50), { hr: 1, tech: 1, exec: 1 });
assert.deepEqual(withOrgFit({ hr: 0, tech: 0, exec: 0 }, 100), { hr: 1.25, tech: 1.25, exec: 2.5 });
assert.deepEqual(withOrgFit({ hr: 0, tech: 0, exec: 0 }, null), { hr: 0, tech: 0, exec: 0 });

// 판정
const t = { pass_threshold: 60, eliminate_threshold: 25 };
assert.deepEqual(judge({ hr: 70, tech: 65, exec: 61 }, t), { result: 'pass', lowRole: null });
assert.deepEqual(judge({ hr: 70, tech: 55, exec: 61 }, t), { result: 'fail_veto', lowRole: 'tech' });
assert.deepEqual(judge({ hr: 20, tech: 30, exec: 61 }, t), { result: 'fail_eliminate', lowRole: 'hr' });

// 면접관 1명: 그 면접관만 보고 판정, 다른 면접관 변화는 0
assert.deepEqual(judge({ hr: 50, tech: 50, exec: 70 }, t, ['exec']), { result: 'pass', lowRole: null });
assert.deepEqual(judge({ hr: 90, tech: 90, exec: 20 }, t, ['exec']), { result: 'fail_eliminate', lowRole: 'exec' });
assert.deepEqual(onlyRoles({ hr: 3, tech: -2, exec: 5 }, ['tech']), { hr: 0, tech: -2, exec: 0 });

console.log('scoring ok');
