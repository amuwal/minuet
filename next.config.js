/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["fluent-ffmpeg", "ffmpeg-static"],
    outputFileTracingIncludes: {
      "/api/process": ["./node_modules/ffmpeg-static/ffmpeg"],
      "/api/transcribe": ["./node_modules/ffmpeg-static/ffmpeg"],
    },
  },
};

module.exports = nextConfig;
