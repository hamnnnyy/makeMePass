export interface FaceMetrics {
  gazeScore: number;     // 0-1  (1 = 카메라 정면 응시)
  smileScore: number;    // 0-1
  stability: number;     // 0-1  (1 = 머리 안 흔들림)
  detected: boolean;     // 얼굴 감지 여부
}
