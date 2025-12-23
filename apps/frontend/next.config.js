/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore backend-only dependencies that shouldn't be bundled in frontend
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'class-transformer': false,
        '@nestjs/common': false,
        '@nestjs/mapped-types': false,
      };
    }
    
    // Ignore these packages during bundling
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'class-transformer': 'commonjs class-transformer',
        '@nestjs/common': 'commonjs @nestjs/common',
        '@nestjs/mapped-types': 'commonjs @nestjs/mapped-types',
      });
    }
    
    return config;
  },
};

export default nextConfig;
