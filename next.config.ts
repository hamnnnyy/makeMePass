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
  // 답변 WAV(최대 2분 약 4MB)와 자소서 PDF(최대 5MB)를 Server Action으로 받는다
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
};

export default nextConfig;