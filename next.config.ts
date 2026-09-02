import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async redirects() {
    // Keep the Spanish homepage stable regardless of cookies or browser language.
    // Next preserves editor query parameters when following this redirect.
    return [{ source: "/", destination: "/es", permanent: true }];
  },
};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
