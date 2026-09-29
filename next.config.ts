import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
  transpilePackages: ['three'],
  // 그림 교체 시 캐시를 깨려고 ?v= 를 붙인다 (Next 16 부터 쿼리 허용을 명시해야 함). search 를 비워 두면 모든 쿼리 허용.
  images: { localPatterns: [{ pathname: '/**' }] },
  // 답변 WAV(최대 2분 약 4MB)와 자소서 PDF(최대 5MB)를 Server Action으로 받는다
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
};

export default nextConfig;