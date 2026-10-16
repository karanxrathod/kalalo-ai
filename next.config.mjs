/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": [
        "./node_modules/@ffmpeg-installer/**/*",
        "./node_modules/@ffprobe-installer/**/*",
      ],
    },
    serverComponentsExternalPackages: [
      "@ffmpeg-installer/ffmpeg",
      "@ffprobe-installer/ffprobe",
      "@modelcontextprotocol/sdk",
    ],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;

