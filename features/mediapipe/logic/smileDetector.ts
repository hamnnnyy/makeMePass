import type { Classifications } from '@mediapipe/tasks-vision';

// blendshape 인덱스는 모델에 따라 다르므로 이름으로 찾음
export function computeSmileScore(blendshapes: Classifications[]): number {
  if (!blendshapes.length) return 0;

  const cats = blendshapes[0].categories;
  const find = (name: string) =>
    cats.find((c) => c.categoryName === name)?.score ?? 0;

  const smileL = find('mouthSmileLeft');
  const smileR = find('mouthSmileRight');
  return Math.min(1, (smileL + smileR) / 2 * 2); // 0-1로 정규화
}
