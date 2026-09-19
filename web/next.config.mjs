/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lumora-bmeu.onrender.com" },
    ],
  },
};

export default nextConfig;
