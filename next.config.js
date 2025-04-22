/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  i18n: {
    locales: ['en'],      
    defaultLocale: 'en',
  },
  images: {
    domains: ['unsplash.com', 'images.unsplash.com', 'pcmnkcdjwqvntgxdwzzc.supabase.co'], 
  },
};

export default config;
