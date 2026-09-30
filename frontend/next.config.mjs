/** @type {import('next').NextConfig} */
const nextConfig = {
  // Trigger.dev SDK contains server-only code — keep it out of the browser bundle.
  experimental: {
    serverComponentsExternalPackages: ["@trigger.dev/sdk"],
  },
};

export default nextConfig;
