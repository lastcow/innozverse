/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@innozverse/api-client', '@innozverse/shared'],
  reactStrictMode: true,
  poweredByHeader: false
};

module.exports = nextConfig;
