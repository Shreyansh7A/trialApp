/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['play-lh.googleusercontent.com', 'lh3.googleusercontent.com'], // Allow Google Play Store image domains
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Proxy API requests to FastAPI backend
      },
    ];
  },
};

module.exports = nextConfig;