/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/premium',
        destination: 'https://pixcord.shop/1112429999157428446?p=NemTinder%20Premium',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
