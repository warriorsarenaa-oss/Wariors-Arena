import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', 
            value: 'nosniff' },
          { key: 'Referrer-Policy', 
            value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', 
            value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
