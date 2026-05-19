/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do not leak production source maps to the browser — they make
  // reverse-engineering trivial and bloat the bundle.
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.module.rules.push({
      test: /\.csv$/,
      type: "asset/source",
    });
    return config;
  },
  // Canonicalize traffic onto the custom domain. Anyone who lands on the
  // default `*.pages.dev` URL is permanently redirected to liteforgedex.com
  // so there is one canonical origin for SEO, sessions, and wallet flows.
  // Preview deployment URLs (commit-hash.liteforgedex.pages.dev) are NOT
  // matched and remain reachable for testing.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "liteforgedex.pages.dev" }],
        destination: "https://liteforgedex.com/:path*",
        permanent: true,
      },
    ];
  },
  // Defense-in-depth security headers applied to every response.
  // These complement (not replace) the security guarantees enforced by
  // wagmi/viem at the protocol layer.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Block embedding in iframes — prevents clickjacking on wallet
          // approval flows.
          { key: "X-Frame-Options", value: "DENY" },
          // Disable MIME-sniffing — browsers must trust our Content-Type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Trim the Referer header on cross-origin navigations.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Lock down powerful browser features we never use.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
