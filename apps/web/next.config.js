/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [new URL("https://ipfs.io/ipfs/*")],
  },
};

export default nextConfig;
