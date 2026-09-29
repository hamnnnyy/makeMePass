// 실행: bun features/stats/logic/aggregate.check.ts
import assert from 'node:assert/strict';
import { aggregate } from './aggregate';

const s = (id: string, result: string, started_at: string) => ({ id, user_id: 'u', result, interview_type: 'general' as const, started_at, org: '한국전력공사' });
const q = (session_id: string, content: number, eye: number | null) => ({
  session_id, score_content: content, score_fluency: null, score_eye_contact: eye, score_expression: 60, score_timing: 80, org_fit: 70,
});
const r = aggregate(
  [s('a', 'pass', '2026-09-01'), s('b', 'fail_eliminate', '2026-09-02')],
  [q('a', 80, 10), q('a', 60, 20), q('b', 40, 30), q('x', 0, 0)],  // x: 목록에 없는 면접 → 제외
);
assert.equal(r.total, 2);
assert.equal(r.passRate, 50);
assert.equal(r.answered, 3);
assert.equal(r.areas.find((a) => a.key === 'score_content')!.avg, 60);
assert.equal(r.areas.find((a) => a.key === 'score_fluency')!.avg, null);
assert.equal(r.weakest!.key, 'score_eye_contact');
assert.deepEqual(r.trend.map((t) => t.avg), [70, 40]);
assert.deepEqual(r.byOrg, [{ key: '한국전력공사', count: 2, passes: 1 }]);
console.log('aggregate ok');
