/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
