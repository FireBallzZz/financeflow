/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dexie/IndexedDB code must never run during server-side rendering or the
  // Vercel build step — every file that touches it is a client component
  // ("use client"), which keeps it out of the server bundle entirely.
};

export default nextConfig;
