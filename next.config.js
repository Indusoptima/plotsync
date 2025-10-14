/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Exclude canvas from server-side bundling (Konva needs it for Node.js but we only use browser)
    if (isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    }
    return config
  },
}

module.exports = nextConfig
