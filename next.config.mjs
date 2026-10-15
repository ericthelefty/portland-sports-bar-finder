/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // PostHog analytics are sent through this site (/ingest) so ad blockers don't drop them.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const region = process.env.NEXT_PUBLIC_POSTHOG_REGION === 'eu' ? 'eu' : 'us';
    return [
      { source: '/ingest/static/:path*', destination: `https://${region}-assets.i.posthog.com/static/:path*` },
      { source: '/ingest/:path*', destination: `https://${region}.i.posthog.com/:path*` },
    ];
  },
  // Links shared before the site moved to city paths (/pdx) keep working.
  async redirects() {
    return [
      { source: '/bars/:id', destination: '/pdx/bars/:id', permanent: true },
      { source: '/report', destination: '/pdx/report', permanent: true },
      { source: '/report/thanks', destination: '/pdx/report/thanks', permanent: true },
    ];
  },
};

export default nextConfig;
