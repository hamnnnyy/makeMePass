// 실행: bun features/gamification/logic/level.check.ts
import assert from 'node:assert/strict';
import { levelInfo, sessionXp, rankName } from './level';

assert.equal(levelInfo(0).level, 1);
assert.equal(levelInfo(99).level, 1);
assert.equal(levelInfo(100).level, 2);
assert.equal(levelInfo(299).level, 2);
assert.equal(levelInfo(300).level, 3);
assert.deepEqual(levelInfo(150), { level: 2, xp: 150, into: 50, need: 200, progress: 0.25 });
assert.equal(sessionXp(5, true, true), 180);
assert.equal(sessionXp(3, true, false), 60);
assert.equal(rankName(1), '지원자');
assert.equal(rankName(99), '면접관의 면접관');
console.log('level ok');
