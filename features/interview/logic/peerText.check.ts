// 실행: bun features/interview/logic/peerText.check.ts
import assert from 'node:assert/strict';
import { stripBlind, stripNames } from './peerText';

assert.equal(stripNames('안녕하십니까, 지원자 강민준입니다. 저는 금융 자격증이 있습니다.'), '안녕하십니까. 저는 금융 자격증이 있습니다.');
assert.equal(stripNames('저는 윤서아라고 합니다. 반갑습니다.'), '반갑습니다.');
assert.equal(stripNames('서아 씨 의견도 좋지만 예산이 부족합니다.'), '앞 지원자님 의견도 좋지만 예산이 부족합니다.');
assert.equal(stripNames('강민준 지원자님 말씀에 동의합니다.'), '앞 지원자님 말씀에 동의합니다.');
assert.equal(stripNames('이름 없는 평범한 발언입니다.'), '이름 없는 평범한 발언입니다.');
assert.equal(stripBlind('저는 서울대학교에서 통계를 공부했습니다. 데이터 분석을 좋아합니다.'), '데이터 분석을 좋아합니다.');
assert.equal(stripBlind('부모님이 공무원이셔서 공공기관에 관심이 생겼습니다. 저는 봉사를 오래 했습니다.'), '저는 봉사를 오래 했습니다.');
assert.equal(stripBlind('저는 부산에서 태어나 자랐습니다! 현장 경험이 많습니다.'), '현장 경험이 많습니다.');
assert.equal(stripBlind('대학 시절 프로젝트에서 고장률을 20% 줄였습니다.'), '대학 시절 프로젝트에서 고장률을 20% 줄였습니다.');
console.log('peerText ok');
